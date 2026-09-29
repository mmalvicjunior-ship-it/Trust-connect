import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1>Terms of <span>Service</span></h1>
        <p>Terms for using Trust Connect to find and provide services.</p>
      </section>
      <section className="about-page">
        <div className="about-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '900px', alignItems: 'start' }}>
          <div className="about-content">
            <h2>Using Trust Connect</h2>
            <p>Trust Connect helps customers discover service providers and submit booking requests. Users are responsible for keeping account details accurate and using the platform lawfully.</p>
            <h2>Bookings and service arrangements</h2>
            <p>Booking details, including the requested service, location, timing, and amount, are submitted through the platform. Customers and providers should review and confirm the details of a request before work begins.</p>
            <h2>Accounts and support</h2>
            <p>Keep your sign-in information secure and contact support if you notice activity you do not recognize or need assistance with a booking.</p>
            <p>Questions about these terms can be sent to <a href="mailto:info@trustconnect.com">info@trustconnect.com</a>.</p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}