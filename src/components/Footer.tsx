export default function Footer() {
  return (
    <footer className="bg-[#3d302c] text-white py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-light tracking-[0.18em] mb-1">Nail Box</h3>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#c4a898] mb-4">
              精品美甲工作室
            </p>
            <p className="text-white/40 text-xs leading-relaxed">
              专业美甲 · 精心服务
              <br />
              Premium Nail Art Studio
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#c4a898] mb-5">
              联系我们 / Contact
            </h4>
            <div className="space-y-2.5">
              <p className="text-white/60 text-sm">
                微信 WeChat：
                <span className="text-white/80">nailbox11</span>
              </p>
              <p className="text-white/60 text-sm">888 S Hope St</p>
              <p className="text-white/60 text-sm">Los Angeles, CA 90017</p>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#c4a898] mb-5">
              快速导航 / Navigation
            </h4>
            <div className="space-y-2.5">
              {[
                { label: '服务项目', href: '#services' },
                { label: '到店指南', href: '#visit' },
                { label: '立即预约', href: '#booking' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-white/60 hover:text-white/90 text-sm transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-white/25 text-xs">
          <p>© 2025 Nail Box. All rights reserved.</p>
          <p>888 S Hope St, Los Angeles, CA 90017</p>
        </div>
      </div>
    </footer>
  )
}
