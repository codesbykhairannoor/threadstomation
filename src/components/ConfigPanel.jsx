import React from 'react';

const ConfigPanel = ({ settings, setSettings, handleSaveSettings, status, fetchData, loading, newTime, setNewTime, accountId }) => {
  const API_BASE = ''; // Dynamic origin support
  const [newPrompt, setNewPrompt] = React.useState('');
  const [newImage, setNewImage] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null);
  const [editPrompt, setEditPrompt] = React.useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addSchedule = async () => {
    if (!newTime) return;
    await fetch(`${API_BASE}/api/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        time: newTime,
        custom_prompt: newPrompt,
        image: newImage,
        accountId: accountId
      })
    });
    setNewTime('');
    setNewPrompt('');
    setNewImage(null);
    fetchData();
  };

  const deleteSchedule = async (id) => {
    await fetch(`${API_BASE}/api/schedules/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const updateSchedule = async (id) => {
    await fetch(`${API_BASE}/api/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_prompt: editPrompt })
    });
    setEditingId(null);
    fetchData();
  };

  const startEditing = (s) => {
    setEditingId(s.id);
    setEditPrompt(s.custom_prompt || '');
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Global Configuration ⚙️</h1>
        <p className="subtitle">Set your automation posting times here.</p>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>
          <section className="glass-card mb-2">
            <h3>Automation Schedules</h3>
            <p className="section-desc">Times at which the AI will auto-post with specific settings.</p>
            
            <div className="add-schedule-form glass-card-nested mb-2">
              <div className="flex-gap mb-1">
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
                <span className="text-xs opacity-50">Set Trigger Time</span>
              </div>
              
              <div className="input-group">
                <label className="text-xs">Custom Prompt (Optional)</label>
                <textarea 
                  rows="2"
                  placeholder="Override master prompt for this time..."
                  value={newPrompt}
                  onChange={e => setNewPrompt(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="text-xs">Custom Image (Optional)</label>
                <div className="flex-gap align-center">
                  <input type="file" accept="image/*" onChange={handleImageChange} id="sched-img" hidden />
                  <label htmlFor="sched-img" className="btn btn-outline btn-xs">📸 Upload Image</label>
                  {newImage && <div className="img-preview-mini"><img src={newImage} alt="Preview" /> <button onClick={() => setNewImage(null)}>×</button></div>}
                </div>
              </div>

              <button className="btn btn-primary w-full mt-1" onClick={addSchedule}>➕ Add Schedule Slot</button>
            </div>
            
            <div className="schedule-list custom-scroll">
              {status.schedules && status.schedules.length > 0 ? status.schedules.map(s => (
                <div key={s.id} className="schedule-item glass-card-nested">
                  <div className="schedule-info">
                    <div className="flex-between">
                      <span className="time-label">{s.time}</span>
                      <div className="flex-gap">
                        {editingId === s.id ? (
                           <button className="btn-icon save-btn" onClick={() => updateSchedule(s.id)}>✅</button>
                        ) : (
                           <button className="btn-icon edit-btn" onClick={() => startEditing(s)}>✏️</button>
                        )}
                        <button className="btn-icon delete-btn" onClick={() => deleteSchedule(s.id)}>🗑️</button>
                      </div>
                    </div>
                    
                    {editingId === s.id ? (
                      <textarea 
                        className="edit-textarea mt-1"
                        value={editPrompt}
                        onChange={e => setEditPrompt(e.target.value)}
                        rows="2"
                        autoFocus
                      />
                    ) : (
                      <>
                        {s.custom_prompt && <p className="schedule-prompt-preview">{s.custom_prompt}</p>}
                        {s.image_url && <img src={s.image_url} alt="Schedule Media" className="schedule-img-mini" />}
                      </>
                    )}
                  </div>
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
