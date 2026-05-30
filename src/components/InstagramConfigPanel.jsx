import React, { useState, useEffect } from 'react';

const API = '/api/instagram';

const InstagramConfigPanel = ({ status, fetchData, loading, accountId, accounts }) => {
  const [newPrompt, setNewPrompt] = useState('');
  const [masterPrompt, setMasterPrompt] = useState('');
  const [savingMaster, setSavingMaster] = useState(false);

  // Manual configuration states
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualBusinessId, setManualBusinessId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

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

  const handleSaveManualAccount = async (e) => {
    e.preventDefault();
    if (!manualBusinessId.trim() || !manualToken.trim()) {
      alert('⚠️ Instagram Business ID and Access Token are required!');
      return;
    }
    setManualLoading(true);
    try {
      const res = await fetch(`${API}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName || 'Manual Instagram Account',
          instagram_business_id: manualBusinessId.trim(),
          access_token: manualToken.trim(),
        }),
      });
      if (res.ok) {
        alert('✅ Instagram account connected/updated successfully!');
        setManualName('');
        setManualBusinessId('');
        setManualToken('');
        setShowManual(false);
        window.location.reload();
      } else {
        const errData = await res.json();
        alert(`❌ Failed to save account: ${errData.error}`);
      }
    } catch (err) {
      alert(`❌ Error connecting account: ${err.message}`);
    } finally {
      setManualLoading(false);
    }
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
            Link your Instagram Business/Creator Account via Facebook Login OAuth or paste a custom Graph token manually.
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${acc.is_active ? 'badge-success' : 'badge-error'}`}>
                        {acc.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button 
                        className="btn-icon delete-btn" 
                        title="Disconnect Account"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to disconnect ${acc.name}?`)) {
                            await fetch(`${API}/accounts/${acc.id}`, { method: 'DELETE' });
                            window.location.reload();
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline w-full" onClick={handleConnect}>
                ➕ Connect via Facebook OAuth
              </button>
            </div>
          ) : (
            <button className="btn btn-glow w-full" onClick={handleConnect}>
              📸 Connect Instagram Account via Facebook Login
            </button>
          )}

          <div style={{ margin: '1rem 0', textAlign: 'center', opacity: 0.5 }}>— OR —</div>

          <button 
            type="button" 
            className="btn btn-outline w-full" 
            onClick={() => setShowManual(!showManual)}
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            {showManual ? '🙈 Hide Manual Setup' : '⚙️ Set Up Manually (Custom Token)'}
          </button>

          {showManual && (
            <form onSubmit={handleSaveManualAccount} style={{ marginTop: '1rem' }} className="glass-card-nested animate-fade-in">
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="text-xs">Account Name / Label</label>
                <input 
                  type="text" 
                  placeholder="e.g., adhlil.co" 
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="text-xs">Instagram Business Account ID *</label>
                <input 
                  type="text" 
                  placeholder="e.g., 17841473319799282" 
                  value={manualBusinessId} 
                  onChange={e => setManualBusinessId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="text-xs">Instagram Graph Access Token *</label>
                <textarea 
                  rows="3"
                  placeholder="Paste your long-lived access token here..." 
                  value={manualToken} 
                  onChange={e => setManualToken(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-glow w-full" 
                disabled={manualLoading}
              >
                {manualLoading ? 'Saving...' : '💾 Save Account Settings'}
              </button>
            </form>
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
