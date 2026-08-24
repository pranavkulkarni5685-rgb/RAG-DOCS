import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  PlusCircle, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Filter, 
  Check,
  MessageSquare,
  History,
  X,
  BookOpen,
  HelpCircle,
  Award
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { documentService } from '../services/documentService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import SourceCard from '../components/SourceCard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ChatPage() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(routeSessionId ? parseInt(routeSessionId) : null);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [showDocFilter, setShowDocFilter] = useState(false);
  const [showMobileSessions, setShowMobileSessions] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadSessions();
    loadDocuments();
  }, []);

  useEffect(() => {
    if (routeSessionId) {
      loadSession(parseInt(routeSessionId));
    } else {
      setCurrentSessionId(null);
      setMessages([]);
    }
  }, [routeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const res = await chatService.getSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await documentService.getAll();
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadSession = async (id) => {
    try {
      const res = await chatService.getSessionById(id);
      setCurrentSessionId(id);
      setMessages(res.data?.messages || []);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputQuestion('');
    setShowMobileSessions(false);
    navigate('/chat');
  };

  const handleSelectSession = (id) => {
    setShowMobileSessions(false);
    navigate(`/chat/${id}`);
  };

  const handleSend = async (questionToSend) => {
    const query = (questionToSend || inputQuestion).trim();
    if (!query || loading) return;

    setInputQuestion('');
    setLoading(true);

    const tempUserMsg = {
      id: Date.now(),
      role: 'USER',
      message: query,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await chatService.sendMessage(
        currentSessionId,
        query,
        selectedDocIds.length > 0 ? selectedDocIds : null
      );

      const data = response.data;

      if (!currentSessionId && data.sessionId) {
        setCurrentSessionId(data.sessionId);
        navigate(`/chat/${data.sessionId}`, { replace: true });
        loadSessions();
      }

      const aiMsg = {
        id: data.messageId || Date.now() + 1,
        role: 'ASSISTANT',
        message: data.answer,
        sources: data.sources || [],
        createdAt: data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'ASSISTANT',
        message: '⚠️ ' + (err.message || 'Failed to generate answer. Please check Gemini connection in Settings.'),
        sources: [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await chatService.deleteSession(sessionToDelete);
      setSessionToDelete(null);
      loadSessions();
      if (currentSessionId === sessionToDelete) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const samplePrompts = [
    { text: "Summarize key technical skills, experience, and projects.", icon: BookOpen, label: "Summary" },
    { text: "What are the core concepts and problem-solving steps explained?", icon: HelpCircle, label: "Key Concepts" },
    { text: "List educational qualifications, university degrees, and CGPA.", icon: Award, label: "Education" },
  ];

  return (
    <div className="rag-chat-container">
      
      {/* Mobile Backdrop for Sessions Drawer */}
      {showMobileSessions && (
        <div className="sidebar-backdrop" onClick={() => setShowMobileSessions(false)} />
      )}

      {/* ========================================================= */}
      {/* 📁 SESSIONS SIDEBAR (Desktop column / Mobile slide drawer) */}
      {/* ========================================================= */}
      <aside className={`rag-sidebar ${showMobileSessions ? 'rag-sidebar-active' : ''}`}>
        {/* Top Controls */}
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleNewChat} style={{ flex: 1, fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}>
              <PlusCircle size={15} /> New Conversation
            </button>
            
            <button
              className="rag-mobile-close"
              onClick={() => setShowMobileSessions(false)}
              style={{
                background: 'rgba(241, 245, 249, 0.8)',
                border: '1px solid var(--glass-border-subtle)',
                borderRadius: '8px',
                padding: '0.45rem',
                color: '#475569',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <button
            className="btn btn-glass btn-sm"
            onClick={() => setShowDocFilter(!showDocFilter)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              padding: '0.4rem 0.75rem',
              color: selectedDocIds.length > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={13} /> Filter: {selectedDocIds.length === 0 ? 'All Documents' : `${selectedDocIds.length} Selected`}
            </span>
          </button>
        </div>

        {/* Filter Selection Panel */}
        {showDocFilter && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(248, 250, 252, 0.95)',
            borderBottom: '1px solid var(--glass-border)',
            maxHeight: '160px',
            overflowY: 'auto',
            fontSize: '0.8rem',
            animation: 'slideUpFade 0.2s ease'
          }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
              Filter by PDF:
            </div>
            {documents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No documents uploaded</div>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocSelection(doc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(239, 246, 255, 0.95)' : 'transparent',
                      color: isSelected ? 'var(--accent-primary)' : '#1e293b',
                      marginBottom: '0.2rem'
                    }}
                  >
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : '#cbd5e1'}`,
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--accent-primary)' : '#ffffff',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={10} />}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSelected ? 600 : 400 }}>
                      {doc.fileName}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Sessions list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.4rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Previous Chats ({sessions.length})
          </div>
          {sessions.length === 0 ? (
            <div style={{ padding: '1.2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No chat history yet
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === currentSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : '#1e293b',
                    fontWeight: isActive ? 700 : 400,
                    fontSize: '0.84rem',
                    marginBottom: '0.25rem',
                    boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.1)' : 'none',
                    border: isActive ? '1px solid rgba(191, 219, 254, 0.8)' : '1px solid transparent'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '0.4rem' }}>
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(s.id);
                    }}
                    style={{ color: '#94a3b8', padding: '3px', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 💬 CHAT STREAM & INPUT CONTAINER (100% full width mobile) */}
      {/* ========================================================= */}
      <main className="rag-main-chat">
        
        {/* Mobile Action Bar (Always visible on mobile) */}
        <div className="rag-mobile-topbar">
          <button
            onClick={() => setShowMobileSessions(true)}
            className="btn btn-glass btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <History size={14} /> Chats ({sessions.length})
          </button>

          <button
            onClick={() => setShowDocFilter(!showDocFilter)}
            className="btn btn-glass btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', color: selectedDocIds.length > 0 ? '#2563eb' : 'inherit' }}
          >
            <Filter size={13} /> {selectedDocIds.length === 0 ? 'All PDFs' : `${selectedDocIds.length} PDFs`}
          </button>
          
          <button
            onClick={handleNewChat}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <PlusCircle size={13} /> New
          </button>
        </div>

        {/* Scrollable Messages Stream */}
        <div className="rag-messages-scroll">
          
          {messages.length === 0 ? (
            <div className="rag-empty-state">
              <div className="rag-empty-icon">
                <Bot size={28} />
              </div>
              <h2 className="rag-empty-title">
                RAG Document Assistant
              </h2>
              <p className="rag-empty-subtitle">
                Ask questions to retrieve verified answers and exact page citations from your uploaded PDFs.
              </p>

              {/* Sample Prompt Chips */}
              <div className="rag-prompts-grid">
                {samplePrompts.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(p.text)}
                      className="glass-card rag-prompt-chip"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                        <Icon size={14} /> {p.label}
                      </div>
                      <div style={{ color: '#334155', fontSize: '0.82rem', lineHeight: '1.35' }}>
                        "{p.text}"
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`rag-msg-row ${isUser ? 'rag-msg-user' : 'rag-msg-ai'}`}
                >
                  {/* Avatar */}
                  <div className={`rag-msg-avatar ${isUser ? 'rag-avatar-user' : 'rag-avatar-ai'}`}>
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={`rag-msg-bubble ${isUser ? 'rag-bubble-user' : 'rag-bubble-ai'}`}>
                      <MarkdownRenderer content={msg.message} />
                    </div>

                    {/* Source Citations */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '0.65rem' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Sparkles size={12} color="var(--accent-primary)" /> Verified Sources ({msg.sources.length}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {msg.sources.map((source, sIdx) => (
                            <SourceCard key={sIdx} source={source} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {loading && (
            <div className="rag-msg-row rag-msg-ai">
              <div className="rag-msg-avatar rag-avatar-ai">
                <Bot size={16} />
              </div>
              <div className="rag-msg-bubble rag-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569', fontSize: '0.84rem' }}>
                <Loader2 size={15} className="spin-icon" color="var(--accent-primary)" />
                <span>Searching PDF chunks & generating answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================= */}
        {/* ⌨️ STICKY BOTTOM INPUT BAR (Never overlaps messages)      */}
        {/* ========================================================= */}
        <div className="rag-bottom-input-wrap">
          <div className="rag-input-box">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents..."
              disabled={loading}
              className="rag-textarea"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputQuestion.trim() || loading}
              className="btn btn-primary rag-send-btn"
              title="Send question"
            >
              {loading ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
            </button>
          </div>
        </div>

      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this chat session? All messages will be permanently removed."
        onConfirm={handleDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
}
