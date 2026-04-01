/**
 * BookingForm.tsx
 *
 * The primary customer-facing booking form for Nail Box 11.
 * Allows customers to select a date, time slot, nail services (basic + add-ons),
 * provide their contact info, and submit a reservation to the backend API.
 *
 * Key behaviors:
 * - Fetches real-time availability from the server whenever the selected date
 *   or basic service changes, so booked time slots are visually disabled.
 * - Validates all required fields client-side before sending the POST request.
 * - Handles optimistic conflict detection: if a 409 is returned (slot just got
 *   taken by another user), it refreshes availability and shows an error.
 * - Renders a confirmation summary screen after a successful submission.
 * - Supports bilingual display (Chinese / English) via the useLang context.
 */

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import type { BookingFormData, FormErrors } from '../types'
import { basicServices, addonServices } from '../data/services'
import { useLang } from '../context/LangContext'
import type { TKey } from '../i18n'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Base URL for all API requests.
 * Pulled from the VITE_API_URL environment variable at build time.
 * Falls back to an empty string so relative paths work in same-origin deploys.
 */
const API = import.meta.env.VITE_API_URL ?? ''

/**
 * The complete ordered list of bookable time slots for any given day.
 * These are displayed as a grid of toggle buttons in the UI.
 * The backend controls which of these are actually available for a given date
 * and service — we receive that list via the /availability endpoint.
 */
const ALL_TIME_SLOTS = [
  '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
]

/**
 * The blank starting state for the booking form.
 * Used both for initial render and after a successful booking when the user
 * clicks "Book Again" to reset everything.
 */
const INITIAL_FORM: BookingFormData = {
  name: '', email: '', wechat: '', date: '', time: '',
  basicService: '', addonServices: [], notes: '',
}

// ---------------------------------------------------------------------------
// Pure helper: form validation
// ---------------------------------------------------------------------------

/**
 * Validates the booking form data and returns an object containing any field
 * errors. An empty object means the form is valid and can be submitted.
 *
 * @param data - The current form values to validate.
 * @param tv   - The translation function (aliased to `t` from useLang) used to
 *               produce localised error messages.
 * @returns    A `FormErrors` map where each key is a field name and the value
 *             is the translated error string to display beneath that field.
 */
function validate(data: BookingFormData, tv: (k: TKey) => string): FormErrors {
  const errors: FormErrors = {}

  // Name is required — reject blank / whitespace-only values
  if (!data.name.trim()) errors.name = tv('err_name')

  // Email is required AND must look like a valid address
  if (!data.email.trim()) {
    errors.email = tv('err_email')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    // Simple structural check: local-part @ domain . tld — no whitespace
    errors.email = tv('err_email_inv')
  }

  // Date is required and must not be in the past
  if (!data.date) {
    errors.date = tv('err_date')
  } else {
    // Append midnight so the Date constructor uses local time, not UTC midnight
    // (which could roll back to yesterday in western time zones)
    const selected = new Date(data.date + 'T00:00:00')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (selected < today) errors.date = tv('err_date_past')
  }

  // Time slot must be selected
  if (!data.time) errors.time = tv('err_time')

  // At least one basic (main) service must be chosen
  if (!data.basicService) errors.basicService = tv('err_service')

  return errors
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * InputField
 *
 * A reusable wrapper that renders a labelled form field with optional
 * bilingual label, required indicator, and inline error message.
 * The actual input element is passed as `children` so this component stays
 * agnostic about the input type (text, email, date, select, textarea…).
 *
 * @param label    - Primary (Chinese) label text.
 * @param labelEn  - Optional secondary English label shown in a lighter colour.
 * @param required - When true, renders a pink asterisk to mark the field as mandatory.
 * @param error    - If present, renders an error message below the input.
 * @param children - The actual `<input>`, `<select>`, or `<textarea>` element.
 */
function InputField({ label, labelEn, required, error, children }: {
  label: string; labelEn?: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      {/* Label row: primary label + optional English subtitle + required star */}
      <label className="block text-sm text-[#9a4065] mb-1.5">
        {label}
        {labelEn && <span className="text-[#c090a0] text-xs ml-1">/ {labelEn}</span>}
        {required && <span className="text-[#e8789a] ml-1">*</span>}
      </label>

      {/* The actual form control rendered by the parent */}
      {children}

      {/* Inline validation error — only shown when `error` is non-empty */}
      {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
    </div>
  )
}

/**
 * inputClass
 *
 * Returns a Tailwind class string for a standard text/date/select input.
 * The border and focus-ring colours change depending on whether the field
 * currently has a validation error, providing a clear visual cue.
 *
 * @param error - Pass the error string (or undefined) for the field.
 *                When truthy the input gets red-tinted border styles.
 * @returns A complete className string ready to spread onto an input element.
 */
const inputClass = (error?: string) =>
  `w-full px-4 py-3 rounded-xl border bg-white text-sm text-[#c0507a] placeholder-[#d0a0b0] outline-none transition-all ${
    error
      ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
      : 'border-[#fce8ed] focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10'
  }`

/**
 * FormSection
 *
 * A decorative section heading used to visually group related fields inside
 * the form (e.g. "Contact Info", "Services", "Date & Time").
 * Renders a serif Chinese title alongside a lighter English subtitle,
 * separated from the fields below by a faint horizontal rule.
 *
 * @param title - Chinese section title.
 * @param en    - English section title shown as a lighter annotation.
 */
function FormSection({ title, en }: { title: string; en: string }) {
  return (
    <div className="pb-2 border-b border-[#fce8ed] mb-5">
      <h3 className="font-serif text-lg text-[#c0507a]">
        {title}
        <span className="text-sm font-sans text-[#c090a0] ml-2 font-normal">/ {en}</span>
      </h3>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * BookingForm
 *
 * The top-level booking experience. Manages all form state, API calls, and
 * renders either the interactive form or a post-submission confirmation screen.
 *
 * State summary:
 * - `form`         — Current field values (name, email, date, time, services…)
 * - `errors`       — Per-field validation error messages shown inline
 * - `submitted`    — True after a successful API response; triggers success view
 * - `sending`      — True while the POST request is in-flight; disables submit
 * - `sendError`    — Non-field API error shown in a banner (network fail, conflict…)
 * - `bookedSlots`  — List of time strings already taken for the selected date/service
 * - `loadingSlots` — True while the availability check is in-flight
 */
export default function BookingForm() {
  // Pull the active language and translation helper from global context
  const { lang, t } = useLang()

  /**
   * svcName — picks the right language variant of a service name.
   * When the UI is in Chinese mode, use `name`; otherwise use `nameEn`.
   * This is called for every service label rendered in the form.
   */
  const svcName = (name: string, nameEn: string) => lang === 'zh' ? name : nameEn

  // ---- Form field state ----
  const [form, setForm]           = useState<BookingFormData>(INITIAL_FORM)

  // ---- Validation errors (per field) ----
  const [errors, setErrors]       = useState<FormErrors>({})

  // ---- Submission lifecycle flags ----
  const [submitted, setSubmitted] = useState(false)   // show success screen?
  const [sending, setSending]     = useState(false)   // POST in-flight?
  const [sendError, setSendError] = useState<string | null>(null) // API-level error

  // ---- Time slot availability ----
  const [bookedSlots, setBookedSlots]   = useState<string[]>([])   // slots already taken
  const [loadingSlots, setLoadingSlots] = useState(false)          // fetching availability?

  /**
   * today — ISO date string for the current local date (YYYY-MM-DD).
   * Used as the `min` attribute on the date input to prevent selecting past dates
   * at the browser level (the server also validates this).
   */
  const today = new Date().toISOString().split('T')[0]

  // -------------------------------------------------------------------------
  // Side-effect: fetch time-slot availability
  // -------------------------------------------------------------------------

  /**
   * Whenever the user changes the date OR switches the basic service, we hit
   * the availability endpoint to learn which time slots are already booked.
   * Including the basic service ID lets the server factor in appointment
   * duration when calculating conflicts (longer services block more slots).
   *
   * On fetch failure we silently swallow the error and leave bookedSlots empty
   * so all times appear selectable — a conservative, user-friendly fallback
   * (the server will reject true conflicts at submit time).
   */
  useEffect(() => {
    // Nothing to fetch until the user has picked a date
    if (!form.date) { setBookedSlots([]); return }

    setLoadingSlots(true)
    const params = new URLSearchParams({ date: form.date })

    // Optionally include the service so the server can account for duration
    if (form.basicService) params.set('basic_service_id', form.basicService)

    fetch(`${API}/api/bookings/availability?${params}`)
      .then((r) => r.json())
      .then((data) => { setBookedSlots(data.booked ?? []) })
      .catch(() => { /* silently ignore — all slots shown as available */ })
      .finally(() => setLoadingSlots(false))
  }, [form.date, form.basicService])
  // Re-runs only when date or basicService changes — avoids unnecessary fetches

  // -------------------------------------------------------------------------
  // Side-effect: clear selected time if it just became booked
  // -------------------------------------------------------------------------

  /**
   * After bookedSlots refreshes (e.g. service change altered conflict windows),
   * if the currently selected time is now in the booked list, deselect it so
   * the user is forced to consciously choose a valid slot.
   * This avoids silently submitting a slot that the server would reject.
   */
  useEffect(() => {
    if (form.time && bookedSlots.includes(form.time)) {
      setForm((prev) => ({ ...prev, time: '' }))
    }
  }, [bookedSlots])
  // Only depends on bookedSlots; form.time is intentionally omitted from deps
  // to avoid an infinite loop (clearing time would re-trigger this effect).

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  /**
   * clearError — removes a single field's error from the errors map.
   * Called as soon as the user starts editing a previously errored field,
   * giving immediate feedback that the problem may be resolved.
   *
   * @param field - The FormErrors key whose error should be cleared.
   */
  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  /**
   * handleChange — generic onChange handler wired to all standard inputs
   * (text, email, date, select, textarea).
   *
   * Uses the input's `name` attribute to update the correct field in form state
   * via a computed property key, keeping a single handler for all field types.
   * Also clears the field's validation error on change so the red state
   * disappears as the user types.
   *
   * @param e - The synthetic change event from any HTMLInputElement,
   *            HTMLSelectElement, or HTMLTextAreaElement.
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Spread previous state and override only the changed field
    setForm((prev) => ({ ...prev, [name]: value }))

    // Clear inline error for validated fields as soon as user edits them
    const validated: (keyof FormErrors)[] = ['name', 'email', 'date', 'time', 'basicService']
    if (validated.includes(name as keyof FormErrors)) clearError(name as keyof FormErrors)
  }

  /**
   * toggleAddon — adds or removes an add-on service ID from the selection.
   * Uses XOR-style logic: if the id is already in the array, filter it out;
   * otherwise append it. No validation needed — add-ons are always optional.
   *
   * @param id - The unique identifier of the add-on service to toggle.
   */
  const toggleAddon = (id: string) => {
    setForm((prev) => ({
      ...prev,
      addonServices: prev.addonServices.includes(id)
        ? prev.addonServices.filter((s) => s !== id)   // deselect
        : [...prev.addonServices, id],                  // select
    }))
  }

  /**
   * handleSubmit — async form submission handler.
   *
   * Flow:
   * 1. Prevent native browser form submission.
   * 2. Run client-side validation; if errors exist, surface them and scroll
   *    the first errored field into view, then abort.
   * 3. POST the booking payload to the API.
   * 4. Handle a 409 conflict (slot taken between page load and submit) by
   *    refreshing availability, clearing the time field, and showing a banner.
   * 5. Handle other non-OK responses with a generic error banner.
   * 6. On success, flip `submitted` to true to render the confirmation screen.
   * 7. On network failure, show a network error banner.
   * 8. Always clear the sending spinner in the `finally` block.
   *
   * @param e - The form's submit event.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Run client-side validation before touching the network
    const errs = validate(form, t)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Scroll the first field with `data-error` attribute into the viewport
      // so the user doesn't have to hunt for what went wrong
      document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSending(true); setSendError(null)

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Map frontend field names to the snake_case / camelCase API contract
        body: JSON.stringify({
          name:            form.name.trim(),
          email:           form.email.trim(),
          wechat:          form.wechat.trim(),
          date:            form.date,
          timeSlot:        form.time,
          basicServiceId:  form.basicService,
          addonServiceIds: form.addonServices,
          notes:           form.notes.trim(),
        }),
      })

      if (res.status === 409) {
        // Slot was taken between when the user loaded availability and now.
        // Refresh availability so the UI immediately reflects reality, then
        // clear the selected time and ask the user to pick another.
        const params = new URLSearchParams({ date: form.date })
        if (form.basicService) params.set('basic_service_id', form.basicService)
        const avail = await fetch(`${API}/api/bookings/availability?${params}`).then((r) => r.json())
        setBookedSlots(avail.booked ?? [])
        setForm((prev) => ({ ...prev, time: '' }))
        setSendError(t('err_conflict'))
        return
      }

      if (!res.ok) {
        // Some other server error — try to surface the API's own error message,
        // falling back to a generic localised string
        const body = await res.json().catch(() => ({}))
        setSendError(body.error ?? t('err_fail'))
        return
      }

      // All good — transition to the success confirmation view
      setSubmitted(true)
    } catch {
      // Network-level failure (no connection, CORS block, etc.)
      setSendError(t('err_network'))
    } finally {
      // Always re-enable the submit button regardless of outcome
      setSending(false)
    }
  }

  // =========================================================================
  // Success / confirmation screen
  // =========================================================================

  /**
   * After a successful booking submission we replace the form entirely with a
   * read-only summary of what was booked. This is simpler and less error-prone
   * than showing both simultaneously.
   */
  if (submitted) {
    // Resolve the service objects from IDs so we can display their names
    const basic  = basicServices.find((s) => s.id === form.basicService)
    const addons = addonServices.filter((s) => form.addonServices.includes(s.id))

    return (
      <section id="booking" className="py-24 px-6 bg-[#fff5f8]">
        <div className="max-w-lg mx-auto text-center">

          {/* Animated checkmark icon in a circular badge */}
          <div className="w-16 h-16 rounded-full bg-[#fce8ed] border border-[#f0a0b8] flex items-center justify-center mx-auto mb-6">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#e8789a" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          {/* Heading + subtitle */}
          <h2 className="font-serif text-3xl text-[#c0507a] mb-1">{t('success_title')}</h2>
          <p className="font-serif text-[#e8789a] italic mb-3">{t('success_en')}</p>
          <p className="text-sm text-[#9a4065] mb-8">{t('success_note')}</p>

          {/* Booking summary card — only non-null rows are rendered */}
          <div className="text-left bg-white border border-[#fce8ed] rounded-2xl p-6 space-y-3 shadow-sm">
            {[
              { label: t('f_name'),  value: form.name },
              { label: t('f_email'), value: form.email },
              // WeChat is optional — only include the row if the user provided it
              form.wechat ? { label: t('f_wechat'), value: form.wechat } : null,
              { label: t('f_date'),  value: form.date },
              { label: t('f_time'),  value: form.time },
              // Show the resolved service name in the active language
              basic ? { label: t('basic_req'), value: svcName(basic.name, basic.nameEn) } : null,
              // Join multiple add-ons with the Chinese enumeration separator
              addons.length > 0 ? { label: t('addon_label'), value: addons.map((a) => svcName(a.name, a.nameEn)).join('、') } : null,
            ].filter(Boolean).map((row) => (
              // Each row is a label/value pair; key on label since it's unique
              <div key={row!.label} className="flex justify-between gap-4 text-sm">
                <span className="text-[#c090a0] shrink-0">{row!.label}</span>
                <span className="text-[#c0507a] text-right">{row!.value}</span>
              </div>
            ))}
          </div>

          {/* Reminder to add the salon's WeChat for confirmation */}
          <p className="text-xs text-[#c090a0] mt-6 leading-relaxed">
            {t('success_wechat')}<span className="text-[#e8789a] font-medium"> nailbox11</span>
          </p>

          {/* "Book Again" — resets the entire form back to its initial blank state */}
          <button
            onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); setErrors({}); setBookedSlots([]) }}
            className="mt-8 px-6 py-2.5 border border-[#f0a0b8] text-[#e8789a] hover:bg-[#fce8ed] text-sm rounded-full transition-colors"
          >
            {t('rebook')}
          </button>
        </div>
      </section>
    )
  }

  // =========================================================================
  // Main booking form
  // =========================================================================

  return (
    <section id="booking" className="py-24 px-6 bg-[#fff5f8]">
      <div className="max-w-2xl mx-auto">

        {/* Section header with eyebrow text and decorative diamond divider */}
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.42em] uppercase text-[#c090a0] mb-3">{t('book_eyebrow')}</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#c0507a] font-light">{t('book_title')}</h2>
          {/* Decorative horizontal rule with a diamond SVG centrepiece */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="w-10 h-px bg-[#f9d0da]" />
            <svg width="8" height="8" viewBox="0 0 12 12">
              <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a" />
            </svg>
            <div className="w-10 h-px bg-[#f9d0da]" />
          </div>
        </div>

        {/*
          noValidate disables the browser's own validation bubbles so we can
          control the validation UX ourselves (inline errors, smooth scroll, etc.)
        */}
        <form onSubmit={handleSubmit} noValidate className="space-y-10">

          {/* ----------------------------------------------------------------
              Section 1: Contact Information
          ---------------------------------------------------------------- */}
          <div>
            <FormSection title={t('book_contact')} en={t('book_contact_en')} />
            <div className="grid sm:grid-cols-2 gap-5">

              {/*
                data-error is set to `true` (not undefined) when the field has
                an error, so `document.querySelector('[data-error]')` in
                handleSubmit can find and scroll to the first broken field.
              */}
              <div data-error={errors.name ? true : undefined}>
                <InputField label={t('f_name')} required error={errors.name}>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder={t('f_name')} className={inputClass(errors.name)} />
                </InputField>
              </div>

              <div data-error={errors.email ? true : undefined}>
                <InputField label={t('f_email')} labelEn={t('f_email_en')} required error={errors.email}>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputClass(errors.email)} />
                </InputField>
              </div>

              {/* WeChat is optional — spans full width on desktop for visual balance */}
              <div className="sm:col-span-2">
                <InputField label={t('f_wechat')} labelEn={t('f_wechat_en')}>
                  <input type="text" name="wechat" value={form.wechat} onChange={handleChange} placeholder={t('f_wechat_ph')} className={inputClass()} />
                </InputField>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------
              Section 2: Service Selection
          ---------------------------------------------------------------- */}
          <div>
            <FormSection title={t('book_svc')} en={t('book_svc_en')} />

            {/* ---- Basic (main) service — radio-style single select ---- */}
            <div className="mb-8" data-error={errors.basicService ? true : undefined}>
              <p className="text-sm text-[#9a4065] mb-3">
                {t('basic_req')}<span className="text-[#e8789a] ml-1">*</span>
                <span className="text-xs text-[#c090a0] ml-2">{t('basic_note')}</span>
              </p>
              <div className="space-y-3">
                {basicServices.map((service) => {
                  const selected = form.basicService === service.id
                  return (
                    /*
                     * The entire card is the <label>, so clicking anywhere on it
                     * activates the visually hidden <input type="radio"> at the bottom.
                     * The custom radio dot is drawn with divs and toggled via `selected`.
                     */
                    <label
                      key={service.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selected ? 'bg-[#fce8ed] border-[#e8789a]' : 'bg-white border-[#fce8ed] hover:border-[#f0a0b8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom radio indicator: outer ring + inner filled dot when selected */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-[#e8789a]' : 'border-[#f0a0b8]'}`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-[#e8789a]" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#c0507a]">{svcName(service.name, service.nameEn)}</p>
                          {/* Duration hint is optional — not all services have it */}
                          {service.duration && <p className="text-xs text-[#c090a0]">{service.duration}</p>}
                        </div>
                      </div>
                      {/* Price pinned to the right side of the card */}
                      <span className="text-sm font-medium text-[#e8789a] ml-4 shrink-0">{service.price}</span>
                      {/* sr-only: visually hidden but used by the browser for form state */}
                      <input type="radio" name="basicService" value={service.id} checked={selected} onChange={handleChange} className="sr-only" />
                    </label>
                  )
                })}
              </div>
              {/* Field-level validation error for the service group */}
              {errors.basicService && <p className="text-xs text-rose-400 mt-2">{errors.basicService}</p>}
            </div>

            {/* ---- Add-on services — checkbox-style multi-select ---- */}
            <div>
              <p className="text-sm text-[#9a4065] mb-3">
                {t('addon_label')}<span className="text-xs text-[#c090a0] ml-2">{t('addon_note')}</span>
              </p>
              {/* Two-column grid to make efficient use of horizontal space */}
              <div className="grid sm:grid-cols-2 gap-2.5">
                {addonServices.map((service) => {
                  const checked = form.addonServices.includes(service.id)
                  return (
                    /*
                     * Same label-wraps-input pattern as the basic service cards,
                     * but using toggleAddon() instead of handleChange because
                     * checkboxes require array management rather than simple assignment.
                     */
                    <label
                      key={service.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        checked ? 'bg-[#fce8ed] border-[#e8789a]' : 'bg-white border-[#fce8ed] hover:border-[#f0a0b8]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom checkbox: square with fill + checkmark SVG when checked */}
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'border-[#e8789a] bg-[#e8789a]' : 'border-[#f0a0b8]'}`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#c0507a] leading-snug">{svcName(service.name, service.nameEn)}</p>
                          {service.duration && <p className="text-[10px] text-[#c090a0]">{service.duration}</p>}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#e8789a] ml-2 shrink-0">{service.price}</span>
                      {/* Visually hidden checkbox — state is managed by toggleAddon */}
                      <input type="checkbox" checked={checked} onChange={() => toggleAddon(service.id)} className="sr-only" />
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------
              Section 3: Date & Time
          ---------------------------------------------------------------- */}
          <div>
            <FormSection title={t('book_time')} en={t('book_time_en')} />

            {/* Date picker — `min` prevents selecting past dates at browser level */}
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div data-error={errors.date ? true : undefined} className="sm:col-span-2">
                <InputField label={t('f_date')} labelEn={t('f_date_en')} required error={errors.date}>
                  <input type="date" name="date" value={form.date} onChange={handleChange} min={today} className={inputClass(errors.date)} />
                </InputField>
              </div>
            </div>

            {/* ---- Time slot grid ---- */}
            <div data-error={errors.time ? true : undefined}>
              <p className="text-sm text-[#9a4065] mb-3">
                {t('f_time')}<span className="text-[#e8789a] ml-1">*</span>
                {/* Inline loading indicator while fetching booked slots */}
                {loadingSlots && <span className="text-xs text-[#c090a0] ml-2">{t('checking')}</span>}
              </p>

              {/*
                Render every possible time slot as a button.
                - Booked slots are `disabled` and styled grey to signal unavailability.
                - The selected slot gets a filled pink background.
                - Available unselected slots have a hover state for discoverability.
              */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {ALL_TIME_SLOTS.map((slot) => {
                  const booked   = bookedSlots.includes(slot)
                  const selected = form.time === slot
                  return (
                    <button
                      key={slot}
                      type="button"         // Prevent accidental form submission
                      disabled={booked}
                      onClick={() => {
                        if (!booked) {
                          // Update the form's time field and clear its error
                          setForm((prev) => ({ ...prev, time: slot }))
                          clearError('time')
                        }
                      }}
                      className={`relative py-3 px-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        booked
                          ? 'bg-[#fafafa] border-[#ede8ea] text-[#d0b8c0] cursor-not-allowed'
                          : selected
                            ? 'bg-[#e8789a] border-[#e8789a] text-white shadow-md'
                            : 'bg-white border-[#fce8ed] text-[#c0507a] hover:border-[#e8789a] hover:bg-[#fff0f5]'
                      }`}
                    >
                      {slot}
                      {/* Secondary "Booked" label shown below the time for taken slots */}
                      {booked && (
                        <span className="block text-[10px] font-normal mt-0.5 text-[#d0b8c0]">{t('booked')}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Inline validation error for the time field */}
              {errors.time && <p className="text-xs text-rose-400 mt-2">{errors.time}</p>}
            </div>
          </div>

          {/* ----------------------------------------------------------------
              Section 4: Additional Notes (optional free-text)
          ---------------------------------------------------------------- */}
          <div>
            <FormSection title={t('book_notes')} en={t('book_notes_en')} />
            {/*
              resize-none prevents the textarea from being dragged taller by the user,
              which could break the form layout on small screens.
            */}
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder={t('notes_ph')} className={inputClass() + ' resize-none'} />
          </div>

          {/* ----------------------------------------------------------------
              API-level error banner (shown below notes, above submit button)
              Appears for network failures, scheduling conflicts, or server errors.
          ---------------------------------------------------------------- */}
          {sendError && (
            <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-500 text-center">
              {sendError}
            </div>
          )}

          {/* ----------------------------------------------------------------
              Submit button
              Shows a spinner SVG + localised "submitting…" text while in-flight.
              Disabled state prevents double-submission.
          ---------------------------------------------------------------- */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-[#e8789a] hover:bg-[#c86080] disabled:opacity-60 disabled:cursor-not-allowed text-white tracking-[0.22em] text-sm uppercase rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  {/* Tailwind `animate-spin` rotates this circular SVG 360° continuously */}
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  {t('submitting')}
                </>
              ) : t('submit')}
            </button>

            {/* Fine-print note below the button (e.g. deposit / cancellation policy) */}
            <p className="text-center text-xs text-[#c090a0] mt-4">{t('submit_note')}</p>
          </div>
        </form>
      </div>
    </section>
  )
}
