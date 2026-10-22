import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

// =============================================================================
// MAC OS MOUSE CURSOR COMPONENT
// =============================================================================
function MouseCursor({ x, y, isClicking = false, clickScale = 1 }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        pointerEvents: 'none',
        zIndex: 100,
        transform: `scale(${clickScale})`,
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {isClicking && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '2.5px solid #38bdf8',
            transform: 'translate(-25%, -25%) scale(1.4)',
            opacity: 0.8,
            animation: 'none',
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// 3D FLOATING SAFARI BROWSER WINDOW COMPONENT (MOCKOOPS STYLE)
// =============================================================================
function SafariBrowserWindow({ url = 'https://brand-anda.com', children, style = {} }) {
  return (
    <div
      style={{
        width: '920px',
        borderRadius: '24px',
        background: '#090d16',
        border: '1.5px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 30px 100px -20px rgba(0, 0, 0, 0.7), 0 0 50px rgba(56, 189, 248, 0.15)',
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
        ...style,
      }}
    >
      {/* Safari Window Header Bar */}
      <div
        style={{
          height: '64px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '20px',
        }}
      >
        {/* macOS Traffic Lights */}
        <div style={{ display: 'flex', gap: '9px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
        </div>

        {/* Browser Navigation Arrows */}
        <div style={{ display: 'flex', gap: '12px', color: '#64748b', fontSize: '18px' }}>
          <span>‹</span>
          <span>›</span>
        </div>

        {/* URL Pill Bar */}
        <div
          style={{
            flex: 1,
            height: '38px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#94a3b8',
            fontSize: '15px',
            fontWeight: 500,
          }}
        >
          <span style={{ color: '#22c55e', fontSize: '13px' }}>🔒</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{url}</span>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '16px' }}>
          <span>⤢</span>
          <span>⋯</span>
        </div>
      </div>

      {/* Browser Body / Rendered Web Page Content */}
      <div style={{ position: 'relative', minHeight: '820px', background: '#0a0f1d' }}>
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// SCENE 1: HERO SHOWCASE (Web Landing Page Modern)
// =============================================================================
function Scene1Hero({ frame, fps }) {
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const glow = 15 + Math.sin(frame * 0.08) * 8;

  return (
    <div style={{ padding: '48px 40px', boxSizing: 'border-box' }}>
      {/* Web Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>⚡</div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>NexusBrand</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', color: '#94a3b8', fontSize: '15px', fontWeight: 600 }}>
          <span>Fitur</span>
          <span>Solusi</span>
          <span>Portfolio</span>
        </div>
        <div style={{ padding: '8px 20px', borderRadius: '100px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '14px', fontWeight: 700 }}>
          Hubungi Kami
        </div>
      </div>

      {/* Hero Headline */}
      <div style={{ textAlign: 'center', marginTop: '20px', transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})` }}>
        <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: '100px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', color: '#a5b4fc', fontSize: '14px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '22px' }}>
          🚀 Jasa Web Development Next.js
        </div>
        <h1 style={{ fontSize: '46px', fontWeight: 900, lineHeight: 1.25, color: '#ffffff', margin: '0 0 20px 0', letterSpacing: '-1px' }}>
          Website Bisnis Anda <br />
          <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mewah, Cepat & Siap Closing
          </span>
        </h1>
        <p style={{ fontSize: '19px', color: '#94a3b8', maxWidth: '620px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
          Tingkatkan kredibilitas brand Anda dengan website modern berbasis React. Loading di bawah 1 detik, optimal di semua ukuran smartphone.
        </p>

        {/* CTA Button with Glow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', padding: '18px 44px', borderRadius: '16px', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', color: '#ffffff', fontSize: '20px', fontWeight: 800, boxShadow: `0 12px ${glow * 2}px rgba(56, 189, 248, 0.45)` }}>
          <span>Konsultasi Proyek Gratis</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SCENE 2: SPEED BENCHMARK & METRICS (Mengapa Web Modern Menang)
// =============================================================================
function Scene2Speed({ frame, fps }) {
  const count = Math.min(99, Math.round(interpolate(frame, [5, 45], [20, 99], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));

  return (
    <div style={{ padding: '50px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', letterSpacing: '2px', textTransform: 'uppercase' }}>
          ⚡ Google PageSpeed Insights
        </span>
        <h2 style={{ fontSize: '38px', color: '#fff', fontWeight: 800, margin: '10px 0 0 0' }}>
          Kecepatan Ekstrem, Tanpa Lemot
        </h2>
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Web Lemot */}
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1.5px solid rgba(239, 68, 68, 0.25)', borderRadius: '20px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '42px', fontWeight: 900, color: '#ef4444', marginBottom: '8px' }}>4.8s</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fca5a5' }}>Web Biasa / WordPress Lemot</div>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '12px 0 0 0', lineHeight: 1.5 }}>
            73% pengunjung kabur sebelum website selesai loading.
          </p>
        </div>

        {/* Web Next.js */}
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1.5px solid rgba(34, 197, 94, 0.4)', borderRadius: '20px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 0 40px rgba(34, 197, 94, 0.15)' }}>
          <div style={{ fontSize: '42px', fontWeight: 900, color: '#22c55e', marginBottom: '8px' }}>0.5s</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#86efac' }}>Web Buatan Kami (Next.js)</div>
          <div style={{ display: 'inline-block', marginTop: '12px', padding: '4px 14px', borderRadius: '100px', background: '#22c55e', color: '#052e16', fontSize: '13px', fontWeight: 900 }}>
            SKOR GOOGLE {count}/100
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SCENE 3: INTERACTIVE MOUSE CURSOR ACTION (Klik Tombol Order)
// =============================================================================
function Scene3Interaction({ frame, fps }) {
  // Cursor trajectory moving from outside to the button
  const cursorX = interpolate(frame, [0, 40], [150, 450], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cursorY = interpolate(frame, [0, 40], [600, 390], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const isClicking = frame >= 42 && frame <= 54;
  const btnScale = isClicking ? 0.95 : interpolate(frame, [38, 42], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ padding: '60px 40px', textAlign: 'center', position: 'relative' }}>
      <MouseCursor x={cursorX} y={cursorY} isClicking={isClicking} clickScale={isClicking ? 0.9 : 1} />

      <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: '100px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '14px', fontWeight: 800, marginBottom: '24px' }}>
        ✨ INTERAKTIF & RESPONSIF TINGGI
      </div>
      <h2 style={{ fontSize: '42px', color: '#ffffff', fontWeight: 900, margin: '0 0 16px 0' }}>
        Kustom Sesuai Kebutuhan Bisnis
      </h2>
      <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 46px auto', lineHeight: 1.6 }}>
        Bisa integrasi WhatsApp checkout, payment gateway otomatis, katalog produk dinamis, hingga dashboard admin.
      </p>

      {/* Button that gets clicked by the mouse cursor */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '14px',
          padding: '20px 54px',
          borderRadius: '18px',
          background: isClicking ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'linear-gradient(135deg, #38bdf8, #6366f1)',
          color: '#ffffff',
          fontSize: '22px',
          fontWeight: 800,
          transform: `scale(${btnScale})`,
          boxShadow: isClicking ? '0 0 50px rgba(34, 197, 94, 0.8)' : '0 15px 40px rgba(56, 189, 248, 0.4)',
          transition: 'all 0.1s ease',
        }}
      >
        <span>{isClicking ? '✓ Pesanan Dikonfirmasi!' : 'Pesan Website Sekarang'}</span>
        <span>🚀</span>
      </div>
    </div>
  );
}

// =============================================================================
// SCENE 4: CTA PENAWARAN & DM @ADHLIL.CO
// =============================================================================
function Scene4CTA({ frame, fps }) {
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });

  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <div style={{ transform: `scale(${pop})` }}>
        <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(56, 189, 248, 0.5)' }}>
          💻
        </div>
        <h2 style={{ fontSize: '44px', color: '#ffffff', fontWeight: 900, margin: '0 0 16px 0' }}>
          Siap Punya Website Kelas Dunia?
        </h2>
        <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
          Konsultasikan ide bisnismu sekarang. Gratis review desain dan estimasi pengerjaan cepat.
        </p>

        <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.06)', border: '1.5px solid rgba(255, 255, 255, 0.15)', borderRadius: '24px', padding: '24px 48px', backdropFilter: 'blur(20px)' }}>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#38bdf8', marginBottom: '6px' }}>
            DM Instagram: @adhlil.co
          </div>
          <div style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 600 }}>
            WhatsApp / Link Portofolio ada di Bio!
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPOSITION EXPORT: BrowserMockupReel
// =============================================================================
export function BrowserMockupReel({ scenes = [], badgeText = '@adhlil.co' }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Subtle 3D Camera Tilt (Mockoops style perspective)
  const tiltX = Math.sin(frame * 0.04) * 3;
  const tiltY = Math.cos(frame * 0.03) * 4;

  // Calculate scene frames
  const scene1Duration = Math.round((scenes[0]?.duration || 7.5) * fps);
  const scene2Duration = Math.round((scenes[1]?.duration || 7.0) * fps);
  const scene3Duration = Math.round((scenes[2]?.duration || 8.0) * fps);
  const scene4Duration = Math.round((scenes[3]?.duration || 7.5) * fps);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
      }}
    >
      {/* Background Mesh Gradient Lighting */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          width: '1000px',
          height: '1000px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.12) 40%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Badge */}
      <div
        style={{
          position: 'absolute',
          top: '64px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            padding: '10px 24px',
            borderRadius: '100px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
            {badgeText} • JASA PEMBUATAN WEB
          </span>
        </div>
      </div>

      {/* 3D FLOATING SAFARI BROWSER (MOCKOOPS SHOWCASE) */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          left: '50%',
          transform: `translateX(-50%) perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: 'transform 0.1s ease',
          zIndex: 20,
        }}
      >
        <SafariBrowserWindow url="https://bisnis-modern.com">
          <Sequence from={0} durationInFrames={scene1Duration}>
            <Scene1Hero frame={frame} fps={fps} />
          </Sequence>

          <Sequence from={scene1Duration} durationInFrames={scene2Duration}>
            <Scene2Speed frame={frame - scene1Duration} fps={fps} />
          </Sequence>

          <Sequence from={scene1Duration + scene2Duration} durationInFrames={scene3Duration}>
            <Scene3Interaction frame={frame - (scene1Duration + scene2Duration)} fps={fps} />
          </Sequence>

          <Sequence from={scene1Duration + scene2Duration + scene3Duration} durationInFrames={scene4Duration + 60}>
            <Scene4CTA frame={frame - (scene1Duration + scene2Duration + scene3Duration)} fps={fps} />
          </Sequence>
        </SafariBrowserWindow>
      </div>

      {/* BOTTOM CAPTION BAR (KINETIC TEXT HIGHLIGHT) */}
      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          textAlign: 'center',
          zIndex: 30,
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '24px 32px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Sequence from={0} durationInFrames={scene1Duration}>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
              Mau bisnis Anda terlihat profesional? <span style={{ color: '#38bdf8' }}>Website modern</span> adalah kuncinya!
            </p>
          </Sequence>

          <Sequence from={scene1Duration} durationInFrames={scene2Duration}>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
              Tinggalkan web lemot! Kami bangun dengan Next.js, <span style={{ color: '#22c55e' }}>loading cuma 0.5 detik</span>.
            </p>
          </Sequence>

          <Sequence from={scene1Duration + scene2Duration} durationInFrames={scene3Duration}>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
              Tampilan interaktif dan responsif, <span style={{ color: '#facc15' }}>otomatis siap mendatangkan pembeli</span>.
            </p>
          </Sequence>

          <Sequence from={scene1Duration + scene2Duration + scene3Duration} durationInFrames={scene4Duration + 60}>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
              Siap naik kelas? <span style={{ color: '#38bdf8' }}>DM kami di @adhlil.co</span> untuk konsultasi gratis!
            </p>
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
}
