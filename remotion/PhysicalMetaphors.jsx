import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// =========================================================================
// 1. BRAND WATERMARK
// =========================================================================
function TranvasWatermark({ watermark = 'tranvas.com' }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 60, [0, 30, 60], [0.75, 1, 0.75]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '90px',
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
          fill="url(#tranvasPhysicalIndigoGrad)"
          style={{ filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.8))' }}
        />
        <defs>
          <linearGradient id="tranvasPhysicalIndigoGrad" x1="14" y1="16" x2="38" y2="36" gradientUnits="userSpaceOnUse">
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
// 2. CONCEPT A: NEWTON'S CRADLE OF MOMENTUM (Continuous Hypnotic Clack & Swing)
// =========================================================================
export function NewtonsCradleVideo({
  headline = 'Small Action. Infinite Momentum.',
  watermark = 'tranvas.com',
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for headline
  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 14 } });

  // Pendulum physical period (~40 frames per full half-cycle)
  const period = 44;
  const cycleFrame = frame % (period * 2);
  const isLeftPhase = cycleFrame < period;
  const phaseProgress = (cycleFrame % period) / period;

  // Real sine pendulum arc
  // When left ball is swinging: angle goes from -42 deg to 0 deg
  // When right ball is swinging: angle goes from 0 deg to +42 deg
  let leftAngle = 0;
  let rightAngle = 0;
  let collisionFlash = 0;

  if (isLeftPhase) {
    // Left ball swings down and strikes at phaseProgress = 0.5
    // From 0 to 0.5: swings in from -42 to 0
    // From 0.5 to 1.0: right ball swings out from 0 to +42
    if (phaseProgress < 0.5) {
      const p = phaseProgress / 0.5;
      leftAngle = -42 * Math.cos(p * (Math.PI / 2));
    } else {
      leftAngle = 0;
      const p = (phaseProgress - 0.5) / 0.5;
      rightAngle = 42 * Math.sin(p * (Math.PI / 2));
    }
  } else {
    // Right ball swings back down and strikes
    if (phaseProgress < 0.5) {
      const p = phaseProgress / 0.5;
      rightAngle = 42 * Math.cos(p * (Math.PI / 2));
    } else {
      rightAngle = 0;
      const p = (phaseProgress - 0.5) / 0.5;
      leftAngle = -42 * Math.sin(p * (Math.PI / 2));
    }
  }

  // Flash exactly at collision (phaseProgress near 0.5 and 0.0)
  if (Math.abs(phaseProgress - 0.5) < 0.08 || phaseProgress < 0.08 || phaseProgress > 0.92) {
    collisionFlash = 1;
  }

  const stringLength = 480;
  const sphereRadius = 42;
  const sphereSpacing = 84;
  const originY = 480;
  const centerX = 540;

  const balls = [-2, -1, 0, 1, 2];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#02040a',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '230px',
        paddingBottom: '120px',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Ambient Lighting */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 75%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* SINGLE MINIMALIST HEADLINE */}
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

      {/* NEWTON'S CRADLE SVG STAGE (PERFECTLY CENTERED IN 1080x1920) */}
      <div style={{ position: 'relative', width: '1080px', height: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="1080" height="900" viewBox="0 0 1080 900" style={{ overflow: 'visible' }}>
          {/* Top Suspension Bar */}
          <rect x="240" y="80" width="600" height="16" rx="8" fill="#1e1b4b" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="2.5" />

          {/* 5 Spheres with Suspension Cables */}
          {balls.map((idx) => {
            const pivotX = centerX + idx * 104;
            let angle = 0;
            if (idx === -2) angle = leftAngle;
            if (idx === 2) angle = rightAngle;

            const rad = (angle * Math.PI) / 180;
            const originYPos = 90;
            const ballRadius = 50;
            const cableLen = 460;
            const ballX = pivotX + cableLen * Math.sin(rad);
            const ballY = originYPos + cableLen * Math.cos(rad);

            const isLeft = idx === -2;
            const isRight = idx === 2;
            const isCenter = idx === 0;

            return (
              <g key={idx}>
                {/* Floor Shadow */}
                <ellipse
                  cx={ballX}
                  cy={originYPos + cableLen + 70}
                  rx={ballRadius * (1 - Math.abs(angle) / 60)}
                  ry={ballRadius * 0.25 * (1 - Math.abs(angle) / 60)}
                  fill="rgba(0,0,0,0.7)"
                  style={{ filter: 'blur(10px)' }}
                />

                {/* Suspension String */}
                <line
                  x1={pivotX}
                  y1={originYPos}
                  x2={ballX}
                  y2={ballY}
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="2.5"
                />

                {/* The Polished Metallic Sphere */}
                <circle
                  cx={ballX}
                  cy={ballY}
                  r={ballRadius}
                  fill={`url(#ballGrad_${idx + 2})`}
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="2"
                  style={{
                    filter:
                      isLeft || isRight
                        ? 'drop-shadow(0 0 30px rgba(56, 189, 248, 0.7))'
                        : 'drop-shadow(0 20px 35px rgba(0,0,0,0.9))',
                  }}
                />

                {/* Specular Light Reflection */}
                <ellipse
                  cx={ballX - ballRadius * 0.35}
                  cy={ballY - ballRadius * 0.35}
                  rx={ballRadius * 0.3}
                  ry={ballRadius * 0.2}
                  fill="rgba(255, 255, 255, 0.6)"
                  transform={`rotate(-25 ${ballX - ballRadius * 0.35} ${ballY - ballRadius * 0.35})`}
                />

                {/* Center Pulse Ring upon strike */}
                {isCenter && collisionFlash === 1 && (
                  <circle
                    cx={ballX}
                    cy={ballY}
                    r={ballRadius + 22}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    style={{ filter: 'drop-shadow(0 0 20px #38bdf8)' }}
                  />
                )}
              </g>
            );
          })}

          {/* Gradients */}
          <defs>
            {balls.map((idx) => (
              <radialGradient
                key={idx}
                id={`ballGrad_${idx + 2}`}
                cx="35%"
                cy="35%"
                r="65%"
                fx="30%"
                fy="30%"
              >
                <stop offset="0%" stopColor={idx === -2 || idx === 2 ? '#38bdf8' : '#818cf8'} />
                <stop offset="45%" stopColor={idx === -2 || idx === 2 ? '#6366f1' : '#312e81'} />
                <stop offset="100%" stopColor="#030712" />
              </radialGradient>
            ))}
          </defs>
        </svg>

        {/* Minimalist Sub-Labels under the two swinging ends */}
        <div style={{ width: '740px', display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <span style={{ color: '#38bdf8', fontSize: '26px', fontWeight: 800 }}>1x Habit Input</span>
          <span style={{ color: '#818cf8', fontSize: '26px', fontWeight: 800 }}>10x Momentum</span>
        </div>
      </div>

      <TranvasWatermark watermark={watermark} />
    </AbsoluteFill>
  );
}

// =========================================================================
// 3. CONCEPT B: THE DOMINO CASCADE (Chain Reaction to Monolith)
// =========================================================================
export function DominoCascadeVideo({
  headline = 'Small Habits. Giant Outcomes.',
  watermark = 'tranvas.com',
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 14 } });

  // Domino specs: increasing sizes filling the center of the frame
  const dominoes = [
    { id: 1, startFrame: 18, w: 42, h: 100, x: -340, label: '10m Plan' },
    { id: 2, startFrame: 32, w: 60, h: 170, x: -190, label: 'Daily Routine' },
    { id: 3, startFrame: 46, w: 85, h: 270, x: -20, label: 'Deep Focus' },
    { id: 4, startFrame: 60, w: 120, h: 390, x: 170, label: 'Clarity' },
    { id: 5, startFrame: 76, w: 160, h: 540, x: 380, label: 'Tranvas Life OS', isMonolith: true },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#02040a',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '230px',
        paddingBottom: '110px',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '850px',
          height: '850px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 75%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* SINGLE MINIMALIST HEADLINE */}
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

      {/* DOMINO PHYSICAL CASCADE STAGE (CENTERED & PROPORTIONATE) */}
      <div style={{ position: 'relative', width: '1080px', height: '1000px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ground Line */}
        <div
          style={{
            position: 'absolute',
            bottom: '360px',
            left: '80px',
            right: '80px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.7), transparent)',
          }}
        />

        {/* 5 Dominoes */}
        {dominoes.map((d) => {
          const toppleSpring = spring({
            frame: frame - d.startFrame,
            fps,
            config: { mass: 1.0, stiffness: 55, damping: 13 },
          });

          // Topples to 68 degrees to strike the next domino
          const toppleAngle = interpolate(toppleSpring, [0, 1], [0, d.isMonolith ? 26 : 68], {
            extrapolateRight: 'clamp',
          });

          const isFallen = toppleSpring > 0.5;

          return (
            <div
              key={d.id}
              style={{
                position: 'absolute',
                bottom: '360px',
                left: `calc(50% + ${d.x}px)`,
                width: `${d.w}px`,
                height: `${d.h}px`,
                transformOrigin: 'bottom right',
                transform: `rotate(${toppleAngle}deg)`,
                background: d.isMonolith
                  ? 'linear-gradient(180deg, #1e1b4b 0%, #030712 100%)'
                  : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                border: d.isMonolith
                  ? '3px solid #38bdf8'
                  : isFallen
                  ? '2px solid rgba(99, 102, 241, 0.85)'
                  : '1.5px solid rgba(255, 255, 255, 0.25)',
                borderRadius: d.isMonolith ? '22px' : '14px',
                boxShadow: d.isMonolith
                  ? '0 0 60px rgba(56, 189, 248, 0.6), 0 30px 70px rgba(0,0,0,0.95)'
                  : '0 20px 40px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10 - d.id,
              }}
            >
              <span
                style={{
                  color: d.isMonolith ? '#38bdf8' : '#ffffff',
                  fontSize: d.isMonolith ? '26px' : '17px',
                  fontWeight: 800,
                  transform: 'rotate(-90deg)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '1px',
                }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      <TranvasWatermark watermark={watermark} />
    </AbsoluteFill>
  );
}
