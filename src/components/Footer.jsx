'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2>Trust <span>Connect</span></h2>
          <p>Connecting you with trusted service providers across Zimbabwe.</p>
          <div className="footer-socials">
            <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="Facebook, coming soon"><i className="fab fa-facebook-f"></i></a>
            <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="LinkedIn, coming soon"><i className="fab fa-linkedin-in"></i></a>
            <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="Instagram, coming soon"><i className="fab fa-instagram"></i></a>
            <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="TikTok, coming soon"><i className="fab fa-tiktok"></i></a>
            <a aria-disabled="true" tabIndex="0" title="Coming soon" aria-label="YouTube, coming soon"><i className="fab fa-youtube"></i></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link href="/">Home</Link>
          <Link href="/about">About Us</Link>
          <Link href="/services">Services</Link>
          <Link href="/providers">Providers</Link>
          <Link href="/booking">Book a Service</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="footer-col">
          <h4>Resources</h4>
          <Link href="/faq#help-center">Help Center</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>

        <div className="footer-col">
          <h4>For Clients</h4>
          <Link href="/#how">How It Works</Link>
          <Link href="/booking">Book a Service</Link>
          {user ? (
            <Link href={user.userType === 'provider' ? '/provider/dashboard' : user.userType === 'admin' ? '/admin' : '/dashboard'}>
              {user.userType === 'provider' ? 'Provider Dashboard' : user.userType === 'admin' ? 'Admin Dashboard' : 'Client Dashboard'}
            </Link>
          ) : (
            <Link href="/signin">Client Login</Link>
          )}
          {!user && <Link href="/register">Create Account</Link>}
        </div>

        <div className="footer-col">
          <h4>Contact Us</h4>
          <p><i className="fas fa-envelope"></i> info@trustconnect.com</p>
          <p><i className="fas fa-phone"></i> +263 77 123 4567</p>
          <p><i className="fas fa-map-marker-alt"></i> 123 chinotimba Rawu, Victoria Falls, Zimbabwe</p>
          <Link href="/contact" className="btn btn-accent btn-sm"><i className="fas fa-paper-plane" aria-hidden="true"></i> Get In Touch</Link>
        </div>
      </div>
      <div className="footer-bottom">&copy; 2026 Trust Connect. All Rights Reserved.</div>
    </footer>
  );
}
