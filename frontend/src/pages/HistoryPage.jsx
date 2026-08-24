import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, Trash2, ArrowRight, RefreshCw, Search } from 'lucide-react';
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Chat History</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Review and resume previous document inquiry conversations.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadHistory}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search conversations by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.875rem' }}
        />
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <MessageSquare size={40} style={{ margin: '0 auto 0.5rem auto', color: '#cbd5e1' }} />
          <p style={{ fontWeight: 500, color: '#475569', marginBottom: '0.25rem' }}>No conversations found</p>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Start a new conversation in the RAG Chat section.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredSessions.map((session) => (
            <div key={session.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MessageSquare size={16} />
                  </div>
                  <button
                    onClick={() => setSessionToDelete(session)}
                    style={{ color: '#94a3b8', padding: '4px' }}
                    title="Delete Conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  {session.title}
                </h3>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  {formatDate(session.updatedAt)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setSessionToDelete(session)}
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/chat/${session.id}`)}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Resume <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${sessionToDelete?.title}"? All chat messages will be permanently removed.`}
        onConfirm={handleDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
}
