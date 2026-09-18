'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ClientDashboard from '@/components/dashboard/ClientDashboard';
import ProviderDashboard from '@/components/dashboard/ProviderDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}><i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary, #0057D9)' }}></i></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const role = (user.userType || 'client').toLowerCase();

  if (role === 'admin') {
    return <AdminDashboard user={user} onLogout={logout} />;
  }
  if (role === 'provider') {
    return <ProviderDashboard user={user} onLogout={logout} />;
  }
  return <ClientDashboard user={user} onLogout={logout} />;
}