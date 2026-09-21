'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardShell from './DashboardShell';
import {
  DashboardCard,
  StatusBadge,
  RatingStars,
  Avatar,
  EmptyState,
  Loader,
  MessagesPanel,
  formatMoney,
  formatDate,
} from './ui';
import { api } from '@/lib/api';

const NAV = [
  { id: 'overview', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'requests', label: 'Job Requests', icon: 'fa-envelope-open-text' },
  { id: 'jobs', label: 'My Jobs', icon: 'fa-briefcase' },
  { id: 'earnings', label: 'Earnings', icon: 'fa-money-bill-wave' },
  { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
  { id: 'messages', label: 'Messages', icon: 'fa-comments' },
  { id: 'profile', label: 'My Profile', icon: 'fa-user-gear' },
  { id: 'services', label: 'Services', icon: 'fa-list-check' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-column' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

function VerificationBanner({ status, onClick }) {
  if (status === 'Verified') {
    return (
      <div className="tc-alert tc-alert-success">
        <i className="fas fa-certificate"></i>
        <div><strong>Verified Provider</strong><p>Identity and documents verified. Your profile has the trust badge.</p></div>
      </div>
    );
  }
  if (status === 'Pending') {
    return (
      <div className="tc-alert tc-alert-warn">
        <i className="fas fa-hourglass-half"></i>
        <div><strong>Verification in review</strong><p>Your documents are being reviewed by our team. This usually takes 1–2 days.</p></div>
      </div>
    );
  }
  return (
    <div className="tc-alert tc-alert-info">
      <i className="fas fa-shield-halved"></i>
      <div><strong>Get verified</strong>
        <p>Verified providers get more bookings. Submit your documents to earn the trust badge.</p>
        <button type="button" className="btn btn-white btn-sm" onClick={onClick}><i className="fas fa-arrow-right"></i> Verify now</button>
      </div>
    </div>
  );
}

export default function ProviderDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState({ requests: [], current: [], completed: [] });
  const [earnings, setEarnings] = useState({ totalEarnings: 0, platformFees: 0, jobCount: 0, recent: [] });
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgFocus, setMsgFocus] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const userId = user?.id;
  const providerId = overview?.provider?._id || null;

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const dash = await api.getDashboard();
      setOverview(dash);
      const [b, e] = await Promise.all([
        api.getProviderBookings().catch(() => ({ requests: [], current: [], completed: [] })),
        api.getProviderEarnings().catch(() => ({ totalEarnings: 0, platformFees: 0, jobCount: 0, recent: [] })),
      ]);
      setBookings(b);
      setEarnings(e);
      if (dash.provider?._id) {
        const rv = await api.getProviderReviews(String(dash.provider._id)).catch(() => ({ reviews: [] }));
        setMyReviews(rv.reviews || []);
      } else {
        setMyReviews([]);
      }
    } catch {
      /* partial state kept */
    } finally {
      setLoading(false);
    }
  }, [reloadKey]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setBookingStatus = async (bookingId, status, notify) => {
    try {
      await api.updateBookingStatus(bookingId, status);
      notify(`Booking marked "${status}".`);
      reload();
    } catch (err) {
      notify(err.message || 'Could not update booking.', 'error');
    }
  };

  const toggleAvailability = async (notify) => {
    try {
      const next = !overview?.provider?.isAvailable;
      const data = await api.updateMyProviderProfile({ isAvailable: next });
      setOverview((o) => ({ ...o, provider: data.provider }));
      notify(next ? 'You are now available for jobs.' : 'You are no longer available for jobs.');
    } catch (err) {
      notify(err.message || 'Could not update availability.', 'error');
    }
  };

  const renderOverview = (setActive, notify) => {
    if (loading) return <Loader />;
    const s = overview?.stats || {};
    return (
      <div className="tc-panels">
        <section className="tc-banner tc-banner-provider">
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back, {overview?.provider?.businessName || user?.firstName || 'Provider'}</p>
            <button type="button" className="btn btn-white btn-sm" onClick={() => toggleAvailability(notify)}>
              <i className={`fas ${overview?.provider?.isAvailable ? 'fa-circle-check' : 'fa-circle-pause'}`}></i>
              {overview?.provider?.isAvailable ? 'Available for Jobs' : 'Mark Available'}
            </button>
          </div>
          <i className="fas fa-hard-hat"></i>
        </section>

        <VerificationBanner
          status={overview?.provider?.verificationStatus || s.verificationStatus || 'Unverified'}
          onClick={() => setActive('profile')}
        />

        <div className="tc-stats">
          <DashboardCard icon="fa-calendar-day" label="Today's Jobs" value={s.todayJobs ?? 0} tone="blue" onClick={() => setActive('jobs')} />
          <DashboardCard icon="fa-envelope-open-text" label="Pending Requests" value={s.pendingRequests ?? 0} tone="amber" onClick={() => setActive('requests')} />
          <DashboardCard icon="fa-money-bill-wave" label="Total Earnings" value={formatMoney(overview?.earnings?.totalEarnings || 0)} tone="green" onClick={() => setActive('earnings')} />
          <DashboardCard icon="fa-star" label="Avg. Rating" value={s.rating ? `${s.rating} / 5` : '—'} tone="navy" onClick={() => setActive('reviews')} />
        </div>

        {overview?.upcomingJobs && overview.upcomingJobs.length > 0 && (
            <section className="tc-card">
              <div className="tc-card-head">
                <h3><i className="fas fa-clock"></i> Upcoming Jobs</h3>
                <button type="button" className="tc-link-btn" onClick={() => setActive('jobs')}>View all</button>
              </div>
              <div className="tc-mini-list">
                {overview.upcomingJobs.map((b) => (
                  <MiniJob key={String(b._id)} b={b} onMessage={(booking) => openClientChat(booking, setActive)} />
                ))}
              </div>
            </section>
        )}

        <div className="tc-grid-2">
          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-envelope-open-text"></i> New Requests</h3>
              <button type="button" className="tc-link-btn" onClick={() => setActive('requests')}>View all</button>
            </div>
            {(bookings.requests || []).length === 0 ? (
              <EmptyState icon="fa-inbox" message="No new requests yet." />
            ) : (
              <div className="tc-list">
                {(bookings.requests || []).slice(0, 3).map((b) => (
                  <SimpleRequest key={String(b._id)} b={b} onAccept={() => setBookingStatus(b.bookingId, 'Accepted', notify)} onDecline={() => setBookingStatus(b.bookingId, 'Cancelled', notify)} />
                ))}
              </div>
            )}
          </section>

          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-star"></i> Recent Reviews</h3>
              <button type="button" className="tc-link-btn" onClick={() => setActive('reviews')}>View all</button>
            </div>
            {(!overview?.recentReviews || overview.recentReviews.length === 0) ? (
              <EmptyState icon="fa-star" message="No reviews yet." />
            ) : (
              <div className="tc-mini-list">
                {overview.recentReviews.map((r) => (
                  <div key={String(r._id)} className="tc-mini-item">
                    <RatingStars rating={r.rating} />
                    <p>{r.comment || 'No comment provided.'}</p>
                    <span className="tc-muted">— {r.customerName} · {formatDate(r.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="tc-card">
          <div className="tc-card-head">
            <h3><i className="fas fa-bell"></i> Notifications</h3>
          </div>
          {(!overview?.notifications || overview.notifications.length === 0) ? (
            <EmptyState icon="fa-bell-slash" message="No notifications yet." />
          ) : (
            <div className="tc-activity">
              {overview.notifications.map((n) => (
                <div key={String(n._id)} className="tc-activity-item">
                  <div className="tc-activity-dot"></div>
                  <div>
                    <strong>{n.title}</strong>
                    <span className="tc-activity-time">{n.message} · {formatDate(n.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const openClientChat = async (booking, setActive) => {
    const customerUserId = booking.customerUserId || null;
    if (!customerUserId) return;
    setMsgFocus({ userId: String(customerUserId), bookingId: booking.bookingId });
    setActive('messages');
  };

  const renderRequests = (notify) => {
    if (loading) return <Loader />;
    const list = bookings.requests || [];
    return (
      <div className="tc-panels">
        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-envelope-open-text"></i> Job Requests</h3></div>
          {list.length === 0 ? (
            <EmptyState icon="fa-inbox" message="No job requests yet. New booking requests will appear here." />
          ) : (
            <div className="tc-list">
              {list.map((b) => (
                <div key={String(b._id)} className="tc-list-item">
                  <div className="tc-list-head">
                    <strong><i className="fas fa-hashtag"></i> {b.bookingId}</strong>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="tc-list-body">
                    <div className="tc-list-row"><span>Service</span><strong>{b.service}</strong></div>
                    <div className="tc-list-row"><span>Customer</span><strong>{b.customerName}</strong></div>
                    <div className="tc-list-row"><span>When</span><strong>{formatDate(b.date)} at {b.time}</strong></div>
                    <div className="tc-list-row"><span>Location</span><strong>{b.location}</strong></div>
                    <div className="tc-list-row"><span>Payout</span><strong>{formatMoney(b.providerAmount)}</strong></div>
                    {b.description && <div className="tc-list-row"><span>Notes</span><strong>{b.description}</strong></div>}
                  </div>
                  <div className="tc-card-actions">
                    <button type="button" className="btn btn-success btn-sm" onClick={() => setBookingStatus(b.bookingId, 'Accepted', notify)}>
                      <i className="fas fa-check"></i> Accept
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setBookingStatus(b.bookingId, 'Cancelled', notify)}>
                      <i className="fas fa-ban"></i> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const NEXT_JOB_ACTION = {
    Accepted: { label: 'Start Job', to: 'In Progress', icon: 'fa-play' },
    'In Progress': { label: 'Complete Job', to: 'Completed', icon: 'fa-flag-checkered' },
  };

  const renderJobs = (notify, setActive) => {
    if (loading) return <Loader />;
    const cur = bookings.current || [];
    const done = bookings.completed || [];
    return (
      <div className="tc-panels">
        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-briefcase"></i> Current Jobs</h3></div>
          {cur.length === 0 ? (
            <EmptyState icon="fa-briefcase" message="No active jobs right now." />
          ) : (
            <div className="tc-list">
              {cur.map((b) => {
                const action = NEXT_JOB_ACTION[b.status];
                return (
                  <div key={String(b._id)} className="tc-list-item">
                    <div className="tc-list-head">
                      <strong><i className="fas fa-hashtag"></i> {b.bookingId}</strong>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="tc-list-body">
                      <div className="tc-list-row"><span>Service</span><strong>{b.service}</strong></div>
                      <div className="tc-list-row"><span>Customer</span><strong>{b.customerName}</strong></div>
                      <div className="tc-list-row"><span>When</span><strong>{formatDate(b.date)} at {b.time}</strong></div>
                      <div className="tc-list-row"><span>Location</span><strong>{b.location}</strong></div>
                      <div className="tc-list-row"><span>Payout</span><strong>{formatMoney(b.providerAmount)}</strong></div>
                    </div>
                    <div className="tc-card-actions">
                      {action && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setBookingStatus(b.bookingId, action.to, notify)}>
                          <i className={`fas ${action.icon}`}></i> {action.label}
                        </button>
                      )}
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openClientChat(b, setActive)}>
                        <i className="fas fa-comment"></i> Message
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-list"></i> Completed Jobs</h3></div>
          {done.length === 0 ? (
            <EmptyState icon="fa-trash-can" message="No completed jobs yet." />
          ) : (
            <div className="tc-list">
              {done.map((b) => (
                <div key={String(b._id)} className="tc-list-item">
                  <div className="tc-list-head">
                    <strong><i className="fas fa-hashtag"></i> {b.bookingId}</strong>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="tc-list-body">
                    <div className="tc-list-row"><span>Service</span><strong>{b.service}</strong></div>
                    <div className="tc-list-row"><span>Customer</span><strong>{b.customerName}</strong></div>
                    <div className="tc-list-row"><span>Completed</span><strong>{formatDate(b.completedAt || b.updatedAt)}</strong></div>
                    <div className="tc-list-row"><span>Earned</span><strong>{formatMoney(b.providerAmount)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderEarnings = () => {
    if (loading) return <Loader />;
    return (
      <div className="tc-panels">
        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-money-bill-wave"></i> Earnings</h3></div>
          <div className="tc-stats">
            <DashboardCard icon="fa-sack-dollar" label="Total Earnings" value={formatMoney(earnings.totalEarnings)} tone="green" />
            <DashboardCard icon="fa-chart-pie" label="Platform Fees" value={formatMoney(earnings.platformFees)} tone="amber" />
            <DashboardCard icon="fa-briefcase" label="Jobs Completed" value={earnings.jobCount} tone="blue" />
          </div>
          {earnings.recent.length === 0 ? (
            <EmptyState icon="fa-receipt" message="No completed payments yet." />
          ) : (
            <div className="tc-table-wrap">
              <table className="tc-table">
                <thead><tr><th>Booking</th><th>Service</th><th>Customer</th><th>Completed</th><th>Your Payout</th><th>Fee</th></tr></thead>
                <tbody>
                  {earnings.recent.map((p) => (
                    <tr key={String(p._id)}>
                      <td>{p.bookingId}</td>
                      <td>{p.service}</td>
                      <td>{p.customerName}</td>
                      <td>{formatDate(p.completedAt || p.updatedAt)}</td>
                      <td>{formatMoney(p.providerAmount)}</td>
                      <td>{formatMoney(p.platformFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderReviews = () => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-star"></i> My Reviews</h3></div>
        <div className="tc-stats tc-stats-inline">
          <DashboardCard icon="fa-star" label="Average Rating" value={overview?.stats?.rating ? `${overview.stats.rating} / 5` : '—'} tone="navy" />
          <DashboardCard icon="fa-comment-dots" label="Total Reviews" value={myReviews.length} tone="blue" />
        </div>
        {myReviews.length === 0 ? (
          <EmptyState icon="fa-star" message="No reviews yet. Reviews appear once clients rate your completed jobs." />
        ) : (
          <div className="tc-list">
            {myReviews.map((r) => (
              <div key={String(r._id)} className="tc-list-item">
                <div className="tc-list-head">
                  <RatingStars rating={r.rating} />
                  <span className="tc-muted">{formatDate(r.createdAt)}</span>
                </div>
                <p style={{ marginTop: '6px' }}>{r.comment || 'No comment provided.'}</p>
                <span className="tc-muted">by {r.customerName}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderMessages = (notify) => (
    <div className="tc-panels">
      <MessagesPanel meId={userId} focus={msgFocus} notify={notify} />
    </div>
  );

  const renderProfile = (notify) => {
    const provider = overview?.provider;
    if (!provider) {
      return <ProfileCreate notify={notify} onCreated={reload} />;
    }
    return (
      <div className="tc-panels">
        <section className="tc-card tc-profile">
          <Avatar name={provider.businessName || provider.specialty} extra />
          <h3>{provider.businessName || 'Your Business'}</h3>
          <span className="tc-acct-type"><i className="fas fa-user-tie"></i> {provider.specialty || 'Provider'}</span>
          <StatusBadge status={provider.verificationStatus === 'Verified' ? 'Completed' : provider.verificationStatus === 'Pending' ? 'Pending' : 'Rejected'} />
          <div className="tc-profile-rows">
            <div className="tc-list-row"><span>Location</span><strong>{provider.location || '—'}</strong></div>
            <div className="tc-list-row"><span>Rate</span><strong>{provider.hourlyRate ? `${formatMoney(provider.hourlyRate)}/hr` : '—'}</strong></div>
            <div className="tc-list-row"><span>Availability</span><strong>{provider.isAvailable ? 'Available' : 'Offline'}</strong></div>
            <div className="tc-list-row"><span>Jobs done</span><strong>{provider.totalJobs || 0}</strong></div>
          </div>
        </section>

        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-pen"></i> Edit Profile</h3></div>
          <ProfileForm provider={provider} notify={notify} onSaved={loadAll} />
        </section>

        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-shield-halved"></i> Verification</h3></div>
          <VerificationPanel status={provider.verificationStatus} notify={notify} onDone={loadAll} />
        </section>
      </div>
    );
  };

  const renderServices = (notify) => {
    const provider = overview?.provider;
    if (!provider) return <EmptyState icon="fa-list-check" message="Create your profile first." />;
    return <ServicesPanel provider={provider} notify={notify} />;
  };

  const renderAnalytics = () => {
    if (loading) return <Loader />;
    const s = overview?.stats || {};
    const all = [...(bookings.requests || []), ...(bookings.current || []), ...(bookings.completed || [])];
    const byStatus = {};
    all.forEach((b) => { byStatus[b.status] = (byStatus[b.status] || 0) + 1; });
    const accepted = (byStatus['Accepted'] || 0) + (byStatus['In Progress'] || 0) + (byStatus['Completed'] || 0);
    const total = all.length;
    const completionRate = total > 0 ? Math.round(((byStatus['Completed'] || 0) / total) * 100) : 0;
    return (
      <div className="tc-panels">
        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-chart-column"></i> Analytics</h3></div>
          <div className="tc-stats">
            <DashboardCard icon="fa-book-open" label="Total Bookings" value={total} tone="blue" />
            <DashboardCard icon="fa-circle-check" label="Completed" value={byStatus['Completed'] || 0} tone="green" />
            <DashboardCard icon="fa-thumbs-up" label="Accepted Rate" value={total > 0 ? `${Math.round((accepted / total) * 100)}%` : '—'} tone="navy" />
            <DashboardCard icon="fa-flag-checkered" label="Completion Rate" value={`${completionRate}%`} tone="amber" />
          </div>
          <div className="tc-table-wrap">
            <table className="tc-table">
              <thead><tr><th>Status</th><th>Bookings</th></tr></thead>
              <tbody>
                {Object.entries(byStatus).map(([k, v]) => (
                  <tr key={k}><td><StatusBadge status={k} /></td><td>{v}</td></tr>
                ))}
                {Object.keys(byStatus).length === 0 && <tr><td colSpan="2">No data yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderSettings = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-gear"></i> Settings</h3></div>
        <div className="tc-list">
          <div className="tc-list-item">
            <div>
              <strong>Availability</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>
                {overview?.provider?.isAvailable ? 'You are visible to clients and receiving requests.' : 'You are hidden from clients right now.'}
              </p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleAvailability(notify)}>
              {overview?.provider?.isAvailable ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
          <div className="tc-list-item">
            <div>
              <strong>Account Type</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>You have a <strong>Provider</strong> account on Trust Connect.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <DashboardShell user={user} roleLabel="Provider" nav={NAV} onLogout={onLogout}>
      {({ active, setActive, notify }) => {
        switch (active) {
          case 'requests':
            return renderRequests(notify);
          case 'jobs':
            return renderJobs(notify, setActive);
          case 'earnings':
            return renderEarnings();
          case 'reviews':
            return renderReviews();
          case 'messages':
            return renderMessages(notify);
          case 'profile':
            return renderProfile(notify);
          case 'services':
            return renderServices(notify);
          case 'analytics':
            return renderAnalytics();
          case 'settings':
            return renderSettings(notify);
          default:
            return renderOverview(setActive, notify);
        }
      }}
    </DashboardShell>
  );
}

function MiniJob({ b, onMessage }) {
  return (
    <div className="tc-mini-item tc-mini-row">
      <div>
        <strong>{b.service}</strong>
        <span className="tc-muted">{b.customerName} · {formatDate(b.date)} at {b.time} · {b.location}</span>
      </div>
      <StatusBadge status={b.status} />
      <button type="button" className="tc-link-btn" onClick={() => onMessage(b)}><i className="fas fa-comment"></i></button>
    </div>
  );
}

function SimpleRequest({ b, onAccept, onDecline }) {
  return (
    <div className="tc-list-item">
      <div className="tc-list-head">
        <strong>{b.bookingId}</strong>
        <span className="tc-muted">{formatDate(b.date)} · {b.time}</span>
      </div>
      <div className="tc-list-row"><span>Service</span><strong>{b.service}</strong></div>
      <div className="tc-list-row"><span>Customer</span><strong>{b.customerName}</strong></div>
      <div className="tc-list-row"><span>Payout</span><strong>{formatMoney(b.providerAmount)}</strong></div>
      <div className="tc-card-actions">
        <button type="button" className="btn btn-success btn-sm" onClick={onAccept}><i className="fas fa-check"></i> Accept</button>
        <button type="button" className="btn btn-danger btn-sm" onClick={onDecline}><i className="fas fa-ban"></i> Decline</button>
      </div>
    </div>
  );
}

function ProfileCreate({ notify, onCreated }) {
  const [form, setForm] = useState({ businessName: '', specialty: '', location: '', bio: '', hourlyRate: '' });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.businessName || !form.specialty) {
      notify('Business name and specialty are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.createProvider({ ...form, hourlyRate: Number(form.hourlyRate) || 0 });
      notify('Provider profile created. Welcome aboard!');
      onCreated();
    } catch (err) {
      notify(err.message || 'Could not create profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tc-panels">
      <section className="tc-card tc-profile">
        <h3><i className="fas fa-user-plus"></i> Create Your Provider Profile</h3>
        <p className="tc-muted">Set up your business profile so clients can find and book you.</p>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>Business Name</label>
              <input type="text" value={form.businessName} onChange={set('businessName')} placeholder="e.g. HandyWorks Plumbing" required />
            </div>
            <div className="form-group">
              <label>Specialty / Trade</label>
              <input type="text" value={form.specialty} onChange={set('specialty')} placeholder="e.g. Plumbing" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Harare" />
            </div>
            <div className="form-group">
              <label>Hourly Rate (emergency)</label>
              <input type="number" min="0" value={form.hourlyRate} onChange={set('hourlyRate')} placeholder="e.g. 25" />
            </div>
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea rows="3" value={form.bio} onChange={set('bio')} placeholder="Tell clients about your experience and services."></textarea>
          </div>
          <div className="tc-card-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="fas fa-paper-plane"></i> {saving ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProfileForm({ provider, notify, onSaved }) {
  const [form, setForm] = useState(() => ({
    businessName: provider.businessName || '',
    specialty: provider.specialty || '',
    location: provider.location || '',
    bio: provider.bio || '',
    hourlyRate: provider.hourlyRate || '',
    isAvailable: !!provider.isAvailable,
  }));
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMyProviderProfile({ ...form, hourlyRate: Number(form.hourlyRate) || 0 });
      notify('Profile updated.');
      onSaved();
    } catch (err) {
      notify(err.message || 'Could not update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="form-row">
        <div className="form-group">
          <label>Business Name</label>
          <input type="text" value={form.businessName} onChange={set('businessName')} required />
        </div>
        <div className="form-group">
          <label>Specialty / Trade</label>
          <input type="text" value={form.specialty} onChange={set('specialty')} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Location</label>
          <input type="text" value={form.location} onChange={set('location')} />
        </div>
        <div className="form-group">
          <label>Hourly Rate</label>
          <input type="number" min="0" value={form.hourlyRate} onChange={set('hourlyRate')} />
        </div>
      </div>
      <div className="form-group">
        <label>Bio</label>
        <textarea rows="3" value={form.bio} onChange={set('bio')}></textarea>
      </div>
      <label className="tc-check">
        <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
        Available for new jobs
      </label>
      <div className="tc-card-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          <i className="fas fa-save"></i> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function ServicesPanel({ provider, notify }) {
  const [services, setServices] = useState(provider?.services || []);
  const [text, setText] = useState((provider?.services || []).join(', '));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const list = text.split(',').map((s2) => s2.trim()).filter(Boolean);
    setSaving(true);
    try {
      const data = await api.updateMyProviderProfile({ services: list });
      setServices(data.provider.services || []);
      notify('Services updated.');
    } catch (err) {
      notify(err.message || 'Could not update services.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-list-check"></i> Services You Offer</h3></div>
        {services.length > 0 && (
          <div className="tc-tags">
            {services.map((s) => <span key={s} className="tc-tag"><i className="fas fa-check-circle"></i> {s}</span>)}
          </div>
        )}
        <div className="form-group" style={{ marginTop: '12px' }}>
          <label htmlFor="svc">Services (comma separated)</label>
          <input id="svc" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Plumbing, Drain Cleaning, Installation" />
        </div>
        <div className="tc-card-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            <i className="fas fa-save"></i> {saving ? 'Saving...' : 'Save Services'}
          </button>
        </div>
      </section>
    </div>
  );
}

function VerificationPanel({ status, notify, onDone }) {
  const [form, setForm] = useState({ idNumber: '', phoneConfirmed: false, documentUrl: '' });
  const [saving, setSaving] = useState(false);

  if (status === 'Verified') {
    return (
      <div className="tc-alert tc-alert-success">
        <i className="fas fa-certificate"></i>
        <div><strong>You are a verified provider.</strong><p>Clients can see the verified badge on your profile.</p></div>
      </div>
    );
  }
  if (status === 'Pending') {
    return (
      <div className="tc-alert tc-alert-warn">
        <i className="fas fa-hourglass-half"></i>
        <div><strong>Verification pending review.</strong><p>Our team is checking your submitted documents.</p></div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.idNumber) {
      notify('Please enter an ID / document number.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.submitVerification({
        idNumber: form.idNumber,
        phoneConfirmed: form.phoneConfirmed,
        documents: form.documentUrl ? [form.documentUrl] : [],
      });
      notify('Verification request submitted for review.');
      setForm({ idNumber: '', phoneConfirmed: false, documentUrl: '' });
      onDone();
    } catch (err) {
      notify(err.message || 'Could not submit verification.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <p className="tc-muted" style={{ marginBottom: '10px' }}>Submit your national ID / passport number for manual verification. You can attach a photo/document URL for faster review.</p>
      <div className="form-row">
        <div className="form-group">
          <label>ID / Passport Number</label>
          <input type="text" value={form.idNumber} onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))} placeholder="e.g. 63-123456-K-90" required />
        </div>
        <div className="form-group">
          <label>Document URL (optional)</label>
          <input type="text" value={form.documentUrl} onChange={(e) => setForm((f) => ({ ...f, documentUrl: e.target.value }))} placeholder="https://..." />
        </div>
      </div>
      <label className="tc-check">
        <input type="checkbox" checked={form.phoneConfirmed} onChange={(e) => setForm((f) => ({ ...f, phoneConfirmed: e.target.checked }))} />
        I confirm this phone number belongs to me
      </label>
      <div className="tc-card-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          <i className="fas fa-paper-plane"></i> {saving ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </div>
    </form>
  );
}