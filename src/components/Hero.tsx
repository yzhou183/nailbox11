export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fff8fa]">

      {/* Outer rotating dashed ring */}
      <div className="absolute -top-28 -right-28 w-[580px] h-[580px] animate-spin-slow pointer-events-none">
        <svg viewBox="0 0 580 580" fill="none">
          <circle cx="290" cy="290" r="270" stroke="#ffd0dc" strokeWidth="1"   strokeDasharray="8 14" />
          <circle cx="290" cy="290" r="230" stroke="#ffd0dc" strokeWidth="0.5" strokeDasharray="4 10" />
        </svg>
      </div>

      {/* Inner counter-rotating ring */}
      <div className="absolute -top-28 -right-28 w-[580px] h-[580px] animate-spin-reverse pointer-events-none">
        <svg viewBox="0 0 580 580" fill="none">
          <circle cx="290" cy="290" r="190" stroke="#ffe0ea" strokeWidth="1" strokeDasharray="12 8" />
        </svg>
      </div>

      {/* Bottom-left concentric arcs */}
      <div className="absolute -bottom-8 -left-8 pointer-events-none">
        <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
          <circle cx="0" cy="300" r="160" stroke="#ffe0ea" strokeWidth="0.8" />
          <circle cx="0" cy="300" r="105" stroke="#ffe0ea" strokeWidth="0.6" />
          <circle cx="0" cy="300" r="52"  stroke="#ffe0ea" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Floating sparkle diamonds */}
      <div className="absolute top-[17%] left-[9%]   animate-float          pointer-events-none opacity-70">
        <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg>
      </div>
      <div className="absolute top-[38%] right-[11%]  animate-float-slow     pointer-events-none opacity-50">
        <svg width="8"  height="8"  viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg>
      </div>
      <div className="absolute top-[63%] right-[7%]   animate-float-delayed  pointer-events-none opacity-60">
        <svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#f0b0c4"/></svg>
      </div>
      <div className="absolute bottom-[22%] left-[14%] animate-float-delay3  pointer-events-none opacity-55">
        <svg width="13" height="13" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg>
      </div>
      <div className="absolute top-[22%] right-[28%]  animate-shimmer        pointer-events-none opacity-55">
        <svg width="7"  height="7"  viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg>
      </div>
      <div className="absolute bottom-[38%] right-[22%] animate-shimmer-delay pointer-events-none opacity-40">
        <svg width="9"  height="9"  viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#ffd0dc"/></svg>
      </div>
      <div className="absolute top-[55%] left-[5%]    animate-shimmer-delay2 pointer-events-none opacity-50">
        <svg width="6"  height="6"  viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg>
      </div>

      {/* Floating petals */}
      <div className="absolute top-[43%] left-[5%] animate-float-delayed pointer-events-none opacity-30">
        <svg width="22" height="38" viewBox="0 0 24 42">
          <ellipse cx="12" cy="21" rx="8" ry="18" fill="#f0b0c4" transform="rotate(-22 12 21)" />
        </svg>
      </div>
      <div className="absolute top-[28%] right-[5%] animate-float pointer-events-none opacity-20">
        <svg width="18" height="32" viewBox="0 0 24 42">
          <ellipse cx="12" cy="21" rx="8" ry="18" fill="#ffd0dc" transform="rotate(16 12 21)" />
        </svg>
      </div>
      <div className="absolute bottom-[28%] right-[16%] animate-float-slow pointer-events-none opacity-20">
        <svg width="20" height="36" viewBox="0 0 24 42">
          <ellipse cx="12" cy="21" rx="8" ry="18" fill="#ffe0ea" transform="rotate(-8 12 21)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">

        <p className="text-[10px] tracking-[0.48em] uppercase text-[#c090a0] mb-7 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          Los Angeles · 精品美甲
        </p>

        <h1 className="font-serif text-[78px] md:text-[96px] lg:text-[108px] font-light text-[#c0507a] tracking-[0.14em] leading-none mb-7 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          Nail Box
        </h1>

        {/* SVG ornament */}
        <div className="flex items-center justify-center mb-6 animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <svg width="240" height="22" viewBox="0 0 240 22" fill="none">
            <line x1="0"   y1="11" x2="94"  y2="11" stroke="#ffd0dc" strokeWidth="0.8" />
            <path d="M102 11 L107 5 L112 11 L107 17 Z" fill="#e8789a" opacity="0.7" />
            <circle cx="120" cy="11" r="2.5" fill="#e8789a" />
            <path d="M128 11 L133 5 L138 11 L133 17 Z" fill="#e8789a" opacity="0.7" />
            <line x1="146" y1="11" x2="240" y2="11" stroke="#ffd0dc" strokeWidth="0.8" />
          </svg>
        </div>

        <p className="font-serif text-xl md:text-[22px] text-[#9a4065] font-light italic mb-2 animate-fade-up" style={{ animationDelay: '0.32s' }}>
          精品美甲 · 专业定制
        </p>
        <p className="text-[10px] tracking-[0.35em] text-[#c090a0] uppercase mb-10 animate-fade-up" style={{ animationDelay: '0.38s' }}>
          Premium Nail Art Studio
        </p>

        {/* WeChat Card */}
        <div className="inline-flex flex-col items-center gap-1.5 bg-white border border-[#fce8ed] rounded-2xl px-8 py-5 mb-10 shadow-sm animate-fade-up" style={{ animationDelay: '0.48s' }}>
          <p className="text-[10px] tracking-[0.32em] uppercase text-[#c090a0]">微信 / WeChat</p>
          <p className="text-2xl font-semibold text-[#c0507a] tracking-wider">nailbox11</p>
          <p className="text-xs text-[#c090a0]">预约咨询请添加微信</p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.58s' }}>
          <a href="#booking" className="px-10 py-3.5 bg-[#e8789a] hover:bg-[#d0607e] text-white text-[11px] tracking-[0.24em] uppercase rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
            立即预约 · Book Now
          </a>
          <a href="#services" className="px-10 py-3.5 border border-[#f0b0c4] text-[#e8789a] hover:bg-[#fff5f8] text-[11px] tracking-[0.24em] uppercase rounded-full transition-all duration-300 hover:-translate-y-0.5">
            查看服务 · Services
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#c090a0] animate-fade-up" style={{ animationDelay: '0.8s' }}>
        <span className="text-[9px] tracking-[0.38em] uppercase">Scroll</span>
        <div className="relative w-px h-9 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#e8789a] to-transparent animate-scroll-line" />
        </div>
      </div>
    </section>
  )
}
