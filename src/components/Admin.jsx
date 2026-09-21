'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { useAuth } from '@/context/AuthContext';

export default function Admin() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/signin');
    }
  }, [loading, user, router]);

  if (loading || !user) {
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