import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, confirmText = 'Delete', onConfirm, onCancel, isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isDanger && <AlertTriangle size={20} color="#ef4444" />}
            <h3 className="modal-title">{title}</h3>
          </div>
          <button onClick={onCancel} style={{ color: '#64748b' }}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={isDanger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
