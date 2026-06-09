import React, { useState } from 'react';

const API = '/api/facebook';

const FacebookConfigPanel = ({ status, fetchData, loading, accountId, accounts }) => {
  const [newPrompt, setNewPrompt] = useState('');
  
  // Manual configuration states
  const [manualName, setManualName] = useState('');
  const [manualPageId, setManualPageId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const addSchedule = async () => {
    await fetch(`${API}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_prompt: newPrompt, account_id: accountId })
    });
    setNewPrompt('');
    fetchData();
  };

  const deleteSchedule = async (id) => {
    await fetch(`${API}/schedules/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleSaveManualAccount = async (e) => {
    e.preventDefault();
    if (!manualPageId.trim() || !manualToken.trim()) {
      alert('⚠️ Facebook Page ID and Access Token are required!');
      return;
    }
    setManualLoading(true);
    try {
      const res = await fetch(`${API}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName || 'Manual Facebook Page',
          pageId: manualPageId.trim(),
          accessToken: manualToken.trim(),
        }),
      });
      if (res.ok) {
        alert('✅ Facebook Page linked successfully!');
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`❌ Failed: ${err.error}`);
      }
    } catch (e) {
      alert('❌ Server error.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="config-panel animate-fade-in" style={{ padding: '20px' }}>
      <header className="config-header" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #00c6ff, #0072ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Platform Configuration
        </h2>
        <p className="opacity-70">Optimize your Facebook automation settings and account links.</p>
      </header>

      <div className="main-grid">
        <div className="left-column">
          <section className="glass-card premium-shadow">
            <h3 className="section-title mb-1">📅 Content Pipeline</h3>
            <p className="section-desc mb-2">Queue up specific topics for the AI. If empty, the system generates creative content automatically.</p>
            
            <div className="queue-input-group">
              <input 
                type="text" 
                className="premium-input"
                placeholder="Topic: Psychological hacks for productivity..." 
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
              />
              <button className="btn-add-queue" onClick={addSchedule} disabled={!newPrompt}>
                Add to Queue
              </button>
            </div>

            <div className="schedule-list custom-scroll mt-2" style={{ maxHeight: '400px' }}>
              {status.schedules && status.schedules.length > 0 ? status.schedules.map(s => (
                <div key={s.id} className="queue-item animate-slide-right">
                  <div className="queue-content">
                    <span className="queue-status-dot"></span>
                    <p className="queue-text">{s.custom_prompt || 'AI Creative Mode'}</p>
                  </div>
                  <button className="btn-delete-item" onClick={() => deleteSchedule(s.id)}>🗑️</button>
                </div>
              )) : (
                <div className="empty-state-config">
                   <p>No custom schedules.</p>
                   <p className="text-xs opacity-50">System will use default AI prompts.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="glass-card premium-shadow">
            <h3 className="section-title mb-1">🔗 Account Connection</h3>
            <p className="section-desc mb-2">Connect a new Facebook Page or update existing tokens.</p>
            
            <form onSubmit={handleSaveManualAccount} className="fb-professional-form">
              <div className="form-row">
                <label className="form-label">Professional Name</label>
                <input 
                  type="text" 
                  className="premium-input"
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)}
                  placeholder="e.g. My Awesome Page"
                />
              </div>

              <div className="form-row">
                <label className="form-label">Facebook Page ID</label>
                <input 
                  type="text" 
                  className="premium-input"
                  value={manualPageId} 
                  onChange={e => setManualPageId(e.target.value)}
                  placeholder="Numerical ID (e.g. 104401223...)"
                />
              </div>

              <div className="form-row">
                <label className="form-label">Page Access Token</label>
                <textarea 
                  className="premium-textarea"
                  rows={4}
                  value={manualToken} 
                  onChange={e => setManualToken(e.target.value)}
                  placeholder="EAAB..."
                />
                <p className="text-xs opacity-50 mt-1">Get this from Meta for Developers Portal.</p>
              </div>

              <button type="submit" className="btn-fb-connect w-full" disabled={manualLoading}>
                {manualLoading ? '⏳ Synchronizing...' : '🔗 Establish Connection'}
              </button>
            </form>
          </section>

          <section className="glass-card mt-2 premium-shadow info-card">
            <h4 style={{ color: '#00c6ff', fontWeight: '700' }}>💡 Help Tip</h4>
            <p className="text-xs mt-1 opacity-80">
              For best results, use a <strong>Permanent Page Access Token</strong> so you don't have to re-link your account every 60 days.
            </p>
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .section-title { font-size: 1.1rem; font-weight: 700; color: white; display: flex; align-items: center; gap: 10px; }
        .premium-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        .premium-input:focus {
          background: rgba(255,255,255,0.08);
          border-color: #00c6ff;
          outline: none;
          box-shadow: 0 0 15px rgba(0, 198, 255, 0.2);
        }
        .premium-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 0.85rem;
          font-family: monospace;
          resize: none;
        }
        .premium-textarea:focus { border-color: #00c6ff; outline: none; }
        
        .queue-input-group { display: flex; gap: 10px; }
        .btn-add-queue {
          background: #00c6ff;
          color: white;
          border: none;
          padding: 0 20px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .queue-item {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .queue-content { display: flex; align-items: center; gap: 12px; }
        .queue-status-dot { width: 8px; height: 8px; background: #00c6ff; border-radius: 50%; box-shadow: 0 0 8px #00c6ff; }
        .queue-text { font-size: 0.9rem; font-weight: 500; }
        .btn-delete-item { background: transparent; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.5; transition: opacity 0.2s; }
        .btn-delete-item:hover { opacity: 1; }
        
        .fb-professional-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 0.8rem; font-weight: 600; opacity: 0.6; margin-left: 4px; }
        
        .btn-fb-connect {
          background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);
          transition: transform 0.2s;
        }
        .btn-fb-connect:hover { transform: translateY(-2px); filter: brightness(1.1); }
        
        .info-card { background: linear-gradient(135deg, rgba(0, 198, 255, 0.1), transparent); border-color: rgba(0, 198, 255, 0.2); }
      ` }} />
    </div>
  );
};

export default FacebookConfigPanel;
