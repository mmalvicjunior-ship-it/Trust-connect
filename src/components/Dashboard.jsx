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
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const role = (user.userType || 'client').toLowerCase();
  if (role === 'admin') {
    return <AdminDashboard user={user} onLogout={logout} />;
  }
  if (role === 'provider') {
    return <ProviderDashboard user={user} onLogout={logout} />;
  }
  return <ClientDashboard />;
}