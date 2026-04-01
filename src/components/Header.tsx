import { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext'
import { LANG_LABELS, type Lang } from '../i18n'

const LANGS: Lang[] = ['zh', 'en', 'es', 'vi']

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, setLang, t } = useLang()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#fce8ed]' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex flex-col leading-none group">
          <span className="font-serif text-[22px] font-medium tracking-[0.18em] text-[#c0507a] group-hover:text-[#e8789a] transition-colors duration-300">
            Nail Box
          </span>
          <span className="text-[9px] tracking-[0.28em] text-[#c090a0] uppercase mt-0.5">精品美甲工作室</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {([
            { key: 'nav_services', href: '#services' },
            { key: 'nav_visit',    href: '#visit'    },
          ] as const).map(item => (
            <a key={item.href} href={item.href}
              className="text-sm text-[#9a4065] hover:text-[#e8789a] transition-colors duration-200 tracking-wide">
              {t(item.key)}
            </a>
          ))}
          <a href="#booking"
            className="px-5 py-2 bg-[#e8789a] hover:bg-[#c86080] text-white text-[11px] tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
            {t('nav_book')}
          </a>
          {/* Language switcher */}
          <div className="flex items-center gap-0.5 border border-[#fce8ed] rounded-full px-1 py-0.5">
            {LANGS.map((l, i) => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                  lang === l ? 'bg-[#e8789a] text-white' : 'text-[#c090a0] hover:text-[#e8789a]'
                } ${i < LANGS.length - 1 ? 'border-r border-[#fce8ed]' : ''}`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden flex flex-col justify-center gap-1.5 p-2 text-[#9a4065]"
          onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span className={`block w-5 h-px bg-current transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white/98 backdrop-blur-md border-t border-[#fce8ed] ${menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 py-4 flex flex-col gap-4">
          {([
            { key: 'nav_services', href: '#services' },
            { key: 'nav_visit',    href: '#visit'    },
          ] as const).map(item => (
            <a key={item.href} href={item.href}
              className="text-sm text-[#9a4065] hover:text-[#e8789a] transition-colors"
              onClick={() => setMenuOpen(false)}>
              {t(item.key)}
            </a>
          ))}
          <a href="#booking"
            className="text-center px-5 py-2.5 bg-[#e8789a] hover:bg-[#c86080] text-white text-[11px] tracking-[0.2em] uppercase rounded-full transition-colors"
            onClick={() => setMenuOpen(false)}>
            {t('nav_book')}
          </a>
          {/* Language switcher mobile */}
          <div className="flex gap-1">
            {LANGS.map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  lang === l ? 'bg-[#e8789a] border-[#e8789a] text-white' : 'border-[#fce8ed] text-[#c090a0] hover:text-[#e8789a]'
                }`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
