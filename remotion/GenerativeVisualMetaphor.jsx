import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// =========================================================================
// 1. CONTINUOUS FLOATING PARTICLES (Ambient Living Stardust)
// =========================================================================
const PARTICLES = Array.from({ length: 24 }).map((_, i) => ({
  id: i,
  x: (i * 47) % 1000 + 40,
  baseY: ((i * 83) % 1600) + 160,
  size: (i % 3) * 2 + 3,
  speed: ((i % 4) + 1) * 0.8,
  seed: i * 17,
  color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#6366f1' : '#a855f7',
}));

function ContinuousParticleField() {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {PARTICLES.map((p) => {
        const curY = (p.baseY - frame * p.speed * 1.5) % 1800;
        const actualY = curY < 0 ? curY + 1800 : curY;
        const curX = p.x + Math.sin((frame + p.seed) / 22) * 24;
        const opacity = interpolate(Math.sin((frame + p.seed) / 15), [-1, 1], [0.2, 0.75]);

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
// 2. MINIMALIST BRAND WATERMARK
// =========================================================================
function TranvasWatermark({ watermark = 'tranvas.com' }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 60, [0, 30, 60], [0.75, 1, 0.75]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: shimmer,
        zIndex: 50,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
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
// 3. PRIMITIVE: DIVERGENT BRANCH (Continuous Energy Pulses & Harmonic Float)
// =========================================================================
function DivergentBranchPrimitive({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staged growth progress from frame 20 to 110 (2/3 of video)
  const drawProgress = spring({
    frame: frame - 18,
    fps,
    config: { mass: 1.2, stiffness: 45, damping: 15 },
  });

  const upperOffset = interpolate(drawProgress, [0, 1], [1000, 0], { extrapolateRight: 'clamp' });
  const lowerOffset = interpolate(drawProgress, [0, 1], [1000, 0], { extrapolateRight: 'clamp' });
  const multiplier = interpolate(drawProgress, [0, 1], [1.0, data.multiplier || 37.8], { extrapolateRight: 'clamp' });

  // CONTINUOUS ALIVE DYNAMICS:
  // 1. Continuous pulse runner along the curve
  const continuousDashOffset = -frame * 8;
  // 2. Harmonic organic float for milestone node
  const nodeHoverY = Math.sin(frame / 12) * 6;
  // 3. Glowing aura breathing
  const auraScale = 1 + Math.sin(frame / 14) * 0.08;
  const pulseOpacity = interpolate(Math.sin(frame / 10), [-1, 1], [0.6, 1]);

  return (
    <div style={{ position: 'relative', width: '880px', height: '620px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="880" height="620" viewBox="0 0 880 620" style={{ overflow: 'visible' }}>
        {/* Baseline origin */}
        <line x1="80" y1="310" x2="260" y2="310" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
        <circle cx="80" cy="310" r="10" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 12px #38bdf8)' }} />
        <text x="60" y="270" fill="rgba(255,255,255,0.5)" fontSize="22" fontWeight="700">Day 1</text>

        {/* Branch point with continuous pulse ring */}
        <circle cx="260" cy="310" r={12 * auraScale} fill="rgba(99, 102, 241, 0.25)" />
        <circle cx="260" cy="310" r="12" fill="#6366f1" style={{ filter: 'drop-shadow(0 0 16px #6366f1)' }} />

        {/* Lower stagnant path */}
        <path
          d="M 260 310 C 440 320, 560 410, 800 520"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="4"
          strokeDasharray="1000"
          strokeDashoffset={lowerOffset}
          opacity={0.4}
        />

        {/* Upper exponential compound curve (Base Stroke) */}
        <path
          d="M 260 310 C 440 300, 560 190, 800 80"
          fill="none"
          stroke="url(#divergentNeonGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="1000"
          strokeDashoffset={upperOffset}
          style={{ filter: 'drop-shadow(0 0 24px rgba(56, 189, 248, 0.8))' }}
        />

        {/* CONTINUOUS LIVING ENERGY PULSE (Racing along the curve forever!) */}
        {drawProgress > 0.4 && (
          <path
            d="M 260 310 C 440 300, 560 190, 800 80"
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="30 180"
            strokeDashoffset={continuousDashOffset}
            style={{ filter: 'drop-shadow(0 0 18px #ffffff)' }}
            opacity={pulseOpacity}
          />
        )}

        {/* Upper Milestone (Continuously floating & pulsing!) */}
        {drawProgress > 0.5 && (
          <g transform={`translate(0, ${nodeHoverY})`}>
            {/* Expanding pulse ripple */}
            <circle cx="800" cy="80" r={24 * auraScale} fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" />
            <circle cx="800" cy="80" r="15" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 20px #38bdf8)' }} />
            <text x="660" y="45" fill="#38bdf8" fontSize="36" fontWeight="900">+{multiplier.toFixed(1)}x</text>
            <text x="660" y="78" fill="rgba(255,255,255,0.7)" fontSize="20" fontWeight="700">Compound Flow</text>
          </g>
        )}

        {/* Lower Milestone */}
        {drawProgress > 0.5 && (
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
// 4. PRIMITIVE: CHAOS TO PRISM (Active Plasma Laser & Continuous Node Orbit)
// =========================================================================
function ChaosToPrismPrimitive({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = spring({
    frame: frame - 18,
    fps,
    config: { mass: 1.2, stiffness: 45, damping: 15 },
  });

  const scatterNodes = [
    { label: 'Tasks', x: -300, y: -160, speed: 1.2 },
    { label: 'Ideas', x: -320, y: -30, speed: 0.9 },
    { label: 'DMs', x: -280, y: 100, speed: 1.4 },
    { label: 'Habits', x: -290, y: 220, speed: 1.1 },
  ];

  // CONTINUOUS ALIVE DYNAMICS:
  // 1. Continuous plasma laser jitter & pulsation
  const plasmaHeight = 14 + Math.sin(frame * 0.9) * 4;
  const plasmaGlow = 25 + Math.sin(frame * 0.6) * 12;
  // 2. Prism rotation shimmer
  const prismPulse = 1 + Math.sin(frame / 12) * 0.04;
  // 3. Continuous photon packets shooting into target
  const photonOffset = -frame * 12;

  const laserWidth = interpolate(drawProgress, [0.3, 1], [0, 440], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '840px', height: '540px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="840" height="540" viewBox="-420 -270 840 540" style={{ overflow: 'visible' }}>
        {/* Converging rays with continuous floating jitter */}
        {scatterNodes.map((n, i) => {
          const jitterX = Math.sin(frame / 12 + i) * 8;
          const jitterY = Math.cos(frame / 10 + i) * 8;
          const currX = interpolate(drawProgress, [0, 0.7], [n.x + jitterX, -35], { extrapolateRight: 'clamp' });
          const currY = interpolate(drawProgress, [0, 0.7], [n.y + jitterY, 0], { extrapolateRight: 'clamp' });

          return (
            <g key={i}>
              <line
                x1={n.x + jitterX}
                y1={n.y + jitterY}
                x2={currX}
                y2={currY}
                stroke={drawProgress > 0.5 ? 'rgba(99, 102, 241, 0.6)' : 'rgba(244, 63, 94, 0.3)'}
                strokeWidth={2}
                strokeDasharray="6 6"
              />
              <circle cx={currX} cy={currY} r={drawProgress > 0.5 ? 5 : 8} fill={drawProgress > 0.5 ? '#38bdf8' : '#f43f5e'} />
              {drawProgress < 0.4 && (
                <text x={n.x + jitterX - 30} y={n.y + jitterY - 15} fill="rgba(255,255,255,0.65)" fontSize="18" fontWeight="700">
                  {n.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Central Hexagonal Glass Prism (Continuously breathing & glowing) */}
        <g transform={`scale(${prismPulse})`}>
          <polygon
            points="-45,-75 45,-75 80,0 45,75 -45,75 -80,0"
            fill="rgba(15, 23, 42, 0.9)"
            stroke="#6366f1"
            strokeWidth="3.5"
            style={{
              filter: `drop-shadow(0 0 ${plasmaGlow}px rgba(99, 102, 241, 0.9))`,
            }}
          />
          <text x="-32" y="8" fill="#ffffff" fontSize="24" fontWeight="900">OS</text>
        </g>

        {/* Main Focused Plasma Laser Beam (ALIVE with high frequency energy!) */}
        <rect
          x="80"
          y={-plasmaHeight / 2}
          width={laserWidth}
          height={plasmaHeight}
          rx={plasmaHeight / 2}
          fill="url(#laserGradLiving)"
          style={{ filter: `drop-shadow(0 0 ${plasmaGlow}px #38bdf8)` }}
        />

        {/* Continuous Photon Bullets along the laser beam */}
        {drawProgress > 0.6 && (
          <line
            x1="80"
            y1="0"
            x2={80 + laserWidth}
            y2="0"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="25 60"
            strokeDashoffset={photonOffset}
          />
        )}

        {/* Target Node (Flow state with glowing impact sparks) */}
        {drawProgress > 0.7 && (
          <g transform="translate(360, 8)">
            {/* Pulsing impact aura */}
            <circle cx="30" cy="-15" r={30 + Math.sin(frame / 8) * 8} fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" />
            <text x="0" y="-30" fill="#38bdf8" fontSize="34" fontWeight="900">Flow</text>
            <text x="0" y="4" fill="rgba(255,255,255,0.7)" fontSize="20" fontWeight="700">Deep Focus</text>
          </g>
        )}

        <defs>
          <linearGradient id="laserGradLiving" x1="80" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
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
// 5. PRIMITIVE: ICEBERG DEPTH (Living Waterline Waves & Drifting Caustics)
// =========================================================================
function IcebergDepthPrimitive({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = spring({
    frame: frame - 18,
    fps,
    config: { mass: 1.2, stiffness: 45, damping: 15 },
  });

  const cameraY = interpolate(drawProgress, [0, 1], [0, -110], { extrapolateRight: 'clamp' });
  const underwaterOpacity = interpolate(drawProgress, [0.2, 1], [0.3, 1], { extrapolateRight: 'clamp' });

  // CONTINUOUS ALIVE DYNAMICS:
  // 1. Dynamic sine-wave water surface ripples
  const wave1 = Math.sin(frame / 12) * 8;
  const wave2 = Math.cos(frame / 14) * 8;
  // 2. Bedrock subtle breathing
  const bedrockBreath = 1 + Math.sin(frame / 16) * 0.02;
  // 3. Floating surface bobbing
  const bobbingY = Math.sin(frame / 10) * 5;

  return (
    <div style={{ position: 'relative', width: '840px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', position: 'relative', transform: `translateY(${cameraY}px)` }}>
        {/* Dynamic Continuous Wave Surface */}
        <svg width="840" height="60" style={{ position: 'absolute', top: '210px', left: 0, overflow: 'visible', zIndex: 10 }}>
          <path
            d={`M 40 20 Q 240 ${20 + wave1}, 440 20 T 800 ${20 + wave2}`}
            fill="none"
            stroke="url(#waterWaveGrad)"
            strokeWidth="3"
            style={{ filter: 'drop-shadow(0 0 16px #38bdf8)' }}
          />
          <defs>
            <linearGradient id="waterWaveGrad" x1="0" y1="0" x2="840" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="transparent" />
              <stop offset="30%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Surface Tip (Continuously bobbing in water!) */}
        <div
          style={{
            position: 'absolute',
            top: '120px',
            left: '50%',
            transform: `translateX(-50%) translateY(${bobbingY}px)`,
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
              boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)',
            }}
          />
        </div>

        {/* Submerged Deep Bedrock (Continuously pulsing with life!) */}
        <div
          style={{
            position: 'absolute',
            top: '240px',
            left: '50%',
            transform: `translateX(-50%) scale(${bedrockBreath})`,
            width: '460px',
            height: '360px',
            background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.85) 0%, rgba(3, 7, 18, 0.98) 100%)',
            border: '2.5px solid rgba(99, 102, 241, 0.7)',
            borderRadius: '0 0 36px 36px',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 60px rgba(99, 102, 241, 0.35)',
            opacity: underwaterOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.8))' }}>🧠</span>
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
// 6. PRIMITIVE: PHYSICS FULCRUM (Continuous Harmonic Teeter-Totter Physics)
// =========================================================================
function PhysicsFulcrumPrimitive({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = spring({
    frame: frame - 18,
    fps,
    config: { mass: 1.2, stiffness: 45, damping: 15 },
  });

  const fulcrumX = interpolate(drawProgress, [0, 0.6], [0, -160], { extrapolateRight: 'clamp' });
  
  // CONTINUOUS ALIVE DYNAMICS:
  // Base angle shifts to +14 deg, then gently sways in living harmonic balance!
  const baseAngle = interpolate(drawProgress, [0.4, 1], [-12, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const harmonicOscillation = drawProgress > 0.8 ? Math.sin(frame / 8) * 1.8 : 0;
  const beamAngle = baseAngle + harmonicOscillation;

  return (
    <div style={{ position: 'relative', width: '840px', height: '540px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="840" height="540" viewBox="-420 -270 840 540" style={{ overflow: 'visible' }}>
        <line x1="-380" y1="160" x2="380" y2="160" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />

        {/* Sliding Fulcrum Pivot */}
        <g transform={`translate(${fulcrumX}, 160)`}>
          <polygon points="0,-75 -45,0 45,0" fill="#6366f1" style={{ filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.7))' }} />
          <circle cx="0" cy="-70" r="6" fill="#38bdf8" />
        </g>

        {/* Tilting Beam (Living harmonic tilt!) */}
        <g transform={`translate(${fulcrumX}, 85) rotate(${beamAngle})`}>
          <rect x="-340" y="-8" width="680" height="16" rx="8" fill="linear-gradient(90deg, #f43f5e, #6366f1, #38bdf8)" />

          {/* Heavy load left */}
          <g transform="translate(-280, -70)">
            <rect x="-55" y="-35" width="110" height="70" rx="12" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2.5" />
            <text x="-40" y="8" fill="#ffffff" fontSize="22" fontWeight="900">10x Load</text>
          </g>

          {/* Light system right with continuous leverage glow */}
          <g transform="translate(280, -75)">
            <rect
              x="-65"
              y="-40"
              width="130"
              height="80"
              rx="14"
              fill="rgba(56, 189, 248, 0.25)"
              stroke="#38bdf8"
              strokeWidth="2.5"
              style={{ filter: `drop-shadow(0 0 ${15 + Math.sin(frame / 10) * 8}px #38bdf8)` }}
            />
            <text x="-48" y="10" fill="#38bdf8" fontSize="24" fontWeight="900">Leverage</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 7. MASTER COMPONENT: HYPER-MINIMALIST & CONTINUOUS LIVING MOTION
// =========================================================================
export function GenerativeVisualMetaphor({
  primitive = 'ChaosToPrism',
  headline = 'Ideas In. Pure Flow Out.',
  watermark = 'tranvas.com',
  primitiveData = {},
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth entrance spring
  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  // CONTINUOUS breathing background aura
  const bgPulse = 1 + Math.sin(frame / 16) * 0.05;

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
      {/* 1. Continuous Living Particle Field (Never static!) */}
      <ContinuousParticleField />

      {/* 2. Ambient Breathing Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '850px',
          height: '850px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(56, 189, 248, 0.06) 50%, transparent 75%)',
          transform: `translate(-50%, -50%) scale(${bgPulse})`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* 3. SINGLE MINIMALIST HEADLINE (Max 4-6 Words) */}
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

      {/* 4. VISUAL METAPHOR PRIMITIVE (ALIVE throughout the entire 6.5s!) */}
      <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {primitive === 'DivergentBranch' && <DivergentBranchPrimitive data={primitiveData} />}
        {primitive === 'ChaosToPrism' && <ChaosToPrismPrimitive data={primitiveData} />}
        {primitive === 'IcebergDepth' && <IcebergDepthPrimitive data={primitiveData} />}
        {primitive === 'PhysicsFulcrum' && <PhysicsFulcrumPrimitive data={primitiveData} />}
        {primitive !== 'DivergentBranch' &&
          primitive !== 'ChaosToPrism' &&
          primitive !== 'IcebergDepth' &&
          primitive !== 'PhysicsFulcrum' && (
            <ChaosToPrismPrimitive data={primitiveData} />
          )}
      </div>

      {/* 5. TASTEFUL WATERMARK (Bottom) */}
      <TranvasWatermark watermark={watermark} />
    </AbsoluteFill>
  );
}
