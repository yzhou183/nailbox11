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

function MainSite() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
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

export default function App() {
  return (
    <LangProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<MainSite />} />
        <Route path="/admin"       element={<AdminPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
    </LangProvider>
  )
}
