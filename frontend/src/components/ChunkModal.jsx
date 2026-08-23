import React from 'react';
import { Layers, X } from 'lucide-react';

export default function ChunkModal({ isOpen, onClose, documentDetails }) {
  if (!isOpen || !documentDetails) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--accent-primary)" />
            <h3 className="modal-title">Extracted Document Chunks ({documentDetails.chunks?.length || 0})</h3>
          </div>
          <button onClick={onClose} style={{ color: '#64748b' }}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Document: <strong>{documentDetails.fileName}</strong> | Total Pages: <strong>{documentDetails.pageCount}</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {documentDetails.chunks && documentDetails.chunks.map((chunk) => (
              <div
                key={chunk.id || chunk.chunkIndex}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#64748b', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Chunk #{chunk.chunkIndex + 1}</span>
                  <span style={{ background: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    Page {chunk.pageNumber}
                  </span>
                </div>
                <div style={{ color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {chunk.chunkText}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
