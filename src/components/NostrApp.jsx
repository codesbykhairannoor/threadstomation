import React, { useState, useEffect } from 'react';

const API = '/api/nostr';

export default function NostrApp({ onBack }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(1);
  const [status, setStatus] = useState({ account: null, hasNsec: false, schedules: [], lastPost: null, automation_enabled: 'true' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [nsecInput, setNsecInput] = useState('');
  const [postingSite, setPostingSite] = useState('tranvas');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchStatus();
      fetchHistory();
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API}/accounts`);
      const data = await res.json();
      setAccounts(data || []);
      if (data && data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    } catch (e) {
      setError('Failed to fetch Nostr accounts');
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/status?accountId=${selectedAccountId}`);
      const data = await res.json();
      setStatus(data || {});
    } catch (e) {
      setError('Failed to fetch Nostr status');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/history?accountId=${selectedAccountId}`);
      const data = await res.json();
      setHistory(data || []);
    } catch (e) {
      console.warn('Failed to fetch history');
    }
  };

  const handleUpdateNsec = async (e) => {
    e.preventDefault();
    if (!nsecInput.trim()) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API}/keys/update-nsec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccountId, nsec: nsecInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update key');
      setMessage('✅ Nostr private key (nsec) saved and verified successfully!');
      setNsecInput('');
      fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostNow = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API}/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccountId, websiteKey: postingSite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to broadcast note');
      setMessage(`⚡ Note broadcasted to ${data.successfulRelays?.length || 0} relays! (ID: ${data.publishId?.substring(0, 10)}...)`);
      fetchStatus();
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutomation = async () => {
    try {
      const res = await fetch(`${API}/settings/toggle-automation`, { method: 'POST' });
      const data = await res.json();
      setStatus(prev => ({ ...prev, automation_enabled: data.enabled ? 'true' : 'false' }));
      setMessage(`Automation ${data.enabled ? 'Enabled' : 'Disabled'}`);
    } catch (e) {
      setError('Failed to toggle automation');
    }
  };

  return (
    <div className="platform-app-layout">
      {/* Sidebar */}
      <div className="sidebar" style={{ background: '#0f0a1c', borderRight: '1px solid #2d1b4e' }}>
        <div className="sidebar-brand">
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>⚡</div>
          <h2 style={{ background: 'linear-gradient(to right, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Nostr AI
          </h2>
        </div>

        <button className="back-platform-btn" onClick={onBack}>
          ← Switch Platform
        </button>

        <div className="account-selector-container">
          <label className="text-xs opacity-50 ml-1">NOSTR PROFILE</label>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginTop: '4px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{status.account?.name || 'Adhlil'}</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>@{status.account?.username || 'khaithisran'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={activeTab === 'dashboard' ? { background: 'linear-gradient(135deg, #7c3aed, #9333ea)', color: '#fff' } : {}}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            style={activeTab === 'settings' ? { background: 'linear-gradient(135deg, #7c3aed, #9333ea)', color: '#fff' } : {}}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Keys & Relays</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>Nostr Sovereign</p>
          <p style={{ marginTop: '4px', fontSize: '12px', fontWeight: 'bold', color: status.hasNsec ? '#10b981' : '#f59e0b' }}>
            {status.hasNsec ? '● Signer Ready' : '○ Missing nsec'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ padding: '30px', overflowY: 'auto', background: '#0a0614' }}>
        {message && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{message}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Nostr Sovereign Autopilot</h1>
                <p style={{ opacity: 0.7, fontSize: '14px' }}>
                  Decentralized 1x/day promotion across 5 sovereign web tools. Anti-censorship, client-side WASM focus.
                </p>
              </div>
              <button
                className={`btn ${status.automation_enabled === 'true' ? 'btn-success' : 'btn-secondary'}`}
                onClick={handleToggleAutomation}
              >
                {status.automation_enabled === 'true' ? '🟢 Autopilot Active' : '⚪ Autopilot Paused'}
              </button>
            </div>

            {/* Profile & Signer Card */}
            <div className="card" style={{ background: '#150d28', border: '1px solid #3b2064', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a78bfa' }}>Connected Identity</div>
                  <h3 style={{ fontSize: '18px', marginTop: '4px' }}>Adhlil (@khaithisran)</h3>
                  <code style={{ fontSize: '11px', opacity: 0.7, wordBreak: 'break-all' }}>
                    {status.account?.npub || 'npub18zahva5xg3j59hh8azaxj88q3vket2ft90yjh392qq2qgadc2e2swudhtk'}
                  </code>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${status.hasNsec ? 'badge-success' : 'badge-warning'}`} style={{ padding: '6px 12px' }}>
                    {status.hasNsec ? '🔑 Private Key Ready' : '⚠️ Enter nsec to Sign'}
                  </span>
                </div>
              </div>

              {!status.hasNsec && (
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#fbbf24', marginBottom: '8px' }}>
                    ⚠️ Postingan Nostr wajib ditandatangani dengan nsec (Private Key)
                  </p>
                  <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '12px' }}>
                    Buka menu Settings di web Nostr Anda ➔ Cari 'Export Private Key' (diawali nsec1...) ➔ Masukkan di bawah ini atau simpan di file <code>.env</code> sebagai <code>NOSTR_NSEC=nsec1...</code>.
                  </p>
                  <form onSubmit={handleUpdateNsec} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      placeholder="Masukkan nsec1..."
                      value={nsecInput}
                      onChange={e => setNsecInput(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: '#0a0614', border: '1px solid #3b2064', color: '#fff' }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : 'Save nsec'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Quick Test Action */}
            <div className="card" style={{ background: '#150d28', border: '1px solid #3b2064', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>⚡ Manual Instant Broadcast</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={postingSite}
                  onChange={e => setPostingSite(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', background: '#0a0614', border: '1px solid #3b2064', color: '#fff', minWidth: '220px' }}
                >
                  <option value="tranvas">tranvas.com (Life OS)</option>
                  <option value="solvemymedia">solvemymedia.com (WASM Media)</option>
                  <option value="createmyqr">createmy-qr.com (QR Suite)</option>
                  <option value="helpmyimg">helpmyimg.com (WASM Image)</option>
                  <option value="handlemyfile">handlemyfile.com (WASM PDF)</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={handlePostNow}
                  disabled={loading || !status.hasNsec}
                >
                  {loading ? 'Broadcasting...' : '🚀 Generate & Broadcast Now'}
                </button>
              </div>
            </div>

            {/* Schedules Grid (5 Websites Rotation) */}
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '14px' }}>5 Websites Daily Rotation Schedule</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {status.schedules?.map((s) => (
                <div key={s.id} style={{ background: '#150d28', border: '1px solid #3b2064', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#a78bfa' }}>{s.website_key}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(167, 139, 250, 0.2)', padding: '2px 8px', borderRadius: '12px' }}>
                      {s.last_run_date ? `Last: ${s.last_run_date}` : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px', wordBreak: 'break-all' }}>{s.website_url}</p>
                </div>
              ))}
            </div>

            {/* History Table */}
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '14px' }}>Broadcast History</h3>
            <div className="card" style={{ background: '#150d28', border: '1px solid #3b2064', borderRadius: '12px', overflow: 'hidden' }}>
              {history.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>No notes published yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2d1b4e', opacity: 0.6, textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Target Site</th>
                      <th style={{ padding: '12px 16px' }}>Content Preview</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{new Date(h.created_at).toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', color: '#a78bfa' }}>{h.website_url}</td>
                        <td style={{ padding: '12px 16px', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.content}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge ${h.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Nostr Cryptographic Keys & Relays</h2>
            <div className="card" style={{ background: '#150d28', border: '1px solid #3b2064', padding: '24px', borderRadius: '12px', maxWidth: '650px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Update Private Key (nsec)</h3>
              <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px' }}>
                Private key disimpan secara lokal di database Supabase Anda atau di file <code>.env</code> (<code>NOSTR_NSEC</code>). Kunci ini hanya digunakan untuk menandatangani note secara lokal di server.
              </p>
              <form onSubmit={handleUpdateNsec}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Nostr Private Key (nsec1...)</label>
                  <input
                    type="password"
                    placeholder="nsec1..."
                    value={nsecInput}
                    onChange={e => setNsecInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#0a0614', border: '1px solid #3b2064', color: '#fff' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Private Key'}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid #2d1b4e', margin: '24px 0' }} />

              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Connected Relays</h3>
              <ul style={{ paddingLeft: '20px', fontSize: '13px', opacity: 0.8, lineHeight: 1.8 }}>
                <li><code>wss://relay.damus.io</code></li>
                <li><code>wss://nos.lol</code></li>
                <li><code>wss://relay.primal.net</code></li>
                <li><code>wss://purplerelay.com</code></li>
                <li><code>wss://relay.snort.social</code></li>
                <li><code>wss://nostr.mom</code></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
