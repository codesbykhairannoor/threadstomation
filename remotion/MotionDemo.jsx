import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

// --- SUB-COMPONENT: Animated Ambient Background ---
function AmbientBackground() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle pulsating ambient gradient orbs
  const orb1X = interpolate(frame, [0, durationInFrames], [20, 70]);
  const orb1Y = interpolate(frame, [0, durationInFrames], [30, 60]);
  const orb2X = interpolate(frame, [0, durationInFrames], [80, 30]);
  const orb2Y = interpolate(frame, [0, durationInFrames], [70, 40]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0f',
        overflow: 'hidden',
      }}
    >
      {/* Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Orb 1 (Purple Glow) */}
      <div
        style={{
          position: 'absolute',
          top: `${orb1Y}%`,
          left: `${orb1X}%`,
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(123, 44, 191, 0.45) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Orb 2 (Cyan/Blue Glow) */}
      <div
        style={{
          position: 'absolute',
          top: `${orb2Y}%`,
          left: `${orb2X}%`,
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 180, 216, 0.35) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(70px)',
        }}
      />
    </AbsoluteFill>
  );
}

// --- SCENE 1: HOOK & KINETIC TYPOGRAPHY (0 - 90 frames / 0 - 3s) ---
function Scene1Hook({ badgeText = '@adhlil.co' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animations
  const badgeSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const title1Spring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const title2Spring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 10, stiffness: 110 },
  });

  const cardSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {/* Top Floating Badge */}
      <div
        style={{
          transform: `scale(${badgeSpring})`,
          opacity: badgeSpring,
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          padding: '16px 36px',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '60px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ fontSize: '28px' }}>⚡</span>
        <span
          style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          {badgeText}
        </span>
      </div>

      {/* Main Kinetic Typography */}
      <h1
        style={{
          transform: `translateY(${interpolate(title1Spring, [0, 1], [60, 0])}px) scale(${title1Spring})`,
          opacity: title1Spring,
          color: '#ffffff',
          fontSize: '82px',
          fontWeight: 900,
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: '-2px',
          margin: '0 0 16px 0',
          textShadow: '0 10px 30px rgba(0,0,0,0.8)',
        }}
      >
        Pernah Gak Sih
      </h1>

      <h1
        style={{
          transform: `translateY(${interpolate(title2Spring, [0, 1], [60, 0])}px) scale(${title2Spring})`,
          opacity: title2Spring,
          background: 'linear-gradient(135deg, #ffd200 0%, #ff6b6b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '92px',
          fontWeight: 900,
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: '-3px',
          margin: 0,
          textShadow: '0 10px 40px rgba(255, 210, 0, 0.3)',
        }}
      >
        Kerja 10x Lebih Cepat?
      </h1>

      {/* Glassmorphism Highlight Card */}
      <div
        style={{
          transform: `translateY(${interpolate(cardSpring, [0, 1], [100, 0])}px) scale(${cardSpring})`,
          opacity: cardSpring,
          marginTop: '60px',
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '32px',
          padding: '36px 48px',
          maxWidth: '850px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '36px',
            fontWeight: 500,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Bukan cuma kerja keras, kuncinya ada di sistem otomatisasi cerdas!
        </p>
      </div>
    </AbsoluteFill>
  );
}

// --- SCENE 2: DYNAMIC CHART & METRICS (90 - 190 frames / 3s - 6.3s) ---
function Scene2Metrics() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const bar1 = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 80 } });
  const bar2 = spring({ frame: frame - 25, fps, config: { damping: 14, stiffness: 80 } });
  const bar3 = spring({ frame: frame - 35, fps, config: { damping: 14, stiffness: 80 } });

  const counterVal = Math.round(interpolate(frame, [15, 60], [0, 85], { extrapolateRight: 'clamp' }));

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
          textAlign: 'center',
          marginBottom: '50px',
        }}
      >
        <span
          style={{
            color: '#00f5d4',
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          DATA & HASIL NYATA
        </span>
        <h2
          style={{
            color: '#ffffff',
            fontSize: '72px',
            fontWeight: 900,
            letterSpacing: '-2px',
            margin: '12px 0 0 0',
          }}
        >
          Peningkatan Hasil +{counterVal}%
        </h2>
      </div>

      {/* Dynamic Animated Bar Chart Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '40px',
          height: '450px',
          width: '750px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '32px',
          padding: '50px 40px 40px 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Bar 1: Manual */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div
            style={{
              width: '100%',
              height: `${interpolate(bar1, [0, 1], [0, 140])}px`,
              background: 'linear-gradient(to top, #495057, #6c757d)',
              borderRadius: '16px 16px 6px 6px',
            }}
          />
          <span style={{ color: '#adb5bd', fontSize: '24px', fontWeight: 600, marginTop: '16px' }}>
            Manual
          </span>
        </div>

        {/* Bar 2: Semi-Auto */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div
            style={{
              width: '100%',
              height: `${interpolate(bar2, [0, 1], [0, 240])}px`,
              background: 'linear-gradient(to top, #3a86ff, #00b4d8)',
              borderRadius: '16px 16px 6px 6px',
            }}
          />
          <span style={{ color: '#00b4d8', fontSize: '24px', fontWeight: 700, marginTop: '16px' }}>
            Semi AI
          </span>
        </div>

        {/* Bar 3: Full Auto Agent */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div
            style={{
              width: '100%',
              height: `${interpolate(bar3, [0, 1], [0, 360])}px`,
              background: 'linear-gradient(to top, #7b2cbf, #ffd200)',
              borderRadius: '16px 16px 6px 6px',
              boxShadow: '0 0 40px rgba(255, 210, 0, 0.5)',
            }}
          />
          <span style={{ color: '#ffd200', fontSize: '26px', fontWeight: 900, marginTop: '16px' }}>
            AI Agent 🚀
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// --- SCENE 3: CTA & OUTRO (190 - 270 frames / 6.3s - 9s) ---
function Scene3CTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaSpring = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Pulsating glow on button
  const pulseScale = 1 + Math.sin(frame / 6) * 0.04;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      <h2
        style={{
          transform: `scale(${ctaSpring})`,
          opacity: ctaSpring,
          color: '#ffffff',
          fontSize: '76px',
          fontWeight: 900,
          textAlign: 'center',
          letterSpacing: '-2px',
          lineHeight: 1.15,
          margin: '0 0 30px 0',
        }}
      >
        Mau Buat Otomasi Seperti Ini?
      </h2>

      {/* Giant CTA Button */}
      <div
        style={{
          transform: `scale(${ctaSpring * pulseScale})`,
          opacity: ctaSpring,
          background: 'linear-gradient(135deg, #ffd200 0%, #ff9e00 100%)',
          padding: '30px 70px',
          borderRadius: '100px',
          boxShadow: '0 20px 60px rgba(255, 210, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginTop: '30px',
        }}
      >
        <span style={{ fontSize: '40px' }}>🚀</span>
        <span
          style={{
            color: '#000000',
            fontSize: '38px',
            fontWeight: 900,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          FOLLOW & CEK LINK DI BIO
        </span>
      </div>

      <p
        style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '28px',
          fontWeight: 500,
          marginTop: '40px',
          letterSpacing: '1px',
        }}
      >
        💡 Simpan video ini biar gak lupa!
      </p>
    </AbsoluteFill>
  );
}

// --- ROOT COMPOSITION ---
export function MotionGraphicDemo({
  badgeText = '@adhlil.co',
  scene1Frames = 135,
  scene2Frames = 165,
  scene3Frames = 135,
}) {
  const scene1Start = 0;
  const scene2Start = scene1Frames;
  const scene3Start = scene1Frames + scene2Frames;

  return (
    <AbsoluteFill>
      <AmbientBackground />

      {/* Sequence 1: Hook (Dynamic Duration) */}
      <Sequence from={scene1Start} durationInFrames={scene1Frames}>
        <Scene1Hook badgeText={badgeText} />
      </Sequence>

      {/* Sequence 2: Dynamic Metrics Chart (Dynamic Duration) */}
      <Sequence from={scene2Start} durationInFrames={scene2Frames}>
        <Scene2Metrics />
      </Sequence>

      {/* Sequence 3: Outro & Call to Action (Dynamic Duration) */}
      <Sequence from={scene3Start} durationInFrames={scene3Frames}>
        <Scene3CTA />
      </Sequence>
    </AbsoluteFill>
  );
}

