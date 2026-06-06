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

  // Geometric Agency Patterns instead of blurry orbs
  const bgGeometry = [
    { type: 'div', props: { style: { position: 'absolute', top: '-20%', right: '-30%', width: '1200px', height: '1500px', background: accentColor, opacity: 0.04, transform: 'rotate(-15deg)' } } },
    { type: 'div', props: { style: { position: 'absolute', bottom: '-10%', left: '-10%', width: '600px', height: '600px', background: accentColor, opacity: 0.03, transform: 'rotate(45deg)', borderRadius: '100px' } } },
    // Premium left accent border strip
    { type: 'div', props: { style: { position: 'absolute', top: '0', left: '0', width: '12px', height: '100%', background: accentColor } } }
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
      style: { position: 'absolute', bottom: '0px', left: '0px', width: '1080px', height: '70px', background: mainTextColor === '#ffffff' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 70px', borderTop: `2px solid ${accentColor}` },
      children: [
        { type: 'span', props: { style: { color: mainTextColor, fontSize: '22px', fontWeight: 600, letterSpacing: '1px' }, children: 'www.sharesa.space' } },
        { type: 'span', props: { style: { color: mainTextColor, fontSize: '22px', fontWeight: 600, letterSpacing: '1px' }, children: badgeText } }
      ]
    }
  };

  // High-Contrast Marker Highlight for Title Part 2
  // We ensure the text inside the highlight is always the contrast color of the highlight itself.
  // If accent is dark, text is white. If accent is light (green/white), text is dark.
  const highlightTextCol = (accentColor === '#1e2a39') ? '#ffffff' : '#1e2a39';
  const highlightTitle = {
    type: 'div',
    props: {
      style: { background: accentColor, padding: '12px 30px', borderRadius: '8px', marginTop: '15px', display: 'flex', boxShadow: `0 20px 40px rgba(0,0,0,0.15)`, transform: 'rotate(-2deg)' },
      children: [
        { type: 'span', props: { style: { color: highlightTextCol, fontSize: '84px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-3px' }, children: slide.title_part2 || '' } }
      ]
    }
  };

  let vdom = null;

  if (layout === 'CenterMockup' && fgBase64) {
    // Editorial Split (No transparency needed)
    // Top is solid text area, Bottom is full width image
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgGeometry,
          // Bottom Full Image (Editorial split)
          { type: 'img', props: { src: fgBase64, style: { position: 'absolute', bottom: '70px', left: '0px', width: '1080px', height: '750px', objectFit: 'cover' } } },
          // Separation line
          { type: 'div', props: { style: { position: 'absolute', bottom: '820px', left: '0', width: '1080px', height: '8px', background: accentColor } } },
          
          headerBadge,
          // Text Content (Top Center)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', top: '200px', left: '70px', width: '940px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '88px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px' }, children: slide.title_part1 || '' } },
                highlightTitle,
              ]
            }
          },
          bottomRibbon
        ]
      }
    };
  } else if (layout === 'LeftPerson' && fgBase64) {
    // Side Bento (No transparency needed)
    // Left is text, Right is a rounded Bento card containing the image
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgGeometry,
          // Right Side Bento Image Card
          { type: 'img', props: { src: fgBase64, style: { position: 'absolute', bottom: '150px', right: '50px', width: '480px', height: '900px', objectFit: 'cover', borderRadius: '40px', border: `8px solid ${accentColor}`, boxShadow: '0 30px 60px rgba(0,0,0,0.3)' } } },
          
          headerBadge,
          // Text Content (Left Side Bento)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '70px', top: '350px', width: '450px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '76px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-3px' }, children: slide.title_part1 || '' } },
                highlightTitle,
                slide.body ? { type: 'div', props: { style: { marginTop: '50px', color: mainTextColor, fontSize: '34px', fontWeight: 500, lineHeight: 1.5, borderLeft: `6px solid ${accentColor}`, paddingLeft: '24px', opacity: 0.9 }, children: slide.body } } : null
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
          ...bgGeometry,
          headerBadge,
          // Extremely Large Typography Focus
          { type: 'span', props: { style: { color: mainTextColor, fontSize: '110px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-4px', textAlign: 'center' }, children: slide.title_part1 || '' } },
          {
            type: 'div',
            props: {
              style: { background: accentColor, padding: '15px 50px', borderRadius: '12px', marginTop: '30px', display: 'flex', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', transform: 'rotate(2deg)' },
              children: [
                { type: 'span', props: { style: { color: highlightTextCol, fontSize: '110px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-4px' }, children: slide.title_part2 || '' } }
              ]
            }
          },
          slide.body ? { type: 'div', props: { style: { marginTop: '70px', color: mainTextColor, fontSize: '42px', fontWeight: 500, lineHeight: 1.5, textAlign: 'center', maxWidth: '850px', opacity: 0.9 }, children: slide.body } } : null,
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
