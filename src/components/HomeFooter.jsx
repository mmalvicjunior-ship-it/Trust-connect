'use client';

import Link from 'next/link';

export default function HomeFooter() {
  return (
    <footer id="footer">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="nav-logo">
              <svg className="mark" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#fGrad)"/><path d="M20 9L28 13V20C28 25 24.5 28.8 20 31C15.5 28.8 12 25 12 20V13L20 9Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M16.2 19.6L18.7 22.2L23.8 16.8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="fGrad" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#0057D9"/><stop offset="1" stopColor="#00B8A9"/></linearGradient></defs></svg>
              Trust Connect
            </Link>
            <p>Making it simple, safe and fast for anyone to hire trusted professionals.</p>
            <div className="foot-social">
              <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
              <a href="#" aria-label="Twitter"><i className="fa-brands fa-x-twitter"></i></a>
            </div>
          </div>
          <div className="foot-col"><h5>Company</h5><Link href="/about">About Us</Link><Link href="/about">Careers</Link><Link href="/about">Press</Link><Link href="/contact">Contact</Link></div>
          <div className="foot-col"><h5>Services</h5><Link href="/services">Electricians</Link><Link href="/services">Plumbers</Link><Link href="/services">Cleaners</Link><Link href="/services">All Services</Link></div>
          <div className="foot-col"><h5>Providers</h5><Link href="/providers">Become a Provider</Link><Link href="/provider/dashboard">Provider Dashboard</Link><Link href="/about">Help Center</Link></div>
          <div className="foot-news">
            <h5>For Clients</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/signin" style={{ color: '#fff', textDecoration: 'none' }}>Client Login</Link>
              <Link href="/register" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Create Account</Link>
              <Link href="/booking" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Book a Service</Link>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>&copy; 2026 Trust Connect. All rights reserved.</span>
          <div><Link href="/about">Privacy Policy</Link><Link href="/about">Terms of Service</Link></div>
        </div>
      </div>
    </footer>
  );
}
