import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function SourceCard({ source }) {
  const [expanded, setExpanded] = useState(false);
  const scorePercent = Math.round((source.relevanceScore || 0) * 100);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--glass-border)',
      borderRadius: '10px',
      padding: '0.75rem 0.9rem',
      fontSize: '0.85rem',
      boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.03)',
      transition: 'var(--transition-smooth)'
    }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileText size={14} />
          </div>
          <span style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {source.documentName}
          </span>
          <span style={{
            background: 'rgba(226, 232, 240, 0.7)',
            color: '#475569',
            padding: '0.12rem 0.45rem',
            borderRadius: '4px',
            fontSize: '0.74rem',
            fontWeight: 600,
            flexShrink: 0
          }}>
            Page {source.pageNumber}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-score" style={{ fontSize: '0.73rem', padding: '0.2rem 0.55rem' }}>
            {scorePercent}% match
          </span>
          <button style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && source.chunkSnippet && (
        <div style={{
          marginTop: '0.65rem',
          paddingTop: '0.65rem',
          borderTop: '1px dashed rgba(203, 213, 225, 0.8)',
          color: '#334155',
          fontSize: '0.82rem',
          lineHeight: '1.55',
          fontStyle: 'italic',
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '0.65rem',
          borderRadius: '6px',
          animation: 'slideUpFade 0.2s ease'
        }}>
          "{source.chunkSnippet}"
        </div>
      )}
    </div>
  );
}
