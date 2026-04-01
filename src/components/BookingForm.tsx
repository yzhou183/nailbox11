import { useState, type ChangeEvent, type FormEvent } from 'react'
import emailjs from '@emailjs/browser'
import type { BookingFormData, FormErrors } from '../types'
import { basicServices, addonServices } from '../data/services'

const TIME_SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '5:00 PM']

const INITIAL_FORM: BookingFormData = {
  name: '',
  email: '',
  wechat: '',
  date: '',
  time: '',
  basicService: '',
  addonServices: [],
  notes: '',
}

function validate(data: BookingFormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.name.trim()) {
    errors.name = '请填写您的姓名'
  }

  if (!data.email.trim()) {
    errors.email = '请填写邮箱地址'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = '请输入有效的邮箱地址'
  }

  if (!data.date) {
    errors.date = '请选择预约日期'
  } else {
    const selected = new Date(data.date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selected < today) errors.date = '请选择今天或之后的日期'
  }

  if (!data.time) errors.time = '请选择预约时间'
  if (!data.basicService) errors.basicService = '请选择一项基础服务'

  return errors
}

function InputField({
  label,
  labelEn,
  required,
  error,
  children,
}: {
  label: string
  labelEn?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm text-[#7a6355] mb-1.5">
        {label}
        {labelEn && <span className="text-[#a8908a] text-xs ml-1">/ {labelEn}</span>}
        {required && <span className="text-[#c9908a] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
    </div>
  )
}

const inputClass = (error?: string) =>
  `w-full px-4 py-3 rounded-xl border bg-[#faf8f5] text-sm text-[#3d302c] placeholder-[#c4a898] outline-none transition-all ${
    error
      ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
      : 'border-[#e8d5c4] focus:border-[#c9908a] focus:ring-2 focus:ring-[#c9908a]/10'
  }`

function FormSection({ title, en }: { title: string; en: string }) {
  return (
    <div className="pb-2 border-b border-[#e8d5c4] mb-5">
      <h3 className="font-serif text-lg text-[#3d302c]">
        {title}
        <span className="text-sm font-sans text-[#a8908a] ml-2 font-normal">/ {en}</span>
      </h3>
    </div>
  )
}

export default function BookingForm() {
  const [form, setForm] = useState<BookingFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    const validatedFields: (keyof FormErrors)[] = [
      'name',
      'email',
      'date',
      'time',
      'basicService',
    ]
    if (validatedFields.includes(name as keyof FormErrors)) {
      clearError(name as keyof FormErrors)
    }
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
      const firstError = document.querySelector('[data-error]')
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSending(true)
    setSendError(false)

    const basic = basicServices.find((s) => s.id === form.basicService)
    const addons = addonServices.filter((s) => form.addonServices.includes(s.id))

    const templateParams = {
      customer_name: form.name,
      customer_email: form.email,
      customer_wechat: form.wechat || '未填写',
      appointment_date: form.date,
      appointment_time: form.time,
      basic_service: basic ? `${basic.name}（${basic.price}，${basic.duration ?? ''}）` : '',
      addon_services: addons.length > 0 ? addons.map((a) => a.name).join('、') : '无',
      notes: form.notes || '无',
    }

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      )
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  // Success State
  if (submitted) {
    const basic = basicServices.find((s) => s.id === form.basicService)
    const addons = addonServices.filter((s) => form.addonServices.includes(s.id))
    return (
      <section id="booking" className="py-24 px-6 bg-white">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#fbf0ee] flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="#c9908a"
              className="w-7 h-7"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-serif text-3xl text-[#3d302c] mb-1">预约申请已提交</h2>
          <p className="font-serif text-[#c4a898] italic mb-3">Booking Request Received</p>
          <p className="text-sm text-[#7a6355] mb-8">
            我会通过邮件回复确认预约是否成功，请注意查收
          </p>

          <div className="text-left bg-[#faf8f5] border border-[#e8d5c4] rounded-2xl p-6 space-y-3">
            {[
              { label: '姓名', value: form.name },
              { label: '邮箱', value: form.email },
              form.wechat ? { label: '微信', value: form.wechat } : null,
              { label: '日期', value: form.date },
              { label: '时间', value: form.time },
              basic ? { label: '基础服务', value: basic.name } : null,
              addons.length > 0
                ? { label: '增值服务', value: addons.map((a) => a.name).join('、') }
                : null,
            ]
              .filter(Boolean)
              .map((row) => (
                <div key={row!.label} className="flex justify-between gap-4 text-sm">
                  <span className="text-[#a8908a] shrink-0">{row!.label}</span>
                  <span className="text-[#3d302c] text-right">{row!.value}</span>
                </div>
              ))}
          </div>

          <p className="text-xs text-[#a8908a] mt-6 leading-relaxed">
            如有急事请添加微信：
            <span className="text-[#c9908a] font-medium"> nailbox11</span>
          </p>

          <button
            onClick={() => {
              setSubmitted(false)
              setForm(INITIAL_FORM)
              setErrors({})
            }}
            className="mt-8 px-6 py-2.5 border border-[#c4a898] text-[#7a6355] hover:bg-[#fbf0ee] text-sm rounded-full transition-colors"
          >
            重新预约
          </button>
        </div>
      </section>
    )
  }

  // Form
  return (
    <section id="booking" className="py-24 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#a8908a] mb-3">
            Book Appointment
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#3d302c] font-light">立即预约</h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-10 h-px bg-[#c4a898]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c4a898]" />
            <div className="w-10 h-px bg-[#c4a898]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          {/* Contact Info */}
          <div>
            <FormSection title="个人信息" en="Contact Info" />
            <div className="grid sm:grid-cols-2 gap-5">
              <div data-error={errors.name ? true : undefined}>
                <InputField label="姓名" required error={errors.name}>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="您的姓名"
                    className={inputClass(errors.name)}
                  />
                </InputField>
              </div>
              <div data-error={errors.email ? true : undefined}>
                <InputField label="邮箱" labelEn="Email" required error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={inputClass(errors.email)}
                  />
                </InputField>
              </div>
              <div className="sm:col-span-2">
                <InputField label="微信号" labelEn="WeChat">
                  <input
                    type="text"
                    name="wechat"
                    value={form.wechat}
                    onChange={handleChange}
                    placeholder="您的微信号（方便我们确认预约）"
                    className={inputClass()}
                  />
                </InputField>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <FormSection title="预约时间" en="Appointment Time" />
            <div className="grid sm:grid-cols-2 gap-5">
              <div data-error={errors.date ? true : undefined}>
                <InputField label="日期" labelEn="Date" required error={errors.date}>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    min={today}
                    className={inputClass(errors.date)}
                  />
                </InputField>
              </div>
              <div data-error={errors.time ? true : undefined}>
                <InputField label="时间" labelEn="Time" required error={errors.time}>
                  <select
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className={inputClass(errors.time)}
                  >
                    <option value="">请选择时间</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </InputField>
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <FormSection title="服务选择" en="Service Selection" />

            {/* Basic Service — radio */}
            <div className="mb-8" data-error={errors.basicService ? true : undefined}>
              <p className="text-sm text-[#7a6355] mb-3">
                基础服务
                <span className="text-[#c9908a] ml-1">*</span>
                <span className="text-xs text-[#a8908a] ml-2">（选择一项）</span>
              </p>
              <div className="space-y-3">
                {basicServices.map((service) => {
                  const selected = form.basicService === service.id
                  return (
                    <label
                      key={service.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        selected
                          ? 'bg-[#fbf0ee] border-[#c9908a]'
                          : 'bg-[#faf8f5] border-[#e8d5c4] hover:border-[#c9908a]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? 'border-[#c9908a]' : 'border-[#c4a898]'
                          }`}
                        >
                          {selected && <div className="w-2 h-2 rounded-full bg-[#c9908a]" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#3d302c]">{service.name}</p>
                          {service.duration && (
                            <p className="text-xs text-[#a8908a]">{service.duration}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#c9908a] ml-4 shrink-0">
                        {service.price}
                      </span>
                      <input
                        type="radio"
                        name="basicService"
                        value={service.id}
                        checked={selected}
                        onChange={handleChange}
                        className="sr-only"
                      />
                    </label>
                  )
                })}
              </div>
              {errors.basicService && (
                <p className="text-xs text-rose-400 mt-2">{errors.basicService}</p>
              )}
            </div>

            {/* Addon Services — checkboxes */}
            <div>
              <p className="text-sm text-[#7a6355] mb-3">
                增值服务
                <span className="text-xs text-[#a8908a] ml-2">（可多选，选填）</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {addonServices.map((service) => {
                  const checked = form.addonServices.includes(service.id)
                  return (
                    <label
                      key={service.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'bg-[#fbf0ee] border-[#c9908a]'
                          : 'bg-[#faf8f5] border-[#e8d5c4] hover:border-[#c9908a]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            checked ? 'border-[#c9908a] bg-[#c9908a]' : 'border-[#c4a898]'
                          }`}
                        >
                          {checked && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#3d302c] leading-snug">
                            {service.name}
                          </p>
                          {service.duration && (
                            <p className="text-[10px] text-[#a8908a]">{service.duration}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#c9908a] ml-2 shrink-0">
                        {service.price}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddon(service.id)}
                        className="sr-only"
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <FormSection title="备注" en="Notes" />
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="款式参考、特殊要求、或其他说明（选填）"
              className={inputClass() + ' resize-none'}
            />
          </div>

          {/* Send Error */}
          {sendError && (
            <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-500 text-center">
              发送失败，请检查网络后重试，或直接添加微信{' '}
              <span className="font-medium">nailbox11</span> 预约
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-[#c9908a] hover:bg-[#a67570] disabled:opacity-60 disabled:cursor-not-allowed text-white tracking-[0.2em] text-sm uppercase rounded-full transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                    />
                  </svg>
                  提交中…
                </>
              ) : (
                '提交预约 · Book Now'
              )}
            </button>
            <p className="text-center text-xs text-[#a8908a] mt-4">
              提交后我们将通过邮件与您确认预约
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
