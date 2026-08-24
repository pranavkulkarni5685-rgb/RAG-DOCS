import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Download, Menu, ShieldCheck } from 'lucide-react';
import { settingsService } from '../services/settingsService';

export default function Navbar({ toggleSidebar }) {
  const [health, setHealth] = useState({ connected: false, gemini: false });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 25000);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const checkHealth = async () => {
    try {
      const res = await settingsService.getHealth();
      setHealth({ connected: true, gemini: res.data?.geminiConnected || false });
    } catch {
      setHealth({ connected: false, gemini: false });
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  return (
    <header className="navbar-header" style={{
      height: '62px',
      background: 'rgba(255, 255, 255, 0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 2px 14px rgba(0, 0, 0, 0.03)'
    }}>
      {/* Brand & Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
        <button
          onClick={toggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.45rem',
            borderRadius: '8px',
            color: '#334155',
            background: 'rgba(241, 245, 249, 0.75)',
            border: '1px solid var(--glass-border-subtle)',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'var(--accent-gradient)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px var(--accent-glow)',
            flexShrink: 0
          }}>
            <Bot size={19} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              RAG DOCS
            </div>
            <div className="badge-full-text" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
              AI Document Assistant
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls & Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
        {/* Install Button */}
        {installPrompt && !isInstalled && (
          <button
            onClick={handleInstallClick}
            className="btn btn-glass btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#2563eb',
              fontWeight: 700,
              padding: '0.35rem 0.65rem',
              fontSize: '0.78rem'
            }}
          >
            <Download size={13} /> <span className="badge-full-text">Install</span>
          </button>
        )}

        {/* Server Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.3rem 0.6rem',
          borderRadius: '9999px',
          background: health.connected ? 'rgba(236, 253, 245, 0.85)' : 'rgba(254, 242, 242, 0.85)',
          color: health.connected ? '#065f46' : '#991b1b',
          border: `1px solid ${health.connected ? '#a7f3d0' : '#fecaca'}`
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: health.connected ? '#10b981' : '#ef4444',
            boxShadow: health.connected ? '0 0 6px #10b981' : 'none'
          }} />
          <span className="badge-full-text">{health.connected ? 'Server OK' : 'Offline'}</span>
        </div>

        {/* Gemini Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.3rem 0.6rem',
          borderRadius: '9999px',
          background: health.gemini ? 'rgba(239, 246, 255, 0.85)' : 'rgba(255, 251, 235, 0.85)',
          color: health.gemini ? '#1d4ed8' : '#92400e',
          border: `1px solid ${health.gemini ? '#bfdbfe' : '#fde68a'}`
        }}>
          <Sparkles size={12} color={health.gemini ? '#2563eb' : '#d97706'} />
          <span className="badge-full-text">{health.gemini ? 'Gemini AI' : 'API Key'}</span>
        </div>
      </div>
    </header>
  );
}
