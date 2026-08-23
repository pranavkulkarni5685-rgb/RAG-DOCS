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
  Search,
  MessageSquare
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
    navigate('/chat');
  };

  const handleSelectSession = (id) => {
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
        message: '⚠️ ' + (err.message || 'Failed to generate answer. Please ensure Gemini API key is configured in Settings.'),
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
    "Summarize the key technical skills and projects.",
    "What are the main concepts covered in the documents?",
    "Explain the core definitions and problem-solving steps.",
    "List all certifications and educational qualifications."
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', width: '100%', overflow: 'hidden' }}>
      
      {/* Frosted Chat Sidebar */}
      <div style={{
        width: '290px',
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* New Chat & Filter Header */}
        <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button className="btn btn-primary" onClick={handleNewChat} style={{ width: '100%', fontSize: '0.88rem' }}>
            <PlusCircle size={17} /> New Conversation
          </button>

          <button
            className="btn btn-glass btn-sm"
            onClick={() => setShowDocFilter(!showDocFilter)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: selectedDocIds.length > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={14} /> Filter Docs ({selectedDocIds.length === 0 ? 'All' : selectedDocIds.length})
            </span>
          </button>
        </div>

        {/* Filter Selection Panel */}
        {showDocFilter && (
          <div style={{
            padding: '0.85rem',
            background: 'rgba(248, 250, 252, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--glass-border)',
            maxHeight: '180px',
            overflowY: 'auto',
            fontSize: '0.82rem',
            animation: 'slideUpFade 0.2s ease'
          }}>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
              Search in specific PDFs:
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
                      padding: '0.4rem 0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(239, 246, 255, 0.9)' : 'transparent',
                      color: isSelected ? 'var(--accent-primary)' : '#1e293b',
                      marginBottom: '0.25rem',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div style={{
                      width: '15px',
                      height: '15px',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : '#cbd5e1'}`,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--accent-primary)' : '#ffffff',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={11} />}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.65rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.5rem 0.5rem 0.35rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Previous Conversations
          </div>
          {sessions.length === 0 ? (
            <div style={{ padding: '1.2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
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
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : '#1e293b',
                    fontWeight: isActive ? 700 : 400,
                    fontSize: '0.875rem',
                    marginBottom: '0.3rem',
                    boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none',
                    border: isActive ? '1px solid rgba(191, 219, 254, 0.8)' : '1px solid transparent',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '0.5rem' }}>
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(s.id);
                    }}
                    style={{ color: '#94a3b8', padding: '3px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Glassmorphic Chat Stream Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        {/* Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          
          {messages.length === 0 ? (
            <div style={{
              maxWidth: '680px',
              margin: 'auto',
              textAlign: 'center',
              padding: '2.5rem 1.5rem',
              animation: 'slideUpFade 0.35s ease'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 8px 24px var(--accent-glow)'
              }}>
                <Bot size={32} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.6rem' }}>
                Ask anything about your documents
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: '1.65', marginBottom: '2.2rem' }}>
                RAG retrieves verified excerpts from your uploaded PDFs and generates grounded answers using Google Gemini AI.
              </p>

              {/* Sample Prompt Chips with Glassmorphic Hover */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', textAlign: 'left' }}>
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="glass-card"
                    style={{
                      padding: '1rem 1.2rem',
                      fontSize: '0.88rem',
                      color: '#1e293b',
                      lineHeight: '1.45',
                      cursor: 'pointer',
                      borderRadius: '12px'
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
                    gap: '1rem',
                    maxWidth: '880px',
                    width: '100%',
                    margin: '0 auto',
                    alignSelf: 'center',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: isUser ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'var(--accent-gradient)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isUser ? '0 4px 12px rgba(15, 23, 42, 0.2)' : '0 4px 14px var(--accent-glow)'
                  }}>
                    {isUser ? <User size={19} /> : <Bot size={19} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      background: isUser ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      color: isUser ? '#ffffff' : '#0f172a',
                      padding: '1.15rem 1.4rem',
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      boxShadow: isUser ? '0 6px 20px rgba(15, 23, 42, 0.15)' : 'var(--glass-shadow)',
                      border: isUser ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--glass-border)',
                      fontSize: '0.94rem',
                      lineHeight: '1.65'
                    }}>
                      <MarkdownRenderer content={msg.message} />
                    </div>

                    {/* Source Citations */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '0.85rem' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={13} color="var(--accent-primary)" /> Verified Sources & Citations:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
              gap: '1rem',
              maxWidth: '880px',
              width: '100%',
              margin: '0 auto',
              alignSelf: 'center',
              animation: 'slideUpFade 0.25s ease'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px var(--accent-glow)'
              }}>
                <Bot size={19} />
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                padding: '0.95rem 1.4rem',
                borderRadius: '4px 16px 16px 16px',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.88rem',
                color: '#475569'
              }}>
                <Loader2 size={18} className="spin-icon" color="var(--accent-primary)" />
                <span>Retrieving context & generating answer with Gemini AI...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Glassmorphic Input Bar */}
        <div style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'center',
          position: 'sticky',
          bottom: 0,
          background: 'linear-gradient(to top, rgba(240, 244, 253, 0.95) 0%, rgba(240, 244, 253, 0) 100%)',
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            maxWidth: '880px',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '0.5rem 0.6rem 0.5rem 1.25rem',
            boxShadow: '0 10px 30px rgba(31, 38, 135, 0.12)'
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents... (Press Enter to send)"
              disabled={loading}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                resize: 'none',
                maxHeight: '130px',
                padding: '0.4rem 0',
                color: '#0f172a',
                fontSize: '0.94rem',
                lineHeight: '1.45'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputQuestion.trim() || loading}
              className="btn btn-primary"
              style={{
                borderRadius: '10px',
                padding: '0.6rem 1rem',
                marginLeft: '0.65rem'
              }}
            >
              {loading ? <Loader2 size={17} className="spin-icon" /> : <Send size={17} />}
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
