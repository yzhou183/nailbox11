export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f5] via-[#fbf0ee] to-[#f0d8d4]" />
      <div className="absolute top-1/4 right-1/3 w-72 h-72 rounded-full bg-[#e8d5c4]/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-[#fbf0ee]/40 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#a8908a] mb-6">
          Los Angeles · 精品美甲
        </p>

        <h1 className="font-serif text-7xl md:text-8xl lg:text-[96px] font-light text-[#3d302c] tracking-[0.12em] mb-5">
          Nail Box
        </h1>

        {/* Ornament */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-14 h-px bg-[#c4a898]" />
          <span className="text-[#c4a898] text-xs">✦</span>
          <div className="w-14 h-px bg-[#c4a898]" />
        </div>

        <p className="font-serif text-xl md:text-2xl text-[#7a6355] font-light italic mb-2">
          精品美甲 · 专业定制
        </p>
        <p className="text-[10px] tracking-[0.3em] text-[#a8908a] uppercase mb-10">
          Premium Nail Art Studio
        </p>

        {/* WeChat Card */}
        <div className="inline-flex flex-col items-center gap-1.5 bg-white/70 backdrop-blur-sm border border-[#e8d5c4] rounded-2xl px-8 py-5 mb-10 shadow-sm">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#a8908a]">
            微信 / WeChat
          </p>
          <p className="text-2xl font-semibold text-[#3d302c] tracking-wider">
            nailbox11
          </p>
          <p className="text-xs text-[#a8908a]">预约咨询请添加微信</p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#booking"
            className="px-9 py-3.5 bg-[#c9908a] hover:bg-[#a67570] text-white text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
          >
            立即预约 · Book Now
          </a>
          <a
            href="#services"
            className="px-9 py-3.5 border border-[#c4a898] text-[#7a6355] hover:bg-[#fbf0ee] text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300"
          >
            查看服务 · Services
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#a8908a]">
        <span className="text-[9px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#c4a898] to-transparent" />
      </div>
    </section>
  )
}
