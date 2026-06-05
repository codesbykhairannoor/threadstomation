import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, accounts, selectedAccountId, setSelectedAccountId, onBackToPlatform }) => {
  const menuItems = [
    { id: 'threads', label: 'Threads', icon: '🧵' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">🚀</div>
        <h2>Socmed AI</h2>
      </div>

      {/* Back to platform selector */}
      <button className="back-platform-btn" onClick={onBackToPlatform}>
        ← Switch Platform
      </button>

      <div className="account-selector-container">
        <label className="text-xs opacity-50 ml-1">MANAGE ACCOUNT</label>
        <select 
          className="account-select" 
          value={selectedAccountId} 
          onChange={(e) => setSelectedAccountId(parseInt(e.target.value))}
        >
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name || acc.threads_user_id}
            </option>
          ))}
        </select>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>Automation Dashboard</p>
        <p style={{ marginTop: '4px' }}>@1persenlebihbaik_</p>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          <a href="/term-of-service" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }} target="_blank">Terms of Service</a>
          <a href="/privacy-policy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }} target="_blank">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
