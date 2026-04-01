/**
 * App.tsx — Root application component
 *
 * This file defines the top-level structure of the Nail Box web app.
 * It is responsible for two concerns:
 *
 *  1. Routing — Uses React Router's <BrowserRouter> + <Routes> to map URL paths to page
 *     components. Three routes are defined:
 *       "/"            -> The public-facing marketing site (MainSite)
 *       "/admin"       -> The protected admin dashboard (requires login)
 *       "/admin/login" -> The admin login page
 *
 *  2. Global context — Wraps the entire router tree in <LangProvider> so that every
 *     component (both public and admin pages) can access language / i18n state via
 *     the `useLang()` hook without any additional setup.
 *
 * Note: <LangProvider> is intentionally placed *outside* <BrowserRouter> so that
 * language state persists across client-side route navigations — the provider does not
 * remount when the URL changes.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './context/LangContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import StoreInfo from './components/StoreInfo'
import BookingForm from './components/BookingForm'
import Footer from './components/Footer'
import AdminLogin from './pages/AdminLogin'
import AdminPage from './pages/AdminPage'

/**
 * MainSite — The public-facing single-page marketing website.
 *
 * Renders the full customer-facing experience as a vertically stacked layout:
 *   Header      -> Sticky/top navigation bar with language switcher and anchor links
 *   Hero        -> Full-screen landing section with tagline, WeChat CTA, and booking CTA
 *   StoreInfo   -> Store address, contact details, and step-by-step parking instructions
 *   Services    -> Pricing table split into Basic and Add-on service categories
 *   BookingForm -> Multi-field appointment booking form with real-time validation
 *   Footer      -> Copyright, navigation links, and contact info
 *
 * This component is intentionally a simple layout wrapper with no state of its own.
 * All interactivity lives within the individual section components.
 */
function MainSite() {
  return (
    // `min-h-screen` ensures the white background fills the viewport even on short pages
    <div className="min-h-screen bg-white">
      <Header />
      {/* <main> landmark improves accessibility and SEO by marking the primary content */}
      <main>
        <Hero />
        <StoreInfo />
        <Services />
        <BookingForm />
      </main>
      <Footer />
    </div>
  )
}

/**
 * App — The root component rendered by main.tsx into the DOM.
 *
 * Component hierarchy:
 *   <LangProvider>            ← i18n state (active language + t() helper) for the whole app
 *     <BrowserRouter>         ← Provides history/location context for React Router
 *       <Routes>              ← Matches the current URL to exactly one <Route>
 *         "/" -> <MainSite />         Public marketing site
 *         "/admin" -> <AdminPage />   Admin dashboard (protected — auth handled inside)
 *         "/admin/login" -> <AdminLogin /> Admin login form
 *       </Routes>
 *     </BrowserRouter>
 *   </LangProvider>
 */
export default function App() {
  return (
    // LangProvider wraps everything so language state is available on all routes,
    // including the admin pages (which may display content in a chosen language).
    <LangProvider>
    <BrowserRouter>
      <Routes>
        {/* Public marketing site — served at the root URL */}
        <Route path="/"            element={<MainSite />} />

        {/* Admin dashboard — authentication is enforced inside <AdminPage> itself;
            unauthenticated users are redirected to /admin/login */}
        <Route path="/admin"       element={<AdminPage />} />

        {/* Admin login form — allows studio staff to authenticate */}
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
    </LangProvider>
  )
}
