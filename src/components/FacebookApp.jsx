import React, { useState, useEffect } from 'react';
import FacebookDashboard from './FacebookDashboard';
import FacebookConfigPanel from './FacebookConfigPanel';

const API = '/api/facebook';

// UI Version: 1.0.3 (Force Refresh)

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
          {accounts.find(a => a.id === selectedAccountId)?.name || 'No Page Connected'}
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
  const [fetchError, setFetchError] = useState('');

  // Check for OAuth redirect result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_success')) {
      setMessage('✅ Facebook Page connected successfully!');
      window.history.replaceState({}, '', '/facebook');
      fetchAccounts();
      setTimeout(() => setMessage(''), 4000);
    }
    if (params.get('auth_error')) {
      setMessage(`❌ Auth failed: ${params.get('auth_error')}`);
      window.history.replaceState({}, '', '/facebook');
    }
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API}/accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
        if (data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data[0].id);
        }
      } else {
        setFetchError(`Facebook API error: ${res.status}`);
      }
    } catch (e) {
      setFetchError('Facebook API connection failed: ' + e.message);
    }
  };

  const fetchData = async () => {
    setStatusLoading(true);
    try {
      const idParam = selectedAccountId || 'null';
      const [sRes, hRes] = await Promise.all([
        fetch(`${API}/status?accountId=${idParam}`),
        fetch(`${API}/history?accountId=${idParam}`),
      ]);
      
      if (sRes.ok) { 
        const sData = await sRes.json();
        setStatus(sData); 
        setFetchError(''); 
      } else {
        const errTxt = await sRes.text();
        setFetchError(`Status check failed: ${sRes.status}. ${errTxt.substring(0, 50)}`);
      }
      
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
    if (!selectedAccountId) {
      setMessage('❌ No Facebook account selected.');
      return;
    }
    setLoading(true);
    setMessage('📘 Generating Facebook post...');
    try {
      const res = await fetch(`${API}/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccountId, customPrompt })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Post published on Facebook feed!');
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
      <FacebookSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        onBack={onBack}
      />
      <div className="dashboard-container" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0, 198, 255, 0.05), transparent)' }}>
        {fetchError && (
          <div style={{ background: '#ef4444', color: 'white', padding: '12px 20px', margin: '10px 20px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {fetchError}</span>
            <button className="btn btn-xs btn-outline" onClick={() => { fetchAccounts(); fetchData(); }} style={{ color: 'white', borderColor: 'white' }}>Retry</button>
          </div>
        )}
        {message && (
          <div className="global-toast animate-slide-down">{message}</div>
        )}
        {activeTab === 'dashboard'
          ? <FacebookDashboard {...commonProps} handlePostNow={handlePostNow} history={history} />
          : <FacebookConfigPanel {...commonProps} />
        }
      </div>
    </>
  );
};

export default FacebookApp;
