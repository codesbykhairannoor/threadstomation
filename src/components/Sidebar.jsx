import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
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
