import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Files, 
  History, 
  Settings, 
  PlusCircle,
  Sparkles,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  if (!isOpen) return null;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'RAG Assistant', icon: MessageSquare },
    { to: '/documents', label: 'Documents', icon: Files },
    { to: '/history', label: 'Chat History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div className="sidebar-backdrop" onClick={onClose} />

      <aside className="sidebar-drawer" style={{
        width: '250px',
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: '#cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100
      }}>
        {/* Mobile Header with Close Button */}
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <NavLink
            to="/chat"
            onClick={onClose}
            className="btn btn-primary"
            style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', borderRadius: '10px' }}
          >
            <PlusCircle size={16} /> New Conversation
          </NavLink>
          
          <button
            onClick={onClose}
            style={{
              marginLeft: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.4rem'
            }}
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 0.95rem',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  boxShadow: isActive ? '0 4px 14px 0 rgba(37, 99, 235, 0.35)' : 'none',
                  transition: 'var(--transition-smooth)'
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Info Box */}
        <div style={{
          padding: '0.95rem',
          margin: '0.75rem',
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          fontSize: '0.73rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.2rem' }}>
            <Sparkles size={12} />
            <span>TiDB Cloud + Gemini</span>
          </div>
          <div style={{ color: '#94a3b8' }}>Vector RAG Grounding</div>
        </div>
      </aside>
    </>
  );
}
