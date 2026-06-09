import React from 'react';

const API = '/api/facebook';

const FacebookDashboard = ({ status, handlePostNow, history, loading, statusLoading, accountId }) => {
  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Facebook Automation Bot 📘</h1>
        <div className="status-header">
          {!accountId ? (
            <span className="badge badge-neutral">⚪ No Account Selected</span>
          ) : (
            <>
              <span className={`badge ${statusLoading ? 'badge-neutral' : status.facebookToken ? 'badge-success' : 'badge-error'}`}>
                {statusLoading ? '⏳ Checking...' : status.facebookToken ? '🔗 API Linked' : '🔴 API Offline'}
              </span>
              <button
                className={`btn btn-xs ${status.automation_enabled === 'false' ? 'btn-danger' : 'btn-glow'}`}
                onClick={async () => {
                  await fetch(`${API}/settings/toggle-automation`, { 
                    method: 'POST', 
                    body: JSON.stringify({ accountId }), 
                    headers: {'Content-Type': 'application/json'} 
                  });
                  window.location.reload();
                }}
              >
                {status.automation_enabled === 'false' ? '🛑 Paused' : '🟢 Active'}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="main-grid">
        <div className="left-column">
          <section className="glass-card mt-2">
            <h3>Quick Actions</h3>
            <p className="section-desc">Manually trigger an AI Facebook post right now.</p>
            <div className="flex-col gap-1">
              <button
                className="btn btn-glow w-full"
                onClick={() => handlePostNow()}
                disabled={loading || !status.facebookToken || !accountId}
                style={{ background: 'linear-gradient(135deg, #00c6ff, #0072ff)' }}
              >
                📘 Generate &amp; Post Now
              </button>
            </div>
            {!accountId ? (
              <div className="tiktok-auth-hint">
                <p>⚠️ No account selected.</p>
                <p>Please select an account from the sidebar or go to <strong>Settings</strong> to connect a new one.</p>
              </div>
            ) : !status.facebookToken && (
              <div className="tiktok-auth-hint">
                <p>⚠️ Facebook token invalid or missing.</p>
                <p>Go to <strong>Settings</strong> tab to re-connect your account.</p>
              </div>
            )}
          </section>

          {status.lastPost && (
            <section className="glass-card mt-2">
              <h3>Last Post</h3>
              <div className="last-post-info">
                <span className={`badge ${status.lastPost.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                  {status.lastPost.status}
                </span>
                <p className="content-pill mt-1">{status.lastPost.caption}</p>
                <p className="time mt-1">{new Date(status.lastPost.created_at).toLocaleString()}</p>
                {status.lastPost.slide_count && (
                  <p className="text-sm opacity-70">🖼️ {status.lastPost.slide_count} photos published</p>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="right-column">
          <section className="glass-card history-card">
            <h3>Post History</h3>
            <div className="history-list">
              {!accountId ? (
                <div className="empty-state">Select an account to view history.</div>
              ) : history.length > 0 ? history.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-meta">
                    <span className="time">{new Date(item.created_at).toLocaleString()}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.slide_count && (
                        <span className="badge badge-neutral">Gallery ({item.slide_count} photos)</span>
                      )}
                      <span className={`status-dot ${item.status === 'success' ? 'success' : item.status === 'pending' ? '' : 'failed'}`}
                        style={item.status === 'pending' ? { background: '#00c6ff', boxShadow: '0 0 8px #00c6ff' } : {}}
                      />
                    </div>
                  </div>
                  <p className="content-pill">{item.caption}</p>
                  {item.error_message && (
                    <p className="error-pill">❌ {item.error_message}</p>
                  )}
                  {item.image_urls && (() => {
                    try {
                      const urls = item.image_urls.startsWith('[') ? JSON.parse(item.image_urls) : item.image_urls.split(',');
                      return (
                        <div className="tiktok-slide-preview">
                          {urls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt={`Photo ${i + 1}`} className="tiktok-slide-thumb" />
                          ))}
                          {urls.length > 3 && (
                            <div className="tiktok-slide-more">+{urls.length - 3}</div>
                          )}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
              )) : (
                <div className="empty-state">No Facebook posts yet.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FacebookDashboard;
