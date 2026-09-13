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
  Pending: { bg: '#FFF7ED', color: '#C2410C', label: 'Pending' },
  Accepted: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Accepted' },
  Completed: { bg: '#ECFDF5', color: '#047857', label: 'Completed' },
  Rejected: { bg: '#FEF2F2', color: '#B91C1C', label: 'Rejected' },
  Cancelled: { bg: '#F1F5F9', color: '#475569', label: 'Cancelled' },
};

export default function Dashboard() {
  const [toast, setToast] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('All');
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

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Navbar />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const counts = {
    All: bookings.length,
    Pending: bookings.filter((b) => b.status === 'Pending').length,
    Accepted: bookings.filter((b) => b.status === 'Accepted').length,
    Completed: bookings.filter((b) => b.status === 'Completed').length,
    Cancelled: bookings.filter((b) => ['Cancelled', 'Rejected'].includes(b.status)).length,
  };

  const filtered = filter === 'All'
    ? bookings
    : filter === 'Cancelled'
      ? bookings.filter((b) => ['Cancelled', 'Rejected'].includes(b.status))
      : bookings.filter((b) => b.status === filter);

  return (
    <>
      <Navbar />
      <section className="page-header">
        <h1 data-aos="fade-up">My <span>Dashboard</span></h1>
        <p data-aos="fade-up" data-aos-delay="80">Welcome back, {user.firstName || user.fullName}. Here are your bookings.</p>
      </section>
      <section className="dashboard-page">
        <div className="dashboard-wrap">

          <div className="dash-cards">
            <div className="dash-card" onClick={() => setFilter('All')}>
              <div className="dash-card-icon all"><i className="fas fa-list"></i></div>
              <div><div className="dash-card-num">{counts.All}</div><div className="dash-card-lab">All Bookings</div></div>
            </div>
            <div className="dash-card" onClick={() => setFilter('Pending')}>
              <div className="dash-card-icon pending"><i className="fas fa-clock"></i></div>
              <div><div className="dash-card-num">{counts.Pending}</div><div className="dash-card-lab">Pending</div></div>
            </div>
            <div className="dash-card" onClick={() => setFilter('Accepted')}>
              <div className="dash-card-icon accepted"><i className="fas fa-check-circle"></i></div>
              <div><div className="dash-card-num">{counts.Accepted}</div><div className="dash-card-lab">Accepted</div></div>
            </div>
            <div className="dash-card" onClick={() => setFilter('Completed')}>
              <div className="dash-card-icon completed"><i className="fas fa-check-double"></i></div>
              <div><div className="dash-card-num">{counts.Completed}</div><div className="dash-card-lab">Completed</div></div>
            </div>
            <div className="dash-card" onClick={() => setFilter('Cancelled')}>
              <div className="dash-card-icon cancelled"><i className="fas fa-times-circle"></i></div>
              <div><div className="dash-card-num">{counts.Cancelled}</div><div className="dash-card-lab">Cancelled</div></div>
            </div>
            <Link href="/booking" className="dash-card dash-card-cta">
              <div className="dash-card-icon new"><i className="fas fa-plus"></i></div>
              <div><div className="dash-card-num">New</div><div className="dash-card-lab">Book a Service</div></div>
            </Link>
          </div>

          <div className="dash-booking" style={{ marginBottom: '28px' }}>
            <div className="dash-booking-head">
              <h3 className="dash-title">Account Details</h3>
            </div>
            <div className="dash-booking-meta" style={{ paddingTop: '18px' }}>
              <span><i className="fas fa-user"></i> {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</span>
              <span><i className="fas fa-envelope"></i> {user.email}</span>
              <span><i className="fas fa-phone"></i> {user.phone || 'Phone not provided'}</span>
            </div>
          </div>

          <div className="dash-toolbar">
            <h3 className="dash-title">Your Bookings {filter !== 'All' && <>— {filter}</>}</h3>
            <div className="dash-filters">
              {['All', 'Pending', 'Accepted', 'Completed', 'Cancelled'].map((f) => (
                <button
                  key={f}
                  className={`dash-filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="dash-empty">Loading your bookings...</p>
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              <i className="fas fa-inbox" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '12px' }}></i>
              <p>No {filter !== 'All' ? filter.toLowerCase() : ''} bookings found.</p>
              <Link href="/booking" className="btn btn-primary" style={{ marginTop: '18px' }}>Book a Service</Link>
            </div>
          ) : (
            <div className="dash-booking-list">
              {filtered.map((b) => {
                const st = STATUS_STYLES[b.status] || STATUS_STYLES.Pending;
                return (
                  <div key={b.bookingId} className="dash-booking">
                    <div className="dash-booking-head">
                      <div className="dash-booking-id"><i className="fas fa-hashtag"></i> {b.bookingId}</div>
                      <span className="dash-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div className="dash-booking-body">
                      <div className="dash-booking-provider">
                        <div className="dash-provider-avatar"><i className="fas fa-user-tie"></i></div>
                        <div>
                          <div className="dash-provider-name">{b.providerName || 'Provider'}</div>
                          <div className="dash-booking-service">{b.service}</div>
                        </div>
                      </div>
                      <div className="dash-booking-meta">
                        <span><i className="fas fa-calendar-day"></i> {new Date(b.date).toLocaleDateString()}</span>
                        <span><i className="fas fa-clock"></i> {b.time}</span>
                        <span><i className="fas fa-map-pin"></i> {b.location}</span>
                      </div>
                      <div className="dash-booking-description">{b.description}</div>
                      <div className="dash-booking-amount">
                        <strong>${Number(b.amount).toFixed(2)}</strong>
                        <span>Fee ({(b.feePercentage || 10)}%): ${Number(b.platformFee).toFixed(2)} · Provider: ${Number(b.providerAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
