import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

// --- AMBIENT MINDSET BACKGROUND ---
function MindsetBackground() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const glowY = interpolate(frame, [0, durationInFrames], [20, 80]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#070709',
        overflow: 'hidden',
      }}
    >
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
      <div
        style={{
          position: 'absolute',
          top: `${glowY}%`,
          left: '50%',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.08) 40%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(90px)',
        }}
      />
    </AbsoluteFill>
  );
}

// --- SLIDE 1: HOOK & KINETIC TYPOGRAPHY ---
function HookSlide({ slide, badgeText = '@adhlil.co' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const title1Spring = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 90 } });
  const title2Spring = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 95 } });
  const cardSpring = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 85 } });

  const title1 = slide.title_part1 || slide.title || 'Mindset Shift';
  const title2 = slide.title_part2 || '';
  const body = slide.body || slide.text || '';

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
          transform: `scale(${badgeSpring})`,
          opacity: badgeSpring,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '12px 30px',
          borderRadius: '100px',
          marginBottom: '50px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '20px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
          {badgeText}
        </span>
      </div>

      <h1
        style={{
          transform: `translateY(${interpolate(title1Spring, [0, 1], [40, 0])}px) scale(${title1Spring})`,
          opacity: title1Spring,
          color: '#ffffff',
          fontSize: '76px',
          fontWeight: 900,
          textAlign: 'center',
          lineHeight: 1.15,
          letterSpacing: '-2px',
          maxWidth: '900px',
          margin: '0 0 16px 0',
          textShadow: '0 10px 30px rgba(0,0,0,0.8)',
        }}
      >
        {title1}
      </h1>

      {title2 ? (
        <h1
          style={{
            transform: `translateY(${interpolate(title2Spring, [0, 1], [40, 0])}px) scale(${title2Spring})`,
            opacity: title2Spring,
            color: '#10b981',
            fontSize: '80px',
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1.15,
            letterSpacing: '-2px',
            maxWidth: '900px',
            margin: '0 0 40px 0',
            textShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
          }}
        >
          {title2}
        </h1>
      ) : null}

      {body ? (
        <div
          style={{
            transform: `translateY(${interpolate(cardSpring, [0, 1], [60, 0])}px) scale(${cardSpring})`,
            opacity: cardSpring,
            marginTop: '30px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '28px',
            padding: '32px 48px',
            maxWidth: '850px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '32px', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
            {body}
          </p>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

// --- SLIDE 2..N: VALUE & VISUAL DIAGRAMS ---
function ValueSlide({ slide, index }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const diagramSpring = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 90 } });
  const bodySpring = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 85 } });

  const title1 = slide.title_part1 || slide.title || `Pilar #${index + 1}`;
  const title2 = slide.title_part2 || '';
  const body = slide.body || slide.text || '';

  // Diagram types: 0 = Curve, 1 = Comparison, 2 = 3-Step Flow
  const diagramType = index % 3;
  const curveProgress = interpolate(frame, [15, 70], [0, 100], { extrapolateRight: 'clamp' });
  const strokeDashoffset = interpolate(curveProgress, [0, 100], [500, 0]);

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
          marginBottom: '36px',
        }}
      >
        <span style={{ color: '#38bdf8', fontSize: '22px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase' }}>
          {title1}
        </span>
        {title2 ? (
          <h2 style={{ color: '#ffffff', fontSize: '56px', fontWeight: 800, letterSpacing: '-2px', margin: '12px 0 0 0' }}>
            {title2}
          </h2>
        ) : null}
      </div>

      {diagramType === 0 ? (
        /* Visual Diagram 1: Animated Exponential Compounding Curve */
        <div
          style={{
            transform: `scale(${diagramSpring})`,
            opacity: diagramSpring,
            width: '780px',
            height: '360px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '32px',
            padding: '32px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <svg viewBox="0 0 600 240" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <line x1="20" y1="210" x2="580" y2="210" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6" />
            <path
              d="M 30 205 Q 300 195 420 130 T 570 20"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={500}
              strokeDashoffset={strokeDashoffset}
              filter="drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))"
            />
            {curveProgress > 10 && (
              <circle
                cx={interpolate(curveProgress, [10, 100], [100, 570])}
                cy={interpolate(curveProgress, [10, 100], [200, 20])}
                r="10"
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth="4"
                filter="drop-shadow(0 0 15px #10b981)"
              />
            )}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 600 }}>
            <span>Awal (Proses)</span>
            <span style={{ color: '#34d399' }}>Hasil Maksimal 🚀</span>
          </div>
        </div>
      ) : diagramType === 1 ? (
        /* Visual Diagram 2: Mindset Comparison Cards */
        <div
          style={{
            transform: `scale(${diagramSpring})`,
            opacity: diagramSpring,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            width: '100%',
            maxWidth: '840px',
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'rgba(239, 68, 68, 0.06)',
              border: '2px dashed rgba(239, 68, 68, 0.35)',
              borderRadius: '24px',
              padding: '28px 20px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '36px' }}>⚠️</span>
            <p style={{ color: '#f87171', fontSize: '22px', fontWeight: 700, margin: '8px 0 0 0' }}>Cara Lama</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', margin: '6px 0 0 0' }}>Banyak mikir, minim aksi</p>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '28px', fontWeight: 900 }}>➔</div>
          <div
            style={{
              flex: 1,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '2px solid rgba(16, 185, 129, 0.6)',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)',
              borderRadius: '24px',
              padding: '28px 20px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '36px' }}>🎯</span>
            <p style={{ color: '#34d399', fontSize: '22px', fontWeight: 800, margin: '8px 0 0 0' }}>Pola Pikir Baru</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '17px', margin: '6px 0 0 0' }}>Fokus 1 langkah konsisten</p>
          </div>
        </div>
      ) : (
        /* Visual Diagram 3: 3-Step Milestone Roadmap */
        <div
          style={{
            transform: `scale(${diagramSpring})`,
            opacity: diagramSpring,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            maxWidth: '840px',
          }}
        >
          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '20px 14px', textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>STEP 01</span>
            <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0' }}>Sadar Pola</p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '20px' }}>➔</span>
          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '20px 14px', textAlign: 'center' }}>
            <span style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>STEP 02</span>
            <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0' }}>Ubah Respon</p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '20px' }}>➔</span>
          <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '20px', padding: '20px 14px', textAlign: 'center' }}>
            <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>STEP 03</span>
            <p style={{ color: '#34d399', fontSize: '18px', fontWeight: 800, margin: '6px 0 0 0' }}>Kuasai Diri</p>
          </div>
        </div>
      )}

      {body ? (
        <div
          style={{
            transform: `translateY(${interpolate(bodySpring, [0, 1], [40, 0])}px) scale(${bodySpring})`,
            opacity: bodySpring,
            marginTop: '36px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '24px 40px',
            maxWidth: '820px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '26px', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
            {body}
          </p>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

// --- FINAL SLIDE: OUTRO & CTA ---
function CTASlide({ slide, badgeText = '@adhlil.co' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const pulseScale = 1 + Math.sin(frame / 6) * 0.03;

  const quote = slide.body || slide.text || slide.title_part1 || 'Kuasai pikiranmu hari ini, atau ia yang akan menguasaimu.';

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
        Pengingat Harian
      </span>

      <h2
        style={{
          transform: `scale(${ctaSpring})`,
          opacity: ctaSpring,
          color: '#ffffff',
          fontSize: '60px',
          fontWeight: 800,
          textAlign: 'center',
          letterSpacing: '-2px',
          lineHeight: 1.25,
          maxWidth: '880px',
          margin: '0 0 50px 0',
        }}
      >
        {quote}
      </h2>

      {/* Aesthetic CTA Pill */}
      <div
        style={{
          transform: `scale(${ctaSpring * pulseScale})`,
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
        <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, letterSpacing: '1px' }}>
          SIMPAN & FOLLOW {badgeText}
        </span>
      </div>

      <p style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '22px', marginTop: '36px', letterSpacing: '1px' }}>
        Bagikan kepada teman yang sedang butuh insight ini.
      </p>
    </AbsoluteFill>
  );
}

// --- ROOT DYNAMIC COMPOSITION ---
export function DynamicMindsetVideo({
  slides = [],
  badgeText = '@adhlil.co',
  sceneDurationsInFrames = [],
}) {
  if (!slides || slides.length === 0) {
    return (
      <AbsoluteFill>
        <MindsetBackground />
      </AbsoluteFill>
    );
  }

  let accumulatedFrames = 0;

  return (
    <AbsoluteFill>
      <MindsetBackground />

      {slides.map((slide, idx) => {
        const duration = sceneDurationsInFrames[idx] || 150;
        const startFrom = accumulatedFrames;
        accumulatedFrames += duration;

        const isFirst = idx === 0;
        const isLast = idx === slides.length - 1;

        return (
          <Sequence key={idx} from={startFrom} durationInFrames={duration}>
            {isFirst ? (
              <HookSlide slide={slide} badgeText={badgeText} />
            ) : isLast ? (
              <CTASlide slide={slide} badgeText={badgeText} />
            ) : (
              <ValueSlide slide={slide} index={idx} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
