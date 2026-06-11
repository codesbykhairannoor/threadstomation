import React, { useState } from 'react';

const BlueskyDashboard = ({ status, fetchData, loading, accountId, accounts, handlePostNow, history }) => {
  const [newPrompt, setNewPrompt] = useState('');

  const handleAddSchedule = async () => {
    if (!newPrompt.trim()) return;
    await fetch('/api/bluesky/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_prompt: newPrompt, accountId })
    });
    setNewPrompt('');
    fetchData();
  };

  const handleDeleteSchedule = async (id) => {
    await fetch(`/api/bluesky/schedules/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleAutomation = async () => {
    await fetch('/api/bluesky/settings/toggle-automation', { method: 'POST' });
    fetchData();
  };

  if (!accountId || accounts.length === 0) {
    return (
      <div className="glass-card text-center mt-2">
        <h2>No Bluesky Account Connected</h2>
        <p className="text-muted mt-2">Please go to Settings to connect your Bluesky account.</p>
      </div>
    );
  }

  const { schedules, blueskyToken, automation_enabled } = status;
  const isAutoEnabled = automation_enabled === 'true';

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h1>Bluesky Dashboard</h1>
          <p className="text-muted">Manage your AI-powered posts for AT Protocol.</p>
        </div>
        <div className="status-header">
          {blueskyToken 
            ? <span className="badge badge-success">✓ Bluesky API Connected</span>
            : <span className="badge badge-error">⚠ Bluesky Not Connected</span>
          }
          <span className={`badge ${isAutoEnabled ? 'badge-success' : 'badge-neutral'}`}>
            Auto: {isAutoEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      <div className="main-grid">
        <div className="flex-col gap-1">
          <div className="glass-card">
            <h3>Quick Post</h3>
            <p className="section-desc">Instantly generate and publish a post to Bluesky.</p>
            <button 
              className="btn btn-glow w-full"
              onClick={() => handlePostNow(null)}
              disabled={loading || !blueskyToken}
            >
              {loading ? '⏳ Posting to Bluesky...' : '🦋 Auto-Generate & Post Now'}
            </button>
            <div className="mt-2 text-center text-xs opacity-50">
              Posts will include AI-generated text and images (if applicable) using affiliate links.
            </div>
          </div>

          <div className="glass-card">
            <h3>Bot Automation</h3>
            <p className="section-desc">Manage background cron job status.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px' }}>
              <span style={{ fontWeight: 'bold' }}>Global AI Automation</span>
              <button 
                className={`btn btn-xs ${isAutoEnabled ? 'btn-outline' : 'btn-primary'}`}
                onClick={toggleAutomation}
              >
                {isAutoEnabled ? 'Pause Automation' : 'Resume Automation'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-col gap-1">
          <div className="glass-card">
            <h3>Custom Prompts Queue ({schedules?.length || 0})</h3>
            <p className="section-desc">Add specific topics for the bot to write about. If empty, it uses random affiliate topics.</p>
            
            <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
              <input
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
                placeholder="e.g. Write about 3 useful AI tools for marketers..."
                onKeyPress={e => e.key === 'Enter' && handleAddSchedule()}
              />
              <button className="btn btn-primary" onClick={handleAddSchedule}>Add</button>
            </div>

            <div className="history-list" style={{ maxHeight: '300px' }}>
              {schedules?.map(s => (
                <div key={s.id} className="history-item" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9rem', width: '80%' }}>{s.custom_prompt}</div>
                  <button className="btn btn-outline btn-xs" onClick={() => handleDeleteSchedule(s.id)}>Del</button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3>Recent Posts</h3>
            <div className="history-list" style={{ maxHeight: '400px' }}>
              {history.length === 0 ? <p className="text-muted text-center py-4">No post history yet.</p> : null}
              {history.map(h => (
                <div key={h.id} className="history-item">
                  <div className="history-meta">
                    <span className="time">{new Date(h.created_at).toLocaleString()}</span>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span className={`status-dot ${h.status === 'success' ? 'success' : ''}`} style={{ background: h.status !== 'success' ? 'var(--error)' : '' }} />
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{h.status}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '8px', lineHeight: '1.4', opacity: 0.9 }}>
                    {h.caption?.length > 100 ? h.caption.substring(0, 100) + '...' : h.caption || 'Manual Post'}
                  </p>
                  {h.error_message && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '5px', borderRadius: '5px' }}>
                      Error: {h.error_message}
                    </div>
                  )}
                  {h.post_id && (
                    <a href={h.post_id} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                      View on Bluesky
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueskyDashboard;
