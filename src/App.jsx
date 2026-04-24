import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ThreadsDashboard from './components/ThreadsDashboard';
import ConfigPanel from './components/ConfigPanel';
import './App.css';

const API_BASE = ''; // Dynamic origin support

function App() {
  const [activeTab, setActiveTab] = useState('threads');
  const [status, setStatus] = useState({ schedules: [], threadsSession: false, threadsToken: false, lastPost: null });
  const [settings, setSettings] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newTime, setNewTime] = useState('');

  // Fetch all initial data
  const fetchData = async () => {
    try {
      const [sRes, stRes, hRes] = await Promise.all([
        fetch(`${API_BASE}/api/status`),
        fetch(`${API_BASE}/api/settings`),
        fetch(`${API_BASE}/api/history?platform=${activeTab}`)
      ]);
      
      if (sRes.ok) setStatus(await sRes.json());
      if (stRes.ok) setSettings(await stRes.json());
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(Array.isArray(hData) ? hData : []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

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
    const platformLabel = activeTab.toUpperCase();
    setMessage(isTest ? `🧪 Sending test to ${platformLabel}...` : `🚀 AI Posting to ${platformLabel}...`);
    
    try {
      const res = await fetch(`${API_BASE}/api/${isTest ? 'test-post' : 'post-now'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: [activeTab] })
      });
      const data = await res.json();
      if (data.success) {
        const platformResult = data.results?.find(r => r.platform === activeTab);
        if (platformResult?.status === 'success') {
          setMessage(`✅ ${platformLabel} Post Success!`);
          fetchData();
        } else {
          setMessage(`❌ ${platformLabel} Error: ${platformResult?.error || 'Unknown error'}`);
        }
      } else {
        setMessage(`❌ Server Error: ${data.error}`);
      }
    } catch (e) {
      setMessage('❌ Connection failed.');
    } finally {
      setLoading(false);
    }
  };







  const renderContent = () => {
    const commonProps = { status, settings, setSettings, handleSaveSettings, history, loading, fetchData };
    
    switch (activeTab) {

      case 'threads':
        return (
          <ThreadsDashboard 
            {...commonProps} 
            handlePostNow={handlePostNow} 
          />
        );
      case 'settings':
        return <ConfigPanel {...commonProps} newTime={newTime} setNewTime={setNewTime} />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="dashboard-container">
        {message && (
          <div className="global-toast animate-slide-down">
            {message}
          </div>
        )}
        {renderContent()}
      </div>
    </>
  );
}

export default App;
