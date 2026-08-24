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
  X
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
        message: '⚠️ ' + (err.message || 'Failed to generate answer. Please ensure Gemini API key is configured.'),
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
    "Summarize the key technical skills and academic projects.",
    "What are the main concepts covered in the documents?",
    "Explain the core definitions and problem-solving steps.",
    "List all certifications and educational qualifications."
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 62px)', width: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {/* Mobile Chat Sidebar Backdrop */}
      {showMobileSessions && (
        <div className="sidebar-backdrop" onClick={() => setShowMobileSessions(false)} />
      )}

      {/* Chat Sessions Sidebar (Drawer on mobile, inline on desktop) */}
      <div className={`chat-sidebar ${showMobileSessions ? 'chat-sidebar-open' : ''}`} style={{
        width: '280px',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Header Button */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleNewChat} style={{ flex: 1, fontSize: '0.86rem' }}>
              <PlusCircle size={16} /> New Chat
            </button>
            <button
              className="mobile-only-btn"
              onClick={() => setShowMobileSessions(false)}
              style={{ padding: '0.4rem', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}
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
              color: selectedDocIds.length > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={13} /> Filter Docs ({selectedDocIds.length === 0 ? 'All' : selectedDocIds.length})
            </span>
          </button>
        </div>

        {/* Filter Selection Panel */}
        {showDocFilter && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(248, 250, 252, 0.9)',
            borderBottom: '1px solid var(--glass-border)',
            maxHeight: '160px',
            overflowY: 'auto',
            fontSize: '0.8rem'
          }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
              Query specific documents:
            </div>
            {documents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No documents available</div>
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
                      background: isSelected ? 'rgba(239, 246, 255, 0.9)' : 'transparent',
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.4rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Previous Chats
          </div>
          {sessions.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No previous chats
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
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Stream Area (100% full width on mobile) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', minWidth: 0 }}>
        
        {/* Mobile Sub-Header: Chat Controls */}
        <div className="mobile-chat-controls" style={{
          padding: '0.6rem 1rem',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setShowMobileSessions(true)}
            className="btn btn-glass btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <History size={14} /> Chats ({sessions.length})
          </button>
          
          <button
            onClick={handleNewChat}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <PlusCircle size={14} /> New
          </button>
        </div>

        {/* Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1rem 6rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          
          {messages.length === 0 ? (
            <div style={{
              maxWidth: '650px',
              margin: 'auto',
              textAlign: 'center',
              padding: '1.5rem 0.5rem',
              animation: 'slideUpFade 0.3s ease'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.1rem auto',
                boxShadow: '0 6px 20px var(--accent-glow)'
              }}>
                <Bot size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.4rem', lineHeight: '1.25' }}>
                Ask anything about your documents
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.55', marginBottom: '1.75rem' }}>
                RAG retrieves verified excerpts from your uploaded PDFs and generates grounded answers using Google Gemini AI.
              </p>

              {/* Sample Prompt Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.7rem', textAlign: 'left' }}>
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="glass-card"
                    style={{
                      padding: '0.85rem 1rem',
                      fontSize: '0.84rem',
                      color: '#1e293b',
                      lineHeight: '1.4',
                      cursor: 'pointer',
                      borderRadius: '10px'
                    }}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'USER';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    maxWidth: '850px',
                    width: '100%',
                    margin: '0 auto',
                    alignSelf: 'center',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    animation: 'slideUpFade 0.25s ease'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: isUser ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'var(--accent-gradient)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isUser ? '0 3px 10px rgba(15, 23, 42, 0.2)' : '0 3px 12px var(--accent-glow)'
                  }}>
                    {isUser ? <User size={17} /> : <Bot size={17} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      background: isUser ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'rgba(255, 255, 255, 0.88)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      color: isUser ? '#ffffff' : '#0f172a',
                      padding: '0.95rem 1.15rem',
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      boxShadow: isUser ? '0 4px 14px rgba(15, 23, 42, 0.15)' : 'var(--glass-shadow)',
                      border: isUser ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--glass-border)',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      wordBreak: 'break-word'
                    }}>
                      <MarkdownRenderer content={msg.message} />
                    </div>

                    {/* Source Citations */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={12} color="var(--accent-primary)" /> Verified Sources ({msg.sources.length}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              maxWidth: '850px',
              width: '100%',
              margin: '0 auto',
              alignSelf: 'center',
              animation: 'slideUpFade 0.2s ease'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 3px 12px var(--accent-glow)'
              }}>
                <Bot size={17} />
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(16px)',
                padding: '0.85rem 1.15rem',
                borderRadius: '4px 16px 16px 16px',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.84rem',
                color: '#475569'
              }}>
                <Loader2 size={16} className="spin-icon" color="var(--accent-primary)" />
                <span>Searching chunks & generating answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Bar (Optimized for Mobile Keyboards) */}
        <div className="chat-input-container" style={{
          padding: '0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom, 0px)) 1rem',
          display: 'flex',
          justifyContent: 'center',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(240, 244, 253, 0.98) 70%, rgba(240, 244, 253, 0) 100%)',
          backdropFilter: 'blur(8px)',
          zIndex: 30
        }}>
          <div style={{
            maxWidth: '850px',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            padding: '0.4rem 0.5rem 0.4rem 1rem',
            boxShadow: '0 8px 26px rgba(31, 38, 135, 0.12)'
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents..."
              disabled={loading}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                resize: 'none',
                maxHeight: '110px',
                padding: '0.45rem 0',
                color: '#0f172a',
                fontSize: '16px', // 16px prevents iOS Safari auto-zoom
                lineHeight: '1.4'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputQuestion.trim() || loading}
              className="btn btn-primary"
              style={{
                borderRadius: '10px',
                padding: '0.55rem 0.85rem',
                marginLeft: '0.5rem',
                minWidth: '40px',
                minHeight: '40px'
              }}
              title="Send question"
            >
              {loading ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
            </button>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this chat session? This will remove all associated messages."
        onConfirm={handleDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
}
