import React, { useState, useEffect } from 'react';
import FacebookDashboard from './FacebookDashboard';
import FacebookConfigPanel from './FacebookConfigPanel';

const API = '/api/facebook';

const FacebookSidebar = ({ activeTab, setActiveTab, accounts, selectedAccountId, setSelectedAccountId, onBack }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📘' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">📘</div>
        <h2 style={{ background: 'linear-gradient(to right, #00c6ff, #0072ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>
          Facebook AI
        </h2>
      </div>

      <button className="back-platform-btn" onClick={onBack}>
        ← Switch Platform
      </button>

      {accounts.length > 0 && (
        <div className="account-selector-container">
          <label className="text-xs opacity-50 ml-1">FACEBOOK PAGE</label>
          <select
            className="account-select"
            value={selectedAccountId || ''}
            onChange={e => setSelectedAccountId(parseInt(e.target.value))}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      )}

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            style={activeTab === item.id ? { background: 'linear-gradient(135deg, #00c6ff, #0072ff)', color: '#fff', boxShadow: '0 4px 15px rgba(0, 114, 255, 0.3)' } : {}}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="opacity-50">Facebook Automation</p>
        <p style={{ marginTop: '4px', fontSize: '13px', fontWeight: 'bold', color: '#00c6ff' }}>
          {accounts.find(a => a.id === selectedAccountId)?.name || 'Select Page'}
        </p>
      </div>
    </div>
  );
};

const FacebookApp = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [status, setStatus] = useState({ schedules: [], facebookToken: false, lastPost: null, automation_enabled: 'true' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API}/accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
        if (data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch accounts:', e.message);
    }
  };

  const fetchData = async () => {
    if (!selectedAccountId) return;
    setStatusLoading(true);
    try {
      const [sRes, hRes] = await Promise.all([
        fetch(`${API}/status?accountId=${selectedAccountId}`),
        fetch(`${API}/history?accountId=${selectedAccountId}`),
      ]);
      
      if (sRes.ok) {
        const statusData = await sRes.json();
        // Fetch schedules separately because /status only gives token/automation
        const schRes = await fetch(`${API}/schedules?accountId=${selectedAccountId}`);
        const schedules = await schRes.json();
        
        setStatus({ 
          ...statusData,
          schedules
        });
      }
      if (hRes.ok) {
        const historyData = await hRes.json();
        setHistory(Array.isArray(historyData) ? historyData : []);
      }
    } catch (e) {
      console.error('Fetch error:', e.message);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [selectedAccountId]);

  const handlePostNow = async () => {
    if (!window.confirm('Trigger generation and post to Facebook now?')) return;
    setLoading(true);
    setMessage('🚀 Generating content and uploading to Facebook...');
    try {
      const res = await fetch(`${API}/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccountId })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Posted successfully!');
        fetchData();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      setMessage(`❌ Failed: ${e.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="app-container">
      <FacebookSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        onBack={onBack}
      />
      
      <div className="dashboard-container" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0, 198, 255, 0.05), transparent)' }}>
        <main className="main-content">
          {message && (
            <div className={`status-toast ${message.includes('❌') ? 'error' : ''}`}>
              {message}
            </div>
          )}

          {activeTab === 'dashboard' ? (
            <FacebookDashboard 
              status={status} 
              handlePostNow={handlePostNow} 
              history={history} 
              loading={loading}
              statusLoading={statusLoading}
              accountId={selectedAccountId}
            />
          ) : (
            <FacebookConfigPanel 
              status={status}
              fetchData={fetchData}
              loading={loading}
              accountId={selectedAccountId}
              accounts={accounts}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default FacebookApp;
