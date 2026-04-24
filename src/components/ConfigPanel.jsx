import React from 'react';

const ConfigPanel = ({ settings, setSettings, handleSaveSettings, status, fetchData, loading, newTime, setNewTime }) => {
  const API_BASE = ''; // Dynamic origin support

  const addSchedule = async () => {
    if (!newTime) return;
    await fetch(`${API_BASE}/api/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: newTime })
    });
    setNewTime('');
    fetchData();
  };

  const deleteSchedule = async (id) => {
    await fetch(`${API_BASE}/api/schedules/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Global Configuration ⚙️</h1>
        <p className="subtitle">Set your automation posting times here.</p>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
          <section className="glass-card mb-2">
            <h3>Automation Schedules</h3>
            <p className="section-desc">Times at which the AI will auto-post to all active platforms.</p>
            <div className="flex-gap mb-1">
              <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="no-margin" />
              <button className="btn btn-primary btn-sm" onClick={addSchedule}>Add Time</button>
            </div>
            
            <div className="schedule-list custom-scroll">
              {status.schedules && status.schedules.length > 0 ? status.schedules.map(s => (
                <div key={s.id} className="schedule-item glass-card-nested">
                  <span className="time-label">{s.time}</span>
                  <button className="btn-icon delete-btn" onClick={() => deleteSchedule(s.id)}>🗑️</button>
                </div>
              )) : (
                <div className="empty-state">No active schedules.</div>
              )}
            </div>
          </section>

          <section className="glass-card">
            <h3>AI Engine Settings</h3>
            <p className="section-desc">Configure your Gemini AI credentials and behavior.</p>
            
            <div className="input-group">
              <label>Gemini API Key</label>
              <input 
                type="password" 
                placeholder="Enter your Google AI API Key" 
                value={settings.gemini_api_key || ''} 
                onChange={e => setSettings({...settings, gemini_api_key: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label>AI Master Prompt</label>
              <textarea 
                rows="4"
                placeholder="Describe how the AI should write your posts..."
                value={settings.prompt || ''} 
                onChange={e => setSettings({...settings, prompt: e.target.value})}
              />
              <p className="text-xs opacity-50 mt-1">Tip: Be descriptive. E.g., "Write like a stoic philosopher about modern tech."</p>
            </div>

            <button className="btn btn-glow w-full" onClick={handleSaveSettings} disabled={loading}>
              {loading ? 'Saving...' : '💾 Save AI Configuration'}
            </button>
          </section>
      </div>
    </div>
  );
};

export default ConfigPanel;
