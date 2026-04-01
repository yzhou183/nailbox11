export type ServiceCategory = 'basic' | 'addon'

export interface Service {
  id: string
  name: string
  nameEn: string
  price: string
  duration?: string      // 显示用字符串，如 "1 hr 15 min"
  durationMins?: number  // 分钟数，用于冲突检测
  category: ServiceCategory
}

export interface BookingFormData {
  name: string
  email: string
  wechat: string
  date: string
  time: string
  basicService: string
  addonServices: string[]
  notes: string
}

export interface FormErrors {
  name?: string
  email?: string
  date?: string
  time?: string
  basicService?: string
}
