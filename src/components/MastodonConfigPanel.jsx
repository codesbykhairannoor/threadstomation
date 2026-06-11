import React, { useState } from 'react';

const API = '/api/mastodon';

const MastodonConfigPanel = ({ status, fetchData, loading, accountId, accounts, statusLoading }) => {
  const [manualLoading, setManualLoading] = useState(false);

  const handleConnectMastodon = () => {
    window.open(`${API}/auth`, 'MastodonAuth', 'width=600,height=700');
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Mastodon Configuration ⚙️</h1>
        <p className="subtitle">Manage your Mastodon blog settings and automation slots.</p>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>

        {/* OAuth Connect */}
        <section className="glass-card mb-2">
          <h3>🔗 Connect Mastodon Blog</h3>
          <p className="section-desc">
            Link your Mastodon blog using OAuth 2.0. This allows the bot to post Photo Sets directly to your blog.
          </p>
          {accounts.length > 0 ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div className="status-badge success" style={{ display: 'inline-block' }}>
                  ✅ Active Blog: {accounts.find(a => a.id === accountId)?.username || 'Connected'}
                </div>
              </div>
              <button className="btn btn-outline" onClick={handleConnectMastodon}>
                + Connect Another Blog
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <p style={{ margin: 0, color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>
                  ❌ No Mastodon blog connected. You must connect a blog to start automating.
                </p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleConnectMastodon}
                style={{ padding: '12px 24px', fontSize: '16px' }}
              >
                Connect with Mastodon
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default MastodonConfigPanel;
