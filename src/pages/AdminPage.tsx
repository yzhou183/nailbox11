import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { basicServices, addonServices } from '../data/services'

const API = import.meta.env.VITE_API_URL ?? ''

type Status = 'pending' | 'confirmed' | 'rejected'

interface Booking {
  id: string
  name: string
  email: string
  wechat: string
  date: string
  time_slot: string
  basic_service_name: string
  basic_service_id: string
  addon_services: Array<{ id: string; name: string }>
  notes: string
  status: Status
  created_at: string
}

const STATUS_LABEL: Record<Status, string> = {
  pending:   '待确认',
  confirmed: '已确认',
  rejected:  '已拒绝',
}
const STATUS_STYLE: Record<Status, string> = {
  pending:   'bg-amber-50 text-amber-600 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected:  'bg-rose-50 text-rose-400 border-rose-200',
}

function authHeaders() {
  return { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}`, 'Content-Type': 'application/json' }
}

// ── Calendar helpers ──────────────────────────────────────────────
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=Sun
}
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

// ── Add Booking Form ──────────────────────────────────────────────
const TIME_SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '5:00 PM']

interface AddForm {
  name: string; email: string; wechat: string
  date: string; timeSlot: string
  basicServiceId: string; addonServiceIds: string[]
  notes: string; status: Status
}
const EMPTY_FORM: AddForm = {
  name: '', email: '', wechat: '', date: '', timeSlot: '',
  basicServiceId: '', addonServiceIds: [], notes: '', status: 'confirmed',
}

// ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()

  // all bookings (fetched once, filtered in UI)
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading]         = useState(true)

  // calendar state
  const now = new Date()
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selDate,  setSelDate]  = useState<string | null>(null) // 'YYYY-MM-DD' or null = all

  // list filter
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')

  // modals
  const [selected,    setSelected]    = useState<Booking | null>(null)
  const [showAdd,     setShowAdd]     = useState(false)
  const [addForm,     setAddForm]     = useState<AddForm>(EMPTY_FORM)
  const [addSaving,   setAddSaving]   = useState(false)
  const [acting,      setActing]      = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/bookings`, { headers: authHeaders() })
      if (res.status === 401) { navigate('/admin/login'); return }
      setAllBookings(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [navigate])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── derived data ────────────────────────────────────────────────
  // Map date → bookings for calendar dots
  const byDate = allBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    ;(acc[b.date] ??= []).push(b)
    return acc
  }, {})

  // filtered list
  const listBookings = allBookings.filter(b => {
    const dateOk   = selDate ? b.date === selDate : true
    const statusOk = statusFilter === 'all' ? true : b.status === statusFilter
    return dateOk && statusOk
  })

  const counts = {
    pending:   allBookings.filter(b => b.status === 'pending').length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    rejected:  allBookings.filter(b => b.status === 'rejected').length,
  }

  // ── actions ─────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: Status) => {
    setActing(true)
    try {
      const res = await fetch(`${API}/api/admin/bookings/${id}/status`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }),
      })
      if (res.status === 401) { navigate('/admin/login'); return }
      await fetchAll()
      setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
    } finally { setActing(false) }
  }

  const deleteBooking = async (id: string) => {
    setActing(true)
    try {
      await fetch(`${API}/api/admin/bookings/${id}`, { method: 'DELETE', headers: authHeaders() })
      setDeleteConfirm(null)
      setSelected(null)
      await fetchAll()
    } finally { setActing(false) }
  }

  const submitAdd = async () => {
    if (!addForm.name || !addForm.email || !addForm.date || !addForm.timeSlot || !addForm.basicServiceId) return
    setAddSaving(true)
    try {
      const res = await fetch(`${API}/api/admin/bookings`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          name: addForm.name, email: addForm.email, wechat: addForm.wechat,
          date: addForm.date, timeSlot: addForm.timeSlot,
          basicServiceId: addForm.basicServiceId,
          addonServiceIds: addForm.addonServiceIds,
          notes: addForm.notes, status: addForm.status,
        }),
      })
      if (res.ok) {
        setShowAdd(false)
        setAddForm(EMPTY_FORM)
        await fetchAll()
      }
    } finally { setAddSaving(false) }
  }

  const logout = () => { localStorage.removeItem('admin_token'); navigate('/admin/login') }

  // ── calendar rendering ──────────────────────────────────────────
  const totalDays   = daysInMonth(calYear, calMonth)
  const startOffset = firstDayOfMonth(calYear, calMonth)
  const todayStr    = now.toISOString().split('T')[0]

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-[#fce8ed] bg-white text-sm text-[#3d1230] placeholder-[#d0a0b0] outline-none focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10 transition-all'

  // ── render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fff8fa]" style={{ colorScheme: 'light' }}>

      {/* Header */}
      <header className="bg-white border-b border-[#fce8ed] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#fce8ed] border border-[#f0a0b8] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#e8789a">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-lg text-[#3d1230] leading-none">Nailbox</h1>
            <p className="text-[10px] text-[#c090a0] tracking-widest uppercase">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setAddForm({ ...EMPTY_FORM, date: selDate ?? '' }); setShowAdd(true) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#e8789a] hover:bg-[#c86080] text-white text-xs rounded-full transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            添加预约
          </button>
          <button onClick={logout} className="text-xs text-[#c090a0] hover:text-[#e8789a] px-3 py-1.5 border border-[#fce8ed] rounded-full transition-colors">
            退出
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {([
            { label: '待确认', key: 'pending'   as Status, color: 'text-amber-500' },
            { label: '已确认', key: 'confirmed' as Status, color: 'text-emerald-500' },
            { label: '已拒绝', key: 'rejected'  as Status, color: 'text-rose-400' },
          ] as const).map(({ label, key, color }) => (
            <div key={key} className="bg-white border border-[#fce8ed] rounded-2xl p-4 text-center shadow-sm">
              <p className={`text-3xl font-light ${color}`}>{counts[key]}</p>
              <p className="text-xs text-[#c090a0] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── Calendar ── */}
          <div className="bg-white border border-[#fce8ed] rounded-2xl p-5 shadow-sm lg:w-80 shrink-0">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 hover:bg-[#fff0f5] rounded-lg transition-colors">
                <svg className="w-4 h-4 text-[#c090a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className="text-sm font-medium text-[#3d1230]">{calYear}年 {MONTH_NAMES[calMonth]}</span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-[#fff0f5] rounded-lg transition-colors">
                <svg className="w-4 h-4 text-[#c090a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-[10px] text-[#c090a0] py-1">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day      = i + 1
                const dateStr  = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayBooks = byDate[dateStr] ?? []
                const isToday  = dateStr === todayStr
                const isSel    = dateStr === selDate
                const hasPend  = dayBooks.some(b => b.status === 'pending')
                const hasConf  = dayBooks.some(b => b.status === 'confirmed')

                return (
                  <button
                    key={day}
                    onClick={() => setSelDate(isSel ? null : dateStr)}
                    className={`flex flex-col items-center py-1 rounded-xl transition-all ${
                      isSel
                        ? 'bg-[#e8789a] text-white'
                        : isToday
                          ? 'bg-[#fff0f5] text-[#e8789a] font-semibold'
                          : 'hover:bg-[#fff5f8] text-[#3d1230]'
                    }`}
                  >
                    <span className="text-xs leading-none">{day}</span>
                    <div className="flex gap-0.5 mt-0.5 h-1.5">
                      {hasPend && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white/80' : 'bg-amber-400'}`} />}
                      {hasConf && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white/80' : 'bg-emerald-400'}`} />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-3 border-t border-[#fce8ed]">
              <div className="flex items-center gap-1.5 text-[10px] text-[#c090a0]">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />待确认
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#c090a0]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />已确认
              </div>
            </div>

            {selDate && (
              <button
                onClick={() => setSelDate(null)}
                className="mt-3 w-full text-xs text-[#c090a0] hover:text-[#e8789a] py-1.5 border border-[#fce8ed] rounded-xl transition-colors"
              >
                显示全部日期
              </button>
            )}
          </div>

          {/* ── Booking list ── */}
          <div className="flex-1 min-w-0">
            {/* List header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[#3d1230] font-medium">
                {selDate ? `${selDate} 的预约` : '全部预约'}
                <span className="text-[#c090a0] font-normal ml-1">({listBookings.length})</span>
              </p>
              {/* Status filter */}
              <div className="flex gap-1 bg-white border border-[#fce8ed] rounded-xl p-1">
                {([
                  { key: 'all' as const,       label: '全部' },
                  { key: 'pending' as const,   label: '待确认' },
                  { key: 'confirmed' as const, label: '已确认' },
                  { key: 'rejected' as const,  label: '已拒绝' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === key ? 'bg-[#e8789a] text-white shadow-sm' : 'text-[#9a4065] hover:bg-[#fff0f5]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-[#c090a0] text-sm">加载中…</div>
            ) : listBookings.length === 0 ? (
              <div className="text-center py-16 text-[#c090a0] text-sm">暂无预约</div>
            ) : (
              <div className="space-y-3">
                {listBookings.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="bg-white border border-[#fce8ed] rounded-2xl p-4 cursor-pointer hover:border-[#e8789a] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-[#3d1230] text-sm">{b.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}>
                            {STATUS_LABEL[b.status]}
                          </span>
                        </div>
                        <p className="text-xs text-[#9a4065]">{b.date} · {b.time_slot}</p>
                        <p className="text-xs text-[#c090a0] mt-0.5 truncate">{b.basic_service_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[#c090a0]">{b.email}</p>
                        {b.wechat && <p className="text-xs text-[#c090a0]">微信: {b.wechat}</p>}
                      </div>
                    </div>
                    {b.status === 'pending' && (
                      <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button
                          disabled={acting}
                          onClick={() => updateStatus(b.id, 'confirmed')}
                          className="flex-1 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50"
                        >确认</button>
                        <button
                          disabled={acting}
                          onClick={() => updateStatus(b.id, 'rejected')}
                          className="flex-1 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-400 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                        >拒绝</button>
                        <button
                          disabled={acting}
                          onClick={() => setDeleteConfirm(b)}
                          className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200 rounded-xl transition-colors disabled:opacity-50"
                        >删除</button>
                      </div>
                    )}
                    {b.status !== 'pending' && (
                      <div className="flex justify-end mt-2" onClick={e => e.stopPropagation()}>
                        <button
                          disabled={acting}
                          onClick={() => setDeleteConfirm(b)}
                          className="text-[10px] text-[#d0b0b8] hover:text-rose-400 transition-colors"
                        >删除</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl border border-[#fce8ed] w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg text-[#3d1230]">预约详情</h2>
              <button onClick={() => setSelected(null)} className="text-[#c090a0] hover:text-[#9a4065]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-2.5 text-sm mb-5">
              {[
                { label: '姓名',     value: selected.name },
                { label: '邮箱',     value: selected.email },
                selected.wechat ? { label: '微信', value: selected.wechat } : null,
                { label: '日期',     value: selected.date },
                { label: '时间',     value: selected.time_slot },
                { label: '基础服务', value: selected.basic_service_name },
                selected.addon_services?.length > 0
                  ? { label: '增值服务', value: selected.addon_services.map(a => a.name).join('、') }
                  : null,
                selected.notes ? { label: '备注', value: selected.notes } : null,
              ].filter(Boolean).map(row => (
                <div key={row!.label} className="flex gap-3">
                  <span className="text-[#c090a0] shrink-0 w-16">{row!.label}</span>
                  <span className="text-[#3d1230]">{row!.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {selected.status === 'pending' && <>
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'confirmed')}
                  className="flex-1 py-2.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50">确认预约</button>
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'rejected')}
                  className="flex-1 py-2.5 text-sm bg-rose-50 hover:bg-rose-100 text-rose-400 border border-rose-200 rounded-xl transition-colors disabled:opacity-50">拒绝</button>
              </>}
              {selected.status === 'confirmed' && (
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'rejected')}
                  className="flex-1 py-2.5 text-sm bg-rose-50 hover:bg-rose-100 text-rose-400 border border-rose-200 rounded-xl transition-colors disabled:opacity-50">标记为已拒绝</button>
              )}
              {selected.status === 'rejected' && (
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'confirmed')}
                  className="flex-1 py-2.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50">恢复确认</button>
              )}
              <button disabled={acting} onClick={() => { setDeleteConfirm(selected); setSelected(null) }}
                className="px-4 py-2.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200 rounded-xl transition-colors disabled:opacity-50">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl border border-[#fce8ed] w-full max-w-sm p-6 shadow-xl text-center" onClick={e => e.stopPropagation()}>
            <p className="text-[#3d1230] font-medium mb-1">确认删除？</p>
            <p className="text-sm text-[#c090a0] mb-5">{deleteConfirm.name} · {deleteConfirm.date} {deleteConfirm.time_slot}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm border border-[#fce8ed] text-[#c090a0] hover:bg-[#fff0f5] rounded-xl transition-colors">取消</button>
              <button disabled={acting} onClick={() => deleteBooking(deleteConfirm.id)}
                className="flex-1 py-2.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors disabled:opacity-50">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Booking Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl border border-[#fce8ed] w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg text-[#3d1230]">添加预约</h2>
              <button onClick={() => setShowAdd(false)} className="text-[#c090a0] hover:text-[#9a4065]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#9a4065] mb-1">姓名 *</label>
                  <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="客人姓名" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-[#9a4065] mb-1">邮箱 *</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">微信</label>
                <input value={addForm.wechat} onChange={e => setAddForm(f => ({ ...f, wechat: e.target.value }))}
                  placeholder="微信号（选填）" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#9a4065] mb-1">日期 *</label>
                  <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-[#9a4065] mb-1">时间 *</label>
                  <select value={addForm.timeSlot} onChange={e => setAddForm(f => ({ ...f, timeSlot: e.target.value }))}
                    className={inputCls}>
                    <option value="">选择时间</option>
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">基础服务 *</label>
                <select value={addForm.basicServiceId} onChange={e => setAddForm(f => ({ ...f, basicServiceId: e.target.value }))}
                  className={inputCls}>
                  <option value="">选择服务</option>
                  {basicServices.map(s => <option key={s.id} value={s.id}>{s.name}（{s.price}）</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#9a4065] mb-2">增值服务（多选）</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {addonServices.map(s => {
                    const checked = addForm.addonServiceIds.includes(s.id)
                    return (
                      <label key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        checked ? 'bg-[#fce8ed] border-[#e8789a] text-[#3d1230]' : 'border-[#fce8ed] text-[#9a4065] hover:border-[#f0a0b8]'
                      }`}>
                        <input type="checkbox" checked={checked} className="sr-only"
                          onChange={() => setAddForm(f => ({
                            ...f,
                            addonServiceIds: checked
                              ? f.addonServiceIds.filter(id => id !== s.id)
                              : [...f.addonServiceIds, s.id],
                          }))} />
                        <span className={`w-3 h-3 rounded border shrink-0 flex items-center justify-center ${checked ? 'bg-[#e8789a] border-[#e8789a]' : 'border-[#f0a0b8]'}`}>
                          {checked && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                        </span>
                        {s.name}
                      </label>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">备注</label>
                <textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="备注（选填）" className={inputCls + ' resize-none'} />
              </div>
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">状态</label>
                <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as Status }))}
                  className={inputCls}>
                  <option value="confirmed">已确认</option>
                  <option value="pending">待确认</option>
                </select>
              </div>
            </div>

            <button
              disabled={addSaving || !addForm.name || !addForm.email || !addForm.date || !addForm.timeSlot || !addForm.basicServiceId}
              onClick={submitAdd}
              className="mt-5 w-full py-3 bg-[#e8789a] hover:bg-[#c86080] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-full transition-colors"
            >
              {addSaving ? '保存中…' : '保存预约'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
