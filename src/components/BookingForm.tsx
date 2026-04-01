import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import type { BookingFormData, FormErrors } from '../types'
import { basicServices, addonServices } from '../data/services'

const API = import.meta.env.VITE_API_URL ?? ''
const ALL_TIME_SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '5:00 PM']

const INITIAL_FORM: BookingFormData = {
  name: '', email: '', wechat: '', date: '', time: '',
  basicService: '', addonServices: [], notes: '',
}

function validate(data: BookingFormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.name.trim()) errors.name = '请填写您的姓名'
  if (!data.email.trim()) {
    errors.email = '请填写邮箱地址'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = '请输入有效的邮箱地址'
  }
  if (!data.date) {
    errors.date = '请选择预约日期'
  } else {
    const selected = new Date(data.date + 'T00:00:00')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (selected < today) errors.date = '请选择今天或之后的日期'
  }
  if (!data.time) errors.time = '请选择预约时间'
  if (!data.basicService) errors.basicService = '请选择一项基础服务'
  return errors
}

function InputField({ label, labelEn, required, error, children }: {
  label: string; labelEn?: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm text-[#9a4065] mb-1.5">
        {label}
        {labelEn && <span className="text-[#c090a0] text-xs ml-1">/ {labelEn}</span>}
        {required && <span className="text-[#e8789a] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
    </div>
  )
}

const inputClass = (error?: string) =>
  `w-full px-4 py-3 rounded-xl border bg-white text-sm text-[#3d1230] placeholder-[#d0a0b0] outline-none transition-all ${
    error
      ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
      : 'border-[#fce8ed] focus:border-[#e8789a] focus:ring-2 focus:ring-[#e8789a]/10'
  }`

function FormSection({ title, en }: { title: string; en: string }) {
  return (
    <div className="pb-2 border-b border-[#fce8ed] mb-5">
      <h3 className="font-serif text-lg text-[#3d1230]">
        {title}
        <span className="text-sm font-sans text-[#c090a0] ml-2 font-normal">/ {en}</span>
      </h3>
    </div>
  )
}

export default function BookingForm() {
  const [form, setForm]           = useState<BookingFormData>(INITIAL_FORM)
  const [errors, setErrors]       = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending]     = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // Fetch availability whenever date or basic service changes
  useEffect(() => {
    if (!form.date) { setBookedSlots([]); return }
    setLoadingSlots(true)
    const params = new URLSearchParams({ date: form.date })
    if (form.basicService) params.set('basic_service_id', form.basicService)
    fetch(`${API}/api/bookings/availability?${params}`)
      .then((r) => r.json())
      .then((data) => { setBookedSlots(data.booked ?? []) })
      .catch(() => { /* silently ignore — all slots shown as available */ })
      .finally(() => setLoadingSlots(false))
  }, [form.date, form.basicService])

  // When basic service changes, if current time slot became booked, clear it
  useEffect(() => {
    if (form.time && bookedSlots.includes(form.time)) {
      setForm((prev) => ({ ...prev, time: '' }))
    }
  }, [bookedSlots])

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    const validated: (keyof FormErrors)[] = ['name', 'email', 'date', 'time', 'basicService']
    if (validated.includes(name as keyof FormErrors)) clearError(name as keyof FormErrors)
  }

  const toggleAddon = (id: string) => {
    setForm((prev) => ({
      ...prev,
      addonServices: prev.addonServices.includes(id)
        ? prev.addonServices.filter((s) => s !== id)
        : [...prev.addonServices, id],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSending(true); setSendError(null)
    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        // Slot taken — refresh availability and clear time selection
        const params = new URLSearchParams({ date: form.date })
        if (form.basicService) params.set('basic_service_id', form.basicService)
        const avail = await fetch(`${API}/api/bookings/availability?${params}`).then((r) => r.json())
        setBookedSlots(avail.booked ?? [])
        setForm((prev) => ({ ...prev, time: '' }))
        setSendError('该时间段已被预约，请重新选择时间')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setSendError(body.error ?? '提交失败，请稍后重试')
        return
      }
      setSubmitted(true)
    } catch {
      setSendError('网络错误，请检查连接后重试，或直接添加微信 nailbox11 预约')
    } finally {
      setSending(false)
    }
  }

  // Success State
  if (submitted) {
    const basic  = basicServices.find((s) => s.id === form.basicService)
    const addons = addonServices.filter((s) => form.addonServices.includes(s.id))
    return (
      <section id="booking" className="py-24 px-6 bg-[#fff5f8]">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#fce8ed] border border-[#f0a0b8] flex items-center justify-center mx-auto mb-6">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#e8789a" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-serif text-3xl text-[#3d1230] mb-1">预约申请已提交</h2>
          <p className="font-serif text-[#e8789a] italic mb-3">Booking Request Received</p>
          <p className="text-sm text-[#9a4065] mb-8">确认邮件已发送至您的邮箱，我们会尽快为您确认预约</p>
          <div className="text-left bg-white border border-[#fce8ed] rounded-2xl p-6 space-y-3 shadow-sm">
            {[
              { label: '姓名', value: form.name },
              { label: '邮箱', value: form.email },
              form.wechat ? { label: '微信', value: form.wechat } : null,
              { label: '日期', value: form.date },
              { label: '时间', value: form.time },
              basic ? { label: '基础服务', value: basic.name } : null,
              addons.length > 0 ? { label: '增值服务', value: addons.map((a) => a.name).join('、') } : null,
            ].filter(Boolean).map((row) => (
              <div key={row!.label} className="flex justify-between gap-4 text-sm">
                <span className="text-[#c090a0] shrink-0">{row!.label}</span>
                <span className="text-[#3d1230] text-right">{row!.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#c090a0] mt-6 leading-relaxed">
            如有急事请添加微信：<span className="text-[#e8789a] font-medium"> nailbox11</span>
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); setErrors({}); setBookedSlots([]) }}
            className="mt-8 px-6 py-2.5 border border-[#f0a0b8] text-[#e8789a] hover:bg-[#fce8ed] text-sm rounded-full transition-colors"
          >
            重新预约
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="booking" className="py-24 px-6 bg-[#fff5f8]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.42em] uppercase text-[#c090a0] mb-3">Book Appointment</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#3d1230] font-light">立即预约</h2>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="w-10 h-px bg-[#f9d0da]" />
            <svg width="8" height="8" viewBox="0 0 12 12">
              <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a" />
            </svg>
            <div className="w-10 h-px bg-[#f9d0da]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          {/* Contact */}
          <div>
            <FormSection title="个人信息" en="Contact Info" />
            <div className="grid sm:grid-cols-2 gap-5">
              <div data-error={errors.name ? true : undefined}>
                <InputField label="姓名" required error={errors.name}>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="您的姓名" className={inputClass(errors.name)} />
                </InputField>
              </div>
              <div data-error={errors.email ? true : undefined}>
                <InputField label="邮箱" labelEn="Email" required error={errors.email}>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputClass(errors.email)} />
                </InputField>
              </div>
              <div className="sm:col-span-2">
                <InputField label="微信号" labelEn="WeChat">
                  <input type="text" name="wechat" value={form.wechat} onChange={handleChange} placeholder="您的微信号（方便我们确认预约）" className={inputClass()} />
                </InputField>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <FormSection title="服务选择" en="Service Selection" />

            {/* Basic */}
            <div className="mb-8" data-error={errors.basicService ? true : undefined}>
              <p className="text-sm text-[#9a4065] mb-3">
                基础服务<span className="text-[#e8789a] ml-1">*</span>
                <span className="text-xs text-[#c090a0] ml-2">（选择一项）</span>
              </p>
              <div className="space-y-3">
                {basicServices.map((service) => {
                  const selected = form.basicService === service.id
                  return (
                    <label
                      key={service.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selected ? 'bg-[#fce8ed] border-[#e8789a]' : 'bg-white border-[#fce8ed] hover:border-[#f0a0b8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-[#e8789a]' : 'border-[#f0a0b8]'}`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-[#e8789a]" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#3d1230]">{service.name}</p>
                          {service.duration && <p className="text-xs text-[#c090a0]">{service.duration}</p>}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#e8789a] ml-4 shrink-0">{service.price}</span>
                      <input type="radio" name="basicService" value={service.id} checked={selected} onChange={handleChange} className="sr-only" />
                    </label>
                  )
                })}
              </div>
              {errors.basicService && <p className="text-xs text-rose-400 mt-2">{errors.basicService}</p>}
            </div>

            {/* Addons */}
            <div>
              <p className="text-sm text-[#9a4065] mb-3">
                增值服务<span className="text-xs text-[#c090a0] ml-2">（可多选，选填）</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {addonServices.map((service) => {
                  const checked = form.addonServices.includes(service.id)
                  return (
                    <label
                      key={service.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        checked ? 'bg-[#fce8ed] border-[#e8789a]' : 'bg-white border-[#fce8ed] hover:border-[#f0a0b8]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'border-[#e8789a] bg-[#e8789a]' : 'border-[#f0a0b8]'}`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#3d1230] leading-snug">{service.name}</p>
                          {service.duration && <p className="text-[10px] text-[#c090a0]">{service.duration}</p>}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#e8789a] ml-2 shrink-0">{service.price}</span>
                      <input type="checkbox" checked={checked} onChange={() => toggleAddon(service.id)} className="sr-only" />
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <FormSection title="预约时间" en="Appointment Time" />
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div data-error={errors.date ? true : undefined} className="sm:col-span-2">
                <InputField label="日期" labelEn="Date" required error={errors.date}>
                  <input type="date" name="date" value={form.date} onChange={handleChange} min={today} className={inputClass(errors.date)} />
                </InputField>
              </div>
            </div>

            {/* Time slot picker */}
            <div data-error={errors.time ? true : undefined}>
              <p className="text-sm text-[#9a4065] mb-3">
                时间<span className="text-[#e8789a] ml-1">*</span>
                {loadingSlots && <span className="text-xs text-[#c090a0] ml-2">查询中…</span>}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {ALL_TIME_SLOTS.map((slot) => {
                  const booked   = bookedSlots.includes(slot)
                  const selected = form.time === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={booked}
                      onClick={() => {
                        if (!booked) {
                          setForm((prev) => ({ ...prev, time: slot }))
                          clearError('time')
                        }
                      }}
                      className={`relative py-3 px-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        booked
                          ? 'bg-[#fafafa] border-[#ede8ea] text-[#d0b8c0] cursor-not-allowed'
                          : selected
                            ? 'bg-[#e8789a] border-[#e8789a] text-white shadow-md'
                            : 'bg-white border-[#fce8ed] text-[#3d1230] hover:border-[#e8789a] hover:bg-[#fff0f5]'
                      }`}
                    >
                      {slot}
                      {booked && (
                        <span className="block text-[10px] font-normal mt-0.5 text-[#d0b8c0]">已预约</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {errors.time && <p className="text-xs text-rose-400 mt-2">{errors.time}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <FormSection title="备注" en="Notes" />
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="款式参考、特殊要求、或其他说明（选填）" className={inputClass() + ' resize-none'} />
          </div>

          {sendError && (
            <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-500 text-center">
              {sendError}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-[#e8789a] hover:bg-[#c86080] disabled:opacity-60 disabled:cursor-not-allowed text-white tracking-[0.22em] text-sm uppercase rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  提交中…
                </>
              ) : '提交预约 · Book Now'}
            </button>
            <p className="text-center text-xs text-[#c090a0] mt-4">提交后确认邮件将发送至您的邮箱</p>
          </div>
        </form>
      </div>
    </section>
  )
}
