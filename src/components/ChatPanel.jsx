'use client';

import { useState, useRef, useEffect } from 'react';
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

// --- Fallback Tavily search (server-side only) ---
// The route.js handler will be called when no local answer is found.

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m the Trust Connect AI assistant. I can help you find verified professionals, explain our booking process, answer questions about the platform, or assist with general topics. What would you like to talk about?' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-ai-chat', handler);
    return () => window.removeEventListener('open-ai-chat', handler);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [sending, setSending] = useState(false);

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

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="chat-float-btn"
        aria-label="Open AI chat"
      >
        <i className="fa-solid fa-robot" />
        <span>AI Search</span>
      </button>

      {/* Chat panel */}
      <div className={`chat-panel ${open ? 'chat-open' : ''}`} role="dialog" aria-modal="true" aria-label="AI Search Chat">
        <div className="chat-header">
          <div className="chat-brand">
            <div className="chat-icon"><i className="fa-solid fa-robot" /></div>
            <div>
              <h3>Trust Connect AI</h3>
              <p>Web search with sources</p>
            </div>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat"><i className="fa-solid fa-xmark" /></button>
        </div>

        <div className="chat-body">
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
            aria-label="Chat input"
          />
          <button onClick={handleSend} disabled={sending || !input.trim()} aria-label="Send" className="chat-send-btn">
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
      </div>
    </>
  );
}
