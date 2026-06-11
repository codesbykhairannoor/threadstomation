import React, { useState } from 'react';

const API = '/api/tumblr';

const TumblrConfigPanel = ({ status, fetchData, loading, accountId, accounts, statusLoading }) => {
  const [manualLoading, setManualLoading] = useState(false);

  const handleConnectTumblr = () => {
    window.open(`${API}/auth`, 'TumblrAuth', 'width=600,height=700');
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Tumblr Configuration ⚙️</h1>
        <p className="subtitle">Manage your Tumblr blog settings and automation slots.</p>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>

        {/* OAuth Connect */}
        <section className="glass-card mb-2">
          <h3>🔗 Connect Tumblr Blog</h3>
          <p className="section-desc">
            Link your Tumblr blog using OAuth 2.0. This allows the bot to post Photo Sets directly to your blog.
          </p>
          {accounts.length > 0 ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div className="status-badge success" style={{ display: 'inline-block' }}>
                  ✅ Active Blog: {accounts.find(a => a.id === accountId)?.blog_name || 'Connected'}
                </div>
              </div>
              <button className="btn btn-outline" onClick={handleConnectTumblr}>
                + Connect Another Blog
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <p style={{ margin: 0, color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>
                  ❌ No Tumblr blog connected. You must connect a blog to start automating.
                </p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleConnectTumblr}
                style={{ padding: '12px 24px', fontSize: '16px' }}
              >
                Connect with Tumblr
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default TumblrConfigPanel;
