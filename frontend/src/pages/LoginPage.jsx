import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@aidocumentassistant.local');
  const [password, setPassword] = useState('password123');

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <Bot size={24} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>RAG DOCS</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            RAG Based Chatbot System
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Sign In to Workspace <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
