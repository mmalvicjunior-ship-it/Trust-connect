'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const STATUS_STYLES = {
  Pending: { bg: '#FFF7ED', color: '#C2410C' },
  Accepted: { bg: '#EFF6FF', color: '#1D4ED8' },
  Completed: { bg: '#ECFDF5', color: '#047857' },
  Rejected: { bg: '#FEF2F2', color: '#B91C1C' },
  Cancelled: { bg: '#F1F5F9', color: '#475569' },
};

export default function Account() {
  const [toast, setToast] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }
    api.getBookings()
      .then((data) => setBookings(data.bookings))
      .catch(() => setToast({ message: 'Could not load bookings.', type: 'error' }))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading) return <p style={{ padding: '200px 0', textAlign: 'center' }}>Loading...</p>;
  if (!user) return null;

  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1 data-aos="fade-up">My <span>Account</span></h1>
        <p data-aos="fade-up" data-aos-delay="80">Your personal information and booking details.</p>
      </section>
      <section className="account-page">
        <div className="account-wrap">

          <div className="account-card profile-card" data-aos="fade-up">
            <div className="account-avatar">
              <i className="fas fa-user"></i>
            </div>
            <h3>{user.fullName || user.firstName}</h3>
            <p className="account-type">{user.userType === 'provider' ? 'Service Provider' : 'Customer'}</p>
            <div className="account-details">
              <div className="account-detail"><i className="fas fa-envelope"></i><span>{user.email}</span></div>
              <div className="account-detail"><i className="fas fa-phone"></i><span>{user.phone || 'No phone number'}</span></div>
              <div className="account-detail"><i className="fas fa-calendar"></i><span>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
            </div>
            <div className="account-actions">
              <Link href="/dashboard" className="btn btn-primary btn-sm">View Dashboard</Link>
              <Link href="/booking" className="btn btn-outline btn-sm">Book a Service</Link>
            </div>
          </div>

          <div className="account-card" data-aos="fade-up" data-aos-delay="100">
            <h4 className="account-section-title"><i className="fas fa-book"></i> My Bookings</h4>
            {loading ? (
              <p className="dash-empty">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <div className="dash-empty">
                <p>You have no bookings yet.</p>
                <Link href="/booking" className="btn btn-primary" style={{ marginTop: '16px' }}>Book a Service</Link>
              </div>
            ) : (
              <div className="account-booking-list">
                {bookings.map((b) => {
                  const st = STATUS_STYLES[b.status] || STATUS_STYLES.Pending;
                  return (
                    <div key={b.bookingId} className="account-booking">
                      <div className="account-booking-top">
                        <span className="account-booking-id"><i className="fas fa-hashtag"></i> {b.bookingId}</span>
                        <span className="dash-badge" style={{ background: st.bg, color: st.color }}>{b.status}</span>
                      </div>
                      <div className="account-booking-body">
                        <div className="account-service"><strong>{b.service}</strong> by {b.providerName || 'Provider'}</div>
                        <div className="account-date">{new Date(b.date).toLocaleDateString()} · {b.time} · {b.location}</div>
                        <div className="account-amount"><strong>${Number(b.amount).toFixed(2)}</strong><span>· Fee ${Number(b.platformFee).toFixed(2)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </section>
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
