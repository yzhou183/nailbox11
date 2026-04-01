/**
 * LangContext.tsx — React context for language / i18n state
 *
 * This module provides a single source of truth for the active language across the entire
 * application. Any component that needs to:
 *   (a) read the current language code,
 *   (b) switch to a different language, or
 *   (c) look up a translated string by key
 * should consume this context via the `useLang()` hook rather than importing translation
 * objects directly. This keeps language concerns centralized and prevents prop-drilling.
 *
 * Exports:
 *   LangProvider  — Context provider; wrap the app root with this component.
 *   useLang       — Custom hook; use inside any child component to access lang state.
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { type Lang, translations, type TKey } from '../i18n'

/**
 * The shape of the value exposed through LangContext.
 *
 * @property lang     - The currently active language code (e.g. 'zh', 'en').
 * @property setLang  - Setter to switch the active language; triggers a re-render of all
 *                      consumers, causing the entire UI to update to the new language.
 * @property t        - Translation lookup function. Given a TKey, returns the corresponding
 *                      string in the active language.
 */
interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TKey) => string
}

/**
 * The React context object itself.
 *
 * Initialized to `null` rather than a default value on purpose: if a component calls
 * `useContext(LangContext)` outside of a `<LangProvider>`, it will receive `null`, which
 * `useLang()` detects and turns into an informative thrown error. A non-null default would
 * silently mask that misconfiguration.
 */
const LangContext = createContext<LangContextValue | null>(null)

/**
 * LangProvider — Context provider component that owns language state.
 *
 * Place this component high in the component tree (e.g. wrapping `<App>`). Every
 * descendant will be able to call `useLang()` to read and update the language.
 *
 * Default language is Chinese ('zh') because the primary target audience is Chinese-
 * speaking clients, and the Chinese copy is the canonical / master translation.
 *
 * @param children - The React subtree that needs access to language state.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  // `lang` holds the currently selected language code.
  // `setLang` is passed into the context so any child (e.g. Header's language switcher)
  // can change the active language without needing a prop chain.
  const [lang, setLang] = useState<Lang>('zh')

  /**
   * Translates a key to the corresponding string in the active language.
   *
   * The nullish-coalescing fallback (`?? translations.zh[key]`) guards against the edge
   * case where a translation key exists in `zh` but was accidentally omitted from another
   * language object. In that scenario, Chinese text is shown rather than `undefined`.
   *
   * @param key - A TKey identifying which UI string to look up.
   * @returns   The translated string, or the Chinese string as a fallback.
   */
  const t = (key: TKey) => translations[lang][key] ?? translations.zh[key]

  // Provide `lang`, `setLang`, and `t` to the entire subtree.
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

/**
 * useLang — Custom hook for consuming language context.
 *
 * Wraps `useContext` with a guard that throws a clear error when the hook is used
 * outside of a `<LangProvider>`. This surfaces misconfiguration immediately during
 * development rather than producing a hard-to-debug runtime `undefined` access.
 *
 * @returns The `LangContextValue` object: { lang, setLang, t }.
 * @throws  Error if called outside of a LangProvider tree.
 *
 * @example
 *   function MyComponent() {
 *     const { t, lang, setLang } = useLang()
 *     return <h1>{t('hero_tagline')}</h1>
 *   }
 */
export function useLang() {
  const ctx = useContext(LangContext)
  // `null` means the hook was called outside a LangProvider — fail loudly in development.
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
