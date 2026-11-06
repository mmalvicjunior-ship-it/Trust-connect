'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// --- Safe greeting detection ---
// Single-word greetings must be followed by a space or string end.
// Multi-word greetings must be at the very start.
// This prevents "hire" and "history" from being mistaken for greetings.
const GREETINGS = [
  { pattern: 'hello',   multi: false },
  { pattern: 'hi',      multi: false },
  { pattern: 'hie',     multi: false },
  { pattern: 'hey',     multi: false },
  { pattern: 'heyy',    multi: false },
  { pattern: 'greetings', multi: false },
  { pattern: 'howdy',   multi: false },
  { pattern: 'good morning',   multi: true },
  { pattern: 'good afternoon', multi: true },
  { pattern: 'good evening',   multi: true },
];
const isGreeting = (text) => {
  const lower = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return /^(hello|hi|hie|hey|heyy|greetings|howdy|good morning|good afternoon|good evening|nice to meet you|what's up|how's it going|how are you(?: doing)?(?: today)?)[.!?]*$/i.test(lower);
};

// --- Chat slot context ---
// A single ChatPanel instance lives in the root layout. Pages can register a
// DOM node with `useChatHeroSlot()` to have the same live chat rendered there
// (e.g. the homepage hero) instead of the floating launcher.
const ChatContext = createContext(null);

export function useChatHeroSlot() {
  const ctx = useContext(ChatContext);
  const register = ctx?.registerSlot;
  return useCallback((node) => {
    if (register) register(node);
  }, [register]);
}

export default function ChatPanel({ children }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState(null);
  const [homeSlotMissing, setHomeSlotMissing] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m the Trust Connect AI assistant. I can help you find verified professionals, explain our booking process, answer questions about the platform, or assist with general topics. What would you like to talk about?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const registerSlot = useCallback((node) => setSlot(node), []);
  const chatContextValue = useMemo(() => ({ registerSlot }), [registerSlot]);

  // Safety net: if a page ever fails to register its hero slot, fall back to
  // the floating launcher after a short delay so chat is never unreachable.
  useEffect(() => {
    if (!isHome || slot) {
      setHomeSlotMissing(false);
      return;
    }
    const timer = setTimeout(() => setHomeSlotMissing(true), 1200);
    return () => clearTimeout(timer);
  }, [isHome, slot]);

  const showFloating = !slot && (!isHome || homeSlotMissing);

  useEffect(() => {
    const handler = () => {
      if (slot) {
        slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setOpen(true);
      }
    };
    window.addEventListener('open-ai-chat', handler);
    return () => window.removeEventListener('open-ai-chat', handler);
  }, [slot]);

  // When the inline slot appears, dismiss any floating panel.
  useEffect(() => {
    if (slot) setOpen(false);
  }, [slot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const respondLocally = (text) => {
    console.log('[CHAT_PROV] Provider: local');
    setMessages((m) => [...m, { role: 'assistant', text, provider: 'local' }]);
    setInput('');
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    const userTextLower = userText.toLowerCase();

    // Immediately show user's message
    setMessages((m) => [...m, { role: 'user', text: userText }]);

    // 1️⃣ Greeting → natural response, no Tavily
    if (isGreeting(userText)) {
      respondLocally("Hi! I'm doing well, thanks for asking. How are you doing today?");
      return;
    }

    // Keep only brief courtesy and farewell replies local; substantive follow-ups go to AI.
    const isConversational = /^(thank you|thanks|thank you very much|goodbye|bye|see you)[.!?]*$/i.test(userTextLower);
    if (isConversational) {
      respondLocally("You're welcome. Let me know if you have another question.");
      return;
    }

    // Send conversation history to the AI backend.
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          messages: messages.filter((message) => ['user', 'assistant'].includes(message.role)).slice(-20),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Chat request failed (${res.status}).`);
      if (typeof data.answer !== 'string' || !data.answer.trim() || !data.provider) {
        throw new Error('The chat service returned an invalid response. Please try again shortly.');
      }
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.answer.trim(),
          sources: data.sources || [],
          provider: data.provider,
        },
      ]);
      setInput('');
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'error',
          text: 'The AI assistant is temporarily unavailable. Please try again later.',
          provider: 'error',
        },
      ]);
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const panel = (
    <>
      <div className="chat-header">
        <div className="chat-brand">
          <div className="chat-icon"><i className="fa-solid fa-robot" /></div>
          <div>
            <h3>Trust Connect AI</h3>
            <p>Services, bookings &amp; general questions</p>
          </div>
        </div>
        {slot ? (
          <span className="chat-live"><i className="fa-solid fa-circle" aria-hidden="true" /> Live</span>
        ) : (
          <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat"><i className="fa-solid fa-xmark" /></button>
        )}
      </div>

      <div className="chat-body" role="log" aria-live="polite" aria-label="Chat conversation">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-${msg.role}`}>
            <div className="chat-bubble">
              <div className="chat-text">
                {msg.text}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="chat-citations">
                    <strong>Sources:</strong>
                    <ul>
                      {msg.sources.map((s, idx) => (
                        <li key={idx}>
                          <Link href={s.url} target="_blank" rel="noopener noreferrer" className="chat-source-link">
                            {s.title || s.url}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="chat-msg chat-assistant">
            <div className="chat-bubble">
              <div className="chat-loader"><span /><span /><span /></div>
              <div className="chat-sub">Thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
            // Shift+Enter inserts new line implicitly via default behavior
          }}
          placeholder="Ask anything — from services to general questions..."
          aria-label="Ask the Trust Connect AI assistant a question"
        />
        <button onClick={handleSend} disabled={sending || !input.trim()} aria-label="Send" className="chat-send-btn">
          <i className="fa-solid fa-paper-plane" />
        </button>
      </div>
    </>
  );

  return (
    <ChatContext.Provider value={chatContextValue}>
      {children}

      {/* Floating launcher — only when the hero slot is not registered */}
      {showFloating && (
        <button
          onClick={() => setOpen(true)}
          className="chat-float-btn"
          aria-label="Open AI chat"
        >
          <i className="fa-solid fa-robot" />
          <span>AI Search</span>
        </button>
      )}

      {/* Floating panel */}
      {showFloating && (
        <div className={`chat-panel ${open ? 'chat-open' : ''}`} role="dialog" aria-modal="true" aria-label="AI Search Chat">
          {panel}
        </div>
      )}

      {/* Inline hero panel — same instance, same state, rendered into the page slot */}
      {slot && createPortal(
        <div className="chat-hero-panel" role="region" aria-label="Trust Connect AI assistant">
          {panel}
        </div>,
        slot
      )}
    </ChatContext.Provider>
  );
}
