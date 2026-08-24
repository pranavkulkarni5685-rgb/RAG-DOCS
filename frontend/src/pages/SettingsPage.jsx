import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Loader2,
  HardDrive,
  Cpu,
  Sparkles
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
      setTopK(s?.topK || 4);
      setSimilarityThreshold(s?.similarityThreshold || 0.35);
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
      setFeedback({ type: 'success', message: 'Settings updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '820px' }}>
      <div className="dashboard-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Application Settings</h1>
          <p className="page-subtitle">
            Configure Gemini AI model keys, vector chunking thresholds, and storage parameters.
          </p>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.86rem',
          background: feedback.type === 'success' ? 'rgba(236, 253, 245, 0.9)' : 'rgba(254, 242, 242, 0.9)',
          color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Gemini API Key Configuration */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(37, 99, 235, 0.1)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Key size={16} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Google Gemini AI API Key</h3>
          </div>

          <div style={{
            background: 'rgba(248, 250, 252, 0.85)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            padding: '0.75rem 0.9rem',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            <span style={{ color: '#475569' }}>Current Status:</span>
            <span className={`badge ${settings?.geminiConfigured ? 'badge-completed' : 'badge-failed'}`}>
              {settings?.geminiConfigured ? 'Active & Connected' : 'Key Missing'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>Update API Key</label>
            <input
              type="password"
              placeholder="Enter your Gemini API key (AQ.Ab8...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                outline: 'none',
                color: '#0f172a'
              }}
            />
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Your API key is stored securely in environment configurations and used for vector embeddings.
            </span>
          </div>
        </div>

        {/* RAG Parameters */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sliders size={16} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>RAG Retrieval Hyperparameters</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.84rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Top-K Chunks to Retrieve</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(37, 99, 235, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  {topK} chunks
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.25rem' }}>
                Number of most relevant text chunks sent as context to Gemini AI (Default: 4).
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.84rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Similarity Threshold</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(37, 99, 235, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  {similarityThreshold}
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.25rem' }}>
                Minimum cosine relevance score required for a chunk to be cited (Default: 0.35).
              </div>
            </div>
          </div>
        </div>

        {/* System & Database Info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(124, 58, 237, 0.1)',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <HardDrive size={16} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>System & Database Info</h3>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            fontSize: '0.82rem',
            color: '#334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(241, 245, 249, 0.9)', paddingBottom: '0.4rem', flexWrap: 'wrap', gap: '0.2rem' }}>
              <span style={{ color: '#64748b' }}>Database Host:</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>TiDB Cloud (Serverless)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(241, 245, 249, 0.9)', paddingBottom: '0.4rem', flexWrap: 'wrap', gap: '0.2rem' }}>
              <span style={{ color: '#64748b' }}>Generation AI Model:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{settings?.model || 'gemini-3.5-flash-lite'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(241, 245, 249, 0.9)', paddingBottom: '0.4rem', flexWrap: 'wrap', gap: '0.2rem' }}>
              <span style={{ color: '#64748b' }}>Embedding Model:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{settings?.embeddingModel || 'gemini-embedding-001'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.2rem' }}>
              <span style={{ color: '#64748b' }}>Storage Path:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#64748b', wordBreak: 'break-all' }}>
                {settings?.uploadDir || '/tmp/uploads'}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button (Full Width on Mobile) */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem', borderRadius: '10px' }}
        >
          {saving ? <Loader2 size={17} className="spin-icon" /> : <Save size={17} />}
          {saving ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
