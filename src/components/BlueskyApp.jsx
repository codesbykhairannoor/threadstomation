import React, { useState, useEffect } from 'react';
import BlueskyDashboard from './BlueskyDashboard';
import BlueskyConfigPanel from './BlueskyConfigPanel';

const API = '/api/bluesky';

const BlueskySidebar = ({ activeTab, setActiveTab, accounts, selectedAccountId, setSelectedAccountId, onBack }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🦋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">🦋</div>
        <h2 style={{ background: 'linear-gradient(to right, #0085ff, #ffffff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Bluesky AI
        </h2>
      </div>

      <button className="back-platform-btn" onClick={onBack}>
        ← Switch Platform
      </button>

      {accounts.length > 0 && (
        <div className="account-selector-container">
          <label className="text-xs opacity-50 ml-1">BLUESKY ACCOUNT</label>
          <select
            className="account-select"
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(parseInt(e.target.value))}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.identifier || acc.name}</option>
            ))}
          </select>
        </div>
      )}

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            style={activeTab === item.id ? { background: 'linear-gradient(135deg, rgba(0, 133, 255, 0.2), transparent)', color: '#fff' } : {}}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Bluesky Bot</p>
        <p style={{ marginTop: '4px', fontSize: '13px', fontWeight: 'bold' }}>
          {accounts.find(a => a.id === selectedAccountId)?.identifier || 'No Account'}
        </p>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          <a href="/term-of-service" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }} target="_blank">Terms of Service</a>
          <a href="/privacy-policy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }} target="_blank">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

const BlueskyApp = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(1);
  const [status, setStatus] = useState({ schedules: [], blueskyToken: false, lastPost: null, automation_enabled: 'true' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchError, setFetchError] = useState('');

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API}/accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
        if (data.length > 0 && !data.find(a => a.id === selectedAccountId)) {
          setSelectedAccountId(data[0].id);
        }
      }
    } catch (e) {
      setFetchError('Bluesky API connection failed: ' + e.message);
    }
  };

  const fetchData = async () => {
    setStatusLoading(true);
    try {
      const [sRes, hRes] = await Promise.all([
        fetch(`${API}/status?accountId=${selectedAccountId}`),
        fetch(`${API}/history?accountId=${selectedAccountId}`),
      ]);
      if (sRes.ok) { setStatus(await sRes.json()); setFetchError(''); }
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(Array.isArray(hData) ? hData : []);
      }
    } catch (e) {
      setFetchError('Connection failed: ' + e.message);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  useEffect(() => {
    setHistory([]);
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [activeTab, selectedAccountId]);

  const handlePostNow = async (customPrompt = null) => {
    setLoading(true);
    setMessage('🦋 Generating Bluesky post...');
    try {
      const res = await fetch(`${API}/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccountId, customPrompt })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Post published on Bluesky!`);
        fetchData();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      setMessage('❌ Connection failed.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const commonProps = { status, fetchData, loading, accountId: selectedAccountId, accounts, statusLoading, fetchAccounts };

  return (
    <>
      <BlueskySidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        onBack={onBack}
      />
      <div className="dashboard-container" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,133,255,0.05), transparent)' }}>
        {fetchError && (
          <div style={{ background: '#ef4444', color: 'white', padding: '12px 20px', margin: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
            ⚠️ {fetchError}
          </div>
        )}
        {message && (
          <div className="global-toast animate-slide-down">{message}</div>
        )}
        {activeTab === 'dashboard'
          ? <BlueskyDashboard {...commonProps} handlePostNow={handlePostNow} history={history} />
          : <BlueskyConfigPanel {...commonProps} />
        }
      </div>
    </>
  );
};

export default BlueskyApp;
