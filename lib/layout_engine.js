import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Preload fonts
const interRegular = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-Regular.ttf'));
const interSemiBold = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-SemiBold.ttf'));
const interBlack = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-Black.ttf'));

/**
 * Renders an Instagram Carousel Slide (1080x1350) using HTML/CSS Flexbox
 * @param {Object} slide - Slide data from Gemini (title_part1, title_part2, body, layout_type)
 * @param {Buffer|null} foregroundBuffer - Transparent PNG buffer of the subject
 * @param {Object} theme - Branding colors { bg1, bg2, accent, text }
 * @param {string} badgeText - Brand name or handle (e.g. "@sharesa.space")
 * @returns {Promise<Buffer>} PNG Buffer
 */
export async function renderSlideToBuffer(slide, foregroundBuffer, theme, badgeText) {
  const fgBase64 = foregroundBuffer ? `data:image/png;base64,${foregroundBuffer.toString('base64')}` : null;
  
  // Choose layout based on Gemini's layout_type
  const layout = slide.layout_type || 'TextHeavy';
  
  // Default text colors
  const mainTextColor = theme.text || '#ffffff';
  const accentColor = theme.accent || '#ffd200';
  
  // The CSS background can be a solid color or gradient. Satori supports basic linear-gradient.
  const bgStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '1080px',
    height: '1350px',
    backgroundImage: `linear-gradient(135deg, ${theme.bg1 || '#0f2027'}, ${theme.bg2 || '#203a43'})`,
    fontFamily: 'Inter',
    position: 'relative',
    overflow: 'hidden'
  };

  // Build the Virtual DOM for Satori
  // Since Satori uses React-like objects, we use simple POJOs
  let vdom = null;

  if (layout === 'LeftPerson' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          // Background abstract elements
          { type: 'div', props: { style: { position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px', borderRadius: '300px', background: accentColor, opacity: 0.1, filter: 'blur(50px)' } } },
          // Header Badge
          { type: 'div', props: { style: { position: 'absolute', top: '60px', left: '60px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '10px 20px', display: 'flex' }, children: [{ type: 'span', props: { style: { color: mainTextColor, fontSize: '24px', fontWeight: 600 }, children: badgeText } }] } },
          // Text Content (Right Side)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', right: '60px', top: '300px', width: '500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '72px', fontWeight: 900, lineHeight: 1.1 }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '72px', fontWeight: 900, lineHeight: 1.1, marginTop: '10px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '40px', background: mainTextColor, color: theme.bg1, padding: '15px 30px', borderRadius: '30px', fontSize: '28px', fontWeight: 600 }, children: slide.body } } : null
              ]
            }
          },
          // Foreground Object (Left Side) as a rounded card
          { type: 'img', props: { src: fgBase64, style: { position: 'absolute', left: '-50px', bottom: '150px', width: '600px', height: '600px', objectFit: 'cover', borderRadius: '40px', border: `8px solid ${accentColor}`, boxShadow: '0 40px 60px rgba(0,0,0,0.5)' } } }
        ]
      }
    };
  } else if (layout === 'CenterMockup' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          // Header Badge
          { type: 'div', props: { style: { position: 'absolute', top: '60px', left: '60px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '10px 20px', display: 'flex' }, children: [{ type: 'span', props: { style: { color: mainTextColor, fontSize: '24px', fontWeight: 600 }, children: badgeText } }] } },
          // Text Content (Top Center)
          {
            type: 'div',
            props: {
              style: { position: 'absolute', top: '150px', left: '100px', width: '880px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '80px', fontWeight: 900, lineHeight: 1.1 }, children: slide.title_part1 || '' } },
                { type: 'span', props: { style: { color: accentColor, fontSize: '80px', fontWeight: 900, lineHeight: 1.1, marginTop: '10px' }, children: slide.title_part2 || '' } },
                slide.body ? { type: 'div', props: { style: { marginTop: '40px', background: 'rgba(0,0,0,0.3)', border: `2px solid ${accentColor}`, color: mainTextColor, padding: '15px 40px', borderRadius: '40px', fontSize: '32px', fontWeight: 600 }, children: slide.body } } : null
              ]
            }
          },
          // Foreground Object (Bottom Center) as a rounded card
          { type: 'img', props: { src: fgBase64, style: { position: 'absolute', left: '140px', bottom: '80px', width: '800px', height: '500px', objectFit: 'cover', borderRadius: '50px', border: `8px solid rgba(255,255,255,0.2)`, boxShadow: '0 40px 60px rgba(0,0,0,0.5)' } } }
        ]
      }
    };
  } else {
    // TextHeavy or fallback
    vdom = {
      type: 'div',
      props: {
        style: { ...bgStyle, justifyContent: 'center', alignItems: 'center', padding: '100px' },
        children: [
          // Background abstract
          { type: 'div', props: { style: { position: 'absolute', top: '20%', right: '-10%', width: '800px', height: '800px', borderRadius: '400px', background: accentColor, opacity: 0.1, filter: 'blur(80px)' } } },
          // Header Badge
          { type: 'div', props: { style: { position: 'absolute', top: '60px', left: '60px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '10px 20px', display: 'flex' }, children: [{ type: 'span', props: { style: { color: mainTextColor, fontSize: '24px', fontWeight: 600 }, children: badgeText } }] } },
          // Large Text
          { type: 'span', props: { style: { color: mainTextColor, fontSize: '90px', fontWeight: 900, lineHeight: 1.1, textAlign: 'center' }, children: slide.title_part1 || '' } },
          { type: 'span', props: { style: { color: accentColor, fontSize: '90px', fontWeight: 900, lineHeight: 1.1, marginTop: '20px', textAlign: 'center' }, children: slide.title_part2 || '' } },
          slide.body ? { type: 'div', props: { style: { marginTop: '60px', borderBottom: `4px solid ${accentColor}`, color: mainTextColor, paddingBottom: '10px', fontSize: '36px', fontWeight: 400, textAlign: 'center' }, children: slide.body } } : null
        ]
      }
    };
  }

  // 1. Render Virtual DOM to SVG string via Satori
  const svg = await satori(vdom, {
    width: 1080,
    height: 1350,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interSemiBold, weight: 600, style: 'normal' },
      { name: 'Inter', data: interBlack, weight: 900, style: 'normal' }
    ],
  });

  // 2. Render SVG string to PNG Buffer via Resvg
  const resvg = new Resvg(svg, {
    background: theme.bg1 || '#0f2027',
    fitTo: { mode: 'width', value: 1080 }
  });
  
  const pngData = resvg.render();
  return pngData.asPng();
}
