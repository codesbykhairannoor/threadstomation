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
  
  const bgStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '1080px',
    height: '1350px',
    backgroundColor: theme.bg1 || '#0f2027',
    fontFamily: 'Inter',
    position: 'relative',
    overflow: 'hidden'
  };

  // Modern abstract background orbs for agency feel. Remove completely on light backgrounds for pure white.
  const bgOrbs = [
    { type: 'div', props: { style: { position: 'absolute', top: '-15%', left: '-10%', width: '800px', height: '800px', borderRadius: '400px', background: accentColor, opacity: isLightBg ? 0 : 0.15, filter: 'blur(100px)' } } },
    { type: 'div', props: { style: { position: 'absolute', bottom: '-20%', right: '-15%', width: '900px', height: '900px', borderRadius: '450px', background: mainTextColor, opacity: isLightBg ? 0 : 0.08, filter: 'blur(120px)' } } }
  ];

  // Seamless mode for light background: no glass box, let the white image blend with white slide.
  const glassBg = isLightBg ? 'transparent' : 'rgba(255,255,255,0.02)';
  const glassBorder = isLightBg ? 'none' : '1px solid rgba(255,255,255,0.08)';
  const glassShadow = isLightBg ? 'none' : '0 30px 60px rgba(0,0,0,0.4)';
  const glassPadding = isLightBg ? '0px' : '16px';
  const bodyTextColor = isLightBg ? 'rgba(30,42,57,0.8)' : 'rgba(255,255,255,0.85)';

  // Sharesa Custom Footer
  const footerBadge = {
    type: 'div',
    props: {
      style: { position: 'absolute', bottom: '60px', left: '70px', right: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      children: [
        { type: 'span', props: { style: { color: bodyTextColor, fontSize: '24px', fontWeight: 600, letterSpacing: '1.5px' }, children: 'www.sharesa.space' } },
        { type: 'span', props: { style: { color: bodyTextColor, fontSize: '24px', fontWeight: 600, letterSpacing: '2px' }, children: '0878-1325-9106' } }
      ]
    }
  };

  let vdom = null;

  if (layout === 'LeftPerson' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgOrbs,
          footerBadge,
          // Text Content (Right Side)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', right: '70px', top: '280px', width: '520px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '76px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '76px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginTop: '5px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '50px', color: bodyTextColor, fontSize: '34px', fontWeight: 500, lineHeight: 1.4, borderLeft: `4px solid ${accentColor}`, paddingLeft: '24px' }, children: slide.body } } : null
              ]
            }
          },
          // Foreground Object (Left Side) - Seamless blending on white
          { 
            type: 'div', 
            props: { 
              style: { position: 'absolute', left: '-20px', bottom: '150px', display: 'flex', padding: glassPadding, background: glassBg, border: glassBorder, borderRadius: '48px', boxShadow: glassShadow },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '580px', height: '680px', objectFit: 'contain' } } }
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
          footerBadge,
          // Text Content (Top Center)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', top: '180px', left: '100px', width: '880px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginTop: '5px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '50px', color: bodyTextColor, fontSize: '36px', fontWeight: 500, lineHeight: 1.4, maxWidth: '750px' }, children: slide.body } } : null
              ]
            }
          },
          // Foreground Object (Bottom Center)
          { 
            type: 'div', 
            props: { 
              style: { position: 'absolute', left: '100px', bottom: '150px', display: 'flex', padding: glassPadding, background: glassBg, border: glassBorder, borderRadius: '56px', boxShadow: glassShadow },
              children: [
                { type: 'img', props: { src: fgBase64, style: { width: '880px', height: '520px', objectFit: 'contain' } } }
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
