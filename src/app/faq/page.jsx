import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FaqAccordion from '@/components/FaqAccordion';

const FAQ_ITEMS = [
  {
    q: 'How do I find the right professional for my job?',
    a: 'Tell us what needs to be done and where. Browse professionals by service category or use the search on the home page to find the right match, then review each professional’s details and ratings before booking.',
  },
  {
    q: 'How does booking work?',
    a: 'Choose a service, select a professional, and submit the booking details from the booking page. You need to sign in before submitting a booking.',
    links: [{ label: 'Booking page', href: '/booking' }],
  },
  {
    q: 'How do I become a service provider?',
    a: 'Start by creating an account and choosing the Service Provider account type on the registration page.',
    links: [{ label: 'Registration page', href: '/register' }],
  },
  {
    q: 'Where can I get help?',
    id: 'help-center',
    a: 'For help with an account, booking, or general question, contact our support team at info@trustconnect.com or use the contact form.',
    links: [{ label: 'Contact form', href: '/contact' }],
  },
];

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
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
