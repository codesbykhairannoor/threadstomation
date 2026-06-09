import React, { useState, useEffect } from 'react';

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
      body: JSON.stringify({ custom_prompt: newPrompt, accountId })
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
    <div className="config-panel animate-fade-in">
      <div className="main-grid">
        <div className="left-column">
          <section className="glass-card">
            <h3>Facebook Automation Schedule</h3>
            <p className="section-desc">Add custom prompts for your 5x daily automated posts.</p>
            
            <div className="add-schedule-box">
              <input 
                type="text" 
                placeholder="Topic: 5 dark facts about life..." 
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
              />
              <button className="btn btn-glow" onClick={addSchedule} disabled={!newPrompt}>
                Add to Queue
              </button>
            </div>

            <div className="schedule-list">
              {status.schedules.length > 0 ? status.schedules.map(s => (
                <div key={s.id} className="schedule-item">
                  <div className="schedule-info">
                    <span className="dot active"></span>
                    <p>{s.custom_prompt || 'Auto-generated content'}</p>
                  </div>
                  <button className="btn-icon delete" onClick={() => deleteSchedule(s.id)}>🗑️</button>
                </div>
              )) : (
                <div className="empty-state">No schedules added. The system will use default AI variation.</div>
              )}
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="glass-card">
            <h3>Link Facebook Page</h3>
            <p className="section-desc">Connect your Facebook Page using a Page Access Token.</p>
            
            <form onSubmit={handleSaveManualAccount} className="manual-form">
              <div className="form-group">
                <label>Page Name (Internal)</label>
                <input 
                  type="text" 
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)}
                  placeholder="e.g. Oneformind Facebook"
                />
              </div>
              <div className="form-group">
                <label>Facebook Page ID</label>
                <input 
                  type="text" 
                  value={manualPageId} 
                  onChange={e => setManualPageId(e.target.value)}
                  placeholder="1234567890..."
                />
              </div>
              <div className="form-group">
                <label>Page Access Token</label>
                <textarea 
                  rows={4}
                  value={manualToken} 
                  onChange={e => setManualToken(e.target.value)}
                  placeholder="EAA..."
                />
              </div>
              <button type="submit" className="btn btn-glow w-full" disabled={manualLoading}>
                {manualLoading ? '⏳ Linking...' : '🔗 Link Account'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FacebookConfigPanel;
