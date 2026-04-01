export type ServiceCategory = 'basic' | 'addon'

export interface Service {
  id: string
  name: string
  nameEn: string
  price: string
  duration?: string
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
