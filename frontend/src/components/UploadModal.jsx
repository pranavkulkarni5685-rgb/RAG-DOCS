import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { documentService } from '../services/documentService';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      selectFile(e.target.files[0]);
    }
  };

  const selectFile = (selected) => {
    setError(null);
    setSuccessInfo(null);
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF documents are allowed (.pdf)');
      setFile(null);
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit.');
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const response = await documentService.upload(file, (p) => setProgress(p));
      setProgress(100);
      setSuccessInfo(response.data);
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (err) {
      setError(err.message || 'Failed to process and upload PDF document.');
    } finally {
      setUploading(false);
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setError(null);
    setSuccessInfo(null);
    setProgress(0);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} color="var(--accent-primary)" />
            <h3 className="modal-title">Upload PDF Document</h3>
          </div>
          <button onClick={resetAndClose} style={{ color: '#64748b' }}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {successInfo ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                PDF Processed Successfully!
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                The document has been parsed into chunks and indexed for RAG vector search.
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Document:</span>
                  <span style={{ fontWeight: 600 }}>{successInfo.fileName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Total Pages:</span>
                  <span style={{ fontWeight: 600 }}>{successInfo.pageCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Generated Chunks:</span>
                  <span style={{ fontWeight: 600 }}>{successInfo.chunkCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span className="badge badge-completed">{successInfo.status}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Drag and drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed ' + (isDragging ? 'var(--accent-primary)' : '#cbd5e1'),
                  background: isDragging ? 'var(--accent-light)' : '#f8fafc',
                  borderRadius: '10px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                />
                <UploadCloud size={40} color={isDragging ? 'var(--accent-primary)' : '#94a3b8'} style={{ margin: '0 auto 0.75rem auto' }} />
                <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                  Click to browse or drag and drop PDF here
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Supports single & multi-page PDF documents up to 50MB
                </p>
              </div>

              {/* Selected File Details */}
              {file && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <FileText size={20} color="var(--accent-primary)" />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{file.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  {!uploading && (
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ color: '#94a3b8' }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Progress bar */}
              {uploading && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Loader2 size={14} className="spin-icon" /> Extracting text, chunking & generating embeddings...
                    </span>
                    <span style={{ fontWeight: 600 }}>{progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: progress + '%',
                      height: '100%',
                      background: 'var(--accent-primary)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--danger-light)',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{error}</div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {successInfo ? (
            <button className="btn btn-primary" onClick={resetAndClose}>
              Done
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={resetAndClose} disabled={uploading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="spin-icon" /> Processing PDF...
                  </>
                ) : (
                  'Upload & Process'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
