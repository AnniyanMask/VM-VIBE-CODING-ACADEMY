import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/home/Hero';
import SeatUrgencyTicker from '../components/home/SeatUrgencyTicker';
import TrustStrip from '../components/home/TrustStrip';
import Benefits from '../components/home/Benefits';
import Projects from '../components/home/Projects';
import Process from '../components/home/Process';
import Syllabus from '../components/home/Syllabus';
import Pricing from '../components/home/Pricing';
import Safety from '../components/home/Safety';
import Venue from '../components/home/Venue';
import FAQ from '../components/home/FAQ';
import EnquiryForm from '../components/home/EnquiryForm';
import CTA from '../components/home/CTA';
import WhatsAppButton from '../components/home/WhatsAppButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <SeatUrgencyTicker />
        <TrustStrip />
        <Benefits />
        <Projects />
        <Process />
        <Syllabus />
        <Pricing />
        <Safety />
        <Venue />
        <EnquiryForm />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
