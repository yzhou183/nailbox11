/**
 * StoreInfo.tsx
 *
 * The "Visit Us" section of the main page, providing customers with
 * everything they need to physically find and arrive at the salon:
 *
 *  LEFT COLUMN — Store Information cards:
 *    - Address card   : Full street address in Los Angeles
 *    - WeChat card    : Booking contact handle + instructional note
 *
 *  RIGHT COLUMN — Parking Instructions:
 *    - A numbered step-by-step guide (3 steps) for navigating to the
 *      salon's parking. Step 3 includes a warning flag because it contains
 *      a critical note customers must not miss (e.g. "Do not use visitor
 *      parking — you will be towed").
 *    - A vertical connecting line between the step bubbles creates a visual
 *      "timeline" or "stepper" pattern.
 *
 * All text content is sourced from the `useLang` translation hook so the
 * section renders correctly in both Chinese and English.
 */

import { useLang } from '../context/LangContext'

/**
 * StoreInfo component — rendered as the "visit" anchor section.
 *
 * No props are accepted; content comes entirely from the translation context.
 */
export default function StoreInfo() {
  // Pull the `t` translation helper from the language context.
  // Every visible string except the hard-coded address and WeChat ID goes
  // through `t()` so it switches language when the user toggles the locale.
  const { t } = useLang()

  /**
   * parkingSteps — the structured data for the parking instructions stepper.
   *
   * Each step has:
   *  - `step`    : The display number string ("01", "02", "03") shown inside
   *                the circular step bubble.
   *  - `title`   : A short heading for the instruction.
   *  - `desc`    : The full instructional paragraph for that step.
   *  - `warning` : An optional caution string that renders with a ⚠ icon.
   *                Only step 03 has a warning; for steps 01 and 02 this key
   *                is intentionally omitted (returns undefined/empty string).
   *
   * The array is built here rather than in a data file because the content is
   * small, tightly coupled to this component, and needs to reference `t()`.
   */
  const parkingSteps = [
    { step: '01', title: t('p1_title'), desc: t('p1_desc') },
    { step: '02', title: t('p2_title'), desc: t('p2_desc') },
    {
      step: '03',
      title: t('p3_title'),
      desc: t('p3_desc'),
      warning: t('p3_warn'), // Critical warning — rendered with special styling
    },
  ]

  return (
    /**
     * Section anchor: id="visit" — allows the Footer's navigation link to
     * scroll directly here via href="#visit".
     *
     * `bg-[#fff5f8]` — a slightly warmer/deeper pink than the Services
     * section's plain white, providing a visual rhythm of alternating
     * backgrounds as the user scrolls down the page.
     */
    <section id="visit" className="py-24 px-6 bg-[#fff5f8]">
      <div className="max-w-6xl mx-auto">

        {/* ---- Section heading ------------------------------------------ */}
        {/*
         * Follows the same eyebrow -> heading -> sub -> divider pattern used
         * throughout the page for visual consistency.
         */}
        <div className="text-center mb-14">
          {/* Eyebrow — e.g. "FIND US" */}
          <p className="text-[10px] tracking-[0.42em] uppercase text-[#c090a0] mb-3">{t('store_eyebrow')}</p>
          {/* Main section title — e.g. "Visit the Studio" / "到访我们" */}
          <h2 className="font-serif text-4xl md:text-5xl text-[#c0507a] font-light">{t('store_title')}</h2>
          {/* Italic serif sub-heading */}
          <p className="font-serif text-lg text-[#e8789a] italic mt-1">{t('store_sub')}</p>
          {/* Decorative diamond + line divider */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="w-10 h-px bg-[#f9d0da]" />
            <svg width="8" height="8" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a" /></svg>
            <div className="w-10 h-px bg-[#f9d0da]" />
          </div>
        </div>

        {/* ================================================================ */}
        {/* TWO-COLUMN LAYOUT: Store Info (left) + Parking Guide (right)     */}
        {/* ================================================================ */}
        {/*
         * `grid md:grid-cols-2` — single column on mobile, two equal columns
         * on md+ screens.
         * `items-start` — prevents the shorter column from stretching to match
         * the taller one, which would push cards apart unnaturally.
         */}
        <div className="grid md:grid-cols-2 gap-10 items-start">

          {/* ============================================================ */}
          {/* LEFT COLUMN — Store Information Cards                         */}
          {/* ============================================================ */}
          <div>
            <h3 className="font-serif text-2xl text-[#c0507a] mb-6">
              {t('store_info')}
            </h3>

            {/* `space-y-4` adds consistent vertical spacing between the two cards */}
            <div className="space-y-4">

              {/* ---- Address Card ---------------------------------------- */}
              {/*
               * Each info card uses the same layout pattern:
               *  - A circular icon badge on the left (flex-shrink-0 so it
               *    never collapses on narrow viewports)
               *  - A text block on the right with a micro-label on top and
               *    the actual value below
               *
               * `hover:shadow-md hover:border-[#f0a0b8]` gives cards a
               * subtle interactive feel even though they are not clickable.
               */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#fce8ed] shadow-sm hover:shadow-md hover:border-[#f0a0b8] transition-all duration-300">
                {/* Map pin icon badge */}
                <div className="w-10 h-10 rounded-full bg-[#fce8ed] flex items-center justify-center shrink-0 text-[#e8789a]">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    {/* Inner dot of the map pin */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    {/* Outer teardrop shape of the map pin */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                {/* Address text — hard-coded because it is a fixed physical location */}
                <div>
                  {/* Bilingual micro-label */}
                  <p className="text-[10px] tracking-[0.26em] uppercase text-[#c090a0] mb-1">{t('addr_label')} / Address</p>
                  {/* Street number and name */}
                  <p className="text-[#c0507a] font-medium">888 S Hope St</p>
                  {/* City, state, ZIP */}
                  <p className="text-[#9a4065] text-sm">Los Angeles, CA 90017</p>
                </div>
              </div>

              {/* ---- WeChat Card ----------------------------------------- */}
              {/*
               * The salon's primary booking channel is WeChat. This card makes
               * the WeChat ID easy to spot and copy, and includes a note that
               * clarifies customers should add the ID and message to book.
               */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#fce8ed] shadow-sm hover:shadow-md hover:border-[#f0a0b8] transition-all duration-300">
                {/* Chat bubble icon badge */}
                <div className="w-10 h-10 rounded-full bg-[#fce8ed] flex items-center justify-center shrink-0 text-[#e8789a]">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    {/* Three dots (ellipsis) representing a chat/message interface */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                </div>
                <div>
                  {/* Bilingual micro-label */}
                  <p className="text-[10px] tracking-[0.26em] uppercase text-[#c090a0] mb-1">{t('wechat_label')} / WeChat</p>
                  {/* The WeChat handle — hard-coded as it is a fixed business identifier */}
                  <p className="text-[#c0507a] font-medium">nailbox11</p>
                  {/* Instructional note e.g. "Add to book your appointment" */}
                  <p className="text-[#9a4065] text-sm">{t('wechat_note')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN — Parking Instructions (Stepper)                 */}
          {/* ============================================================ */}
          <div>
            <h3 className="font-serif text-2xl text-[#c0507a] mb-6">{t('store_parking')}</h3>

            {/*
             * The stepper wrapper is `relative` so the vertical connecting line
             * can be absolutely positioned between the step bubbles.
             */}
            <div className="relative">
              {/*
               * Vertical connector line — a 1px-wide pink line that runs from
               * just below the first step bubble to just above the last one.
               * `left-[19px]` aligns it with the horizontal centre of the 40px
               * (w-10) step bubble (10px padding + 20px half-width = 20px,
               * minus 0.5px line offset ≈ 19px from the left edge of the card).
               * `top-10 bottom-10` leaves space so the line doesn't poke
               * through the first or last step's circular badge.
               * `pointer-events-none` prevents it from blocking interactions.
               */}
              <div className="absolute left-[19px] top-10 bottom-10 w-px bg-[#fce8ed] pointer-events-none" />

              {/* Render each parking step */}
              <div className="space-y-4">
                {parkingSteps.map((item, i) => (
                  /**
                   * Individual step card.
                   *
                   * Conditional styling based on whether this step has a warning:
                   *  - Warning step  -> pinkish background + stronger border to
                   *                    draw attention; no hover effect (always
                   *                    highlighted).
                   *  - Normal step   -> white background with hover highlight.
                   *
                   * `key={i}` is acceptable here because the parkingSteps array
                   * is static and never reordered.
                   */
                  <div key={i} className={`relative flex gap-5 p-5 rounded-2xl border transition-all duration-300 ${
                    item.warning
                      ? 'bg-[#fce8ed] border-[#f0a0b8]/50'           // Warning: always-highlighted pink card
                      : 'bg-white border-[#fce8ed] hover:border-[#f0a0b8] hover:shadow-sm' // Normal: white + hover effect
                  }`}>

                    {/* Step number bubble — circular badge with serif number */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#fff5f8] border border-[#fce8ed] flex items-center justify-center">
                      <span className="font-serif text-sm font-medium text-[#e8789a]">{item.step}</span>
                    </div>

                    {/* Step content — title + description + optional warning */}
                    {/*
                     * `pt-1` nudges the text down slightly to vertically align
                     * the title with the centre of the circular step bubble.
                     */}
                    <div className="pt-1">
                      {/* Step title — short bold label for the instruction */}
                      <p className="font-medium text-[#c0507a] text-sm mb-1.5">{item.title}</p>
                      {/* Step description — full instructional text */}
                      <p className="text-sm text-[#9a4065] leading-relaxed">{item.desc}</p>
                      {/*
                       * Warning message — only rendered for steps where `warning`
                       * is a non-empty string (currently only step 03).
                       * The ⚠ icon is a plain Unicode character for simplicity;
                       * colour and weight are used to ensure it reads as a caution
                       * rather than just additional body text.
                       */}
                      {item.warning && (
                        <p className="text-xs text-[#e8789a] mt-2 font-medium flex items-center gap-1.5">
                          <span>⚠</span>{item.warning}
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
