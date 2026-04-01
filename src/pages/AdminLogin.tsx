import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL ?? ''

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        setError('用户名或密码错误')
        return
      }
      const { token } = await res.json()
      localStorage.setItem('admin_token', token)
      navigate('/admin')
    } catch {
      setError('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8fa] flex items-center justify-center px-6" style={{ colorScheme: 'light' }}>
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#fce8ed] border border-[#f0a0b8] mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="#e8789a"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-[#3d1230] mb-1">Nailbox 管理后台</h1>
          <p className="text-sm text-[#c090a0]">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#fce8ed] rounded-2xl p-8 shadow-sm space-y-5">
          <div>
            <label className="block text-sm text-[#9a4065] mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl border border-[#fce8ed] bg-white text-sm text-[#3d1230] placeholder-[#d0a0b0] outline-none focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9a4065] mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl border border-[#fce8ed] bg-white text-sm text-[#3d1230] placeholder-[#d0a0b0] outline-none focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#e8789a] hover:bg-[#c86080] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm tracking-widest uppercase rounded-full transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                </svg>
                登录中…
              </>
            ) : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
