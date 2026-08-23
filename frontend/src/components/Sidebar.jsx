import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Files, 
  History, 
  Settings, 
  Database,
  PlusCircle,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ isOpen }) {
  if (!isOpen) return null;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'RAG Assistant', icon: MessageSquare },
    { to: '/documents', label: 'Documents', icon: Files },
    { to: '/history', label: 'Chat History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '250px',
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      color: '#cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      zIndex: 40
    }}>
      {/* Sidebar Header Button */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <NavLink
          to="/chat"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.65rem', fontSize: '0.88rem', borderRadius: '10px' }}
        >
          <PlusCircle size={17} /> New Conversation
        </NavLink>
      </div>

      {/* Nav links */}
      <nav style={{ padding: '1.2rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
        padding: '1.1rem',
        margin: '0.75rem',
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.2rem' }}>
          <Sparkles size={13} />
          <span>RAG Hybrid Search</span>
        </div>
        <div style={{ color: '#94a3b8' }}>Vector + Context Grounding</div>
      </div>
    </aside>
  );
}
