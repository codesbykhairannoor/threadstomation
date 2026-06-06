import fs from 'fs';
import path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Preload fonts using process.cwd() for Vercel Serverless compatibility
const fontDir = path.join(process.cwd(), 'lib', 'fonts');
const interRegular = fs.readFileSync(path.join(fontDir, 'Inter-Regular.ttf'));
const interSemiBold = fs.readFileSync(path.join(fontDir, 'Inter-SemiBold.ttf'));
const interBlack = fs.readFileSync(path.join(fontDir, 'Inter-Black.ttf'));

// Helper to parse comma-separated text into a list of bullet points
function parseBodyToBullets(bodyText) {
  if (!bodyText) return [];
  const ctaWords = ['swipe', 'selengkapnya', 'detail', 'klik', 'link', 'kunjungi', 'baca', 'save', 'simpan'];
  return bodyText
    .split(/[,\n;]+/)
    .map(item => item.trim())
    .filter(item => {
      if (item.length === 0) return false;
      const lower = item.toLowerCase();
      return !ctaWords.some(word => lower.includes(word));
    });
}

// Helper to detect if a text fragment is a Call to Action
function detectCTA(bodyText) {
  if (!bodyText) return null;
  const ctaWords = ['swipe', 'selengkapnya', 'detail', 'klik', 'link', 'kunjungi', 'baca', 'save', 'simpan'];
  
  // If the body is multi-line or comma-separated, check if any part is a CTA
  const parts = bodyText.split(/[,\n;]+/);
  for (const part of parts) {
    const cleanPart = part.trim();
    for (const word of ctaWords) {
      if (cleanPart.toLowerCase().includes(word)) {
        return cleanPart;
      }
    }
  }
  return null;
}

// Helper to convert hex to rgba for beautiful glows
function getGlowColor(hex, opacity = 0.15) {
  if (!hex) return `rgba(0, 255, 140, ${opacity})`;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return `rgba(0, 255, 140, ${opacity})`;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Render slide HTML and send it to URLBox to capture screen in high resolution.
 */
async function renderSlideViaUrlbox(slide, foregroundBuffer, theme, badgeText) {
  const fgBase64 = foregroundBuffer ? `data:image/png;base64,${foregroundBuffer.toString('base64')}` : null;
  const layout = slide.layout_type || 'TextHeavy';
  
  const mainTextColor = theme.text || '#ffffff';
  const accentColor = theme.accent || '#00ff8c';
  const solidBg = theme.bg1 || '#1e2a39'; 
  
  const bullets = parseBodyToBullets(slide.body);
  const ctaText = detectCTA(slide.body);
  const glowColor = getGlowColor(accentColor, 0.18);
  const isLight = mainTextColor === '#1e2a39' || mainTextColor === '#000000';
  
  // Design system values
  const cardBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';
  const mutedText = isLight ? 'rgba(30,42,57,0.6)' : 'rgba(255,255,255,0.5)';

  // Build high-performance page using Tailwind CSS CDN & Plus Jakarta Sans
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          },
          colors: {
            brand: {
              bg: '${solidBg}',
              text: '${mainTextColor}',
              accent: '${accentColor}',
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: ${solidBg};
      color: ${mainTextColor};
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      position: relative;
    }
  </style>
</head>
<body>
  <!-- Geometric background glowing blobs -->
  <div class="absolute -top-[20%] -right-[20%] w-[900px] h-[900px] rounded-full blur-[120px] opacity-10 pointer-events-none" style="background: ${accentColor};"></div>
  <div class="absolute -bottom-[20%] -left-[20%] w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 pointer-events-none" style="background: ${accentColor};"></div>
  
  <!-- Left Neon Ribbon -->
  <div class="absolute left-0 top-0 bottom-0 w-3 pointer-events-none" style="background: ${accentColor};"></div>
  
  <!-- Top Header Badge -->
  <div class="absolute top-[80px] left-[80px] flex items-center rounded-full px-6 py-3 border backdrop-blur-md z-20"
       style="background: ${cardBg}; border-color: ${cardBorder};">
    <span class="w-3 h-3 rounded-full mr-3 animate-pulse" style="background: ${accentColor}; box-shadow: 0 0 10px ${accentColor};"></span>
    <span class="text-xs font-bold tracking-[0.25em] uppercase" style="color: ${mainTextColor}; opacity: 0.85;">${badgeText}</span>
  </div>
  
  <!-- Footer Ribbon -->
  <div class="absolute bottom-[60px] left-[80px] right-[80px] flex justify-between items-center text-sm font-semibold tracking-wider z-20"
       style="color: ${mutedText};">
    <span>www.sharesa.space</span>
    <span>${badgeText}</span>
  </div>
`;

  if (layout === 'PureAI' && fgBase64) {
    html += `
  <!-- Pure AI Layout: Full bleeding poster with gradient shrouds for text readability -->
  <div class="absolute inset-0 w-full h-full z-0 overflow-hidden">
    <img src="${fgBase64}" class="w-full h-full object-cover" />
    <div class="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-b from-black/80 to-transparent"></div>
    <div class="absolute bottom-0 left-0 right-0 h-[240px] bg-gradient-to-t from-black/80 to-transparent"></div>
  </div>
`;
  } else if (layout === 'CenterMockup' && fgBase64) {
    const bulletsHtml = bullets.map(b => `
      <div class="flex items-center rounded-full px-5 py-2.5 border backdrop-blur-md"
           style="background: ${cardBg}; border-color: ${cardBorder};">
        <span class="text-brand-accent mr-2.5 font-bold text-lg">✔</span>
        <span class="font-semibold text-sm tracking-wide text-brand-text">${b}</span>
      </div>
    `).join('');

    const ctaHtml = ctaText ? `
      <div class="flex items-center border-2 rounded-full px-7 py-3 mt-6 backdrop-blur-sm"
           style="border-color: ${accentColor}; background: ${cardBg};">
        <span class="text-brand-text font-bold text-sm tracking-wide mr-3">${ctaText}</span>
        <span class="text-brand-accent font-black text-sm">➔</span>
      </div>
    ` : '';

    html += `
  <!-- Center Mockup Layout -->
  <div class="absolute top-[200px] left-[80px] right-[80px] flex flex-col items-center text-center z-10">
    <h1 class="text-5xl font-extrabold tracking-tight leading-[1.1] text-brand-text max-w-[800px]">
      ${slide.title_part1 || ''}
    </h1>
    ${slide.title_part2 ? `
    <div class="mt-4 px-6 py-2.5 rounded-2xl font-black text-3xl uppercase tracking-wide inline-block"
         style="background: ${accentColor}; color: ${isLight ? '#ffffff' : '#1e2a39'}; box-shadow: 0 10px 30px ${glowColor};">
      ${slide.title_part2}
    </div>
    ` : ''}
    
    <!-- Capsules -->
    <div class="flex flex-wrap justify-center gap-3 mt-6 max-w-[850px]">
      ${bulletsHtml}
    </div>
    
    <!-- CTA -->
    ${ctaHtml}
  </div>

  <!-- Browser Mockup Container with 3D Tilt -->
  <div class="absolute bottom-[140px] left-1/2 -translate-x-1/2 w-[880px] h-[520px]" style="perspective: 1500px;">
    <div class="w-full h-full rounded-[24px] border bg-[#0d1520] flex flex-col overflow-hidden transition-all duration-500"
         style="border-color: ${cardBorder}; transform: rotateX(8deg) rotateY(-4deg) rotateZ(1deg); box-shadow: 0 40px 100px -20px ${glowColor};">
      <!-- Browser Top Bar -->
      <div class="h-[44px] bg-white/5 border-b flex items-center px-5 relative shrink-0" style="border-color: ${cardBorder};">
        <div class="flex gap-2">
          <div class="w-[10px] h-[10px] rounded-full bg-[#ff5f56]"></div>
          <div class="w-[10px] h-[10px] rounded-full bg-[#ffbd2e]"></div>
          <div class="w-[10px] h-[10px] rounded-full bg-[#27c93f]"></div>
        </div>
        <div class="absolute left-1/2 -translate-x-1/2 w-[360px] h-[24px] bg-white/10 rounded-full flex items-center justify-center">
          <span class="text-white/30 text-[11px] font-mono tracking-wide">sharesa.space</span>
        </div>
      </div>
      <!-- Image Screen -->
      <div class="grow w-full overflow-hidden bg-brand-bg relative">
        <img src="${fgBase64}" class="w-full h-full object-cover object-top" />
      </div>
    </div>
  </div>
`;
  } else if ((layout === 'LeftPerson' || layout === 'RightPerson') && fgBase64) {
    const bulletsHtml = bullets.map(b => `
      <div class="flex items-center rounded-full px-5 py-2.5 border backdrop-blur-md w-full"
           style="background: ${cardBg}; border-color: ${cardBorder};">
        <span class="text-brand-accent mr-3 font-bold text-lg">✔</span>
        <span class="font-semibold text-sm tracking-wide text-brand-text">${b}</span>
      </div>
    `).join('');

    const ctaHtml = ctaText ? `
      <div class="flex items-center border-2 rounded-full px-7 py-3 mt-6 backdrop-blur-sm self-start"
           style="border-color: ${accentColor}; background: ${cardBg};">
        <span class="text-brand-text font-bold text-sm tracking-wide mr-3">${ctaText}</span>
        <span class="text-brand-accent font-black text-sm">➔</span>
      </div>
    ` : '';

    const textSection = `
    <div class="flex flex-col items-start w-[480px]">
      <h1 class="text-5xl font-extrabold tracking-tight leading-[1.1] text-brand-text text-left">
        ${slide.title_part1 || ''}
      </h1>
      ${slide.title_part2 ? `
      <div class="mt-4 px-6 py-2.5 rounded-2xl font-black text-2xl uppercase tracking-wide inline-block"
           style="background: ${accentColor}; color: ${isLight ? '#ffffff' : '#1e2a39'}; box-shadow: 0 10px 30px ${glowColor};">
        ${slide.title_part2}
      </div>
      ` : ''}
      
      <!-- Capsules -->
      <div class="flex flex-col gap-3 mt-8 w-full max-w-[440px]">
        ${bulletsHtml}
      </div>
      
      <!-- CTA -->
      ${ctaHtml}
    </div>
    `;

    const phoneSection = `
    <div class="w-[400px] h-[800px] flex items-center justify-center shrink-0" style="perspective: 1500px;">
      <div class="w-full h-full rounded-[44px] border-8 bg-[#0d1520] relative overflow-hidden flex flex-col"
           style="border-color: ${cardBorder}; transform: ${layout === 'LeftPerson' ? 'rotateY(-10deg) rotateX(4deg) rotateZ(-1.5deg)' : 'rotateY(10deg) rotateX(4deg) rotateZ(1.5deg)'}; box-shadow: 0 40px 100px -25px ${glowColor};">
        <!-- Phone Camera Notch -->
        <div class="absolute top-3.5 left-1/2 -translate-x-1/2 w-[110px] h-[20px] bg-white/10 rounded-full z-10 flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
        </div>
        <!-- Screen Content -->
        <div class="w-full h-full overflow-hidden bg-brand-bg">
          <img src="${fgBase64}" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>
    `;

    if (layout === 'LeftPerson') {
      html += `
  <!-- LeftPerson Layout -->
  <div class="absolute top-[200px] left-[80px] right-[80px] bottom-[120px] flex justify-between items-center z-10">
    ${textSection}
    ${phoneSection}
  </div>
`;
    } else {
      html += `
  <!-- RightPerson Layout -->
  <div class="absolute top-[200px] left-[80px] right-[80px] bottom-[120px] flex justify-between items-center z-10">
    ${phoneSection}
    ${textSection}
  </div>
`;
    }
  } else {
    // TextHeavy Layout
    const bulletsHtml = bullets.map(b => `
      <div class="flex items-center rounded-full px-6 py-3 border backdrop-blur-md"
           style="background: ${cardBg}; border-color: ${cardBorder};">
        <span class="text-brand-accent mr-3 font-bold text-xl">✔</span>
        <span class="font-semibold text-base tracking-wide text-brand-text">${b}</span>
      </div>
    `).join('');

    const ctaHtml = ctaText ? `
      <div class="flex items-center border-2 rounded-full px-8 py-3.5 mt-8 backdrop-blur-sm"
           style="border-color: ${accentColor}; background: ${cardBg};">
        <span class="text-brand-text font-bold text-base tracking-wide mr-3">${ctaText}</span>
        <span class="text-brand-accent font-black text-base">➔</span>
      </div>
    ` : '';

    html += `
  <!-- Text Heavy Layout -->
  <div class="absolute top-[200px] bottom-[140px] left-[100px] right-[100px] flex flex-col items-center justify-center text-center z-10">
    <h1 class="text-6xl font-black tracking-tight leading-[1.05] text-brand-text max-w-[850px]">
      ${slide.title_part1 || ''}
    </h1>
    ${slide.title_part2 ? `
    <div class="mt-6 px-8 py-3 rounded-2xl font-black text-4xl uppercase tracking-wide inline-block"
         style="background: ${accentColor}; color: ${isLight ? '#ffffff' : '#1e2a39'}; box-shadow: 0 10px 30px ${glowColor};">
      ${slide.title_part2}
    </div>
    ` : ''}
    
    <!-- Capsules -->
    <div class="flex flex-wrap justify-center gap-3.5 mt-10 max-w-[850px]">
      ${bulletsHtml}
    </div>
    
    <!-- CTA -->
    ${ctaHtml}
  </div>
`;
  }

  html += `
</body>
</html>
`;

  // POST directly to URLBox synchronous API
  const urlboxKey = process.env.URLBOX_API_KEY;
  console.log(`[URLBox] Sending request to URLBox API for layout: ${layout}...`);
  const res = await fetch('https://api.urlbox.com/v1/render/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${urlboxKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: html,
      format: 'jpg',
      width: 1080,
      height: 1350,
      quality: 90,
      wait_until: 'networkidle0',
      delay: 1000,
      response_type: 'binary'
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`URLBox rendering failed with status ${res.status}: ${errorText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  console.log(`[URLBox] ✅ Received binary screenshot from URLBox (${arrayBuffer.byteLength} bytes)`);
  return Buffer.from(arrayBuffer);
}

/**
 * Main render function: Checks for URLBox, falls back to Satori.
 */
export async function renderSlideToBuffer(slide, foregroundBuffer, theme, badgeText) {
  // If URLBox key is set, attempt URLBox HTML-based rendering first
  if (process.env.URLBOX_API_KEY) {
    try {
      return await renderSlideViaUrlbox(slide, foregroundBuffer, theme, badgeText);
    } catch (e) {
      console.error(`[LayoutEngine] ❌ URLBox failed, falling back to Satori engine. Error:`, e.message);
    }
  }

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

  // Geometric Agency Patterns (sleek borders & background visual structures)
  const bgGeometry = [
    { type: 'div', props: { style: { position: 'absolute', top: '-10%', right: '-10%', width: '900px', height: '900px', background: accentColor, opacity: 0.03, borderRadius: '450px', filter: 'blur(80px)' } } },
    { type: 'div', props: { style: { position: 'absolute', bottom: '-15%', left: '-15%', width: '800px', height: '800px', background: accentColor, opacity: 0.02, borderRadius: '400px', filter: 'blur(80px)' } } },
    // Premium left accent border strip
    { type: 'div', props: { style: { position: 'absolute', top: '0', left: '0', width: '14px', height: '100%', background: accentColor } } }
  ];

  // Premium Header Badge (Top Left)
  const headerBadge = { 
    type: 'div', 
    props: { 
      style: { position: 'absolute', top: '70px', left: '70px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '12px 28px', display: 'flex', alignItems: 'center' }, 
      children: [
        { type: 'span', props: { style: { color: accentColor, fontSize: '24px', marginRight: '12px', fontWeight: 900 }, children: '■' } },
        { type: 'span', props: { style: { color: mainTextColor, fontSize: '20px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }, children: badgeText } }
      ] 
    } 
  };

  // Branding Ribbon (Bottom)
  const bottomRibbon = {
    type: 'div',
    props: {
      style: { position: 'absolute', bottom: '0px', left: '0px', width: '1080px', height: '70px', background: mainTextColor === '#ffffff' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 70px', borderTop: `1px solid rgba(255,255,255,0.08)` },
      children: [
        { type: 'span', props: { style: { color: mainTextColor, fontSize: '20px', fontWeight: 500, opacity: 0.7, letterSpacing: '1px' }, children: 'www.sharesa.space' } },
        { type: 'span', props: { style: { color: mainTextColor, fontSize: '20px', fontWeight: 500, opacity: 0.7, letterSpacing: '1px' }, children: badgeText } }
      ]
    }
  };

  // High-Contrast Marker Highlight for Title Part 2
  const highlightTextCol = (accentColor === '#1e2a39') ? '#ffffff' : '#1e2a39';
  const highlightTitle = slide.title_part2 ? {
    type: 'div',
    props: {
      style: { background: accentColor, padding: '12px 32px', borderRadius: '12px', marginTop: '16px', display: 'flex' },
      children: [
        { type: 'span', props: { style: { color: highlightTextCol, fontSize: '60px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px' }, children: slide.title_part2 } }
      ]
    }
  } : null;

  // CTA Button Component
  const ctaText = detectCTA(slide.body);
  const ctaButton = ctaText ? {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        border: `2px solid ${accentColor}`,
        borderRadius: '30px',
        padding: '12px 28px',
        marginTop: '28px',
        background: 'rgba(255,255,255,0.04)',
        alignSelf: 'center'
      },
      children: [
        { type: 'span', props: { style: { color: mainTextColor, fontSize: '22px', fontWeight: 700, marginRight: '10px' }, children: ctaText } },
        { type: 'span', props: { style: { color: accentColor, fontSize: '22px', fontWeight: 900 }, children: '➔' } }
      ]
    }
  } : null;

  // Pill Capsule Badges for Bullet Points
  const bullets = parseBodyToBullets(slide.body);
  const checkmarksList = bullets.length > 0 ? {
    type: 'div',
    props: {
      style: { display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '24px', justifyContent: 'center', maxWidth: '900px' },
      children: bullets.map(bullet => ({
        type: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '30px',
            padding: '10px 24px',
          },
          children: [
            { type: 'span', props: { style: { color: accentColor, fontSize: '22px', marginRight: '10px', fontWeight: 900 }, children: '✔' } },
            { type: 'span', props: { style: { color: mainTextColor, fontSize: '20px', fontWeight: 600 }, children: bullet } }
          ]
        }
      }))
    }
  } : null;

  let vdom = null;

  if (layout === 'PureAI' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          { type: 'img', props: { src: fgBase64, style: { position: 'absolute', top: '0', left: '0', width: '1080px', height: '1350px', objectFit: 'cover' } } },
          { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, width: '1080px', height: '200px', display: 'flex', backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))' } } },
          { type: 'div', props: { style: { position: 'absolute', bottom: 0, left: 0, width: '1080px', height: '200px', display: 'flex', backgroundImage: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.5))' } } },
          headerBadge,
          bottomRibbon
        ]
      }
    };
  } else if (layout === 'CenterMockup' && fgBase64) {
    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgGeometry,
          headerBadge,
          {
            type: 'div',
            props: {
              style: { position: 'absolute', top: '180px', left: '70px', width: '940px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
              children: [
                { type: 'span', props: { style: { color: mainTextColor, fontSize: '64px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
                highlightTitle,
                checkmarksList,
                ctaButton
              ]
            }
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '120px',
                left: '90px',
                width: '900px',
                height: '560px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                overflow: 'hidden',
                border: `3px solid rgba(255,255,255,0.08)`,
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                backgroundColor: '#0d1520'
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      height: '48px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderBottom: `1px solid rgba(255,255,255,0.08)`,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 20px',
                      position: 'relative'
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', gap: '8px' },
                          children: [
                            { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' } } },
                            { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' } } },
                            { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' } } }
                          ]
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '400px',
                            height: '26px',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          },
                          children: [
                            { type: 'span', props: { style: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontFamily: 'monospace' }, children: 'sharesa.space' } }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  type: 'img',
                  props: {
                    src: fgBase64,
                    style: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }
                  }
                }
              ]
            }
          },
          bottomRibbon
        ]
      }
    };
  } else if ((layout === 'LeftPerson' || layout === 'RightPerson') && fgBase64) {
    const leftCheckmarks = bullets.length > 0 ? {
      type: 'div',
      props: {
        style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' },
        children: bullets.map(bullet => ({
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '10px 20px',
            },
            children: [
              { type: 'span', props: { style: { color: accentColor, fontSize: '20px', marginRight: '10px', fontWeight: 900 }, children: '✔' } },
              { type: 'span', props: { style: { color: mainTextColor, fontSize: '18px', fontWeight: 600 }, children: bullet } }
            ]
          }
        }))
      }
    } : null;

    const leftCtaButton = ctaText ? {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'center',
          border: `2px solid ${accentColor}`,
          borderRadius: '30px',
          padding: '12px 28px',
          marginTop: '28px',
          background: 'rgba(255,255,255,0.04)',
          alignSelf: 'flex-start'
        },
        children: [
          { type: 'span', props: { style: { color: mainTextColor, fontSize: '20px', fontWeight: 700, marginRight: '10px' }, children: ctaText } },
          { type: 'span', props: { style: { color: accentColor, fontSize: '20px', fontWeight: 900 }, children: '➔' } }
        ]
      }
    } : null;

    const textCol = {
      type: 'div',
      props: {
        style: { position: 'absolute', left: layout === 'LeftPerson' ? '70px' : '540px', top: '220px', width: '470px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
        children: [
          { type: 'span', props: { style: { color: mainTextColor, fontSize: '56px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px' }, children: slide.title_part1 || '' } },
          highlightTitle,
          leftCheckmarks,
          leftCtaButton
        ]
      }
    };

    const phoneCol = {
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          bottom: '120px',
          left: layout === 'LeftPerson' ? '580px' : '70px',
          width: '430px',
          height: '840px',
          borderRadius: '44px',
          border: `6px solid rgba(255,255,255,0.1)`,
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          backgroundColor: '#0d1520',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '110px',
                height: '24px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              },
              children: [
                { type: 'div', props: { style: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', opacity: 0.8 } } }
              ]
            }
          },
          {
            type: 'img',
            props: {
              src: fgBase64,
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }
            }
          }
        ]
      }
    };

    vdom = {
      type: 'div',
      props: {
        style: bgStyle,
        children: [
          ...bgGeometry,
          headerBadge,
          textCol,
          phoneCol,
          bottomRibbon
        ]
      }
    };
  } else {
    vdom = {
      type: 'div',
      props: {
        style: { ...bgStyle, justifyContent: 'center', alignItems: 'center', padding: '100px' },
        children: [
          ...bgGeometry,
          headerBadge,
          { type: 'span', props: { style: { color: mainTextColor, fontSize: '84px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', textAlign: 'center' }, children: slide.title_part1 || '' } },
          highlightTitle,
          checkmarksList,
          ctaButton,
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
