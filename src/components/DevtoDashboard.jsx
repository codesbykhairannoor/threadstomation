import React, { useState } from 'react';

const API = '/api/devto';

const DevtoDashboard = ({ status, fetchData, loading, accountId, accounts, handlePostNow, history }) => {
  const [prompt, setPrompt] = useState('');
  const [customPostPrompt, setCustomPostPrompt] = useState('');

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      const res = await fetch(`${API}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, custom_prompt: prompt })
      });
      if (res.ok) {
        setPrompt('');
        fetchData();
      } else {
        const err = await res.json();
        alert('Failed: ' + err.error);
      }
    } catch (e) {
      alert('Error adding schedule: ' + e.message);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const res = await fetch(`${API}/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete schedule');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const toggleAutomation = async () => {
    try {
      await fetch(`${API}/settings/toggle-automation`, { method: 'POST' });
      fetchData();
    } catch (e) {
      alert('Failed to toggle automation: ' + e.message);
    }
  };

  const isAutomationEnabled = status.automation_enabled === 'true';

  if (!accountId || accounts.length === 0) {
    return (
      <div className="dashboard-content flex-center">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h2>No Devto Blog Connected</h2>
          <p>Please go to Settings and connect your Devto blog via OAuth.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Devto Dashboard 📝</h1>
            <p className="subtitle">Automate your Devto photo sets with AI.</p>
          </div>
          <button 
            className={`btn ${isAutomationEnabled ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleAutomation}
          >
            {isAutomationEnabled ? 'Pause Automation ⏸️' : 'Resume Automation ▶️'}
          </button>
        </div>
      </header>

      <div className="main-grid">
        <div className="left-column">
          <section className="glass-card">
            <h3>🚀 Post Now (Manual)</h3>
            <p className="section-desc">Trigger a post immediately to your Devto blog.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Topic / Affiliate URL (e.g. make.com)"
                className="input-field"
                style={{ flex: 1 }}
                value={customPostPrompt}
                onChange={e => setCustomPostPrompt(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={() => handlePostNow(customPostPrompt)}
                disabled={loading}
              >
                {loading ? 'Posting...' : 'Post Now ✨'}
              </button>
            </div>
            {status.lastPost && (
              <div className="status-badge success" style={{ marginTop: '15px' }}>
                Last Post: {new Date(status.lastPost.created_at).toLocaleString()}
              </div>
            )}
          </section>

          <section className="glass-card">
            <h3>⏰ Schedule Queue</h3>
            <p className="section-desc">Add custom prompts for the cron job to pick from randomly.</p>

            <form onSubmit={handleAddSchedule} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Custom Prompt (e.g., Promote wise.com with a hook)"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">+</button>
            </form>

            <div className="schedule-list">
              {status.schedules?.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: 'center', margin: '20px 0' }}>No schedules yet.</p>
              ) : (
                status.schedules?.map(s => (
                  <div key={s.id} className="schedule-item animate-fade-in">
                    <div className="schedule-info">
                      <strong>Custom Prompt:</strong>
                      <p style={{ fontSize: '13px', opacity: 0.8, margin: '4px 0' }}>{s.custom_prompt}</p>
                      <span className="time-badge">
                        Last Run: {s.last_run_date || 'Never'}
                      </span>
                    </div>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 10px', minWidth: 'auto' }}
                      onClick={() => handleDeleteSchedule(s.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="glass-card">
            <h3>📜 Post History</h3>
            <div className="history-list">
              {history.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: 'center', padding: '20px 0' }}>No post history yet.</p>
              ) : (
                history.map(item => (
                  <div key={item.id} className="history-item animate-fade-in" style={{ borderLeftColor: item.status === 'success' ? '#10b981' : '#ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: item.status === 'success' ? '#10b981' : '#ef4444' }}>
                        {item.status.toUpperCase()}
                      </strong>
                      <span style={{ fontSize: '12px', opacity: 0.6 }}>
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    {item.status === 'success' && item.image_urls && (
                      <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '5px' }}>
                        {JSON.parse(item.image_urls).map((url, i) => (
                          <img key={i} src={url} alt={`Slide ${i}`} style={{ height: '60px', borderRadius: '4px' }} />
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: '13px', margin: '0' }}>
                      {item.status === 'success' ? (
                        <>Post ID: <a href={`https://devto.com`} target="_blank" rel="noreferrer" style={{color: '#60a5fa'}}>{item.post_id}</a></>
                      ) : (
                        item.error_message
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DevtoDashboard;
