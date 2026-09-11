import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// --- TRANVAS BRAND LOGO EMBLEM ---
function TranvasEmblem({ watermark = '@tranvas' }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 90, [0, 45, 90], [0.85, 1, 0.85]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        opacity: shimmer,
      }}
    >
      {/* Tranvas Cyan-Indigo Modern Geometric Tech Monogram */}
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="16" fill="url(#tranvasBg)" />
        <path
          d="M16 18H40V24H31V38H25V24H16V18Z"
          fill="url(#tranvasGlow)"
          style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.6))' }}
        />
        <defs>
          <linearGradient id="tranvasBg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e1e2d" />
            <stop offset="100%" stopColor="#0f0f17" />
          </linearGradient>
          <linearGradient id="tranvasGlow" x1="16" y1="18" x2="40" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
      <span
        style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '18px',
          fontWeight: 700,
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
// VARIANT 1: 3D FLIP TILES (CHAOS -> FOCUS or BUSY -> CALM)
// =========================================================================
function FlipTile({ fromLetter, toLetter, flipStartFrame = 50 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flipProgress = spring({
    frame: frame - flipStartFrame,
    fps,
    config: { stiffness: 125, damping: 12 },
  });

  const rotX = interpolate(flipProgress, [0, 1], [0, 180], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const showFront = rotX < 90;

  return (
    <div style={{ width: '150px', height: '160px', perspective: '1200px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg)`,
          borderRadius: '22px',
          background: 'linear-gradient(160deg, #1e2230 0%, #11131c 60%, #0a0b10 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: '2px',
            background: 'rgba(0,0,0,0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            zIndex: 10,
          }}
        />
        <span
          style={{
            color: '#38bdf8',
            fontSize: '96px',
            fontWeight: 900,
            letterSpacing: '-2px',
            transform: showFront ? 'none' : 'rotateX(180deg)',
            textShadow: '0 0 30px rgba(56, 189, 248, 0.5)',
          }}
        >
          {showFront ? fromLetter : toLetter}
        </span>
      </div>
    </div>
  );
}

function BouncingCyanSphere({ startFrame = 20, bounce1Frame = 52, bounce2Frame = 78 }) {
  const frame = useCurrentFrame();
  let y = -260;
  let scaleX = 1;
  let scaleY = 1;
  let opacity = 0;

  if (frame >= startFrame) {
    opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], { extrapolateRight: 'clamp' });
    if (frame < bounce1Frame) {
      const t = (frame - startFrame) / (bounce1Frame - startFrame);
      y = interpolate(t * t, [0, 1], [-260, -90]);
    } else if (frame < bounce1Frame + 6) {
      y = -90;
      scaleX = 1.35;
      scaleY = 0.75;
    } else if (frame < bounce2Frame) {
      const t = (frame - (bounce1Frame + 6)) / (bounce2Frame - (bounce1Frame + 6));
      const arc = 4 * 140 * Math.pow(t - 0.5, 2) - 140;
      y = -90 + arc;
      scaleX = 0.9;
      scaleY = 1.15;
    } else if (frame < bounce2Frame + 6) {
      y = -90;
      scaleX = 1.35;
      scaleY = 0.75;
    } else {
      const settleProgress = interpolate(frame - (bounce2Frame + 6), [0, 25], [0, 1], { extrapolateRight: 'clamp' });
      y = interpolate(settleProgress, [0, 1], [-90, -170]);
      scaleX = 1 + Math.sin(frame / 8) * 0.05;
      scaleY = 1 - Math.sin(frame / 8) * 0.05;
    }
  }

  let x = 80;
  if (frame >= bounce1Frame + 6 && frame <= bounce2Frame) {
    const t = (frame - (bounce1Frame + 6)) / (bounce2Frame - (bounce1Frame + 6));
    x = interpolate(t, [0, 1], [80, 240]);
  } else if (frame > bounce2Frame) {
    x = interpolate(frame, [bounce2Frame, bounce2Frame + 30], [240, 0], { extrapolateRight: 'clamp' });
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scaleX}, ${scaleY})`,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #7dd3fc 30%, #0284c7 70%, #0369a1 100%)',
        boxShadow: '0 0 35px rgba(56, 189, 248, 0.9), 0 0 15px rgba(56, 189, 248, 0.9)',
        opacity,
        zIndex: 20,
      }}
    />
  );
}

export function TranvasFlipVideo({
  fromWord = 'BUSY',
  toWord = 'CALM',
  watermark = '@tranvas',
}) {
  const fromChars = fromWord.split('');
  const toChars = toWord.split('');

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#08090d',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Montserrat", "Inter", -apple-system, sans-serif',
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.12) 0%, rgba(15, 17, 26, 0.6) 45%, #06070a 85%)',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BouncingCyanSphere startFrame={20} bounce1Frame={52} bounce2Frame={78} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {fromChars.map((ch, i) => (
            <FlipTile
              key={i}
              fromLetter={ch}
              toLetter={toChars[i] || ch}
              flipStartFrame={50 + i * 14}
            />
          ))}
        </div>
      </div>

      <TranvasEmblem watermark={watermark} />
    </AbsoluteFill>
  );
}

// =========================================================================
// VARIANT 2: CHAOS TO STRUCTURED SECOND BRAIN (Scattered nodes -> Clean Grid)
// =========================================================================
export function TranvasChaosToStructureVideo({ watermark = '@tranvas' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Morph progress from Frame 30 to Frame 90
  const progress = spring({
    frame: frame - 30,
    fps,
    config: { stiffness: 60, damping: 14 },
  });

  const nodes = [
    { id: 1, startX: -260, startY: -200, endX: -160, endY: -120, label: 'Tasks' },
    { id: 2, startX: 240, startY: -160, endX: 0, endY: -120, label: 'Notes' },
    { id: 3, startX: -180, startY: 180, endX: 160, endY: -120, label: 'Habits' },
    { id: 4, startX: 200, startY: 140, endX: -160, endY: 80, label: 'Finance' },
    { id: 5, startX: 0, startY: -280, endX: 0, endY: 80, label: 'Goals' },
    { id: 6, startX: -20, startY: 260, endX: 160, endY: 80, label: 'Focus' },
  ];

  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07080c',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Montserrat", "Inter", -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 45%, rgba(99, 102, 241, 0.15) 0%, rgba(10, 12, 18, 0.7) 50%, #050608 90%)',
        }}
      />

      {/* Top Title */}
      <div
        style={{
          position: 'absolute',
          top: '280px',
          textAlign: 'center',
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '20px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase' }}>
          {progress < 0.5 ? 'Scattered Mind' : 'Structured Second Brain'}
        </span>
        <h1 style={{ color: '#ffffff', fontSize: '54px', fontWeight: 900, letterSpacing: '-1px', margin: '10px 0 0 0' }}>
          {progress < 0.5 ? 'Overwhelmed & Lost' : 'Clarity in One System'}
        </h1>
      </div>

      {/* Central Node Visualizer */}
      <div style={{ position: 'relative', width: '600px', height: '500px', marginTop: '60px' }}>
        {/* Connecting Lines when Structured */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox="-300 -250 600 500"
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
                stroke={progress > 0.4 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}
                strokeWidth={progress > 0.4 ? 2.5 : 1}
                strokeDasharray={progress > 0.4 ? 'none' : '4 4'}
              />
            );
          })}
        </svg>

        {/* Nodes */}
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
                background: progress > 0.5 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                border: progress > 0.5 ? '2px solid #38bdf8' : '1.5px dashed rgba(239, 68, 68, 0.5)',
                borderRadius: '16px',
                padding: '16px 24px',
                color: '#ffffff',
                fontSize: '22px',
                fontWeight: 700,
                boxShadow: progress > 0.5 ? '0 0 25px rgba(56, 189, 248, 0.35)' : 'none',
                transition: 'border 0.3s ease',
              }}
            >
              {n.label}
            </div>
          );
        })}
      </div>

      <TranvasEmblem watermark={watermark} />
    </AbsoluteFill>
  );
}
