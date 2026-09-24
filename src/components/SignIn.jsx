'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import PasswordField from '@/components/PasswordField';
import { useAuth } from '@/context/AuthContext';

const ROLES = [
  { value: 'client', label: 'Client', icon: 'fa-user' },
  { value: 'provider', label: 'Provider', icon: 'fa-toolbox' },
  { value: 'admin', label: 'Admin', icon: 'fa-shield-halved' },
];

function dashboardFor(userType) {
  const role = String(userType || '').toLowerCase();
  if (role === 'admin') return '/admin';
  if (role === 'provider') return '/provider/dashboard';
  return '/dashboard';
}

export default function SignIn() {
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState('client');
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

  useEffect(() => {
    if (user) {
      router.replace(dashboardFor(user.userType));
    }
  }, [user, router]);

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
      await login(email, password, role);
      setToast({ message: 'Signed in successfully. Redirecting...', type: 'success' });
      setTimeout(() => router.push(dashboardFor(role)), 1000);
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
          const data = await googleLogin(credential);
          router.push(dashboardFor(data.user?.userType));
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
              <div className="form-group">
                <label><i className="fas fa-user-tag"></i> Sign in as</label>
                <div className="role-segmented" role="radiogroup" aria-label="Account type">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      role="radio"
                      aria-checked={role === r.value}
                      className={`role-segment ${role === r.value ? 'active' : ''}`}
                      onClick={() => setRole(r.value)}
                    >
                      <i className={`fas ${r.icon}`}></i>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group"><label htmlFor="signin-email"><i className="fas fa-envelope"></i> Email Address</label><input type="email" id="signin-email" name="email" required placeholder="your@email.com" /></div>
              <PasswordField id="signin-password" name="password" label="Password" required placeholder="Enter your password" />
              <button type="submit" className="btn-auth-primary" disabled={submitting}>
                {submitting ? 'Signing In...' : `Sign In as ${ROLES.find((r) => r.value === role)?.label || 'Client'}`}
              </button>
            </form>
            <div className="divider"><span>or</span></div>
            <div className="social-login">
              <button className="social-btn google-btn" type="button" onClick={handleGoogleSignIn} disabled={submitting}><i className="fab fa-google"></i> Continue with Google</button>
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