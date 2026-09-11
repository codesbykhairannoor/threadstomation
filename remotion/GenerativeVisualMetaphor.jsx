import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// =========================================================================
// 1. BRAND EMBLEM & WATERMARK
// =========================================================================
function TranvasEmblem({ watermark = 'tranvas.com' }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 90, [0, 45, 90], [0.85, 1, 0.85]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        opacity: shimmer,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="44" height="44" viewBox="0 0 52 52" fill="none">
          <rect width="52" height="52" rx="15" fill="url(#tranvasOfficialBg)" />
          <path
            d="M14 16H38V22H29V36H23V22H14V16Z"
            fill="url(#tranvasIndigoGrad)"
            style={{ filter: 'drop-shadow(0 0 14px rgba(99, 102, 241, 0.8))' }}
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
            fontSize: '28px',
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
          fontSize: '15px',
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
// 2. PRIMITIVE 1: DIVERGENT BRANCH (1% Compounding vs Drift)
// =========================================================================
function DivergentBranchPrimitive({ data }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 25,
    fps,
    config: { mass: 1.3, stiffness: 45, damping: 16 },
  });

  const upperOffset = interpolate(progress, [0, 1], [1000, 0], { extrapolateRight: 'clamp' });
  const lowerOffset = interpolate(progress, [0, 1], [1000, 0], { extrapolateRight: 'clamp' });
  const multiplier = interpolate(progress, [0, 1], [1.0, data.multiplier || 37.78], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '840px', height: '560px', marginTop: '40px' }}>
      <svg width="840" height="560" viewBox="0 0 840 560" style={{ overflow: 'visible' }}>
        {/* Origin Baseline */}
        <line x1="40" y1="280" x2="220" y2="280" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
        <circle cx="40" cy="280" r="10" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 12px #38bdf8)' }} />
        <text x="30" y="240" fill="rgba(255,255,255,0.6)" fontSize="20" fontWeight="700">Day 1: Baseline</text>

        {/* Branch Point Node */}
        <circle cx="220" cy="280" r="12" fill="#6366f1" style={{ filter: 'drop-shadow(0 0 16px #6366f1)' }} />

        {/* Upper Exponential Growth Path (Tranvas Compounding) */}
        <path
          d="M 220 280 C 400 270, 520 180, 780 70"
          fill="none"
          stroke="url(#compGrowthGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="1000"
          strokeDashoffset={upperOffset}
          style={{ filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.8))' }}
        />

        {/* Lower Drift Path (Random Action / Chaos) */}
        <path
          d="M 220 280 C 400 290, 520 380, 780 480"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="4"
          strokeDasharray="1000"
          strokeDashoffset={lowerOffset}
          opacity={0.6}
        />

        {/* Milestone Glowing Nodes on Upper Path */}
        {progress > 0.4 && (
          <g>
            <circle cx="500" cy="190" r="9" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 10px #38bdf8)' }} />
            <text x="515" y="195" fill="#38bdf8" fontSize="18" fontWeight="700">Day 100: Habits Lock In</text>
          </g>
        )}

        {progress > 0.8 && (
          <g>
            <circle cx="780" cy="70" r="14" fill="#a855f7" style={{ filter: 'drop-shadow(0 0 20px #a855f7)' }} />
            <text x="620" y="45" fill="#ffffff" fontSize="28" fontWeight="900">Day 365: +{multiplier.toFixed(1)}x 🚀</text>
          </g>
        )}

        {/* Lower Label */}
        {progress > 0.7 && (
          <text x="610" y="520" fill="#f43f5e" fontSize="22" fontWeight="700">0.03x Drift (Scattered)</text>
        )}

        <defs>
          <linearGradient id="compGrowthGrad" x1="220" y1="280" x2="780" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Card Takeaway */}
      <div
        style={{
          position: 'absolute',
          bottom: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1.5px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '18px',
          padding: '16px 28px',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        <span style={{ fontSize: '24px' }}>⚡</span>
        <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700 }}>
          {data.cardNote || 'Atomic consistency turns invisible effort into explosive momentum.'}
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// 3. PRIMITIVE 2: CHAOS TO PRISM (Cognitive Deflection into Focused Laser)
// =========================================================================
function ChaosToPrismPrimitive({ data }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 25,
    fps,
    config: { mass: 1.2, stiffness: 48, damping: 15 },
  });

  const scatterNodes = data.nodes || [
    { label: 'Unread Tasks', x: -280, y: -190, icon: '📋' },
    { label: 'Random Ideas', x: -310, y: -60, icon: '💡' },
    { label: 'Slack & DMs', x: -260, y: 70, icon: '💬' },
    { label: 'Finances', x: -290, y: 190, icon: '💳' },
    { label: 'Meeting Notes', x: -180, y: -230, icon: '📅' },
  ];

  const laserWidth = interpolate(progress, [0.3, 1], [0, 480], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const prismGlow = interpolate(progress, [0, 0.6, 1], [0.3, 1, 0.9]);

  return (
    <div style={{ position: 'relative', width: '840px', height: '560px', marginTop: '40px' }}>
      <svg width="840" height="560" viewBox="-420 -280 840 560" style={{ overflow: 'visible' }}>
        {/* Converging Rays */}
        {scatterNodes.map((n, i) => {
          const startX = n.x;
          const startY = n.y;
          const endX = -30;
          const endY = 0;
          const currX = interpolate(progress, [0, 0.7], [startX, endX], { extrapolateRight: 'clamp' });
          const currY = interpolate(progress, [0, 0.7], [startY, endY], { extrapolateRight: 'clamp' });

          return (
            <g key={i}>
              <line
                x1={startX}
                y1={startY}
                x2={currX}
                y2={currY}
                stroke={progress > 0.5 ? 'rgba(99, 102, 241, 0.5)' : 'rgba(244, 63, 94, 0.35)'}
                strokeWidth={progress > 0.5 ? 2.5 : 1.5}
                strokeDasharray="6 6"
              />
              {/* Particle Node */}
              <circle cx={currX} cy={currY} r={progress > 0.6 ? 4 : 8} fill={progress > 0.5 ? '#38bdf8' : '#f43f5e'} />
            </g>
          );
        })}

        {/* Central Hexagonal Prism Glass */}
        <polygon
          points="-45,-75 45,-75 80,0 45,75 -45,75 -80,0"
          fill="rgba(30, 27, 75, 0.65)"
          stroke="#6366f1"
          strokeWidth="3.5"
          style={{
            filter: `drop-shadow(0 0 35px rgba(99, 102, 241, ${prismGlow}))`,
            backdropFilter: 'blur(12px)',
          }}
        />
        <text x="-32" y="8" fill="#ffffff" fontSize="24" fontWeight="900">OS</text>

        {/* Focused Coherent Laser Beam Out */}
        <rect
          x="80"
          y="-8"
          width={laserWidth}
          height="16"
          rx="8"
          fill="url(#laserGrad)"
          style={{ filter: 'drop-shadow(0 0 25px #38bdf8)' }}
        />

        <defs>
          <linearGradient id="laserGrad" x1="80" y1="0" x2="560" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>

      {/* Target Result Card on Right */}
      <div
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: `translateY(-50%) scale(${progress})`,
          opacity: progress,
          background: 'rgba(56, 189, 248, 0.1)',
          border: '2px solid #38bdf8',
          borderRadius: '20px',
          padding: '24px 30px',
          boxShadow: '0 20px 50px rgba(56, 189, 248, 0.35)',
          backdropFilter: 'blur(20px)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8' }} />
          <span style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Single Channel
          </span>
        </div>
        <h3 style={{ color: '#ffffff', fontSize: '30px', fontWeight: 900, margin: 0 }}>
          {data.targetLabel || 'Pure Flow Execution'}
        </h3>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '17px', marginTop: '6px', display: 'block' }}>
          Zero context switching waste.
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// 4. PRIMITIVE 3: ICEBERG DEPTH (Surface Output vs Deep Architecture)
// =========================================================================
function IcebergDepthPrimitive({ data }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 25,
    fps,
    config: { mass: 1.4, stiffness: 40, damping: 17 },
  });

  const cameraY = interpolate(progress, [0, 1], [0, -140], { extrapolateRight: 'clamp' });
  const underwaterOpacity = interpolate(progress, [0.2, 1], [0.3, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '840px', height: '580px', marginTop: '30px', overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${cameraY}px)`, transition: 'transform 0.1s ease-out' }}>
        {/* Water Surface Line */}
        <div
          style={{
            position: 'absolute',
            top: '200px',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.8), transparent)',
            boxShadow: '0 0 20px #38bdf8',
            zIndex: 10,
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '165px',
            right: '40px',
            color: 'rgba(56, 189, 248, 0.7)',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            zIndex: 11,
          }}
        >
          Water Surface (Perceived Output)
        </span>

        {/* Iceberg Tip (Top 15% Surface Noise) */}
        <div
          style={{
            position: 'absolute',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1.5px solid rgba(244, 63, 94, 0.5)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(244, 63, 94, 0.2)',
          }}
        >
          <span style={{ color: '#f43f5e', fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Surface 10%
          </span>
          <h4 style={{ color: '#ffffff', fontSize: '22px', fontWeight: 800, margin: '6px 0 0 0' }}>
            {data.surfaceLabel || 'Random Motivation & To-Do Lists'}
          </h4>
        </div>

        {/* Deep Submerged Monolith (85% Underneath Architecture) */}
        <div
          style={{
            position: 'absolute',
            top: '230px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '680px',
            background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '2px solid rgba(99, 102, 241, 0.5)',
            borderRadius: '26px',
            padding: '36px',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), inset 0 0 40px rgba(99, 102, 241, 0.2)',
            opacity: underwaterOpacity,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ color: '#38bdf8', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px' }}>
              Submerged 90%: The Life OS
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Depth: Solid Bedrock</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {(data.deepFeatures || [
              { title: 'Habit Compounding Loop', icon: '🔄' },
              { title: 'Central Knowledge Base', icon: '🧠' },
              { title: 'Deep Work Timeboxing', icon: '⚡' },
              { title: 'Cashflow & Vision Alignment', icon: '💎' },
            ]).map((feat, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '24px' }}>{feat.icon}</span>
                <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700 }}>{feat.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 5. PRIMITIVE 4: PHYSICS FULCRUM (Effort vs Extreme Leverage)
// =========================================================================
function PhysicsFulcrumPrimitive({ data }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 25,
    fps,
    config: { mass: 1.5, stiffness: 42, damping: 16 },
  });

  // Fulcrum shifts from center (0) to left (-180px)
  const fulcrumX = interpolate(progress, [0, 0.6], [0, -180], { extrapolateRight: 'clamp' });
  // Beam tilts clockwise as right side gains leverage
  const beamAngle = interpolate(progress, [0.4, 1], [-12, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '840px', height: '540px', marginTop: '50px' }}>
      <svg width="840" height="540" viewBox="-420 -270 840 540" style={{ overflow: 'visible' }}>
        {/* Ground Floor */}
        <line x1="-380" y1="180" x2="380" y2="180" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />

        {/* Dynamic Sliding Fulcrum (Triangle Pivot) */}
        <g transform={`translate(${fulcrumX}, 180)`}>
          <polygon
            points="0,-80 -50,0 50,0"
            fill="url(#fulcrumGrad)"
            style={{ filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.6))' }}
          />
          <circle cx="0" cy="-75" r="7" fill="#38bdf8" />
          <text x="-40" y="30" fill="#818cf8" fontSize="16" fontWeight="800">LEVERAGE PIVOT</text>
        </g>

        {/* The Tilting Beam */}
        <g transform={`translate(${fulcrumX}, 100) rotate(${beamAngle})`}>
          <rect
            x="-360"
            y="-10"
            width="720"
            height="20"
            rx="10"
            fill="linear-gradient(90deg, #f43f5e, #6366f1, #38bdf8)"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))' }}
          />

          {/* Left Weight: 10x Mental Load */}
          <g transform="translate(-300, -80)">
            <rect x="-60" y="-40" width="120" height="80" rx="14" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2.5" />
            <text x="-45" y="6" fill="#ffffff" fontSize="20" fontWeight="900">10x Load</text>
          </g>

          {/* Right Input: 1x Tranvas System Effort */}
          <g transform="translate(300, -90)">
            <rect x="-70" y="-45" width="140" height="90" rx="16" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="2.5" />
            <text x="-50" y="8" fill="#38bdf8" fontSize="22" fontWeight="900">1x System</text>
          </g>
        </g>

        <defs>
          <linearGradient id="fulcrumGrad" x1="0" y1="-80" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
      </svg>

      {/* Narrative Footer */}
      <div style={{ position: 'absolute', bottom: '0px', width: '100%', textAlign: 'center' }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '22px', fontWeight: 800 }}>
          {data.takeaway || 'Don’t work 10x harder. Move the leverage point with a unified system.'}
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// 6. PRIMITIVE 5: MONOLITH PILLARS (The 4 Pillars of Second Brain)
// =========================================================================
function MonolithPillarsPrimitive({ data }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pillars = data.pillars || [
    { name: 'Capture', metric: 'Ideas', delay: 20 },
    { name: 'Organize', metric: 'Flow', delay: 35 },
    { name: 'Distill', metric: 'Clarity', delay: 50 },
    { name: 'Execute', metric: 'Output', delay: 65 },
  ];

  return (
    <div style={{ position: 'relative', width: '840px', height: '540px', marginTop: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '26px' }}>
      {pillars.map((p, i) => {
        const hSpring = spring({
          frame: frame - p.delay,
          fps,
          config: { mass: 1.2, stiffness: 50, damping: 14 },
        });
        const height = interpolate(hSpring, [0, 1], [40, 360], { extrapolateRight: 'clamp' });

        return (
          <div
            key={i}
            style={{
              width: '170px',
              height: `${height}px`,
              background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
              border: '2px solid rgba(99, 102, 241, 0.5)',
              borderRadius: '20px 20px 8px 8px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '20px 14px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Top Indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }} />
              <span style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {p.metric}
              </span>
            </div>

            {/* Title */}
            <div>
              <span style={{ color: '#818cf8', fontSize: '14px', fontWeight: 700 }}>Pillar 0{i + 1}</span>
              <h4 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0' }}>{p.name}</h4>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =========================================================================
// 7. PRIMITIVE 6: KINETIC FLYWHEEL (Daily Momentum Loop)
// =========================================================================
function KineticFlywheelPrimitive({ data }) {
  const frame = useCurrentFrame();
  const rotation = (frame * 2.2) % 360;

  const stages = [
    { label: 'Capture', x: 0, y: -190 },
    { label: 'Plan', x: 190, y: 0 },
    { label: 'Execute', x: 0, y: 190 },
    { label: 'Compound', x: -190, y: 0 },
  ];

  return (
    <div style={{ position: 'relative', width: '840px', height: '540px', marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer Rotating Glowing Track */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          border: '2px dashed rgba(99, 102, 241, 0.45)',
          transform: `rotate(${rotation}deg)`,
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.25)',
        }}
      />

      {/* Orbiting Milestone Nodes */}
      {stages.map((st, i) => {
        const rad = ((rotation + i * 90) * Math.PI) / 180;
        const curX = Math.cos(rad) * 210;
        const curY = Math.sin(rad) * 210;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              transform: `translate(${curX}px, ${curY}px)`,
              background: 'rgba(30, 27, 75, 0.9)',
              border: '2px solid #38bdf8',
              borderRadius: '50px',
              padding: '10px 22px',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 800,
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.6)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {st.label}
          </div>
        );
      })}

      {/* Core Energy Reactor */}
      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #6366f1 0%, #1e1b4b 70%, #030712 100%)',
          border: '2px solid #a855f7',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 50px rgba(168, 85, 247, 0.6)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '32px' }}>🌀</span>
        <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>Momentum</span>
      </div>
    </div>
  );
}

// =========================================================================
// 8. PRIMITIVE 7: SHIELD RADAR (Deep Work 360° Distraction Blocker)
// =========================================================================
function ShieldRadarPrimitive({ data }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 25,
    fps,
    config: { mass: 1.2, stiffness: 45, damping: 15 },
  });

  const sweepAngle = (frame * 3) % 360;
  const shieldRadius = interpolate(progress, [0, 1], [40, 250], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '840px', height: '540px', marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Expanding Safe Sanctuary Perimeter */}
      <div
        style={{
          position: 'absolute',
          width: `${shieldRadius * 2}px`,
          height: `${shieldRadius * 2}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(56, 189, 248, 0.05) 70%, transparent 100%)',
          border: '2px solid rgba(56, 189, 248, 0.6)',
          boxShadow: '0 0 60px rgba(99, 102, 241, 0.4)',
        }}
      />

      {/* Rotating Radar Sweep Line */}
      <div
        style={{
          position: 'absolute',
          width: `${shieldRadius}px`,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #38bdf8)',
          transformOrigin: '0% 50%',
          transform: `rotate(${sweepAngle}deg)`,
          boxShadow: '0 0 15px #38bdf8',
        }}
      />

      {/* Distractions dissolved at boundary */}
      {progress > 0.5 && (
        <>
          <div style={{ position: 'absolute', top: '70px', left: '140px', color: '#f43f5e', fontSize: '15px', fontWeight: 700, opacity: 0.5 }}>
            ✕ 18 Tabs Closed
          </div>
          <div style={{ position: 'absolute', bottom: '80px', right: '120px', color: '#f43f5e', fontSize: '15px', fontWeight: 700, opacity: 0.5 }}>
            ✕ Slack DMs Muted
          </div>
        </>
      )}

      {/* Central Flow Core */}
      <div
        style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: '#0f172a',
          border: '2px solid #38bdf8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.5)',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '36px' }}>🛡️</span>
        <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>Deep Flow</span>
      </div>
    </div>
  );
}

// =========================================================================
// 9. PRIMITIVE 8: MATRIX QUADRANT (Reactive to High Leverage Mastery)
// =========================================================================
function MatrixQuadrantPrimitive({ data }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 25,
    fps,
    config: { mass: 1.4, stiffness: 45, damping: 16 },
  });

  const orbX = interpolate(progress, [0, 1], [-160, 160], { extrapolateRight: 'clamp' });
  const orbY = interpolate(progress, [0, 1], [140, -130], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative', width: '780px', height: '540px', marginTop: '40px' }}>
      <svg width="780" height="540" viewBox="-390 -270 780 540" style={{ overflow: 'visible' }}>
        {/* Axes */}
        <line x1="-340" y1="0" x2="340" y2="0" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" />
        <line x1="0" y1="-230" x2="0" y2="230" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" />

        {/* Labels */}
        <text x="240" y="-15" fill="#818cf8" fontSize="16" fontWeight="700">LEVERAGE →</text>
        <text x="15" y="-210" fill="#38bdf8" fontSize="16" fontWeight="700">CLARITY ↑</text>

        {/* Quadrant 4 (Chaos) */}
        <rect x="-330" y="20" width="310" height="200" rx="16" fill="rgba(244, 63, 94, 0.08)" stroke="rgba(244, 63, 94, 0.3)" />
        <text x="-310" y="60" fill="#f43f5e" fontSize="20" fontWeight="800">Reactive Overwhelm</text>

        {/* Quadrant 1 (Mastery & Flow) */}
        <rect x="20" y="-220" width="310" height="200" rx="16" fill="rgba(56, 189, 248, 0.1)" stroke="rgba(56, 189, 248, 0.5)" />
        <text x="40" y="-180" fill="#38bdf8" fontSize="22" fontWeight="900">Systemic Flow (Tranvas)</text>

        {/* Moving Operating Orb */}
        <circle cx={orbX} cy={orbY} r="18" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 25px #38bdf8)' }} />
      </svg>
    </div>
  );
}

// =========================================================================
// 10. MASTER COMPONENT: GENERATIVE VISUAL METAPHOR
// =========================================================================
export function GenerativeVisualMetaphor({
  primitive = 'ChaosToPrism',
  categoryBadge = 'Life Architecture',
  headlinePart1 = 'Your Brain Is For Ideas,',
  headlinePart2 = 'Not Holding Them.',
  narrativeSubtitle = 'Scattered cognitive load drains 80% of daily momentum.',
  takeaway = 'Offload mental friction to a single unified second brain.',
  watermark = 'tranvas.com',
  primitiveData = {},
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const pulse = 1 + Math.sin(frame / 20) * 0.03;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '180px',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Ambient Lighting */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          width: '950px',
          height: '950px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 75%)',
          transform: `translate(-50%, -50%) scale(${pulse})`,
          filter: 'blur(120px)',
        }}
      />

      {/* 1. Category Pill Badge */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(20px)',
          padding: '10px 24px',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
        <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '17px', fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
          {categoryBadge}
        </span>
      </div>

      {/* 2. Kinetic Contrast Headline */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '28px',
          maxWidth: '920px',
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: '56px',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            lineHeight: '1.15',
            margin: 0,
          }}
        >
          {headlinePart1}{' '}
          <span style={{ color: '#38bdf8', textShadow: '0 0 35px rgba(56, 189, 248, 0.5)' }}>
            {headlinePart2}
          </span>
        </h1>
      </div>

      {/* 3. Dynamic Visual Metaphor Primitive Canvas */}
      <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {primitive === 'DivergentBranch' && <DivergentBranchPrimitive data={primitiveData} />}
        {primitive === 'ChaosToPrism' && <ChaosToPrismPrimitive data={primitiveData} />}
        {primitive === 'IcebergDepth' && <IcebergDepthPrimitive data={primitiveData} />}
        {primitive === 'PhysicsFulcrum' && <PhysicsFulcrumPrimitive data={primitiveData} />}
        {primitive === 'MonolithPillars' && <MonolithPillarsPrimitive data={primitiveData} />}
        {primitive === 'KineticFlywheel' && <KineticFlywheelPrimitive data={primitiveData} />}
        {primitive === 'ShieldRadar' && <ShieldRadarPrimitive data={primitiveData} />}
        {primitive === 'MatrixQuadrant' && <MatrixQuadrantPrimitive data={primitiveData} />}
      </div>

      {/* 4. Narrative Subtitle Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '220px',
          maxWidth: '820px',
          textAlign: 'center',
          padding: '0 30px',
        }}
      >
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: '1.4',
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          {narrativeSubtitle}
        </span>
      </div>

      {/* 5. Watermark */}
      <TranvasEmblem watermark={watermark} />
    </AbsoluteFill>
  );
}
