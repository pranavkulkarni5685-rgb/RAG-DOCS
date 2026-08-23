import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <div className="app-container">
              <Sidebar isOpen={sidebarOpen} />
              <div className="main-content">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main style={{ flex: 1, overflowY: 'auto' }}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/chat/:sessionId" element={<ChatPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
