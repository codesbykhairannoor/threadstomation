import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ThreadsDashboard from './components/ThreadsDashboard';
import ConfigPanel from './components/ConfigPanel';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import PlatformSelector from './components/PlatformSelector';
import TikTokApp from './components/TikTokApp';
import InstagramApp from './components/InstagramApp';
import FacebookApp from './components/FacebookApp';
import TumblrApp from './components/TumblrApp';
import MastodonApp from './components/MastodonApp';
import DevtoApp from './components/DevtoApp';
import './App.css';

const API_BASE = '';

function App() {
  // URL-based routing — pathname IS the source of truth
  const [pathname, setPathname] = useState(window.location.pathname);

  // Dashboard state
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
  const [statusLoading, setStatusLoading] = useState(false);

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate helper — updates URL AND React state
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setPathname(path);
  };

  // Fetch accounts when entering a platform dashboard
  useEffect(() => {
    if (pathname === '/threads' || pathname === '/tiktok') {
      fetchAccounts();
    }
  }, [pathname]);

  // Refetch data when tab or account changes — but DON'T reset token status
  // so we don't flash "API Offline" while loading
  useEffect(() => {
    if (pathname !== '/threads') return;
    setHistory([]);
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [activeTab, selectedAccountId, pathname]);

  // Sync selected image to localStorage
  useEffect(() => {
    if (selectedImage) {
      localStorage.setItem('threads_pending_image', selectedImage);
    } else {
      localStorage.removeItem('threads_pending_image');
    }
  }, [selectedImage]);

  // ── API HELPERS ──
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
        setFetchError('Failed to fetch accounts.');
      }
    } catch (e) {
      setFetchError('Server connection failed: ' + e.message);
    }
  };

  const fetchData = async () => {
    setStatusLoading(true);
    try {
      const [sRes, stRes, hRes] = await Promise.all([
        fetch(`${API_BASE}/api/status?accountId=${selectedAccountId}`),
        fetch(`${API_BASE}/api/settings`),
        fetch(`${API_BASE}/api/history?platform=${activeTab}&accountId=${selectedAccountId}`)
      ]);
      // Only update status if successful — never reset to offline while loading
      if (sRes.ok) { setStatus(await sRes.json()); setFetchError(''); }
      else { setFetchError('Failed to retrieve account status.'); }
      if (stRes.ok) setSettings(await stRes.json());
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(Array.isArray(hData) ? hData : []);
      }
    } catch (e) {
      setFetchError('Server connection failed: ' + e.message);
    } finally {
      setStatusLoading(false);
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

  // ── ROUTING — all hooks are above, safe to branch here ──
  if (pathname === '/term-of-service') return <TermsOfService />;
  if (pathname === '/privacy-policy') return <PrivacyPolicy />;

  // TikTok Bot — completely self-contained app
  if (pathname === '/tiktok') {
    return <TikTokApp onBack={() => navigate('/')} />;
  }

  // Instagram Bot — completely self-contained app
  if (pathname === '/instagram') {
    return <InstagramApp onBack={() => navigate('/')} />;
  }
  if (pathname === '/facebook') {
    return <FacebookApp onBack={() => navigate('/')} />;
  }
  if (pathname === '/tumblr') {
    return <TumblrApp onBack={() => navigate('/')} />;
  }
  if (pathname === '/mastodon') {
    return <MastodonApp onBack={() => navigate('/')} />;
  }
  if (pathname === '/devto') {
    return <DevtoApp onBack={() => navigate('/')} />;
  }

  // Home → Platform Selector
  if (pathname === '/' || pathname === '') {
    return (
      <PlatformSelector
        onSelect={(p) => navigate(`/${p}`)}
      />
    );
  }

  // /threads → Main Dashboard
  const renderContent = () => {
    const commonProps = {
      status, settings, setSettings, handleSaveSettings,
      history, loading, fetchData, accountId: selectedAccountId
    };
    switch (activeTab) {
      case 'threads':
        return <ThreadsDashboard {...commonProps} handlePostNow={handlePostNow} selectedImage={selectedImage} setSelectedImage={setSelectedImage} statusLoading={statusLoading} />;
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
        onBackToPlatform={() => navigate('/')}
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
