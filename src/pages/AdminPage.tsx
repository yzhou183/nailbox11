/**
 * AdminPage.tsx
 *
 * The main administration dashboard for the Nailbox booking system.
 *
 * Responsibilities:
 *  - Fetches all bookings from the backend API and keeps them in local state.
 *  - Displays a weekly calendar view so the admin can see who is booked on
 *    each day at a glance.
 *  - Shows summary stat cards (pending / confirmed / rejected counts) that
 *    double as filters — clicking one filters the list to that status.
 *  - Allows the admin to open a detail modal for any booking to confirm,
 *    reject, restore, or delete it.
 *  - Provides an "Add Booking" modal so the admin can manually create
 *    bookings on behalf of customers.
 *  - Handles authentication: any 401 response redirects to /admin/login,
 *    and a logout button clears the stored JWT token.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { basicServices, addonServices } from '../data/services'

/**
 * Base URL for all API requests.  Falls back to an empty string (same origin)
 * when VITE_API_URL is not set, which works during local development if the
 * API server and Vite dev server share the same origin or are proxied.
 */
const API = import.meta.env.VITE_API_URL ?? ''

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * The three lifecycle states a booking can be in.
 *  - pending:   Submitted by the customer, awaiting admin review.
 *  - confirmed: Admin has approved the booking.
 *  - rejected:  Admin has declined or cancelled the booking.
 */
type Status = 'pending' | 'confirmed' | 'rejected'

/**
 * Shape of a booking record as returned by the API.
 * Dates from the DB may arrive as full ISO-8601 timestamps; we always
 * normalise them to YYYY-MM-DD strings after fetching (see normalizeDate).
 */
interface Booking {
  id: string
  name: string
  email: string
  wechat: string
  /** YYYY-MM-DD after normalisation */
  date: string
  /** Human-readable slot label, e.g. "10:00 AM" */
  time_slot: string
  basic_service_name: string
  basic_service_id: string
  /** Duration of the basic service in minutes, used to display a compact label */
  basic_service_duration: number
  /** Zero or more optional add-on services the customer selected */
  addon_services: Array<{ id: string; name: string }>
  notes: string
  status: Status
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Chinese display labels for each status value, used throughout the UI.
 * Kept in a lookup table so the mapping is defined in one place.
 */
const STATUS_LABEL: Record<Status, string> = {
  pending:   '待确认',
  confirmed: '已确认',
  rejected:  '已拒绝',
}

// ── Utilities — Auth ──────────────────────────────────────────────────────────

/**
 * Builds the HTTP headers object required for authenticated API requests.
 * The JWT token is stored in localStorage under the key "admin_token" and
 * is sent as a Bearer token.  The Content-Type header is included so that
 * POST/PATCH bodies are parsed as JSON by the server.
 */
function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('admin_token')}`, 'Content-Type': 'application/json' }
}

// ── Utilities — Date / Time ───────────────────────────────────────────────────

/**
 * Chinese names for each day of the week, indexed by Date.getDay()
 * (0 = Sunday … 6 = Saturday).
 */
const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * All bookable time slots in the order they appear throughout the business day.
 * This array is also used as a sort key — bookings are ordered by their index
 * in this array rather than by string comparison, so "9:30 AM" always sorts
 * before "1:00 PM" regardless of lexicographic ordering.
 */
const TIME_SLOTS = [
  '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
]

/**
 * Strips any time or timezone portion from a DB date string, returning only
 * the YYYY-MM-DD prefix.  This guards against the backend returning full ISO
 * timestamps (e.g. "2024-06-15T00:00:00.000Z") which would break keyed
 * lookups that expect the plain date format.
 */
function normalizeDate(d: string): string { return d.slice(0, 10) }

/**
 * Formats a JavaScript Date object as a YYYY-MM-DD string in local time.
 * We cannot use toISOString() here because that converts to UTC, which can
 * shift the date by a day for users in time zones west of UTC.
 */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Returns a new Date set to the Sunday that starts the week containing `d`,
 * with the time portion zeroed out (midnight).  This is used to anchor the
 * weekly calendar view.
 */
function getWeekStart(d: Date): Date {
  const date = new Date(d)
  date.setDate(date.getDate() - date.getDay()) // Sunday
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Returns a new Date that is `n` days after `d`.  Negative values move
 * backward in time (used by the "previous week" navigation button).
 */
function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

/**
 * Generates a human-readable Chinese label for the seven-day range that
 * begins on `start`.
 *
 * Examples:
 *  - Same month:    "6月10日–16日"
 *  - Cross-month:   "6月30日–7月6日"
 *
 * The cross-month variant is needed because a week can straddle two months.
 */
function weekRangeLabel(start: Date): string {
  const end = addDays(start, 6)
  const sm = start.getMonth() + 1; const sd = start.getDate()
  const em = end.getMonth() + 1;   const ed = end.getDate()
  return sm === em ? `${sm}月${sd}日–${ed}日` : `${sm}月${sd}日–${em}月${ed}日`
}

/**
 * Converts a 12-hour time slot label (e.g. "2:30 PM") to 24-hour format
 * (e.g. "14:30") for compact display inside the calendar cards.
 *
 * Handles the two edge cases of standard 12-hour time:
 *  - 12:xx AM -> 00:xx (midnight hour)
 *  - 12:xx PM -> 12:xx (noon hour stays the same)
 *
 * Returns the original string unchanged if it does not match the expected
 * pattern, so the function degrades gracefully for unexpected input.
 */
function to24h(slot: string): string {
  const match = slot.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!match) return slot
  let h = parseInt(match[1]); const m = match[2]; const period = match[3].toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m}`
}

/**
 * Formats a duration given in minutes into a compact label.
 *
 * Examples:
 *  - 60  -> "1h"
 *  - 90  -> "1h30m"
 *  - 45  -> "45m"
 *
 * This is used inside the tiny calendar booking cards where horizontal space
 * is very limited.
 */
function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}h`
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

/**
 * Returns a copy of the bookings array sorted by each booking's position in
 * the TIME_SLOTS ordering.  We sort by index rather than lexicographic order
 * to guarantee that the canonical business-day order is always respected.
 */
function sortByTime(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => TIME_SLOTS.indexOf(a.time_slot) - TIME_SLOTS.indexOf(b.time_slot))
}

// ── Add-booking form ──────────────────────────────────────────────────────────

/**
 * All fields that the admin fills in when manually creating a booking.
 * addonServiceIds holds the IDs of any add-on services the customer wants;
 * the default status is "confirmed" because admin-created bookings are
 * typically walk-in or phone bookings that don't need further review.
 */
interface AddForm {
  name: string; email: string; wechat: string
  date: string; timeSlot: string
  basicServiceId: string; addonServiceIds: string[]
  notes: string; status: Status
}

/**
 * Blank initial state for the add-booking form.  We return to this state
 * whenever the modal is closed or a booking is successfully saved, so the
 * form is always clean when it next opens.
 */
const EMPTY_FORM: AddForm = {
  name: '', email: '', wechat: '', date: '', timeSlot: '',
  basicServiceId: '', addonServiceIds: [], notes: '', status: 'confirmed',
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * AdminPage
 *
 * Root component for the admin dashboard.  Renders the sticky header,
 * status summary cards, a filterable booking list, a weekly calendar grid,
 * and three overlay modals (booking detail, delete confirmation, add booking).
 *
 * Authentication is enforced at the data layer: any 401 from the API
 * triggers a navigation to /admin/login, and the logout button clears the
 * stored token before redirecting.
 */
export default function AdminPage() {
  // Used to redirect to /admin/login on 401 or logout
  const navigate = useNavigate()

  // Master list of all bookings fetched from the server.  Every mutating
  // action (confirm, reject, delete, add) re-fetches this list so the UI
  // stays in sync without optimistic updates that could diverge.
  const [allBookings, setAllBookings] = useState<Booking[]>([])

  // Controls the loading spinner shown while the initial fetch is in flight.
  const [loading, setLoading]         = useState(true)

  // Snapshot of "now" used to determine today's date and the current week.
  // Computed once at render-init so it doesn't drift during the session.
  const now = new Date()
  const todayStr = toDateStr(now)   // YYYY-MM-DD for today, used to highlight the current day column

  // The Sunday that begins the currently-displayed week.  Navigation arrows
  // shift this by ±7 days, which recomputes the weekDays array below.
  const [weekStart, setWeekStart] = useState(() => getWeekStart(now))

  // The booking whose detail modal is open, or null when no modal is shown.
  const [selected,      setSelected]      = useState<Booking | null>(null)

  // Whether the "Add Booking" modal is visible.
  const [showAdd,       setShowAdd]       = useState(false)

  // Current state of the add-booking form fields.
  const [addForm,       setAddForm]       = useState<AddForm>(EMPTY_FORM)

  // True while the add-booking POST request is in flight; disables the
  // save button to prevent duplicate submissions.
  const [addSaving,     setAddSaving]     = useState(false)

  // True while any status-update or delete request is in flight; disables
  // action buttons in the detail and confirm-delete modals.
  const [acting,        setActing]        = useState(false)

  // When non-null, the delete-confirmation dialog is shown for this booking.
  // Separated from `selected` because the detail modal must close first so
  // only one overlay is on screen at a time.
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null)

  // When non-null, the booking list is filtered to show only bookings with
  // this status.  Clicking the same stat card again clears the filter.
  const [listFilter,    setListFilter]    = useState<Status | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────

  /**
   * Fetches all bookings from the API and stores them in state.
   * Wrapped in useCallback so its identity is stable across renders, allowing
   * it to be used safely as a useEffect dependency and called from action
   * handlers to refresh data after mutations.
   *
   * Side effects:
   *  - Sets loading to true at the start and false in the finally block.
   *  - Normalises date fields from possible ISO timestamps to YYYY-MM-DD.
   *  - Redirects to /admin/login if the server returns 401 (token expired).
   */
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

  // Fetch bookings once on mount.  fetchAll is stable (memoised), so this
  // effect only runs once — equivalent to a componentDidMount.
  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Derived state ──────────────────────────────────────────────────────────

  /**
   * Groups all bookings by their normalised date string so the calendar can
   * quickly look up which bookings belong to a given day without filtering
   * the full array each render.
   *
   * Shape: { "2024-06-15": [Booking, …], "2024-06-17": [Booking, …], … }
   */
  const byDate = allBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    ;(acc[b.date] ??= []).push(b)
    return acc
  }, {})

  /**
   * Pre-computed counts for each status, used in the summary stat cards.
   * Derived from allBookings so they always reflect the latest fetched data.
   */
  const counts = {
    pending:   allBookings.filter(b => b.status === 'pending').length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    rejected:  allBookings.filter(b => b.status === 'rejected').length,
  }

  /**
   * Array of seven Date objects representing the days of the currently
   * displayed week (Sunday through Saturday).  Recomputed whenever weekStart
   * changes (i.e. when the admin navigates to a different week).
   */
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * PATCHes the status of a booking to the given value.
   *
   * After a successful update:
   *  - The full booking list is re-fetched to keep allBookings fresh.
   *  - If the detail modal is open for this booking, its displayed status is
   *    updated in place so the modal reflects the change immediately without
   *    waiting for the re-fetch to propagate.
   *
   * The `acting` flag is set for the duration of the request so that action
   * buttons are disabled, preventing concurrent conflicting mutations.
   *
   * @param id     The UUID of the booking to update.
   * @param status The new status to apply.
   */
  const updateStatus = async (id: string, status: Status) => {
    setActing(true)
    try {
      const res = await fetch(`${API}/api/admin/bookings/${id}/status`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }),
      })
      if (res.status === 401) { navigate('/admin/login'); return }
      await fetchAll()
      // Update the selected booking's status optimistically so the modal
      // reflects the change without needing a second render from fetchAll.
      setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
    } finally { setActing(false) }
  }

  /**
   * Permanently deletes a booking via the API.
   *
   * After deletion:
   *  - The delete-confirmation dialog is dismissed.
   *  - The detail modal (if still open) is closed.
   *  - The booking list is re-fetched so the deleted entry disappears.
   *
   * @param id The UUID of the booking to delete.
   */
  const deleteBooking = async (id: string) => {
    setActing(true)
    try {
      await fetch(`${API}/api/admin/bookings/${id}`, { method: 'DELETE', headers: authHeaders() })
      setDeleteConfirm(null); setSelected(null)
      await fetchAll()
    } finally { setActing(false) }
  }

  /**
   * Validates the add-booking form and POSTs a new booking to the API.
   *
   * Required fields (name, date, timeSlot, basicServiceId) are checked first;
   * the function returns early if any are missing, mirroring the disabled
   * state of the submit button.
   *
   * On success the modal is closed, the form is reset to EMPTY_FORM, and the
   * booking list is re-fetched so the new entry appears immediately.
   */
  const submitAdd = async () => {
    // Guard: all four required fields must be filled before we send the request.
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
      // Only reset state and refresh on a successful response (2xx).
      // Network errors or 4xx/5xx responses leave the modal open so the
      // admin can retry without losing the data they entered.
      if (res.ok) { setShowAdd(false); setAddForm(EMPTY_FORM); await fetchAll() }
    } finally { setAddSaving(false) }
  }

  /**
   * Logs the admin out by removing the JWT token from localStorage and
   * redirecting to the login page.  No server-side session invalidation is
   * performed — the token simply stops being sent.
   */
  const logout = () => { localStorage.removeItem('admin_token'); navigate('/admin/login') }

  /**
   * Shared Tailwind class string for all text inputs and selects in the
   * add-booking form.  Defined once here to avoid repeating the same long
   * class list on every input element.
   */
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-[#fce8ed] bg-white text-sm text-[#3d1230] placeholder-[#d0a0b0] outline-none focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10 transition-all'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fff8fa]" style={{ colorScheme: 'light' }}>

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      {/* Contains the brand mark, the "Add Booking" shortcut button, and
          the logout button.  Stays fixed at the top while the admin scrolls
          through the calendar. */}
      <header className="bg-white border-b border-[#fce8ed] px-3 py-2 md:px-5 md:py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Brand icon — a small play-button SVG inside a circular badge */}
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#fce8ed] border border-[#f0a0b8] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#e8789a">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-base md:text-lg text-[#e8789a] leading-none">Nailbox</h1>
            <p className="text-[9px] md:text-[10px] text-[#c090a0] tracking-widest uppercase">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* "Add Booking" button — opens the add modal with a fresh empty form */}
          <button
            onClick={() => { setAddForm({ ...EMPTY_FORM }); setShowAdd(true) }}
            className="flex items-center gap-1 md:gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-[#e8789a] hover:bg-[#c86080] text-white text-xs rounded-full transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            添加预约
          </button>
          {/* Logout button — clears the token and redirects to /admin/login */}
          <button onClick={logout} className="text-xs text-[#c090a0] hover:text-[#e8789a] px-2.5 py-1.5 md:px-3 border border-[#fce8ed] rounded-full transition-colors">
            退出
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-2 py-3 md:px-4 md:py-5">

        {/* ── Status Summary Cards ──────────────────────────────────────────── */}
        {/* Three cards displaying the count for each status.  Each card is
            also a toggle filter button: clicking it sets listFilter to that
            status (and clicking again clears the filter). */}
        <div className="grid grid-cols-3 gap-2 mb-3 md:gap-3 md:mb-5">
          {([
            { label: '待确认', key: 'pending'   as Status, color: 'text-amber-500',   active: 'border-amber-300 bg-amber-50' },
            { label: '已确认', key: 'confirmed' as Status, color: 'text-emerald-500', active: 'border-emerald-300 bg-emerald-50' },
            { label: '已拒绝', key: 'rejected'  as Status, color: 'text-rose-400',    active: 'border-rose-300 bg-rose-50' },
          ] as const).map(({ label, key, color, active }) => (
            <button
              key={key}
              // Toggle: if this filter is already active, clicking removes it.
              onClick={() => setListFilter(f => f === key ? null : key)}
              className={`rounded-2xl p-2.5 md:p-4 text-center shadow-sm border transition-all ${
                // Apply the active styling (coloured background + border) when
                // this card's status matches the current filter.
                listFilter === key ? active : 'bg-white border-[#fce8ed] hover:border-[#f0a0b8]'
              }`}
            >
              <p className={`text-2xl md:text-3xl font-light ${color}`}>{counts[key]}</p>
              <p className="text-[11px] md:text-xs text-[#c090a0] mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* ── Filtered Booking List ─────────────────────────────────────────── */}
        {/* Only rendered when the admin has clicked one of the stat cards.
            Shows all bookings that match the active status, sorted by date
            then by time slot, with a "collapse" button to dismiss the list. */}
        {listFilter && (
          <div className="bg-white border border-[#fce8ed] rounded-2xl shadow-sm mb-5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#fce8ed]">
              <p className="text-sm font-medium text-[#3d1230]">
                {STATUS_LABEL[listFilter]}
                {/* Show the count next to the title so it's obvious when empty */}
                <span className="text-[#c090a0] font-normal ml-1.5">
                  ({allBookings.filter(b => b.status === listFilter).length})
                </span>
              </p>
              {/* Collapse button — clears the filter to hide the list */}
              <button onClick={() => setListFilter(null)} className="text-xs text-[#c090a0] hover:text-[#e8789a] transition-colors">
                收起
              </button>
            </div>
            {allBookings.filter(b => b.status === listFilter).length === 0 ? (
              // Empty state — nothing to show for this status
              <p className="text-center py-8 text-sm text-[#c090a0]">暂无{STATUS_LABEL[listFilter]}预约</p>
            ) : (
              <div className="divide-y divide-[#fce8ed]">
                {allBookings
                  .filter(b => b.status === listFilter)
                  // Sort first by date (ascending), then by position in TIME_SLOTS
                  // so rows appear in chronological order within the list.
                  .sort((a, b) => a.date.localeCompare(b.date) || TIME_SLOTS.indexOf(a.time_slot) - TIME_SLOTS.indexOf(b.time_slot))
                  .map(b => (
                    // Each row opens the detail modal for that booking when clicked.
                    <div key={b.id} onClick={() => setSelected(b)}
                      className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-[#fff8fa] transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#c0507a]">{b.name}</span>
                          {/* Only show WeChat handle if one was provided */}
                          {b.wechat && <span className="text-[10px] text-[#c090a0]">微信 {b.wechat}</span>}
                        </div>
                        <p className="text-xs text-[#e8789a] mt-0.5">{b.date} · {b.time_slot}</p>
                        <p className="text-[10px] text-[#f0b0c8]">{b.basic_service_name}</p>
                      </div>
                      {/* Chevron right — visual affordance that the row is clickable */}
                      <svg className="w-4 h-4 text-[#f0b0c8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ── Weekly Calendar ───────────────────────────────────────────────── */}
        {/* The main scheduling surface.  Shows one row per day, with compact
            booking cards laid out horizontally within each row. */}
        <div className="bg-white border border-[#fce8ed] rounded-2xl shadow-sm overflow-hidden">

          {/* Week navigation bar — shows the current week range and prev/next arrows */}
          <div className="flex items-center justify-between px-3 py-2.5 md:px-5 md:py-4 border-b border-[#fce8ed]">
            {/* Previous week button — shifts weekStart back by 7 days */}
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="p-1.5 md:p-2 hover:bg-[#fff0f5] rounded-xl transition-colors"
            >
              <svg className="w-4 h-4 text-[#c090a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="text-center">
              {/* Human-readable date range label, e.g. "6月10日–16日" */}
              <p className="text-sm font-medium text-[#e8789a]">{weekRangeLabel(weekStart)}</p>
              {/* "本周" (This Week) badge — only shown when the displayed week is the current one */}
              {toDateStr(weekStart) === toDateStr(getWeekStart(now)) && (
                <p className="text-[10px] text-[#e8789a] mt-0.5">本周</p>
              )}
            </div>
            {/* Next week button — shifts weekStart forward by 7 days */}
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="p-1.5 md:p-2 hover:bg-[#fff0f5] rounded-xl transition-colors"
            >
              <svg className="w-4 h-4 text-[#c090a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* Day rows — one per day of the current week */}
          {loading ? (
            // Loading state — show a spinner placeholder while the fetch is in flight
            <div className="py-12 text-center text-sm text-[#c090a0]">加载中…</div>
          ) : (
            <div className="divide-y divide-[#fce8ed]">
              {weekDays.map((day, i) => {
                const dateStr     = toDateStr(day)
                // Get bookings for this day, sorted by time slot order.
                // Falls back to an empty array if no bookings exist for this date.
                const dayBookings = sortByTime(byDate[dateStr] ?? [])
                // Highlight today's row with a slightly tinted background
                const isToday     = dateStr === todayStr

                return (
                  <div key={i} className={`flex gap-2 px-2 py-2 md:gap-3 md:px-3 md:py-3 ${isToday ? 'bg-[#fff8fa]' : ''}`}>

                    {/* Day label column — weekday name, date number, and month */}
                    <div className="w-8 md:w-10 shrink-0 flex flex-col items-center pt-0.5">
                      {/* Weekday name in Chinese (周日 … 周六) — pink accent on today */}
                      <p className={`text-[9px] md:text-[10px] font-medium ${isToday ? 'text-[#e8789a]' : 'text-[#f0b0c8]'}`}>
                        {WEEKDAY_CN[day.getDay()]}
                      </p>
                      {/* Day-of-month number — larger font for scannability */}
                      <p className={`text-lg md:text-xl font-light leading-none mt-0.5 ${isToday ? 'text-[#e8789a]' : 'text-[#d07090]'}`}>
                        {day.getDate()}
                      </p>
                      {/* Month number — provides context when the week spans two months */}
                      <p className="text-[8px] md:text-[9px] text-[#f0b0c8] mt-0.5">{day.getMonth() + 1}月</p>
                    </div>

                    {/* Booking cards area — all bookings for this day laid out in a row.
                        Each card is fixed at 20% width so up to five cards can fit
                        before horizontal scrolling would be needed. */}
                    <div className="flex-1 flex gap-1 md:gap-1.5 items-stretch min-w-0">
                      {dayBookings.length === 0 ? (
                        // Empty day — show a dash placeholder
                        <p className="text-xs text-[#e8d8de] self-center py-2">—</p>
                      ) : (
                        dayBookings.map(b => (
                          // Individual booking card — clicking opens the detail modal.
                          // Background colour encodes status at a glance:
                          //   confirmed -> pink    (the standard "booked" look)
                          //   pending   -> amber   (needs the admin's attention)
                          //   rejected  -> grey, semi-transparent (visually de-emphasised)
                          <button
                            key={b.id}
                            onClick={() => setSelected(b)}
                            style={{ width: '20%', flexShrink: 0 }}
                            className={`text-left rounded-lg md:rounded-xl px-1.5 py-1.5 md:px-2 md:py-2 border transition-all active:scale-[0.97] overflow-hidden ${
                              b.status === 'confirmed'
                                ? 'bg-[#fce8ed] border-[#f0a0b8]'
                                : b.status === 'pending'
                                  ? 'bg-amber-50 border-amber-200'
                                  : 'bg-gray-50 border-gray-200 opacity-50'
                            }`}
                          >
                            {/* Customer name — most prominent element on the card */}
                            <p className="text-[10px] md:text-[11px] font-semibold text-[#c0507a] leading-snug">{b.name}</p>
                            {/* Start time in 24h format to save space */}
                            <p className="text-[9px] md:text-[10px] mt-0.5 text-[#e8789a]">{to24h(b.time_slot)}</p>
                            {/* Service duration in compact format, e.g. "1h30m" */}
                            <p className="text-[9px] md:text-[10px] text-[#f0b0c8]">{formatDuration(b.basic_service_duration)}</p>
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

        {/* ── "Back to This Week" Button ─────────────────────────────────────── */}
        {/* Only rendered when the admin has navigated away from the current week.
            Clicking it snaps the calendar back to the week containing today. */}
        {toDateStr(weekStart) !== toDateStr(getWeekStart(now)) && (
          <button
            onClick={() => setWeekStart(getWeekStart(now))}
            className="mt-3 w-full text-xs text-[#c090a0] hover:text-[#e8789a] py-2 border border-[#fce8ed] rounded-xl bg-white transition-colors"
          >
            回到本周
          </button>
        )}
      </div>

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      {/* Shown when the admin clicks on any booking card or list row.
          Displays all booking fields in a read-only grid, then offers
          context-sensitive action buttons based on the current status:
            pending   -> Confirm + Reject
            confirmed -> Mark Rejected
            rejected  -> Restore (re-confirm)
          A Delete button is always present regardless of status. */}
      {selected && (
        // Semi-transparent backdrop — clicking it dismisses the modal.
        // On mobile the modal slides up from the bottom; on larger screens it centres.
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          {/* Modal panel — stopPropagation prevents clicks inside from
              bubbling up to the backdrop and accidentally closing the modal. */}
          <div className="bg-white rounded-2xl border border-[#fce8ed] w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-serif text-lg text-[#3d1230]">预约详情</h2>
              <button onClick={() => setSelected(null)} className="text-[#c090a0] hover:text-[#9a4065]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {/* Status badge — colour-coded pill matching the status card colours */}
            <p className={`text-xs mb-4 px-2 py-0.5 rounded-full border w-fit ${
              selected.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
              selected.status === 'pending'   ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                               'bg-rose-50 text-rose-400 border-rose-200'
            }`}>{STATUS_LABEL[selected.status]}</p>

            {/* Booking detail rows — built from an array so we can easily filter
                out null entries for optional fields (WeChat, add-ons, notes). */}
            <div className="space-y-2.5 text-sm mb-5">
              {[
                { label: '姓名',     value: selected.name },
                { label: '邮箱',     value: selected.email },
                // Only include WeChat if the customer provided it
                selected.wechat ? { label: '微信', value: selected.wechat } : null,
                { label: '日期',     value: selected.date },
                { label: '时间',     value: selected.time_slot },
                { label: '基础服务', value: selected.basic_service_name },
                // Only include add-ons if at least one was selected
                selected.addon_services?.length > 0
                  ? { label: '增值服务', value: selected.addon_services.map(a => a.name).join('、') }
                  : null,
                // Only include notes if the customer left a message
                selected.notes ? { label: '备注', value: selected.notes } : null,
              ].filter(Boolean).map(row => (
                <div key={row!.label} className="flex gap-3">
                  {/* Label column — fixed width so all labels align vertically */}
                  <span className="text-[#c090a0] shrink-0 w-16">{row!.label}</span>
                  <span className="text-[#3d1230]">{row!.value}</span>
                </div>
              ))}
            </div>

            {/* Action buttons — which buttons appear depends on the current status */}
            <div className="flex gap-2">
              {/* Pending bookings get both Confirm and Reject */}
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
              {/* Confirmed bookings can be rejected (e.g. last-minute cancellation) */}
              {selected.status === 'confirmed' && (
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'rejected')}
                  className="flex-1 py-2.5 text-sm bg-rose-50 hover:bg-rose-100 text-rose-400 border border-rose-200 rounded-xl disabled:opacity-50 transition-colors">
                  标记已拒绝
                </button>
              )}
              {/* Rejected bookings can be reinstated if the situation changes */}
              {selected.status === 'rejected' && (
                <button disabled={acting} onClick={() => updateStatus(selected.id, 'confirmed')}
                  className="flex-1 py-2.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl disabled:opacity-50 transition-colors">
                  恢复确认
                </button>
              )}
              {/* Delete button — always visible; opens the confirmation dialog.
                  The detail modal closes first (setSelected(null)) to avoid two
                  overlapping modals on screen simultaneously. */}
              <button disabled={acting} onClick={() => { setDeleteConfirm(selected); setSelected(null) }}
                className="px-4 py-2.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200 rounded-xl disabled:opacity-50 transition-colors">
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {/* A focused "Are you sure?" dialog that appears after the admin clicks
          Delete in the detail modal.  Requires an explicit second click on the
          red "Delete" button before the irreversible action is taken. */}
      {deleteConfirm && (
        // Backdrop click cancels the deletion
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl border border-[#fce8ed] w-full max-w-sm p-6 shadow-xl text-center" onClick={e => e.stopPropagation()}>
            <p className="text-[#3d1230] font-medium mb-1">确认删除？</p>
            {/* Repeat the customer name, date, and time so the admin can
                double-check they are deleting the correct booking. */}
            <p className="text-sm text-[#c090a0] mb-5">{deleteConfirm.name} · {deleteConfirm.date} {deleteConfirm.time_slot}</p>
            <div className="flex gap-3">
              {/* Cancel — closes the dialog without taking any action */}
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm border border-[#fce8ed] text-[#c090a0] hover:bg-[#fff0f5] rounded-xl transition-colors">取消</button>
              {/* Confirm delete — triggers the actual API DELETE request */}
              <button disabled={acting} onClick={() => deleteBooking(deleteConfirm.id)}
                className="flex-1 py-2.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-xl disabled:opacity-50 transition-colors">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Booking Modal ──────────────────────────────────────────────── */}
      {/* A scrollable form modal for manually creating a booking.
          Required fields: name, date, time slot, basic service.
          Optional fields: email, WeChat, add-on services, notes, status.
          The submit button is disabled until all required fields are filled. */}
      {showAdd && (
        // Backdrop click closes the modal without saving
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50" onClick={() => setShowAdd(false)}>
          {/* max-h-[90vh] + overflow-y-auto allows the form to scroll on small screens */}
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
              {/* Row 1: Name (required) + Email (optional) — side by side on wider screens */}
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
              {/* WeChat handle — optional, used for customers who prefer messaging over email */}
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">微信</label>
                <input value={addForm.wechat} onChange={e => setAddForm(f => ({ ...f, wechat: e.target.value }))}
                  placeholder="微信号（选填）" className={inputCls} />
              </div>
              {/* Row 2: Date (required) + Time slot (required) — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#9a4065] mb-1">日期 *</label>
                  <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-[#9a4065] mb-1">时间 *</label>
                  {/* Select rendered from TIME_SLOTS so it always matches the server's valid slots */}
                  <select value={addForm.timeSlot} onChange={e => setAddForm(f => ({ ...f, timeSlot: e.target.value }))} className={inputCls}>
                    <option value="">选择时间</option>
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {/* Basic service — required; options pulled from the shared services data module */}
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">基础服务 *</label>
                <select value={addForm.basicServiceId} onChange={e => setAddForm(f => ({ ...f, basicServiceId: e.target.value }))} className={inputCls}>
                  <option value="">选择服务</option>
                  {basicServices.map(s => <option key={s.id} value={s.id}>{s.name}（{s.price}）</option>)}
                </select>
              </div>
              {/* Add-on services — optional multi-select rendered as styled checkboxes.
                  We use custom checkbox styling instead of a native <select multiple>
                  to match the app's design and improve mobile usability. */}
              <div>
                <label className="block text-xs text-[#9a4065] mb-2">增值服务（多选）</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {addonServices.map(s => {
                    // Whether this add-on is currently selected in the form
                    const checked = addForm.addonServiceIds.includes(s.id)
                    return (
                      <label key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        // Highlighted border + pink tint when selected
                        checked ? 'bg-[#fce8ed] border-[#e8789a] text-[#3d1230]' : 'border-[#fce8ed] text-[#9a4065] hover:border-[#f0a0b8]'
                      }`}>
                        {/* Hidden native checkbox — visual state is rendered by the span below */}
                        <input type="checkbox" checked={checked} className="sr-only"
                          onChange={() => setAddForm(f => ({
                            ...f,
                            // Toggle: remove the ID if it was already in the list,
                            // otherwise append it.
                            addonServiceIds: checked
                              ? f.addonServiceIds.filter(id => id !== s.id)
                              : [...f.addonServiceIds, s.id],
                          }))} />
                        {/* Custom checkbox indicator — filled pink when checked */}
                        <span className={`w-3 h-3 rounded border shrink-0 flex items-center justify-center ${checked ? 'bg-[#e8789a] border-[#e8789a]' : 'border-[#f0a0b8]'}`}>
                          {checked && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                        </span>
                        {s.name}
                      </label>
                    )
                  })}
                </div>
              </div>
              {/* Notes — optional free-text field for special requests or context */}
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">备注</label>
                <textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="备注（选填）" className={inputCls + ' resize-none'} />
              </div>
              {/* Status — defaults to "confirmed" for admin-created bookings since they
                  are typically pre-agreed appointments that skip the review queue. */}
              <div>
                <label className="block text-xs text-[#9a4065] mb-1">状态</label>
                <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as Status }))} className={inputCls}>
                  <option value="confirmed">已确认</option>
                  <option value="pending">待确认</option>
                </select>
              </div>
            </div>

            {/* Submit button — disabled both while saving and when required fields are missing */}
            <button
              disabled={addSaving || !addForm.name || !addForm.date || !addForm.timeSlot || !addForm.basicServiceId}
              onClick={submitAdd}
              className="mt-5 w-full py-3 bg-[#e8789a] hover:bg-[#c86080] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-full transition-colors"
            >
              {/* Label changes to indicate in-flight state so the admin knows their
                  click was registered and the request is being processed. */}
              {addSaving ? '保存中…' : '保存预约'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
