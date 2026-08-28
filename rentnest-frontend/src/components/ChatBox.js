// src/components/ChatBox.js
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

export default function ChatBox({ propertyId, withUserId, onClose, title = 'Messages' }) {
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scroller = useRef(null);

  const load = async () => {
    try {
      const res = await api.get('/messages/thread', { params: { propertyId, withUserId } });
      setThread(res.data || []);
      setTimeout(() => {
        if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
      }, 0);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, withUserId]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/messages', {
        propertyId, receiverId: withUserId, content: text.trim(),
      });
      setText('');
      setThread(t => [...t, res.data]);
      setTimeout(() => {
        if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
      }, 0);
    } catch (e) { console.error(e); alert('Failed to send message.'); }
    finally { setSending(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div ref={scroller} className="modal-body" style={{maxHeight:280, overflow:'auto'}}>
          {thread.length === 0 && <div className="card-meta">No messages yet.</div>}
          {thread.map(m => (
            <div key={m._id} style={{margin:'6px 0'}}>
              <b>{m.sender === withUserId ? 'Them' : 'Me'}:</b> {m.content}
              <div className="card-meta">{new Date(m.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="modal-foot" style={{display:'flex', gap:8}}>
          <input className="input" placeholder="Type a message" value={text} onChange={(e)=>setText(e.target.value)}/>
          <button className="btn" disabled={sending} onClick={send}>{sending?'Sending…':'Send'}</button>
        </div>
      </div>
    </div>
  );
}
