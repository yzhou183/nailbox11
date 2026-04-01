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
  basic_service_duration: number
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

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('admin_token')}`, 'Content-Type': 'application/json' }
}

// ── date helpers ──────────────────────────────────────────────────
const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const TIME_SLOTS = [
  '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
]

/** Normalize DB date (may be ISO timestamp) to YYYY-MM-DD */
function normalizeDate(d: string): string { return d.slice(0, 10) }

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekStart(d: Date): Date {
  const date = new Date(d)
  date.setDate(date.getDate() - date.getDay()) // Sunday
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function weekRangeLabel(start: Date): string {
  const end = addDays(start, 6)
  const sm = start.getMonth() + 1; const sd = start.getDate()
  const em = end.getMonth() + 1;   const ed = end.getDate()
  return sm === em ? `${sm}月${sd}日–${ed}日` : `${sm}月${sd}日–${em}月${ed}日`
}

function to24h(slot: string): string {
  const match = slot.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!match) return slot
  let h = parseInt(match[1]); const m = match[2]; const period = match[3].toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m}`
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}h`
  return h > 0 ? `${h}h${m}m` : `${m}m`
}


function sortByTime(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => TIME_SLOTS.indexOf(a.time_slot) - TIME_SLOTS.indexOf(b.time_slot))
}

// ── Add form ──────────────────────────────────────────────────────
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
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading]         = useState(true)

  const now = new Date()
  const todayStr = toDateStr(now)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(now))

  const [selected,      setSelected]      = useState<Booking | null>(null)
  const [showAdd,       setShowAdd]       = useState(false)
  const [addForm,       setAddForm]       = useState<AddForm>(EMPTY_FORM)
  const [addSaving,     setAddSaving]     = useState(false)
  const [acting,        setActing]        = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null)
  const [listFilter,    setListFilter]    = useState<Status | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/bookings`, { headers: authHeaders() })
      if (res.status === 401) { navigate('/admin/login'); return }
      const rows: Booking[] = await res.json()
      // normalize dates from DB
      setAllBookings(rows.map(b => ({ ...b, date: normalizeDate(b.date) })))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [navigate])

  useEffect(() => { fetchAll() }, [fetchAll])

  // group by normalized date
  const byDate = allBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    ;(acc[b.date] ??= []).push(b)
    return acc
  }, {})

  const counts = {
    pending:   allBookings.filter(b => b.status === 'pending').length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    rejected:  allBookings.filter(b => b.status === 'rejected').length,
  }

  // week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

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
      setDeleteConfirm(null); setSelected(null)
      await fetchAll()
    } finally { setActing(false) }
  }

  const submitAdd = async () => {
    if (!addForm.name || !addForm.date || !addForm.timeSlot || !addForm.basicServiceId) return
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
      if (res.ok) { setShowAdd(false); setAddForm(EMPTY_FORM); await fetchAll() }
    } finally { setAddSaving(false) }
  }

  const logout = () => { localStorage.removeItem('admin_token'); navigate('/admin/login') }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-[#fce8ed] bg-white text-sm text-[#3d1230] placeholder-[#d0a0b0] outline-none focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10 transition-all'

  // ── render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fff8fa]" style={{ colorScheme: 'light' }}>

      {/* Header */}
      <header className="bg-white border-b border-[#fce8ed] px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#fce8ed] border border-[#f0a0b8] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#e8789a">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-lg text-[#e8789a] leading-none">Nailbox</h1>
            <p className="text-[10px] text-[#c090a0] tracking-widest uppercase">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAddForm({ ...EMPTY_FORM }); setShowAdd(true) }}
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

      <div className="max-w-3xl mx-auto px-4 py-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {([
            { label: '待确认', key: 'pending'   as Status, color: 'text-amber-500',   active: 'border-amber-300 bg-amber-50' },
            { label: '已确认', key: 'confirmed' as Status, color: 'text-emerald-500', active: 'border-emerald-300 bg-emerald-50' },
            { label: '已拒绝', key: 'rejected'  as Status, color: 'text-rose-400',    active: 'border-rose-300 bg-rose-50' },
          ] as const).map(({ label, key, color, active }) => (
            <button
              key={key}
              onClick={() => setListFilter(f => f === key ? null : key)}
              className={`rounded-2xl p-4 text-center shadow-sm border transition-all ${
                listFilter === key ? active : 'bg-white border-[#fce8ed] hover:border-[#f0a0b8]'
              }`}
            >
              <p className={`text-3xl font-light ${color}`}>{counts[key]}</p>
              <p className="text-xs text-[#c090a0] mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Filtered list (shown when a stat card is clicked) */}
        {listFilter && (
          <div className="bg-white border border-[#fce8ed] rounded-2xl shadow-sm mb-5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#fce8ed]">
              <p className="text-sm font-medium text-[#3d1230]">
                {STATUS_LABEL[listFilter]}
                <span className="text-[#c090a0] font-normal ml-1.5">
                  ({allBookings.filter(b => b.status === listFilter).length})
                </span>
              </p>
              <button onClick={() => setListFilter(null)} className="text-xs text-[#c090a0] hover:text-[#e8789a] transition-colors">
                收起
              </button>
            </div>
            {allBookings.filter(b => b.status === listFilter).length === 0 ? (
              <p className="text-center py-8 text-sm text-[#c090a0]">暂无{STATUS_LABEL[listFilter]}预约</p>
            ) : (
              <div className="divide-y divide-[#fce8ed]">
                {allBookings
                  .filter(b => b.status === listFilter)
                  .sort((a, b) => a.date.localeCompare(b.date) || TIME_SLOTS.indexOf(a.time_slot) - TIME_SLOTS.indexOf(b.time_slot))
                  .map(b => (
                    <div key={b.id} onClick={() => setSelected(b)}
                      className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-[#fff8fa] transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#c0507a]">{b.name}</span>
                          {b.wechat && <span className="text-[10px] text-[#c090a0]">微信 {b.wechat}</span>}
                        </div>
                        <p className="text-xs text-[#e8789a] mt-0.5">{b.date} · {b.time_slot}</p>
                        <p className="text-[10px] text-[#f0b0c8]">{b.basic_service_name}</p>
                      </div>
                      <svg className="w-4 h-4 text-[#f0b0c8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Week calendar */}
        <div className="bg-white border border-[#fce8ed] rounded-2xl shadow-sm overflow-hidden">

          {/* Week navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#fce8ed]">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="p-2 hover:bg-[#fff0f5] rounded-xl transition-colors"
            >
              <svg className="w-4 h-4 text-[#c090a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-[#e8789a]">{weekRangeLabel(weekStart)}</p>
              {toDateStr(weekStart) === toDateStr(getWeekStart(now)) && (
                <p className="text-[10px] text-[#e8789a] mt-0.5">本周</p>
              )}
            </div>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="p-2 hover:bg-[#fff0f5] rounded-xl transition-colors"
            >
              <svg className="w-4 h-4 text-[#c090a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* Day rows */}
          {loading ? (
            <div className="py-12 text-center text-sm text-[#c090a0]">加载中…</div>
          ) : (
            <div className="divide-y divide-[#fce8ed]">
              {weekDays.map((day, i) => {
                const dateStr     = toDateStr(day)
                const dayBookings = sortByTime(byDate[dateStr] ?? [])
                const isToday     = dateStr === todayStr

                return (
                  <div key={i} className={`flex gap-3 px-3 py-3 ${isToday ? 'bg-[#fff8fa]' : ''}`}>

                    {/* Day label */}
                    <div className="w-10 shrink-0 flex flex-col items-center pt-1">
                      <p className={`text-[10px] font-medium ${isToday ? 'text-[#e8789a]' : 'text-[#f0b0c8]'}`}>
                        {WEEKDAY_CN[day.getDay()]}
                      </p>
                      <p className={`text-xl font-light leading-none mt-0.5 ${isToday ? 'text-[#e8789a]' : 'text-[#d07090]'}`}>
                        {day.getDate()}
                      </p>
                      <p className="text-[9px] text-[#f0b0c8] mt-0.5">{day.getMonth() + 1}月</p>
                    </div>

                    {/* Booking cards — single row, all fit */}
                    <div className="flex-1 flex gap-1.5 items-stretch min-w-0">
                      {dayBookings.length === 0 ? (
                        <p className="text-xs text-[#e8d8de] self-center py-2">—</p>
                      ) : (
                        dayBookings.map(b => (
                          <button
                            key={b.id}
                            onClick={() => setSelected(b)}
                            style={{ width: '20%', flexShrink: 0 }}
                            className={`text-left rounded-xl px-2 py-2 border transition-all active:scale-[0.97] overflow-hidden ${
                              b.status === 'confirmed'
                                ? 'bg-[#fce8ed] border-[#f0a0b8]'
                                : b.status === 'pending'
                                  ? 'bg-amber-50 border-amber-200'
                                  : 'bg-gray-50 border-gray-200 opacity-50'
                            }`}
                          >
                            <p className="text-[11px] font-semibold text-[#c0507a] leading-snug">{b.name}</p>
                            <p className="text-[10px] mt-0.5 text-[#e8789a]">{to24h(b.time_slot)}</p>
                            <p className="text-[10px] text-[#f0b0c8]">{formatDuration(b.basic_service_duration)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Jump to today */}
        {toDateStr(weekStart) !== toDateStr(getWeekStart(now)) && (
          <button
            onClick={() => setWeekStart(getWeekStart(now))}
            className="mt-3 w-full text-xs text-[#c090a0] hover:text-[#e8789a] py-2 border border-[#fce8ed] rounded-xl bg-white transition-colors"
          >
            回到本周
          </button>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl border border-[#fce8ed] w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-serif text-lg text-[#3d1230]">预约详情</h2>
              <button onClick={() => setSelected(null)} className="text-[#c090a0] hover:text-[#9a4065]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <p className={`text-xs mb-4 px-2 py-0.5 rounded-full border w-fit ${
              selected.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
              selected.status === 'pending'   ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                               'bg-rose-50 text-rose-400 border-rose-200'
            }`}>{STATUS_LABEL[selected.status]}</p>

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
                  className="flex-1 py-2.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl disabled:opacity-50 transition-colors">
                  确认预约
                </button>
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'rejected')}
                  className="flex-1 py-2.5 text-sm bg-rose-50 hover:bg-rose-100 text-rose-400 border border-rose-200 rounded-xl disabled:opacity-50 transition-colors">
                  拒绝
                </button>
              </>}
              {selected.status === 'confirmed' && (
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'rejected')}
                  className="flex-1 py-2.5 text-sm bg-rose-50 hover:bg-rose-100 text-rose-400 border border-rose-200 rounded-xl disabled:opacity-50 transition-colors">
                  标记已拒绝
                </button>
              )}
              {selected.status === 'rejected' && (
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'confirmed')}
                  className="flex-1 py-2.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl disabled:opacity-50 transition-colors">
                  恢复确认
                </button>
              )}
              <button disabled={acting} onClick={() => { setDeleteConfirm(selected); setSelected(null) }}
                className="px-4 py-2.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200 rounded-xl disabled:opacity-50 transition-colors">
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl border border-[#fce8ed] w-full max-w-sm p-6 shadow-xl text-center" onClick={e => e.stopPropagation()}>
            <p className="text-[#3d1230] font-medium mb-1">确认删除？</p>
            <p className="text-sm text-[#c090a0] mb-5">{deleteConfirm.name} · {deleteConfirm.date} {deleteConfirm.time_slot}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm border border-[#fce8ed] text-[#c090a0] hover:bg-[#fff0f5] rounded-xl transition-colors">取消</button>
              <button disabled={acting} onClick={() => deleteBooking(deleteConfirm.id)}
                className="flex-1 py-2.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-xl disabled:opacity-50 transition-colors">删除</button>
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
                  <label className="block text-xs text-[#9a4065] mb-1">邮箱</label>
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
                  <select value={addForm.timeSlot} onChange={e => setAddForm(f => ({ ...f, timeSlot: e.target.value }))} className={inputCls}>
                    <option value="">选择时间</option>
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">基础服务 *</label>
                <select value={addForm.basicServiceId} onChange={e => setAddForm(f => ({ ...f, basicServiceId: e.target.value }))} className={inputCls}>
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
                <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as Status }))} className={inputCls}>
                  <option value="confirmed">已确认</option>
                  <option value="pending">待确认</option>
                </select>
              </div>
            </div>

            <button
              disabled={addSaving || !addForm.name || !addForm.date || !addForm.timeSlot || !addForm.basicServiceId}
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
