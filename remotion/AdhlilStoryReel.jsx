import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import { DynamicScene } from './SceneRegistry.jsx';

// =========================================================================
// WORD HIGHLIGHT TEXT — Core viral element
// Renders caption with specific keyword highlighted (colored + background)
// =========================================================================
function HighlightCaption({ caption, highlightWord, highlightColor = '#ef4444', textColor = '#ffffff' }) {
  if (!caption) return null;

  const parts = [];
  if (highlightWord && caption.includes(highlightWord)) {
    const idx = caption.indexOf(highlightWord);
    const before = caption.slice(0, idx);
    const after = caption.slice(idx + highlightWord.length);
    if (before) parts.push({ text: before, highlight: false });
    parts.push({ text: highlightWord, highlight: true });
    if (after) parts.push({ text: after, highlight: false });
  } else {
    parts.push({ text: caption, highlight: false });
  }

  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 7) * 0.02;
  const glow = 16 + Math.sin(frame / 7) * 8;

  return (
    <p
      style={{
        fontSize: '52px',
        fontWeight: 800,
        lineHeight: 1.35,
        textAlign: 'center',
        margin: 0,
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '-0.5px',
      }}
    >
      {parts.map((p, i) =>
        p.highlight ? (
          <span
            key={i}
            style={{
              color: highlightColor,
              backgroundColor: `${highlightColor}28`,
              borderRadius: '12px',
              padding: '2px 14px',
              display: 'inline-block',
              transform: `scale(${pulse})`,
              boxShadow: `0 0 ${glow}px ${highlightColor}35`,
            }}
          >
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </p>
  );
}

// =========================================================================
// SCENE TRANSITION — Smooth slide/fade between scenes
// =========================================================================
function SceneTransition({ children, enterFrom = 'bottom' }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Enter animation
  const enterProgress = spring({
    frame,
    fps,
    config: { mass: 0.8, stiffness: 100, damping: 18 },
  });

  // Exit animation (last 12 frames)
  const exitStart = durationInFrames - 12;
  const exitProgress = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const enterY = enterFrom === 'bottom' ? interpolate(enterProgress, [0, 1], [60, 0]) : interpolate(enterProgress, [0, 1], [-60, 0]);
  const opacity = Math.min(enterProgress, 1 - exitProgress * 0.85);
  const scale = interpolate(enterProgress, [0, 1], [0.96, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        transform: `translateY(${enterY}px) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
}

// =========================================================================
// MOCK UI COMPONENTS — Realistic upper-zone visuals
// =========================================================================

// VARIANT A: Task overflow — scattered chaos
function TaskOverflowMock() {
  const tasks = [
    { text: 'Follow up proposal klien', overdue: true },
    { text: 'Buat laporan mingguan', overdue: true },
    { text: 'Meeting dengan tim 3pm', overdue: false },
    { text: 'Reply email Pak Reza', overdue: false },
    { text: '+ 9 task lainnya belum disentuh...', overdue: false, faded: true },
  ];

  return (
    <div
      style={{
        width: '800px',
        borderRadius: '24px',
        background: '#ffffff',
        padding: '32px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>📋 My Tasks — Senin</span>
        <span style={{ fontSize: '17px', color: '#ef4444', fontWeight: 800, background: '#fee2e2', padding: '6px 14px', borderRadius: '100px' }}>2 overdue</span>
      </div>
      {tasks.map((t, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '15px 0',
            borderBottom: i < tasks.length - 1 ? '1px solid #f1f5f9' : 'none',
            opacity: t.faded ? 0.45 : 1,
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              border: t.overdue ? '2.5px solid #ef4444' : '2px solid #cbd5e1',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '21px',
              color: t.overdue ? '#dc2626' : '#475569',
              fontWeight: t.overdue ? 700 : 500,
              fontStyle: t.faded ? 'italic' : 'normal',
            }}
          >
            {t.text}
          </span>
          {t.overdue && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '15px',
                color: '#ef4444',
                fontWeight: 800,
                background: '#fee2e2',
                padding: '4px 12px',
                borderRadius: '100px',
                flexShrink: 0,
              }}
            >
              TERLAMBAT
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// VARIANT B: App sprawl — scattered 6 apps, no sync
function AppSprawlMock({ frame }) {
  const apps = [
    { icon: '📧', name: 'Gmail', tag: '23 unread' },
    { icon: '📅', name: 'Calendar', tag: '2 konflik' },
    { icon: '📝', name: 'Notion', tag: '15 pages' },
    { icon: '💬', name: 'WhatsApp', tag: '47 pesan' },
    { icon: '📊', name: 'Sheets', tag: 'tidak update' },
    { icon: '🔗', name: 'ClickUp', tag: '8 tasks' },
  ];

  return (
    <div style={{ width: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#94a3b8',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          6 app. 0 yang sinkron.
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
        {apps.map((app, i) => {
          const sway = Math.sin(frame * 0.08 + i * 1.2) * 5;
          return (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: '20px',
                padding: '22px 18px',
                textAlign: 'center',
                backdropFilter: 'blur(12px)',
                transform: `translateY(${sway}px)`,
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>{app.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>{app.name}</div>
              <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>{app.tag}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// VARIANT C: Habit tracker streak broken
function HabitStreakMock() {
  const days = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];
  const completed = [true, true, false, false, false, false, false];

  return (
    <div
      style={{
        width: '800px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b' }}>🔥 Daily Habits</div>
          <div style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>Streak minggu ini</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '42px', fontWeight: 900, color: '#ef4444' }}>2</div>
          <div style={{ fontSize: '15px', color: '#94a3b8' }}>hari berturut</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>{d}</div>
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '12px',
                background: completed[i] ? '#10b981' : '#f1f5f9',
                border: completed[i] ? 'none' : '2px dashed #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              {completed[i] ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '20px',
          background: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: '14px',
          padding: '14px 20px',
          fontSize: '18px',
          color: '#dc2626',
          fontWeight: 700,
        }}
      >
        ⚠️ Streak putus 5 hari berturut-turut
      </div>
    </div>
  );
}

// VARIANT D: Tranvas unified dashboard (solution)
function TransDashboardMock({ frame }) {
  const metrics = [
    { icon: '⚡', label: 'Tasks Done', value: '12/14', color: '#6366f1', trend: '+3 hari ini' },
    { icon: '🔥', label: 'Habit Streak', value: '21 hari', color: '#f97316', trend: 'Personal best!' },
    { icon: '🧠', label: 'Focus Score', value: '87%', color: '#10b981', trend: '+12 vs kemarin' },
    { icon: '📅', label: 'Meeting', value: '1 sisa', color: '#38bdf8', trend: 'jam 3pm' },
  ];

  return (
    <div
      style={{
        width: '800px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '13px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 900,
          }}
        >
          T
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>Tranvas Dashboard</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Senin, Semua Sinkron ✓</div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            background: '#dcfce7',
            color: '#16a34a',
            padding: '8px 18px',
            borderRadius: '100px',
            fontSize: '16px',
            fontWeight: 800,
          }}
        >
          ● Online
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {metrics.map((m, i) => {
          const appear = spring({
            frame: useCurrentFrame() - i * 5,
            fps: 30,
            config: { damping: 15, stiffness: 90 },
          });
          return (
            <div
              key={i}
              style={{
                background: '#f8fafc',
                borderRadius: '18px',
                padding: '20px',
                opacity: appear,
                transform: `translateY(${interpolate(appear, [0, 1], [20, 0])}px)`,
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{m.icon}</div>
              <div style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#1e293b', margin: '4px 0' }}>{m.value}</div>
              <div style={{ fontSize: '14px', color: m.color, fontWeight: 700 }}>{m.trend}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// VARIANT E: Affiliate income showcase
function AffiliateIncomeMock({ frame }) {
  const progress = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: 'clamp' });
  const earnings = interpolate(progress, [0, 1], [0, 890000]);

  return (
    <div
      style={{
        width: '800px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase' }}>Pendapatan Afiliasi</div>
        <div style={{ fontSize: '64px', fontWeight: 900, color: '#10b981', letterSpacing: '-2px', marginTop: '8px' }}>
          Rp {Math.round(earnings).toLocaleString('id-ID')}
        </div>
        <div style={{ fontSize: '18px', color: '#94a3b8', marginTop: '4px' }}>bulan ini • recurring</div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#f1f5f9', borderRadius: '100px', height: '12px', overflow: 'hidden', marginBottom: '20px' }}>
        <div
          style={{
            height: '100%',
            width: `${progress * 72}%`,
            background: 'linear-gradient(90deg, #10b981, #6366f1)',
            borderRadius: '100px',
            boxShadow: '0 0 12px rgba(16,185,129,0.5)',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#64748b', fontWeight: 600 }}>
        <span>Dari 8 referral aktif</span>
        <span style={{ color: '#10b981', fontWeight: 800 }}>Komisi 60% • Tiap bulan</span>
      </div>

      <div
        style={{
          marginTop: '20px',
          background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
          borderRadius: '16px',
          padding: '18px 24px',
          fontSize: '18px',
          color: '#6366f1',
          fontWeight: 700,
        }}
      >
        💡 1 referral = Rp 89.400 / bulan recurring
      </div>
    </div>
  );
}

// VARIANT F: CTA splash screen with branding
function CTASplashMock({ frame }) {
  const pulse = 1 + Math.sin(frame * 0.15) * 0.025;

  return (
    <div
      style={{
        width: '800px',
        background: 'linear-gradient(145deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)',
        borderRadius: '28px',
        padding: '52px 40px',
        textAlign: 'center',
        boxShadow: '0 30px 80px rgba(99,102,241,0.4)',
        transform: `scale(${pulse})`,
      }}
    >
      <div style={{ fontSize: '68px', marginBottom: '18px' }}>🚀</div>
      <h2
        style={{
          color: '#ffffff',
          fontSize: '48px',
          fontWeight: 900,
          margin: '0 0 12px 0',
          letterSpacing: '-1.5px',
        }}
      >
        Tranvas
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '22px', margin: '0 0 36px 0', lineHeight: 1.4 }}>
        All-in-One Life OS
      </p>
      <div
        style={{
          background: '#ffffff',
          color: '#6366f1',
          fontSize: '24px',
          fontWeight: 900,
          padding: '20px 44px',
          borderRadius: '100px',
          display: 'inline-block',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        }}
      >
        Coba Gratis → tranvas.com
      </div>
      <div
        style={{
          marginTop: '22px',
          color: 'rgba(255,255,255,0.65)',
          fontSize: '18px',
          fontWeight: 600,
        }}
      >
        @adhlil.co • Link di bio
      </div>
    </div>
  );
}

// Map visual type → component
function VisualMock({ type, frame }) {
  switch (type) {
    case 'task_overflow':     return <TaskOverflowMock />;
    case 'app_sprawl':        return <AppSprawlMock frame={frame} />;
    case 'habit_broken':      return <HabitStreakMock />;
    case 'tranvas_dashboard': return <TransDashboardMock frame={frame} />;
    case 'affiliate_income':  return <AffiliateIncomeMock frame={frame} />;
    case 'cta_splash':        return <CTASplashMock frame={frame} />;
    default:                  return <TaskOverflowMock />;
  }
}

// =========================================================================
// FLOATING PARTICLES — Ambient depth for dark scenes
// =========================================================================
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: (i * 73 + 40) % 960 + 60,
  baseY: (i * 113) % 1600 + 200,
  size: (i % 3) + 2,
  speed: ((i % 3) + 1) * 0.9,
  seed: i * 23,
  color: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#a855f7' : '#38bdf8',
}));

function ParticleField() {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {PARTICLES.map((p) => {
        const curY = (p.baseY - frame * p.speed) % 1800;
        const actualY = curY < 0 ? curY + 1800 : curY;
        const curX = p.x + Math.sin((frame + p.seed) / 24) * 20;
        const opacity = interpolate(Math.sin((frame + p.seed) / 18), [-1, 1], [0.15, 0.55]);
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${curX}px`,
              top: `${actualY}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
          />
        );
      })}
    </div>
  );
}

// =========================================================================
// SCENE BADGE — Sleek centered pill ("MASALAH 1", "SOLUSI 1", etc.)
// =========================================================================
function SceneBadge({ scene, sceneIndex }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgeSpring = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });

  const typeMap = {
    hook:     { label: 'HOOK',       num: '⚡', color: '#f97316' },
    pain:     { label: `MASALAH ${sceneIndex}`, num: `${sceneIndex}`, color: '#ef4444' },
    solution: { label: `SOLUSI ${Math.max(1, sceneIndex - 1)}`, num: `${Math.max(1, sceneIndex - 1)}`, color: '#10b981' },
    benefit:  { label: 'BENEFIT',    num: '★', color: '#38bdf8' },
    affiliate:{ label: 'AFFILIATE',  num: '💰', color: '#6366f1' },
    cta:      { label: 'ACTION',     num: '→', color: '#a855f7' },
  };

  const badge = typeMap[scene.type] || { label: scene.type?.toUpperCase() || 'SCENE', num: '●', color: '#6366f1' };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        background: `${badge.color}18`,
        border: `1.5px solid ${badge.color}45`,
        padding: '8px 22px 8px 10px',
        borderRadius: '100px',
        backdropFilter: 'blur(12px)',
        opacity: badgeSpring,
        transform: `scale(${badgeSpring}) translateY(${interpolate(badgeSpring, [0, 1], [-8, 0])}px)`,
        boxShadow: `0 4px 20px ${badge.color}15`,
      }}
    >
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: badge.color,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 900,
        }}
      >
        {badge.num}
      </div>
      <span
        style={{
          fontSize: '17px',
          fontWeight: 900,
          color: badge.color,
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        {badge.label}
      </span>
    </div>
  );
}

// =========================================================================
// SINGLE SCENE — Cohesive vertical center stack (Sample-video layout)
// =========================================================================
function StoryScene({ scene, sceneIndex, totalScenes, badgeText }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const isDark = scene.type === 'hook' || scene.type === 'pain' || scene.type === 'app_sprawl';
  const bgColor = isDark ? '#080c14' : '#f0f4f8';
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const captionSubtextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(30,41,59,0.5)';

  // Silky smooth entrance springs
  const visualSpring = spring({
    frame: frame - 2,
    fps,
    config: { mass: 0.6, stiffness: 65, damping: 14 },
  });
  const visualY = interpolate(visualSpring, [0, 1], [35, 0]);
  const visualScale = interpolate(visualSpring, [0, 1], [0.93, 1]);
  const visualOpacity = interpolate(visualSpring, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });

  const captionSpring = spring({
    frame: frame - 8,
    fps,
    config: { mass: 0.7, stiffness: 60, damping: 15 },
  });
  const captionY = interpolate(captionSpring, [0, 1], [25, 0]);
  const captionOpacity = interpolate(captionSpring, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' });

  // Seamless exit transition on the last 10 frames (no more hard cuts!)
  const exitStart = Math.max(0, durationInFrames - 10);
  const exitProgress = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitOpacity = 1 - exitProgress;
  const exitY = interpolate(exitProgress, [0, 1], [0, -28]);
  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.96]);

  // Continuous 2.2% camera drift so the scene never sits frozen static
  const cameraDrift = interpolate(frame, [0, durationInFrames], [0.985, 1.022], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Progress dots (bottom indicator)
  const hasDots = scene.type !== 'cta';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
      }}
    >
      {/* Ambient glow for dark scenes */}
      {isDark && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '900px',
              height: '900px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${scene.highlightColor || '#6366f1'}18 0%, transparent 65%)`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(100px)',
              pointerEvents: 'none',
            }}
          />
          <ParticleField />
        </>
      )}

      {/* Subtle grid for light scenes */}
      {!isDark && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Account watermark pill — top right */}
      {badgeText && (
        <div
          style={{
            position: 'absolute',
            top: '72px',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border: isDark ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(0,0,0,0.1)',
            padding: '10px 22px',
            borderRadius: '100px',
            backdropFilter: 'blur(10px)',
            zIndex: 30,
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#ffffff' : '#1e293b', letterSpacing: '0.5px' }}>
            {badgeText}
          </span>
        </div>
      )}

      {/* UNIFIED CENTER CLUSTER: Badge + Visual + Caption */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 70px',
          boxSizing: 'border-box',
          zIndex: 20,
          opacity: exitOpacity,
          transform: `scale(${cameraDrift * exitScale}) translateY(${exitY}px)`,
        }}
      >
        {/* Scene badge — sits directly above the visual */}
        {scene.type !== 'cta' && (
          <div style={{ marginBottom: '26px' }}>
            <SceneBadge scene={scene} sceneIndex={sceneIndex} />
          </div>
        )}

        {/* Visual mock — centered */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${visualScale}) translateY(${visualY}px)`,
            opacity: visualOpacity,
            marginBottom: '36px',
          }}
        >
          <DynamicScene component={scene.visual} data={scene.data || {}} />
        </div>

        {/* Caption + highlight — tight underneath visual */}
        <div
          style={{
            width: '100%',
            maxWidth: '920px',
            textAlign: 'center',
            transform: `translateY(${captionY}px)`,
            opacity: captionOpacity,
          }}
        >
          {scene.subcaption && (
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: captionSubtextColor,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              {scene.subcaption}
            </div>
          )}

          <HighlightCaption
            caption={scene.caption}
            highlightWord={scene.highlightWord}
            highlightColor={scene.highlightColor || '#ef4444'}
            textColor={textColor}
          />
        </div>
      </div>

      {/* Progress dots — bottom center */}
      {hasDots && (
        <div
          style={{
            position: 'absolute',
            bottom: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            zIndex: 30,
          }}
        >
          {Array.from({ length: totalScenes - 1 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === sceneIndex - 1 ? '28px' : '8px',
                height: '8px',
                borderRadius: '100px',
                background: i === sceneIndex - 1
                  ? (scene.highlightColor || '#6366f1')
                  : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(30,41,59,0.2)'),
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
}

// =========================================================================
// ROOT EXPORT — AdhlilStoryReel
// =========================================================================
export function AdhlilStoryReel({ scenes = [], badgeText = '@adhlil.co' }) {
  if (!scenes || scenes.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: '#080c14' }} />;
  }

  const fps = 30;
  let accumulated = 0;

  return (
    <AbsoluteFill>
      {scenes.map((scene, idx) => {
        const durationFrames = Math.round((scene.duration || 3.5) * fps);
        const startFrame = accumulated;
        accumulated += durationFrames;

        return (
          <Sequence key={idx} from={startFrame} durationInFrames={durationFrames}>
            <StoryScene
              scene={scene}
              sceneIndex={idx}
              totalScenes={scenes.length}
              badgeText={badgeText}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

export const StoryReel = AdhlilStoryReel;
