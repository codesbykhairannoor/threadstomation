import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// =========================================================================
// 1. MINIMALIST BRAND WATERMARK
// =========================================================================
function TranvasWatermark({ watermark = 'tranvas.com' }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 75, [0, 37, 75], [0.8, 1, 0.8]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: shimmer,
        zIndex: 50,
      }}
    >
      <svg width="34" height="34" viewBox="0 0 52 52" fill="none">
        <rect width="52" height="52" rx="14" fill="#111827" />
        <path
          d="M14 16H38V22H29V36H23V22H14V16Z"
          fill="url(#tranvasIndigoGrad)"
          style={{ filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.8))' }}
        />
        <defs>
          <linearGradient id="tranvasIndigoGrad" x1="14" y1="16" x2="38" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      <span
        style={{
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
        }}
      >
        {watermark}
      </span>
    </div>
  );
}

// =========================================================================
// 2. PRIMITIVE: DIVERGENT BRANCH (1% Split Curve)
// =========================================================================
function DivergentBranchPrimitive({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 15,
    fps,
    config: { mass: 1.0, stiffness: 60, damping: 14 },
  });

  const upperOffset = interpolate(progress, [0, 1], [1000, 0], { extrapolateRight: 'clamp' });
  const lowerOffset = interpolate(progress, [0, 1], [1000, 0], { extrapolateRight: 'clamp' });
  const multiplier = interpolate(progress, [0, 1], [1.0, data.multiplier || 37.8], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '880px', height: '620px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="880" height="620" viewBox="0 0 880 620" style={{ overflow: 'visible' }}>
        {/* Baseline origin */}
        <line x1="80" y1="310" x2="260" y2="310" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
        <circle cx="80" cy="310" r="10" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 12px #38bdf8)' }} />
        <text x="60" y="270" fill="rgba(255,255,255,0.5)" fontSize="22" fontWeight="700">Day 1</text>

        {/* Branch point */}
        <circle cx="260" cy="310" r="12" fill="#6366f1" style={{ filter: 'drop-shadow(0 0 16px #6366f1)' }} />

        {/* Upper exponential curve */}
        <path
          d="M 260 310 C 440 300, 560 190, 800 80"
          fill="none"
          stroke="url(#divergentNeonGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="1000"
          strokeDashoffset={upperOffset}
          style={{ filter: 'drop-shadow(0 0 24px rgba(56, 189, 248, 0.9))' }}
        />

        {/* Lower stagnant curve */}
        <path
          d="M 260 310 C 440 320, 560 410, 800 520"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="4"
          strokeDasharray="1000"
          strokeDashoffset={lowerOffset}
          opacity={0.45}
        />

        {/* Upper result milestone */}
        {progress > 0.6 && (
          <g>
            <circle cx="800" cy="80" r="14" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 20px #38bdf8)' }} />
            <text x="680" y="45" fill="#38bdf8" fontSize="32" fontWeight="900">+{multiplier.toFixed(1)}x</text>
            <text x="680" y="75" fill="rgba(255,255,255,0.6)" fontSize="20" fontWeight="700">Compound</text>
          </g>
        )}

        {/* Lower result milestone */}
        {progress > 0.6 && (
          <g>
            <text x="730" y="555" fill="#f43f5e" fontSize="26" fontWeight="800">0.03x</text>
            <text x="730" y="585" fill="rgba(244, 63, 94, 0.6)" fontSize="20" fontWeight="700">Drift</text>
          </g>
        )}

        <defs>
          <linearGradient id="divergentNeonGrad" x1="260" y1="310" x2="800" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// =========================================================================
// 3. PRIMITIVE: CHAOS TO PRISM (Scattered Thoughts into 1 Laser Beam)
// =========================================================================
function ChaosToPrismPrimitive({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 15,
    fps,
    config: { mass: 1.0, stiffness: 60, damping: 14 },
  });

  const scatterNodes = [
    { label: 'Tasks', x: -300, y: -160, icon: '📋' },
    { label: 'Ideas', x: -320, y: -30, icon: '💡' },
    { label: 'DMs', x: -280, y: 100, icon: '💬' },
    { label: 'Habits', x: -290, y: 220, icon: '🔥' },
  ];

  const laserWidth = interpolate(progress, [0.3, 1], [0, 420], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const prismGlow = interpolate(progress, [0, 0.6, 1], [0.4, 1, 0.9]);

  return (
    <div style={{ position: 'relative', width: '840px', height: '540px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="840" height="540" viewBox="-420 -270 840 540" style={{ overflow: 'visible' }}>
        {/* Converging dashed rays */}
        {scatterNodes.map((n, i) => {
          const currX = interpolate(progress, [0, 0.6], [n.x, -35], { extrapolateRight: 'clamp' });
          const currY = interpolate(progress, [0, 0.6], [n.y, 0], { extrapolateRight: 'clamp' });

          return (
            <g key={i}>
              <line
                x1={n.x}
                y1={n.y}
                x2={currX}
                y2={currY}
                stroke={progress > 0.5 ? 'rgba(99, 102, 241, 0.6)' : 'rgba(244, 63, 94, 0.3)'}
                strokeWidth={2}
                strokeDasharray="6 6"
              />
              <circle cx={currX} cy={currY} r={progress > 0.5 ? 5 : 8} fill={progress > 0.5 ? '#38bdf8' : '#f43f5e'} />
              {progress < 0.3 && (
                <text x={n.x - 30} y={n.y - 15} fill="rgba(255,255,255,0.6)" fontSize="18" fontWeight="700">
                  {n.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Central Hexagonal Glass Prism */}
        <polygon
          points="-45,-75 45,-75 80,0 45,75 -45,75 -80,0"
          fill="rgba(15, 23, 42, 0.85)"
          stroke="#6366f1"
          strokeWidth="3.5"
          style={{
            filter: `drop-shadow(0 0 35px rgba(99, 102, 241, ${prismGlow}))`,
          }}
        />
        <text x="-32" y="8" fill="#ffffff" fontSize="24" fontWeight="900">OS</text>

        {/* Focused Coherent Laser Beam */}
        <rect
          x="80"
          y="-8"
          width={laserWidth}
          height="16"
          rx="8"
          fill="url(#laserGradMinimal)"
          style={{ filter: 'drop-shadow(0 0 30px #38bdf8)' }}
        />

        {progress > 0.7 && (
          <g transform="translate(360, 8)">
            <text x="0" y="-30" fill="#38bdf8" fontSize="32" fontWeight="900">Flow</text>
            <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="20" fontWeight="700">Deep Work</text>
          </g>
        )}

        <defs>
          <linearGradient id="laserGradMinimal" x1="80" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// =========================================================================
// 4. PRIMITIVE: ICEBERG DEPTH (Surface vs Submerged Bedrock)
// =========================================================================
function IcebergDepthPrimitive({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 15,
    fps,
    config: { mass: 1.1, stiffness: 55, damping: 15 },
  });

  const cameraY = interpolate(progress, [0, 1], [0, -110], { extrapolateRight: 'clamp' });
  const underwaterOpacity = interpolate(progress, [0.2, 1], [0.3, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '840px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', position: 'relative', transform: `translateY(${cameraY}px)` }}>
        {/* Waterline */}
        <div
          style={{
            position: 'absolute',
            top: '230px',
            left: '60px',
            right: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.9), transparent)',
            boxShadow: '0 0 20px #38bdf8',
            zIndex: 10,
          }}
        />

        {/* Surface floating tip */}
        <div
          style={{
            position: 'absolute',
            top: '130px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#f43f5e', fontSize: '24px', fontWeight: 800, letterSpacing: '1px' }}>
            Surface Noise
          </span>
          <div
            style={{
              width: '80px',
              height: '60px',
              margin: '10px auto 0',
              background: 'rgba(244, 63, 94, 0.2)',
              border: '2px solid #f43f5e',
              borderRadius: '12px 12px 0 0',
            }}
          />
        </div>

        {/* Submerged deep bedrock */}
        <div
          style={{
            position: 'absolute',
            top: '240px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '460px',
            height: '360px',
            background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.8) 0%, rgba(3, 7, 18, 0.95) 100%)',
            border: '2.5px solid rgba(99, 102, 241, 0.7)',
            borderRadius: '0 0 32px 32px',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(99, 102, 241, 0.3)',
            opacity: underwaterOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '48px' }}>🧠</span>
          <span style={{ color: '#ffffff', fontSize: '32px', fontWeight: 900 }}>Tranvas Life OS</span>
          <span style={{ color: '#38bdf8', fontSize: '18px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Deep Bedrock
          </span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 5. PRIMITIVE: PHYSICS FULCRUM (Effort vs Extreme Leverage)
// =========================================================================
function PhysicsFulcrumPrimitive({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 15,
    fps,
    config: { mass: 1.1, stiffness: 55, damping: 15 },
  });

  const fulcrumX = interpolate(progress, [0, 0.6], [0, -160], { extrapolateRight: 'clamp' });
  const beamAngle = interpolate(progress, [0.4, 1], [-12, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '840px', height: '540px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="840" height="540" viewBox="-420 -270 840 540" style={{ overflow: 'visible' }}>
        <line x1="-380" y1="160" x2="380" y2="160" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />

        {/* Sliding Fulcrum Pivot */}
        <g transform={`translate(${fulcrumX}, 160)`}>
          <polygon points="0,-75 -45,0 45,0" fill="#6366f1" style={{ filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.7))' }} />
          <circle cx="0" cy="-70" r="6" fill="#38bdf8" />
        </g>

        {/* Tilting Beam */}
        <g transform={`translate(${fulcrumX}, 85) rotate(${beamAngle})`}>
          <rect x="-340" y="-8" width="680" height="16" rx="8" fill="linear-gradient(90deg, #f43f5e, #6366f1, #38bdf8)" />

          {/* Heavy load left */}
          <g transform="translate(-280, -70)">
            <rect x="-55" y="-35" width="110" height="70" rx="12" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2.5" />
            <text x="-40" y="8" fill="#ffffff" fontSize="22" fontWeight="900">10x Load</text>
          </g>

          {/* Light system right */}
          <g transform="translate(280, -75)">
            <rect x="-65" y="-40" width="130" height="80" rx="14" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="2.5" />
            <text x="-48" y="10" fill="#38bdf8" fontSize="24" fontWeight="900">Leverage</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 6. MASTER COMPONENT: ULTRA-MINIMALIST GENERATIVE VISUAL METAPHOR
// =========================================================================
export function GenerativeVisualMetaphor({
  primitive = 'ChaosToPrism',
  headline = 'Ideas In. Pure Flow Out.',
  watermark = 'tranvas.com',
  primitiveData = {},
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const pulse = 1 + Math.sin(frame / 18) * 0.03;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#02040a',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '240px',
        paddingBottom: '120px',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Subtle Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 75%)',
          transform: `translate(-50%, -50%) scale(${pulse})`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* SINGLE MINIMALIST HEADLINE (Max 4-6 Words) */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: '860px',
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: '52px',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            lineHeight: '1.2',
            margin: 0,
            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
          }}
        >
          {headline}
        </h1>
      </div>

      {/* VISUAL METAPHOR PRIMITIVE (The Hero of the Video) */}
      <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {primitive === 'DivergentBranch' && <DivergentBranchPrimitive data={primitiveData} />}
        {primitive === 'ChaosToPrism' && <ChaosToPrismPrimitive data={primitiveData} />}
        {primitive === 'IcebergDepth' && <IcebergDepthPrimitive data={primitiveData} />}
        {primitive === 'PhysicsFulcrum' && <PhysicsFulcrumPrimitive data={primitiveData} />}
        {/* Default fallback to ChaosToPrism */}
        {primitive !== 'DivergentBranch' &&
          primitive !== 'ChaosToPrism' &&
          primitive !== 'IcebergDepth' &&
          primitive !== 'PhysicsFulcrum' && (
            <ChaosToPrismPrimitive data={primitiveData} />
          )}
      </div>

      {/* TASTEFUL WATERMARK (Bottom) */}
      <TranvasWatermark watermark={watermark} />
    </AbsoluteFill>
  );
}
