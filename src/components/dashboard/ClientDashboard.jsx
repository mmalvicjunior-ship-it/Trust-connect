'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  { id: 'find', label: 'Find a Service', icon: 'fa-magnifying-glass' },
  { id: 'bookings', label: 'My Bookings', icon: 'fa-calendar-check' },
  { id: 'saved', label: 'Saved Providers', icon: 'fa-bookmark' },
  { id: 'messages', label: 'Messages', icon: 'fa-comments' },
  { id: 'payments', label: 'Payments', icon: 'fa-credit-card' },
  { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
  { id: 'profile', label: 'Profile', icon: 'fa-user' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

export default function ClientDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [saved, setSaved] = useState([]);
  const [payments, setPayments] = useState({ payments: [], totalPaid: 0 });
  const [reviewed, setReviewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgFocus, setMsgFocus] = useState(null);
  const userId = user?.id;
  const providerUserIds = useRef({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, b, p, sv, pay] = await Promise.all([
        api.getDashboard(),
        api.getBookings(),
        api.getProviders(),
        api.getSavedProviders().catch(() => ({ savedProviders: [] })),
        api.getMyPayments().catch(() => ({ payments: [], totalPaid: 0 })),
      ]);
      setOverview(dash);
      setBookings(b.bookings || []);
      setProviders(p.providers || []);
      setSaved(sv.savedProviders || []);
      setPayments(pay);
      setReviewed([]);
    } catch {
      /* dashboard keeps partial state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const resolveProviderUserId = useCallback(async (providerId) => {
    if (!providerId) return null;
    if (providerUserIds.current[providerId]) return providerUserIds.current[providerId];
    try {
      const data = await api.getProvider(providerId);
      const u = data.provider?.userId;
      if (u) providerUserIds.current[providerId] = String(u);
      return u ? String(u) : null;
    } catch {
      return null;
    }
  }, []);

  const openProviderChat = useCallback(async (providerId, bookingId) => {
    const receiverId = await resolveProviderUserId(providerId);
    if (!receiverId) return;
    setMsgFocus({ userId: receiverId, bookingId: bookingId || null });
  }, [resolveProviderUserId]);

  const cancelBooking = async (bookingId, notify, setActive) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.updateBookingStatus(bookingId, 'Cancelled');
      notify('Booking cancelled.');
      loadAll();
      setActive('bookings');
    } catch (err) {
      notify(err.message || 'Could not cancel booking.', 'error');
    }
  };

  const toggleSave = async (providerId, notify) => {
    try {
      const data = await api.toggleSavedProvider(providerId);
      notify(data.saved ? 'Provider saved.' : 'Provider removed from saved.');
      const sv = await api.getSavedProviders();
      setSaved(sv.savedProviders || []);
      const dash = await api.getDashboard();
      setOverview(dash);
    } catch (err) {
      notify(err.message || 'Could not update saved providers.', 'error');
    }
  };

  const submitReview = async (bookingId, providerId, rating, comment, notify) => {
    try {
      await api.createReview({ bookingId, providerId, rating, comment });
      setReviewed((r) => [...r, bookingId]);
      notify('Review submitted. Thank you!');
    } catch (err) {
      notify(err.message || 'Could not submit review.', 'error');
    }
  };

  const renderOverview = (setActive, notify) => {
    const s = overview?.stats || {};
    const upcoming = overview?.upcomingBooking;
    return (
      <div className="tc-panels">
        <section className="tc-banner tc-banner-client">
          <div>
            <h2>Welcome back, {user?.firstName || 'Client'}</h2>
            <p>Need a professional? Book a trusted service provider in minutes.</p>
            <Link href="/booking" className="btn btn-white btn-sm"><i className="fas fa-calendar-check"></i> Book a Service</Link>
          </div>
          <i className="fas fa-user-shield"></i>
        </section>

        <div className="tc-stats">
          <DashboardCard icon="fa-calendar-check" label="Active Bookings" value={s.active ?? 0} tone="blue" onClick={() => setActive('bookings')} />
          <DashboardCard icon="fa-circle-check" label="Completed Jobs" value={s.completed ?? 0} tone="green" onClick={() => setActive('bookings')} />
          <DashboardCard icon="fa-bookmark" label="Saved Providers" value={s.saved ?? 0} tone="amber" onClick={() => setActive('saved')} />
        </div>

        {upcoming && (
          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-clock"></i> Upcoming Booking</h3>
              <StatusBadge status={upcoming.status} />
            </div>
            <div className="tc-booking-detail">
              <div className="tc-booking-line"><span>Service</span><strong>{upcoming.service}</strong></div>
              <div className="tc-booking-line"><span>Provider</span><strong>{upcoming.providerName || 'Provider'}</strong></div>
              <div className="tc-booking-line"><span>Date</span><strong>{formatDate(upcoming.date)}</strong></div>
              <div className="tc-booking-line"><span>Time</span><strong>{upcoming.time}</strong></div>
              <div className="tc-booking-line"><span>Location</span><strong>{upcoming.location}</strong></div>
            </div>
            <div className="tc-card-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setActive('bookings')}><i className="fas fa-eye"></i> View Booking</button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={async () => {
                  await openProviderChat(upcoming.providerId, upcoming.bookingId);
                  setActive('messages');
                }}
              >
                <i className="fas fa-comment"></i> Message Provider
              </button>
            </div>
          </section>
        )}

        <div className="tc-grid-2">
          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-star"></i> Recommended Providers</h3>
              <button type="button" className="tc-link-btn" onClick={() => setActive('find')}>View all</button>
            </div>
            {(!overview?.recommendedProviders || overview.recommendedProviders.length === 0) ? (
              <EmptyState icon="fa-user-tie" message="No providers available yet." />
            ) : (
              <div className="tc-prov-mini">
                {overview.recommendedProviders.map((p) => (
                  <div key={String(p._id)} className="tc-prov-mini-item">
                    <Avatar name={p.businessName || p.specialty} />
                    <div className="tc-prov-mini-body">
                      <strong>{p.businessName || p.specialty}</strong>
                      <span>{p.specialty} · {p.location || 'Local'}</span>
                      <RatingStars rating={p.rating} />
                    </div>
                    <Link href="/booking" className="btn btn-primary btn-sm">Book Now</Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-bolt"></i> Recent Activity</h3>
            </div>
            {(!overview?.recentActivity || overview.recentActivity.length === 0) ? (
              <EmptyState icon="fa-clock-rotate-left" message="No recent activity yet." />
            ) : (
              <div className="tc-activity">
                {overview.recentActivity.map((a) => (
                  <div key={String(a._id)} className="tc-activity-item">
                    <div className="tc-activity-dot"></div>
                    <div>
                      <strong>{a.label}</strong>
                      {a.details?.bookingId && <span> · {a.details.bookingId}</span>}
                      <span className="tc-activity-time">{formatDate(a.createdAt)}</span>
                    </div>
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

  const renderFind = (notify, setActive) => (
    <FindProviders
      providers={providers}
      notify={notify}
      setActive={setActive}
      onMessage={(pid) => openProviderChat(pid)}
      onToggleSave={(pid) => toggleSave(pid, notify)}
    />
  );

  const renderBookings = (notify, setActive) => {
    if (loading) return <Loader />;
    return (
      <div className="tc-panels">
        <section className="tc-card">
          <div className="tc-card-head">
            <h3><i className="fas fa-calendar-check"></i> My Bookings</h3>
            <Link href="/booking" className="btn btn-primary btn-sm"><i className="fas fa-plus"></i> New Booking</Link>
          </div>
          {bookings.length === 0 ? (
            <EmptyState icon="fa-inbox" message="You have no bookings yet." action={<Link href="/booking" className="btn btn-primary"><i className="fas fa-calendar-check"></i> Book a Service</Link>} />
          ) : (
            <div className="tc-list">
              {bookings.map((b) => (
                <div key={String(b._id)} className="tc-list-item">
                  <div className="tc-list-head">
                    <strong><i className="fas fa-hashtag"></i> {b.bookingId}</strong>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="tc-list-body">
                    <div className="tc-list-row"><span>Service</span><strong>{b.service}</strong></div>
                    <div className="tc-list-row"><span>Provider</span><strong>{b.providerName || 'Provider'}</strong></div>
                    <div className="tc-list-row"><span>When</span><strong>{formatDate(b.date)} at {b.time}</strong></div>
                    <div className="tc-list-row"><span>Location</span><strong>{b.location}</strong></div>
                    <div className="tc-list-row"><span>Description</span><strong>{b.description}</strong></div>
                    <div className="tc-list-row"><span>Amount</span><strong>{formatMoney(b.amount)} <small>(fee {formatMoney(b.platformFee)} · provider {formatMoney(b.providerAmount)})</small></strong></div>
                  </div>
                  <div className="tc-card-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => openProviderChat(b.providerId, b.bookingId)}
                    >
                      <i className="fas fa-comment"></i> Message Provider
                    </button>
                    {['Pending', 'Accepted', 'Confirmed', 'In Progress'].includes(b.status) && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.bookingId, notify, setActive)}>
                        <i className="fas fa-ban"></i> Cancel
                      </button>
                    )}
                    {b.status === 'Completed' && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setActive('reviews')}>
                        <i className="fas fa-star"></i> Leave a Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderSaved = (notify, setActive) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-bookmark"></i> Saved Providers</h3></div>
        {saved.length === 0 ? (
          <EmptyState icon="fa-bookmark" message="No saved providers yet." action={<button type="button" className="btn btn-primary" onClick={() => setActive('find')}><i className="fas fa-magnifying-glass"></i> Find Providers</button>} />
        ) : (
          <div className="tc-prov-grid">
            {saved.map((p) => (
              <div key={String(p._id)} className="tc-prov-card">
                <div className="tc-prov-card-head">
                  <Avatar name={p.businessName || p.specialty} />
                  <div><strong>{p.businessName || 'Provider'}</strong><span>{p.specialty}</span></div>
                </div>
                <RatingStars rating={p.rating} />
                <div className="tc-card-actions">
                  <Link href="/booking" className="btn btn-primary btn-sm"><i className="fas fa-calendar-check"></i> Book Now</Link>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleSave(p._id, notify)}><i className="fas fa-bookmark"></i> Unsave</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderMessages = (notify) => (
    <div className="tc-panels">
      <MessagePanelWrap user={user} msgFocus={msgFocus} notify={notify} />
    </div>
  );

  const renderPayments = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-credit-card"></i> Payments</h3></div>
        <div className="tc-stats tc-stats-inline">
          <DashboardCard icon="fa-money-bill-wave" label="Total Paid" value={formatMoney(payments.totalPaid)} tone="green" />
          <DashboardCard icon="fa-receipt" label="Transactions" value={payments.payments.length} tone="blue" />
        </div>
        {payments.payments.length === 0 ? (
          <EmptyState icon="fa-receipt" message="No payments yet." />
        ) : (
          <div className="tc-table-wrap">
            <table className="tc-table">
              <thead><tr><th>Payment</th><th>Booking</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {payments.payments.map((p) => (
                  <tr key={String(p._id)}>
                    <td>{p.paymentId}</td>
                    <td>{p.bookingId}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td>{formatMoney(p.amount)}</td>
                    <td><StatusBadge status={p.status === 'Paid' ? 'Completed' : 'Pending'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const renderReviews = (notify) => {
    const completed = bookings.filter((b) => b.status === 'Completed');
    return (
      <div className="tc-panels">
        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-star"></i> Reviews</h3></div>
          {completed.length === 0 ? (
            <EmptyState icon="fa-star" message="You haven't completed any jobs yet. Review a provider once your job is done." />
          ) : (
            <div className="tc-list">
              {completed.map((b) => (
                <ReviewForm key={String(b._id)} booking={b} reviewed={reviewed.includes(b.bookingId)} onSubmit={(rating, comment) => submitReview(b.bookingId, b.providerId, rating, comment, notify)} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="tc-panels">
      <section className="tc-card tc-profile">
        <Avatar name={user?.fullName} extra />
        <h3>{user?.fullName || 'Member'}</h3>
        <p className="tc-acct-type">Client</p>
        <div className="tc-profile-rows">
          <div className="tc-list-row"><span>Email</span><strong>{user?.email}</strong></div>
          <div className="tc-list-row"><span>Phone</span><strong>{user?.phone || 'Not provided'}</strong></div>
          <div className="tc-list-row"><span>Member since</span><strong>{user?.createdAt ? formatDate(user.createdAt) : '—'}</strong></div>
        </div>
        <div className="tc-card-actions">
          <Link href="/account" className="btn btn-outline btn-sm">Go to Account</Link>
        </div>
      </section>
    </div>
  );

  const renderSettings = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-gear"></i> Settings</h3></div>
        <div className="tc-list">
          <div className="tc-list-item">
            <div>
              <strong>Account Type</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>You have a <strong>Client</strong> account on Trust Connect.</p>
            </div>
          </div>
          <div className="tc-list-item">
            <div>
              <strong>Edit Profile</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>Update your personal details.</p>
            </div>
            <Link href="/account" className="btn btn-outline btn-sm">Open</Link>
          </div>
          <div className="tc-list-item">
            <div>
              <strong>Need a provider?</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>Browse trusted professionals on the marketplace.</p>
            </div>
            <Link href="/booking" className="btn btn-primary btn-sm">Book a Service</Link>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <DashboardShell user={user} roleLabel="Client" nav={NAV} onLogout={onLogout}>
      {({ active, setActive, notify }) => {
        switch (active) {
          case 'find':
            return renderFind(notify, setActive);
          case 'bookings':
            return renderBookings(notify, setActive);
          case 'saved':
            return renderSaved(notify, setActive);
          case 'messages':
            return renderMessages(notify);
          case 'payments':
            return renderPayments(notify);
          case 'reviews':
            return renderReviews(notify);
          case 'profile':
            return renderProfile();
          case 'settings':
            return renderSettings(notify);
          default:
            return renderOverview(setActive, notify);
        }
      }}
    </DashboardShell>
  );
}

function MessagePanelWrap({ user, msgFocus, notify }) {
  return <MessagesPanel meId={user?.id} focus={msgFocus} notify={notify} />;
}

function FindProviders({ providers, notify, setActive, onMessage, onToggleSave }) {
  const [q, setQ] = useState('');
  const list = providers.filter((p) =>
    !q ||
    `${p.businessName || ''} ${p.specialty || ''} ${p.location || ''}`.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head">
          <h3><i className="fas fa-magnifying-glass"></i> Find a Service Provider</h3>
        </div>
        <div className="tc-search">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Search by name, trade or location..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {providers.length === 0 ? (
          <EmptyState icon="fa-user-tie" message="No providers available yet. Check back soon." />
        ) : (
          <div className="tc-prov-grid">
            {list.map((p) => (
              <div key={String(p._id)} className="tc-prov-card">
                <div className="tc-prov-card-head">
                  <Avatar name={p.businessName || p.specialty} />
                  <div>
                    <strong>{p.businessName || 'Provider'}</strong>
                    <span>{p.specialty} · {p.location || 'Local'}</span>
                  </div>
                  {p.isAvailable && <span className="tc-avail"><i className="fas fa-circle"></i> Available</span>}
                </div>
                <RatingStars rating={p.rating} />
                {p.bio && <p className="tc-prov-bio">{p.bio}</p>}
                {p.hourlyRate > 0 && <p className="tc-prov-rate"><strong>{formatMoney(p.hourlyRate)}</strong>/hr</p>}
                <div className="tc-card-actions">
                  <Link href="/providers" className="btn btn-outline btn-sm"><i className="far fa-user"></i> View Profile</Link>
                  <Link href="/booking" className="btn btn-primary btn-sm"><i className="fas fa-calendar-check"></i> Book Now</Link>
                </div>
                <div className="tc-card-actions-secondary">
                  <button type="button" className="tc-link-btn" onClick={() => onMessage(p._id)}>
                    <i className="fas fa-comment"></i> Message
                  </button>
                  <button type="button" className="tc-link-btn" onClick={() => onToggleSave(p._id)}>
                    <i className="far fa-bookmark"></i> Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewForm({ booking, reviewed, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (reviewed) {
    return (
      <div className="tc-list-item">
        <div className="tc-list-head"><strong><i className="fas fa-hashtag"></i> {booking.bookingId}</strong></div>
        <p style={{ fontSize: '0.9rem', color: 'var(--success)', marginTop: '8px' }}><i className="fas fa-check-circle"></i> You already reviewed this booking.</p>
      </div>
    );
  }

  return (
    <div className="tc-list-item">
      <div className="tc-list-head">
        <strong><i className="fas fa-hashtag"></i> {booking.bookingId}</strong>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{booking.service} by {booking.providerName || 'Provider'}</span>
      </div>
      <div className="form-row" style={{ marginTop: '10px' }}>
        <div className="form-group">
          <label htmlFor={`rating-${booking.bookingId}`}>Rating</label>
          <select id={`rating-${booking.bookingId}`} value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={`comment-${booking.bookingId}`}>Your Review</label>
        <textarea id={`comment-${booking.bookingId}`} value={comment} onChange={(e) => setComment(e.target.value)} rows="3" placeholder="How was the service?"></textarea>
      </div>
      <div className="tc-card-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onSubmit(rating, comment)}><i className="fas fa-paper-plane"></i> Submit Review</button>
      </div>
    </div>
  );
}