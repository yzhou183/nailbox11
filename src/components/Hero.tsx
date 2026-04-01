/**
 * Hero.tsx
 *
 * The full-screen landing section that is the very first thing a visitor sees.
 * It is responsible for:
 *  - Establishing the brand identity (salon name, tagline, sub-copy)
 *  - Displaying the primary WeChat booking ID prominently
 *  - Providing two CTA (call-to-action) buttons that anchor-scroll to the
 *    booking and services sections
 *  - Rendering a rich decorative background layer (rotating SVG rings,
 *    floating star shapes, and nail-petal silhouettes) that creates depth
 *    without impacting interactivity (pointer-events-none on every decoration)
 *  - Animating a "scroll" indicator at the bottom to invite the user downward
 *
 * All visible text is driven through the `useLang` translation hook so the
 * component supports both Chinese and English without any hard-coded strings
 * (except the brand name "Nail Box" and the WeChat ID "nailbox11", which are
 * intentionally language-agnostic).
 */

import { useLang } from '../context/LangContext'

/**
 * Hero component — rendered once at the top of the main page layout.
 *
 * No props are accepted; all data comes from global context (language) and
 * the site's design tokens (Tailwind classes / CSS custom animations).
 */
export default function Hero() {
  // Pull the translation helper `t` from the language context.
  // `t(key)` returns the correct string for the currently active locale.
  const { t } = useLang()

  return (
    /**
     * Outer section:
     * - `relative` establishes a stacking context so absolutely-positioned
     *   decorations stay contained within the hero bounds.
     * - `min-h-screen` ensures the hero always fills the full viewport height.
     * - `flex items-center justify-center` centres the content card both
     *   vertically and horizontally.
     * - `overflow-hidden` clips the large decorative circles that intentionally
     *   extend beyond the section edges.
     * - `bg-[#fff8fa]` — a very pale warm pink that is the hero's background.
     */
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fff8fa]">

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — top-right rotating rings (clockwise)             */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Two dashed circles with different radii create a layered "orbit" ring
       * effect in the upper-right corner. The entire group uses `animate-spin-slow`
       * (a custom Tailwind animation) to rotate gently clockwise.
       * `pointer-events-none` prevents these purely visual elements from
       * accidentally blocking clicks on content beneath them.
       */}
      <div className="absolute -top-28 -right-28 w-[580px] h-[580px] animate-spin-slow pointer-events-none">
        <svg viewBox="0 0 580 580" fill="none">
          {/* Outer dashed ring — wider gaps give it an airy, delicate look */}
          <circle cx="290" cy="290" r="270" stroke="#ffd0dc" strokeWidth="1"   strokeDasharray="8 14" />
          {/* Inner dashed ring — smaller dash pattern for visual variety */}
          <circle cx="290" cy="290" r="230" stroke="#ffd0dc" strokeWidth="0.5" strokeDasharray="4 10" />
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — top-right counter-rotating ring                  */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * A third circle at a tighter radius that spins in the OPPOSITE direction
       * (`animate-spin-reverse`) to the two above. The contrasting rotation
       * directions create a mesmerising layered-orbit effect.
       */}
      <div className="absolute -top-28 -right-28 w-[580px] h-[580px] animate-spin-reverse pointer-events-none">
        <svg viewBox="0 0 580 580" fill="none">
          <circle cx="290" cy="290" r="190" stroke="#ffe0ea" strokeWidth="1" strokeDasharray="12 8" />
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — bottom-left quarter-circle arcs (static)         */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Three concentric arcs anchored to the bottom-left corner. Because they
       * are positioned at cx=0, cy=300 inside a 300×300 viewport, only the
       * top-right quadrant is visible — creating a rising quarter-sun effect.
       * These are static (no animation) to contrast with the spinning rings.
       */}
      <div className="absolute -bottom-8 -left-8 pointer-events-none">
        <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
          <circle cx="0" cy="300" r="160" stroke="#ffe0ea" strokeWidth="0.8" />
          <circle cx="0" cy="300" r="105" stroke="#ffe0ea" strokeWidth="0.6" />
          <circle cx="0" cy="300" r="52"  stroke="#ffe0ea" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — floating 4-pointed star sparkles                 */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Each sparkle is an inline SVG rendering a 4-pointed star path.
       * They are scattered around the viewport at various positions, sizes,
       * and opacities, and each uses a different stagger-variant of the
       * `animate-float` / `animate-shimmer` custom keyframe animations to
       * avoid a uniform, robotic feel.
       *
       * None of these intercept pointer events — they are purely decorative.
       */}

      {/* Star — upper-left area, medium pink, gentle float */}
      <div className="absolute top-[17%] left-[9%]   animate-float          pointer-events-none opacity-70"><svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* Star — mid-right edge, smaller, slower float, more transparent */}
      <div className="absolute top-[38%] right-[11%]  animate-float-slow     pointer-events-none opacity-50"><svg width="8"  height="8"  viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* Star — lower-right area, lighter hue (#f0b0c4), delayed float */}
      <div className="absolute top-[63%] right-[7%]   animate-float-delayed  pointer-events-none opacity-60"><svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#f0b0c4"/></svg></div>

      {/* Star — bottom-left quadrant, largest of the stars, third delay */}
      <div className="absolute bottom-[22%] left-[14%] animate-float-delay3  pointer-events-none opacity-55"><svg width="13" height="13" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* Star — upper-centre-right, smallest, shimmer animation (fade in/out) */}
      <div className="absolute top-[22%] right-[28%]  animate-shimmer        pointer-events-none opacity-55"><svg width="7"  height="7"  viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* Star — mid-right, pale pink (#ffd0dc), shimmer with phase delay */}
      <div className="absolute bottom-[38%] right-[22%] animate-shimmer-delay pointer-events-none opacity-40"><svg width="9"  height="9"  viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#ffd0dc"/></svg></div>

      {/* Star — mid-left edge, tiny, second shimmer phase */}
      <div className="absolute top-[55%] left-[5%]    animate-shimmer-delay2 pointer-events-none opacity-50"><svg width="6"  height="6"  viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#e8789a"/></svg></div>

      {/* ------------------------------------------------------------------ */}
      {/* DECORATIVE LAYER — nail / petal silhouettes (ellipses)              */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * These ellipses are rotated at slight angles to mimic an abstract nail
       * or petal shape. They are much larger than the star sparkles but highly
       * transparent (opacity 0.2–0.3) so they add warmth without overpowering
       * the actual content.
       */}

      {/* Left-side petal — rotated −22°, soft pink, delayed float */}
      <div className="absolute top-[43%] left-[5%] animate-float-delayed pointer-events-none opacity-30"><svg width="22" height="38" viewBox="0 0 24 42"><ellipse cx="12" cy="21" rx="8" ry="18" fill="#f0b0c4" transform="rotate(-22 12 21)"/></svg></div>

      {/* Right-side petal — rotated +16°, paler pink, base float speed */}
      <div className="absolute top-[28%] right-[5%] animate-float pointer-events-none opacity-20"><svg width="18" height="32" viewBox="0 0 24 42"><ellipse cx="12" cy="21" rx="8" ry="18" fill="#ffd0dc" transform="rotate(16 12 21)"/></svg></div>

      {/* Lower-right petal — rotated −8°, lightest hue, slow float */}
      <div className="absolute bottom-[28%] right-[16%] animate-float-slow pointer-events-none opacity-20"><svg width="20" height="36" viewBox="0 0 24 42"><ellipse cx="12" cy="21" rx="8" ry="18" fill="#ffe0ea" transform="rotate(-8 12 21)"/></svg></div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT — centred card                                         */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * `relative z-10` lifts the content above the absolute-positioned
       * decorative elements so it is always readable and clickable.
       * `max-w-2xl mx-auto` constrains line length for comfortable reading.
       */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">

        {/* ---- Eyebrow tagline ------------------------------------------ */}
        {/*
         * Small all-caps letter-spaced text above the logo mark — typically
         * something like "Los Angeles · Premium Nail Studio".
         * `animate-fade-up` slides the element in from below on page load;
         * the inline `animationDelay` staggers it before the heading appears.
         */}
        <p className="text-[10px] tracking-[0.48em] uppercase text-[#c090a0] mb-7 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {t('hero_tagline')}
        </p>

        {/* ---- Brand name heading --------------------------------------- */}
        {/*
         * "Nail Box" is the primary h1 of the page.
         * - Font size scales responsively: 78px -> 96px -> 108px.
         * - `font-light` keeps it elegant rather than heavy.
         * - `tracking-[0.14em]` gives generous letter spacing typical of
         *   luxury brand typography.
         * - The animation delay (0.15 s) makes it appear after the eyebrow.
         */}
        <h1 className="font-serif text-[78px] md:text-[96px] lg:text-[108px] font-light text-[#c0507a] tracking-[0.14em] leading-none mb-7 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          Nail Box
        </h1>

        {/* ---- Decorative SVG divider ------------------------------------ */}
        {/*
         * A horizontal rule composed of:
         *  - Two thin pink lines on the left and right
         *  - A diamond (rotated square) on each side of a centred circle
         * This is a common luxury-brand ornament motif that visually separates
         * the brand name from the sub-copy without using a plain <hr>.
         */}
        <div className="flex items-center justify-center mb-6 animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <svg width="240" height="22" viewBox="0 0 240 22" fill="none">
            {/* Left horizontal rule */}
            <line x1="0" y1="11" x2="94" y2="11" stroke="#ffd0dc" strokeWidth="0.8" />
            {/* Left diamond ornament */}
            <path d="M102 11 L107 5 L112 11 L107 17 Z" fill="#e8789a" opacity="0.7" />
            {/* Centre dot */}
            <circle cx="120" cy="11" r="2.5" fill="#e8789a" />
            {/* Right diamond ornament */}
            <path d="M128 11 L133 5 L138 11 L133 17 Z" fill="#e8789a" opacity="0.7" />
            {/* Right horizontal rule */}
            <line x1="146" y1="11" x2="240" y2="11" stroke="#ffd0dc" strokeWidth="0.8" />
          </svg>
        </div>

        {/* ---- Sub-headline (italic serif) ------------------------------ */}
        {/*
         * A short italic tagline in the brand's accent colour that reinforces
         * the salon's positioning (e.g. "Crafted for You").
         * Appears after the divider with the next animation step.
         */}
        <p className="font-serif text-xl md:text-[22px] text-[#9a4065] font-light italic mb-2 animate-fade-up" style={{ animationDelay: '0.32s' }}>
          {t('hero_sub')}
        </p>

        {/* ---- English caption line ------------------------------------- */}
        {/*
         * A secondary, smaller all-caps label — in practice the English
         * translation of the Chinese sub-headline, shown beneath it for
         * bilingual elegance even when the site language is Chinese.
         */}
        <p className="text-[10px] tracking-[0.35em] text-[#c090a0] uppercase mb-10 animate-fade-up" style={{ animationDelay: '0.38s' }}>
          {t('hero_en')}
        </p>

        {/* ---- WeChat booking card --------------------------------------- */}
        {/*
         * The salon does not use a traditional booking system; instead,
         * customers add the salon's WeChat ID to book appointments.
         * This card makes the ID the most prominent "action item" on the page —
         * visually inside a white pill card so it stands out from the background.
         *
         * Three lines:
         *  1. Small label ("WeChat ID / 微信号")
         *  2. The actual WeChat handle in large bold type
         *  3. A note instructing customers to add and message to book
         */}
        <div className="inline-flex flex-col items-center gap-1.5 bg-white border border-[#fce8ed] rounded-2xl px-8 py-5 mb-10 shadow-sm animate-fade-up" style={{ animationDelay: '0.48s' }}>
          {/* Label — instructional micro-copy */}
          <p className="text-[10px] tracking-[0.32em] uppercase text-[#c090a0]">{t('hero_wechat_label')}</p>
          {/* The WeChat ID itself — intentionally hard-coded as it is a fixed business identifier */}
          <p className="text-2xl font-semibold text-[#c0507a] tracking-wider">nailbox11</p>
          {/* Supporting note e.g. "Add and send a message to book" */}
          <p className="text-xs text-[#c090a0]">{t('hero_wechat_note')}</p>
        </div>

        {/* ---- CTA button row ------------------------------------------- */}
        {/*
         * Two anchor tags styled as buttons:
         *  1. Primary (filled pink) -> scrolls to the #booking section
         *  2. Secondary (outlined)  -> scrolls to the #services section
         *
         * Both use `hover:-translate-y-0.5` for a subtle lift effect on hover,
         * which is a common micro-interaction for premium brand sites.
         *
         * On small screens they stack vertically (`flex-col`);
         * on sm+ screens they sit side-by-side (`sm:flex-row`).
         */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.58s' }}>
          {/* Primary CTA — solid background, high visual weight */}
          <a href="#booking" className="px-10 py-3.5 bg-[#e8789a] hover:bg-[#d0607e] text-white text-[11px] tracking-[0.24em] uppercase rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
            {t('hero_cta_book')}
          </a>
          {/* Secondary CTA — bordered ghost button, lower visual weight */}
          <a href="#services" className="px-10 py-3.5 border border-[#f0b0c4] text-[#e8789a] hover:bg-[#fff5f8] text-[11px] tracking-[0.24em] uppercase rounded-full transition-all duration-300 hover:-translate-y-0.5">
            {t('hero_cta_services')}
          </a>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SCROLL INDICATOR — bottom-centre                                    */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * A small animated "Scroll" indicator that appears after all other content
       * has faded in (0.8 s delay). It consists of:
       *  - The word "SCROLL" in tiny spaced caps
       *  - A vertical line whose gradient animates downward via
       *    `animate-scroll-line`, visually suggesting downward motion.
       *
       * `left-1/2 -translate-x-1/2` centres it horizontally regardless of the
       * parent's width.
       */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#c090a0] animate-fade-up" style={{ animationDelay: '0.8s' }}>
        <span className="text-[9px] tracking-[0.38em] uppercase">Scroll</span>
        {/* Clipping container for the animated gradient line */}
        <div className="relative w-px h-9 overflow-hidden">
          {/* The gradient animates from top to bottom, simulating a falling drop */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#e8789a] to-transparent animate-scroll-line" />
        </div>
      </div>
    </section>
  )
}
