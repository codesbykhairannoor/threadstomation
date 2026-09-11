import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// --- TRANVAS OFFICIAL BRAND EMBLEM ---
function TranvasOfficialLogo({ watermark = 'tranvas.com' }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 120, [0, 60, 120], [0.85, 1, 0.85]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        opacity: shimmer,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Tranvas Electric Indigo Logo */}
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <rect width="52" height="52" rx="16" fill="url(#tranvasOfficialBg)" />
          <path
            d="M14 16H38V22H29V36H23V22H14V16Z"
            fill="url(#tranvasIndigoGrad)"
            style={{ filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.7))' }}
          />
          <defs>
            <linearGradient id="tranvasOfficialBg" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="tranvasIndigoGrad" x1="14" y1="16" x2="38" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        <span
          style={{
            color: '#ffffff',
            fontSize: '32px',
            fontWeight: 900,
            letterSpacing: '-1px',
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          }}
        >
          Tranvas<span style={{ color: '#6366f1' }}>.</span>
        </span>
      </div>

      <span
        style={{
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}
      >
        {watermark}
      </span>
    </div>
  );
}

// =========================================================================
// VARIANT 1: 10-12s ULTRA-SMOOTH MULTI-PHASE 3D FLIP (BUSY -> CALM -> FLOW)
// =========================================================================
function UltraSmoothFlipTile({
  fromLetter,
  midLetter,
  toLetter,
  flip1Frame = 60,
  flip2Frame = 180,
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 Flip
  const progress1 = spring({
    frame: frame - flip1Frame,
    fps,
    config: { mass: 1.1, stiffness: 65, damping: 14 },
  });

  // Phase 2 Flip
  const progress2 = spring({
    frame: frame - flip2Frame,
    fps,
    config: { mass: 1.1, stiffness: 65, damping: 14 },
  });

  const rotX1 = interpolate(progress1, [0, 1], [0, 180], { extrapolateRight: 'clamp' });
  const rotX2 = interpolate(progress2, [0, 1], [0, 180], { extrapolateRight: 'clamp' });

  const totalRotX = rotX1 + rotX2;
  const isPhase1 = totalRotX < 90;
  const isPhase2 = totalRotX >= 90 && totalRotX < 270;

  const currentLetter = isPhase1 ? fromLetter : isPhase2 ? midLetter : toLetter;
  const letterRot = isPhase1 ? 'none' : isPhase2 ? 'rotateX(180deg)' : 'none';

  return (
    <div style={{ width: '150px', height: '165px', perspective: '1200px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${totalRotX}deg)`,
          borderRadius: '24px',
          background: 'linear-gradient(160deg, #1e1e38 0%, #0f1123 60%, #080914 100%)',
          border: '1.5px solid rgba(99, 102, 241, 0.35)',
          boxShadow:
            '0 30px 60px -15px rgba(0, 0, 0, 0.95), inset 0 2px 3px rgba(255, 255, 255, 0.15), 0 0 30px rgba(79, 70, 229, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Split flap seam */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: '2px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 10,
          }}
        />

        <span
          style={{
            color: isPhase1 ? '#f87171' : isPhase2 ? '#38bdf8' : '#818cf8',
            fontSize: '94px',
            fontWeight: 900,
            fontFamily: '"Plus Jakarta Sans", "Montserrat", sans-serif',
            letterSpacing: '-2px',
            transform: letterRot,
            textShadow: isPhase1
              ? '0 0 25px rgba(248, 113, 113, 0.5)'
              : '0 0 35px rgba(56, 189, 248, 0.6)',
          }}
        >
          {currentLetter}
        </span>
      </div>
    </div>
  );
}

export function TranvasFlipVideo({
  fromWord = 'BUSY',
  midWord = 'CALM',
  toWord = 'FLOW',
  watermark = 'tranvas.com',
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const pulse = 1 + Math.sin(frame / 20) * 0.03;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Tranvas Electric Indigo Ambient Lighting */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '900px',
          height: '900px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, rgba(56, 189, 248, 0.08) 40%, transparent 70%)',
          transform: `translate(-50%, -50%) scale(${pulse})`,
          filter: 'blur(100px)',
        }}
      />

      {/* Floating Category Pill */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(20px)',
          padding: '10px 24px',
          borderRadius: '100px',
          marginBottom: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
        <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '18px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
          All-in-One Life OS
        </span>
      </div>

      {/* 4 3D Flip Tiles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {fromWord.split('').map((ch, i) => (
          <UltraSmoothFlipTile
            key={i}
            fromLetter={ch}
            midLetter={midWord[i] || ch}
            toLetter={toWord[i] || ch}
            flip1Frame={60 + i * 12}
            flip2Frame={180 + i * 12}
          />
        ))}
      </div>

      <TranvasOfficialLogo watermark={watermark} />
    </AbsoluteFill>
  );
}

// =========================================================================
// VARIANT 2: 10-12s SECOND BRAIN UNIFIED HUB (Chaos Nodes -> Single Platform)
// =========================================================================
export function TranvasChaosToStructureVideo({ watermark = 'tranvas.com' }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Smooth easing from frame 40 to 140
  const progress = spring({
    frame: frame - 40,
    fps,
    config: { mass: 1.4, stiffness: 45, damping: 16 },
  });

  const nodes = [
    { id: 1, startX: -260, startY: -220, endX: -180, endY: -110, label: 'Tasks & Projects', icon: '⚡' },
    { id: 2, startX: 250, startY: -180, endX: 0, endY: -110, label: 'Daily Habits', icon: '🔥' },
    { id: 3, startX: -220, startY: 180, endX: 180, endY: -110, label: 'Finance & Assets', icon: '📈' },
    { id: 4, startX: 220, startY: 160, endX: -180, endY: 70, label: 'Knowledge Base', icon: '🧠' },
    { id: 5, startX: 0, startY: -280, endX: 0, endY: 70, label: 'Calendar Sync', icon: '📅' },
    { id: 6, startX: -20, startY: 260, endX: 180, endY: 70, label: 'Academic & Goals', icon: '🎯' },
  ];

  const titleSpring = spring({ frame: frame - 15, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Background Lighting */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '950px',
          height: '950px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 75%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Dynamic Header */}
      <div
        style={{
          position: 'absolute',
          top: '240px',
          textAlign: 'center',
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
        }}
      >
        <span style={{ color: '#818cf8', fontSize: '20px', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>
          {progress < 0.5 ? '5 Disconnected Apps' : 'One Unified Platform'}
        </span>
        <h1 style={{ color: '#ffffff', fontSize: '58px', fontWeight: 900, letterSpacing: '-1.5px', margin: '12px 0 0 0' }}>
          {progress < 0.5 ? 'Scattered Cognitive Load' : 'Total Mental Clarity'}
        </h1>
      </div>

      {/* Central Interactive Grid */}
      <div style={{ position: 'relative', width: '650px', height: '540px', marginTop: '70px' }}>
        {/* Dynamic Glowing Data Links */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox="-325 -270 650 540"
        >
          {nodes.map((n, i) => {
            if (i >= nodes.length - 1) return null;
            const next = nodes[i + 1];
            const currX = interpolate(progress, [0, 1], [n.startX, n.endX]);
            const currY = interpolate(progress, [0, 1], [n.startY, n.endY]);
            const nextX = interpolate(progress, [0, 1], [next.startX, next.endX]);
            const nextY = interpolate(progress, [0, 1], [next.startY, next.endY]);

            return (
              <line
                key={i}
                x1={currX}
                y1={currY}
                x2={nextX}
                y2={nextY}
                stroke={progress > 0.4 ? 'rgba(99, 102, 241, 0.45)' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth={progress > 0.4 ? 2.5 : 1}
                strokeDasharray={progress > 0.4 ? 'none' : '4 4'}
              />
            );
          })}
        </svg>

        {/* The 6 Feature Cards */}
        {nodes.map((n) => {
          const x = interpolate(progress, [0, 1], [n.startX, n.endX]);
          const y = interpolate(progress, [0, 1], [n.startY, n.endY]);

          return (
            <div
              key={n.id}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                background: progress > 0.5 ? 'rgba(99, 102, 241, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                border: progress > 0.5 ? '1.5px solid rgba(99, 102, 241, 0.6)' : '1.5px dashed rgba(239, 68, 68, 0.4)',
                borderRadius: '18px',
                padding: '16px 22px',
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: progress > 0.5 ? '0 10px 30px rgba(79, 70, 229, 0.25)' : 'none',
                backdropFilter: 'blur(16px)',
              }}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          );
        })}
      </div>

      <TranvasOfficialLogo watermark={watermark} />
    </AbsoluteFill>
  );
}
