import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// --- MINIMALIST GOLD EMBLEM LOGO ---
function GoldEmblem({ watermark = '@adhlil.co' }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 90, [0, 45, 90], [0.8, 1, 0.8]);

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
      {/* Sleek Geometric Gold Monogram / Icon */}
      <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
        <path
          d="M32 4L6 44H20L32 24L44 44H58L32 4Z"
          fill="url(#goldGrad)"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(234, 179, 8, 0.35))' }}
        />
        <path
          d="M32 14L20 34H28L32 26L36 34H44L32 14Z"
          fill="#0a0a0c"
        />
        <defs>
          <linearGradient id="goldGrad" x1="6" y1="4" x2="58" y2="44" gradientUnits="userSpaceOnUse">
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

// --- 3D FLIP TILE COMPONENT ---
function FlipTile({
  fromLetter,
  toLetter,
  flipStartFrame = 50,
  stiffness = 120,
  damping = 12,
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isFlipping = fromLetter !== toLetter;

  // Spring animation for 3D flip rotation (0 to 180 deg)
  const flipProgress = spring({
    frame: frame - flipStartFrame,
    fps,
    config: { stiffness, damping },
  });

  // Calculate rotation angle (0 to 180 degrees)
  const rotX = interpolate(flipProgress, [0, 1], [0, 180], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Determine which side is showing
  const showFront = rotX < 90;

  // Subtle bounce on the tile container
  const tileScale = isFlipping
    ? interpolate(flipProgress, [0, 0.5, 1], [1, 1.06, 1])
    : 1;

  return (
    <div
      style={{
        width: '170px',
        height: '180px',
        perspective: '1200px',
        transform: `scale(${tileScale})`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg)`,
          borderRadius: '24px',
          background: 'linear-gradient(160deg, #222226 0%, #111114 60%, #0a0a0c 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.12)',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.9), inset 0 2px 2px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Horizontal split-flap center seam */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: '2px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 10,
          }}
        />

        {/* Letter Display */}
        <span
          style={{
            color: '#facc15',
            fontSize: '110px',
            fontWeight: 900,
            fontFamily: '"Montserrat", "Inter", -apple-system, sans-serif',
            letterSpacing: '-2px',
            transform: showFront ? 'none' : 'rotateX(180deg)',
            textShadow:
              '0 0 35px rgba(250, 204, 21, 0.45), 0 4px 10px rgba(0, 0, 0, 0.8)',
            userSelect: 'none',
          }}
        >
          {showFront ? fromLetter : toLetter}
        </span>
      </div>
    </div>
  );
}

// --- BOUNCING GOLD PHYSICS SPHERE ---
function BouncingSphere({ startFrame = 20, bounce1Frame = 50, bounce2Frame = 75 }) {
  const frame = useCurrentFrame();

  // Y trajectory: drop from -200 -> hit tile 3 -> bounce up -> hit tile 4 -> rest above
  let y = -300;
  let scaleX = 1;
  let scaleY = 1;
  let opacity = 0;

  if (frame >= startFrame) {
    opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
      extrapolateRight: 'clamp',
    });

    if (frame < bounce1Frame) {
      // Free fall to tile 3
      const t = (frame - startFrame) / (bounce1Frame - startFrame);
      y = interpolate(t * t, [0, 1], [-300, -90]);
    } else if (frame < bounce1Frame + 6) {
      // Squash on impact 1
      y = -90;
      scaleX = 1.35;
      scaleY = 0.75;
    } else if (frame < bounce2Frame) {
      // Parabolic bounce to tile 4
      const t = (frame - (bounce1Frame + 6)) / (bounce2Frame - (bounce1Frame + 6));
      // Arc formula: y = 4 * height * (t - 0.5)^2 - height
      const arc = 4 * 160 * Math.pow(t - 0.5, 2) - 160;
      y = -90 + arc;
      scaleX = 0.9;
      scaleY = 1.15;
    } else if (frame < bounce2Frame + 6) {
      // Squash on impact 2
      y = -90;
      scaleX = 1.35;
      scaleY = 0.75;
    } else {
      // Final float / settle above word
      const settleProgress = interpolate(frame - (bounce2Frame + 6), [0, 25], [0, 1], {
        extrapolateRight: 'clamp',
      });
      y = interpolate(settleProgress, [0, 1], [-90, -180]);
      scaleX = 1 + Math.sin(frame / 8) * 0.05;
      scaleY = 1 - Math.sin(frame / 8) * 0.05;
    }
  }

  // X position tracks tile 3 then tile 4 then center
  let x = 95; // above tile 3
  if (frame >= bounce1Frame + 6 && frame <= bounce2Frame) {
    const t = (frame - (bounce1Frame + 6)) / (bounce2Frame - (bounce1Frame + 6));
    x = interpolate(t, [0, 1], [95, 280]); // move from tile 3 to tile 4
  } else if (frame > bounce2Frame) {
    x = interpolate(frame, [bounce2Frame, bounce2Frame + 30], [280, 0], {
      extrapolateRight: 'clamp',
    });
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scaleX}, ${scaleY})`,
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 35% 30%, #ffffff 0%, #fef08a 25%, #eab308 60%, #854d0e 100%)',
        boxShadow:
          '0 0 35px rgba(250, 204, 21, 0.8), 0 0 15px rgba(250, 204, 21, 0.9), inset 0 2px 4px rgba(255,255,255,0.8)',
        opacity,
        zIndex: 20,
      }}
    />
  );
}

// --- MAIN 6-SECOND EXACT RECREATION COMPOSITION ---
export function RiskToRichExact({ watermark = '@adhlil.co' }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle breathing spotlight background
  const ambientPulse = 1 + Math.sin(frame / 15) * 0.04;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0c',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Montserrat", "Inter", -apple-system, sans-serif',
      }}
    >
      {/* Ambient Vignette & Golden Spotlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.09) 0%, rgba(15, 15, 18, 0.6) 45%, #050507 85%)',
          transform: `scale(${ambientPulse})`,
        }}
      />

      {/* Subtle Grid / Texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.5,
        }}
      />

      {/* Central Visual Showcase */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Subtle Watermark Handle Above Words */}
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.35)',
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'lowercase',
            marginBottom: '32px',
            userSelect: 'none',
          }}
        >
          {watermark}
        </span>

        {/* Bouncing Gold Ball */}
        <BouncingSphere startFrame={20} bounce1Frame={52} bounce2Frame={78} />

        {/* The 4 Tiles: R - I - S/C - K/H */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <FlipTile fromLetter="R" toLetter="R" flipStartFrame={0} />
          <FlipTile fromLetter="I" toLetter="I" flipStartFrame={0} />
          <FlipTile fromLetter="S" toLetter="C" flipStartFrame={52} stiffness={130} damping={11} />
          <FlipTile fromLetter="K" toLetter="H" flipStartFrame={78} stiffness={130} damping={11} />
        </div>
      </div>

      {/* Gold Emblem Logo at Bottom */}
      <GoldEmblem watermark={watermark} />
    </AbsoluteFill>
  );
}
