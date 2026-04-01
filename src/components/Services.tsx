import { basicServices, addonServices } from '../data/services'

function SectionTitle({
  zh,
  en,
  sub,
}: {
  zh: string
  en: string
  sub?: string
}) {
  return (
    <div className="text-center mb-14">
      {sub && (
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#a8908a] mb-3">{sub}</p>
      )}
      <h2 className="font-serif text-4xl md:text-5xl text-[#3d302c] font-light">{zh}</h2>
      <p className="font-serif text-lg text-[#c4a898] italic mt-1">{en}</p>
      <div className="flex items-center justify-center gap-3 mt-4">
        <div className="w-10 h-px bg-[#c4a898]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#c4a898]" />
        <div className="w-10 h-px bg-[#c4a898]" />
      </div>
    </div>
  )
}

export default function Services() {
  return (
    <section id="services" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle zh="服务项目" en="Our Services" sub="Services" />

        {/* Basic Services */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="font-serif text-2xl text-[#3d302c]">基础服务</h3>
            <span className="text-xs text-[#a8908a] tracking-widest uppercase">/ Basic Services</span>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {basicServices.map((service) => (
              <div
                key={service.id}
                className="group bg-[#faf8f5] hover:bg-[#fbf0ee] border border-[#e8d5c4] hover:border-[#c9908a]/40 rounded-2xl p-7 transition-all duration-300 flex flex-col"
              >
                <div className="mb-5 flex-1">
                  <h4 className="font-serif text-xl text-[#3d302c] mb-1 leading-snug">
                    {service.name}
                  </h4>
                  <p className="text-xs text-[#a8908a] tracking-wide">{service.nameEn}</p>
                </div>
                <div className="flex items-end justify-between mt-auto pt-4 border-t border-[#e8d5c4] group-hover:border-[#c9908a]/20">
                  <span className="font-serif text-2xl font-light text-[#c9908a]">
                    {service.price}
                  </span>
                  {service.duration && (
                    <span className="text-xs text-[#a8908a] bg-white border border-[#e8d5c4] rounded-full px-3 py-1">
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
            <h3 className="font-serif text-2xl text-[#3d302c]">增值服务</h3>
            <span className="text-xs text-[#a8908a] tracking-widest uppercase">/ Add-on Services</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {addonServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between bg-[#faf8f5] border border-[#e8d5c4] hover:border-[#c9908a]/40 hover:bg-[#fbf0ee] rounded-xl px-5 py-4 transition-all duration-200"
              >
                <div className="min-w-0 mr-4">
                  <p className="text-sm font-medium text-[#3d302c] truncate">{service.name}</p>
                  {service.duration && (
                    <p className="text-xs text-[#a8908a] mt-0.5">{service.duration}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-[#c9908a] shrink-0">{service.price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#a8908a] mt-5 text-center">
            * 增值服务可与基础服务叠加，部分价格视实际情况而定
          </p>
        </div>
      </div>
    </section>
  )
}
