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
    {
      id: 'tumblr',
      icon: '📝',
      name: 'Tumblr AI',
      description: 'Automatically post AI-generated photo sets and captions to your Tumblr blogs.',
      features: ['Photo Sets', 'Auto Scheduling', 'AI Content Engine', 'Multi-Blog Support'],
      gradient: 'linear-gradient(135deg, #001935 0%, #36465D 100%)',
      glowColor: 'rgba(0, 25, 53, 0.25)',
      available: true,
    },
    {
      id: 'mastodon',
      icon: '🐘',
      name: 'Mastodon Auto',
      description: 'Automatically publish affiliate content and image posts to your Mastodon instances.',
      features: ['Mastodon API', 'Auto Scheduling', 'AI Content Engine', 'Multi-Instance Support'],
      gradient: 'linear-gradient(135deg, #2b90d9 0%, #1c68a6 100%)',
      glowColor: 'rgba(43, 144, 217, 0.25)',
      available: true,
    },
    {
      id: 'devto',
      icon: '👩‍💻',
      name: 'DEV.TO Articles',
      description: 'Automatically publish AI-generated affiliate articles to your DEV.TO community.',
      features: ['Markdown Support', 'Auto Scheduling', 'AI Article Writer', 'No-Review API'],
      gradient: 'linear-gradient(135deg, #0a0a0a 0%, #3b49df 100%)',
      glowColor: 'rgba(59, 73, 223, 0.25)',
      available: true,
    },
    {
      id: 'bluesky',
      icon: '🦋',
      name: 'Bluesky Autopilot',
      description: 'Automatically post AI-generated text and images to the AT Protocol network.',
      features: ['AT Protocol', 'Auto Scheduling', 'Text & Images', 'No-Review API'],
      gradient: 'linear-gradient(135deg, #0085ff 0%, #00d2ff 100%)',
      glowColor: 'rgba(0, 133, 255, 0.25)',
      available: true,
    },
  ];

  return (
    <div className="platform-selector-page">
      <div className="selector-header">
        <h1>Welcome to Threadstomation</h1>
        <p>Select a platform to launch its dedicated AI publishing suite.</p>
      </div>

      <div className="platforms-grid">
        {platforms.map((p) => (
          <div
            key={p.id}
            className={`platform-card ${!p.available ? 'locked' : ''}`}
            onClick={() => p.available && onSelect(p.id)}
            style={{ cursor: p.available ? 'pointer' : 'not-allowed', '--card-gradient': p.gradient }}
          >
            <div className="platform-icon">{p.icon}</div>
            <h2>{p.name}</h2>
            <p>{p.description}</p>

            <div className="platform-features">
              {p.features.map((f) => (
                <span key={f} className="feature-tag">{f}</span>
              ))}
            </div>

            {!p.available && (
              <div style={{ position: 'absolute', top: '15px', right: '20px' }}>
                <span className="badge badge-error">Coming Soon</span>
              </div>
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
  );
};

export default PlatformSelector;
