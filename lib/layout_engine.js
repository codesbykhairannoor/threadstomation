import fs from 'fs';
import path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Preload fonts using process.cwd() for Vercel Serverless compatibility
const fontDir = path.join(process.cwd(), 'lib', 'fonts');
const interRegular = fs.readFileSync(path.join(fontDir, 'Inter-Regular.ttf'));
const interSemiBold = fs.readFileSync(path.join(fontDir, 'Inter-SemiBold.ttf'));
const interBlack = fs.readFileSync(path.join(fontDir, 'Inter-Black.ttf'));

export async function renderSlideToBuffer(slide, foregroundBuffer, theme, badgeText) {
  const fgBase64 = foregroundBuffer ? `data:image/png;base64,${foregroundBuffer.toString('base64')}` : null;
  const layout = slide.layout_type || 'TextHeavy';
  
  const mainTextColor = theme.text || '#ffffff';
  const accentColor = theme.accent || '#ffd200';
  
  // Solid background allows for PERFECT gradient blending of images
  const solidBg = theme.bg1 || '#042f2e'; 
  
  const bgStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '1080px',
    height: '1350px',
    backgroundColor: solidBg,
    fontFamily: 'Inter',
    position: 'relative',
    overflow: 'hidden'
  };

  // Dynamic glowing abstract orbs
  const bgOrbs = [
    { type: 'div', props: { style: { position: 'absolute', top: '-20%', left: '-20%', width: '1000px', height: '1000px', borderRadius: '500px', background: theme.bg2 || '#0d9488', opacity: 0.6, filter: 'blur(150px)' } } },
    { type: 'div', props: { style: { position: 'absolute', bottom: '-20%', right: '-20%', width: '900px', height: '900px', borderRadius: '450px', background: accentColor, opacity: 0.15, filter: 'blur(150px)' } } }
  ];

  // Premium Header Badge
  const headerBadge = { 
    type: 'div', 
    props: { 
      style: { position: 'absolute', top: '70px', left: '70px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 28px', display: 'flex', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }, 
      children: [
        { type: 'span', props: { style: { color: accentColor, fontSize: '26px', marginRight: '14px', fontWeight: 900 }, children: '■' } },
        { type: 'span', props: { style: { color: mainTextColor, fontSize: '22px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }, children: badgeText } }
      ] 
    } 
  };

  // Branding Ribbon (Bottom)
  const bottomRibbon = {
    type: 'div',
    props: {
      style: { position: 'absolute', bottom: '0px', left: '0px', width: '1080px', height: '70px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 70px', borderTop: `4px solid ${accentColor}` },
      children: [
        { type: 'span', props: { style: { color: 'rgba(255,255,255,0.9)', fontSize: '22px', fontWeight: 600, letterSpacing: '1px' }, children: 'www.sharesa.space' } },
        { type: 'span', props: { style: { color: 'rgba(255,255,255,0.9)', fontSize: '22px', fontWeight: 600, letterSpacing: '1px' }, children: badgeText } }
      ]
    }
  };

  // High-Contrast Marker Highlight for Title Part 2
  const highlightTitle = {
    type: 'div',
    props: {
      style: { background: accentColor, padding: '8px 24px', borderRadius: '12px', marginTop: '15px', display: 'flex', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transform: 'rotate(-1deg)' },
      children: [
        { type: 'span', props: { style: { color: '#000000', fontSize: '84px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-3px' }, children: slide.title_part2 || '' } }
      ]
    }
  };

  let vdom = null;

  if (layout === 'CenterMockup' && fgBase64) {
    // CenterMockup: True transparent image placed at the bottom center
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgOrbs,
          // Bottom Transparent Image (Pop-out effect)
          { type: 'img', props: { src: fgBase64, style: { position: 'absolute', bottom: '20px', left: '40px', width: '1000px', height: '800px', objectFit: 'contain' } } },
          
          headerBadge,
          // Text Content (Top Center)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', top: '220px', left: '70px', width: '940px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-3px', textShadow: '0 10px 30px rgba(0,0,0,0.5)' }, children: slide.title_part1 || '' } },
                highlightTitle,
                slide.body ? { type: 'div', props: { style: { marginTop: '40px', background: 'rgba(0,0,0,0.6)', padding: '20px 30px', borderRadius: '16px', color: 'rgba(255,255,255,0.95)', fontSize: '32px', fontWeight: 400, lineHeight: 1.5, maxWidth: '850px', borderLeft: `6px solid ${accentColor}` }, children: slide.body } } : null
              ]
            }
          },
          bottomRibbon
        ]
      }
    };
  } else if (layout === 'LeftPerson' && fgBase64) {
    // LeftPerson: Text on the left, transparent subject on the right
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgOrbs,
          // Transparent Image on the right
          { type: 'img', props: { src: fgBase64, style: { position: 'absolute', bottom: '70px', right: '-40px', width: '700px', height: '900px', objectFit: 'contain' } } },
          
          headerBadge,
          // Text Content (Left Side)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '70px', top: '300px', width: '600px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '80px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-3px', textShadow: '0 10px 30px rgba(0,0,0,0.5)' }, children: slide.title_part1 || '' } },
                highlightTitle,
                slide.body ? { type: 'div', props: { style: { marginTop: '50px', color: 'rgba(255,255,255,0.95)', fontSize: '34px', fontWeight: 400, lineHeight: 1.5, background: 'rgba(0,0,0,0.6)', padding: '24px', borderRadius: '16px', borderLeft: `6px solid ${accentColor}` }, children: slide.body } } : null
              ]
            }
          },
          bottomRibbon
        ]
      }
    };
  } else {
    // TextHeavy: Massive typography filling the screen
    vdom = {
      type: 'div',
      props: {
        style: { ...bgStyle, justifyContent: 'center', alignItems: 'center', padding: '100px' },
        children: [
          ...bgOrbs,
          headerBadge,
          // Extremely Large Typography Focus
          { type: 'span', props: { style: { color: mainTextColor, fontSize: '110px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-4px', textAlign: 'center', textShadow: '0 20px 40px rgba(0,0,0,0.5)' }, children: slide.title_part1 || '' } },
          {
            type: 'div',
            props: {
              style: { background: accentColor, padding: '10px 40px', borderRadius: '20px', marginTop: '20px', display: 'flex', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', transform: 'rotate(2deg)' },
              children: [
                { type: 'span', props: { style: { color: '#000000', fontSize: '110px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-4px' }, children: slide.title_part2 || '' } }
              ]
            }
          },
          slide.body ? { type: 'div', props: { style: { marginTop: '80px', color: 'rgba(255,255,255,0.95)', fontSize: '42px', fontWeight: 400, textAlign: 'center', maxWidth: '850px', lineHeight: 1.5, background: 'rgba(0,0,0,0.4)', padding: '30px', borderRadius: '24px' }, children: slide.body } } : null,
          bottomRibbon
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
    background: solidBg,
    fitTo: { mode: 'width', value: 1080 }
  });
  
  return resvg.render().asPng();
}
