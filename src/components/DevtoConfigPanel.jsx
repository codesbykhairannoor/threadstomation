import React, { useState } from 'react';

const API = '/api/devto';

const DevtoConfigPanel = ({ status, fetchData, loading, accountId, accounts, statusLoading }) => {
  const [manualLoading, setManualLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleConnectDevto = async () => {
    if (!apiKey.trim()) return alert('Please enter an API Key');
    setManualLoading(true);
    try {
      const res = await fetch(`${API}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Connected as: ' + data.username);
        setApiKey('');
        fetchData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error connecting: ' + e.message);
    }
    setManualLoading(false);
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Devto Configuration ⚙️</h1>
        <p className="subtitle">Manage your Devto blog settings and automation slots.</p>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>

        <section className="glass-card mb-2">
          <h3>🔗 Connect Dev.to Account</h3>
          <p className="section-desc">
            Link your Dev.to account using your API Key. You can find this in your Dev.to Settings &gt; Extensions.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Paste your Dev.to API Key here"
              className="input-field"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleConnectDevto} disabled={manualLoading}>
              {manualLoading ? 'Saving...' : 'Connect'}
            </button>
          </div>
          {accounts.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <div className="status-badge success" style={{ display: 'inline-block' }}>
                ✅ Active Account: {accounts.find(a => a.id === accountId)?.username || 'Connected'}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default DevtoConfigPanel;
