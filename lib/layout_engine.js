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

  // Sharesa Custom Footer + SWIPE CTA
  const footerBadge = {
    type: 'div',
    props: {
      style: { position: 'absolute', bottom: '60px', left: '70px', right: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      children: [
        { type: 'span', props: { style: { color: bodyTextColor, fontSize: '22px', fontWeight: 600, letterSpacing: '1px' }, children: 'www.sharesa.space' } },
        // Swipe CTA Button
        { type: 'div', props: { style: { display: 'flex', alignItems: 'center', background: mainTextColor, padding: '12px 24px', borderRadius: '30px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' } }, children: [
          { type: 'span', props: { style: { color: theme.bg1 || '#000', fontSize: '20px', fontWeight: 800, letterSpacing: '2px' }, children: 'SWIPE ➡️' } }
        ]},
        { type: 'span', props: { style: { color: bodyTextColor, fontSize: '22px', fontWeight: 600, letterSpacing: '2px' }, children: '0878-1325-9106' } }
      ]
    }
  };

  // Glowing Capsule Shadow Logic
  const capsuleShadow = isLightBg ? '0 10px 40px rgba(0,0,0,0.08)' : `0 20px 80px ${accentColor}33`; // 33 is 20% opacity hex
  const capsuleBorder = isLightBg ? '2px solid rgba(0,0,0,0.05)' : `2px solid ${accentColor}55`; // Glowing neon border

  let vdom = null;

  if (layout === 'LeftPerson' && fgBase64) {
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
              style: { position: 'absolute', left: '50px', top: '225px', width: '500px', height: '900px', display: 'flex', borderRadius: '250px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '500px', height: '900px', objectFit: 'cover' } } }
              ]
            } 
          },
          headerBadge,
          footerBadge,
          // Text Content (Right Side)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', right: '60px', top: '260px', width: '450px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
              children: [
                topPillBadge,
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { background: accentColor, color: '#1e2a39', padding: '10px 20px', borderRadius: '15px', fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginTop: '10px' }, children: slide.title_part2 || '' } },
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
              style: { position: 'absolute', right: '50px', top: '225px', width: '500px', height: '900px', display: 'flex', borderRadius: '250px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '500px', height: '900px', objectFit: 'cover' } } }
              ]
            } 
          },
          headerBadge,
          footerBadge,
          // Text Content (Left Side)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '70px', top: '260px', width: '450px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
              children: [
                topPillBadge,
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { background: accentColor, color: '#1e2a39', padding: '10px 20px', borderRadius: '15px', fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginTop: '10px' }, children: slide.title_part2 || '' } },
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
              style: { position: 'absolute', left: '115px', top: '150px', width: '850px', height: '550px', display: 'flex', borderRadius: '275px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '850px', height: '550px', objectFit: 'cover' } } }
              ]
            } 
          },
          headerBadge,
          footerBadge,
          // Text Content (Bottom Center)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', bottom: '150px', left: '100px', width: '880px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                topPillBadge,
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { background: accentColor, color: '#1e2a39', padding: '10px 30px', borderRadius: '20px', fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginTop: '15px' }, children: slide.title_part2 || '' } },
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
              style: { position: 'absolute', left: '115px', bottom: '130px', width: '850px', height: '550px', display: 'flex', borderRadius: '275px', overflow: 'hidden', border: capsuleBorder, boxShadow: capsuleShadow, background: '#fcfcfc' },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '850px', height: '550px', objectFit: 'cover' } } }
              ]
            } 
          },
          headerBadge,
          footerBadge,
          // Text Content (Top Center)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', top: '190px', left: '100px', width: '880px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                topPillBadge,
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { background: accentColor, color: '#1e2a39', padding: '10px 30px', borderRadius: '20px', fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginTop: '15px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '40px', color: bodyTextColor, fontSize: '34px', fontWeight: 500, lineHeight: 1.5, maxWidth: '750px' }, children: slide.body } } : null
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
          { type: 'span', props: { style: { color: mainTextColor, fontSize: '100px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', textAlign: 'center' }, children: slide.title_part1 || '' } },
          { type: 'span', props: { style: { color: accentColor, fontSize: '100px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', marginTop: '10px', textAlign: 'center' }, children: slide.title_part2 || '' } },
          slide.body ? { type: 'div', props: { style: { marginTop: '70px', color: bodyTextColor, fontSize: '42px', fontWeight: 500, textAlign: 'center', maxWidth: '800px', lineHeight: 1.5 }, children: slide.body } } : null
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
