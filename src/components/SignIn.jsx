'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';

export default function SignIn() {
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login, googleLogin, user } = useAuth();

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
      await loadScript('https://accounts.google.com/gsi/client');
    })();
  }, []);

  if (user) {
    router.push('/dashboard');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target['signin-email'].value.trim();
    const password = e.target['signin-password'].value;

    if (!email || !password) {
      setToast({ message: 'Please enter your email and password.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      setToast({ message: 'Signed in successfully. Redirecting...', type: 'success' });
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err) {
      setToast({ message: err.message || 'Sign in failed. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) {
      setToast({ message: 'Google sign-in is not configured yet.', type: 'error' });
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        if (!credential) {
          setToast({ message: 'Google sign-in was cancelled.', type: 'error' });
          return;
        }

        setSubmitting(true);
        try {
          await googleLogin(credential);
          router.push('/dashboard');
        } catch (err) {
          setToast({ message: err.message || 'Google sign-in failed. Please try again.', type: 'error' });
        } finally {
          setSubmitting(false);
        }
      },
    });
    window.google.accounts.id.prompt();
  };

  return (
    <>
      <Navbar />
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card" data-aos="fade-up">
            <h2>Welcome Back</h2>
            <p>Sign in to your Trust Connect account</p>
            <form className="auth-form" id="signin-form" onSubmit={handleSubmit}>
              <div className="form-group"><label htmlFor="signin-email"><i className="fas fa-envelope"></i> Email Address</label><input type="email" id="signin-email" name="email" required placeholder="your@email.com" /></div>
              <div className="form-group"><label htmlFor="signin-password"><i className="fas fa-lock"></i> Password</label><input type="password" id="signin-password" name="password" required placeholder="Enter your password" /></div>
              <button type="submit" className="btn-auth-primary" disabled={submitting}>
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            <div className="divider"><span>or</span></div>
            <div className="social-login">
              <button className="social-btn google-btn" type="button" onClick={handleGoogleSignIn} disabled={submitting}><i className="fab fa-google"></i> Continue with Google</button>
              <button className="social-btn facebook-btn" type="button"><i className="fab fa-facebook-f"></i> Continue with Facebook</button>
            </div>
            <p className="auth-switch">Don&apos;t have an account? <Link href="/register">Create one here</Link></p>
          </div>
        </div>
      </section>
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
