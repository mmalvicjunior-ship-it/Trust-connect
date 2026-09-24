'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { useAuth } from '@/context/AuthContext';

export default function Admin() {
  const router = useRouter();
  const { user, logout, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setToast({ message: 'Please enter your email and password.', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password, 'admin');
    } catch (err) {
      setToast({ message: err.message || 'Sign in failed. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <section className="auth-section">
          <div className="auth-container">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="tc-loader-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '12px', color: '#64748b' }}>Loading admin console...</p>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <section className="auth-section">
          <div className="auth-container">
            <div className="auth-card" data-aos="fade-up">
              <div className="admin-forbidden-icon"><i className="fas fa-shield-halved"></i></div>
              <h2 style={{ textAlign: 'center' }}>Admin Console</h2>
              <p style={{ textAlign: 'center' }}>Restricted area. Administrators only.</p>
              <form className="auth-form" id="admin-signin-form" onSubmit={handleAdminLogin}>
                <div className="form-group"><label htmlFor="admin-email"><i className="fas fa-envelope"></i> Admin Email</label><input type="email" id="admin-email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@trustconnect.com" /></div>
                <div className="form-group"><label htmlFor="admin-password"><i className="fas fa-lock"></i> Password</label><input type="password" id="admin-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" /></div>
                <button type="submit" className="btn-auth-primary" disabled={submitting}>
                  {submitting ? 'Signing In...' : 'Sign In to Admin Console'}
                </button>
              </form>
              <div className="auth-switch">
                <Link href="/">Back to Home</Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  if ((user.userType || '').toLowerCase() !== 'admin') {
    return (
      <>
        <Navbar />
        <section className="auth-section">
          <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
              <div className="admin-forbidden-icon"><i className="fas fa-user-lock"></i></div>
              <h2>403 — Access Denied</h2>
              <p>You do not have permission to access the admin console. This area is restricted to administrators only.</p>
              <Link href="/" className="btn-auth-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Back to Home</Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return <AdminDashboard user={user} onLogout={logout} />;
}