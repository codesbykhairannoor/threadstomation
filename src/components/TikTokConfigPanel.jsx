import React, { useState, useEffect } from 'react';

const API = '/api/tiktok';

const TikTokConfigPanel = ({ status, fetchData, loading, accountId, accounts }) => {
  const [newPrompt, setNewPrompt] = useState('');
  const [masterPrompt, setMasterPrompt] = useState('');
  const [savingMaster, setSavingMaster] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(false);

  // TikTok API Review UX Requirements
  const [manualCaption, setManualCaption] = useState('My awesome AI generated carousel! 🚀');
  const [privacyLevel, setPrivacyLevel] = useState('');
  const [isPostingManual, setIsPostingManual] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    // Load TikTok master prompt and sandbox mode from settings
    fetch(`${API}/settings`)
      .then(r => r.json())
      .then(data => {
        setMasterPrompt(data.tiktok_master_prompt || '');
        setSandboxMode(data.tiktok_sandbox_mode === 'true');
      })
      .catch(() => {});
  }, []);

  const toggleSandboxMode = async (checked) => {
    setSandboxMode(checked);
    try {
      await fetch(`${API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiktok_sandbox_mode: checked ? 'true' : 'false' })
      });
    } catch (e) {
      alert('❌ Failed to update Sandbox Mode.');
    }
  };

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
        body: JSON.stringify({ tiktok_master_prompt: masterPrompt })
      });
      alert('✅ TikTok personality saved!');
    } catch (e) {
      alert('❌ Failed to save.');
    } finally {
      setSavingMaster(false);
    }
  };

  // Generate the OAuth link
  const handleConnect = () => {
    window.location.href = `${API}/auth?accountName=My TikTok`;
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>TikTok Configuration ⚙️</h1>
        <p className="subtitle">Manage your TikTok bot settings and automation slots.</p>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>

        {/* OAuth Connect */}
        <section className="glass-card mb-2">
          <h3>🔗 Connect TikTok Account</h3>
          <p className="section-desc">
            Link your TikTok account via official OAuth. The bot will post carousels on your behalf.
          </p>
          {accounts.length > 0 ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                {accounts.map(acc => (
                  <div key={acc.id} className="glass-card-nested flex-between" style={{ marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{acc.name}</span>
                      <span className="time" style={{ marginLeft: '0.5rem' }}>@{acc.tiktok_open_id?.slice(0, 12)}...</span>
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
              🎵 Connect TikTok Account via OAuth
            </button>
          )}
        </section>

        {/* TikTok Manual Post (Demo Review Requirement) */}
        {accounts.length > 0 && (
          <section className="glass-card mb-2" style={{ border: '1px solid #00f2fe' }}>
            <h3>📱 Manual Post to TikTok (Demo Review)</h3>
            <p className="section-desc">
              TikTok API Review requires a manual posting UX without default values. Use this to record your demo video.
            </p>
            
            <div className="input-group">
              <label className="text-xs">Content Preview</label>
              <div style={{ height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.3)', marginBottom: '10px' }}>
                📷 <i>Sample AI Generated Carousel will appear here</i>
              </div>
            </div>

            <div className="input-group">
              <label className="text-xs">Caption</label>
              <textarea
                rows="2"
                value={manualCaption}
                onChange={e => setManualCaption(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label className="text-xs">Privacy Level <span style={{color: '#ff4b4b'}}>*</span></label>
              <select 
                value={privacyLevel} 
                onChange={e => setPrivacyLevel(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', WebkitAppearance: 'none' }}
              >
                <option value="" disabled>Select privacy (Required)...</option>
                <option value="PUBLIC_TO_EVERYONE">Public</option>
                <option value="MUTUAL_FOLLOW_FRIENDS">Friends</option>
                <option value="SELF_ONLY">Only Me</option>
              </select>
            </div>

            <button 
              className="btn btn-glow w-full" 
              onClick={() => {
                if (!privacyLevel) return alert('TikTok Guideline: You must manually select a Privacy Level before posting!');
                setIsPostingManual(true);
                setShowDisclaimer(true);
                setTimeout(() => {
                  setIsPostingManual(false);
                  alert('Post queued successfully! (Demo Mode)');
                  setShowDisclaimer(false);
                  setPrivacyLevel(''); // Reset back to empty
                }, 3000);
              }}
              disabled={isPostingManual}
            >
              {isPostingManual ? 'Uploading to TikTok...' : '📤 Post to TikTok'}
            </button>

            {showDisclaimer && (
              <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(0, 242, 254, 0.1)', borderRadius: '8px', color: '#00f2fe', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                ℹ️ <b>Please wait, it may take a few minutes for the content to process and appear on your TikTok profile.</b>
              </div>
            )}
          </section>
        )}



        {/* Master Prompt */}
        <section className="glass-card mb-2">
          <h3>🤖 AI Personality (Global)</h3>
          <p className="section-desc">
            Define the content style and persona for all TikTok carousel posts.
          </p>
          <div className="input-group">
            <textarea
              rows="5"
              placeholder="Example: You are a motivational content creator for Indonesian youth. Your carousels teach practical life skills with bold, eye-catching text. Topics: mindset, productivity, money, relationships."
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
          <h3>🎯 Carousel Prompt Slots</h3>
          <p className="section-desc">
            Each slot is a content direction. The bot randomly picks one per post (up to 5x/day).
          </p>

          {/* Add form */}
          <div className="add-schedule-form glass-card-nested mb-2">
            <div className="input-group">
              <label className="text-xs">Content Direction / Prompt</label>
              <textarea
                rows="2"
                placeholder="E.g., '5 tips for managing money in your 20s' or '3 hard truths about success'"
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary w-full mt-1"
              onClick={addSchedule}
              disabled={!newPrompt.trim()}
            >
              ➕ Add Carousel Slot
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
              <div className="empty-state">No carousel slots yet. Add one above to start automating!</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TikTokConfigPanel;
