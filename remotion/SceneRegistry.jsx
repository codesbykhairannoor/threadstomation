/**
 * SceneRegistry.jsx — 30 reusable scene components for unlimited video variety
 * Gemini picks which component to use per scene via JSON spec.
 *
 * Categories:
 *  📊 Data Visualization: StatBig, StatCounter, Comparison2Col, BarChart, ProgressRing, Leaderboard, Timeline3Step
 *  📱 UI Mockups: PhoneNotification, ChatBubble, AppDashboard, FormFilled, CardStack, InboxZero
 *  💬 Typography: BigQuote, BoldClaim, ProblemSolution, ChecklistAnimate, WordReveal, Countdown
 *  🎭 Story: BeforeAfterSplit, CharacterArc, PainPointCard, BenefitCards, TestimonialBubble, MythVsFact
 *  🚀 CTA: CTAGradient, AffiliateEarnings, DiscountBadge, BrandSplash, FeatureList, SocialProof
 */

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// ─────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────

const FONTS = '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif';

function useEntrance(delay = 0, config = { damping: 15, stiffness: 75, mass: 0.7 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
}

function Card({ children, style = {}, dark = false }) {
  return (
    <div
      style={{
        background: dark ? 'rgba(255,255,255,0.06)' : '#ffffff',
        border: dark ? '1.5px solid rgba(255,255,255,0.12)' : 'none',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: dark ? 'none' : '0 20px 60px rgba(0,0,0,0.13)',
        width: '800px',
        fontFamily: FONTS,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children, color = '#6366f1', dark = false }) {
  return (
    <div
      style={{
        fontSize: '16px',
        fontWeight: 800,
        color,
        background: `${color}20`,
        padding: '6px 16px',
        borderRadius: '100px',
        display: 'inline-block',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: '18px',
        fontFamily: FONTS,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 📊 DATA VISUALIZATION (7)
// ─────────────────────────────────────────────────────────────

/**
 * StatBig — One huge number with label and context
 * data: { number, unit, label, context, color }
 */
export function StatBig({ data = {} }) {
  const s = useEntrance();
  const { number = '89K', unit = '', label = 'Pengguna Aktif', context = 'dan terus bertumbuh', color = '#6366f1' } = data;
  return (
    <Card>
      <Label color={color}>{label}</Label>
      <div
        style={{
          fontSize: '120px',
          fontWeight: 900,
          color,
          letterSpacing: '-4px',
          lineHeight: 1,
          opacity: s,
          transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`,
          fontFamily: FONTS,
        }}
      >
        {number}<span style={{ fontSize: '60px', color: `${color}99` }}>{unit}</span>
      </div>
      <div style={{ fontSize: '24px', color: '#64748b', marginTop: '16px', fontFamily: FONTS }}>{context}</div>
    </Card>
  );
}

/**
 * StatCounter — Animated count-up number
 * data: { from, to, unit, label, color, suffix }
 */
export function StatCounter({ data = {} }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { from = 0, to = 89400, unit = 'Rp', label = 'Komisi bulan ini', color = '#10b981', suffix = '' } = data;
  const progress = interpolate(frame, [5, durationInFrames - 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  const current = Math.round(from + (to - from) * eased);

  return (
    <Card>
      <Label color={color}>{label}</Label>
      <div
        style={{
          fontSize: '96px',
          fontWeight: 900,
          color,
          letterSpacing: '-3px',
          lineHeight: 1.1,
          fontFamily: FONTS,
        }}
      >
        {unit} {current.toLocaleString('id-ID')}{suffix}
      </div>
      <div
        style={{
          marginTop: '16px',
          height: '8px',
          background: '#f1f5f9',
          borderRadius: '100px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${eased * 100}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            borderRadius: '100px',
            boxShadow: `0 0 16px ${color}66`,
          }}
        />
      </div>
    </Card>
  );
}

/**
 * Comparison2Col — Side-by-side before/after or A vs B
 * data: { leftLabel, leftItems, rightLabel, rightItems, accent }
 */
export function Comparison2Col({ data = {} }) {
  const s = useEntrance();
  const { leftLabel = 'Tanpa Tranvas', leftItems = ['Scatter focus', 'Lupa tasks', 'Stres terus'], rightLabel = 'Dengan Tranvas', rightItems = ['All-in-one', 'Reminder otomatis', 'Lebih calm'], accent = '#6366f1' } = data;

  return (
    <Card style={{ padding: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {[
          { label: leftLabel, items: leftItems, icon: '✗', color: '#ef4444', bg: '#fef2f2' },
          { label: rightLabel, items: rightItems, icon: '✓', color: '#10b981', bg: '#f0fdf4' },
        ].map((col, ci) => (
          <div
            key={ci}
            style={{
              background: col.bg,
              borderRadius: '18px',
              padding: '24px',
              opacity: s,
              transform: `translateX(${interpolate(s, [0, 1], [ci === 0 ? -40 : 40, 0])}px)`,
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 900, color: col.color, marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: FONTS }}>{col.label}</div>
            {col.items.map((item, ii) => (
              <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontFamily: FONTS }}>
                <span style={{ color: col.color, fontWeight: 900, fontSize: '20px' }}>{col.icon}</span>
                <span style={{ fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * BarChart — Animated bar chart
 * data: { bars: [{label, value, max}], title, color }
 */
export function BarChart({ data = {} }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { bars = [{ label: 'Task Done', value: 85 }, { label: 'Habit Streak', value: 72 }, { label: 'Focus', value: 90 }], title = 'Produktivitas Minggu Ini', color = '#6366f1' } = data;
  const progress = interpolate(frame, [5, durationInFrames - 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const COLORS = ['#6366f1', '#10b981', '#f97316', '#38bdf8', '#a855f7', '#ef4444'];

  return (
    <Card>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', marginBottom: '24px', fontFamily: FONTS }}>{title}</div>
      {bars.map((bar, i) => {
        const barProgress = interpolate(progress, [i * 0.15, Math.min(i * 0.15 + 0.6, 1)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const barColor = COLORS[i % COLORS.length];
        const pct = bar.value || 70;
        return (
          <div key={i} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: FONTS }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#475569' }}>{bar.label}</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: barColor }}>{Math.round(pct * barProgress)}%</span>
            </div>
            <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct * barProgress}%`,
                  background: `linear-gradient(90deg, ${barColor}, ${barColor}99)`,
                  borderRadius: '100px',
                  boxShadow: `0 0 12px ${barColor}55`,
                }}
              />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/**
 * ProgressRing — Donut/ring progress indicator
 * data: { percentage, label, centerText, color }
 */
export function ProgressRing({ data = {} }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { percentage = 87, label = 'Focus Score', centerText = 'Excellent', color = '#10b981' } = data;
  const progress = interpolate(frame, [5, durationInFrames - 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const currentPct = Math.round(percentage * progress);
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * currentPct) / 100;

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Label color={color}>{label}</Label>
      <div style={{ position: 'relative', width: '280px', height: '280px' }}>
        <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="140" cy="140" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="20" />
          <circle
            cx="140" cy="140" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS,
          }}
        >
          <div style={{ fontSize: '56px', fontWeight: 900, color, lineHeight: 1 }}>{currentPct}%</div>
          <div style={{ fontSize: '18px', color: '#94a3b8', fontWeight: 600 }}>{centerText}</div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Leaderboard — Top N ranked list
 * data: { title, items: [{name, value, unit}], color }
 */
export function Leaderboard({ data = {} }) {
  const { title = 'Top Habit Streaks', items = [{ name: 'Meditasi', value: 45, unit: 'hari' }, { name: 'Olahraga', value: 38, unit: 'hari' }, { name: 'Journaling', value: 29, unit: 'hari' }], color = '#f97316' } = data;
  const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32', '#64748b', '#64748b'];

  return (
    <Card>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', marginBottom: '24px', fontFamily: FONTS }}>{title}</div>
      {items.slice(0, 5).map((item, i) => {
        const s = useEntrance(i * 5);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              padding: '16px',
              background: i === 0 ? '#fef9ec' : '#f8fafc',
              borderRadius: '16px',
              marginBottom: '10px',
              opacity: s,
              transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
              border: i === 0 ? '1.5px solid #f59e0b44' : 'none',
            }}
          >
            <span style={{ fontSize: '32px' }}>{MEDALS[i]}</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', flex: 1, fontFamily: FONTS }}>{item.name}</span>
            <span style={{ fontSize: '22px', fontWeight: 900, color: MEDAL_COLORS[i], fontFamily: FONTS }}>{item.value} <span style={{ fontSize: '16px', color: '#94a3b8' }}>{item.unit}</span></span>
          </div>
        );
      })}
    </Card>
  );
}

/**
 * Timeline3Step — 3-step process visualization
 * data: { steps: [{icon, title, desc}], color }
 */
export function Timeline3Step({ data = {} }) {
  const { steps = [{ icon: '🎯', title: 'Set Target', desc: 'Tentukan goals yang realistis' }, { icon: '📋', title: 'Track Daily', desc: 'Catat progress setiap hari' }, { icon: '🚀', title: 'Level Up', desc: 'Lihat hasilnya dalam 30 hari' }], color = '#6366f1' } = data;

  return (
    <Card>
      {steps.slice(0, 4).map((step, i) => {
        const s = useEntrance(i * 6 + 4);
        const isLast = i === steps.length - 1;
        const itemY = interpolate(s, [0, 1], [22, 0]);
        const itemScale = interpolate(s, [0, 1], [0.94, 1]);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '20px',
              opacity: s,
              transform: `translateY(${itemY}px) scale(${itemScale})`,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${color}, ${color}88)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  flexShrink: 0,
                  boxShadow: `0 4px 20px ${color}44`,
                }}
              >
                {step.icon}
              </div>
              {!isLast && (
                <div style={{ width: '2px', flex: 1, background: `${color}30`, margin: '6px 0' }} />
              )}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : '24px' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', fontFamily: FONTS }}>{step.title}</div>
              <div style={{ fontSize: '17px', color: '#64748b', marginTop: '4px', fontFamily: FONTS }}>{step.desc}</div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// 📱 UI MOCKUPS (6)
// ─────────────────────────────────────────────────────────────

/**
 * PhoneNotification — Android-style lock screen notification
 * data: { appName, appIcon, title, body, time, color }
 */
export function PhoneNotification({ data = {} }) {
  const s = useEntrance(8);
  const { appName = 'Tranvas', appIcon = '⚡', title = 'Task selesai!', body = 'Kamu menyelesaikan 5 task hari ini 🎉', time = 'baru saja', color = '#6366f1' } = data;

  return (
    <div style={{ width: '800px' }}>
      {/* Phone frame */}
      <div
        style={{
          width: '420px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: '44px',
          padding: '50px 24px 40px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', padding: '0 8px' }}>
          <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, fontFamily: FONTS }}>07:32</span>
          <span style={{ color: '#ffffff', fontSize: '14px', fontFamily: FONTS }}>●●● ▐▌ 🔋</span>
        </div>
        {/* Notification card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '18px 20px',
            opacity: s,
            transform: `translateY(${interpolate(s, [0, 1], [-30, 0])}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div
              style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '16px',
              }}
            >
              {appIcon}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 700, fontFamily: FONTS, textTransform: 'uppercase', letterSpacing: '1px' }}>{appName}</span>
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontFamily: FONTS }}>{time}</span>
          </div>
          <div style={{ color: '#ffffff', fontSize: '17px', fontWeight: 800, fontFamily: FONTS }}>{title}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', marginTop: '4px', fontFamily: FONTS }}>{body}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * ChatBubble — Conversation style visualization
 * data: { messages: [{sender, text, side}], color }
 */
export function ChatBubble({ data = {} }) {
  const frame = useCurrentFrame();
  const { messages = [{ sender: 'Reza', text: 'Eh gimana progress projectnya?', side: 'left' }, { sender: 'Kamu', text: 'Udah selesai semua, thanks Tranvas! 🚀', side: 'right' }, { sender: 'Reza', text: 'Wah cepet banget, gimana caranya?', side: 'left' }], color = '#6366f1' } = data;

  return (
    <div style={{ width: '800px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {messages.slice(0, 5).map((msg, i) => {
        const appear = interpolate(frame, [i * 8, i * 8 + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const isRight = msg.side === 'right';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: isRight ? 'flex-end' : 'flex-start',
              opacity: appear,
              transform: `translateY(${interpolate(appear, [0, 1], [20, 0])}px)`,
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                background: isRight ? color : '#ffffff',
                color: isRight ? '#ffffff' : '#1e293b',
                padding: '14px 20px',
                borderRadius: isRight ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                boxShadow: isRight ? `0 4px 20px ${color}44` : '0 4px 20px rgba(0,0,0,0.08)',
                fontSize: '19px',
                fontWeight: 600,
                fontFamily: FONTS,
              }}
            >
              {msg.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * AppDashboard — Generic app dashboard card
 * data: { appName, stats: [{label, value, icon, color}] }
 */
export function AppDashboard({ data = {} }) {
  const { appName = 'Tranvas', stats = [{ label: 'Tasks', value: '12/14', icon: '⚡', color: '#6366f1' }, { label: 'Habits', value: '21 hari', icon: '🔥', color: '#f97316' }, { label: 'Notes', value: '47', icon: '🧠', color: '#10b981' }, { label: 'Focus', value: '3.5 jam', icon: '🎯', color: '#38bdf8' }] } = data;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 900, fontFamily: FONTS }}>T</div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', fontFamily: FONTS }}>{appName}</div>
          <div style={{ fontSize: '14px', color: '#64748b', fontFamily: FONTS }}>Hari ini • Semua sinkron ✓</div>
        </div>
        <div style={{ marginLeft: 'auto', background: '#dcfce7', color: '#16a34a', padding: '8px 18px', borderRadius: '100px', fontSize: '15px', fontWeight: 800, fontFamily: FONTS }}>● Online</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {stats.slice(0, 4).map((s, i) => {
          const appear = useEntrance(i * 5);
          return (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '18px', padding: '20px', opacity: appear, transform: `translateY(${interpolate(appear, [0, 1], [20, 0])}px)` }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600, fontFamily: FONTS }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b', marginTop: '4px', fontFamily: FONTS }}>{s.value}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * FormFilled — Animated form completion
 * data: { fields: [{label, value}], title, color }
 */
export function FormFilled({ data = {} }) {
  const frame = useCurrentFrame();
  const { fields = [{ label: 'Nama', value: 'Adhlil Khairi' }, { label: 'Goal', value: 'Selesaikan 3 proyek bulan ini' }, { label: 'Prioritas', value: 'High ⚡' }], title = 'Daily Planning', color = '#6366f1' } = data;

  return (
    <Card>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', marginBottom: '24px', fontFamily: FONTS }}>{title}</div>
      {fields.slice(0, 5).map((field, i) => {
        const reveal = interpolate(frame, [i * 10 + 5, i * 10 + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div key={i} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: FONTS }}>{field.label}</div>
            <div
              style={{
                background: '#f8fafc',
                border: `1.5px solid ${reveal > 0.5 ? color : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '14px 18px',
                fontSize: '19px',
                fontWeight: 700,
                color: '#1e293b',
                opacity: reveal,
                fontFamily: FONTS,
                boxShadow: reveal > 0.5 ? `0 0 0 3px ${color}18` : 'none',
              }}
            >
              {field.value}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/**
 * CardStack — Stacked info cards that fan out
 * data: { cards: [{emoji, title, sub}], color }
 */
export function CardStack({ data = {} }) {
  const s = useEntrance();
  const { cards = [{ emoji: '🧠', title: 'Deep Work', sub: '2 jam tanpa distraksi' }, { emoji: '📋', title: 'Task Clear', sub: '14 task selesai hari ini' }, { emoji: '🔥', title: 'Streak On', sub: '21 hari berturut-turut' }], color = '#6366f1' } = data;
  const COLORS = [color, '#10b981', '#f97316'];

  return (
    <div style={{ width: '800px', position: 'relative', height: '400px' }}>
      {cards.slice(0, 3).map((card, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '680px',
            left: '60px',
            top: `${i * 22}px`,
            background: COLORS[i] || color,
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            transform: `rotate(${(i - 1) * 3}deg) scale(${1 - i * 0.03}) translateY(${interpolate(s, [0, 1], [60 * (i + 1), 0])}px)`,
            opacity: interpolate(s, [0, 0.5 + i * 0.1], [0, 1], { extrapolateRight: 'clamp' }),
            zIndex: 3 - i,
          }}
        >
          <div style={{ fontSize: '42px', marginBottom: '10px' }}>{card.emoji}</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', fontFamily: FONTS }}>{card.title}</div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.75)', fontFamily: FONTS }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * InboxZero — Inbox cleared animation
 * data: { beforeCount, appName, color }
 */
export function InboxZero({ data = {} }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { beforeCount = 47, appName = 'Tasks', color = '#10b981' } = data;
  const progress = interpolate(frame, [5, durationInFrames * 0.7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const remaining = Math.max(0, Math.round(beforeCount * (1 - progress)));
  const done = progress >= 0.95;

  return (
    <Card style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>{done ? '🎉' : '📋'}</div>
      <div style={{ fontSize: '100px', fontWeight: 900, color: done ? color : '#1e293b', letterSpacing: '-3px', lineHeight: 1, fontFamily: FONTS }}>{remaining}</div>
      <div style={{ fontSize: '22px', color: '#64748b', marginTop: '8px', fontFamily: FONTS }}>{done ? `${appName} Clear! Semua selesai 🚀` : `${appName} tersisa`}</div>
      <div style={{ marginTop: '20px', height: '10px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: color, borderRadius: '100px', boxShadow: `0 0 16px ${color}66` }} />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// 💬 TYPOGRAPHY (6)
// ─────────────────────────────────────────────────────────────

/**
 * BigQuote — Large centered inspirational/factual quote
 * data: { quote, source, color }
 */
export function BigQuote({ data = {} }) {
  const s = useEntrance();
  const { quote = 'Produktif bukan soal sibuk. Tapi soal selesai.', source = '— Tranvas', color = '#6366f1' } = data;

  return (
    <div
      style={{
        width: '800px',
        textAlign: 'center',
        opacity: s,
        transform: `scale(${interpolate(s, [0, 1], [0.92, 1])})`,
        fontFamily: FONTS,
      }}
    >
      <div style={{ fontSize: '52px', color: color, marginBottom: '16px', lineHeight: 1 }}>"</div>
      <div style={{ fontSize: '46px', fontWeight: 900, color: '#1e293b', lineHeight: 1.3, letterSpacing: '-1px' }}>{quote}</div>
      <div style={{ fontSize: '20px', color: '#94a3b8', marginTop: '24px', fontWeight: 700 }}>{source}</div>
    </div>
  );
}

/**
 * BoldClaim — Single powerful centered claim
 * data: { line1, line2, accent, color }
 */
export function BoldClaim({ data = {} }) {
  const s = useEntrance();
  const s2 = useEntrance(10);
  const { line1 = 'Bukan soal punya waktu.', line2 = 'Tapi soal mengelolanya.', accent = '#6366f1' } = data;

  return (
    <div style={{ width: '800px', textAlign: 'center', fontFamily: FONTS }}>
      <div style={{ fontSize: '52px', fontWeight: 900, color: '#1e293b', lineHeight: 1.2, letterSpacing: '-1px', opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` }}>{line1}</div>
      <div style={{ fontSize: '52px', fontWeight: 900, color: accent, lineHeight: 1.2, letterSpacing: '-1px', marginTop: '8px', opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [30, 0])}px)` }}>{line2}</div>
    </div>
  );
}

/**
 * ProblemSolution — Problem X → Solution ✓ reveal
 * data: { problem, solution, color }
 */
export function ProblemSolution({ data = {} }) {
  const frame = useCurrentFrame();
  const { problem = 'Setiap hari buka laptop, task numpuk.', solution = 'Tranvas nyatuin semua. Tinggal eksekusi.', color = '#10b981' } = data;
  const showSolution = frame > 20;
  const solutionReveal = interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: '800px', fontFamily: FONTS }}>
      {/* Problem */}
      <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', marginBottom: '10px', letterSpacing: '2px' }}>MASALAH ✗</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{problem}</div>
      </div>
      {/* Solution */}
      {showSolution && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '20px', padding: '28px', opacity: solutionReveal, transform: `translateY(${interpolate(solutionReveal, [0, 1], [30, 0])}px)` }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginBottom: '10px', letterSpacing: '2px' }}>SOLUSI ✓</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{solution}</div>
        </div>
      )}
    </div>
  );
}

/**
 * ChecklistAnimate — Items check one by one
 * data: { items: [string], color, title }
 */
export function ChecklistAnimate({ data = {} }) {
  const frame = useCurrentFrame();
  const { items = ['Set 3 priority tasks pagi hari', 'Block 2 jam deep work', 'Review progress jam 5 sore', 'Rest dan recharge'], color = '#10b981', title = 'Rutinitas Produktif Harian' } = data;

  return (
    <Card>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', marginBottom: '20px', fontFamily: FONTS }}>{title}</div>
      {items.slice(0, 6).map((item, i) => {
        const itemText = typeof item === 'string' ? item : (item.text || item.label || item.title || '');
        const checked = frame > i * 12 + 8;
        const checkReveal = interpolate(frame, [i * 12 + 5, i * 12 + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', opacity: interpolate(frame, [i * 12, i * 12 + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
            <div
              style={{
                width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                background: checked ? color : 'transparent',
                border: checked ? 'none' : `2px solid #cbd5e1`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                opacity: checkReveal,
              }}
            >
              {checked && <span style={{ color: '#fff', fontSize: '18px', fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: '20px', fontWeight: 600, color: checked ? '#1e293b' : '#94a3b8', textDecoration: checked ? 'none' : 'none', fontFamily: FONTS }}>{itemText}</span>
          </div>
        );
      })}
    </Card>
  );
}

/**
 * WordReveal — Words appear one by one
 * data: { words: [string], color, size }
 */
export function WordReveal({ data = {} }) {
  const frame = useCurrentFrame();
  const { words = ['Fokus.', 'Selesai.', 'Produktif.'], color = '#6366f1', size = 80 } = data;

  return (
    <div style={{ width: '800px', textAlign: 'center', fontFamily: FONTS }}>
      {words.slice(0, 4).map((word, i) => {
        const appear = interpolate(frame, [i * 15 + 5, i * 15 + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div
            key={i}
            style={{
              fontSize: `${size}px`,
              fontWeight: 900,
              color: i % 2 === 0 ? '#1e293b' : color,
              opacity: appear,
              transform: `translateY(${interpolate(appear, [0, 1], [40, 0])}px)`,
              lineHeight: 1.2,
              letterSpacing: '-2px',
            }}
          >
            {word}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Countdown — Visual countdown timer
 * data: { from, label, color, unit }
 */
export function Countdown({ data = {} }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { from = 30, label = 'Hari sampai deadline', color = '#ef4444', unit = 'hari' } = data;
  const remaining = Math.max(0, Math.round(from - (from * frame) / durationInFrames));
  const pulse = 1 + Math.sin(frame * 0.3) * 0.04;

  return (
    <div style={{ width: '800px', textAlign: 'center', fontFamily: FONTS }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '20px' }}>{label}</div>
      <div style={{ fontSize: '180px', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-6px', transform: `scale(${pulse})` }}>
        {remaining}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: `${color}88`, marginTop: '8px' }}>{unit}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🎭 STORY / NARRATIVE (6)
// ─────────────────────────────────────────────────────────────

/**
 * BeforeAfterSplit — Two panels side by side
 * data: { before: {title, items}, after: {title, items} }
 */
export function BeforeAfterSplit({ data = {} }) {
  const s = useEntrance();
  const { before = { title: 'Sebelum', items: ['7 app terbuka', 'Task berantakan', 'Deadline missed'] }, after = { title: 'Sesudah', items: ['1 app, semua ada', 'Task clear', 'Deadline on point'] } } = data;

  return (
    <div style={{ width: '800px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontFamily: FONTS }}>
      {[before, after].map((panel, pi) => (
        <div
          key={pi}
          style={{
            background: pi === 0 ? '#0d1117' : '#f0fdf4',
            border: pi === 0 ? '1.5px solid rgba(239,68,68,0.3)' : '1.5px solid #bbf7d0',
            borderRadius: '20px',
            padding: '24px',
            opacity: s,
            transform: `translateX(${interpolate(s, [0, 1], [pi === 0 ? -50 : 50, 0])}px)`,
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 900, color: pi === 0 ? '#ef4444' : '#10b981', letterSpacing: '2px', marginBottom: '16px', textTransform: 'uppercase' }}>{panel.title}</div>
          {panel.items.map((item, ii) => (
            <div key={ii} style={{ fontSize: '19px', fontWeight: 600, color: pi === 0 ? 'rgba(255,255,255,0.8)' : '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: pi === 0 ? '#ef4444' : '#10b981', fontWeight: 900 }}>{pi === 0 ? '✗' : '✓'}</span>
              {typeof item === 'string' ? item : (item.text || item.label || '')}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * CharacterArc — Emoji/icon progression story
 * data: { states: [{emoji, label}], color }
 */
export function CharacterArc({ data = {} }) {
  const frame = useCurrentFrame();
  const { states = [{ emoji: '😩', label: 'Overwhelmed' }, { emoji: '📋', label: 'Organized' }, { emoji: '🚀', label: 'Crushing it' }], color = '#6366f1' } = data;

  return (
    <div style={{ width: '800px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', fontFamily: FONTS }}>
      {states.slice(0, 4).map((state, i) => {
        const appear = interpolate(frame, [i * 15, i * 15 + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const isLast = i === states.length - 1;
        return (
          <React.Fragment key={i}>
            <div style={{ textAlign: 'center', opacity: appear, transform: `scale(${interpolate(appear, [0, 1], [0.5, 1])})` }}>
              <div style={{ fontSize: '72px' }}>{state.emoji}</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#64748b', marginTop: '8px' }}>{state.label}</div>
            </div>
            {!isLast && (
              <div style={{ fontSize: '36px', color: `${color}88`, opacity: appear }}>→</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * PainPointCard — Highlighted pain with emphasis
 * data: { pain, stat, context, color }
 */
export function PainPointCard({ data = {} }) {
  const s = useEntrance();
  const { pain = 'Rata-rata orang kehilangan 2.1 jam per hari karena task switching.', stat = '2.1 jam', context = 'Per hari. Setiap hari. Bertahun-tahun.', color = '#ef4444' } = data;

  return (
    <div
      style={{
        width: '800px',
        background: `linear-gradient(135deg, ${color}18, ${color}08)`,
        border: `2px solid ${color}44`,
        borderRadius: '24px',
        padding: '36px',
        opacity: s,
        transform: `scale(${interpolate(s, [0, 1], [0.94, 1])})`,
        fontFamily: FONTS,
      }}
    >
      <div style={{ fontSize: '80px', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-3px' }}>{stat}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginTop: '16px', lineHeight: 1.4 }}>{pain}</div>
      <div style={{ fontSize: '18px', color: color, fontWeight: 800, marginTop: '16px' }}>{context}</div>
    </div>
  );
}

/**
 * BenefitCards — 3 benefit cards pop in
 * data: { benefits: [{icon, title, desc}], color }
 */
export function BenefitCards({ data = {} }) {
  const { benefits = [{ icon: '⚡', title: 'Hemat 2 jam/hari', desc: 'Tidak perlu buka-tutup banyak app' }, { icon: '🧠', title: 'Zero mental overhead', desc: 'Semua tercatat otomatis' }, { icon: '🎯', title: 'Goal clarity', desc: 'Prioritas jelas setiap pagi' }], color = '#6366f1' } = data;

  return (
    <div style={{ width: '800px', display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: FONTS }}>
      {benefits.slice(0, 4).map((b, i) => {
        const s = useEntrance(i * 8);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              background: '#ffffff',
              borderRadius: '18px',
              padding: '22px 24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              opacity: s,
              transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
              border: `1.5px solid ${color}18`,
            }}
          >
            <div
              style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: `linear-gradient(135deg, ${color}, ${color}88)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', flexShrink: 0,
              }}
            >
              {b.icon}
            </div>
            <div>
              <div style={{ fontSize: '21px', fontWeight: 900, color: '#1e293b' }}>{b.title}</div>
              <div style={{ fontSize: '17px', color: '#64748b', marginTop: '4px' }}>{b.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * TestimonialBubble — User testimonial card
 * data: { quote, name, handle, avatar, color }
 */
export function TestimonialBubble({ data = {} }) {
  const s = useEntrance();
  const { quote = '"Habis pakai Tranvas, deadline gue ga pernah miss lagi. Game changer banget!"', name = 'Rizky A.', handle = '@rizky_dev', color = '#6366f1' } = data;

  return (
    <div style={{ width: '800px', opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.94, 1])})`, fontFamily: FONTS }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '36px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', position: 'relative' }}>
        <div style={{ fontSize: '60px', color: color, position: 'absolute', top: '20px', left: '32px', lineHeight: 1 }}>"</div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#1e293b', lineHeight: 1.5, paddingTop: '20px' }}>{quote}</div>
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>👤</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>{name}</div>
            <div style={{ fontSize: '15px', color: '#94a3b8' }}>{handle}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '24px' }}>⭐⭐⭐⭐⭐</div>
        </div>
      </div>
    </div>
  );
}

/**
 * MythVsFact — Misconception vs reality reveal
 * data: { myth, fact, color }
 */
export function MythVsFact({ data = {} }) {
  const frame = useCurrentFrame();
  const { myth = 'Produktif = kerja makin lama.', fact = 'Produktif = selesai makin cepat dengan energi tersisa.', color = '#10b981' } = data;
  const showFact = frame > 18;
  const factReveal = interpolate(frame, [18, 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: '800px', fontFamily: FONTS }}>
      <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444', letterSpacing: '2px', marginBottom: '10px' }}>❌ MITOS</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', textDecoration: showFact ? 'line-through' : 'none', color: showFact ? '#94a3b8' : '#1e293b' }}>{myth}</div>
      </div>
      {showFact && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '20px', padding: '28px', opacity: factReveal, transform: `translateY(${interpolate(factReveal, [0, 1], [30, 0])}px)` }}>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981', letterSpacing: '2px', marginBottom: '10px' }}>✅ FAKTA</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{fact}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🚀 CTA & BRANDING (5)
// ─────────────────────────────────────────────────────────────

/**
 * CTAGradient — Gradient CTA screen
 * data: { headline, sub, cta, gradient, emoji }
 */
export function CTAGradient({ data = {} }) {
  const s = useEntrance();
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.15) * 0.025;
  const { headline = 'Tranvas', sub = 'All-in-One Productivity', cta = 'Coba Gratis → tranvas.com', emoji = '🚀', gradient = '135deg, #6366f1, #a855f7' } = data;

  return (
    <div style={{ width: '800px', background: `linear-gradient(${gradient})`, borderRadius: '28px', padding: '52px 40px', textAlign: 'center', boxShadow: '0 30px 80px rgba(99,102,241,0.35)', opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.92, 1]) * pulse})`, fontFamily: FONTS }}>
      <div style={{ fontSize: '68px', marginBottom: '18px' }}>{emoji}</div>
      <h2 style={{ color: '#ffffff', fontSize: '52px', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-2px' }}>{headline}</h2>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '22px', margin: '0 0 36px 0' }}>{sub}</p>
      <div style={{ background: '#ffffff', color: '#6366f1', fontSize: '22px', fontWeight: 900, padding: '20px 40px', borderRadius: '100px', display: 'inline-block', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>{cta}</div>
    </div>
  );
}

/**
 * AffiliateEarnings — Animated earnings counter for affiliate pitch
 * data: { amount, referrals, rate, label, color }
 */
export function AffiliateEarnings({ data = {} }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { amount = 890000, referrals = 8, rate = '60%', label = 'Komisi Afiliasi Tranvas', color = '#10b981' } = data;
  const progress = interpolate(frame, [5, durationInFrames - 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const eased = 1 - Math.pow(1 - progress, 3);
  const current = Math.round(amount * eased);

  return (
    <Card>
      <Label color={color}>{label}</Label>
      <div style={{ fontSize: '80px', fontWeight: 900, color, letterSpacing: '-3px', lineHeight: 1, fontFamily: FONTS }}>Rp {current.toLocaleString('id-ID')}</div>
      <div style={{ fontSize: '18px', color: '#64748b', marginTop: '8px', fontFamily: FONTS }}>bulan ini • recurring</div>
      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden', margin: '20px 0' }}>
        <div style={{ height: '100%', width: `${eased * 75}%`, background: `linear-gradient(90deg, ${color}, #6366f1)`, borderRadius: '100px', boxShadow: `0 0 16px ${color}66` }} />
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, background: '#f8fafc', borderRadius: '14px', padding: '16px', textAlign: 'center', fontFamily: FONTS }}>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#1e293b' }}>{referrals}</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Referral Aktif</div>
        </div>
        <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '14px', padding: '16px', textAlign: 'center', fontFamily: FONTS }}>
          <div style={{ fontSize: '30px', fontWeight: 900, color }}>Rp 89K</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Per Referral/bln</div>
        </div>
        <div style={{ flex: 1, background: '#ede9fe', borderRadius: '14px', padding: '16px', textAlign: 'center', fontFamily: FONTS }}>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#6366f1' }}>{rate}</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Komisi Rate</div>
        </div>
      </div>
    </Card>
  );
}

/**
 * DiscountBadge — Promo badge with urgency
 * data: { discount, originalPrice, newPrice, deadline, color }
 */
export function DiscountBadge({ data = {} }) {
  const s = useEntrance();
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.2) * 0.03;
  const { discount = '50%', originalPrice = 'Rp 149.000', newPrice = 'Rp 74.500', deadline = 'Hari ini saja!', color = '#ef4444' } = data;

  return (
    <div style={{ width: '800px', textAlign: 'center', fontFamily: FONTS, opacity: s }}>
      <div style={{ display: 'inline-block', background: color, color: '#fff', fontSize: '90px', fontWeight: 900, padding: '24px 60px', borderRadius: '24px', letterSpacing: '-3px', transform: `scale(${pulse})`, boxShadow: `0 20px 60px ${color}55` }}>
        -{discount}
      </div>
      <div style={{ marginTop: '24px' }}>
        <span style={{ fontSize: '24px', color: '#94a3b8', textDecoration: 'line-through', marginRight: '16px', fontFamily: FONTS }}>{originalPrice}</span>
        <span style={{ fontSize: '48px', fontWeight: 900, color: '#1e293b', fontFamily: FONTS }}>{newPrice}</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: color, marginTop: '12px', background: `${color}15`, padding: '12px 28px', borderRadius: '100px', display: 'inline-block' }}>{deadline}</div>
    </div>
  );
}

/**
 * BrandSplash — Full brand logo screen
 * data: { brand, tagline, handle, color, gradient }
 */
export function BrandSplash({ data = {} }) {
  const s = useEntrance();
  const { brand = 'Tranvas', tagline = 'Your Life Operating System', handle = '@adhlil.co', color = '#6366f1', gradient = '135deg, #6366f1 0%, #a855f7 100%' } = data;

  return (
    <div style={{ width: '800px', textAlign: 'center', opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`, fontFamily: FONTS }}>
      <div style={{ width: '110px', height: '110px', borderRadius: '32px', background: `linear-gradient(${gradient})`, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', fontWeight: 900, color: '#fff', boxShadow: `0 20px 60px ${color}55` }}>T</div>
      <div style={{ fontSize: '64px', fontWeight: 900, color: '#1e293b', letterSpacing: '-2px' }}>{brand}</div>
      <div style={{ fontSize: '22px', color: '#64748b', marginTop: '8px' }}>{tagline}</div>
      <div style={{ marginTop: '32px', display: 'inline-block', background: `${color}15`, color, padding: '12px 28px', borderRadius: '100px', fontSize: '18px', fontWeight: 800 }}>{handle} • Link di bio</div>
    </div>
  );
}

/**
 * FeatureList — Animated feature highlights
 * data: { features: [{icon, text}], title, color }
 */
export function FeatureList({ data = {} }) {
  const { features = [{ icon: '📋', text: 'Task manager terintegrasi' }, { icon: '🔥', text: 'Habit tracker dengan streak' }, { icon: '🧠', text: 'Smart notes & journal' }, { icon: '📅', text: 'Calendar & schedule sync' }, { icon: '📊', text: 'Analytics produktivitas' }], title = 'Semua ada di Tranvas:', color = '#6366f1' } = data;

  return (
    <Card>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', marginBottom: '20px', fontFamily: FONTS }}>{title}</div>
      {features.slice(0, 6).map((f, i) => {
        const s = useEntrance(i * 6);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: i < features.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: s }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{f.icon}</div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', fontFamily: FONTS }}>{f.text}</span>
            <div style={{ marginLeft: 'auto', width: '10px', height: '10px', borderRadius: '50%', background: color }} />
          </div>
        );
      })}
    </Card>
  );
}

/**
 * SocialProof — Numbers/credibility social proof
 * data: { stats: [{number, label}], color }
 */
export function SocialProof({ data = {} }) {
  const s = useEntrance();
  const { stats = [{ number: '12K+', label: 'Pengguna Aktif' }, { number: '4.9★', label: 'Rating App' }, { number: '89%', label: 'Lanjut Langganan' }], color = '#6366f1' } = data;

  return (
    <div style={{ width: '800px', display: 'flex', gap: '16px', fontFamily: FONTS }}>
      {stats.slice(0, 4).map((stat, i) => {
        const statSpring = useEntrance(i * 8);
        return (
          <div key={i} style={{ flex: 1, background: '#ffffff', borderRadius: '20px', padding: '28px 20px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', opacity: statSpring, transform: `translateY(${interpolate(statSpring, [0, 1], [30, 0])}px)` }}>
            <div style={{ fontSize: '48px', fontWeight: 900, color, letterSpacing: '-1px' }}>{stat.number}</div>
            <div style={{ fontSize: '16px', color: '#64748b', fontWeight: 700, marginTop: '6px' }}>{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCENE REGISTRY MAP — Gemini picks component by key string
// ─────────────────────────────────────────────────────────────
export const SCENE_REGISTRY = {
  // 📊 Data Visualization
  stat_big:          StatBig,
  stat_counter:      StatCounter,
  comparison_2col:   Comparison2Col,
  bar_chart:         BarChart,
  progress_ring:     ProgressRing,
  leaderboard:       Leaderboard,
  timeline_3step:    Timeline3Step,

  // 📱 UI Mockups
  phone_notification: PhoneNotification,
  chat_bubble:        ChatBubble,
  app_dashboard:      AppDashboard,
  form_filled:        FormFilled,
  card_stack:         CardStack,
  inbox_zero:         InboxZero,

  // 💬 Typography
  big_quote:          BigQuote,
  bold_claim:         BoldClaim,
  problem_solution:   ProblemSolution,
  checklist_animate:  ChecklistAnimate,
  word_reveal:        WordReveal,
  countdown:          Countdown,

  // 🎭 Story
  before_after_split: BeforeAfterSplit,
  character_arc:      CharacterArc,
  pain_point_card:    PainPointCard,
  benefit_cards:      BenefitCards,
  testimonial_bubble: TestimonialBubble,
  myth_vs_fact:       MythVsFact,

  // 🚀 CTA & Branding
  cta_gradient:       CTAGradient,
  affiliate_earnings: AffiliateEarnings,
  discount_badge:     DiscountBadge,
  brand_splash:       BrandSplash,
  feature_list:       FeatureList,
  social_proof:       SocialProof,
};

/**
 * DynamicScene — Resolves component from registry by key
 * Usage: <DynamicScene component="stat_counter" data={{ to: 89400 }} />
 */
export function DynamicScene({ component, data = {} }) {
  const Component = SCENE_REGISTRY[component];
  if (!Component) {
    return (
      <div style={{ width: '800px', color: '#ef4444', fontFamily: FONTS, fontSize: '20px', padding: '20px', border: '2px dashed #ef4444', borderRadius: '16px' }}>
        ⚠️ Unknown component: "{component}"
      </div>
    );
  }
  return <Component data={data} />;
}
