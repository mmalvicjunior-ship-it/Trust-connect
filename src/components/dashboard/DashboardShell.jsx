'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Toast from '@/components/Toast';

export default function DashboardShell({ user, roleLabel, nav, onLogout, children }) {
  const [active, setActive] = useState(nav[0]?.id || 'overview');
  const [notis, setNotis] = useState([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const loadNotis = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotis(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      setNotis([]);
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    loadNotis();
  }, [loadNotis]);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotis((list) => list.map((n) => (String(n._id) === String(id) ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotis((list) => list.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const go = (id) => {
    setActive(id);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    onLogout?.();
    router.push('/');
  };

  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account';
  const themeKey = String(roleLabel || 'dashboard').toLowerCase().replace(/[^a-z0-9]+/g, '');

  return (
    <div className={`tc-shell tc-theme-${themeKey}`}>
      <aside className={`tc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link href="/" className="nav-logo tc-logo" style={{ color: '#fff' }}>
          <img src="/images/logo.png" alt="Trust Connect" className="mark" width="34" height="34" />
          Trust Connect
        </Link>
        <div className="tc-role-badge"><i className="fas fa-shield-halved"></i> {roleLabel} Dashboard</div>
        <nav className="tc-nav">
          {nav.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`tc-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="tc-sidebar-foot">
          <button type="button" className="tc-nav-item" onClick={handleLogout}>
            <i className="fas fa-right-from-bracket"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="tc-backdrop" onClick={() => setSidebarOpen(false)}></div>}

      <div className="tc-main">
        <header className="tc-topbar">
          <button type="button" className="tc-menu-btn" aria-label="Menu" onClick={() => setSidebarOpen(true)}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="tc-topbar-title">
            <div className="tc-welcome">Welcome back, {user?.firstName || fullName}</div>
            <div className="tc-welcome-sub">Here&apos;s what&apos;s happening with your account.</div>
          </div>
          <div className="tc-topbar-actions">
            <div className="tc-bell-wrap">
              <button type="button" className="tc-bell" aria-label="Notifications" onClick={() => setBellOpen((v) => !v)}>
                <i className="far fa-bell"></i>
                {unread > 0 && <span className="tc-bell-dot">{unread}</span>}
              </button>
              {bellOpen && (
                <div className="tc-notis">
                  <div className="tc-notis-head">
                    <strong>Notifications</strong>
                    <button type="button" onClick={markAllRead}>Mark all read</button>
                  </div>
                  <div className="tc-notis-list">
                    {notis.length === 0 ? (
                      <div className="tc-notis-empty">You&apos;re all caught up.</div>
                    ) : (
                      notis.slice(0, 6).map((n) => (
                        <button type="button" key={String(n._id)} className={`tc-noti ${n.read ? '' : 'unread'}`} onClick={() => markRead(n._id)}>
                          <div className="tc-noti-title">{n.title}</div>
                          <div className="tc-noti-msg">{n.message}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link href="/account" className="tc-user-chip">
              <span className="tc-avatar">{fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
              <span className="tc-user-name">{fullName}</span>
            </Link>
          </div>
        </header>

        <main className="tc-content">
          {children({ active, setActive, notify })}
        </main>

        <footer className="tc-footer">
          © {new Date().getFullYear()} Trust Connect · {roleLabel} workspace
        </footer>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}