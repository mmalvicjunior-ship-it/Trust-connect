import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1>Privacy <span>Policy</span></h1>
        <p>How Trust Connect handles information shared through the platform.</p>
      </section>
      <section className="about-page">
        <div className="about-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '900px', alignItems: 'start' }}>
          <div className="about-content">
            <h2>Information you provide</h2>
            <p>Trust Connect receives information you submit when creating an account, requesting a booking, contacting support, or using platform features. This can include your name, email address, phone number, service details, and messages.</p>
            <h2>How information is used</h2>
            <p>We use submitted information to operate accounts and bookings, connect customers with service providers, respond to support requests, and maintain platform security.</p>
            <h2>Access and questions</h2>
            <p>Contact us at <a href="mailto:info@trustconnect.com">info@trustconnect.com</a> with questions about information submitted through Trust Connect.</p>
            <p>For help using the platform, visit our <Link href="/faq#help-center">Help Center</Link>.</p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}