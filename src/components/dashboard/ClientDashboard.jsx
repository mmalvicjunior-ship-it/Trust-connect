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
  'In Progress': { bg: '#EEF2FF', color: '#4338CA', label: 'In Progress' },
  Completed: { bg: '#ECFDF5', color: '#047857', label: 'Completed' },
  Cancelled: { bg: '#F1F5F9', color: '#475569', label: 'Cancelled' },
};

export default function ClientDashboard() {
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
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setToast({ message: 'Could not load bookings.', type: 'error' }))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  const counts = {
    All: bookings.length,
    Pending: bookings.filter((b) => b.status === 'Pending').length,
    Accepted: bookings.filter((b) => b.status === 'Accepted').length,
    Completed: bookings.filter((b) => b.status === 'Completed').length,
    Cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
  };

  const filtered = filter === 'All'
    ? bookings
    : filter === 'Cancelled'
      ? bookings.filter((b) => b.status === 'Cancelled')
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
            {[
              ['All', 'list', 'All Bookings'],
              ['Pending', 'clock', 'Pending'],
              ['Accepted', 'check-circle', 'Accepted'],
              ['In Progress', 'spinner', 'In Progress'],
              ['Completed', 'check-double', 'Completed'],
              ['Cancelled', 'times-circle', 'Cancelled'],
            ].map(([key, icon, label]) => (
              <button type="button" className="dash-card" onClick={() => setFilter(key)} key={key}>
                <div className={`dash-card-icon ${key.toLowerCase()}`}><i className={`fas fa-${icon}`}></i></div>
                <div><div className="dash-card-num">{counts[key]}</div><div className="dash-card-lab">{label}</div></div>
              </button>
            ))}
            <Link href="/booking" className="dash-card dash-card-cta">
              <div className="dash-card-icon new"><i className="fas fa-plus"></i></div>
              <div><div className="dash-card-num">New</div><div className="dash-card-lab">Book a Service</div></div>
            </Link>
          </div>

          <div className="dash-booking" style={{ marginBottom: '28px' }}>
            <div className="dash-booking-head"><h3 className="dash-title">Account Details</h3></div>
            <div className="dash-booking-meta" style={{ paddingTop: '18px' }}>
              <span><i className="fas fa-user"></i> {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</span>
              <span><i className="fas fa-envelope"></i> {user.email}</span>
              <span><i className="fas fa-phone"></i> {user.phone || 'Phone not provided'}</span>
            </div>
          </div>

          <div className="dash-toolbar">
            <h3 className="dash-title">Your Bookings {filter !== 'All' && <>— {filter}</>}</h3>
            <div className="dash-filters">
              {Object.keys(counts).map((key) => (
                <button key={key} type="button" className={`dash-filter-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{key}</button>
              ))}
            </div>
          </div>

          {loading ? <p className="dash-empty">Loading your bookings...</p> : filtered.length === 0 ? (
            <div className="dash-empty">
              <i className="fas fa-inbox" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '12px' }}></i>
              <p>No {filter !== 'All' ? filter.toLowerCase() : ''} bookings found.</p>
              <Link href="/booking" className="btn btn-primary" style={{ marginTop: '18px' }}>Book a Service</Link>
            </div>
          ) : (
            <div className="dash-booking-list">
              {filtered.map((booking) => {
                const status = STATUS_STYLES[booking.status] || STATUS_STYLES.Pending;
                return (
                  <div key={booking.bookingId} className="dash-booking">
                    <div className="dash-booking-head">
                      <div className="dash-booking-id"><i className="fas fa-hashtag"></i> {booking.bookingId}</div>
                      <span className="dash-badge" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                    </div>
                    <div className="dash-booking-body">
                      <div className="dash-booking-provider">
                        <div className="dash-provider-avatar"><i className="fas fa-user-tie"></i></div>
                        <div><div className="dash-provider-name">{booking.providerName || 'Provider'}</div><div className="dash-booking-service">{booking.service}</div></div>
                      </div>
                      <div className="dash-booking-meta">
                        <span><i className="fas fa-calendar-day"></i> {new Date(booking.date).toLocaleDateString()}</span>
                        <span><i className="fas fa-clock"></i> {booking.time}</span>
                        <span><i className="fas fa-map-pin"></i> {booking.location}</span>
                      </div>
                      <div className="dash-booking-description">{booking.description}</div>
                      <div className="dash-booking-amount">
                        <strong>${Number(booking.amount).toFixed(2)}</strong>
                        <span>Fee ({booking.feePercentage || 10}%): ${Number(booking.platformFee).toFixed(2)} · Provider: ${Number(booking.providerAmount).toFixed(2)}</span>
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