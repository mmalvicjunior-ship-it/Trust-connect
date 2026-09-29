import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1>Frequently Asked <span>Questions</span></h1>
        <p>Answers about finding a provider, booking a service, and getting support.</p>
      </section>
      <section className="about-page">
        <div className="about-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '900px', alignItems: 'start' }}>
          <div className="about-content">
            <h2>How do I book a service?</h2>
            <p>Choose a service, select a professional, and submit the booking details from the <Link href="/booking">booking page</Link>. You need to sign in before submitting a booking.</p>
            <h2>How do I become a service provider?</h2>
            <p>Start by creating an account and choosing the Service Provider account type on the <Link href="/register">registration page</Link>.</p>
            <h2>Where can I get help?</h2>
            <p id="help-center">For help with an account, booking, or general question, contact our support team at <a href="mailto:info@trustconnect.com">info@trustconnect.com</a> or use the <Link href="/contact">contact form</Link>.</p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}