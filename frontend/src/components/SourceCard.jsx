import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function SourceCard({ source }) {
  const [expanded, setExpanded] = useState(false);
  const scorePercent = Math.round((source.relevanceScore || 0) * 100);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid var(--glass-border)',
      borderRadius: '10px',
      padding: '0.65rem 0.85rem',
      fontSize: '0.84rem',
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
          userSelect: 'none',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Document Name & Page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '160px' }}>
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
            <FileText size={13} />
          </div>
          <span style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.84rem' }}>
            {source.documentName}
          </span>
          <span style={{
            background: 'rgba(226, 232, 240, 0.85)',
            color: '#475569',
            padding: '0.12rem 0.4rem',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            flexShrink: 0
          }}>
            P.{source.pageNumber}
          </span>
        </div>

        {/* Match Score & Expand Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <span className="badge badge-score" style={{ fontSize: '0.72rem', padding: '0.18rem 0.5rem' }}>
            {scorePercent}% match
          </span>
          <div style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>
      </div>

      {expanded && source.chunkSnippet && (
        <div style={{
          marginTop: '0.55rem',
          paddingTop: '0.55rem',
          borderTop: '1px dashed rgba(203, 213, 225, 0.8)',
          color: '#334155',
          fontSize: '0.8rem',
          lineHeight: '1.5',
          fontStyle: 'italic',
          background: 'rgba(248, 250, 252, 0.85)',
          padding: '0.6rem 0.75rem',
          borderRadius: '6px',
          animation: 'slideUpFade 0.2s ease',
          wordBreak: 'break-word'
        }}>
          "{source.chunkSnippet}"
        </div>
      )}
    </div>
  );
}
