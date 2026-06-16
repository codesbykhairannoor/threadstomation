import fs from 'fs';
import path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Preload fonts using process.cwd() for Vercel Serverless compatibility
const fontDir = path.join(process.cwd(), 'lib', 'fonts');
const interRegular = fs.readFileSync(path.join(fontDir, 'Inter-Regular.ttf'));
const interSemiBold = fs.readFileSync(path.join(fontDir, 'Inter-SemiBold.ttf'));
const interBlack = fs.readFileSync(path.join(fontDir, 'Inter-Black.ttf'));

/**
 * Renders an Instagram Carousel Slide (1080x1350) using HTML/CSS Flexbox
 */
export async function renderSlideToBuffer(slide, foregroundBuffer, theme, badgeText) {
  const fgBase64 = foregroundBuffer ? `data:image/png;base64,${foregroundBuffer.toString('base64')}` : null;
  
  // Choose layout based on Gemini's layout_type
  const layout = slide.layout_type || 'TextHeavy';
  
  // Default text colors
  const mainTextColor = theme.text || '#ffffff';
  const accentColor = theme.accent || '#ffd200';
  
  // Detect if background is light
  const isLightBg = theme.bg1 === '#ffffff' || theme.bg1 === '#f8fafc' || theme.bg1?.toLowerCase() === '#ffffff';
  
  // Subtle dot grid background for modern tech feel
  const dotGridSvg = `data:image/svg+xml;utf8,<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="1.5" fill="${encodeURIComponent(isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)')}"/></svg>`;

  const bgStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '1080px',
    height: '1350px',
    backgroundColor: theme.bg1 || '#0f2027',
    backgroundImage: `url('${dotGridSvg}')`,
    fontFamily: 'Inter',
    position: 'relative',
    overflow: 'hidden'
  };

  // Modern abstract background orbs (subtle)
  const bgOrbs = [
    { type: 'div', props: { style: { position: 'absolute', top: '-15%', left: '-10%', width: '800px', height: '800px', borderRadius: '400px', background: accentColor, opacity: isLightBg ? 0 : 0.15, filter: 'blur(100px)' } } },
    { type: 'div', props: { style: { position: 'absolute', bottom: '-20%', right: '-15%', width: '900px', height: '900px', borderRadius: '450px', background: mainTextColor, opacity: isLightBg ? 0 : 0.08, filter: 'blur(120px)' } } }
  ];

  // Huge Typography Watermark
  const watermarkText = {
    type: 'div',
    props: {
      style: { position: 'absolute', top: '150px', left: '-100px', fontSize: '280px', fontWeight: 900, color: isLightBg ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', whiteSpace: 'nowrap', zIndex: 0 },
      children: badgeText ? badgeText.split(' ')[0] : 'SHARESA'
    }
  };

  // Top Category Pill (Mini badge above title)
  const topPillBadge = {
    type: 'div',
    props: {
      style: { marginBottom: '25px', padding: '10px 24px', background: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)', borderRadius: '20px', display: 'flex', alignItems: 'center' },
      children: [
        { type: 'span', props: { style: { fontSize: '20px', fontWeight: 800, color: accentColor, letterSpacing: '1px', textTransform: 'uppercase' }, children: '✦ HIGHLIGHT' } }
      ]
    }
  };

  // Tech Scribbles (Stars, Bold Plus signs, hollow circles, accent dashes)
  const scribbles = [
    watermarkText,
    // Giant geometric hollow circle overlapping the edge
    { type: 'div', props: { style: { position: 'absolute', top: '-50px', right: '-150px', width: '400px', height: '400px', border: isLightBg ? '3px dashed rgba(0,0,0,0.08)' : '3px dashed rgba(255,255,255,0.05)', borderRadius: '200px' } } },
    // Crosshairs
    { type: 'div', props: { style: { position: 'absolute', bottom: '350px', left: '100px', fontSize: '60px', fontWeight: 300, color: isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }, children: '+' } },
    { type: 'div', props: { style: { position: 'absolute', top: '450px', right: '120px', fontSize: '60px', fontWeight: 300, color: isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }, children: '+' } },
    // Decorative dots
    { type: 'div', props: { style: { position: 'absolute', bottom: '250px', right: '400px', width: '12px', height: '12px', background: isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', borderRadius: '6px' } } }
  ];

  const bodyTextColor = isLightBg ? 'rgba(30,42,57,0.8)' : 'rgba(255,255,255,0.85)';

  // Restored Header Badge (SHARESA SPACE logo replacement)
  const headerBadge = { 
    type: 'div', 
    props: { 
      style: { position: 'absolute', top: '70px', left: '70px', background: isLightBg ? 'rgba(0,255,140,0.1)' : 'rgba(255,255,255,0.05)', border: isLightBg ? `1px solid rgba(0,255,140,0.3)` : '1px solid rgba(255,255,255,0.1)', borderRadius: '30px', padding: '12px 28px', display: 'flex', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }, 
      children: [
        { type: 'span', props: { style: { color: accentColor, fontSize: '24px', marginRight: '12px' }, children: '✦' } },
        { type: 'span', props: { style: { color: mainTextColor, fontSize: '22px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }, children: badgeText || 'SHARESA SPACE' } }
      ] 
    } 
  };

  const isOneformind = badgeText && badgeText.toLowerCase().includes('oneformind');
  const isSharesa = badgeText && badgeText.toLowerCase().includes('sharesa');
  
  let footerUrl = isOneformind ? 'www.oneformind.com' : (isSharesa ? 'www.sharesa.space' : `@${badgeText.toLowerCase()}`);
  let phoneNumber = isOneformind ? '' : (isSharesa ? '0878-1325-9106' : '');

  // Custom Footer + SWIPE CTA
  const footerBadge = {
    type: 'div',
    props: {
      style: { position: 'absolute', bottom: '60px', left: '70px', right: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      children: [
        { type: 'span', props: { style: { color: bodyTextColor, fontSize: '22px', fontWeight: 600, letterSpacing: '1px' }, children: footerUrl } },
        // Swipe CTA Button
        { type: 'div', props: { style: { display: 'flex', alignItems: 'center', background: mainTextColor, padding: '12px 24px', borderRadius: '30px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' } }, children: [
          { type: 'span', props: { style: { color: theme.bg1 || '#000', fontSize: '20px', fontWeight: 800, letterSpacing: '2px' }, children: 'SWIPE ➡️' } }
        ]},
        { type: 'span', props: { style: { color: bodyTextColor, fontSize: '22px', fontWeight: 600, letterSpacing: '2px' }, children: phoneNumber } }
      ]
    }
  };

  // Glowing Capsule Shadow Logic
  const capsuleShadow = isLightBg ? '0 10px 40px rgba(0,0,0,0.08)' : `0 20px 80px ${accentColor}33`; // 33 is 20% opacity hex
  const capsuleBorder = isLightBg ? '2px solid rgba(0,0,0,0.05)' : `2px solid ${accentColor}55`; // Glowing neon border

  let vdom = null;

  const isAdhlil = badgeText && badgeText.toLowerCase().includes('adhlil');

  if (isAdhlil) {
    const isTopImage = layout === 'TopMockup' || layout === 'RightPerson';
    const isTextOnly = layout === 'TextHeavy' || !fgBase64;
    
    const adThemeBg = theme.bg1 || '#000000';
    const adGradientTop = `linear-gradient(to bottom, transparent 40%, ${adThemeBg} 100%)`;
    const adGradientBottom = `linear-gradient(to top, transparent 40%, ${adThemeBg} 100%)`;

    const fullTitle = [slide.title_part1, slide.title_part2].filter(Boolean).join(' ');

    const titleElement = { type: 'span', props: { style: { color: accentColor, fontSize: '76px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-2px', textAlign: 'center' }, children: fullTitle } };
    const bodyElement = slide.body ? { type: 'div', props: { style: { marginTop: '50px', color: mainTextColor, fontSize: '36px', fontWeight: 500, lineHeight: 1.5, textAlign: 'center', maxWidth: '850px' }, children: slide.body } } : null;

    const subtleBadge = {
      type: 'span',
      props: {
        style: {
          color: 'rgba(255, 255, 255, 0.3)', // subtle transparent white
          fontSize: '22px',
          letterSpacing: '8px',
          fontWeight: 600,
          textTransform: 'uppercase',
          position: 'absolute',
          left: 0,
          right: 0,
          textAlign: 'center',
          [isTopImage ? 'bottom' : 'top']: '80px' // Place opposite to the image
        },
        children: '✦ ADHLIL.CO | REFLEKSI ✦'
      }
    };

    let children = [];

    if (isTextOnly) {
       children = [
         { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, width: '1080px', height: '1350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 100px' }, children: [titleElement, bodyElement] } },
         { ...subtleBadge, props: { ...subtleBadge.props, style: { ...subtleBadge.props.style, top: '80px', bottom: 'auto' } } }
       ];
    } else if (isTopImage) {
       children = [
         { type: 'img', props: { src: fgBase64, style: { position: 'absolute', top: 0, left: 0, width: '1080px', height: '650px', objectFit: 'cover' } } },
         { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, width: '1080px', height: '650px', backgroundImage: adGradientTop } } },
         { type: 'div', props: { style: { position: 'absolute', top: '700px', left: 0, width: '1080px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 100px' }, children: [titleElement, bodyElement] } },
         subtleBadge
       ];
    } else {
       // Bottom Image
       children = [
         { type: 'img', props: { src: fgBase64, style: { position: 'absolute', bottom: 0, left: 0, width: '1080px', height: '650px', objectFit: 'cover' } } },
         { type: 'div', props: { style: { position: 'absolute', bottom: 0, left: 0, width: '1080px', height: '650px', backgroundImage: adGradientBottom } } },
         { type: 'div', props: { style: { position: 'absolute', top: '250px', left: 0, width: '1080px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 100px' }, children: [titleElement, bodyElement] } },
         subtleBadge
       ];
    }

    vdom = {
      type: 'div',
      props: {
        style: { display: 'flex', flexDirection: 'column', width: '1080px', height: '1350px', backgroundColor: adThemeBg, fontFamily: 'Inter', position: 'relative', overflow: 'hidden' },
        children
      }
    };
  } else if (layout === 'LeftPerson' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgOrbs,
          ...scribbles,
          // Foreground Object (Left Side) - Centered Giant Capsule (Pill)
          { 
            type: 'div', 
            props: { 
              style: { position: 'absolute', left: '60px', top: '250px', width: '460px', height: '850px', display: 'flex', borderRadius: '250px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '460px', height: '850px', objectFit: 'cover' } } }
              ]
            } 
          },
          headerBadge,
          footerBadge,
          // Text Content (Right Side)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', right: '70px', top: '300px', width: '420px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
              children: [
                topPillBadge,
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginTop: '5px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '40px', color: bodyTextColor, fontSize: '32px', fontWeight: 500, lineHeight: 1.5, borderLeft: `4px solid ${accentColor}`, paddingLeft: '24px' }, children: slide.body } } : null
              ]
            }
          }
        ]
      }
    };
  } else if (layout === 'RightPerson' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgOrbs,
          ...scribbles,
          // Foreground Object (Right Side) - Centered Giant Capsule (Pill)
          { 
            type: 'div', 
            props: { 
              style: { position: 'absolute', right: '60px', top: '250px', width: '460px', height: '850px', display: 'flex', borderRadius: '250px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '460px', height: '850px', objectFit: 'cover' } } }
              ]
            } 
          },
          headerBadge,
          footerBadge,
          // Text Content (Left Side)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '70px', top: '300px', width: '420px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
              children: [
                topPillBadge,
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginTop: '5px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '40px', color: bodyTextColor, fontSize: '32px', fontWeight: 500, lineHeight: 1.5, borderLeft: `4px solid ${accentColor}`, paddingLeft: '24px' }, children: slide.body } } : null
              ]
            }
          }
        ]
      }
    };
  } else if (layout === 'TopMockup' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgOrbs,
          ...scribbles,
          // Foreground Object (Top Center) - Centered Horizontal Capsule
          { 
            type: 'div', 
            props: { 
              style: { position: 'absolute', left: '140px', top: '220px', width: '800px', height: '420px', display: 'flex', borderRadius: '275px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '800px', height: '420px', objectFit: 'cover' } } }
              ]
            } 
          },
          headerBadge,
          footerBadge,
          // Text Content (Bottom Center)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', top: '680px', left: '140px', width: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                topPillBadge,
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginTop: '5px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '40px', color: bodyTextColor, fontSize: '34px', fontWeight: 500, lineHeight: 1.5, maxWidth: '750px' }, children: slide.body } } : null
              ]
            }
          }
        ]
      }
    };
  } else if (layout === 'CenterMockup' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgOrbs,
          ...scribbles,
          // Foreground Object (Bottom Center) - Centered Horizontal Capsule
          { 
            type: 'div', 
            props: { 
              style: { position: 'absolute', left: '140px', bottom: '150px', width: '800px', height: '420px', display: 'flex', borderRadius: '275px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '800px', height: '420px', objectFit: 'cover' } } }
              ]
            } 
          },
          headerBadge,
          footerBadge,
          // Text Content (Top Center)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', top: '220px', left: '140px', width: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                topPillBadge,
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginTop: '5px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '40px', color: bodyTextColor, fontSize: '34px', fontWeight: 500, lineHeight: 1.5, maxWidth: '750px' }, children: slide.body } } : null
              ]
            }
          }
        ]
      }
    };
  } else if (layout === 'PromoBanner' && fgBase64) {
    // Unique Layout for Promotional Posts (Bluesky, Mastodon, Tumblr, Devto)
    vdom = {
      type: 'div',
      props: {
        style: { ...bgStyle, justifyContent: 'center', alignItems: 'center' },
        children: [
          ...bgOrbs,
          { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, width: '1080px', height: '1350px', backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${theme.bg1 || '#000'} 80%)` } } },
          // Giant Centered Image that takes up the top 60%
          { 
            type: 'div', 
            props: { 
              style: { position: 'absolute', top: '100px', width: '900px', height: '650px', display: 'flex', borderRadius: '40px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '900px', height: '650px', objectFit: 'cover' } } }
              ]
            } 
          },
          // Glassmorphism Card for Text Content
          {
            type: 'div',
            props: {
              style: { position: 'absolute', bottom: '150px', width: '960px', padding: '60px', background: isLightBg ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(40px)', borderRadius: '40px', border: capsuleBorder, boxShadow: '0 25px 50px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '64px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '64px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', marginTop: '10px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '30px', color: bodyTextColor, fontSize: '32px', fontWeight: 500, lineHeight: 1.5 }, children: slide.body } } : null
              ]
            }
          }
        ]
      }
    };
  } else {
    // TextHeavy
    vdom = {
      type: 'div',
      props: {
        style: { ...bgStyle, justifyContent: 'center', alignItems: 'center', padding: '100px' },
        children: [
          ...bgOrbs,
          ...scribbles,
          headerBadge,
          footerBadge,
          // Large Typography Focus
          { type: 'span', props: { style: { color: mainTextColor, fontSize: '100px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', textAlign: 'center', zIndex: 10 }, children: slide.title_part1 || '' } },
          { type: 'span', props: { style: { color: accentColor, fontSize: '100px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', marginTop: '10px', textAlign: 'center', zIndex: 10 }, children: slide.title_part2 || '' } },
          (slide.body || slide.text) ? { type: 'div', props: { style: { marginTop: '70px', color: bodyTextColor, fontSize: '42px', fontWeight: 500, textAlign: 'center', maxWidth: '800px', lineHeight: 1.5, zIndex: 10 }, children: (slide.body || slide.text) } } : null,
          
          // Giant Central CTA Button for Native Banner Fallbacks
          { type: 'div', props: { style: { marginTop: '80px', display: 'flex', alignItems: 'center', background: accentColor, padding: '25px 60px', borderRadius: '60px', boxShadow: `0 20px 40px ${accentColor}44`, zIndex: 10 } }, children: [
            { type: 'span', props: { style: { color: theme.bg1 || '#000', fontSize: '36px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }, children: '🔗 CEK LINK DI BAWAH' } }
          ]}
        ]
      }
    };
  }

  const svg = await satori(vdom, {
    width: 1080,
    height: 1350,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interSemiBold, weight: 600, style: 'normal' },
      { name: 'Inter', data: interBlack, weight: 900, style: 'normal' }
    ],
  });

  const resvg = new Resvg(svg, {
    background: theme.bg1 || '#0f2027',
    fitTo: { mode: 'width', value: 1080 }
  });
  
  return resvg.render().asPng();
}
