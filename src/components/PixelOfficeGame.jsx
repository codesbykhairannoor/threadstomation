import React, { useRef, useEffect, useState } from 'react';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PIXEL OFFICE GAME ENGINE (Threadstomation Kantor AI)
 * ══════════════════════════════════════════════════════════════════════════════
 * Uses the authentic 16-bit pixel art office simulation engine (Pixel Agents / Claude-Office):
 * - Real character walking, sitting, and typing animations
 * - 15 dedicated workstations for Threads, IG, Bluesky, DEV.TO, Nostr, Tumblr
 * - Floating interactive speech bubbles with live database tasks & logs
 * - Connected via postMessage bridge to Supabase database & GitHub Actions
 * - Two-way interactivity: click any agent to open the live inspector modal
 * ══════════════════════════════════════════════════════════════════════════════
 */
export default function PixelOfficeGame({ workers = [], onSelectWorker, activeWorkerId }) {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute base URL for GitHub Pages compatibility
  const baseUrl = import.meta.env.BASE_URL || '/';
  const iframeSrc = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}pixel-office/index.html`;

  // Listen for agent clicks from inside the pixel game webview
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PIXEL_AGENT_CLICK') {
        const agentId = event.data.id;
        const worker = workers.find(w => w.id === agentId);
        if (worker && onSelectWorker) {
          onSelectWorker(worker);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [workers, onSelectWorker]);

  // Synchronize live worker data changes to the game iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow && workers.length > 0) {
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'UPDATE_BOTS_DATA',
          workers: workers
        }, '*');
      } catch (_) {}
    }
  }, [workers]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleRefreshIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc + '?t=' + Date.now();
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : '680px',
        background: '#12121e',
        borderRadius: isFullscreen ? '0px' : '18px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ── TOP HUD BAR ── */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1.2rem',
          background: 'rgba(24, 24, 40, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 10,
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            background: '#10b981', 
            boxShadow: '0 0 10px #10b981' 
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.04em' }}>
            KANTOR AI THREADSTOMATION
          </span>
          <span style={{ 
            fontSize: '0.7rem', 
            background: 'rgba(99, 102, 241, 0.2)', 
            color: '#a5b4fc', 
            padding: '2px 8px', 
            borderRadius: '6px',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            fontWeight: '600'
          }}>
            16-BIT REAL SPRITES ENGINE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '6px' }}>
            💡 Klik meja/bot untuk detail & trigger
          </span>

          <button
            onClick={handleRefreshIframe}
            title="Reload Simulasi Kantor"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '5px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🔄 Reset
          </button>

          <button
            onClick={toggleFullscreen}
            title="Layar Penuh"
            style={{
              background: 'rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#e0e7ff',
              padding: '5px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {isFullscreen ? '↩ Keluar Layar Penuh' : '⛶ Layar Penuh'}
          </button>
        </div>
      </div>

      {/* ── EMBEDDED REAL PIXEL OFFICE GAME IFRAME ── */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        {!isLoaded && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#181828',
            color: '#a5b4fc',
            zIndex: 5,
            gap: '12px'
          }}>
            <div style={{ fontSize: '2rem' }}>🎮</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Memuat Kantor AI Pixel & Aset 16-Bit...</div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Kantor AI Pixel Office"
          onLoad={() => setIsLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            background: '#181828'
          }}
        />
      </div>

      {/* ── FOOTER STATUS LEGEND ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1.2rem',
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.75rem',
        color: '#94a3b8',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            Threads (4)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }} />
            Instagram (4)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }} />
            Bluesky (3)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
            Nostr (1)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            DEV.TO (1)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
            Tumblr (2)
          </span>
        </div>

        <div style={{ color: '#64748b' }}>
          Navigasi: <strong>Drag/Geser</strong> untuk Kamera, <strong>Scroll</strong> untuk Zoom
        </div>
      </div>
    </div>
  );
}
