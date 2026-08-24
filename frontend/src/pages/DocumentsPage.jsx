import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Layers, 
  Search, 
  RefreshCw,
  Eye,
  Calendar,
  HardDrive
} from 'lucide-react';
import { documentService } from '../services/documentService';
import UploadModal from '../components/UploadModal';
import ChunkModal from '../components/ChunkModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentService.getAll();
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChunks = async (docId) => {
    try {
      const res = await documentService.getById(docId);
      setSelectedDocDetails(res.data);
    } catch (err) {
      console.error('Failed to load document chunks:', err);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setActionLoading(true);
    try {
      await documentService.delete(docToDelete.id);
      setDocToDelete(null);
      loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredDocs = documents.filter((d) =>
    d.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      {/* Header with Responsive Stacking */}
      <div className="dashboard-header">
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h1 className="page-title">Document Management</h1>
          <p className="page-subtitle">
            Upload, inspect chunks, and manage indexed PDF files.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
          <UploadCloud size={17} /> Upload New PDF
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.88rem' }}
          />
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadDocuments} title="Refresh list">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading documents...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={40} style={{ margin: '0 auto 0.5rem auto', color: '#cbd5e1' }} />
          <p style={{ fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
            {searchTerm ? 'No documents matched your search.' : 'No documents uploaded yet.'}
          </p>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Upload PDF documents to begin answering questions with verified source citations.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsUploadOpen(true)}>
            <UploadCloud size={15} /> Upload PDF Now
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* 📱 MOBILE VIEW: Rich Touch-Friendly Cards with Big DELETE */}
          {/* ========================================================= */}
          <div className="mobile-only-cards" style={{ display: 'none', flexDirection: 'column', gap: '0.9rem' }}>
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="card" style={{ padding: '1.1rem', position: 'relative' }}>
                {/* Header: Name + Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      background: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', lineHeight: '1.3', wordBreak: 'break-word' }}>
                        {doc.fileName}
                      </div>
                    </div>
                  </div>

                  <span className={`badge badge-${doc.status.toLowerCase()}`}>
                    {doc.status}
                  </span>
                </div>

                {/* Metadata Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#475569' }}>
                  <span style={{ background: 'rgba(241, 245, 249, 0.9)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    📄 {doc.pageCount} Pages
                  </span>
                  <span style={{ background: 'rgba(241, 245, 249, 0.9)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    🧩 {doc.chunkCount} Chunks
                  </span>
                  <span style={{ background: 'rgba(241, 245, 249, 0.9)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    💾 {formatFileSize(doc.fileSize)}
                  </span>
                  <span style={{ background: 'rgba(241, 245, 249, 0.9)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    📅 {formatDate(doc.uploadedAt)}
                  </span>
                </div>

                {/* Action Buttons (Large, Touch-Friendly) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(226, 232, 240, 0.7)' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleViewChunks(doc.id)}
                    style={{ padding: '0.6rem', fontSize: '0.84rem' }}
                  >
                    <Eye size={15} /> View Chunks
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDocToDelete(doc)}
                    style={{ padding: '0.6rem', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    <Trash2 size={15} /> Delete File
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ========================================================= */}
          {/* 💻 DESKTOP VIEW: Clean Structured Data Table              */}
          {/* ========================================================= */}
          <div className="desktop-only-table card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>File Size</th>
                    <th>Pages</th>
                    <th>Chunks</th>
                    <th>Status</th>
                    <th>Uploaded Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <FileText size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{doc.fileName}</span>
                        </div>
                      </td>
                      <td>{formatFileSize(doc.fileSize)}</td>
                      <td>{doc.pageCount}</td>
                      <td>{doc.chunkCount}</td>
                      <td>
                        <span className={`badge badge-${doc.status.toLowerCase()}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(doc.uploadedAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewChunks(doc.id)}
                            title="View Extracted Chunks"
                          >
                            <Eye size={14} /> Chunks
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDocToDelete(doc)}
                            title="Delete Document"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => loadDocuments()}
      />

      {/* Inspect Chunks Modal */}
      <ChunkModal
        isOpen={!!selectedDocDetails}
        onClose={() => setSelectedDocDetails(null)}
        documentDetails={selectedDocDetails}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.fileName}"? This will permanently remove its database record, extracted text chunks, embeddings, and server file.`}
        onConfirm={handleDeleteDocument}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
}
