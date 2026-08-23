import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Sliders, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Loader2,
  HardDrive
} from 'lucide-react';
import { settingsService } from '../services/settingsService';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [topK, setTopK] = useState(4);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.35);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getSettings();
      const s = res.data;
      setSettings(s);
      setTopK(s.topK || 4);
      setSimilarityThreshold(s.similarityThreshold || 0.35);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        topK: parseInt(topK),
        similarityThreshold: parseFloat(similarityThreshold),
      };
      if (apiKeyInput.trim()) {
        payload.apiKey = apiKeyInput.trim();
      }

      const res = await settingsService.updateSettings(payload);
      setSettings(res.data);
      setApiKeyInput('');
      setFeedback({ type: 'success', message: 'Settings updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Application Settings</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Manage Gemini AI API credentials and RAG vector search parameters.
        </p>
      </div>

      {feedback && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          background: feedback.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
          color: feedback.type === 'success' ? '#065f46' : 'var(--danger)',
          border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Gemini API Key Configuration */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Key size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Google Gemini API Configuration</h3>
          </div>

          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Status: <strong>{settings?.geminiConfigured ? 'Active / Configured' : 'Not Set'}</strong> 
            {settings?.maskedApiKey && <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>({settings.maskedApiKey})</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Update Gemini API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your Google Gemini API key (AIzaSy...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <div className="form-help">
              Keys can also be provided through the <code style={{ fontFamily: 'var(--font-mono)' }}>GEMINI_API_KEY</code> environment variable.
            </div>
          </div>
        </div>

        {/* RAG Hyperparameters */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sliders size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>RAG Vector Search Parameters</h3>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Top-K Chunks to Retrieve</label>
              <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              style={{ width: '100%' }}
            />
            <div className="form-help">Number of most relevant text chunks sent as context to Gemini AI (Default: 4).</div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Cosine Similarity Threshold</label>
              <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{similarityThreshold}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(e.target.value)}
              style={{ width: '100%' }}
            />
            <div className="form-help">Minimum relevance match required for a chunk to be cited (Default: 0.35).</div>
          </div>
        </div>

        {/* System & Storage Info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <HardDrive size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Storage & Database</h3>
          </div>

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><strong>Upload Directory:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{settings?.uploadDir}</code></div>
            <div><strong>Generation Model:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{settings?.model}</code></div>
            <div><strong>Embedding Model:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{settings?.embeddingModel}</code></div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 size={16} className="spin-icon" /> : <Save size={16} />}
          Save Settings
        </button>
      </form>
    </div>
  );
}
