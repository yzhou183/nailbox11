import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

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

export default function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab]           = useState<Status | 'all'>('pending')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [acting, setActing]     = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const url = tab === 'all'
        ? `${API}/api/admin/bookings`
        : `${API}/api/admin/bookings?status=${tab}`
      const res = await fetch(url, { headers: authHeaders() })
      if (res.status === 401) { navigate('/admin/login'); return }
      setBookings(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [tab, navigate])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const updateStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    setActing(true)
    try {
      const res = await fetch(`${API}/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      })
      if (res.status === 401) { navigate('/admin/login'); return }
      await fetchBookings()
      setSelected(null)
    } finally {
      setActing(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const counts = {
    pending:   bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    rejected:  bookings.filter((b) => b.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-[#fff8fa]" style={{ colorScheme: 'light' }}>
      {/* Header */}
      <header className="bg-white border-b border-[#fce8ed] px-6 py-4 flex items-center justify-between">
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
        <button onClick={logout} className="text-xs text-[#c090a0] hover:text-[#e8789a] transition-colors px-3 py-1.5 border border-[#fce8ed] rounded-full">
          退出登录
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {([
            { label: '待确认', key: 'pending' as Status,   color: 'text-amber-500' },
            { label: '已确认', key: 'confirmed' as Status, color: 'text-emerald-500' },
            { label: '已拒绝', key: 'rejected' as Status,  color: 'text-rose-400' },
          ] as const).map(({ label, key, color }) => (
            <div key={key} className="bg-white border border-[#fce8ed] rounded-2xl p-5 text-center shadow-sm">
              <p className={`text-3xl font-light ${color}`}>{counts[key]}</p>
              <p className="text-xs text-[#c090a0] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#fce8ed] rounded-xl p-1 mb-6 w-fit">
          {([
            { key: 'pending' as const,   label: '待确认' },
            { key: 'confirmed' as const, label: '已确认' },
            { key: 'rejected' as const,  label: '已拒绝' },
            { key: 'all' as const,       label: '全部' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === key
                  ? 'bg-[#e8789a] text-white shadow-sm'
                  : 'text-[#9a4065] hover:bg-[#fff0f5]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Booking list */}
        {loading ? (
          <div className="text-center py-16 text-[#c090a0] text-sm">加载中…</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-[#c090a0] text-sm">暂无预约</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelected(b)}
                className="bg-white border border-[#fce8ed] rounded-2xl p-5 cursor-pointer hover:border-[#e8789a] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                  <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={acting}
                      onClick={() => updateStatus(b.id, 'confirmed')}
                      className="flex-1 py-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                      确认预约
                    </button>
                    <button
                      disabled={acting}
                      onClick={() => updateStatus(b.id, 'rejected')}
                      className="flex-1 py-2 text-xs bg-rose-50 hover:bg-rose-100 text-rose-400 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#fce8ed] w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg text-[#3d1230]">预约详情</h2>
              <button onClick={() => setSelected(null)} className="text-[#c090a0] hover:text-[#9a4065]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm mb-6">
              {[
                { label: '姓名',     value: selected.name },
                { label: '邮箱',     value: selected.email },
                selected.wechat ? { label: '微信', value: selected.wechat } : null,
                { label: '日期',     value: selected.date },
                { label: '时间',     value: selected.time_slot },
                { label: '基础服务', value: selected.basic_service_name },
                selected.addon_services?.length > 0
                  ? { label: '增值服务', value: selected.addon_services.map((a) => a.name).join('、') }
                  : null,
                selected.notes ? { label: '备注', value: selected.notes } : null,
                { label: '状态', value: STATUS_LABEL[selected.status] },
              ].filter(Boolean).map((row) => (
                <div key={row!.label} className="flex gap-3">
                  <span className="text-[#c090a0] shrink-0 w-16">{row!.label}</span>
                  <span className="text-[#3d1230]">{row!.value}</span>
                </div>
              ))}
            </div>
            {selected.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  disabled={acting}
                  onClick={() => updateStatus(selected.id, 'confirmed')}
                  className="flex-1 py-3 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  确认预约
                </button>
                <button
                  disabled={acting}
                  onClick={() => updateStatus(selected.id, 'rejected')}
                  className="flex-1 py-3 text-sm bg-rose-50 hover:bg-rose-100 text-rose-400 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  拒绝
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
