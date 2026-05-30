import React, { useState, useEffect } from 'react';

const API = '/api/instagram';

const InstagramConfigPanel = ({ status, fetchData, loading, accountId, accounts }) => {
  const [newPrompt, setNewPrompt] = useState('');
  const [masterPrompt, setMasterPrompt] = useState('');
  const [savingMaster, setSavingMaster] = useState(false);

  useEffect(() => {
    // Load Instagram master prompt from settings
    fetch(`${API}/settings`)
      .then(r => r.json())
      .then(data => setMasterPrompt(data.instagram_master_prompt || ''))
      .catch(() => {});
  }, []);

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

  const toggleSchedule = async (id) => {
    await fetch(`${API}/schedules/${id}/toggle`, { method: 'POST' });
    fetchData();
  };

  const saveMasterPrompt = async () => {
    setSavingMaster(true);
    try {
      await fetch(`${API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagram_master_prompt: masterPrompt })
      });
      alert('✅ Instagram personality saved!');
    } catch (e) {
      alert('❌ Failed to save.');
    } finally {
      setSavingMaster(false);
    }
  };

  // Generate the OAuth link via Facebook
  const handleConnect = () => {
    window.location.href = `${API}/auth?accountName=Instagram Account`;
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Instagram Configuration ⚙️</h1>
        <p className="subtitle">Manage your Instagram bot settings and automation slots.</p>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>

        {/* OAuth Connect */}
        <section className="glass-card mb-2">
          <h3>🔗 Connect Instagram Account</h3>
          <p className="section-desc">
            Link your Instagram Business/Creator Account via Facebook Login OAuth. The bot will automatically publish posts to your feed.
          </p>
          {accounts.length > 0 ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                {accounts.map(acc => (
                  <div key={acc.id} className="glass-card-nested flex-between" style={{ marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{acc.name}</span>
                      <span className="time" style={{ marginLeft: '0.5rem' }}>ID: {acc.instagram_business_id?.slice(0, 12)}...</span>
                    </div>
                    <span className={`badge ${acc.is_active ? 'badge-success' : 'badge-error'}`}>
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline w-full" onClick={handleConnect}>
                ➕ Connect Another Account
              </button>
            </div>
          ) : (
            <button className="btn btn-glow w-full" onClick={handleConnect}>
              📸 Connect Instagram Account via Facebook Login
            </button>
          )}
        </section>

        {/* Master Prompt */}
        <section className="glass-card mb-2">
          <h3>🤖 AI Personality (Global)</h3>
          <p className="section-desc">
            Define the content style and caption persona for all Instagram posts.
          </p>
          <div className="input-group">
            <textarea
              rows="5"
              placeholder="Example: You are a travel influencer. Your posts showcase beautiful scenery and provide brief historical facts about the location. Tone: enthusiastic, adventurous, and descriptive."
              value={masterPrompt}
              onChange={e => setMasterPrompt(e.target.value)}
            />
          </div>
          <button className="btn btn-glow w-full" onClick={saveMasterPrompt} disabled={savingMaster}>
            {savingMaster ? 'Saving...' : '💾 Save AI Personality'}
          </button>
        </section>

        {/* Automation Schedules */}
        <section className="glass-card">
          <h3>🎯 Posting Slots / Content Directions</h3>
          <p className="section-desc">
            Define content prompts. The bot randomly selects one active slot per automated run.
          </p>

          {/* Add form */}
          <div className="add-schedule-form glass-card-nested mb-2">
            <div className="input-group">
              <label className="text-xs">Content Prompt</label>
              <textarea
                rows="2"
                placeholder="E.g., '10 travel hacks for budget travelers' or 'Top 5 must-visit cafes in Bali'"
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary w-full mt-1"
              onClick={addSchedule}
              disabled={!newPrompt.trim()}
            >
              ➕ Add Posting Slot
            </button>
          </div>

          {/* Slot list */}
          <div className="schedule-list custom-scroll">
            {status.schedules && status.schedules.length > 0 ? status.schedules.map((s, idx) => (
              <div key={s.id} className={`schedule-item glass-card-nested ${s.is_active === 0 ? 'inactive' : ''}`}>
                <div className="schedule-info">
                  <div className="flex-between">
                    <div className="flex-gap">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={s.is_active === 1}
                          onChange={() => toggleSchedule(s.id)}
                        />
                        <span className="slider round" />
                      </label>
                      <span className="time-label">Slot #{idx + 1}</span>
                    </div>
                    <button className="btn-icon delete-btn" onClick={() => deleteSchedule(s.id)}>🗑️</button>
                  </div>
                  <div className="mt-1">
                    {s.custom_prompt ? (
                      <p className="schedule-prompt-preview">{s.custom_prompt}</p>
                    ) : (
                      <p className="schedule-prompt-preview opacity-50"><i>(Uses AI Personality/Master Prompt)</i></p>
                    )}
                    {s.last_run_date && (
                      <p className="time" style={{ marginTop: '4px' }}>Last run: {s.last_run_date}</p>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="empty-state">No Instagram slots yet. Add one above to start automating!</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InstagramConfigPanel;
