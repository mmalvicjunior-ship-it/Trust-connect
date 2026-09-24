'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardShell from './DashboardShell';
import {
  DashboardCard,
  StatusBadge,
  RatingStars,
  EmptyState,
  Loader,
  formatMoney,
  formatDate,
} from './ui';
import { api } from '@/lib/api';

const NAV = [
  { id: 'overview', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'users', label: 'Clients', icon: 'fa-users' },
  { id: 'providers', label: 'Service Providers', icon: 'fa-user-tie' },
  { id: 'bookings', label: 'Bookings', icon: 'fa-calendar-check' },
  { id: 'services', label: 'Services', icon: 'fa-list-check' },
  { id: 'activity', label: 'Platform Activity', icon: 'fa-bolt' },
  { id: 'payments', label: 'Payments', icon: 'fa-credit-card' },
  { id: 'verifications', label: 'Verification Requests', icon: 'fa-shield-halved' },
  { id: 'reports', label: 'Reports & Disputes', icon: 'fa-flag' },
  { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-column' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

export default function AdminDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState({ payments: [], totalCollected: 0, totalVolume: 0, count: 0 });
  const [verifications, setVerifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [services, setServices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    Promise.allSettled([
      api.getDashboard(),
      api.adminGetUsers(),
      api.adminGetProviders(),
      api.adminGetBookings(),
      api.adminGetPayments(),
      api.adminGetVerifications(),
      api.adminGetReports(),
      api.adminGetReviews(),
      api.adminGetServices(),
      api.adminGetAnalytics(),
      api.adminGetActivity(),
    ])
      .then(([dash, u, p, b, pay, v, rep, rev, svc, an, act]) => {
        if (dash.status === 'fulfilled') setOverview(dash.value);
        if (u.status === 'fulfilled') setUsers(u.value?.users || []);
        if (p.status === 'fulfilled') setProviders(p.value?.providers || []);
        if (b.status === 'fulfilled') setBookings(b.value?.bookings || []);
        if (pay.status === 'fulfilled') setPayments(pay.value || { payments: [], totalCollected: 0, totalVolume: 0, count: 0 });
        if (v.status === 'fulfilled') setVerifications(v.value?.verifications || []);
        if (rep.status === 'fulfilled') setReports(rep.value?.reports || []);
        if (rev.status === 'fulfilled') setReviews(rev.value?.reviews || []);
        if (svc.status === 'fulfilled') setServices(svc.value?.services || []);
        if (an.status === 'fulfilled') setAnalytics(an.value);
        if (act.status === 'fulfilled') setActivity(act.value?.activity || []);
        setLoadError([dash, u, p, b].every((r) => r.status === 'rejected'));
      })
      .catch(() => {
        /* partial state kept */
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const save = async (fn, message, notify, errorMsg) => {
    try {
      await fn();
      notify(message);
      reload();
    } catch (err) {
      notify(err.message || errorMsg || 'Action failed.', 'error');
    }
  };

  const renderOverview = (setActive) => {
    if (loading) {
      return (
        <div className="tc-panels">
          <Loader text="Loading admin dashboard..." />
        </div>
      );
    }

    const s = overview?.stats || {};
    const byRole = analytics?.usersByRole || {};
    const byStatus = analytics?.bookingsByStatus || {};
    const statusCounts = [
      { label: 'Pending', value: byStatus.Pending ?? 0, tone: 'amber', icon: 'fa-clock' },
      { label: 'Accepted', value: byStatus.Accepted ?? 0, tone: 'navy', icon: 'fa-circle-check' },
      { label: 'In Progress', value: byStatus['In Progress'] ?? 0, tone: 'blue', icon: 'fa-spinner' },
      { label: 'Completed', value: byStatus.Completed ?? 0, tone: 'green', icon: 'fa-check-double' },
      { label: 'Cancelled', value: byStatus.Cancelled ?? 0, tone: 'red', icon: 'fa-ban' },
    ];
    const recentRegistrations = users.slice(0, 6);
    const recentReviews = reviews.slice(0, 4);

    return (
      <div className="tc-panels">
        {loadError && (
          <div className="tc-banner tc-banner-error tc-banner-dismissible">
            <i className="fas fa-triangle-exclamation"></i>
            <div>
              <strong>Could not load all admin data.</strong>
              <span>Some sections may be incomplete. Check that the backend is reachable, then refresh.</span>
            </div>
            <button type="button" className="tc-link-btn" onClick={() => reload()}>Retry</button>
          </div>
        )}

        <section className="tc-banner tc-banner-admin">
          <div>
            <h2>Admin Console</h2>
            <p>Monitor the Trust Connect marketplace and keep everything running smoothly.</p>
          </div>
          <i className="fas fa-gauge-high"></i>
        </section>

        <div className="tc-stats">
          <DashboardCard icon="fa-users" label="Users" value={s.users ?? 0} tone="blue" onClick={() => setActive('users')} />
          <DashboardCard icon="fa-user" label="Clients" value={byRole.client ?? 0} tone="teal" onClick={() => setActive('users')} />
          <DashboardCard icon="fa-user-tie" label="Providers" value={s.providers ?? 0} tone="navy" onClick={() => setActive('providers')} />
          <DashboardCard icon="fa-calendar-check" label="Bookings" value={s.bookings ?? 0} tone="green" onClick={() => setActive('bookings')} />
          <DashboardCard icon="fa-sack-dollar" label="Revenue" value={formatMoney(s.revenue ?? 0)} tone="amber" onClick={() => setActive('payments')} />
        </div>
        <div className="tc-stats">
          <DashboardCard icon="fa-hourglass-half" label="Pending Verifications" value={s.pendingVerifications ?? 0} tone="navy" onClick={() => setActive('verifications')} />
          <DashboardCard icon="fa-flag" label="Open Reports" value={s.openReports ?? 0} tone="red" onClick={() => setActive('reports')} />
          {statusCounts.map((c) => (
            <DashboardCard key={c.label} icon={c.icon} label={`Bookings ${c.label}`} value={c.value} tone={c.tone} onClick={() => setActive('bookings')} />
          ))}
        </div>

        <div className="tc-grid-2">
          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-clock"></i> Recent Activity</h3>
              <button type="button" className="tc-link-btn" onClick={() => setActive('activity')}>View all</button>
            </div>
            {activity.length === 0 ? (
              <EmptyState icon="fa-clock-rotate-left" message="No activity yet." />
            ) : (
              <div className="tc-activity">
                {(overview?.recentActivity || activity.slice(0, 8)).map((a) => {
                  const ev = describeActivity(a);
                  return (
                    <div key={String(a._id)} className="tc-activity-item">
                      <div className="tc-activity-dot"></div>
                      <div>
                        <strong>{ev.text}</strong>
                        <span className="tc-activity-time">{ev.meta ? `${ev.meta} · ` : ''}{formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-calendar-check"></i> Recent Bookings</h3>
              <button type="button" className="tc-link-btn" onClick={() => setActive('bookings')}>View all</button>
            </div>
            {(overview?.recentBookings || []).length === 0 ? (
              <EmptyState icon="fa-calendar-xmark" message="No bookings yet." />
            ) : (
              <div className="tc-mini-list">
                {(overview?.recentBookings || []).map((b) => (
                  <div key={String(b._id)} className="tc-mini-item tc-mini-row">
                    <div>
                      <strong>{b.bookingId}</strong>
                      <span className="tc-muted">{b.customerName || 'Client'} → {b.providerName || 'Provider'} · {formatDate(b.createdAt)}</span>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="tc-grid-2">
          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-user-plus"></i> Recent Registrations</h3>
              <button type="button" className="tc-link-btn" onClick={() => setActive('users')}>View all</button>
            </div>
            {recentRegistrations.length === 0 ? (
              <EmptyState icon="fa-user-plus" message="No registrations yet." />
            ) : (
              <div className="tc-mini-list">
                {recentRegistrations.map((u) => (
                  <div key={String(u._id)} className="tc-mini-item tc-mini-row">
                    <div>
                      <strong>{u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</strong>
                      <span className="tc-muted">{u.email} · {u.userType} · {formatDate(u.createdAt)}</span>
                    </div>
                    <StatusBadge status={u.userType === 'provider' ? 'Accepted' : u.userType === 'admin' ? 'Completed' : 'Pending'} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="tc-card">
            <div className="tc-card-head">
              <h3><i className="fas fa-star"></i> Recent Reviews</h3>
              <button type="button" className="tc-link-btn" onClick={() => setActive('reviews')}>View all</button>
            </div>
            {recentReviews.length === 0 ? (
              <EmptyState icon="fa-star" message="No reviews yet." />
            ) : (
              <div className="tc-mini-list">
                {recentReviews.map((r) => (
                  <div key={String(r._id)} className="tc-mini-item tc-mini-col">
                    <div className="tc-mini-row">
                      <RatingStars rating={r.rating} />
                      <span className="tc-muted">{r.customerName || 'Client'} · {formatDate(r.createdAt)}</span>
                    </div>
                    <span className="tc-muted">{r.comment || 'No comment provided.'}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  const renderUsers = (notify) => (
    <UsersTable users={users} bookings={bookings} currentUserId={user.id} notify={notify} onDone={reload} />
  );

  const renderProviders = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-user-tie"></i> Service Providers</h3></div>
        {providers.length === 0 ? (
          <EmptyState icon="fa-user-tie" message="No providers yet." />
        ) : (
          <div className="tc-table-wrap">
            <table className="tc-table">
              <thead><tr><th>Business</th><th>Specialty</th><th>Location</th><th>Rating</th><th>Bookings</th><th>Clients</th><th>Verification</th><th>Availability</th><th>Actions</th></tr></thead>
              <tbody>
                {providers.map((p) => {
                  const pBookings = bookings.filter((b) => b.providerId && String(b.providerId) === String(p._id));
                  const activeJobs = pBookings.filter((b) => b.status === 'Accepted' || b.status === 'In Progress').length;
                  const doneJobs = pBookings.filter((b) => b.status === 'Completed').length;
                  const clientList = [...new Set(pBookings.map((b) => b.customerName).filter(Boolean))];
                  return (
                  <tr key={String(p._id)}>
                    <td><strong>{p.businessName}</strong></td>
                    <td>{p.specialty}</td>
                    <td>{p.location || '—'}</td>
                    <td><RatingStars rating={p.rating} small /></td>
                    <td>
                      <strong>{pBookings.length}</strong>
                      <span className="tc-muted tc-cell-sub">AC {activeJobs} · Done {doneJobs}</span>
                    </td>
                    <td>
                      <strong>{clientList.length}</strong>
                      {clientList.length > 0 && <span className="tc-muted tc-cell-sub">{clientList.slice(0, 2).join(', ')}{clientList.length > 2 ? '…' : ''}</span>}
                    </td>
                    <td>
                      <select
                        value={p.verificationStatus || 'Unverified'}
                        onChange={(e) => save(
                          () => api.adminUpdateProvider(p._id, { verificationStatus: e.target.value }),
                          'Verification status updated.',
                          notify
                        )}
                      >
                        <option>Unverified</option>
                        <option>Pending</option>
                        <option>Verified</option>
                        <option>Rejected</option>
                      </select>
                    </td>
                    <td>{p.isAvailable ? <StatusBadge status="Completed" /> : <StatusBadge status="Rejected" />}</td>
                    <td>
                      <button
                        type="button"
                        className="tc-link-btn"
                        onClick={() => save(
                          () => api.adminUpdateProvider(p._id, { isAvailable: !p.isAvailable }),
                          p.isAvailable ? 'Provider taken offline.' : 'Provider made available.',
                          notify
                        )}
                      >
                        {p.isAvailable ? 'Offline' : 'Online'}
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const renderBookings = (notify) => (
    <BookingsTable bookings={bookings} notify={notify} onDone={reload} />
  );

  const renderPayments = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-credit-card"></i> Payments</h3></div>
        <div className="tc-stats">
          <DashboardCard icon="fa-sack-dollar" label="Revenue Collected" value={formatMoney(payments.totalCollected)} tone="green" />
          <DashboardCard icon="fa-money-check-dollar" label="Transaction Volume" value={formatMoney(payments.totalVolume)} tone="blue" />
          <DashboardCard icon="fa-receipt" label="Transactions" value={payments.count} tone="navy" />
        </div>
        {payments.payments.length === 0 ? (
          <EmptyState icon="fa-receipt" message="No payments recorded yet." />
        ) : (
          <div className="tc-table-wrap">
            <table className="tc-table">
              <thead><tr><th>Payment</th><th>Booking</th><th>Date</th><th>Amount</th><th>Platform Fee</th><th>Status</th></tr></thead>
              <tbody>
                {payments.payments.map((p) => (
                  <tr key={String(p._id)}>
                    <td>{p.paymentId}</td>
                    <td>{p.bookingId}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td>{formatMoney(p.amount)}</td>
                    <td>{formatMoney(p.platformFee)}</td>
                    <td>{p.status === 'Paid' ? <StatusBadge status="Completed" /> : <StatusBadge status="Pending" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const renderVerifications = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-shield-halved"></i> Verification Requests</h3></div>
        {verifications.length === 0 ? (
          <EmptyState icon="fa-shield-halved" message="No verification requests yet." />
        ) : (
          <div className="tc-list">
            {verifications.map((v) => (
              <div key={String(v._id)} className="tc-list-item">
                <div className="tc-list-head">
                  <strong>{v.businessName || v.provider?.businessName || 'Provider'}</strong>
                  <StatusBadge status={v.status} />
                </div>
                <div className="tc-list-body">
                  <div className="tc-list-row"><span>Specialty</span><strong>{v.specialty}</strong></div>
                  <div className="tc-list-row"><span>ID Number</span><strong>{v.idNumber || '—'}</strong></div>
                  <div className="tc-list-row"><span>Phone confirmed</span><strong>{v.phoneConfirmed ? 'Yes' : 'No'}</strong></div>
                  {v.documents?.length > 0 && (
                    <div className="tc-list-row"><span>Documents</span><strong>{v.documents.map((d) => <a key={d} href={d} target="_blank" rel="noreferrer">{d}</a>).reduce((acc, el) => [acc, ', ', el])}</strong></div>
                  )}
                  <div className="tc-list-row"><span>Submitted</span><strong>{formatDate(v.createdAt)}</strong></div>
                </div>
                {v.status === 'Pending' && (
                  <div className="tc-card-actions">
                    <button type="button" className="btn btn-success btn-sm" onClick={() => save(() => api.adminSetVerification(v._id, 'Approved'), 'Verification approved.', notify)}>
                      <i className="fas fa-check"></i> Approve
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => save(() => api.adminSetVerification(v._id, 'Rejected'), 'Verification rejected.', notify)}>
                      <i className="fas fa-xmark"></i> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderReports = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-flag"></i> Reports & Disputes</h3></div>
        {reports.length === 0 ? (
          <EmptyState icon="fa-flag" message="No reports filed yet." />
        ) : (
          <div className="tc-list">
            {reports.map((r) => (
              <div key={String(r._id)} className="tc-list-item">
                <div className="tc-list-head">
                  <strong>{r.subject}</strong>
                  <StatusBadge status={r.status === 'Open' ? 'Pending' : 'Completed'} />
                </div>
                <div className="tc-list-body">
                  {r.details && <div className="tc-list-row"><span>Details</span><strong>{r.details}</strong></div>}
                  {r.bookingId && <div className="tc-list-row"><span>Booking</span><strong>{r.bookingId}</strong></div>}
                  <div className="tc-list-row"><span>Reported</span><strong>{formatDate(r.createdAt)}</strong></div>
                </div>
                {r.status === 'Open' && (
                  <div className="tc-card-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => save(() => api.adminSetReport(r._id, 'Resolved'), 'Report marked resolved.', notify)}>
                      <i className="fas fa-check"></i> Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderReviews = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-star"></i> Reviews</h3></div>
        {reviews.length === 0 ? (
          <EmptyState icon="fa-star" message="No reviews yet." />
        ) : (
          <div className="tc-list">
            {reviews.map((r) => (
              <div key={String(r._id)} className="tc-list-item">
                <div className="tc-list-head">
                  <RatingStars rating={r.rating} />
                  <span className="tc-muted">{formatDate(r.createdAt)}</span>
                </div>
                <p style={{ marginTop: '6px' }}>{r.comment || 'No comment provided.'}</p>
                <span className="tc-muted">by {r.customerName} · Booking {r.bookingId}</span>
                <div className="tc-card-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => save(() => api.adminDeleteReview(r._id), 'Review removed.', notify)}>
                    <i className="fas fa-trash-can"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderServices = (notify) => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-list-check"></i> Service Categories</h3></div>
        <AddServiceForm notify={notify} onDone={reload} />
        <div className="tc-table-wrap" style={{ marginTop: '14px' }}>
          <table className="tc-table">
            <thead><tr><th>Name</th><th>Icon</th><th>Description</th><th>Bookings</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {services.map((s) => {
                const serviceName = String(s.name || '').toLowerCase();
                const booked = bookings.filter((b) => String(b.service || '').toLowerCase() === serviceName).length;
                return (
                <tr key={String(s._id)}>
                  <td><strong>{s.name}</strong></td>
                  <td><i className={`fas ${s.icon}`}></i></td>
                  <td>{s.desc || '—'}</td>
                  <td>
                    <strong>{booked}</strong>
                    <span className="tc-muted tc-cell-sub">{booked > 0 ? (bookings.filter((b) => String(b.service || '').toLowerCase() === serviceName && (b.status === 'Accepted' || b.status === 'In Progress')).length) + ' active' : ''}</span>
                  </td>
                  <td>{s.active ? <StatusBadge status="Completed" /> : <StatusBadge status="Rejected" />}</td>
                  <td>
                    <button type="button" className="tc-link-btn" onClick={() => save(() => api.adminUpdateService(s._id, { active: !s.active }), 'Service toggled.', notify)}>
                      {s.active ? 'Hide' : 'Show'}
                    </button>
                    {' · '}
                    <button type="button" className="tc-link-btn tc-danger-link" onClick={() => save(() => api.adminDeleteService(s._id), 'Service removed.', notify)}>
                      Delete
                    </button>
                  </td>
                </tr>
                );
              })}
              {services.length === 0 && <tr><td colSpan="6">No services yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderAnalytics = () => {
    if (!analytics) return <Loader />;
    const maxStatus = Math.max(1, ...Object.values(analytics.bookingsByStatus || {}));
    const maxSpecialty = Math.max(1, ...(analytics.providersBySpecialty || []).map((x) => x.count || 0));
    return (
      <div className="tc-panels">
        <section className="tc-card">
          <div className="tc-card-head"><h3><i className="fas fa-chart-column"></i> Analytics</h3></div>
          <div className="tc-stats">
            <DashboardCard icon="fa-sack-dollar" label="Revenue" value={formatMoney(analytics.revenueTotal || 0)} tone="green" />
            <DashboardCard icon="fa-money-check-dollar" label="Volume" value={formatMoney(analytics.volumeTotal || 0)} tone="blue" />
            <DashboardCard icon="fa-users" label="By Role" value={(() => { const b = analytics.usersByRole || {}; return `${b.client || 0} client / ${b.provider || 0} provider`; })()} tone="navy" />
          </div>
          <div className="tc-grid-2">
            <div className="tc-card-inner">
              <h4>Bookings by Status</h4>
              {Object.keys(analytics.bookingsByStatus || {}).length === 0 ? (
                <EmptyState icon="fa-chart-column" message="No data yet." />
              ) : (
                <>
                  {Object.entries(analytics.bookingsByStatus || {}).map(([k, v]) => (
                    <div key={k} className="tc-bar-row">
                      <span className="tc-bar-label">{k}</span>
                      <div className="tc-bar-track"><div className="tc-bar-fill" style={{ width: `${Math.max(6, (v / maxStatus) * 100)}%` }}></div></div>
                      <span className="tc-bar-value">{v}</span>
                    </div>
                  ))}
                  <div className="tc-trend">
                    {(analytics.bookingsTrend || []).map((t) => (
                      <div key={t.month} className="tc-trend-item">
                        <strong>{t.count}</strong>
                        <span>{t.month}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="tc-card-inner">
              <h4>Providers by Specialty</h4>
              {(analytics.providersBySpecialty || []).length === 0 ? (
                <EmptyState icon="fa-user-tie" message="No providers yet." />
              ) : (
                (analytics.providersBySpecialty || []).map((p) => (
                  <div key={p.specialty} className="tc-bar-row">
                    <span className="tc-bar-label">{p.specialty}</span>
                    <div className="tc-bar-track"><div className="tc-bar-fill teal" style={{ width: `${Math.max(6, ((p.count || 0) / maxSpecialty) * 100)}%` }}></div></div>
                    <span className="tc-bar-value">{p.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="tc-panels">
      <section className="tc-card tc-profile">
        <h3><i className="fas fa-shield-halved"></i> Admin</h3>
        <p className="tc-muted">You have full administrative control over the Trust Connect marketplace.</p>
        <div className="tc-list-row"><span>Email</span><strong>{user?.email}</strong></div>
        <div className="tc-list-row"><span>Role</span><strong>Administrator</strong></div>
      </section>
    </div>
  );

  const renderActivity = () => (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-bolt"></i> Platform Activity</h3></div>
        {activity.length === 0 ? (
          <EmptyState icon="fa-clock-rotate-left" message="No activity recorded yet." />
        ) : (
          <div className="tc-activity">
            {activity.map((a) => {
              const ev = describeActivity(a);
              return (
                <div key={String(a._id)} className="tc-activity-item">
                  <div className="tc-activity-dot"></div>
                  <div>
                    <strong>{ev.text}</strong>
                    <span className="tc-activity-time">{ev.meta ? `${ev.meta} · ` : ''}{a.email ? `${a.email} · ` : ''}{formatDate(a.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <DashboardShell user={user} roleLabel="Admin" nav={NAV} onLogout={onLogout}>
      {({ active, setActive, notify }) => {
        switch (active) {
          case 'users':
            return renderUsers(notify);
          case 'providers':
            return renderProviders(notify);
          case 'bookings':
            return renderBookings(notify);
          case 'payments':
            return renderPayments(notify);
          case 'verifications':
            return renderVerifications(notify);
          case 'reports':
            return renderReports(notify);
          case 'reviews':
            return renderReviews(notify);
          case 'services':
            return renderServices(notify);
          case 'activity':
            return renderActivity();
          case 'analytics':
            return renderAnalytics();
          case 'settings':
            return renderSettings();
          default:
            return renderOverview(setActive);
        }
      }}
    </DashboardShell>
  );
}

function AddServiceForm({ notify, onDone }) {
  const [form, setForm] = useState({ name: '', icon: 'fa-tools', desc: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notify('Service name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.adminCreateService(form);
      notify('Service added.');
      setForm({ name: '', icon: 'fa-tools', desc: '' });
      onDone();
    } catch (err) {
      notify(err.message || 'Could not add service.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="tc-inline-form" onSubmit={submit}>
      <input type="text" placeholder="Service name (e.g. Plumbing)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <input type="text" placeholder="Icon (e.g. fa-tools)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
      <input type="text" placeholder="Short description (optional)" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
        <i className="fas fa-plus"></i> {saving ? 'Adding...' : 'Add Service'}
      </button>
    </form>
  );
}

const allStatuses = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'];

const ACTIVITY_VERBS = {
  Accepted: 'accepted',
  'In Progress': 'started',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

function describeActivity(a) {
  const d = a.details || {};
  const name = a.name || d.customerName || d.providerName || '';
  const present = (value) => (value && String(value).trim()) || '';
  switch (a.type) {
    case 'register':
      return { text: `${present(name) || 'Someone'} created an account.` };
    case 'login':
      return { text: `${present(name) || 'Someone'} signed in.` };
    case 'booking':
      return {
        text: `${present(d.customerName) || present(name) || 'A client'} booked ${present(d.service) || 'a service'}${present(d.providerName) ? ` from ${present(d.providerName)}` : ''}.`,
        meta: present(d.bookingId),
      };
    case 'booking_status': {
      const verb = ACTIVITY_VERBS[present(d.status)];
      if (verb) {
        if (String(a.userType || '').toLowerCase() === 'provider') {
          return {
            text: `${present(d.providerName) || present(name) || 'The provider'} ${verb} ${present(d.customerName) || 'the client'}'s booking${present(d.service) ? ` (${present(d.service)})` : ''}.`,
            meta: present(d.bookingId),
          };
        }
        if (String(a.userType || '').toLowerCase() === 'client') {
          return {
            text: `${present(d.customerName) || present(name) || 'The client'} ${verb} their booking${present(d.service) ? ` (${present(d.service)})` : ''}.`,
            meta: present(d.bookingId),
          };
        }
      }
      return {
        text: `Booking ${present(d.bookingId) || ''} was moved to "${present(d.status) || 'a new status'}".`.replace(/\s+/g, ' ').trim(),
      };
    }
    case 'verification_submitted':
      return { text: `${present(name) || 'A provider'} submitted a verification request.` };
    case 'verification_reviewed':
      return { text: `${present(name) || 'An admin'} updated a verification request.` };
    default:
      return { text: `${a.label || a.type || 'Activity'}${present(d.bookingId) ? ` · ${present(d.bookingId)}` : ''}.` };
  }
}

function UsersTable({ users, bookings, currentUserId, notify, onDone }) {
  const [roleFilter, setRoleFilter] = useState('');
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState(null);
  const shown = users.filter(
    (u) =>
      (!roleFilter || u.userType === roleFilter) &&
      (!q || `${u.fullName || u.firstName || ''} ${u.lastName || ''} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
  );

  const userBookings = (u) =>
    bookings.filter((b) => b.customerId && String(b.customerId) === String(u._id));

  const act = async (fn, message) => {
    try {
      await fn();
      notify(message);
      onDone();
    } catch (err) {
      notify(err.message || 'Action failed.', 'error');
    }
  };

  return (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-users"></i> Clients</h3></div>
        {viewing && (() => {
          const vb = userBookings(viewing);
          const vCounts = allStatuses.map((s) => ({ status: s, n: vb.filter((b) => b.status === s).length })).filter((x) => x.n > 0);
          const lastActivity = vb.length ? new Date(Math.max(...vb.map((b) => new Date(b.createdAt || b.updatedAt || 0).getTime()))) : null;
          return (
            <div className="tc-client-detail">
              <div className="tc-client-detail-head">
                <div>
                  <h4>{viewing.fullName || `${viewing.firstName || ''} ${viewing.lastName || ''}`.trim() || viewing.email}</h4>
                  <p className="tc-muted">{viewing.email}{viewing.phone ? ` · ${viewing.phone}` : ''} · Joined {formatDate(viewing.createdAt)} · {vb.length} booking{vb.length === 1 ? '' : 's'}</p>
                </div>
                <div className="tc-client-detail-actions">
                  {vCounts.map((c) => (
                    <span key={c.status} className="tc-client-count"><StatusBadge status={c.status} /><strong>{c.n}</strong></span>
                  ))}
                  <button type="button" className="tc-link-btn" onClick={() => setViewing(null)}>Close</button>
                </div>
              </div>
              {lastActivity && <p className="tc-muted">Last activity: {formatDate(lastActivity)}</p>}
              {vb.length === 0 ? (
                <EmptyState icon="fa-calendar-xmark" message="This client has no bookings yet." />
              ) : (
                <div className="tc-table-wrap">
                  <table className="tc-table">
                    <thead><tr><th>Booking</th><th>Service</th><th>Provider</th><th>When</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {vb.map((b) => (
                        <tr key={String(b._id)}>
                          <td>{b.bookingId}</td>
                          <td>{b.service}</td>
                          <td>{b.providerName || '—'}</td>
                          <td>{formatDate(b.date)} {b.time}</td>
                          <td>{formatMoney(b.amount)}</td>
                          <td><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
        <div className="tc-filters">
          <input type="text" placeholder="Search clients..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="client">Client</option>
            <option value="provider">Provider</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Bookings</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {shown.map((u) => {
                const ub = userBookings(u);
                return (
                <tr key={String(u._id)}>
                  <td><strong>{u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.userType}
                      disabled={String(u._id) === String(currentUserId)}
                      onChange={(e) => act(() => api.adminUpdateUser(u._id, { userType: e.target.value }), 'Role updated.')}
                    >
                      <option value="client">Client</option>
                      <option value="provider">Provider</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <strong>{ub.length}</strong>
                    {ub.length > 0 && <span className="tc-muted tc-cell-sub">{ub.filter((b) => b.status === 'Pending').length} pending</span>}
                  </td>
                  <td>{u.active === false ? <StatusBadge status="Rejected" /> : <StatusBadge status="Completed" />}</td>
                  <td>
                    <button type="button" className="tc-link-btn" onClick={() => setViewing(u)}>View</button>
                    {' · '}
                    {String(u._id) !== String(currentUserId) && (
                      <button
                        type="button"
                        className="tc-link-btn"
                        onClick={() => act(() => api.adminUpdateUser(u._id, { active: !(u.active === false) }), u.active === false ? 'User activated.' : 'User deactivated.')}
                      >
                        {u.active === false ? 'Activate' : 'Deactivate'}
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan="6">No clients found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BookingsTable({ bookings, notify, onDone }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');
  const shown = bookings.filter(
    (b) =>
      (!statusFilter || b.status === statusFilter) &&
      (!q || `${b.bookingId} ${b.providerName} ${b.customerName} ${b.service}`.toLowerCase().includes(q.toLowerCase()))
  );

  const act = async (fn, message) => {
    try {
      await fn();
      notify(message);
      onDone();
    } catch (err) {
      notify(err.message || 'Action failed.', 'error');
    }
  };

  return (
    <div className="tc-panels">
      <section className="tc-card">
        <div className="tc-card-head"><h3><i className="fas fa-calendar-check"></i> Bookings</h3></div>
        <div className="tc-filters">
          <input type="text" placeholder="Search by ID, provider, client..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {allStatuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {shown.length === 0 ? (
          <EmptyState icon="fa-calendar-xmark" message="No bookings found." />
        ) : (
          <div className="tc-table-wrap">
            <table className="tc-table">
              <thead><tr><th>Booking</th><th>Service</th><th>Client</th><th>Provider</th><th>When</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {shown.map((b) => (
                  <tr key={String(b._id)}>
                    <td>{b.bookingId}</td>
                    <td>{b.service}</td>
                    <td>{b.customerName}</td>
                    <td>{b.providerName}</td>
                    <td>{formatDate(b.date)} {b.time}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <select
                        value={b.status}
                        onChange={(e) => act(() => api.adminSetBookingStatus(b.bookingId, e.target.value), `Booking set to "${e.target.value}".`)}
                      >
                        {allStatuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}