import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ThreadsDashboard from './components/ThreadsDashboard';
import ConfigPanel from './components/ConfigPanel';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import PlatformSelector from './components/PlatformSelector';
import './App.css';

const API_BASE = '';

function App() {
  // ── ALL HOOKS MUST BE AT THE TOP — NO EXCEPTIONS ──
  const [pathname, setPathname] = useState(window.location.pathname);
  const [platform, setPlatform] = useState(() => sessionStorage.getItem('selected_platform') || null);
  const [activeTab, setActiveTab] = useState('threads');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(1);
  const [status, setStatus] = useState({ schedules: [], threadsSession: false, threadsToken: false, lastPost: null });
  const [settings, setSettings] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedImage, setSelectedImage] = useState(localStorage.getItem('threads_pending_image'));

  // Listen to browser back/forward
  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch accounts on mount
  useEffect(() => {
    if (platform) fetchAccounts();
  }, [platform]);

  // Refetch data when tab or account changes (only when platform is active)
  useEffect(() => {
    if (!platform) return;
    setHistory([]);
    setStatus(prev => ({ ...prev, threadsToken: false, lastPost: null }));
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [activeTab, selectedAccountId, platform]);

  // Sync selected image to localStorage
  useEffect(() => {
    if (selectedImage) {
      localStorage.setItem('threads_pending_image', selectedImage);
    } else {
      localStorage.removeItem('threads_pending_image');
    }
  }, [selectedImage]);

  // ── HELPER FUNCTIONS ──
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
        if (data.length > 0 && !data.find(a => a.id === selectedAccountId)) {
          setSelectedAccountId(data[0].id);
        }
        setFetchError('');
      } else {
        setFetchError('Failed to fetch accounts list from server.');
      }
    } catch (e) {
      setFetchError('Server connection failed: ' + e.message);
    }
  };

  const fetchData = async () => {
    try {
      const [sRes, stRes, hRes] = await Promise.all([
        fetch(`${API_BASE}/api/status?accountId=${selectedAccountId}`),
        fetch(`${API_BASE}/api/settings`),
        fetch(`${API_BASE}/api/history?platform=${activeTab}&accountId=${selectedAccountId}`)
      ]);
      if (sRes.ok) { setStatus(await sRes.json()); setFetchError(''); }
      else { setFetchError('Failed to retrieve status for the selected account.'); }
      if (stRes.ok) setSettings(await stRes.json());
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(Array.isArray(hData) ? hData : []);
      }
    } catch (e) {
      setFetchError('Server connection failed: ' + e.message);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setMessage('✅ Settings updated!');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage('❌ Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostNow = async (isTest = false) => {
    setLoading(true);
    setMessage(isTest ? '🧪 Sending test...' : '🚀 AI Posting...');
    try {
      const res = await fetch(`${API_BASE}/api/${isTest ? 'test-post' : 'post-now'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: [activeTab], image: selectedImage, accountId: selectedAccountId })
      });
      const data = await res.json();
      if (data.success) { setMessage('✅ Post Success!'); fetchData(); }
      else { setMessage(`❌ Error: ${data.error}`); }
    } catch (e) {
      setMessage('❌ Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPlatform = () => {
    sessionStorage.removeItem('selected_platform');
    setPlatform(null);
  };

  // ── CONDITIONAL RENDERS (after ALL hooks) ──
  if (pathname === '/term-of-service') return <TermsOfService />;
  if (pathname === '/privacy-policy') return <PrivacyPolicy />;

  if (!platform) {
    return (
      <PlatformSelector
        onSelect={(p) => {
          sessionStorage.setItem('selected_platform', p);
          setPlatform(p);
        }}
      />
    );
  }

  const renderContent = () => {
    const commonProps = { status, settings, setSettings, handleSaveSettings, history, loading, fetchData, accountId: selectedAccountId };
    switch (activeTab) {
      case 'threads':
        return <ThreadsDashboard {...commonProps} handlePostNow={handlePostNow} selectedImage={selectedImage} setSelectedImage={setSelectedImage} />;
      case 'settings':
        return <ConfigPanel {...commonProps} newTime={newTime} setNewTime={setNewTime} accounts={accounts} />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        onBackToPlatform={handleBackToPlatform}
      />
      <div className="dashboard-container">
        {fetchError && (
          <div style={{ background: '#ef4444', color: 'white', padding: '12px 20px', margin: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
            ⚠️ {fetchError}
          </div>
        )}
        {message && (
          <div className="global-toast animate-slide-down">{message}</div>
        )}
        {renderContent()}
      </div>
    </>
  );
}

export default App;
