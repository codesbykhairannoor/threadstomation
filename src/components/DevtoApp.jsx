import React, { useState, useEffect } from 'react';
import DevtoDashboard from './DevtoDashboard';
import DevtoConfigPanel from './DevtoConfigPanel';

const API = '/api/devto';

const DevtoSidebar = ({ activeTab, setActiveTab, accounts, selectedAccountId, setSelectedAccountId, onBack }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📝' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">📝</div>
        <h2 style={{ background: 'linear-gradient(to right, #001935, #36465D)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Devto AI
        </h2>
      </div>

      <button className="back-platform-btn" onClick={onBack}>
        ← Switch Platform
      </button>

      {accounts.length > 0 && (
        <div className="account-selector-container">
          <label className="text-xs opacity-50 ml-1">DEVTO BLOG</label>
          <select
            className="account-select"
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(parseInt(e.target.value))}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.username || acc.name}</option>
            ))}
          </select>
        </div>
      )}

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            style={activeTab === item.id ? { background: 'linear-gradient(135deg, #001935, #36465D)', color: '#fff' } : {}}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Devto Bot</p>
        <p style={{ marginTop: '4px', fontSize: '13px', fontWeight: 'bold' }}>
          {accounts.find(a => a.id === selectedAccountId)?.username || 'No Blog'}
        </p>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          <a href="/term-of-service" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }} target="_blank">Terms of Service</a>
          <a href="/privacy-policy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }} target="_blank">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

const DevtoApp = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(1);
  const [status, setStatus] = useState({ schedules: [], devtoToken: false, lastPost: null, automation_enabled: 'true' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Check for OAuth redirect result
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'DEVTO_AUTH_SUCCESS') {
        setMessage('✅ Devto blog connected successfully!');
        fetchAccounts();
        setTimeout(() => setMessage(''), 4000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchAccounts = async () => {
    try {
      // Create accounts endpoint if not exist yet, or just mock it here for now
      // Actually we need to add /api/devto/accounts in backend
      const res = await fetch(`${API}/accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
        if (data.length > 0 && !data.find(a => a.id === selectedAccountId)) {
          setSelectedAccountId(data[0].id);
        }
      }
    } catch (e) {
      setFetchError('Devto API connection failed: ' + e.message);
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
    setMessage('📝 Generating Devto post...');
    try {
      const res = await fetch(`${API}/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccountId, customPrompt })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Post published on Devto!`);
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

  const commonProps = { status, fetchData, loading, accountId: selectedAccountId, accounts, statusLoading };

  return (
    <>
      <DevtoSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        onBack={onBack}
      />
      <div className="dashboard-container" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,25,53,0.05), transparent)' }}>
        {fetchError && (
          <div style={{ background: '#ef4444', color: 'white', padding: '12px 20px', margin: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
            ⚠️ {fetchError}
          </div>
        )}
        {message && (
          <div className="global-toast animate-slide-down">{message}</div>
        )}
        {activeTab === 'dashboard'
          ? <DevtoDashboard {...commonProps} handlePostNow={handlePostNow} history={history} />
          : <DevtoConfigPanel {...commonProps} />
        }
      </div>
    </>
  );
};

export default DevtoApp;
