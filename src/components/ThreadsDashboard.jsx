import React from 'react';

const ThreadsDashboard = ({ status, handlePostNow, history, loading, selectedImage, setSelectedImage }) => {
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="content-header">
        <h1>Threads Management 🧵</h1>
        <div className="status-header">
          <span className={`badge ${status.threadsToken ? 'badge-success' : 'badge-error'}`}>
            {status.threadsToken ? 'API Linked' : 'API Offline'}
          </span>
        </div>
      </header>

      <div className="main-grid">
        <div className="left-column">
          <section className="glass-card mt-2">
            <h3>Image Context (Optional)</h3>
            <p className="section-desc">AI will analyze this image to write your post.</p>
            <div className="image-upload-zone mt-1">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                id="image-upload"
                hidden
              />
              <label htmlFor="image-upload" className="image-label">
                {selectedImage ? (
                  <div className="preview-container">
                    <img src={selectedImage} alt="Preview" className="image-preview" />
                    <button className="remove-img" onClick={(e) => { e.preventDefault(); setSelectedImage(null); }}>×</button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span>📸</span>
                    <p>Click to add image</p>
                  </div>
                )}
              </label>
            </div>
          </section>

          <section className="glass-card mt-2">
            <h3>Quick Actions</h3>
            <div className="flex-col gap-1">
              <button className="btn btn-glow w-full" onClick={() => handlePostNow(false)} disabled={loading}>
                🚀 Generate & Post AI Now
              </button>
              <button className="btn btn-outline w-full" onClick={() => handlePostNow(true)} disabled={loading}>
                🧪 Manual Test Post
              </button>
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="glass-card history-card">
            <h3>Post History</h3>
            <div className="history-list">
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-meta">
                    <span className="time">{new Date(item.created_at).toLocaleString()}</span>
                    <span className={`status-dot ${item.status}`}></span>
                  </div>
                  <p className="content-pill">{item.content}</p>
                </div>
              )) : (
                <div className="empty-state">No recent activity on Threads.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ThreadsDashboard;
