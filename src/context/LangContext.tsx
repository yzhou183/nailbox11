import { createContext, useContext, useState, type ReactNode } from 'react'
import { type Lang, translations, type TKey } from '../i18n'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TKey) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh')
  const t = (key: TKey) => translations[lang][key] ?? translations.zh[key]
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
