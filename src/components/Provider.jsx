'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProviderDashboard from '@/components/dashboard/ProviderDashboard';
import { useAuth } from '@/context/AuthContext';

function dashboardFor(userType) {
  const role = String(userType || '').toLowerCase();
  if (role === 'admin') return '/admin';
  if (role === 'client') return '/dashboard';
  return '/provider/dashboard';
}

export default function Provider() {
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
              <p style={{ marginTop: '12px', color: '#64748b' }}>Loading provider dashboard...</p>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if ((user.userType || '').toLowerCase() !== 'provider') {
    return (
      <>
        <Navbar />
        <section className="auth-section">
          <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
              <div className="admin-forbidden-icon"><i className="fas fa-user-lock"></i></div>
              <h2>403 — Access Denied</h2>
              <p>The provider dashboard is restricted to Service Provider accounts only.</p>
              <Link href={dashboardFor(user.userType)} className="btn-auth-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Go to your dashboard</Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return <ProviderDashboard user={user} onLogout={logout} />;
}