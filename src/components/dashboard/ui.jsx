'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export function useToast() {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);
  return { toast, notify };
}

export function formatMoney(n) {
  const num = Number(n);
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_STYLES = {
  Pending: { bg: '#FFF7ED', color: '#C2410C', icon: 'fa-clock' },
  Accepted: { bg: '#EFF6FF', color: '#1D4ED8', icon: 'fa-check-circle' },
  Confirmed: { bg: '#ECFDF5', color: '#047857', icon: 'fa-check-double' },
  'In Progress': { bg: '#EEF2FF', color: '#4338CA', icon: 'fa-spinner' },
  Completed: { bg: '#ECFDF5', color: '#047857', icon: 'fa-circle-check' },
  Rejected: { bg: '#FEF2F2', color: '#B91C1C', icon: 'fa-times-circle' },
  Cancelled: { bg: '#F1F5F9', color: '#475569', icon: 'fa-ban' },
};

function normalizeStatus(status) {
  const value = String(status ?? '').trim();
  if (!value) return 'Pending';

  const normalized = value.toLowerCase();
  const aliases = {
    verified: 'Completed',
    approved: 'Completed',
    active: 'Completed',
    available: 'Completed',
    resolved: 'Completed',
    open: 'Pending',
    unverified: 'Rejected',
    offline: 'Rejected',
    inactive: 'Rejected',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    rejected: 'Rejected',
    pending: 'Pending',
    accepted: 'Accepted',
    confirmed: 'Confirmed',
    'in progress': 'In Progress',
    completed: 'Completed',
  };

  return aliases[normalized] || value;
}

export function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const st = STATUS_STYLES[normalized] || STATUS_STYLES.Pending;
  return (
    <span className="tc-badge" style={{ background: st.bg, color: st.color }}>
      {normalized}
    </span>
  );
}

const CARD_TONES = {
  blue: { bg: '#EFF6FF', color: '#1D4ED8' },
  green: { bg: '#ECFDF5', color: '#047857' },
  amber: { bg: '#FFF7ED', color: '#C2410C' },
  red: { bg: '#FEF2F2', color: '#B91C1C' },
  slate: { bg: '#F1F5F9', color: '#475569' },
  navy: { bg: '#E0E7FF', color: '#3730A3' },
  teal: { bg: '#E6FCF9', color: '#0F766E' },
};

export function DashboardCard({ icon, label, value, tone = 'blue', sub, onClick }) {
  const t = CARD_TONES[tone] || CARD_TONES.blue;
  return (
    <button type="button" className={`tc-stat ${onClick ? 'clickable' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer', textAlign: 'left' } : undefined}>
      <div className="tc-stat-icon" style={{ background: t.bg, color: t.color }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="tc-stat-val" title={String(value ?? '')}>{value ?? 0}</div>
      <div className="tc-stat-lab">{label}</div>
      {sub && <div className="tc-stat-sub">{sub}</div>}
    </button>
  );
}

export function RatingStars({ rating }) {
  const r = Number(rating) || 0;
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="tc-stars" title={`${r.toFixed(1)} / 5`}>
      {[...Array(full)].map((_, i) => <i key={`f${i}`} className="fas fa-star"></i>)}
      {half && <i className="fas fa-star-half-alt"></i>}
      {[...Array(Math.max(empty, 0))].map((_, i) => <i key={`e${i}`} className="far fa-star"></i>)}
      <span className="tc-stars-val">{r.toFixed(1)}</span>
    </span>
  );
}

export function Avatar({ name }) {
  const initials = String(name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return <div className="tc-avatar">{initials || '?'}</div>;
}

export function EmptyState({ icon = 'fa-inbox', message, action }) {
  return (
    <div className="tc-empty">
      <div className="tc-empty-icon"><i className={`fas ${icon}`}></i></div>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function DataTable({ headers, children }) {
  return (
    <div className="tc-table-wrap">
      <table className="tc-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Loader({ text = 'Loading...' }) {
  return (
    <div className="tc-loader">
      <div className="tc-loader-spinner"></div>
      <p>{text}</p>
    </div>
  );
}

export function groupConversationMessages(messages, meId) {
  return messages.map((m) => ({
    ...m,
    mine: String(m.senderId) === String(meId),
  }));
}

export function MessagesPanel({ meId, focus, notify }) {
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations);
      let chatId = focus?.userId ? String(focus.userId) : null;
      if (!chatId && data.conversations.length > 0) {
        chatId = String(data.conversations[0].userId);
      }
      setActiveUserId(chatId);
    } catch {
      notify('Could not load conversations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [focus, notify]);

  useEffect(() => {
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeUserId) return;
    api.getConversation(activeUserId)
      .then((data) => setMessages(groupConversationMessages(data.messages, meId)))
      .catch(() => notify('Could not load messages.', 'error'));
  }, [activeUserId, meId, notify]);

  const openChat = (userId) => setActiveUserId(String(userId));

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !activeUserId) return;
    setSending(true);
    try {
      await api.sendMessage({ receiverId: activeUserId, body, bookingId: focus?.bookingId || null });
      setBody('');
      const data = await api.getConversation(activeUserId);
      setMessages(groupConversationMessages(data.messages, meId));
    } catch (err) {
      notify(err.message || 'Could not send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const active = conversations.find((c) => String(c.userId) === String(activeUserId));

  return (
    <div className="tc-msg">
      <div className="tc-msg-list">
        <div className="tc-panel-section-title">Conversations</div>
        {loading ? (
          <Loader text="Loading conversations..." />
        ) : conversations.length === 0 ? (
          <EmptyState icon="fa-comment-dots" message="No conversations yet." />
        ) : (
          conversations.map((c) => (
            <button
              type="button"
              key={String(c.userId)}
              className={`tc-msg-item ${String(c.userId) === String(activeUserId) ? 'active' : ''}`}
              onClick={() => openChat(c.userId)}
            >
              <Avatar name={c.name} />
              <div className="tc-msg-item-body">
                <div className="tc-msg-item-head">
                  <strong>{c.name}</strong>
                  <span>{c.lastDate ? formatDate(c.lastDate) : ''}</span>
                </div>
                <span className="tc-msg-item-preview">{c.lastMessage}</span>
              </div>
              {c.unread > 0 && <span className="tc-unread">{c.unread}</span>}
            </button>
          ))
        )}
      </div>
      <div className="tc-msg-chat">
        {active ? (
          <>
            <div className="tc-chat-head">
              <Avatar name={active.name} />
              <div>
                <strong>{active.name}</strong>
                <span>{active.userType === 'provider' ? 'Service Provider' : 'Client'}</span>
              </div>
            </div>
            <div className="tc-chat-body">
              {messages.length === 0 ? (
                <EmptyState icon="fa-comment-slash" message="Say hello to start the conversation." />
              ) : (
                messages.map((m) => (
                  <div key={String(m._id)} className={`tc-bubble ${m.mine ? 'mine' : ''}`}>
                    {m.body}
                    <span className="tc-bubble-time">{formatDate(m.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
            <form className="tc-chat-input" onSubmit={send}>
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message..."
                aria-label="Message"
              />
              <button className="btn btn-primary" disabled={sending || !body.trim()}>
                <i className="fas fa-paper-plane"></i> Send
              </button>
            </form>
          </>
        ) : (
          <div className="tc-chat-empty">
            <i className="fas fa-comments"></i>
            <p>Select a conversation to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}