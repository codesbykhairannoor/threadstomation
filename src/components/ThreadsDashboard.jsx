import React from 'react';

const ThreadsDashboard = ({ status, handlePostNow, history, loading }) => {
  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Threads Management 🧵</h1>
        <div className="status-header">
          <span className={`badge ${status.threadsToken ? 'badge-success' : 'badge-error'}`}>
            {status.threadsToken ? 'API Linked' : 'API Offline'}
          </span>
        </div>
      </header>

      <div className="main-grid">
        <div className="left-column">
          <section className="glass-card mt-2">
            <h3>System Status</h3>
            <p className="section-desc">Threads API automation is active and running.</p>
            <div className="status-item">
              <span>Next Schedule:</span>
              <strong>{status.schedules && status.schedules.length > 0 ? 'Active' : 'No schedules set'}</strong>
            </div>
            <div className="status-item mt-1">
              <span>Bot Engine:</span>
              <strong>Disabled (Using API)</strong>
            </div>
          </section>
          <section className="glass-card mt-2">
            <h3>Quick Actions</h3>
            <div className="flex-col gap-1">
              <button className="btn btn-glow w-full" onClick={() => handlePostNow(false)} disabled={loading}>
                🚀 Generate & Post AI Now
              </button>
              <button className="btn btn-outline w-full" onClick={() => handlePostNow(true)} disabled={loading}>
                🧪 Manual Test Post
              </button>
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="glass-card history-card">
            <h3>Post History</h3>
            <div className="history-list">
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-meta">
                    <span className="time">{new Date(item.created_at).toLocaleString()}</span>
                    <span className={`status-dot ${item.status}`}></span>
                  </div>
                  <p className="content-pill">{item.content}</p>
                </div>
              )) : (
                <div className="empty-state">No recent activity on Threads.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ThreadsDashboard;
