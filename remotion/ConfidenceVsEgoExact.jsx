import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// --- MINIMALIST GOLD EMBLEM LOGO ---
function GoldEmblem() {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 90, [0, 45, 90], [0.85, 1, 0.85]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: shimmer,
      }}
    >
      <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
        <path
          d="M32 4L6 44H20L32 24L44 44H58L32 4Z"
          fill="url(#goldGradCarrot)"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(234, 179, 8, 0.35))' }}
        />
        <path d="M32 14L20 34H28L32 26L36 34H44L32 14Z" fill="#0a0a0c" />
        <defs>
          <linearGradient id="goldGradCarrot" x1="6" y1="4" x2="58" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.4" stopColor="#eab308" />
            <stop offset="0.8" stopColor="#ca8a04" />
            <stop offset="1" stopColor="#854d0e" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// --- WIND LINES ---
function WindGusts() {
  const frame = useCurrentFrame();

  const lines = [
    { y: 620, speed: 28, delay: 0, length: 240 },
    { y: 680, speed: 34, delay: 12, length: 320 },
    { y: 740, speed: 24, delay: 24, length: 200 },
    { y: 800, speed: 38, delay: 6, length: 280 },
    { y: 860, speed: 30, delay: 18, length: 220 },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {lines.map((l, i) => {
        const lineFrame = (frame + l.delay * 5) % 90;
        const x = interpolate(lineFrame, [0, 90], [-300, 1380]);
        const opacity = interpolate(lineFrame, [0, 20, 70, 90], [0, 0.8, 0.8, 0]);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${l.y}px`,
              left: `${x}px`,
              width: `${l.length}px`,
              height: '3px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)',
              borderRadius: '2px',
              opacity,
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6))',
            }}
          />
        );
      })}
    </div>
  );
}

export function ConfidenceVsEgoExact() {
  const frame = useCurrentFrame();

  // Subtle leaf sway
  const egoSway = Math.sin(frame / 6) * 4;
  const confSway = Math.sin(frame / 12) * 1.5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0d',
        overflow: 'hidden',
        fontFamily: '"Montserrat", "Inter", -apple-system, sans-serif',
      }}
    >
      {/* Dark Ambient Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 40%, #1e1e24 0%, #0c0c0f 50%, #050507 90%)',
        }}
      />

      {/* Soil Horizon Layer */}
      <div
        style={{
          position: 'absolute',
          top: '900px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #070709 0%, #030304 100%)',
          borderTop: '2px solid rgba(255, 255, 255, 0.08)',
        }}
      />

      {/* Animated Wind Lines */}
      <WindGusts />

      {/* LEFT: CONFIDENCE (Small Leaf, Deep Massive Golden Root) */}
      <div
        style={{
          position: 'absolute',
          top: '840px',
          left: '260px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Small Leaf Sprout */}
        <div
          style={{
            transform: `rotate(${confSway}deg)`,
            transformOrigin: 'bottom center',
            marginBottom: '-6px',
            zIndex: 5,
          }}
        >
          <svg width="70" height="70" viewBox="0 0 70 70">
            <path
              d="M35 60 C20 40 15 20 35 5 C55 20 50 40 35 60Z"
              fill="#22c55e"
              style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))' }}
            />
            <path d="M35 60 C10 48 5 35 15 20 C25 25 30 40 35 60Z" fill="#16a34a" />
            <path d="M35 60 C60 48 65 35 55 20 C45 25 40 40 35 60Z" fill="#16a34a" />
          </svg>
        </div>

        {/* Huge Deep Golden Root */}
        <div style={{ position: 'relative', zIndex: 4 }}>
          <svg width="120" height="340" viewBox="0 0 120 340">
            {/* Carrot Root Body */}
            <path
              d="M20 10 Q 60 0 100 10 Q 80 200 60 330 Q 40 200 20 10 Z"
              fill="url(#carrotGold)"
              style={{ filter: 'drop-shadow(0 0 25px rgba(234, 179, 8, 0.4))' }}
            />
            {/* Horizontal Grooves / Details */}
            <path d="M30 60 Q 60 65 90 60" stroke="#854d0e" strokeWidth="4" fill="none" />
            <path d="M35 120 Q 60 125 85 120" stroke="#854d0e" strokeWidth="4" fill="none" />
            <path d="M42 190 Q 60 193 78 190" stroke="#854d0e" strokeWidth="3.5" fill="none" />
            <path d="M48 260 Q 60 262 72 260" stroke="#854d0e" strokeWidth="3" fill="none" />
            <defs>
              <linearGradient id="carrotGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#eab308" />
                <stop offset="85%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Label: Confidence */}
        <span
          style={{
            marginTop: '36px',
            color: '#facc15',
            fontSize: '38px',
            fontWeight: 800,
            letterSpacing: '1px',
            textShadow: '0 0 25px rgba(250, 204, 21, 0.4)',
          }}
        >
          Confidence
        </span>
      </div>

      {/* RIGHT: EGO (Giant Swaying Leaves, Tiny Frail Root) */}
      <div
        style={{
          position: 'absolute',
          top: '640px',
          right: '240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Giant Flamboyant Bushy Leaves */}
        <div
          style={{
            transform: `rotate(${egoSway}deg) scale(1.4)`,
            transformOrigin: 'bottom center',
            marginBottom: '-10px',
            zIndex: 5,
          }}
        >
          <svg width="220" height="200" viewBox="0 0 220 200">
            {/* Center giant leaf */}
            <path
              d="M110 190 C60 130 50 50 110 10 C170 50 160 130 110 190Z"
              fill="#22c55e"
              style={{ filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.7))' }}
            />
            {/* Left giant leaf */}
            <path
              d="M110 190 C30 150 10 90 40 40 C75 60 85 120 110 190Z"
              fill="#16a34a"
              style={{ filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.5))' }}
            />
            {/* Right giant leaf */}
            <path
              d="M110 190 C190 150 210 90 180 40 C145 60 135 120 110 190Z"
              fill="#16a34a"
              style={{ filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.5))' }}
            />
            {/* Extra decorative curls */}
            <circle cx="110" cy="45" r="14" fill="#4ade80" />
            <circle cx="65" cy="75" r="12" fill="#4ade80" />
            <circle cx="155" cy="75" r="12" fill="#4ade80" />
          </svg>
        </div>

        {/* Tiny Puny Root */}
        <div style={{ position: 'relative', zIndex: 4 }}>
          <svg width="50" height="110" viewBox="0 0 50 110">
            <path
              d="M15 5 Q 25 0 35 5 Q 30 50 25 100 Q 20 50 15 5 Z"
              fill="url(#carrotGold)"
            />
            <path d="M18 30 Q 25 32 32 30" stroke="#854d0e" strokeWidth="2" fill="none" />
            <path d="M20 60 Q 25 61 30 60" stroke="#854d0e" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        {/* Label: Ego */}
        <span
          style={{
            marginTop: '36px',
            color: '#facc15',
            fontSize: '38px',
            fontWeight: 800,
            letterSpacing: '1px',
            textShadow: '0 0 25px rgba(250, 204, 21, 0.4)',
          }}
        >
          Ego
        </span>
      </div>

      {/* Gold Emblem Logo at Bottom */}
      <GoldEmblem />
    </AbsoluteFill>
  );
}
