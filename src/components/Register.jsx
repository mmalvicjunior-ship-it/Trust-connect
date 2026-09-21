'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import PasswordField from '@/components/PasswordField';
import { useAuth } from '@/context/AuthContext';

export default function Register() {
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState(null);
  const router = useRouter();
  const { register } = useAuth();

  useEffect(() => {
    const loadScript = (src) => new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      document.body.appendChild(s);
    });
    const loadStylesheet = (href) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    };
    (async () => {
      loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js');
      window.AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const firstName = e.target['first-name'].value.trim();
    const lastName = e.target['last-name'].value.trim();
    const email = e.target['reg-email'].value.trim();
    const phone = e.target['phone'].value.trim();
    const password = e.target['reg-password'].value;
    const confirmPassword = e.target['confirm-password'].value;
    const userType = role;

    if (!firstName || !lastName || !email || !password || !userType) {
      setToast({ message: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await register({ firstName, lastName, email, phone, password, userType });
      setToast({ message: `Welcome, ${firstName}! Your account has been created.`, type: 'success' });
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      setToast({ message: err.message || 'Registration failed. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="auth-section">
        <div className="auth-container">
          {!role ? (
            <div className="auth-card" data-aos="fade-up">
              <h2>How will you use Trust Connect?</h2>
              <p>Choose an account type to get started.</p>
              <div className="role-grid">
                <button type="button" className="role-card" onClick={() => setRole('client')}>
                  <div className="role-icon"><i className="fas fa-user"></i></div>
                  <div className="role-name">Client</div>
                  <p>Find trusted professionals and book services.</p>
                  <span className="role-cta">Continue as Client</span>
                </button>
                <button type="button" className="role-card" onClick={() => setRole('provider')}>
                  <div className="role-icon role-icon-provider"><i className="fas fa-toolbox"></i></div>
                  <div className="role-name">Service Provider</div>
                  <p>Offer your services and connect with clients.</p>
                  <span className="role-cta role-cta-provider">Continue as Service Provider</span>
                </button>
              </div>
              <p className="auth-switch">Already have an account? <Link href="/signin">Sign in here</Link></p>
            </div>
          ) : (
            <div className="auth-card" data-aos="fade-up">
              <button type="button" className="btn-auth-back" onClick={() => setRole(null)}>
                <i className="fas fa-arrow-left"></i> Choose account type
              </button>
              <h2>{role === 'provider' ? 'Create Service Provider Account' : 'Create Client Account'}</h2>
              <p>Join Trust Connect today</p>
              <form className="auth-form" id="register-form" onSubmit={handleSubmit}>
                <div className="form-row-auth">
                  <div className="form-group"><label htmlFor="first-name">First Name</label><input type="text" id="first-name" name="firstName" required placeholder="John" /></div>
                  <div className="form-group"><label htmlFor="last-name">Last Name</label><input type="text" id="last-name" name="lastName" required placeholder="Doe" /></div>
                </div>
                <div className="form-group"><label htmlFor="reg-email">Email Address</label><input type="email" id="reg-email" name="email" required placeholder="your@email.com" /></div>
                <div className="form-group"><label htmlFor="phone">Phone Number</label><input type="tel" id="phone" name="phone" placeholder="+263 77 123 4567" /></div>
                <PasswordField id="reg-password" name="password" label="Password" required placeholder="Create a strong password" minLength="6" withIcon={false} />
                <PasswordField id="confirm-password" name="confirmPassword" label="Confirm Password" required placeholder="Re-enter password" minLength="6" withIcon={false} />
                <div className="form-checkbox"><input type="checkbox" id="agree" name="agree" required /><label htmlFor="agree">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label></div>
                <button type="submit" className="btn-auth-primary" disabled={submitting}>
                  {submitting ? 'Creating Account...' : role === 'provider' ? 'Create Service Provider Account' : 'Create Account'}
                </button>
              </form>
              <div className="divider"><span>or</span></div>
              <div className="social-login">
                <button className="social-btn google-btn" type="button"><i className="fab fa-google"></i> Continue with Google</button>
                <button className="social-btn facebook-btn" type="button"><i className="fab fa-facebook-f"></i> Continue with Facebook</button>
              </div>
              <p className="auth-switch">Already have an account? <Link href="/signin">Sign in here</Link></p>
            </div>
          )}
        </div>
      </section>
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
