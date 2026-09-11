import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

// --- SUB-COMPONENT: Deep Minimalist Mindset Background ---
function MindsetBackground() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle floating dark ambient glow
  const glowY = interpolate(frame, [0, durationInFrames], [20, 80]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#070709', // Deep OLED Black
        overflow: 'hidden',
      }}
    >
      {/* Subtle Fine Grid Texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.8,
        }}
      />

      {/* Gentle Ambient Warm/Teal Light */}
      <div
        style={{
          position: 'absolute',
          top: `${glowY}%`,
          left: '50%',
          width: '750px',
          height: '750px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.08) 40%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(90px)',
        }}
      />
    </AbsoluteFill>
  );
}

// --- SCENE 1: THE VISUAL COMPARISON DIAGRAM (Focus vs Overthinking) ---
function Scene1MindsetComparison() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const circleLeft = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 90 } });
  const circleRight = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 90 } });
  const arrowSpring = spring({ frame: frame - 45, fps, config: { damping: 12, stiffness: 100 } });

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
      {/* Minimal Top Tag */}
      <div
        style={{
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '12px 28px',
          borderRadius: '100px',
          marginBottom: '50px',
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '20px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' }}>
          Mindset Shift
        </span>
      </div>

      <h1
        style={{
          transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
          opacity: titleSpring,
          color: '#ffffff',
          fontSize: '68px',
          fontWeight: 800,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-2px',
          maxWidth: '850px',
          margin: '0 0 60px 0',
        }}
      >
        Bukan Waktu yang Kurang, Tapi <span style={{ color: '#10b981' }}>Pikiran yang Penuh</span>
      </h1>

      {/* Visual Diagram: 2 Circles Comparison */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '30px',
          width: '100%',
        }}
      >
        {/* Left Circle: Overthinking */}
        <div
          style={{
            transform: `scale(${circleLeft})`,
            opacity: circleLeft,
            width: '360px',
            height: '360px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '2px dashed rgba(239, 68, 68, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: '48px', marginBottom: '12px' }}>🤯</span>
          <span style={{ color: '#f87171', fontSize: '28px', fontWeight: 700 }}>Overthinking</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px', marginTop: '8px' }}>
            100% Energi Habis<br />0% Tindakan Nyata
          </span>
        </div>

        {/* Transition Arrow */}
        <div
          style={{
            transform: `scale(${arrowSpring})`,
            opacity: arrowSpring,
            color: 'rgba(255,255,255,0.4)',
            fontSize: '36px',
            fontWeight: 800,
          }}
        >
          ➔
        </div>

        {/* Right Circle: Focused Action */}
        <div
          style={{
            transform: `scale(${circleRight})`,
            opacity: circleRight,
            width: '360px',
            height: '360px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '2px solid rgba(16, 185, 129, 0.6)',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</span>
          <span style={{ color: '#34d399', fontSize: '28px', fontWeight: 800 }}>Fokus 1 Hal</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '20px', marginTop: '8px' }}>
            1 Langkah Kecil<br />Setiap Hari
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// --- SCENE 2: THE COMPOUNDING GROWTH CURVE DIAGRAM ---
function Scene2CompoundingCurve() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const graphProgress = interpolate(frame, [15, 75], [0, 100], { extrapolateRight: 'clamp' });
  const cardSpring = spring({ frame: frame - 40, fps, config: { damping: 14, stiffness: 80 } });

  // SVG Line path drawing calculation
  const pathLength = 600;
  const strokeDashoffset = interpolate(graphProgress, [0, 100], [pathLength, 0]);

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
          marginBottom: '40px',
        }}
      >
        <span style={{ color: '#38bdf8', fontSize: '20px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase' }}>
          HUKUM 1% SETIAP HARI
        </span>
        <h2
          style={{
            color: '#ffffff',
            fontSize: '64px',
            fontWeight: 800,
            letterSpacing: '-2px',
            margin: '12px 0 0 0',
          }}
        >
          Konsistensi Mengalahkan Intensitas
        </h2>
      </div>

      {/* SVG Exponential Growth Curve */}
      <div
        style={{
          position: 'relative',
          width: '750px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '32px',
          padding: '40px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <svg
          viewBox="0 0 600 300"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          {/* Baseline horizontal line */}
          <line x1="20" y1="260" x2="580" y2="260" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6" />

          {/* Exponential Curve (Compounding) */}
          <path
            d="M 30 255 Q 300 245 420 180 T 570 30"
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={strokeDashoffset}
            filter="drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))"
          />

          {/* Glowing Head Dot */}
          {graphProgress > 10 && (
            <circle
              cx={interpolate(graphProgress, [10, 100], [100, 570])}
              cy={interpolate(graphProgress, [10, 100], [250, 30])}
              r="10"
              fill="#ffffff"
              stroke="#10b981"
              strokeWidth="4"
              filter="drop-shadow(0 0 15px #10b981)"
            />
          )}
        </svg>

        {/* Bottom Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 600 }}>
          <span>Awal (Terasa Lambat)</span>
          <span style={{ color: '#34d399' }}>Hasil Eksponensial (37x Lebih Baik)</span>
        </div>
      </div>

      {/* Insight Highlight */}
      <div
        style={{
          transform: `translateY(${interpolate(cardSpring, [0, 1], [40, 0])}px) scale(${cardSpring})`,
          opacity: cardSpring,
          marginTop: '40px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '24px 40px',
          maxWidth: '750px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '26px', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
          Kemajuan besar lahir dari kebiasaan kecil yang dilakukan tanpa henti.
        </p>
      </div>
    </AbsoluteFill>
  );
}

// --- SCENE 3: MINIMALIST REFLECTIVE OUTRO & CTA ---
function Scene3ReflectiveCTA({ badgeText = '@adhlil.co' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaSpring = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });

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
      <span
        style={{
          transform: `scale(${ctaSpring})`,
          opacity: ctaSpring,
          color: '#10b981',
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          marginBottom: '24px',
        }}
      >
        Refleksi Diri
      </span>

      <h2
        style={{
          transform: `scale(${ctaSpring})`,
          opacity: ctaSpring,
          color: '#ffffff',
          fontSize: '64px',
          fontWeight: 800,
          textAlign: 'center',
          letterSpacing: '-2px',
          lineHeight: 1.25,
          maxWidth: '850px',
          margin: '0 0 50px 0',
        }}
      >
        Kuasai pikiranmu hari ini, atau ia yang akan menguasaimu.
      </h2>

      {/* Elegant Aesthetic Pill Button */}
      <div
        style={{
          transform: `scale(${ctaSpring})`,
          opacity: ctaSpring,
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          padding: '24px 50px',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ fontSize: '28px' }}>🤍</span>
        <span
          style={{
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '1px',
          }}
        >
          SIMPAN & FOLLOW {badgeText}
        </span>
      </div>

      <p
        style={{
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: '22px',
          marginTop: '36px',
          letterSpacing: '1px',
        }}
      >
        Bagikan kepada teman yang sedang butuh pengingat ini.
      </p>
    </AbsoluteFill>
  );
}

// --- ROOT MINDSET THERAPY COMPOSITION ---
export function MindsetTherapyDemo({
  badgeText = '@adhlil.co',
  scene1Frames = 170,
  scene2Frames = 220,
  scene3Frames = 180,
}) {
  const scene1Start = 0;
  const scene2Start = scene1Frames;
  const scene3Start = scene1Frames + scene2Frames;

  return (
    <AbsoluteFill>
      <MindsetBackground />

      <Sequence from={scene1Start} durationInFrames={scene1Frames}>
        <Scene1MindsetComparison />
      </Sequence>

      <Sequence from={scene2Start} durationInFrames={scene2Frames}>
        <Scene2CompoundingCurve />
      </Sequence>

      <Sequence from={scene3Start} durationInFrames={scene3Frames}>
        <Scene3ReflectiveCTA badgeText={badgeText} />
      </Sequence>
    </AbsoluteFill>
  );
}
