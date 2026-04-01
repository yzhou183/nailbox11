/**
 * AdminLogin.tsx
 *
 * The login page for the Nail Box admin dashboard. This page is only
 * accessible to salon staff — it is NOT linked from the public-facing site.
 *
 * AUTHENTICATION FLOW:
 *  1. The user enters their username and password and submits the form.
 *  2. The component sends a POST request to `/api/admin/login` on the
 *     configured backend (VITE_API_URL environment variable).
 *  3. On success, the server returns a JWT (or session token) in the response
 *     body as `{ token: string }`.
 *  4. The token is stored in `localStorage` under the key `"admin_token"` so
 *     subsequent authenticated API calls can attach it as a Bearer header.
 *  5. The user is redirected to `/admin` (the admin dashboard) using React
 *     Router's `useNavigate` hook.
 *
 * ERROR HANDLING:
 *  - Non-2xx response -> displays "用户名或密码错误" (Wrong username or password)
 *  - Network / fetch failure -> displays "网络错误，请检查连接" (Network error)
 *  - The error message is cleared on each new submission attempt.
 *
 * LOADING STATE:
 *  - While the request is in flight, the submit button is disabled and shows
 *    a spinning SVG icon + "登录中…" (Logging in…) to prevent double-submission.
 *
 * UI DESIGN:
 *  - Matches the public site's colour palette (rose/pink tones, serif font).
 *  - Centred single-card layout, intentionally minimal — no distractions.
 *  - Chinese-language labels and error messages (the admin is salon staff).
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * API base URL — read from the Vite environment variable VITE_API_URL.
 *
 * During local development this is typically "http://localhost:4000" (or
 * similar); in production it points to the deployed backend host.
 *
 * Defaulting to an empty string `''` means relative paths are used if the
 * variable is not set, which works when the frontend and backend are served
 * from the same origin (e.g. behind a reverse proxy).
 */
const API = import.meta.env.VITE_API_URL ?? ''

/**
 * AdminLogin page component.
 *
 * Renders the full-screen login form. No props are accepted.
 * Authentication state is local — managed entirely with `useState`.
 */
export default function AdminLogin() {
  // useNavigate gives us a programmatic navigation function so we can redirect
  // to the admin dashboard after a successful login without a full page reload.
  const navigate = useNavigate()

  // ---- Controlled form field state ----------------------------------------

  /**
   * username — the value of the username text input.
   * Updated on every keystroke via onChange to keep React in control of the
   * input, which makes it easy to read and validate the value on submit.
   */
  const [username, setUsername] = useState('')

  /**
   * password — the value of the password input.
   * Stored in state so it can be included in the fetch body on submit.
   * Never logged or persisted beyond the component's lifetime.
   */
  const [password, setPassword] = useState('')

  // ---- UI feedback state --------------------------------------------------

  /**
   * error — an error message string to display below the form fields.
   * Empty string means no error is currently shown.
   * Set to a descriptive message if the login API call fails.
   */
  const [error, setError] = useState('')

  /**
   * loading — whether a login request is currently in flight.
   * While true: the submit button is disabled and shows a spinner.
   * Prevents the user from sending multiple overlapping requests.
   */
  const [loading, setLoading] = useState(false)

  // -------------------------------------------------------------------------

  /**
   * handleSubmit — async form submission handler.
   *
   * Called when the user clicks the submit button or presses Enter inside
   * the form. Handles the complete authentication flow:
   *  - Prevents default browser form submission (which would reload the page)
   *  - Clears any stale error from a previous attempt
   *  - Sends credentials to the backend login endpoint
   *  - Stores the returned token and navigates to the admin dashboard
   *  - Displays user-friendly error messages in both failure cases
   *  - Always resets the loading spinner in the `finally` block
   *
   * @param e - The React synthetic form event. Used only to call preventDefault.
   */
  const handleSubmit = async (e: FormEvent) => {
    // Prevent the browser from reloading the page on form submit.
    e.preventDefault()

    // Clear any error message left over from a previous failed attempt
    // so the user gets a clean slate when they retry.
    setError('')

    // Signal that a request is now in flight — disables the button and shows
    // the spinner to prevent accidental double-submission.
    setLoading(true)

    try {
      /**
       * POST to the login endpoint with JSON credentials.
       *
       * The Content-Type header is required so the backend's body parser
       * correctly reads the payload as JSON rather than form-encoded data.
       *
       * We use template literal interpolation with the `API` constant so the
       * same code works in both development and production environments.
       */
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      // A non-OK status (4xx, 5xx) means the credentials were rejected or the
      // server encountered a problem. We display a generic wrong-credentials
      // message to avoid leaking information about whether the username exists.
      if (!res.ok) {
        setError('用户名或密码错误') // "Wrong username or password"
        return // Exit early — do not attempt to read the body or navigate.
      }

      /**
       * Successful login — parse the token from the JSON response body.
       *
       * Expected response shape: `{ token: string }`
       *
       * The token is stored in localStorage so it survives page refreshes.
       * Subsequent admin API calls read it from there and attach it as an
       * Authorization Bearer header.
       */
      const { token } = await res.json()
      localStorage.setItem('admin_token', token)

      // Navigate to the admin dashboard. `navigate` from React Router performs
      // a client-side route change — no full page reload.
      navigate('/admin')

    } catch {
      /**
       * The fetch() call itself threw an error — this happens when the
       * network is unavailable, the server is down, or CORS blocked the
       * request. We show a network-specific error message so the user knows
       * this is a connectivity issue rather than a credentials problem.
       */
      setError('网络错误，请检查连接') // "Network error, please check your connection"

    } finally {
      /**
       * Always reset the loading state regardless of success or failure.
       * Without this, a failed request would leave the button permanently
       * disabled, requiring a page refresh to retry.
       */
      setLoading(false)
    }
  }

  // ---- Render -------------------------------------------------------------

  return (
    /**
     * Full-screen centred container.
     *
     * `min-h-screen` + `flex items-center justify-center` vertically and
     * horizontally centres the login card on all screen sizes.
     *
     * `style={{ colorScheme: 'light' }}` explicitly opts the component out of
     * the browser's dark-mode styling. Without this, browsers that respect the
     * user's OS dark-mode preference may invert input field colours in a way
     * that clashes with the custom rose-pink design tokens.
     */
    <div className="min-h-screen bg-[#fff8fa] flex items-center justify-center px-6" style={{ colorScheme: 'light' }}>

      {/* Login card container — constrained width, centred */}
      <div className="w-full max-w-sm">

        {/* ---- Brand / Logo block --------------------------------------- */}
        {/*
         * A circular icon badge above the title reinforces the brand even on
         * this internal-only page. The icon is a play-button / arrow mark
         * inside a pink circle — it evokes "enter" or "proceed" without being
         * a literal lock icon, keeping the aesthetic consistent with the site.
         */}
        <div className="text-center mb-10">
          {/* Circular icon badge */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#fce8ed] border border-[#f0a0b8] mb-4">
            {/* Play/arrow SVG — metaphor for "proceeding into" the dashboard */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="#e8789a"/>
            </svg>
          </div>
          {/* Page title — Chinese: "Nailbox Admin Dashboard" */}
          <h1 className="font-serif text-2xl text-[#c0507a] mb-1">Nailbox 管理后台</h1>
          {/* English subtitle for staff who prefer English */}
          <p className="text-sm text-[#c090a0]">Admin Dashboard</p>
        </div>

        {/* ---- Login form ----------------------------------------------- */}
        {/*
         * The form is handled entirely client-side via `handleSubmit`.
         * `space-y-5` provides consistent vertical spacing between all child
         * elements (inputs, error message, button) without needing per-element
         * margin classes.
         */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#fce8ed] rounded-2xl p-8 shadow-sm space-y-5">

          {/* ---- Username field ---------------------------------------- */}
          <div>
            {/* Label — Chinese: "Username" */}
            <label className="block text-sm text-[#9a4065] mb-1.5">用户名</label>
            <input
              type="text"
              value={username}                            // Controlled — React owns the value
              onChange={(e) => setUsername(e.target.value)} // Update state on every keystroke
              placeholder="admin"
              required                                   // HTML5 validation — prevents submission if empty
              autoComplete="username"                    // Hints to password managers which field this is
              className="w-full px-4 py-3 rounded-xl border border-[#fce8ed] bg-white text-sm text-[#c0507a] placeholder-[#d0a0b0] outline-none focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10 transition-all"
            />
          </div>

          {/* ---- Password field ---------------------------------------- */}
          <div>
            {/* Label — Chinese: "Password" */}
            <label className="block text-sm text-[#9a4065] mb-1.5">密码</label>
            <input
              type="password"                            // Masks input so shoulder-surfers can't read it
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"           // Hints to password managers this is the password field
              className="w-full px-4 py-3 rounded-xl border border-[#fce8ed] bg-white text-sm text-[#c0507a] placeholder-[#d0a0b0] outline-none focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10 transition-all"
            />
          </div>

          {/* ---- Error message ----------------------------------------- */}
          {/*
           * Conditionally rendered — only appears when `error` is a non-empty
           * string. The message is centred and styled in rose-400 (a slightly
           * muted red-pink) so it reads as an error without being alarmingly
           * bright against the soft background.
           */}
          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          {/* ---- Submit button ----------------------------------------- */}
          {/*
           * `disabled={loading}` prevents submission while a request is in
           * flight (matching the state set at the start of handleSubmit).
           * `disabled:opacity-60 disabled:cursor-not-allowed` provides clear
           * visual + cursor feedback that the button is currently inactive.
           *
           * The button renders two states:
           *  - Loading: spinner SVG + "登录中…" (Logging in…)
           *  - Idle:    plain "登录" (Login)
           */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#e8789a] hover:bg-[#c86080] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm tracking-widest uppercase rounded-full transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                {/*
                 * Animated spinner — a standard SVG circle + arc pattern.
                 * `animate-spin` (Tailwind built-in) rotates it continuously.
                 * The circle track at 25% opacity gives the appearance of a
                 * "track" that the spinning arc travels along.
                 */}
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  {/* Faint circular track */}
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  {/* Spinning arc fill — the visible "moving" part */}
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                </svg>
                {/* Loading text — Chinese: "Logging in…" */}
                登录中…
              </>
            ) : (
              // Idle state — Chinese: "Login"
              '登录'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
