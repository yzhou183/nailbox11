const PARKING_STEPS = [
  {
    step: '01',
    title: '停在正门口，打开双闪',
    desc: '公寓正门在小巷子里面。请先将车停在正门口，打开双闪灯等候。',
  },
  {
    step: '02',
    title: '进入大楼，向前台取停车证',
    desc: '进门后找到前台，索取 Visitor Parking Pass（访客停车许可）。',
  },
  {
    step: '03',
    title: '停入指定车库',
    desc: '拿到停车证后开进巷子，停靠近巷子尽头的那个车库。',
    warning: '请注意：不是靠近巷子口 Petco 旁边的车库。',
  },
]

function InfoCard({
  icon,
  label,
  labelEn,
  children,
}: {
  icon: React.ReactNode
  label: string
  labelEn: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#e8d5c4]">
      <div className="w-10 h-10 rounded-full bg-[#fbf0ee] flex items-center justify-center shrink-0 text-[#c9908a]">
        {icon}
      </div>
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#a8908a] mb-1">
          {label} / {labelEn}
        </p>
        {children}
      </div>
    </div>
  )
}

export default function StoreInfo() {
  return (
    <section id="visit" className="py-24 px-6 bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#a8908a] mb-3">How to Find Us</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#3d302c] font-light">到店指南</h2>
          <p className="font-serif text-lg text-[#c4a898] italic mt-1">Store Info & Parking</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-10 h-px bg-[#c4a898]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c4a898]" />
            <div className="w-10 h-px bg-[#c4a898]" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Store Info */}
          <div>
            <h3 className="font-serif text-2xl text-[#3d302c] mb-6">
              店铺信息
              <span className="text-sm font-sans text-[#a8908a] ml-2 font-normal">/ Store Info</span>
            </h3>
            <div className="space-y-4">
              <InfoCard
                label="地址"
                labelEn="Address"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                    />
                  </svg>
                }
              >
                <p className="text-[#3d302c] font-medium">888 S Hope St</p>
                <p className="text-[#7a6355] text-sm">Los Angeles, CA 90017</p>
              </InfoCard>

              <InfoCard
                label="微信"
                labelEn="WeChat"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>
                }
              >
                <p className="text-[#3d302c] font-medium">nailbox11</p>
                <p className="text-[#7a6355] text-sm">预约咨询请添加微信</p>
              </InfoCard>
            </div>
          </div>

          {/* Parking Steps */}
          <div>
            <h3 className="font-serif text-2xl text-[#3d302c] mb-6">
              停车说明
              <span className="text-sm font-sans text-[#a8908a] ml-2 font-normal">/ Parking Guide</span>
            </h3>
            <div className="relative">
              {/* Connector line */}
              <div className="absolute left-[19px] top-10 bottom-10 w-px bg-[#e8d5c4] pointer-events-none" />

              <div className="space-y-4">
                {PARKING_STEPS.map((item, i) => (
                  <div
                    key={i}
                    className={`relative flex gap-5 p-5 rounded-2xl border transition-all ${
                      item.warning
                        ? 'bg-[#fbf0ee] border-[#c9908a]/30'
                        : 'bg-white border-[#e8d5c4]'
                    }`}
                  >
                    {/* Step number bubble */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#faf8f5] border border-[#e8d5c4] flex items-center justify-center">
                      <span className="font-serif text-sm font-medium text-[#c9908a]">
                        {item.step}
                      </span>
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-[#3d302c] text-sm mb-1.5">{item.title}</p>
                      <p className="text-sm text-[#7a6355] leading-relaxed">{item.desc}</p>
                      {item.warning && (
                        <p className="text-xs text-[#c9908a] mt-2 font-medium flex items-center gap-1.5">
                          <span>⚠</span>
                          {item.warning}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
