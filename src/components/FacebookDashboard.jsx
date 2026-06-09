import React from 'react';

const API = '/api/facebook';

const FacebookDashboard = ({ status, handlePostNow, history, loading, statusLoading, accountId }) => {
  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Facebook Automation Bot 📘</h1>
        <div className="status-header">
          <span className={`badge ${statusLoading ? 'badge-neutral' : status.facebookToken ? 'badge-success' : 'badge-error'}`}>
            {statusLoading ? '⏳ Checking...' : status.facebookToken ? '🔗 API Linked' : '🔴 API Offline'}
          </span>
          <button
            className={`btn btn-xs ${status.automation_enabled === 'false' ? 'btn-danger' : 'btn-glow'}`}
            onClick={async () => {
              await fetch(`${API}/settings/toggle-automation`, { method: 'POST' });
              window.location.reload();
            }}
          >
            {status.automation_enabled === 'false' ? '🛑 Paused' : '🟢 Active'}
          </button>
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
                disabled={loading || !status.facebookToken}
              >
                📘 Generate &amp; Post Now
              </button>
            </div>
            {!status.facebookToken && (
              <div className="tiktok-auth-hint">
                <p>⚠️ No Facebook account linked.</p>
                <p>Go to <strong>Settings</strong> tab to connect your account.</p>
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
                  <p className="text-sm opacity-70">🖼️ {status.lastPost.slide_count} photos</p>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="right-column">
          <section className="glass-card history-card">
            <h3>Post History</h3>
            <div className="history-list">
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-meta">
                    <span className="time">{new Date(item.created_at).toLocaleString()}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.slide_count && (
                        <span className="badge badge-neutral">Photos ({item.slide_count})</span>
                      )}
                      <span className={`status-dot ${item.status === 'success' ? 'success' : item.status === 'pending' ? '' : 'failed'}`} />
                    </div>
                  </div>
                  <p className="content-pill">{item.caption}</p>
                  {item.error_message && (
                    <p className="error-pill">❌ {item.error_message}</p>
                  )}
                  {item.image_urls && (() => {
                    try {
                      const urls = item.image_urls.split(',');
                      return (
                        <div className="tiktok-slide-preview">
                          {urls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt={`Slide ${i + 1}`} className="tiktok-slide-thumb" />
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
                <div className="empty-state">No history found for this account.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FacebookDashboard;
