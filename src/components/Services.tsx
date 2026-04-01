import { basicServices, addonServices } from '../data/services'

export default function Services() {
  return (
    <section id="services" className="relative py-28 px-6 bg-white overflow-hidden">

      {/* Background decorative rings */}
      <div className="absolute -top-16 -right-16 w-[380px] h-[380px] animate-spin-slow pointer-events-none opacity-30">
        <svg viewBox="0 0 380 380" fill="none">
          <circle cx="190" cy="190" r="170" stroke="#fce8ed" strokeWidth="1"   strokeDasharray="6 12" />
          <circle cx="190" cy="190" r="130" stroke="#fce8ed" strokeWidth="0.6" strokeDasharray="3 9"  />
        </svg>
      </div>
      <div className="absolute -bottom-10 -left-10 pointer-events-none opacity-30">
        <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
          <circle cx="0" cy="260" r="150" stroke="#fce8ed" strokeWidth="1"   />
          <circle cx="0" cy="260" r="90"  stroke="#fce8ed" strokeWidth="0.6" />
        </svg>
      </div>

      {/* Floating sparkles */}
      <div className="absolute top-[12%] left-[5%] animate-float opacity-40 pointer-events-none">
        <svg width="8" height="8" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg>
      </div>
      <div className="absolute top-[45%] right-[4%] animate-float-delayed opacity-30 pointer-events-none">
        <svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#f0a0b8"/></svg>
      </div>
      <div className="absolute bottom-[18%] left-[7%] animate-shimmer-delay opacity-25 pointer-events-none">
        <svg width="7" height="7" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Title */}
        <div className="text-center mb-16">
          <p className="text-[10px] tracking-[0.42em] uppercase text-[#c090a0] mb-3">Our Services</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#c0507a] font-light">服务项目</h2>
          <p className="font-serif text-lg text-[#e8789a] italic mt-1">Services & Pricing</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="w-10 h-px bg-[#f9d0da]" />
            <svg width="8" height="8" viewBox="0 0 12 12">
              <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a" />
            </svg>
            <div className="w-10 h-px bg-[#f9d0da]" />
          </div>
        </div>

        {/* Basic Services */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="font-serif text-2xl text-[#c0507a] font-light">基础服务</h3>
            <span className="text-xs text-[#c090a0] tracking-widest uppercase">/ Basic Services</span>
            <div className="flex-1 h-px bg-[#fce8ed] ml-2" />
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {basicServices.map((service) => (
              <div
                key={service.id}
                className="group bg-[#fef5f7] hover:bg-[#fce8ed] border border-[#fce8ed] hover:border-[#f0a0b8] rounded-2xl p-7 transition-all duration-300 flex flex-col hover:shadow-md"
              >
                <div className="mb-5 flex-1">
                  <h4 className="font-serif text-xl text-[#c0507a] mb-1 leading-snug group-hover:text-[#e8789a] transition-colors duration-300">
                    {service.name}
                  </h4>
                  <p className="text-xs text-[#c090a0] tracking-wide">{service.nameEn}</p>
                </div>
                <div className="flex items-end justify-between mt-auto pt-4 border-t border-[#fce8ed] group-hover:border-[#f0a0b8]/50 transition-colors duration-300">
                  <span className="font-serif text-2xl font-light text-[#e8789a]">{service.price}</span>
                  {service.duration && (
                    <span className="text-xs text-[#c090a0] bg-white border border-[#fce8ed] rounded-full px-3 py-1">
                      {service.duration}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add-on Services */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <h3 className="font-serif text-2xl text-[#c0507a] font-light">增值服务</h3>
            <span className="text-xs text-[#c090a0] tracking-widest uppercase">/ Add-on Services</span>
            <div className="flex-1 h-px bg-[#fce8ed] ml-2" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {addonServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between bg-[#fef5f7] hover:bg-[#fce8ed] border border-[#fce8ed] hover:border-[#f0a0b8] rounded-xl px-5 py-4 transition-all duration-200 group"
              >
                <div className="min-w-0 mr-4">
                  <p className="text-sm font-medium text-[#c0507a] group-hover:text-[#e8789a] truncate transition-colors">
                    {service.name}
                  </p>
                  {service.duration && (
                    <p className="text-xs text-[#c090a0] mt-0.5">{service.duration}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-[#e8789a] shrink-0">{service.price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#c090a0] mt-6 text-center">
            * 增值服务可与基础服务叠加，部分价格视实际情况而定
          </p>
        </div>
      </div>
    </section>
  )
}
