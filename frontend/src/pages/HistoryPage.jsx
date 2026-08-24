import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, Trash2, ArrowRight, RefreshCw, Search, PlusCircle } from 'lucide-react';
import { chatService } from '../services/chatService';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await chatService.getSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await chatService.deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
      loadHistory();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Chat History</h1>
          <p className="page-subtitle">
            Review, resume, and manage your previous document inquiry conversations.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '300px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/chat')} style={{ flex: 1 }}>
            <PlusCircle size={15} /> New Chat
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadHistory} title="Refresh list">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={17} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '16px', color: '#0f172a' }}
        />
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading chat history...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.25rem' }}>
          <MessageSquare size={40} style={{ margin: '0 auto 0.5rem auto', color: '#cbd5e1' }} />
          <p style={{ fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>No conversations found</p>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            {searchTerm ? 'Try a different search keyword.' : 'Start a new conversation in the RAG Assistant.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/chat')}>
            Start Chatting
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredSessions.map((session) => (
            <div key={session.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MessageSquare size={16} />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                    📅 {formatDate(session.updatedAt)}
                  </span>
                </div>

                <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', lineHeight: '1.35', wordBreak: 'break-word', marginBottom: '0.5rem' }}>
                  {session.title}
                </h3>
              </div>

              {/* Action Buttons (Large Touch-Friendly) */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(226, 232, 240, 0.7)', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.55rem' }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setSessionToDelete(session)}
                  style={{ padding: '0.55rem', fontSize: '0.82rem', fontWeight: 700 }}
                  title="Delete Conversation"
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/chat/${session.id}`)}
                  style={{ padding: '0.55rem', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  Resume <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${sessionToDelete?.title}"? All chat messages and citations will be permanently removed.`}
        onConfirm={handleDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
}
