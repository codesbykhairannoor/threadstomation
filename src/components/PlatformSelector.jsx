import React, { useState } from 'react';

const PlatformSelector = ({ onSelect }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const platforms = [
    {
      id: 'threads',
      icon: '🧵',
      name: 'Threads Publisher',
      description: 'The ultimate SaaS platform to automate AI-generated posts on Threads. Smart scheduling, multi-account, and intelligent randomizer.',
      features: ['AI Content Generation', 'Multi-Account Support', 'Smart Scheduling', 'Auto Token Refresh'],
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      glowColor: 'rgba(0, 242, 254, 0.25)',
      available: true,
    },
    {
      id: 'tiktok',
      icon: '🎵',
      name: 'TikTok Creator Suite',
      description: 'Professional SaaS tool to auto-publish AI-generated carousels to TikTok. Helps creators schedule and scale their content strategy.',
      features: ['AI Carousel Studio', 'Auto Scheduling', 'Campaign Management', 'Smart Slide Design'],
      gradient: 'linear-gradient(135deg, #f7971e 0%, #ff0050 100%)',
      glowColor: 'rgba(255, 0, 80, 0.2)',
      available: true,
    },
    {
      id: 'instagram',
      icon: '📸',
      name: 'Instagram Planner',
      description: 'Comprehensive platform to schedule and post AI-generated carousels to Instagram. Built for agencies and creators.',
      features: ['AI Carousel Studio', 'Auto Scheduling', 'Multi-Account', 'Smart Slide Design'],
      gradient: 'linear-gradient(135deg, #f953c6 0%, #ffd200 100%)',
      glowColor: 'rgba(249, 83, 198, 0.25)',
      available: true,
    },
    {
      id: 'facebook',
      icon: '📘',
      name: 'Facebook Automation',
      description: 'Automatically post AI-generated multi-photo updates to your Facebook Pages. Keep your community engaged 24/7.',
      features: ['Page Management', 'Multi-Photo Posts', 'AI Content Engine', 'Chaos Scheduler'],
      gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
      glowColor: 'rgba(0, 114, 255, 0.25)',
      available: true,
    },
  ];

  return (
    <div className="platform-selector-page">
      {/* Animated BG blobs */}
      <div className="ps-blob ps-blob-1" />
      <div className="ps-blob ps-blob-2" />

      <div className="ps-content">
        <div className="ps-header">
          <div className="ps-logo">🚀</div>
          <h1 className="ps-title">Threadstomation</h1>
          <p className="ps-subtitle">Choose your automation platform to get started</p>
        </div>

        {/* Cards */}
        <div className="ps-cards">
          {platforms.map((p) => (
            <div
              key={p.id}
              className={`ps-card ${!p.available ? 'ps-card-locked' : ''} ${hoveredCard === p.id ? 'ps-card-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard(p.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => p.available && onSelect(p.id)}
              style={{ '--card-glow': p.glowColor }}
            >
              {!p.available && (
                <div className="ps-coming-soon-badge">Coming Soon</div>
              )}

              <div className="ps-card-icon" style={{ background: p.gradient }}>
                <span>{p.icon}</span>
              </div>

              <h2 className="ps-card-name">{p.name}</h2>
              <p className="ps-card-desc">{p.description}</p>

              <div className="ps-features">
                {p.features.map((f) => (
                  <div key={f} className="ps-feature-chip">
                    <span className="ps-feature-dot" style={{ background: p.available ? p.gradient : 'rgba(255,255,255,0.2)' }} />
                    {f}
                  </div>
                ))}
              </div>

              {p.available ? (
                <button
                  className="ps-cta-btn"
                  style={{ background: p.gradient }}
                  onClick={() => onSelect(p.id)}
                >
                  Launch {p.name} →
                </button>
              ) : (
                <button className="ps-cta-btn ps-cta-locked" disabled>
                  🔒 Not Available Yet
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="ps-footer">
          <p className="ps-footer-note">@1persenlebihbaik_ · Powered by Gemini AI</p>
          <div className="ps-legal-links">
            <a href="/term-of-service" className="ps-legal-link">Terms of Service</a>
            <span className="ps-legal-separator">•</span>
            <a href="/privacy-policy" className="ps-legal-link">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSelector;
