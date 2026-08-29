// src/components/messaging/ChatBox.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import Button from '../common/Button';

export default function ChatBox({
  propertyId,
  withUserId,
  peerName = 'User',
  onClose,
  title = 'Direct Conversation'
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const loadThread = useCallback(async () => {
    if (!propertyId || !withUserId) return;
    try {
      const res = await api.get('/messages/thread', {
        params: { propertyId, withUserId }
      });
      setMessages(res.data || []);
    } catch (e) {
      console.error('Failed to load message thread', e);
    } finally {
      setLoading(false);
    }
  }, [propertyId, withUserId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending) return;

    const content = text.trim();
    setText('');
    setSending(true);

    try {
      const res = await api.post('/messages', {
        propertyId,
        receiverId: withUserId,
        content
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const content = (
    <div className="chat-container">
      {/* Header */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            {peerName ? peerName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{peerName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active conversation</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="chat-messages">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading conversation…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <p style={{ fontWeight: 600 }}>No messages yet</p>
            <p style={{ fontSize: '0.85rem' }}>Send a message to start discussing this rental listing.</p>
          </div>
        ) : (
          messages.map((m) => {
            const senderId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
            const isMe = String(senderId) === String(user?._id);

            return (
              <div
                key={m._id}
                className={`chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}`}
              >
                <div>{m.content}</div>
                <div className="chat-bubble-time">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="chat-input-bar">
        <input
          className="form-input"
          placeholder="Type your message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button type="submit" variant="primary" disabled={!text.trim() || sending} loading={sending}>
          Send
        </Button>
      </form>
    </div>
  );

  if (onClose) {
    return (
      <div className="rn-modal-overlay" onClick={onClose}>
        <div
          className="rn-modal"
          style={{ maxWidth: '520px', padding: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
}
