import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Layers, 
  MessageSquare, 
  UploadCloud, 
  ArrowRight,
  Sparkles,
  Bot,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import UploadModal from '../components/UploadModal';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Indexed Documents', value: stats?.totalDocuments || 0, icon: FileText, color: '#2563eb', gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
    { title: 'Vector Chunks', value: stats?.totalChunks || 0, icon: Layers, color: '#059669', gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' },
    { title: 'Chat Sessions', value: stats?.totalChatSessions || 0, icon: MessageSquare, color: '#7c3aed', gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' },
    { title: 'Grounded Answers', value: stats?.totalQuestionsAnswered || 0, icon: Sparkles, color: '#d97706', gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
  ];

  return (
    <div className="page-wrapper">
      {/* Top Banner Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">System Dashboard</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Real-time analytics of indexed documents, vector embeddings, and RAG chatbot activity.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
          <UploadCloud size={17} /> Upload PDF Document
        </button>
      </div>

      {/* Stats Grid with Glassmorphic Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.4rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', padding: '1.4rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: card.gradient,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 12px ${card.color}22`
              }}>
                <Icon size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                  {loading ? '...' : card.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Architecture & Recent Documents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.75rem' }}>
        
        {/* Left: Glass RAG Architecture */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={18} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>RAG Pipeline Architecture</h3>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '1.25rem' }}>
            When you ask a question, the system retrieves dense vector embeddings of relevant PDF text chunks and provides grounded context to Google Gemini AI.
          </p>

          <div style={{
            background: 'rgba(248, 250, 252, 0.75)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '1.2rem',
            marginBottom: '1.5rem',
            fontSize: '0.86rem'
          }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--accent-primary)" /> Production Safeguards:
            </div>
            <ol style={{ marginLeft: '1.2rem', color: '#475569', lineHeight: '1.75' }}>
              <li><strong>Apache PDFBox:</strong> Text extraction with magic-byte validation.</li>
              <li><strong>Smart Chunking:</strong> 600-char sliding window with 120-char overlap.</li>
              <li><strong>Cosine Search:</strong> Hybrid vector similarity with Top-K ranking.</li>
              <li><strong>Gemini 3.5 Flash:</strong> Grounded anti-hallucination answers + citations.</li>
            </ol>
          </div>

          <Link to="/chat" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            Start Chatting with Documents <ArrowRight size={17} />
          </Link>
        </div>

        {/* Right: Recent Documents */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Documents</h3>
            </div>
            <Link to="/documents" style={{ fontSize: '0.86rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading documents...</div>
          ) : stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.fileName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {doc.pageCount} pages · {doc.chunkCount} chunks
                      </div>
                    </div>
                  </div>

                  <span className={`badge badge-${doc.status.toLowerCase()}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'var(--text-muted)',
              border: '1px dashed rgba(203, 213, 225, 0.8)',
              borderRadius: '12px'
            }}>
              <UploadCloud size={40} style={{ margin: '0 auto 0.6rem auto', color: '#94a3b8' }} />
              <p style={{ fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>No documents uploaded yet</p>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>Upload your first PDF to begin RAG query answering.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsUploadOpen(true)}>
                Upload Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => loadStats()}
      />
    </div>
  );
}
