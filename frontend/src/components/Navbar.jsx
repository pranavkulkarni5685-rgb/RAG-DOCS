import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Download, CheckCircle, AlertCircle, Menu } from 'lucide-react';
import { settingsService } from '../services/settingsService';

export default function Navbar({ toggleSidebar }) {
  const [health, setHealth] = useState({ connected: false, gemini: false });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
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
    <header style={{
      height: '64px',
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.75rem',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={toggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.45rem',
            borderRadius: '8px',
            color: '#475569',
            background: 'rgba(241, 245, 249, 0.6)',
            border: '1px solid var(--glass-border)',
            transition: 'var(--transition-smooth)'
          }}
          title="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-glow)'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              RAG DOCS
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
              RAG Based Intelligent Chatbot
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* PWA Install Button */}
        {installPrompt && !isInstalled && (
          <button
            onClick={handleInstallClick}
            className="btn btn-glass btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#2563eb',
              fontWeight: 700,
              border: '1px solid rgba(37, 99, 235, 0.3)',
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.15)'
            }}
          >
            <Download size={14} /> Install App
          </button>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          background: health.connected ? 'rgba(236, 253, 245, 0.8)' : 'rgba(254, 242, 242, 0.8)',
          color: health.connected ? '#065f46' : '#991b1b',
          border: `1px solid ${health.connected ? '#a7f3d0' : '#fecaca'}`,
          backdropFilter: 'blur(8px)',
          boxShadow: health.connected ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none'
        }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: health.connected ? '#10b981' : '#ef4444',
            boxShadow: health.connected ? '0 0 8px #10b981' : 'none'
          }} />
          <span>{health.connected ? 'Server Connected' : 'Server Offline'}</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          background: health.gemini ? 'rgba(239, 246, 255, 0.85)' : 'rgba(255, 251, 235, 0.85)',
          color: health.gemini ? '#1d4ed8' : '#92400e',
          border: `1px solid ${health.gemini ? '#bfdbfe' : '#fde68a'}`,
          backdropFilter: 'blur(8px)',
          boxShadow: health.gemini ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none'
        }}>
          <Sparkles size={14} color={health.gemini ? '#2563eb' : '#d97706'} />
          <span>{health.gemini ? 'Gemini 3.5 Flash Active' : 'Configure API Key'}</span>
        </div>
      </div>
    </header>
  );
}
