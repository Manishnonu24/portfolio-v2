'use client';

import { useState, useRef, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm Manish's AI Assistant. Ask me anything — about Manish's skills, experience at DIFM & HashedBit, projects (MentorAI, AutoLink, Ninagashi), or education!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(scrollToBottom, 150);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, open, loading]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, user: 'web-visitor' }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠ Could not reach the server. Make sure it is running on port 8001.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        id="chatbot-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #c8a96e 0%, #e8c97e 100%)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(200,169,110,0.45)',
          transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s',
          transform: open ? 'scale(0.9) rotate(45deg)' : 'scale(1) rotate(0deg)',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 48px rgba(200,169,110,0.65)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(200,169,110,0.45)'}
      >
        {open
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
      </button>

      {/* ── Chat panel ── */}
      <div
        id="chatbot-panel"
        style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 9998,
          width: 420, maxWidth: 'calc(100vw - 32px)',
          height: 560, maxHeight: 'calc(100vh - 120px)',
          background: '#0f0f0f',
          border: '1px solid rgba(200,169,110,0.25)',
          borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(200,169,110,0.12)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(200,169,110,0.14) 0%, rgba(200,169,110,0.04) 100%)',
          borderBottom: '1px solid rgba(200,169,110,0.15)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c8a96e, #e8c97e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(200,169,110,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <div style={{ color: '#e8c97e', fontWeight: 600, fontSize: 14.5, letterSpacing: '0.02em' }}>Manish AI Assistant</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
              {loading ? '⟳ Thinking…' : '● Online'}
            </div>
          </div>
        </div>

        {/* Messages list with custom smooth scroll */}
        <div
          id="chatbot-messages-container"
          ref={messagesContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 16px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              width: '100%',
            }}>
              <div style={{
                maxWidth: msg.role === 'user' ? '82%' : '94%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #c8a96e, #e8c97e)'
                  : 'rgba(255,255,255,0.06)',
                color: msg.role === 'user' ? '#0a0a0a' : 'rgba(255,255,255,0.92)',
                fontSize: 13.5,
                lineHeight: 1.55,
                fontWeight: msg.role === 'user' ? 500 : 400,
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                wordBreak: 'break-word',
                overflowX: 'auto',
              }}>
                {formatMessageContent(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '10px 16px', borderRadius: '18px 18px 18px 4px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', gap: 6, alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: 'rgba(200,169,110,0.8)', marginRight: 4 }}>Thinking</span>
                {[0, 1, 2].map(d => (
                  <div key={d} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#c8a96e',
                    animation: `chatDot 1.2s ease-in-out ${d * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex', gap: 8, alignItems: 'flex-end',
        }}>
          {/* Text input */}
          <textarea
            ref={inputRef}
            id="chatbot-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about Manish's skills, projects, experience…"
            rows={1}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '10px 14px',
              color: '#fff', fontSize: 13.5, lineHeight: 1.5,
              fontFamily: 'inherit',
              maxHeight: 96, overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />

          {/* Send button */}
          <button
            id="chatbot-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #c8a96e, #e8c97e)'
                : 'rgba(255,255,255,0.06)',
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              color: input.trim() && !loading ? '#0a0a0a' : 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s, transform 0.1s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Styles for scrollbars and animations */}
      <style>{`
        #chatbot-messages-container::-webkit-scrollbar {
          width: 6px;
        }
        #chatbot-messages-container::-webkit-scrollbar-track {
          background: transparent;
        }
        #chatbot-messages-container::-webkit-scrollbar-thumb {
          background: rgba(200, 169, 110, 0.25);
          border-radius: 4px;
        }
        #chatbot-messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 169, 110, 0.5);
        }
        .chat-table-wrapper::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .chat-table-wrapper::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .chat-table-wrapper::-webkit-scrollbar-thumb {
          background: rgba(200, 169, 110, 0.4);
          border-radius: 4px;
        }
        .chat-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 169, 110, 0.75);
        }
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// Helper to parse markdown tables & linebreaks nicely
function formatMessageContent(text) {
  if (!text) return null;

  if (text.includes('|') && text.includes('---')) {
    const lines = text.split('\n');
    const elements = [];
    let tableLines = [];
    let inTable = false;

    lines.forEach((line, index) => {
      if (line.trim().startsWith('|')) {
        inTable = true;
        tableLines.push(line);
      } else {
        if (inTable) {
          elements.push(renderTable(tableLines, `table-${index}`));
          tableLines = [];
          inTable = false;
        }
        if (line.trim()) {
          elements.push(
            <div key={`text-${index}`} style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
              {line}
            </div>
          );
        }
      }
    });

    if (inTable && tableLines.length > 0) {
      elements.push(renderTable(tableLines, 'table-end'));
    }

    return elements;
  }

  return <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>;
}

function renderTable(tableLines, key) {
  const rows = tableLines
    .filter(line => !line.includes(':---') && !line.includes('---'))
    .map(line => line.split('|').map(cell => cell.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1));

  if (rows.length === 0) return null;

  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div
      key={key}
      className="chat-table-wrapper"
      style={{
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: 280,
        margin: '10px 0',
        maxWidth: '100%',
        borderRadius: 10,
        border: '1px solid rgba(200,169,110,0.3)',
        background: '#141414',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
          <tr style={{ background: '#1f1b14', color: '#e8c97e' }}>
            {header.map((col, idx) => (
              <th key={idx} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(200,169,110,0.3)', whiteSpace: 'nowrap', fontWeight: 600 }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rIdx) => (
            <tr key={rIdx} style={{ borderBottom: rIdx < body.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} style={{ padding: '7px 12px', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.88)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
