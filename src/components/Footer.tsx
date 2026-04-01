/**
 * Footer.tsx
 *
 * The site-wide footer, rendered at the bottom of every page. It serves
 * three purposes:
 *
 *  1. BRANDING — Repeats the salon name and Chinese sub-title to reinforce
 *     brand recognition as the user finishes reading the page.
 *
 *  2. CONTACT & LOCATION — Provides the WeChat booking ID and the physical
 *     address in a scannable format so customers can grab the info without
 *     scrolling back up.
 *
 *  3. NAVIGATION — Three anchor links allow the user to jump directly back
 *     to key sections (Services, Visit Us, Booking) without scrolling to the
 *     top for the main navigation bar.
 *
 * Layout:
 *  - A centred brand block at the top
 *  - A 3-column grid below it (description | contact | nav links)
 *  - A bottom bar with copyright text and the address (mirrors the meta
 *    information one would expect in a traditional footer)
 *
 * Decorative elements mirror those used throughout the page (spinning rings,
 * star sparkles) for visual continuity.
 *
 * All text is driven through the `useLang` translation hook.
 */

import { useLang } from '../context/LangContext'

/**
 * Footer component — site-wide footer rendered at the bottom of the layout.
 *
 * No props are accepted; all content comes from the translation context.
 */
export default function Footer() {
  // Pull the `t` translation helper from the language context.
  const { t } = useLang()

  return (
    /**
     * `relative overflow-hidden` — creates a stacking context and clips the
     * large decorative circles that extend beyond the footer's edges.
     * `bg-[#fce8ed]` — a noticeably deeper pink than the page body, signalling
     * a visual end-cap to the content, similar to how traditional print
     * layouts use a coloured footer band.
     * `pt-16 pb-10` — generous top padding so the brand block has room to breathe;
     * slightly less bottom padding since the copyright bar already has its own
     * `pt-8`.
     */
    <footer className="relative bg-[#fce8ed] pt-16 pb-10 px-6 overflow-hidden">

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — bottom-right spinning rings                      */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Two concentric dashed circles anchored to the bottom-right corner,
       * spinning slowly clockwise. At 30% opacity against the already-pink
       * footer background they add texture without creating visual noise.
       */}
      <div className="absolute -bottom-16 -right-16 w-72 h-72 animate-spin-slow pointer-events-none opacity-30">
        <svg viewBox="0 0 288 288" fill="none">
          {/* Outer ring */}
          <circle cx="144" cy="144" r="128" stroke="#e8789a" strokeWidth="1"   strokeDasharray="6 10" />
          {/* Inner ring */}
          <circle cx="144" cy="144" r="90"  stroke="#e8789a" strokeWidth="0.5" strokeDasharray="3 8"  />
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — top-left quarter-circle arcs (static)            */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Two arcs anchored to the very top-left corner (cx=0, cy=0). Because
       * both circles are positioned at the corner origin and the SVG viewport
       * is 200×160, only the bottom-right quadrant of each circle is visible —
       * creating a rising arc effect that frames the brand text.
       * 20% opacity keeps it very subtle.
       */}
      <div className="absolute top-0 left-0 opacity-20 pointer-events-none">
        <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
          <circle cx="0" cy="0" r="120" stroke="#e8789a" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="70"  stroke="#e8789a" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — star sparkles                                    */}
      {/* ------------------------------------------------------------------ */}
      {/* Two small 4-pointed star sparkles maintain the same decorative
          vocabulary used in Hero and Services. */}

      {/* Star — upper-right quadrant, base float animation */}
      <div className="absolute top-[25%] right-[8%] animate-float opacity-30 pointer-events-none"><svg width="8" height="8" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* Star — lower-left quadrant, delayed float, more transparent */}
      <div className="absolute bottom-[25%] left-[8%] animate-float-delayed opacity-20 pointer-events-none"><svg width="6" height="6" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* ------------------------------------------------------------------ */}
      {/* CONTENT CONTAINER                                                   */}
      {/* ------------------------------------------------------------------ */}
      {/* `relative z-10` lifts the content above the decorative layers. */}
      <div className="max-w-6xl mx-auto relative z-10">

        {/* ---- Brand block ----------------------------------------------- */}
        {/*
         * Centred at the top of the footer. Repeats the brand name in the same
         * serif font and scale as the in-page sections, followed by the Chinese
         * sub-title "精品美甲工作室" (Premium Nail Studio).
         *
         * The decorative divider below the brand text mirrors the ornament used
         * in every section heading for visual harmony.
         */}
        <div className="text-center mb-12">
          {/* Brand name in large light serif — intentionally hard-coded, not translated */}
          <h3 className="font-serif text-3xl font-light tracking-[0.22em] text-[#c0507a] mb-1">Nail Box</h3>
          {/*
           * Chinese tagline hard-coded here because it is a fixed brand element
           * ("精品美甲工作室" = Premium Nail Studio) that appears below the
           * English name regardless of the active locale — just like a bilingual
           * logo treatment.
           */}
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#e8789a] mb-5">精品美甲工作室</p>
          {/* Decorative ornament divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-px bg-[#f0a0b8]/50" />
            <svg width="8" height="8" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a" opacity="0.6"/></svg>
            <div className="w-16 h-px bg-[#f0a0b8]/50" />
          </div>
        </div>

        {/* ================================================================ */}
        {/* THREE-COLUMN GRID: Description | Contact | Navigation            */}
        {/* ================================================================ */}
        {/*
         * On md+ screens: three equal columns separated by bottom padding and
         * a border-bottom divider.
         * On smaller screens: a single column (each column stacks vertically).
         */}
        <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-[#f0a0b8]/30">

          {/* ---- Column 1: Salon description ----------------------------- */}
          {/*
           * A short paragraph about the salon (pulled from the `ft_desc`
           * translation key). `whitespace-pre-line` preserves any deliberate
           * line breaks embedded in the translation string.
           */}
          <div>
            <p className="text-[#9a4065] text-xs leading-relaxed whitespace-pre-line">{t('ft_desc')}</p>
          </div>

          {/* ---- Column 2: Contact details ------------------------------- */}
          {/*
           * WeChat ID and physical address. The WeChat line uses an inline
           * `<span>` for the actual handle so it can be styled differently
           * (darker, bolder) from the label prefix.
           */}
          <div>
            {/* Section label — e.g. "CONTACT" */}
            <h4 className="text-[10px] tracking-[0.32em] uppercase text-[#e8789a] mb-5">{t('ft_contact')}</h4>
            <div className="space-y-2.5">
              {/* WeChat line: translatable label prefix + hard-coded ID */}
              <p className="text-[#9a4065] text-sm">{t('ft_wechat')}<span className="text-[#c0507a] font-medium">nailbox11</span></p>
              {/* Street address — hard-coded as it is a fixed physical location */}
              <p className="text-[#9a4065] text-sm">888 S Hope St</p>
              {/* City, state, ZIP */}
              <p className="text-[#9a4065] text-sm">Los Angeles, CA 90017</p>
            </div>
          </div>

          {/* ---- Column 3: Navigation links ----------------------------- */}
          {/*
           * Three anchor links that scroll the page to the corresponding
           * section. The links are defined as a typed const array to get
           * autocomplete on the `key` strings and to keep the JSX clean.
           *
           * Using `as const` narrows the type of `key` to the specific string
           * literals so TypeScript knows they are valid translation keys.
           */}
          <div>
            {/* Section label — e.g. "EXPLORE" */}
            <h4 className="text-[10px] tracking-[0.32em] uppercase text-[#e8789a] mb-5">{t('ft_nav')}</h4>
            <div className="space-y-2.5">
              {([
                { key: 'ft_services', href: '#services' }, // -> Services section
                { key: 'ft_visit',    href: '#visit'    }, // -> Store Info / Visit section
                { key: 'ft_book',     href: '#booking'  }, // -> Booking section
              ] as const).map(link => (
                /**
                 * Each link is a block-level anchor so its hit area spans the
                 * full width of the column, making it easy to tap on mobile.
                 * `hover:text-[#e8789a]` provides clear hover feedback.
                 */
                <a key={link.href} href={link.href}
                  className="block text-[#9a4065] hover:text-[#e8789a] text-sm transition-colors duration-200">
                  {t(link.key)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ---- Bottom bar: copyright + address --------------------------- */}
        {/*
         * A slim row below the main grid containing:
         *  - Copyright text (left) — translated, includes the current year
         *  - Address echo (right)  — hard-coded, reinforces the location for
         *    SEO and for customers who might screenshot the footer
         *
         * On small screens: stacks vertically and centres (`flex-col`).
         * On sm+ screens: side-by-side (`sm:flex-row justify-between`).
         */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-[#c090a0] text-xs">
          {/* Copyright line — e.g. "© 2026 Nail Box. All rights reserved." */}
          <p>{t('ft_copy')}</p>
          {/* Physical address repeated for quick reference */}
          <p>888 S Hope St, Los Angeles, CA 90017</p>
        </div>
      </div>
    </footer>
  )
}
