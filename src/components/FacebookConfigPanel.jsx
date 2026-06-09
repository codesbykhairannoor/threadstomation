import React, { useState, useEffect } from 'react';

const API = '/api/facebook';

const FacebookConfigPanel = ({ status, fetchData, loading, accountId, accounts }) => {
  const [newPrompt, setNewPrompt] = useState('');
  
  // Persona Configuration States
  const [masterPrompt, setMasterPrompt] = useState('');
  const [visualTheme, setVisualTheme] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [preferredLayout, setPreferredLayout] = useState(0);
  const [savingConfig, setSavingConfig] = useState(false);

  // Manual configuration states
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPageId, setManualPageId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Load configuration from the selected account
  useEffect(() => {
    const acc = accounts.find(a => a.id === accountId);
    if (acc) {
      setMasterPrompt(acc.master_prompt || '');
      setVisualTheme(acc.visual_theme || '');
      setColorPalette(acc.color_palette || '');
      setPreferredLayout(acc.preferred_layout || 0);
    }
  }, [accountId, accounts]);

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

  const saveAccountConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch(`${API}/accounts/${accountId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          master_prompt: masterPrompt,
          visual_theme: visualTheme,
          color_palette: colorPalette,
          preferred_layout: parseInt(preferredLayout)
        })
      });
      if (res.ok) {
        alert('✅ Facebook account configuration saved!');
        window.location.reload(); 
      } else {
        const err = await res.json();
        alert(`❌ Failed to save: ${err.error}`);
      }
    } catch (e) {
      alert('❌ Failed to save.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleConnect = () => {
    window.location.href = `${API}/auth`;
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
        alert('✅ Facebook page connected/updated successfully!');
        setManualName('');
        setManualPageId('');
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
        <h1>Facebook Configuration ⚙️</h1>
        <p className="subtitle">Manage your Facebook Page settings and automation slots.</p>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>

        {/* OAuth Connect */}
        <section className="glass-card mb-2">
          <h3>🔗 Connect Facebook Page</h3>
          <p className="section-desc">
            Link your Facebook Page via Facebook Login OAuth (Recommended) or set up manually.
          </p>
          {accounts.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {accounts.map(acc => (
                <div key={acc.id} className="glass-card-nested flex-between" style={{ marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{acc.name}</span>
                    <span className="time" style={{ marginLeft: '0.5rem' }}>ID: {acc.facebook_page_id}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${acc.is_active ? 'badge-success' : 'badge-error'}`}>
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button 
                      className="btn-icon delete-btn" 
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
          )}

          <button className="btn btn-glow w-full" onClick={handleConnect} style={{ background: 'linear-gradient(135deg, #00c6ff, #0072ff)', padding: '12px', fontSize: '15px' }}>
            📘 Connect via Facebook Login (Auto-Link)
          </button>

          <div style={{ margin: '1.5rem 0 1rem', textAlign: 'center', opacity: 0.3, fontSize: '12px' }}>— ADVANCED SETUP —</div>

          <button 
            type="button" 
            className="btn btn-outline w-full" 
            onClick={() => setShowManual(!showManual)}
            style={{ borderColor: 'rgba(255,255,255,0.05)', fontSize: '13px', opacity: 0.7 }}
          >
            {showManual ? '🙈 Hide Manual Setup' : '⚙️ Setup Manually (Custom Token)'}
          </button>

          {showManual && (
            <form onSubmit={handleSaveManualAccount} style={{ marginTop: '1rem' }} className="glass-card-nested animate-fade-in">
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="text-xs">Page Name / Label</label>
                <input 
                  type="text" 
                  placeholder="e.g., Oneformind Facebook" 
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="text-xs">Facebook Page ID *</label>
                <input 
                  type="text" 
                  placeholder="e.g., 1044012238797561" 
                  value={manualPageId} 
                  onChange={e => setManualPageId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="text-xs">Page Access Token *</label>
                <textarea 
                  rows="3"
                  placeholder="Paste your long-lived page token here..." 
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
                style={{ background: 'linear-gradient(135deg, #00c6ff, #0072ff)' }}
              >
                {manualLoading ? 'Saving...' : '💾 Establish Connection'}
              </button>
            </form>
          )}
        </section>

        {/* Account Persona & UI Config */}
        {accountId && (
          <section className="glass-card mb-2">
            <h3>🤖 AI Persona & Visuals (This Page)</h3>
            <p className="section-desc">
              Define the unique personality, visual style, and layout specifically for this Facebook Page.
            </p>
            
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs">Master Prompt (Personality)</label>
              <textarea
                rows="4"
                placeholder="Example: You are a tech advisor. Tone: professional, informative..."
                value={masterPrompt}
                onChange={e => setMasterPrompt(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs">Visual Theme (Background Image Prompt)</label>
              <textarea
                rows="2"
                placeholder="Example: Modern office, clean lines, high-tech background..."
                value={visualTheme}
                onChange={e => setVisualTheme(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs">Color Palette (JSON Array)</label>
              <textarea
                rows="2"
                placeholder='[{"bg":"#0f172a","text":"white","accent":"#00c6ff"}]'
                value={colorPalette}
                onChange={e => setColorPalette(e.target.value)}
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs">Preferred Layout (-1, 0, 1, or 2)</label>
              <select 
                value={preferredLayout} 
                onChange={e => setPreferredLayout(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}
              >
                <option value="-1">-1 - Randomize Everything</option>
                <option value="0">0 - Default Central Bold</option>
                <option value="1">1 - Left Aligned Editorial</option>
                <option value="2">2 - Startup Educational Bento</option>
              </select>
            </div>

            <button className="btn btn-glow w-full" onClick={saveAccountConfig} disabled={savingConfig} style={{ background: 'linear-gradient(135deg, #00c6ff, #0072ff)' }}>
              {savingConfig ? 'Saving...' : '💾 Save Account Configurations'}
            </button>
          </section>
        )}

        {/* Automation Schedules */}
        {accountId && (
          <section className="glass-card">
            <h3>🎯 Posting Slots / Content Directions</h3>
            <p className="section-desc">
              Define specific topics. The bot randomly selects one active slot per automated run.
            </p>

            <div className="add-schedule-form glass-card-nested mb-2">
              <div className="input-group">
                <label className="text-xs">Content Prompt</label>
                <textarea
                  rows="2"
                  placeholder="E.g., '10 facts about artificial intelligence'"
                  value={newPrompt}
                  onChange={e => setNewPrompt(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary w-full mt-1"
                onClick={addSchedule}
                disabled={!newPrompt.trim()}
                style={{ background: '#00c6ff' }}
              >
                ➕ Add Posting Slot
              </button>
            </div>

            <div className="schedule-list custom-scroll">
              {status.schedules && status.schedules.length > 0 ? status.schedules.map((s, idx) => (
                <div key={s.id} className="schedule-item glass-card-nested">
                  <div className="schedule-info">
                    <div className="flex-between">
                      <span className="time-label">Slot #{idx + 1}</span>
                      <button className="btn-icon delete-btn" onClick={() => deleteSchedule(s.id)}>🗑️</button>
                    </div>
                    <div className="mt-1">
                      <p className="schedule-prompt-preview">{s.custom_prompt || '(AI Creative Mode)'}</p>
                      {s.last_run_date && (
                        <p className="time" style={{ marginTop: '4px' }}>Last run: {s.last_run_date}</p>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="empty-state">No Facebook slots yet. Add one above!</div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default FacebookConfigPanel;
