import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { label: '服务项目', labelEn: 'Services', href: '#services' },
  { label: '到店指南', labelEn: 'Visit',    href: '#visit'    },
]

export default function Header() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#fce8ed]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex flex-col leading-none group">
          <span className="font-serif text-[22px] font-medium tracking-[0.18em] text-[#c0507a] group-hover:text-[#e8789a] transition-colors duration-300">
            Nail Box
          </span>
          <span className="text-[9px] tracking-[0.28em] text-[#c090a0] uppercase mt-0.5">
            精品美甲工作室
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-[#9a4065] hover:text-[#e8789a] transition-colors duration-200 tracking-wide"
            >
              {item.label}
              <span className="text-[#f0a0b8] ml-1 text-xs">/ {item.labelEn}</span>
            </a>
          ))}
          <a
            href="#booking"
            className="px-5 py-2 bg-[#e8789a] hover:bg-[#c86080] text-white text-[11px] tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
          >
            立即预约
          </a>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 p-2 text-[#9a4065]"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-px bg-current transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white/98 backdrop-blur-md border-t border-[#fce8ed] ${menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 py-4 flex flex-col gap-4">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-[#9a4065] hover:text-[#e8789a] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
              <span className="text-[#f0a0b8] ml-1.5 text-xs">/ {item.labelEn}</span>
            </a>
          ))}
          <a
            href="#booking"
            className="text-center px-5 py-2.5 bg-[#e8789a] hover:bg-[#c86080] text-white text-[11px] tracking-[0.2em] uppercase rounded-full transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            立即预约 · Book Now
          </a>
        </div>
      </div>
    </header>
  )
}
