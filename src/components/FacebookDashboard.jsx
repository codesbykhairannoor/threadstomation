import React from 'react';

const API = '/api/facebook';

const FacebookDashboard = ({ status, handlePostNow, history, loading, statusLoading, accountId }) => {
  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '20px' }}>
      <header className="content-header" style={{ marginBottom: '30px' }}>
        <div className="flex-col">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #00c6ff, #0072ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Facebook Insight 📘
          </h1>
          <p className="opacity-70 mt-1">Manage your professional pages with AI automation.</p>
        </div>
        
        <div className="status-header">
          <div className={`status-pill ${status.facebookToken ? 'active' : 'offline'}`}>
            <span className="pulse-dot"></span>
            {statusLoading ? '⏳ Checking...' : status.facebookToken ? 'API Linked' : 'API Offline'}
          </div>
          
          <button
            className={`system-toggle ${status.automation_enabled === 'false' ? 'paused' : 'active'}`}
            onClick={async () => {
              await fetch(`${API}/settings/toggle-automation`, { 
                method: 'POST', 
                body: JSON.stringify({ accountId }), 
                headers: {'Content-Type': 'application/json'} 
              });
              window.location.reload();
            }}
          >
            <span className="toggle-icon">{status.automation_enabled === 'false' ? '🛑' : '⚡'}</span>
            {status.automation_enabled === 'false' ? 'System Paused' : 'System Active'}
          </button>
        </div>
      </header>

      <div className="main-grid">
        <div className="left-column">
          <section className="glass-card premium-shadow">
            <div className="flex-between mb-2">
              <h3 className="section-title">✨ AI Control Center</h3>
              <span className="badge-id">ID: {accountId || 'None'}</span>
            </div>
            
            <div className="action-box">
              <p className="text-sm opacity-70 mb-2">Trigger an immediate AI-generated post to your Facebook Page feed.</p>
              <button
                className="btn-premium-fb w-full"
                onClick={() => handlePostNow()}
                disabled={loading || !status.facebookToken}
              >
                {loading ? '🚀 Processing...' : '📘 Generate & Post Now'}
              </button>
            </div>

            {!status.facebookToken && (
              <div className="alert-card mt-2">
                <div className="alert-icon">⚠️</div>
                <div className="alert-body">
                  <p><strong>Missing Page Token</strong></p>
                  <p className="text-xs">Your Facebook Page is not linked yet. Head to <strong>Settings</strong> to connect it.</p>
                </div>
              </div>
            )}
          </section>

          {history.length > 0 && history[0] && (
            <section className="glass-card mt-2 premium-shadow">
              <h3 className="section-title">📌 Latest Post</h3>
              <div className="latest-activity-box mt-1">
                <div className="activity-status">
                  <span className={`status-tag ${history[0].status}`}>
                    {history[0].status === 'success' ? 'Published' : history[0].status}
                  </span>
                  <span className="activity-time">{new Date(history[0].created_at).toLocaleTimeString()}</span>
                </div>
                <p className="activity-caption mt-1">{history[0].caption?.slice(0, 120)}...</p>
              </div>
            </section>
          )}
        </div>

        <div className="right-column">
          <section className="glass-card history-card premium-shadow">
            <div className="flex-between mb-2">
               <h3 className="section-title">📊 Publication History</h3>
               <div className="history-stats">
                 <span className="stat-pill">Total: {history.length}</span>
               </div>
            </div>
            
            <div className="history-list custom-scroll">
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className="history-card-item">
                  <div className="item-header">
                    <div className="item-meta">
                      <span className="item-date">{new Date(item.created_at).toLocaleDateString()}</span>
                      <span className="item-time">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className={`status-indicator ${item.status}`}></div>
                  </div>
                  
                  <div className="item-content">
                    <p className="caption-text">{item.caption}</p>
                    {item.error_message && (
                      <div className="error-note">❌ {item.error_message}</div>
                    )}
                  </div>

                  {item.image_urls && (() => {
                    try {
                      const urls = item.image_urls.startsWith('[') ? JSON.parse(item.image_urls) : item.image_urls.split(',');
                      return (
                        <div className="gallery-preview">
                          {urls.slice(0, 4).map((url, i) => (
                            <div key={i} className="gallery-thumb-box">
                               <img src={url} alt="FB Content" className="gallery-thumb" />
                            </div>
                          ))}
                          {urls.length > 4 && (
                            <div className="gallery-more">+{urls.length - 4}</div>
                          )}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
              )) : (
                <div className="empty-state">
                   <div className="empty-icon">📅</div>
                   <p>No publications found</p>
                   <p className="text-xs opacity-50">Automation runs will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .btn-premium-fb {
          background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }
        .btn-premium-fb:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 114, 255, 0.4);
          filter: brightness(1.1);
        }
        .btn-premium-fb:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(1);
        }
        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
        }
        .badge-id {
          background: rgba(255,255,255,0.1);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-family: monospace;
          color: #00c6ff;
        }
        .status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,0,0,0.2);
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .status-pill.active { color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
        .status-pill.offline { color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        .system-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 30px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .system-toggle.active { background: #10b981; color: white; }
        .system-toggle.paused { background: #ef4444; color: white; }
        .history-card-item {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.2s;
        }
        .history-card-item:hover {
          background: rgba(255,255,255,0.05);
          transform: translateX(4px);
        }
        .item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .item-meta { display: flex; flex-direction: column; }
        .item-date { font-size: 0.75rem; opacity: 0.5; font-weight: 600; }
        .item-time { font-size: 0.9rem; font-weight: 700; }
        .status-indicator { width: 10px; height: 10px; border-radius: 50%; }
        .status-indicator.success { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .status-indicator.failed { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
        .caption-text { font-size: 0.9rem; line-height: 1.5; opacity: 0.9; }
        .gallery-preview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; position: relative; }
        .gallery-thumb-box { aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,0.1); }
        .gallery-thumb { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: opacity 0.2s; }
        .gallery-thumb:hover { opacity: 1; }
        .gallery-more { position: absolute; right: 0; bottom: 0; background: rgba(0,0,0,0.8); width: 25%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); }
      ` }} />
    </div>
  );
};

export default FacebookDashboard;
