import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// =========================================================================
// BRAND WATERMARK (TRANVAS IDENTITY)
// =========================================================================
function TranvasWatermark({ watermark = 'tranvas.com' }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 60, [0, 30, 60], [0.75, 1, 0.75]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
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
        <rect width="52" height="52" rx="14" fill="#0f172a" />
        <path
          d="M14 16H38V22H29V36H23V22H14V16Z"
          fill="url(#tranvasWatermarkGrad)"
          style={{ filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.8))' }}
        />
        <defs>
          <linearGradient id="tranvasWatermarkGrad" x1="14" y1="16" x2="38" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      <span
        style={{
          color: 'rgba(255, 255, 255, 0.5)',
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
// CONCEPT 1: THE OPTICAL CONVEX LENS (Scattered Energy vs Single Focus Laser)
// =========================================================================
export function OpticalLensVideo({
  headline = 'Scattered Energy = 0. Single Focus = Laser.',
  watermark = 'tranvas.com',
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline entrance
  const titleSpring = spring({ frame: frame - 4, fps, config: { damping: 14 } });

  // Continuous subtle pulse & oscillation
  const pulse = Math.sin(frame * 0.15);
  const laserGlow = interpolate(pulse, [-1, 1], [0.85, 1.25]);
  const laserWidth = interpolate(pulse, [-1, 1], [10, 16]);

  // Entrance of laser beam
  const beamProgress = spring({ frame: frame - 12, fps, config: { damping: 16, stiffness: 80 } });

  // 7 input rays representing scattered attention
  const inputRays = [
    { id: 1, x: 230, color: '#f43f5e' },
    { id: 2, x: 330, color: '#fb923c' },
    { id: 3, x: 430, color: '#facc15' },
    { id: 4, x: 540, color: '#38bdf8' },
    { id: 5, x: 650, color: '#a855f7' },
    { id: 6, x: 750, color: '#ec4899' },
    { id: 7, x: 850, color: '#ef4444' },
  ];

  // Coordinates calibrated for 1080x1920 full screen
  const rayStartY = 440;
  const lensCenterY = 920;
  const focusPointY = 1440;

  // Sparks at focus impact point
  const sparks = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#02040a',
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Background Ambient Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          width: '950px',
          height: '950px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(99, 102, 241, 0.08) 40%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(110px)',
          pointerEvents: 'none',
        }}
      />

      {/* ULTRA MINIMALIST HEADLINE (TOP 180px) */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          left: '50%',
          transform: `translateX(-50%) scale(${titleSpring})`,
          opacity: titleSpring,
          textAlign: 'center',
          width: '900px',
          zIndex: 20,
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: '52px',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            lineHeight: '1.25',
            margin: 0,
            textShadow: '0 4px 25px rgba(0,0,0,0.9)',
          }}
        >
          {headline}
        </h1>
      </div>

      {/* FULL-FRAME SVG OPTICAL STAGE */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        fill="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="laserCoreGrad" x1="540" y1={lensCenterY} x2="540" y2={focusPointY} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <linearGradient id="lensGlassGrad" x1="160" y1={lensCenterY} x2="920" y2={lensCenterY} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.45)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.15)" />
          </linearGradient>

          <radialGradient id="impactGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Section 1: Scattered Divergent Rays entering from top */}
        <text
          x="540"
          y="400"
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.4)"
          fontSize="21"
          fontWeight="700"
          letterSpacing="4"
        >
          SCATTERED ATTENTION (0 OUTCOME)
        </text>

        {inputRays.map((ray, i) => {
          const rayOffset = Math.sin((frame * 0.1) + i) * 3;
          return (
            <g key={ray.id}>
              <line
                x1={ray.x + rayOffset}
                y1={rayStartY}
                x2={ray.x}
                y2={lensCenterY - 45}
                stroke={ray.color}
                strokeWidth="2.5"
                strokeDasharray="5 5"
                opacity={interpolate(beamProgress, [0, 1], [0.35, 0.85])}
              />
              <circle
                cx={ray.x}
                cy={interpolate((frame * 4 + i * 40) % 400, [0, 400], [rayStartY, lensCenterY - 45])}
                r="4"
                fill={ray.color}
                style={{ filter: `drop-shadow(0 0 8px ${ray.color})` }}
              />
            </g>
          );
        })}

        {/* Section 2: THE OPTICAL CONVEX GLASS LENS (Center y = 920) */}
        <ellipse
          cx="540"
          cy={lensCenterY}
          rx="390"
          ry="55"
          fill="none"
          stroke="rgba(56, 189, 248, 0.55)"
          strokeWidth="3.5"
          style={{ filter: 'drop-shadow(0 0 30px rgba(56, 189, 248, 0.7))' }}
        />
        <ellipse
          cx="540"
          cy={lensCenterY}
          rx="386"
          ry="51"
          fill="url(#lensGlassGrad)"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="2"
        />
        <line
          x1="180"
          y1={lensCenterY}
          x2="900"
          y2={lensCenterY}
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth="2"
          strokeDasharray="8 6"
        />
        <text
          x="540"
          y={lensCenterY + 7}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="20"
          fontWeight="800"
          letterSpacing="6"
          style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.9))' }}
        >
          TRANVAS FOCUS FILTER
        </text>

        {/* Section 3: Bending refraction rays beneath lens converging to focus point */}
        {inputRays.map((ray) => {
          return (
            <line
              key={`converge_${ray.id}`}
              x1={ray.x}
              y1={lensCenterY + 45}
              x2="540"
              y2={focusPointY}
              stroke={ray.color}
              strokeWidth="2"
              opacity={0.4 * beamProgress}
            />
          );
        })}

        {/* Section 4: THE HYPER LASER BEAM (Focused Power) */}
        {beamProgress > 0.05 && (
          <g>
            <line
              x1="540"
              y1={lensCenterY + 50}
              x2="540"
              y2={focusPointY}
              stroke="#38bdf8"
              strokeWidth={laserWidth * 3.2}
              strokeLinecap="round"
              opacity={0.35 * laserGlow}
              style={{ filter: 'blur(14px)' }}
            />
            <line
              x1="540"
              y1={lensCenterY + 50}
              x2="540"
              y2={focusPointY}
              stroke="#818cf8"
              strokeWidth={laserWidth * 1.8}
              strokeLinecap="round"
              opacity={0.75 * laserGlow}
              style={{ filter: 'drop-shadow(0 0 25px #818cf8)' }}
            />
            <line
              x1="540"
              y1={lensCenterY + 50}
              x2="540"
              y2={focusPointY}
              stroke="url(#laserCoreGrad)"
              strokeWidth={laserWidth * 0.8}
              strokeLinecap="round"
              opacity={1}
              style={{ filter: 'drop-shadow(0 0 12px #ffffff)' }}
            />
          </g>
        )}

        {/* Section 5: IMPACT TARGET & SPARKS (y = 1440) */}
        {beamProgress > 0.4 && (
          <g>
            {/* Radiating shockwaves */}
            <circle
              cx="540"
              cy={focusPointY}
              r={interpolate(frame % 30, [0, 30], [8, 65])}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              opacity={interpolate(frame % 30, [0, 30], [0.9, 0])}
            />
            {/* White-Hot Focal Point */}
            <circle
              cx="540"
              cy={focusPointY}
              r="20"
              fill="url(#impactGlow)"
              style={{ filter: 'drop-shadow(0 0 30px #ffffff)' }}
            />

            {/* Flying electric sparks */}
            {sparks.map((s) => {
              const angle = (s * (Math.PI / 4)) + (frame * 0.12);
              const sparkDist = interpolate((frame * 6 + s * 15) % 45, [0, 45], [10, 55]);
              const sx = 540 + Math.cos(angle) * sparkDist;
              const sy = focusPointY + Math.sin(angle) * sparkDist * 0.6;
              return (
                <circle
                  key={s}
                  cx={sx}
                  cy={sy}
                  r="3"
                  fill="#ffffff"
                  opacity={interpolate(sparkDist, [10, 55], [1, 0])}
                />
              );
            })}

            {/* Anvil Plate */}
            <rect
              x="360"
              y={focusPointY + 30}
              width="360"
              height="20"
              rx="10"
              fill="#1e293b"
              stroke="rgba(56, 189, 248, 0.5)"
              strokeWidth="2"
            />
            <text
              x="540"
              y={focusPointY + 95}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="28"
              fontWeight="900"
              letterSpacing="3"
            >
              100X BREAKTHROUGH
            </text>
          </g>
        )}
      </svg>

      <TranvasWatermark watermark={watermark} />
    </AbsoluteFill>
  );
}

// =========================================================================
// CONCEPT 2: THE HOURGLASS OF COMPOUND TIME (Continuous Sand Stream)
// =========================================================================
export function HourglassFlowVideo({
  headline = 'Time Sinks. Or Time Compounds.',
  watermark = 'tranvas.com',
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 4, fps, config: { damping: 14 } });

  // Hourglass geometry centered in 1080x1920
  const cx = 540;
  const cy = 980;
  const bulbW = 400;
  const bulbH = 360;
  const neckY = cy;

  // Stream particles simulation
  const streamParticles = Array.from({ length: 22 }, (_, i) => {
    const pFrame = (frame * 14 + i * 18) % 360;
    const py = interpolate(pFrame, [0, 360], [neckY - 15, cy + bulbH - 60]);
    const px = cx + Math.sin(i * 1.8 + frame * 0.2) * 9;
    return { id: i, px, py };
  });

  // Sand heap piling up continuously
  const heapHeight = interpolate(frame, [0, 195], [60, 160]);

  // Top sand drain level
  const topSandLevel = interpolate(frame, [0, 195], [cy - bulbH + 60, cy - 80]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#02040a',
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Golden Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          width: '900px',
          height: '900px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 75%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }}
      />

      {/* HEADLINE (TOP 180px) */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          left: '50%',
          transform: `translateX(-50%) scale(${titleSpring})`,
          opacity: titleSpring,
          textAlign: 'center',
          width: '900px',
          zIndex: 20,
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
            textShadow: '0 4px 25px rgba(0,0,0,0.9)',
          }}
        >
          {headline}
        </h1>
      </div>

      {/* FULL-FRAME HOURGLASS SVG */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        fill="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="goldSandGrad" x1="540" y1={cy - bulbH} x2="540" y2={cy + bulbH} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <linearGradient id="glassRimGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
            <stop offset="50%" stopColor="rgba(56, 189, 248, 0.25)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.5)" />
          </linearGradient>
        </defs>

        {/* Hourglass Outer Glass Vessel */}
        <path
          d={`
            M ${cx - bulbW/2} ${cy - bulbH}
            C ${cx - bulbW/2} ${cy - bulbH/2}, ${cx - 30} ${neckY - 45}, ${cx - 20} ${neckY}
            C ${cx - 30} ${neckY + 45}, ${cx - bulbW/2} ${cy + bulbH/2}, ${cx - bulbW/2} ${cy + bulbH}
            L ${cx + bulbW/2} ${cy + bulbH}
            C ${cx + bulbW/2} ${cy + bulbH/2}, ${cx + 30} ${neckY + 45}, ${cx + 20} ${neckY}
            C ${cx + 30} ${neckY - 45}, ${cx + bulbW/2} ${cy - bulbH/2}, ${cx + bulbW/2} ${cy - bulbH}
            Z
          `}
          fill="rgba(15, 23, 42, 0.45)"
          stroke="url(#glassRimGrad)"
          strokeWidth="4"
          style={{ filter: 'drop-shadow(0 0 40px rgba(56, 189, 248, 0.3))' }}
        />

        {/* Metal Top & Bottom Rims */}
        <rect x={cx - bulbW/2 - 25} y={cy - bulbH - 22} width={bulbW + 50} height="24" rx="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
        <rect x={cx - bulbW/2 - 25} y={cy + bulbH} width={bulbW + 50} height="24" rx="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />

        {/* Top Sand Reservoir (Funneling down) */}
        <path
          d={`
            M ${cx - bulbW/2 + 25} ${topSandLevel}
            Q ${cx} ${topSandLevel + 30}, ${cx + bulbW/2 - 25} ${topSandLevel}
            L ${cx + 18} ${neckY - 5}
            L ${cx - 18} ${neckY - 5}
            Z
          `}
          fill="url(#goldSandGrad)"
          opacity="0.9"
        />

        {/* Continuous Center Stream Jet */}
        <line
          x1={cx}
          y1={neckY - 10}
          x2={cx}
          y2={cy + bulbH - heapHeight}
          stroke="#fef08a"
          strokeWidth="6"
          style={{ filter: 'drop-shadow(0 0 12px #facc15)' }}
        />

        {/* Granular Falling Particles */}
        {streamParticles.map((p) => (
          <circle
            key={p.id}
            cx={p.px}
            cy={p.py}
            r="4"
            fill="#fef08a"
            style={{ filter: 'drop-shadow(0 0 7px #eab308)' }}
          />
        ))}

        {/* Bottom Growing Sand Heap */}
        <path
          d={`
            M ${cx - bulbW/2 + 25} ${cy + bulbH}
            Q ${cx} ${cy + bulbH - heapHeight - 35}, ${cx + bulbW/2 - 25} ${cy + bulbH}
            Z
          `}
          fill="url(#goldSandGrad)"
          style={{ filter: 'drop-shadow(0 0 25px rgba(234, 179, 8, 0.45))' }}
        />

        {/* Splash rings on bottom heap */}
        <circle
          cx={cx}
          cy={cy + bulbH - heapHeight}
          r={interpolate(frame % 20, [0, 20], [4, 32])}
          fill="none"
          stroke="#facc15"
          strokeWidth="2.5"
          opacity={interpolate(frame % 20, [0, 20], [0.9, 0])}
        />

        {/* Side Labels */}
        <g>
          <text x={cx - bulbW/2 - 50} y={cy - bulbH/2} textAnchor="end" fill="rgba(255,255,255,0.45)" fontSize="22" fontWeight="700">
            TIME CONSUMED
          </text>
          <text x={cx + bulbW/2 + 50} y={cy + bulbH/2} textAnchor="start" fill="#facc15" fontSize="22" fontWeight="800">
            COMPOUNDED VALUE
          </text>
        </g>
      </svg>

      <TranvasWatermark watermark={watermark} />
    </AbsoluteFill>
  );
}

// =========================================================================
// CONCEPT 3: THE ICEBERG OF MASTERY (The 5% Seen vs 95% Hidden Abyss)
// =========================================================================
export function IcebergMasteryVideo({
  headline = 'They See 5% of The Work.',
  watermark = 'tranvas.com',
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 4, fps, config: { damping: 14 } });

  // Floating iceberg buoyancy physics (continuous gentle sine bobbing)
  const bobbing = Math.sin(frame * 0.08) * 12;

  const waterlineY = 780;
  const icebergCenterY = waterlineY + bobbing;

  // Rising bubbles from underwater abyss
  const bubbles = Array.from({ length: 16 }, (_, i) => {
    const by = interpolate((frame * 3 + i * 65) % 800, [0, 800], [1600, waterlineY + 20]);
    const bx = 540 + Math.sin(i * 2.2 + frame * 0.05) * 240;
    return { id: i, bx, by };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#02040a',
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
      }}
    >
      {/* Deep Underwater Ocean Gradient */}
      <div
        style={{
          position: 'absolute',
          top: `${waterlineY}px`,
          bottom: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.7) 40%, rgba(3, 7, 18, 0.98) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* HEADLINE (TOP 180px) */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          left: '50%',
          transform: `translateX(-50%) scale(${titleSpring})`,
          opacity: titleSpring,
          textAlign: 'center',
          width: '900px',
          zIndex: 20,
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
            textShadow: '0 4px 25px rgba(0,0,0,0.9)',
          }}
        >
          {headline}
        </h1>
      </div>

      {/* FULL-FRAME ICEBERG SVG */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        fill="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="underwaterIceGrad" x1="540" y1={waterlineY} x2="540" y2="1550" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.55)" />
            <stop offset="45%" stopColor="rgba(30, 58, 138, 0.65)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0.9)" />
          </linearGradient>

          <linearGradient id="sunlitTipGrad" x1="540" y1="580" x2="540" y2={waterlineY} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>

        {/* God Rays through water */}
        <polygon points={`360,${waterlineY} 280,1650 420,1650 440,${waterlineY}`} fill="rgba(56, 189, 248, 0.05)" />
        <polygon points={`620,${waterlineY} 680,1650 820,1650 720,${waterlineY}`} fill="rgba(56, 189, 248, 0.05)" />

        {/* SECTION 1: THE MASSIVE UNDERWATER BODY (95% Hidden) */}
        <polygon
          points={`
            ${470},${icebergCenterY} 
            ${300},${icebergCenterY + 140} 
            ${240},${icebergCenterY + 400} 
            ${360},${icebergCenterY + 680} 
            ${540},${icebergCenterY + 760} 
            ${720},${icebergCenterY + 680} 
            ${840},${icebergCenterY + 400} 
            ${780},${icebergCenterY + 140} 
            ${610},${icebergCenterY}
          `}
          fill="url(#underwaterIceGrad)"
          stroke="rgba(56, 189, 248, 0.65)"
          strokeWidth="3"
          style={{ filter: 'drop-shadow(0 0 50px rgba(14, 165, 233, 0.3))' }}
        />

        {/* Crystal Facet Lines */}
        <line x1="540" y1={icebergCenterY + 760} x2="540" y2={icebergCenterY + 160} stroke="rgba(56, 189, 248, 0.35)" strokeWidth="2" />
        <line x1="240" y1={icebergCenterY + 400} x2="540" y2={icebergCenterY + 480} stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" />
        <line x1="840" y1={icebergCenterY + 400} x2="540" y2={icebergCenterY + 480} stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" />

        {/* Floating Underwater Dust & Air Bubbles */}
        {bubbles.map((b) => (
          <circle
            key={b.id}
            cx={b.bx}
            cy={b.by}
            r="3"
            fill="#38bdf8"
            opacity="0.65"
            style={{ filter: 'drop-shadow(0 0 5px #38bdf8)' }}
          />
        ))}

        {/* SECTION 2: THE VISIBLE TIP (5% Seen Above Water) */}
        <polygon
          points={`
            ${540},${icebergCenterY - 160} 
            ${610},${icebergCenterY} 
            ${470},${icebergCenterY}
          `}
          fill="url(#sunlitTipGrad)"
          stroke="#ffffff"
          strokeWidth="2.5"
          style={{ filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.7))' }}
        />

        {/* SECTION 3: THE WATERLINE (Dynamic moving sine wave surface) */}
        <line
          x1="80"
          y1={waterlineY}
          x2="1000"
          y2={waterlineY}
          stroke="rgba(56, 189, 248, 0.85)"
          strokeWidth="3.5"
          style={{ filter: 'drop-shadow(0 0 14px #38bdf8)' }}
        />

        {/* Animated wave surface */}
        <path
          d={`
            M 60 ${waterlineY}
            Q 240 ${waterlineY + 10}, 420 ${waterlineY}
            T 780 ${waterlineY}
            T 1020 ${waterlineY}
          `}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* LABELS */}
        {/* Top Label: The Tip */}
        <g transform={`translate(0, ${bobbing})`}>
          <line x1="620" y1={waterlineY - 80} x2="750" y2={waterlineY - 80} stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="620" cy={waterlineY - 80} r="5" fill="#38bdf8" />
          <text x="770" y={waterlineY - 72} fill="#ffffff" fontSize="24" fontWeight="800" letterSpacing="2">
            PUBLIC RESULT (5%)
          </text>
        </g>

        {/* Bottom Label: The Abyss (Centered Underneath) */}
        <g>
          <line
            x1="540"
            y1={icebergCenterY + 770}
            x2="540"
            y2={icebergCenterY + 815}
            stroke="#818cf8"
            strokeWidth="2.5"
          />
          <circle cx="540" cy={icebergCenterY + 770} r="5" fill="#818cf8" />
          <text
            x="540"
            y={icebergCenterY + 855}
            textAnchor="middle"
            fill="#818cf8"
            fontSize="26"
            fontWeight="800"
            letterSpacing="2"
          >
            1,000 UNSEEN DAYS (95%)
          </text>
          <text
            x="540"
            y={icebergCenterY + 890}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize="20"
            fontWeight="600"
          >
            Late nights • Daily Reps • Failures
          </text>
        </g>
      </svg>

      <TranvasWatermark watermark={watermark} />
    </AbsoluteFill>
  );
}
