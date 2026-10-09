import React, { useState, useEffect } from 'react';
import PixelOfficeGame from './PixelOfficeGame';
import IsometricOfficeCanvas from './IsometricOfficeCanvas';
import './KantorAiDashboard.css';

// ── PIXEL / ISOMETRIC AVATAR SVGs ─────────────────────────────────────────────

const AvatarWorkstation = ({ avatarType, status }) => {
  const isWorking = status === 'WORKING';
  const isResting = status === 'RESTING';
  const isAlert = status === 'ALERT';

  const glowColor = isAlert ? '#ef4444' : isWorking ? '#10b981' : isResting ? '#38bdf8' : '#f59e0b';

  return (
    <svg viewBox="0 0 160 120" width="140" height="105" className="workstation-svg">
      <defs>
        <filter id={`glow-${avatarType}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={glowColor} floodOpacity="0.6"/>
        </filter>
        <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* ── DESK BASE (ISOMETRIC / TOP-DOWN) ── */}
      <rect x="20" y="70" width="120" height="32" rx="6" fill="url(#deskGrad)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <rect x="25" y="98" width="8" height="18" rx="2" fill="#0f172a" />
      <rect x="127" y="98" width="8" height="18" rx="2" fill="#0f172a" />

      {/* ── DUAL MONITORS ── */}
      {/* Monitor 1 (Main) */}
      <rect x="52" y="32" width="56" height="38" rx="4" fill="#020617" stroke={glowColor} strokeWidth="1.5" filter={`url(#glow-${avatarType})`} />
      <rect x="55" y="35" width="50" height="32" rx="2" fill="#090d16" />
      {/* Screen code lines */}
      <rect x="58" y="39" width="22" height="2" rx="1" fill="#38bdf8" />
      <rect x="58" y="44" width="34" height="2" rx="1" fill={isAlert ? '#f87171' : '#34d399'} />
      <rect x="58" y="49" width="28" height="2" rx="1" fill="#a855f7" />
      <rect x="58" y="54" width="18" height="2" rx="1" fill="#fbbf24" />
      {/* Blinking cursor */}
      <rect x="80" y="54" width="4" height="2" fill="#ffffff">
        <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
      </rect>

      {/* Stand */}
      <rect x="76" y="70" width="8" height="6" fill="#475569" />
      <rect x="70" y="75" width="20" height="2" rx="1" fill="#64748b" />

      {/* Keyboard */}
      <rect x="62" y="79" width="36" height="8" rx="2" fill="#1e293b" stroke="rgba(255,255,255,0.1)" />
      {/* Mouse */}
      <rect x="104" y="81" width="6" height="8" rx="3" fill="#334155" />

      {/* Coffee Cup / Soda */}
      <rect x="32" y="76" width="10" height="12" rx="2" fill="#f97316" />
      <rect x="30" y="78" width="2" height="6" rx="1" fill="#ea580c" />
      {/* Coffee steam */}
      <path d="M35,74 Q36,70 35,67 Q34,64 36,61" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none">
        <animate attributeName="opacity" values="0;0.7;0" dur="2s" repeatCount="indefinite" />
      </path>

      {/* ── BOT CHARACTERS (AVATAR HEAD/BODY BEHIND OR AT DESK) ── */}
      {avatarType === 'coder_cat' && (
        <g transform="translate(68, 12)">
          {/* Cat Ears */}
          <polygon points="4,12 8,2 14,10" fill="#f43f5e" />
          <polygon points="18,10 24,2 28,12" fill="#f43f5e" />
          {/* Cat Head */}
          <rect x="4" y="8" width="24" height="20" rx="8" fill="#fda4af" />
          {/* Cat Eyes */}
          <circle cx="10" cy="17" r="2" fill="#0f172a" />
          <circle cx="22" cy="17" r="2" fill="#0f172a" />
          {/* Whiskers */}
          <line x1="2" y1="18" x2="6" y2="17" stroke="#475569" strokeWidth="1" />
          <line x1="2" y1="20" x2="6" y2="20" stroke="#475569" strokeWidth="1" />
          <line x1="26" y1="17" x2="30" y2="18" stroke="#475569" strokeWidth="1" />
          <line x1="26" y1="20" x2="30" y2="20" stroke="#475569" strokeWidth="1" />
          {/* Headphones */}
          <path d="M2,18 A14,14 0 0,1 30,18" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
          <rect x="0" y="14" width="4" height="8" rx="2" fill="#0284c7" />
          <rect x="28" y="14" width="4" height="8" rx="2" fill="#0284c7" />
        </g>
      )}

      {avatarType === 'retro_bot' && (
        <g transform="translate(68, 10)">
          {/* Antenna */}
          <line x1="16" y1="2" x2="16" y2="8" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="16" cy="2" r="2.5" fill={glowColor} />
          {/* Box Head */}
          <rect x="5" y="8" width="22" height="20" rx="4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
          {/* Face Screen */}
          <rect x="8" y="11" width="16" height="14" rx="2" fill="#0f172a" />
          {/* Eyes (Glowing LEDs) */}
          <rect x="10" y="15" width="4" height="3" rx="1" fill="#38bdf8">
            <animate attributeName="opacity" values="1;0.2;1" dur="2.5s" repeatCount="indefinite" />
          </rect>
          <rect x="18" y="15" width="4" height="3" rx="1" fill="#38bdf8">
            <animate attributeName="opacity" values="1;0.2;1" dur="2.5s" repeatCount="indefinite" />
          </rect>
          {/* Smile */}
          <path d="M12,21 Q16,23 20,21" stroke="#34d399" strokeWidth="1.2" fill="none" />
        </g>
      )}

      {avatarType === 'cyber_agent' && (
        <g transform="translate(68, 11)">
          {/* Hair / Hood */}
          <path d="M5,16 Q16,5 27,16 L27,24 L5,24 Z" fill="#6366f1" />
          {/* Face */}
          <rect x="7" y="12" width="18" height="16" rx="4" fill="#fed7aa" />
          {/* Cyber Visor */}
          <rect x="6" y="15" width="20" height="5" rx="1" fill="#06b6d4" stroke="#22d3ee" strokeWidth="1">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
          </rect>
        </g>
      )}

      {avatarType === 'pixel_manager' && (
        <g transform="translate(68, 12)">
          {/* Hair */}
          <path d="M5,12 Q16,6 27,12 L27,16 L5,16 Z" fill="#78350f" />
          {/* Face */}
          <rect x="6" y="11" width="20" height="17" rx="5" fill="#fde68a" />
          {/* Glasses */}
          <rect x="8" y="15" width="6" height="5" rx="1" fill="none" stroke="#0f172a" strokeWidth="1" />
          <rect x="18" y="15" width="6" height="5" rx="1" fill="none" stroke="#0f172a" strokeWidth="1" />
          <line x1="14" y1="17" x2="18" y2="17" stroke="#0f172a" strokeWidth="1" />
          {/* Tie */}
          <polygon points="16,28 14,35 16,37 18,35" fill="#ef4444" />
        </g>
      )}

      {avatarType === 'hacker_dude' && (
        <g transform="translate(68, 11)">
          {/* Hoodie */}
          <path d="M4,18 C4,8 28,8 28,18 L28,26 L4,26 Z" fill="#1e293b" />
          <rect x="8" y="14" width="16" height="12" rx="4" fill="#020617" />
          {/* Glowing Green Eye Line */}
          <line x1="10" y1="19" x2="22" y2="19" stroke="#22c55e" strokeWidth="2">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </line>
        </g>
      )}

      {avatarType === 'creative_designer' && (
        <g transform="translate(68, 12)">
          {/* Beret / Colorful Hair */}
          <ellipse cx="16" cy="10" rx="12" ry="5" fill="#ec4899" />
          <circle cx="16" cy="6" r="2" fill="#f43f5e" />
          {/* Face */}
          <rect x="6" y="10" width="20" height="18" rx="5" fill="#fbcfe8" />
          {/* Cute Eyes */}
          <circle cx="11" cy="18" r="1.5" fill="#831843" />
          <circle cx="21" cy="18" r="1.5" fill="#831843" />
          {/* Blush */}
          <ellipse cx="9" cy="22" rx="2" ry="1" fill="#f472b6" opacity="0.6" />
          <ellipse cx="23" cy="22" rx="2" ry="1" fill="#f472b6" opacity="0.6" />
        </g>
      )}
    </svg>
  );
};

// ── MAIN KANTOR AI DASHBOARD COMPONENT ────────────────────────────────────────

const KantorAiDashboard = ({ onBack, onNavigatePlatform }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [triggeringId, setTriggeringId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [countdown, setCountdown] = useState(15);
  const [viewMode, setViewMode] = useState('simple'); // 'simple' (Ringkas & Cepat), 'cards' (Grid), 'pixel' (Game 16-Bit), 'iso' (2.5D)

  const fetchOfficeStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    let loaded = false;

    // 1. Try local or serverless API
    try {
      const res = await fetch('/api/office/status');
      if (res.ok) {
        const json = await res.json();
        if (json && json.workers) {
          setData(json);
          loaded = true;
        }
      }
    } catch (_) {}

    // 2. If API fails (e.g. running on GitHub Pages static host), fallback to static snapshot
    if (!loaded) {
      try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const snapshotUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}office_status.json`;
        const res = await fetch(snapshotUrl);
        if (res.ok) {
          const json = await res.json();
          if (json && json.workers) {
            setData(json);
            loaded = true;
          }
        }
      } catch (e) {
        console.warn('Failed to load office snapshot:', e);
      }
    }

    setLoading(false);
    setRefreshing(false);
    setCountdown(15);
  };

  useEffect(() => {
    fetchOfficeStatus();
    const interval = setInterval(() => {
      fetchOfficeStatus();
    }, 15000);

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 15));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTriggerNow = async (worker) => {
    setTriggeringId(worker.id);
    showToast(`🚀 Memerintahkan ${worker.accountName} (${worker.platformName}) untuk posting sekarang...`);

    let endpoint = '/api/post-now';
    let payload = { accountId: worker.accountId };

    if (worker.platform === 'threads') {
      endpoint = '/api/post-now';
      payload = { accountId: worker.accountId, platforms: ['threads'] };
    } else {
      endpoint = `/api/${worker.platform}/post-now`;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (res.ok && (resData.success || resData.publishId || resData.uri || resData.result)) {
        showToast(`✅ Berhasil! ${worker.accountName} telah mempublikasikan konten baru.`);
        fetchOfficeStatus();
      } else {
        showToast(`❌ Gagal: ${resData.error || 'Terjadi kesalahan saat posting'}`, true);
      }
    } catch (err) {
      showToast(`❌ Koneksi gagal: ${err.message}`, true);
    } finally {
      setTriggeringId(null);
    }
  };

  // Filtered workers
  const filteredWorkers = (data?.workers || []).filter(w => {
    const matchPlatform = filterPlatform === 'all' || w.platform === filterPlatform;
    const matchQuery = !searchQuery || 
      w.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.platformName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPlatform && matchQuery;
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case 'WORKING': return { text: 'Sedang Bekerja', cls: 'status-pill-working', dot: '🟢' };
      case 'RESTING': return { text: 'Target Selesai', cls: 'status-pill-resting', dot: '☕' };
      case 'ALERT': return { text: 'Perlu Cek', cls: 'status-pill-alert', dot: '⚠️' };
      default: return { text: 'Standby / Menunggu', cls: 'status-pill-waiting', dot: '🕒' };
    }
  };

  return (
    <div className="kantor-warroom-page">
      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '25px',
          background: toastMessage.isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '12px 22px',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '0.9rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 9999,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toastMessage.text}
        </div>
      )}

      {/* ── TOP CONTROL BAR ── */}
      <div className="warroom-topbar">
        <div className="warroom-brand">
          <div className="warroom-brand-icon">🏢</div>
          <div className="warroom-title-block">
            <h1>
              KANTOR PUSAT BOT AI
              <span className="warroom-title-badge">WAR ROOM LIVE</span>
            </h1>
            <p>Monitoring Visual Multi-Akun & Bot Otomasi Medsos ($0 Cloud Native)</p>
          </div>
        </div>

        <div className="warroom-top-actions">
          <div className="warroom-clock-chip">
            <span className="warroom-pulse-dot"></span>
            <span>{data?.system?.currentWitaTime || '--:-- WITA'}</span>
          </div>

          <button 
            className="warroom-btn warroom-btn-primary" 
            onClick={() => fetchOfficeStatus(true)}
            disabled={refreshing}
          >
            <span className={refreshing ? 'spin' : ''}>🔄</span>
            {refreshing ? 'Memperbarui...' : `Refresh (${countdown}s)`}
          </button>

          {onBack && (
            <button className="warroom-btn" onClick={onBack}>
              🏠 Beranda
            </button>
          )}
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="warroom-stats-grid">
        <div className="warroom-stat-card">
          <div className="warroom-stat-icon stat-icon-blue">👥</div>
          <div className="warroom-stat-info">
            <div className="warroom-stat-val">{data?.system?.totalWorkers || 15}</div>
            <div className="warroom-stat-lbl">Total Karyawan Bot Aktif</div>
          </div>
        </div>

        <div className="warroom-stat-card">
          <div className="warroom-stat-icon stat-icon-green">🚀</div>
          <div className="warroom-stat-info">
            <div className="warroom-stat-val">{data?.system?.totalToday || 0} Post</div>
            <div className="warroom-stat-lbl">Terbit Berhasil Hari Ini</div>
          </div>
        </div>

        <div className="warroom-stat-card">
          <div className="warroom-stat-icon stat-icon-purple">☕</div>
          <div className="warroom-stat-info">
            <div className="warroom-stat-val">
              {(data?.workers || []).filter(w => w.status === 'RESTING').length} Agen
            </div>
            <div className="warroom-stat-lbl">Selesai Target (Istirahat)</div>
          </div>
        </div>

        <div className="warroom-stat-card">
          <div className="warroom-stat-icon stat-icon-amber">🛡️</div>
          <div className="warroom-stat-info">
            <div className="warroom-stat-val">{data?.system?.health || 'Optimal'}</div>
            <div className="warroom-stat-lbl">Kesehatan Sistem Database</div>
          </div>
        </div>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="warroom-filters-bar">
        <div className="warroom-filter-pills">
          <button 
            className={`filter-pill ${filterPlatform === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPlatform('all')}
          >
            🏢 Semua Departemen ({data?.workers?.length || 15})
          </button>
          <button 
            className={`filter-pill ${filterPlatform === 'threads' ? 'active' : ''}`}
            onClick={() => setFilterPlatform('threads')}
          >
            🧵 Threads (4)
          </button>
          <button 
            className={`filter-pill ${filterPlatform === 'instagram' ? 'active' : ''}`}
            onClick={() => setFilterPlatform('instagram')}
          >
            📸 Instagram (4)
          </button>
          <button 
            className={`filter-pill ${filterPlatform === 'bluesky' ? 'active' : ''}`}
            onClick={() => setFilterPlatform('bluesky')}
          >
            🦋 Bluesky (3)
          </button>
          <button 
            className={`filter-pill ${filterPlatform === 'nostr' ? 'active' : ''}`}
            onClick={() => setFilterPlatform('nostr')}
          >
            ⚡ Nostr (1)
          </button>
          <button 
            className={`filter-pill ${filterPlatform === 'devto' ? 'active' : ''}`}
            onClick={() => setFilterPlatform('devto')}
          >
            👩‍💻 DEV.TO (1)
          </button>
          <button 
            className={`filter-pill ${filterPlatform === 'tumblr' ? 'active' : ''}`}
            onClick={() => setFilterPlatform('tumblr')}
          >
            📝 Tumblr (2)
          </button>
        </div>

        <div className="warroom-search-box">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Cari nama akun atau peran bot..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── VIEW SWITCHER BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.7)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
          <button 
            className={`filter-pill ${viewMode === 'simple' ? 'active' : ''}`}
            onClick={() => setViewMode('simple')}
            style={{ fontWeight: '700', padding: '0.45rem 1rem' }}
          >
            ⚡ Mode Simpel (Ringkas & Cepat)
          </button>
          <button 
            className={`filter-pill ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            style={{ fontWeight: '700', padding: '0.45rem 1rem' }}
          >
            📋 Mode Kartu Meja (Grid)
          </button>
          <button 
            className={`filter-pill ${viewMode === 'pixel' ? 'active' : ''}`}
            onClick={() => setViewMode('pixel')}
            style={{ fontWeight: '700', padding: '0.45rem 1rem' }}
          >
            🎮 Mode Game Pixel (16-Bit Asli)
          </button>
          <button 
            className={`filter-pill ${viewMode === 'iso' ? 'active' : ''}`}
            onClick={() => setViewMode('iso')}
            style={{ fontWeight: '700', padding: '0.45rem 1rem' }}
          >
            📐 Mode Blueprint 2.5D
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {viewMode === 'simple' && (
            <span>⚡ Pantau status, progres kuota, dan trigger posting langsung tanpa lag.</span>
          )}
          {viewMode === 'cards' && (
            <span>📋 Tampilan kartu meja interaktif dengan avatar tiap bot.</span>
          )}
          {viewMode === 'pixel' && (
            <span>🎮 Simulasi kantor 16-bit asli. Klik meja/karakter bot untuk detail & aksi.</span>
          )}
          {viewMode === 'iso' && (
            <span>📐 Denah blueprint 2.5D top-down ruang kerja.</span>
          )}
        </div>
      </div>

      {/* ── WAR ROOM CONTENT ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }} className="spin">⚙️</div>
          <p>Menghubungkan ke log database Supabase & Vercel...</p>
        </div>
      ) : viewMode === 'simple' ? (
        <div className="warroom-simple-container">
          {/* Summary Strip */}
          <div className="simple-summary-strip">
            <div className="simple-strip-title">
              <span>⚡</span>
              <strong>Live Monitor ({filteredWorkers.length} Bot Aktif)</strong>
              <span className="simple-strip-subtitle">— Status live database, kuota target hari ini, & log aksi terkini</span>
            </div>
            <div className="simple-strip-meta">
              <span>Sinkronisasi otomatis tiap 15 detik</span>
            </div>
          </div>

          {/* Quick Table */}
          <div className="simple-table-wrapper">
            <table className="simple-monitor-table">
              <thead>
                <tr>
                  <th style={{ width: '24%' }}>Akun & Platform</th>
                  <th style={{ width: '15%' }}>Status Kerja</th>
                  <th style={{ width: '18%' }}>Target Kuota</th>
                  <th style={{ width: '28%' }}>Dialog / Log Database Terkini</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Aksi Instan</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map(w => {
                  const statusMeta = getStatusLabel(w.status);
                  const isWorkingThis = triggeringId === w.id;
                  const progressPercent = Math.min(100, Math.round((w.todayCount / w.dailyTarget) * 100));

                  return (
                    <tr key={w.id} className={`simple-row state-${w.status.toLowerCase()}`}>
                      {/* Platform & Account */}
                      <td>
                        <div className="simple-acc-cell">
                          <span className="simple-platform-icon">{w.platformIcon}</span>
                          <div>
                            <div className="simple-acc-name">
                              <strong>{w.accountName}</strong>
                              <span className="simple-platform-name">{w.platformName}</span>
                            </div>
                            <div className="simple-acc-role">{w.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`desk-status-pill ${statusMeta.cls}`}>
                          <span>{statusMeta.dot}</span>
                          <span>{statusMeta.text}</span>
                        </span>
                      </td>

                      {/* Quota */}
                      <td>
                        <div className="simple-quota-cell">
                          <div className="simple-quota-label">
                            <strong>{w.todayCount} / {w.dailyTarget} Post</strong>
                            <span className="simple-percent">({progressPercent}%)</span>
                          </div>
                          <div className="quota-bar-track" style={{ height: '6px', margin: '4px 0' }}>
                            <div 
                              className={`quota-bar-fill ${progressPercent >= 100 ? 'quota-fill-full' : progressPercent > 0 ? 'quota-fill-mid' : 'quota-fill-empty'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="simple-schedule-text">
                            🕒 {w.nextSlot}
                          </div>
                        </div>
                      </td>

                      {/* Activity / Last Log */}
                      <td>
                        <div className="simple-log-cell">
                          <div className="simple-speech-bubble">
                            {w.speech}
                          </div>
                          {w.lastPost && w.lastPost.text && (
                            <div className="simple-last-post-snippet">
                              <span className={`simple-post-status-tag ${w.lastPost.status}`}>
                                {w.lastPost.status === 'success' ? '✅ Terbit' : '❌ Gagal'} ({w.lastPost.relativeTime || 'baru saja'})
                              </span>
                              <span className="simple-snippet-text">
                                "{w.lastPost.text.slice(0, 80)}{w.lastPost.text.length > 80 ? '...' : ''}"
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="simple-actions-cell">
                          <button 
                            className={`simple-btn-trigger ${isWorkingThis ? 'loading' : ''}`}
                            onClick={() => handleTriggerNow(w)}
                            disabled={isWorkingThis}
                            title="Jalankan bot sekarang"
                          >
                            <span>{isWorkingThis ? '⏳' : '⚡'}</span>
                            <span>{isWorkingThis ? 'Posting...' : 'Run Now'}</span>
                          </button>
                          <button 
                            className="simple-btn-inspect"
                            onClick={() => setSelectedWorker(w)}
                            title="Buka log & riwayat lengkap"
                          >
                            🔍
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'pixel' ? (
        <div style={{ marginBottom: '2.5rem' }}>
          <PixelOfficeGame 
            workers={data?.workers || []} 
            onSelectWorker={setSelectedWorker}
            activeWorkerId={selectedWorker?.id}
          />
        </div>
      ) : viewMode === 'iso' ? (
        <div style={{ marginBottom: '2.5rem' }}>
          <IsometricOfficeCanvas 
            workers={data?.workers || []} 
            onSelectWorker={setSelectedWorker}
            activeWorkerId={selectedWorker?.id}
          />
        </div>
      ) : (
        <div className="warroom-office-grid">
          {filteredWorkers.map(w => {
            const statusMeta = getStatusLabel(w.status);
            const isWorkingThis = triggeringId === w.id;
            const progressPercent = Math.min(100, Math.round((w.todayCount / w.dailyTarget) * 100));

            return (
              <div key={w.id} className={`desk-card state-${w.status.toLowerCase()}`}>
                {/* Desk Header */}
                <div className="desk-header">
                  <div className="desk-platform-badge">
                    <span>{w.platformIcon}</span>
                    <span>{w.platformName}</span>
                  </div>
                  <div className={`desk-status-pill ${statusMeta.cls}`}>
                    <span>{statusMeta.dot}</span>
                    <span>{statusMeta.text}</span>
                  </div>
                </div>

                {/* Desk Workstation Graphic & Speech Bubble */}
                <div className="desk-stage">
                  <div className="speech-bubble">
                    {w.speech}
                  </div>
                  <div className="workstation-art">
                    <AvatarWorkstation avatarType={w.avatar} status={w.status} />
                  </div>
                </div>

                {/* Bot Profile */}
                <div className="desk-identity">
                  <div className="desk-acc-name">
                    <span>{w.accountName}</span>
                  </div>
                  <div className="desk-role">{w.role}</div>
                </div>

                {/* Quota Progress */}
                <div className="desk-quota-section">
                  <div className="desk-quota-header">
                    <span>Target Hari Ini</span>
                    <span>{w.todayCount} / {w.dailyTarget} Post ({progressPercent}%)</span>
                  </div>
                  <div className="quota-bar-track">
                    <div 
                      className={`quota-bar-fill ${progressPercent >= 100 ? 'quota-fill-full' : progressPercent > 0 ? 'quota-fill-mid' : 'quota-fill-empty'}`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="desk-schedule-tag">
                    <span>🕒</span>
                    <span>{w.nextSlot}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="desk-actions">
                  <button 
                    className="desk-action-btn btn-inspect"
                    onClick={() => setSelectedWorker(w)}
                  >
                    <span>🔍</span> Detail & Log
                  </button>
                  <button 
                    className={`desk-action-btn btn-trigger ${isWorkingThis ? 'loading' : ''}`}
                    onClick={() => handleTriggerNow(w)}
                    disabled={isWorkingThis}
                  >
                    <span className={isWorkingThis ? 'spin' : ''}>
                      {isWorkingThis ? '⏳' : '⚡'}
                    </span>
                    {isWorkingThis ? 'Posting...' : 'Run Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── RECENT TRANSMISSIONS FEED (LIVE DATABASE LOG STREAM) ── */}
      <div className="warroom-feed-panel">
        <div className="warroom-feed-header">
          <div className="warroom-feed-title">
            <span>📡</span>
            <span>Transmisi Postingan Terakhir (Live Feed Database)</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Auto-sync langsung dari tabel riwayat database
          </span>
        </div>

        <div className="warroom-feed-items">
          {(!data?.recentActivity || data.recentActivity.length === 0) ? (
            <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem' }}>
              Belum ada data transmisi tercatat di database hari ini.
            </div>
          ) : (
            data.recentActivity.map(act => (
              <div key={act.id} className="feed-item-row">
                <div className="feed-item-icon">{act.platformIcon}</div>
                <div className="feed-item-content">
                  <div className="feed-item-meta">
                    <span className="feed-item-account">@{act.accountName}</span>
                    <span>•</span>
                    <span>{act.platformName}</span>
                    <span>•</span>
                    <span>{act.relativeTime}</span>
                    <span className={`feed-item-badge ${act.status === 'success' || act.status === 'published' ? 'badge-success' : 'badge-error'}`}>
                      {act.status}
                    </span>
                  </div>
                  <div className="feed-item-snippet">
                    {act.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── INSPECTION MODAL DRAWER ── */}
      {selectedWorker && (
        <div className="warroom-modal-overlay" onClick={() => setSelectedWorker(null)}>
          <div className="warroom-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <span style={{ fontSize: '1.6rem' }}>{selectedWorker.platformIcon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>
                    {selectedWorker.accountName}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                    {selectedWorker.role} · {selectedWorker.zone}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedWorker(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-dialog-box">
                <span style={{ fontSize: '1.2rem' }}>💬</span>
                <span>"{selectedWorker.speech}"</span>
              </div>

              <div>
                <div className="modal-section-title">Status Pekerja</div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '0.8rem',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ background: 'rgba(30,41,59,0.5)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                    <div style={{ color: '#94a3b8' }}>Postingan Hari Ini</div>
                    <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '1rem', marginTop: '0.2rem' }}>
                      {selectedWorker.todayCount} / {selectedWorker.dailyTarget} Post
                    </div>
                  </div>
                  <div style={{ background: 'rgba(30,41,59,0.5)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                    <div style={{ color: '#94a3b8' }}>Slot Jadwal Target</div>
                    <div style={{ fontWeight: '700', color: '#38bdf8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                      {selectedWorker.nextSlot}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="modal-section-title">Postingan Terakhir Terbit</div>
                {selectedWorker.lastPost ? (
                  <div className="modal-post-box">
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Waktu: {selectedWorker.lastPost.relativeTime}</span>
                      <span style={{ color: '#34d399', fontWeight: '700' }}>Status: {selectedWorker.lastPost.status}</span>
                    </div>
                    {selectedWorker.lastPost.text}
                    {selectedWorker.lastPost.externalId && (
                      <div style={{ marginTop: '0.8rem', fontSize: '0.72rem', color: '#64748b' }}>
                        ID Eksternal: <code>{selectedWorker.lastPost.externalId}</code>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    Belum ada riwayat postingan tercatat untuk akun ini.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {onNavigatePlatform && (
                <button 
                  className="warroom-btn"
                  onClick={() => onNavigatePlatform(selectedWorker.platform)}
                >
                  Buka Suite {selectedWorker.platformName} ↗
                </button>
              )}
              <button 
                className="warroom-btn warroom-btn-primary"
                onClick={() => {
                  handleTriggerNow(selectedWorker);
                  setSelectedWorker(null);
                }}
                disabled={triggeringId === selectedWorker.id}
              >
                ⚡ Paksa Posting Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KantorAiDashboard;
