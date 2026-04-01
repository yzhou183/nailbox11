/**
 * Header.tsx
 *
 * The site-wide navigation header for Nail Box 11.
 *
 * Responsibilities:
 * - Renders the salon logo (name + tagline) as a link back to the top of the page.
 * - Provides navigation links to the Services and Visit sections, plus a CTA
 *   "Book Now" button that jumps directly to the booking form.
 * - Includes a language switcher that lets users toggle between the four
 *   supported locales (Chinese, English, Spanish, Vietnamese).
 * - Transitions from fully transparent (overlaying the hero image) to a
 *   frosted-glass white background once the user scrolls past 20 px, keeping
 *   the nav readable against any page content below.
 * - Collapses to a hamburger menu on mobile, with a smooth max-height animation
 *   that reveals a stacked link list and the language switcher.
 */

import { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext'
import { LANG_LABELS, type Lang } from '../i18n'

/**
 * LANGS — ordered array of locale codes shown in the language switcher.
 * The order here controls left-to-right (desktop) and wrap order (mobile).
 * Adding a new locale to the app only requires appending it here (and
 * ensuring the i18n dictionaries contain all required keys for it).
 */
const LANGS: Lang[] = ['zh', 'en', 'es', 'vi']

/**
 * Header
 *
 * A fixed-position navigation bar that sits above all page content (z-50).
 * Uses two pieces of local state:
 * - `scrolled`  — toggled by a scroll listener; drives the background style transition.
 * - `menuOpen`  — toggled by the hamburger button; controls mobile menu visibility.
 *
 * Language state lives in the global LangContext rather than here, so the
 * active locale persists across page sections without prop drilling.
 */
export default function Header() {
  // `scrolled` tracks whether the viewport has been scrolled past the threshold.
  // When true the header gains a white/blur background so links stay legible.
  const [scrolled, setScrolled] = useState(false)

  // `menuOpen` drives the mobile dropdown — true = expanded, false = collapsed.
  const [menuOpen, setMenuOpen] = useState(false)

  // Pull the active language, setter, and translation helper from global context
  const { lang, setLang, t } = useLang()

  // ---------------------------------------------------------------------------
  // Side-effect: scroll listener for header background transition
  // ---------------------------------------------------------------------------

  useEffect(() => {
    /**
     * onScroll — fires on every scroll event and updates `scrolled` when the
     * user crosses the 20 px threshold. Using a numeric threshold (rather than
     * 0) prevents the background from flickering when the page is exactly at
     * the top due to sub-pixel rendering differences across browsers.
     */
    const onScroll = () => setScrolled(window.scrollY > 20)

    window.addEventListener('scroll', onScroll)

    // Cleanup: remove the listener when the component unmounts to avoid memory
    // leaks and stale state updates on pages that conditionally render Header.
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // Empty dep array — this effect only needs to run once on mount

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    /*
     * The outer <header> is `fixed` so it stays at the top during scroll.
     * `transition-all duration-500` smoothly animates the background change
     * between transparent and the frosted-glass white style.
     */
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#fce8ed]' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* ----------------------------------------------------------------
            Logo
            Clicking takes the user back to the very top of the page (#).
            The `group` class on the <a> lets child spans react to hover via
            `group-hover:` utilities, so the whole block acts as one hover target.
        ---------------------------------------------------------------- */}
        <a href="#" className="flex flex-col leading-none group">
          {/* Primary wordmark — serif font, spaced tracking */}
          <span className="font-serif text-[22px] font-medium tracking-[0.18em] text-[#c0507a] group-hover:text-[#e8789a] transition-colors duration-300">
            Nail Box
          </span>
          {/* Chinese tagline: 精品美甲工作室 = "boutique nail studio" */}
          <span className="text-[9px] tracking-[0.28em] text-[#c090a0] uppercase mt-0.5">精品美甲工作室</span>
        </a>

        {/* ----------------------------------------------------------------
            Desktop Navigation  (hidden on mobile via `hidden md:flex`)
        ---------------------------------------------------------------- */}
        <nav className="hidden md:flex items-center gap-6">

          {/*
            Anchor links for the two main page sections.
            Defined as a const-asserted tuple so TypeScript can infer the
            literal `key` values and type-check them against TKey.
          */}
          {([
            { key: 'nav_services', href: '#services' },
            { key: 'nav_visit',    href: '#visit'    },
          ] as const).map(item => (
            <a key={item.href} href={item.href}
              className="text-sm text-[#9a4065] hover:text-[#e8789a] transition-colors duration-200 tracking-wide">
              {t(item.key)}
            </a>
          ))}

          {/* Primary CTA — pill-shaped "Book Now" button jumps to the form */}
          <a href="#booking"
            className="px-5 py-2 bg-[#e8789a] hover:bg-[#c86080] text-white text-[11px] tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
            {t('nav_book')}
          </a>

          {/* ---- Language switcher (desktop) ----
              A pill container with individual buttons for each locale.
              The active locale gets a filled pink background; others are subtle.
              A right border on all but the last button acts as a visual divider
              without needing an extra separator element.
          */}
          <div className="flex items-center gap-0.5 border border-[#fce8ed] rounded-full px-1 py-0.5">
            {LANGS.map((l, i) => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                  lang === l ? 'bg-[#e8789a] text-white' : 'text-[#c090a0] hover:text-[#e8789a]'
                } ${i < LANGS.length - 1 ? 'border-r border-[#fce8ed]' : ''}`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </nav>

        {/* ----------------------------------------------------------------
            Mobile hamburger button  (visible only below md breakpoint)
            Three horizontal bars animate into an × when the menu is open:
            - Top bar:    rotates +45° and translates down to form the / arm
            - Middle bar: fades out (opacity-0)
            - Bottom bar: rotates -45° and translates up to form the \ arm
        ---------------------------------------------------------------- */}
        <button className="md:hidden flex flex-col justify-center gap-1.5 p-2 text-[#9a4065]"
          onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span className={`block w-5 h-px bg-current transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      {/* ------------------------------------------------------------------
          Mobile dropdown menu
          Uses `max-h` + `opacity` toggling for a smooth slide-in effect.
          `overflow-hidden` on the container means the children are clipped
          while max-h is 0, then revealed as max-h grows to 80 (20rem).
          The `md:hidden` class ensures this panel never appears on desktop.
      ------------------------------------------------------------------ */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white/98 backdrop-blur-md border-t border-[#fce8ed] ${menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 py-4 flex flex-col gap-4">

          {/* Same nav links as desktop, but stacked vertically.
              Clicking a link also closes the menu so the page content is visible. */}
          {([
            { key: 'nav_services', href: '#services' },
            { key: 'nav_visit',    href: '#visit'    },
          ] as const).map(item => (
            <a key={item.href} href={item.href}
              className="text-sm text-[#9a4065] hover:text-[#e8789a] transition-colors"
              onClick={() => setMenuOpen(false)}>
              {t(item.key)}
            </a>
          ))}

          {/* Mobile "Book Now" CTA — closes the menu after tapping */}
          <a href="#booking"
            className="text-center px-5 py-2.5 bg-[#e8789a] hover:bg-[#c86080] text-white text-[11px] tracking-[0.2em] uppercase rounded-full transition-colors"
            onClick={() => setMenuOpen(false)}>
            {t('nav_book')}
          </a>

          {/* ---- Language switcher (mobile) ----
              Larger touch targets than the desktop version (px-3 py-1.5 vs px-2 py-1)
              to meet minimum 44 px recommended tap-target size guidelines.
              Uses an explicit border on each button rather than the divider trick
              used in the desktop version, so the buttons wrap more naturally on
              very narrow screens.
          */}
          <div className="flex gap-1">
            {LANGS.map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  lang === l ? 'bg-[#e8789a] border-[#e8789a] text-white' : 'border-[#fce8ed] text-[#c090a0] hover:text-[#e8789a]'
                }`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
