import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import StoreInfo from './components/StoreInfo'
import BookingForm from './components/BookingForm'
import Footer from './components/Footer'

export default function App() {
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
