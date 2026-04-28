import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, accounts, selectedAccountId, setSelectedAccountId }) => {
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
        <p>@1persenlebihbaik_</p>
      </div>
    </div>
  );
};

export default Sidebar;
