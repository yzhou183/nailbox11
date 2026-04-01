/**
 * Services.tsx
 *
 * Displays the salon's full menu of services, split into two tiers:
 *
 *  1. "Basic Services" (basicServices) — the primary nail treatments offered
 *     (e.g. gel manicure, pedicure). Rendered as larger cards in a 3-column
 *     grid so each service gets visual breathing room to show its price and
 *     optional duration badge.
 *
 *  2. "Add-on Services" (addonServices) — supplementary enhancements that
 *     customers can pair with a basic service (e.g. nail art, repairs).
 *     Rendered as compact single-line rows in a 2–3-column grid, since the
 *     per-item information is minimal (name + price).
 *
 * Data is imported from a centralised data module (`../data/services`) so
 * the service catalogue can be updated in one place without touching this UI.
 *
 * Language switching is handled via the `useLang` context:
 *  - `t(key)` -> returns the translated UI label string
 *  - `lang`   -> the active locale code ('zh' | 'en'), used to decide which
 *               service name field to display per card
 */

import { basicServices, addonServices } from '../data/services'
import { useLang } from '../context/LangContext'

/**
 * Services component — the "Our Services" section of the main page.
 *
 * No props are accepted; all content comes from the static data arrays and
 * the language context.
 */
export default function Services() {
  // `lang` lets us conditionally render Chinese vs English service names.
  // `t`    provides translated UI labels (section headings, notes, etc.).
  const { lang, t } = useLang()

  /**
   * svcName — selects the correct localised name for a service card.
   *
   * Each service object has both a Chinese name (`name`) and an English name
   * (`nameEn`). This helper centralises the locale-switching logic so we
   * don't repeat the ternary expression in every map callback.
   *
   * @param name   - The Chinese name of the service
   * @param nameEn - The English name of the service
   * @returns The name string appropriate for the currently active language
   */
  const svcName = (name: string, nameEn: string) => lang === 'zh' ? name : nameEn

  return (
    /**
     * Section anchor: id="services" allows the Hero's "View Services" CTA to
     * scroll directly to this section via href="#services".
     *
     * `relative overflow-hidden` — needed so the large decorative circles that
     * extend beyond the section bounds are clipped and don't cause scroll overflow.
     * `py-28 px-6` — generous vertical padding keeps the section breathing;
     * horizontal padding ensures side margins on narrow viewports.
     */
    <section id="services" className="relative py-28 px-6 bg-white overflow-hidden">

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — top-right spinning dashed rings                  */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Mirrors the Hero's top-right ring decoration but at a smaller scale
       * (380px vs 580px) and lower opacity (30%) so it is more subtle on the
       * white background. Spins slowly clockwise via `animate-spin-slow`.
       */}
      <div className="absolute -top-16 -right-16 w-[380px] h-[380px] animate-spin-slow pointer-events-none opacity-30">
        <svg viewBox="0 0 380 380" fill="none">
          {/* Outer dashed ring */}
          <circle cx="190" cy="190" r="170" stroke="#fce8ed" strokeWidth="1"   strokeDasharray="6 12" />
          {/* Inner dashed ring — tighter gap ratio for variety */}
          <circle cx="190" cy="190" r="130" stroke="#fce8ed" strokeWidth="0.6" strokeDasharray="3 9"  />
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — bottom-left quarter-circle arcs (static)         */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Same quarter-arc treatment as in Hero, providing visual continuity
       * across sections. Anchored at cx=0, cy=260 so only the upper-right
       * quadrant is visible within the SVG viewport.
       */}
      <div className="absolute -bottom-10 -left-10 pointer-events-none opacity-30">
        <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
          <circle cx="0" cy="260" r="150" stroke="#fce8ed" strokeWidth="1"   />
          <circle cx="0" cy="260" r="90"  stroke="#fce8ed" strokeWidth="0.6" />
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — scattered star sparkles                          */}
      {/* ------------------------------------------------------------------ */}
      {/* Three small 4-pointed stars at different positions and animation
          phases to maintain the same sparkle language as the Hero section. */}

      {/* Star — top-left, small, base float */}
      <div className="absolute top-[12%] left-[5%] animate-float opacity-40 pointer-events-none"><svg width="8" height="8" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* Star — mid-right edge, slightly larger, delayed float */}
      <div className="absolute top-[45%] right-[4%] animate-float-delayed opacity-30 pointer-events-none"><svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#f0a0b8"/></svg></div>

      {/* Star — bottom-left, tiny, shimmer-delay animation */}
      <div className="absolute bottom-[18%] left-[7%] animate-shimmer-delay opacity-25 pointer-events-none"><svg width="7" height="7" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* ------------------------------------------------------------------ */}
      {/* CONTENT CONTAINER                                                   */}
      {/* ------------------------------------------------------------------ */}
      {/* max-w-6xl caps the content width on ultra-wide screens; `relative z-10`
          ensures it renders above the decorative absolute-positioned elements. */}
      <div className="max-w-6xl mx-auto relative z-10">

        {/* ---- Section heading ------------------------------------------ */}
        {/*
         * The section header follows the same pattern used in StoreInfo and
         * Footer: eyebrow label -> main heading -> italic sub-heading -> divider.
         * This consistency creates a recognisable section-entry rhythm across
         * the whole page.
         */}
        <div className="text-center mb-16">
          {/* Eyebrow: tiny all-caps label (e.g. "OUR MENU") */}
          <p className="text-[10px] tracking-[0.42em] uppercase text-[#c090a0] mb-3">{t('svc_eyebrow')}</p>
          {/* Main heading: large serif title (e.g. "Services" / "服务项目") */}
          <h2 className="font-serif text-4xl md:text-5xl text-[#c0507a] font-light">{t('svc_title')}</h2>
          {/* Italic serif sub-heading — adds a touch of personality */}
          <p className="font-serif text-lg text-[#e8789a] italic mt-1">{t('svc_sub')}</p>
          {/* Decorative ornament divider — lines + diamond + dot */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="w-10 h-px bg-[#f9d0da]" />
            <svg width="8" height="8" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a" /></svg>
            <div className="w-10 h-px bg-[#f9d0da]" />
          </div>
        </div>

        {/* ================================================================ */}
        {/* BASIC SERVICES GRID                                              */}
        {/* ================================================================ */}
        {/*
         * "Basic" services are the salon's core offerings — the treatments
         * a customer would book as their main appointment.
         *
         * Layout: 3-column grid on md+ screens; single column on mobile.
         * Each card uses `flex flex-col` so the price row can be pushed to the
         * bottom with `mt-auto`, regardless of how long the name text is.
         */}
        <div className="mb-16">

          {/* Sub-section heading row */}
          <div className="flex items-center gap-3 mb-8">
            {/* Chinese / English section label */}
            <h3 className="font-serif text-2xl text-[#c0507a] font-light">{t('svc_basic')}</h3>
            {/* Optional English caption alongside the Chinese heading */}
            {t('svc_basic_en') && <span className="text-xs text-[#c090a0] tracking-widest uppercase">{t('svc_basic_en')}</span>}
            {/* Horizontal rule that expands to fill remaining row width */}
            <div className="flex-1 h-px bg-[#fce8ed] ml-2" />
          </div>

          {/* 3-column card grid */}
          <div className="grid md:grid-cols-3 gap-5">
            {basicServices.map(service => (
              /**
               * Individual service card.
               *
               * Hover state: background and border darken slightly, and a
               * subtle shadow appears — providing haptic-like feedback even
               * though these are not clickable links.
               *
               * `key={service.id}` — React reconciliation key, must be stable
               * and unique within the list.
               */
              <div key={service.id}
                className="group bg-[#fef5f7] hover:bg-[#fce8ed] border border-[#fce8ed] hover:border-[#f0a0b8] rounded-2xl p-7 transition-all duration-300 flex flex-col hover:shadow-md">

                {/* Card body — name + secondary language label */}
                <div className="mb-5 flex-1">
                  {/* Primary name: switches language via svcName() helper */}
                  <h4 className="font-serif text-xl text-[#c0507a] mb-1 leading-snug group-hover:text-[#e8789a] transition-colors duration-300">
                    {svcName(service.name, service.nameEn)}
                  </h4>
                  {/*
                   * Secondary name: always shows the OTHER language so bilingual
                   * customers can cross-reference. If active lang is 'zh', this
                   * shows the English name, and vice-versa.
                   */}
                  <p className="text-xs text-[#c090a0] tracking-wide">{lang === 'zh' ? service.nameEn : service.name}</p>
                </div>

                {/* Card footer — price + optional duration badge */}
                {/*
                 * `mt-auto` pushes this row to the bottom of the card even
                 * when card heights differ (e.g. a service with a longer name).
                 * A top border visually separates price info from the name area.
                 */}
                <div className="flex items-end justify-between mt-auto pt-4 border-t border-[#fce8ed] group-hover:border-[#f0a0b8]/50 transition-colors duration-300">
                  {/* Price — larger serif number, accent pink */}
                  <span className="font-serif text-2xl font-light text-[#e8789a]">{service.price}</span>
                  {/*
                   * Duration badge — only rendered if the service has a known
                   * time estimate. Displayed as a small pill tag on the right
                   * side of the footer row.
                   */}
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

        {/* ================================================================ */}
        {/* ADD-ON SERVICES GRID                                             */}
        {/* ================================================================ */}
        {/*
         * "Add-on" services are enhancements that a customer combines with a
         * basic service. They have less information to display (no extended
         * description), so a compact single-line row layout is used instead
         * of the full card format above.
         *
         * Layout: 2-column on sm+, 3-column on lg+ screens.
         */}
        <div>

          {/* Sub-section heading row — identical structure to basic section */}
          <div className="flex items-center gap-3 mb-8">
            <h3 className="font-serif text-2xl text-[#c0507a] font-light">{t('svc_addon')}</h3>
            {t('svc_addon_en') && <span className="text-xs text-[#c090a0] tracking-widest uppercase">{t('svc_addon_en')}</span>}
            <div className="flex-1 h-px bg-[#fce8ed] ml-2" />
          </div>

          {/* Compact row grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {addonServices.map(service => (
              /**
               * Individual add-on row.
               *
               * Uses `flex items-center justify-between` so the name sits on
               * the left and the price floats to the right — a classic menu
               * price list layout.
               *
               * `min-w-0` on the left div + `truncate` on the name prevents
               * very long service names from overflowing into the price column.
               * `shrink-0` on the price prevents it from collapsing.
               */
              <div key={service.id}
                className="flex items-center justify-between bg-[#fef5f7] hover:bg-[#fce8ed] border border-[#fce8ed] hover:border-[#f0a0b8] rounded-xl px-5 py-4 transition-all duration-200 group">

                {/* Left side: name + optional duration */}
                <div className="min-w-0 mr-4">
                  <p className="text-sm font-medium text-[#c0507a] group-hover:text-[#e8789a] truncate transition-colors">
                    {svcName(service.name, service.nameEn)}
                  </p>
                  {/* Duration shown as small secondary text below the name if available */}
                  {service.duration && <p className="text-xs text-[#c090a0] mt-0.5">{service.duration}</p>}
                </div>

                {/* Right side: price — shrink-0 keeps it from being squeezed */}
                <span className="text-sm font-medium text-[#e8789a] shrink-0">{service.price}</span>
              </div>
            ))}
          </div>

          {/* ---- Pricing disclaimer note --------------------------------- */}
          {/*
           * A small centred note below the add-on grid — typically something
           * like "Prices may vary based on complexity" or a booking reminder.
           * Kept intentionally subtle (xs text, muted colour) so it does not
           * compete with the service listings.
           */}
          <p className="text-xs text-[#c090a0] mt-6 text-center">{t('svc_note')}</p>
        </div>
      </div>
    </section>
  )
}
