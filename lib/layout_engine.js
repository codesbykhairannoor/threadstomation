import fs from 'fs';
import path from 'path';

// ─── Satori fallback (used locally) ─────────────────────────────────────────
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const fontDir = path.join(process.cwd(), 'lib', 'fonts');
const interRegular = fs.readFileSync(path.join(fontDir, 'Inter-Regular.ttf'));
const interSemiBold = fs.readFileSync(path.join(fontDir, 'Inter-SemiBold.ttf'));
const interBlack = fs.readFileSync(path.join(fontDir, 'Inter-Black.ttf'));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseBodyToBullets(bodyText) {
  if (!bodyText) return [];
  const ctaWords = ['swipe', 'selengkapnya', 'detail', 'klik', 'link', 'kunjungi', 'baca', 'save', 'simpan'];
  return bodyText
    .split(/[,\n;]+/)
    .map(s => s.trim())
    .filter(s => {
      if (!s) return false;
      const lower = s.toLowerCase();
      return !ctaWords.some(w => lower.includes(w));
    });
}

function detectCTA(bodyText) {
  if (!bodyText) return null;
  const ctaWords = ['swipe', 'selengkapnya', 'detail', 'klik', 'link', 'kunjungi', 'baca', 'save', 'simpan'];
  for (const part of bodyText.split(/[,\n;]+/)) {
    const clean = part.trim();
    if (ctaWords.some(w => clean.toLowerCase().includes(w))) return clean;
  }
  return null;
}

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16)
  };
}

// ─── HTML Template Builder ────────────────────────────────────────────────────
function buildSlideHTML(slide, fgBase64, theme, badgeText) {
  const layout   = slide.layout_type || 'TextHeavy';
  const bg       = theme.bg1   || '#1e2a39';
  const accent   = theme.accent|| '#00ff8c';
  const text     = theme.text  || '#ffffff';
  const isLight  = text === '#1e2a39' || text === '#000000';

  const acc = hexToRgb(accent);
  const glowRgba  = `rgba(${acc.r},${acc.g},${acc.b},0.22)`;
  const glowSoft  = `rgba(${acc.r},${acc.g},${acc.b},0.10)`;
  const cardBg    = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBdr   = isLight ? 'rgba(0,0,0,0.08)'  : 'rgba(255,255,255,0.10)';
  const mutedText = isLight ? 'rgba(30,42,57,0.55)': 'rgba(255,255,255,0.45)';
  const hlTextCol = isLight ? '#ffffff' : '#1e2a39';

  const bullets = parseBodyToBullets(slide.body);
  const ctaText = detectCTA(slide.body);

  // Shared elements
  const bulletsHTML = bullets.map(b => `
    <div style="display:flex;align-items:center;background:${cardBg};border:1px solid ${cardBdr};
      border-radius:999px;padding:10px 22px;gap:10px;white-space:nowrap;">
      <span style="color:${accent};font-size:16px;font-weight:800;">✔</span>
      <span style="color:${text};font-size:15px;font-weight:600;letter-spacing:0.02em;">${b}</span>
    </div>`).join('');

  const ctaHTML = ctaText ? `
    <div style="display:flex;align-items:center;gap:10px;border:2px solid ${accent};
      border-radius:999px;padding:12px 28px;background:${cardBg};backdrop-filter:blur(8px);">
      <span style="color:${text};font-size:15px;font-weight:700;">${ctaText}</span>
      <span style="color:${accent};font-size:16px;font-weight:900;">→</span>
    </div>` : '';

  const hl2HTML = slide.title_part2 ? `
    <div style="display:inline-block;background:${accent};padding:10px 28px;border-radius:16px;
      margin-top:14px;box-shadow:0 8px 32px ${glowRgba};">
      <span style="color:${hlTextCol};font-size:48px;font-weight:900;letter-spacing:-0.03em;
        line-height:1.1;">${slide.title_part2}</span>
    </div>` : '';

  // ── per-layout body ──────────────────────────────────────────────────────
  let bodyHTML = '';

  if (layout === 'CenterMockup' && fgBase64) {
    bodyHTML = `
    <!-- Title block -->
    <div style="position:absolute;top:190px;left:80px;right:80px;
      display:flex;flex-direction:column;align-items:center;text-align:center;z-index:10;">
      <div style="font-size:52px;font-weight:900;color:${text};letter-spacing:-0.03em;
        line-height:1.1;max-width:860px;">${slide.title_part1 || ''}</div>
      ${hl2HTML}
      ${bullets.length ? `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:22px;justify-content:center;max-width:880px;">${bulletsHTML}</div>` : ''}
      ${ctaHTML ? `<div style="margin-top:22px;">${ctaHTML}</div>` : ''}
    </div>

    <!-- Browser Mockup -->
    <div style="position:absolute;bottom:120px;left:80px;right:80px;height:510px;
      border-radius:20px;overflow:hidden;border:1.5px solid ${cardBdr};
      box-shadow:0 30px 80px -10px ${glowRgba},0 10px 30px rgba(0,0,0,0.5);
      background:#0a0f1a;display:flex;flex-direction:column;
      transform:perspective(1200px) rotateX(5deg);transform-origin:center bottom;">
      <!-- Browser Bar -->
      <div style="height:42px;background:rgba(255,255,255,0.04);border-bottom:1px solid ${cardBdr};
        display:flex;align-items:center;padding:0 18px;position:relative;flex-shrink:0;">
        <div style="display:flex;gap:7px;">
          <div style="width:11px;height:11px;border-radius:50%;background:#ff5f56;"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:#ffbd2e;"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:#27c93f;"></div>
        </div>
        <div style="position:absolute;left:50%;transform:translateX(-50%);
          width:320px;height:22px;background:rgba(255,255,255,0.07);border-radius:999px;
          display:flex;align-items:center;justify-content:center;">
          <span style="color:rgba(255,255,255,0.3);font-size:11px;font-family:monospace;">sharesa.space</span>
        </div>
      </div>
      <!-- Screen -->
      <div style="flex:1;overflow:hidden;">
        <img src="${fgBase64}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block;" />
      </div>
    </div>`;

  } else if ((layout === 'LeftPerson' || layout === 'RightPerson') && fgBase64) {
    const isLeft = layout === 'LeftPerson';
    const textCol = `
      <div style="display:flex;flex-direction:column;align-items:flex-start;width:460px;gap:0;">
        <div style="font-size:50px;font-weight:900;color:${text};letter-spacing:-0.03em;line-height:1.1;">
          ${slide.title_part1 || ''}
        </div>
        ${hl2HTML}
        ${bullets.length ? `<div style="display:flex;flex-direction:column;gap:10px;margin-top:22px;width:100%;">${bulletsHTML}</div>` : ''}
        ${ctaHTML ? `<div style="margin-top:24px;">${ctaHTML}</div>` : ''}
      </div>`;

    const phoneCol = `
      <div style="width:370px;height:750px;position:relative;flex-shrink:0;
        transform:perspective(1200px) ${isLeft ? 'rotateY(-12deg) rotateZ(-1.5deg)' : 'rotateY(12deg) rotateZ(1.5deg)'};
        filter:drop-shadow(0 40px 80px ${glowRgba});">
        <!-- Phone bezel -->
        <div style="width:100%;height:100%;border-radius:40px;border:6px solid rgba(255,255,255,0.12);
          background:#0a0f1a;overflow:hidden;position:relative;">
          <!-- Camera notch -->
          <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);
            width:90px;height:18px;background:rgba(255,255,255,0.08);border-radius:999px;z-index:10;
            display:flex;align-items:center;justify-content:center;">
            <div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15);"></div>
          </div>
          <!-- Screen image -->
          <img src="${fgBase64}" style="width:100%;height:100%;object-fit:cover;display:block;" />
        </div>
      </div>`;

    bodyHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;align-items:center;justify-content:space-between;
      padding:200px 90px 140px;flex-direction:${isLeft ? 'row' : 'row-reverse'};gap:40px;z-index:10;">
      ${textCol}
      ${phoneCol}
    </div>`;

  } else {
    // TextHeavy
    bodyHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:190px 100px 140px;text-align:center;z-index:10;gap:0;">
      <div style="font-size:68px;font-weight:900;color:${text};letter-spacing:-0.04em;
        line-height:1.05;max-width:860px;">${slide.title_part1 || ''}</div>
      ${hl2HTML}
      ${bullets.length ? `<div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:28px;justify-content:center;max-width:860px;">${bulletsHTML}</div>` : ''}
      ${ctaHTML ? `<div style="margin-top:28px;">${ctaHTML}</div>` : ''}
    </div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{
    font-family:'Plus Jakarta Sans',sans-serif;
    width:1080px;height:1350px;overflow:hidden;
    background:${bg};color:${text};position:relative;
  }
</style>
</head>
<body>

<!-- Ambient glow blobs -->
<div style="position:absolute;top:-20%;right:-20%;width:900px;height:900px;border-radius:50%;
  background:${accent};opacity:0.07;filter:blur(120px);pointer-events:none;"></div>
<div style="position:absolute;bottom:-20%;left:-20%;width:800px;height:800px;border-radius:50%;
  background:${accent};opacity:0.05;filter:blur(120px);pointer-events:none;"></div>

<!-- Left accent stripe -->
<div style="position:absolute;left:0;top:0;width:6px;height:100%;background:${accent};"></div>

<!-- Header badge -->
<div style="position:absolute;top:78px;left:78px;z-index:20;
  display:flex;align-items:center;gap:10px;
  background:${cardBg};backdrop-filter:blur(12px);border:1px solid ${cardBdr};
  border-radius:999px;padding:10px 22px;">
  <div style="width:8px;height:8px;border-radius:50%;background:${accent};
    box-shadow:0 0 10px ${accent};flex-shrink:0;"></div>
  <span style="color:${text};font-size:12px;font-weight:700;letter-spacing:0.18em;
    text-transform:uppercase;opacity:0.85;">${badgeText}</span>
</div>

<!-- Main content -->
${bodyHTML}

<!-- Bottom ribbon -->
<div style="position:absolute;bottom:0;left:0;right:0;height:62px;z-index:20;
  border-top:1px solid ${cardBdr};background:rgba(0,0,0,0.2);backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:space-between;padding:0 80px;">
  <span style="color:${mutedText};font-size:13px;font-weight:500;letter-spacing:0.05em;">www.sharesa.space</span>
  <span style="color:${mutedText};font-size:13px;font-weight:500;letter-spacing:0.05em;">${badgeText}</span>
</div>

</body>
</html>`;
}

// ─── Puppeteer renderer (Vercel / production) ─────────────────────────────────
async function renderViaPuppeteer(html) {
  let chromium, puppeteer;
  try {
    chromium  = (await import('@sparticuz/chromium')).default;
    puppeteer = (await import('puppeteer-core')).default;
  } catch (e) {
    throw new Error(`Puppeteer/Chromium not available: ${e.message}`);
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
    const buffer = await page.screenshot({ type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    return buffer;
  } finally {
    await browser.close();
  }
}

// ─── Satori fallback renderer (local / non-Vercel) ───────────────────────────
async function renderViaSatori(slide, foregroundBuffer, theme, badgeText) {
  const fgBase64    = foregroundBuffer ? `data:image/png;base64,${foregroundBuffer.toString('base64')}` : null;
  const layout      = slide.layout_type || 'TextHeavy';
  const mainTextColor = theme.text   || '#ffffff';
  const accentColor   = theme.accent || '#00ff8c';
  const solidBg       = theme.bg1    || '#1e2a39';

  const bgStyle = {
    display:'flex', flexDirection:'column',
    width:'1080px', height:'1350px',
    backgroundColor: solidBg,
    fontFamily:'Inter', position:'relative', overflow:'hidden'
  };

  const bullets  = parseBodyToBullets(slide.body);
  const ctaText  = detectCTA(slide.body);
  const hlTextC  = accentColor === '#1e2a39' ? '#ffffff' : '#1e2a39';

  const headerBadge = {
    type:'div', props:{ style:{
      position:'absolute',top:'70px',left:'70px',
      background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:'14px',padding:'12px 28px',display:'flex',alignItems:'center'
    }, children:[
      {type:'span',props:{style:{color:accentColor,fontSize:'20px',marginRight:'10px',fontWeight:900},children:'●'}},
      {type:'span',props:{style:{color:mainTextColor,fontSize:'18px',fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase'},children:badgeText}}
    ]}
  };

  const bottomRibbon = {
    type:'div', props:{ style:{
      position:'absolute',bottom:'0',left:'0',width:'1080px',height:'62px',
      background:'rgba(0,0,0,0.25)',display:'flex',justifyContent:'space-between',
      alignItems:'center',padding:'0 70px',borderTop:'1px solid rgba(255,255,255,0.08)'
    }, children:[
      {type:'span',props:{style:{color:mainTextColor,fontSize:'16px',fontWeight:500,opacity:0.5},children:'www.sharesa.space'}},
      {type:'span',props:{style:{color:mainTextColor,fontSize:'16px',fontWeight:500,opacity:0.5},children:badgeText}}
    ]}
  };

  const leftStripe = {type:'div',props:{style:{position:'absolute',left:0,top:0,width:'6px',height:'100%',background:accentColor,display:'flex'}}};

  const hl2 = slide.title_part2 ? {
    type:'div',props:{style:{background:accentColor,padding:'10px 28px',borderRadius:'14px',marginTop:'14px',display:'flex'},
    children:[{type:'span',props:{style:{color:hlTextC,fontSize:'52px',fontWeight:900,lineHeight:1.1,letterSpacing:'-2px'},children:slide.title_part2}}]}
  } : null;

  const ctaBtn = ctaText ? {
    type:'div',props:{style:{display:'flex',alignItems:'center',border:`2px solid ${accentColor}`,
      borderRadius:'999px',padding:'12px 28px',marginTop:'24px',background:'rgba(255,255,255,0.04)'},
    children:[
      {type:'span',props:{style:{color:mainTextColor,fontSize:'18px',fontWeight:700,marginRight:'10px'},children:ctaText}},
      {type:'span',props:{style:{color:accentColor,fontSize:'18px',fontWeight:900},children:'→'}}
    ]}
  } : null;

  const pillList = bullets.length ? {
    type:'div',props:{style:{display:'flex',flexWrap:'wrap',gap:'12px',marginTop:'22px',justifyContent:'center',maxWidth:'880px'},
    children:bullets.map(b=>({
      type:'div',props:{style:{display:'flex',alignItems:'center',background:'rgba(255,255,255,0.06)',
        border:'1px solid rgba(255,255,255,0.10)',borderRadius:'999px',padding:'10px 22px'},
      children:[
        {type:'span',props:{style:{color:accentColor,fontSize:'18px',marginRight:'10px',fontWeight:900},children:'✔'}},
        {type:'span',props:{style:{color:mainTextColor,fontSize:'16px',fontWeight:600},children:b}}
      ]}
    }))}
  } : null;

  let vdom;

  if (layout === 'CenterMockup' && fgBase64) {
    vdom = {type:'div',props:{style:bgStyle,children:[
      leftStripe, headerBadge,
      {type:'div',props:{style:{position:'absolute',top:'180px',left:'80px',width:'920px',
        display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'},
        children:[
          {type:'span',props:{style:{color:mainTextColor,fontSize:'52px',fontWeight:900,lineHeight:1.1,letterSpacing:'-2px'},children:slide.title_part1||''}},
          hl2, pillList,
          ctaBtn ? {type:'div',props:{style:{marginTop:'22px',display:'flex'},children:[ctaBtn]}} : null
        ].filter(Boolean)}},
      {type:'div',props:{style:{position:'absolute',bottom:'120px',left:'80px',right:'80px',height:'510px',
        borderRadius:'20px',overflow:'hidden',border:'1.5px solid rgba(255,255,255,0.08)',
        boxShadow:'0 30px 60px rgba(0,0,0,0.5)',backgroundColor:'#0a0f1a',
        display:'flex',flexDirection:'column'},
        children:[
          {type:'div',props:{style:{height:'42px',backgroundColor:'rgba(255,255,255,0.04)',
            borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',padding:'0 18px',position:'relative'},
            children:[
              {type:'div',props:{style:{display:'flex',gap:'7px'},children:[
                {type:'div',props:{style:{width:'11px',height:'11px',borderRadius:'50%',backgroundColor:'#ff5f56'}}},
                {type:'div',props:{style:{width:'11px',height:'11px',borderRadius:'50%',backgroundColor:'#ffbd2e'}}},
                {type:'div',props:{style:{width:'11px',height:'11px',borderRadius:'50%',backgroundColor:'#27c93f'}}}
              ]}}
            ]}},
          {type:'img',props:{src:fgBase64,style:{width:'100%',height:'100%',objectFit:'cover'}}}
        ]}},
      bottomRibbon
    ]}};

  } else if ((layout==='LeftPerson'||layout==='RightPerson') && fgBase64) {
    const isLeft = layout==='LeftPerson';
    const pillsLeft = bullets.length ? {
      type:'div',props:{style:{display:'flex',flexDirection:'column',gap:'10px',marginTop:'22px'},
      children:bullets.map(b=>({
        type:'div',props:{style:{display:'flex',alignItems:'center',background:'rgba(255,255,255,0.05)',
          border:'1px solid rgba(255,255,255,0.09)',borderRadius:'999px',padding:'10px 20px'},
        children:[
          {type:'span',props:{style:{color:accentColor,fontSize:'18px',marginRight:'10px',fontWeight:900},children:'✔'}},
          {type:'span',props:{style:{color:mainTextColor,fontSize:'16px',fontWeight:600},children:b}}
        ]}
      }))}
    } : null;

    const textBlock = {type:'div',props:{style:{
      position:'absolute', left:(isLeft?'80px':'540px'), top:'200px', width:'450px',
      display:'flex',flexDirection:'column',alignItems:'flex-start'},
      children:[
        {type:'span',props:{style:{color:mainTextColor,fontSize:'50px',fontWeight:900,lineHeight:1.1,letterSpacing:'-2px'},children:slide.title_part1||''}},
        hl2, pillsLeft, ctaBtn
      ].filter(Boolean)}};

    const phoneBlock = {type:'div',props:{style:{
      position:'absolute', right:(isLeft?'80px':'auto'), left:(isLeft?'auto':'80px'), bottom:'100px',
      width:'370px',height:'750px',borderRadius:'40px',border:'6px solid rgba(255,255,255,0.12)',
      backgroundColor:'#0a0f1a',overflow:'hidden',display:'flex',flexDirection:'column'},
      children:[
        {type:'div',props:{style:{position:'absolute',top:'12px',left:'50%',
          transform:'translateX(-50%)',width:'90px',height:'18px',
          backgroundColor:'rgba(255,255,255,0.08)',borderRadius:'999px',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:10},
          children:[{type:'div',props:{style:{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:'rgba(255,255,255,0.15)'}}}]}},
        {type:'img',props:{src:fgBase64,style:{width:'100%',height:'100%',objectFit:'cover'}}}
      ]}};

    vdom = {type:'div',props:{style:bgStyle,children:[leftStripe,headerBadge,textBlock,phoneBlock,bottomRibbon]}};

  } else {
    vdom = {type:'div',props:{style:{...bgStyle,justifyContent:'center',alignItems:'center',padding:'180px 100px 120px'},
      children:[
        leftStripe, headerBadge,
        {type:'span',props:{style:{color:mainTextColor,fontSize:'68px',fontWeight:900,lineHeight:1.05,letterSpacing:'-3px',textAlign:'center'},children:slide.title_part1||''}},
        hl2, pillList,
        ctaBtn ? {type:'div',props:{style:{marginTop:'28px',display:'flex'},children:[ctaBtn]}} : null,
        bottomRibbon
      ].filter(Boolean)}};
  }

  const svg = await satori(vdom, {
    width:1080, height:1350,
    fonts:[
      {name:'Inter',data:interRegular, weight:400,style:'normal'},
      {name:'Inter',data:interSemiBold,weight:600,style:'normal'},
      {name:'Inter',data:interBlack,   weight:900,style:'normal'}
    ]
  });

  return new Resvg(svg, {background:solidBg,fitTo:{mode:'width',value:1080}}).render().asPng();
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export async function renderSlideToBuffer(slide, foregroundBuffer, theme, badgeText) {
  const isVercel = !!process.env.VERCEL;
  const fgBase64 = foregroundBuffer
    ? `data:image/png;base64,${foregroundBuffer.toString('base64')}`
    : null;

  if (isVercel) {
    // Production: headless Chrome → pixel-perfect CSS
    try {
      const html = buildSlideHTML(slide, fgBase64, theme, badgeText);
      console.log(`[LayoutEngine] Rendering via Puppeteer (Vercel) — layout: ${slide.layout_type}`);
      return await renderViaPuppeteer(html);
    } catch (e) {
      console.error('[LayoutEngine] ❌ Puppeteer failed, falling back to Satori:', e.message);
    }
  } else {
    console.log(`[LayoutEngine] Local mode — using Satori fallback (layout: ${slide.layout_type})`);
  }

  return await renderViaSatori(slide, foregroundBuffer, theme, badgeText);
}
