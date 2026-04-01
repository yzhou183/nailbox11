import { useLang } from '../context/LangContext'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="relative bg-[#fce8ed] pt-16 pb-10 px-6 overflow-hidden">
      <div className="absolute -bottom-16 -right-16 w-72 h-72 animate-spin-slow pointer-events-none opacity-30">
        <svg viewBox="0 0 288 288" fill="none">
          <circle cx="144" cy="144" r="128" stroke="#e8789a" strokeWidth="1"   strokeDasharray="6 10" />
          <circle cx="144" cy="144" r="90"  stroke="#e8789a" strokeWidth="0.5" strokeDasharray="3 8"  />
        </svg>
      </div>
      <div className="absolute top-0 left-0 opacity-20 pointer-events-none">
        <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
          <circle cx="0" cy="0" r="120" stroke="#e8789a" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="70"  stroke="#e8789a" strokeWidth="0.5" />
        </svg>
      </div>
      <div className="absolute top-[25%] right-[8%] animate-float opacity-30 pointer-events-none"><svg width="8" height="8" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>
      <div className="absolute bottom-[25%] left-[8%] animate-float-delayed opacity-20 pointer-events-none"><svg width="6" height="6" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h3 className="font-serif text-3xl font-light tracking-[0.22em] text-[#c0507a] mb-1">Nail Box</h3>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#e8789a] mb-5">精品美甲工作室</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-px bg-[#f0a0b8]/50" />
            <svg width="8" height="8" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a" opacity="0.6"/></svg>
            <div className="w-16 h-px bg-[#f0a0b8]/50" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-[#f0a0b8]/30">
          <div>
            <p className="text-[#9a4065] text-xs leading-relaxed whitespace-pre-line">{t('ft_desc')}</p>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.32em] uppercase text-[#e8789a] mb-5">{t('ft_contact')}</h4>
            <div className="space-y-2.5">
              <p className="text-[#9a4065] text-sm">{t('ft_wechat')}<span className="text-[#c0507a] font-medium">nailbox11</span></p>
              <p className="text-[#9a4065] text-sm">888 S Hope St</p>
              <p className="text-[#9a4065] text-sm">Los Angeles, CA 90017</p>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.32em] uppercase text-[#e8789a] mb-5">{t('ft_nav')}</h4>
            <div className="space-y-2.5">
              {([
                { key: 'ft_services', href: '#services' },
                { key: 'ft_visit',    href: '#visit'    },
                { key: 'ft_book',     href: '#booking'  },
              ] as const).map(link => (
                <a key={link.href} href={link.href}
                  className="block text-[#9a4065] hover:text-[#e8789a] text-sm transition-colors duration-200">
                  {t(link.key)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-[#c090a0] text-xs">
          <p>{t('ft_copy')}</p>
          <p>888 S Hope St, Los Angeles, CA 90017</p>
        </div>
      </div>
    </footer>
  )
}
