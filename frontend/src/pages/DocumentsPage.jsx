import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Layers, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Eye
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDocs = documents.filter((d) =>
    d.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Document Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Upload, inspect text chunks, and manage indexed PDF documents.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
          <UploadCloud size={16} /> Upload New PDF
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.875rem' }}
          />
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadDocuments} title="Refresh list">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Documents Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ margin: '0 auto 0.5rem auto', color: '#cbd5e1' }} />
            <p style={{ fontWeight: 500, color: '#475569' }}>
              {searchTerm ? 'No documents matched your search.' : 'No documents uploaded yet.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>File Size</th>
                <th>Pages</th>
                <th>Chunks</th>
                <th>Status</th>
                <th>Uploaded At</th>
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
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
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
