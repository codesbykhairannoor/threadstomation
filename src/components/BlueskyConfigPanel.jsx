import React, { useState } from 'react';

const BlueskyConfigPanel = ({ fetchAccounts, status, accountId }) => {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/bluesky/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, app_password: appPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        setMsg('✅ Successfully connected to Bluesky!');
        fetchAccounts();
      } else {
        setMsg(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMsg(`❌ Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h1>Settings & Configuration</h1>
          <p className="text-muted">Connect your Bluesky account using an App Password.</p>
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          Connect Bluesky Account
        </h3>

        {msg && (
          <div style={{ padding: '12px', background: msg.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: msg.includes('✅') ? 'var(--success)' : 'var(--error)', borderRadius: '8px', marginBottom: '20px', border: msg.includes('✅') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
            {msg}
          </div>
        )}

        <form onSubmit={handleConnect}>
          <div className="input-group">
            <label>Bluesky Handle (Identifier)</label>
            <input 
              type="text" 
              placeholder="e.g. user.bsky.social" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Your full handle including the domain.</p>
          </div>

          <div className="input-group">
            <label>App Password</label>
            <input 
              type="password" 
              placeholder="xxxx-xxxx-xxxx-xxxx" 
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Generate an app password in your Bluesky Settings &gt; App Passwords. Do NOT use your main account password.
            </p>
          </div>

          <button type="submit" className="btn btn-glow w-full" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Connecting...' : 'Connect to Bluesky'}
          </button>
        </form>
      </div>

      <div className="glass-card mt-2" style={{ maxWidth: '600px', margin: '2rem auto 0' }}>
         <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          Current Configuration
        </h3>
        <p><strong>Connected Account ID:</strong> {accountId || 'None'}</p>
        <p><strong>Token Status:</strong> {status.blueskyToken ? <span className="badge badge-success">Valid</span> : <span className="badge badge-error">Missing/Invalid</span>}</p>
      </div>
    </div>
  );
};

export default BlueskyConfigPanel;
