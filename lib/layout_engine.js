/**
 * layout_engine.js — Sharp + SVG string renderer
 * Community-recommended approach for Vercel free tier:
 * SVG template injection → Sharp rasterize → JPEG buffer
 * No Satori, no Puppeteer, no external dependencies.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const W = 1080;
const H = 1350;
const fontDir = path.join(process.cwd(), 'lib', 'fonts');

// ─── Font embedding (base64 in SVG @font-face) ─────────────────────────────
function loadFontB64(filename) {
  try { return fs.readFileSync(path.join(fontDir, filename)).toString('base64'); } catch { return ''; }
}

const FONT_REGULAR  = loadFontB64('Inter-Regular.ttf');
const FONT_SEMIBOLD = loadFontB64('Inter-SemiBold.ttf');
const FONT_BLACK    = loadFontB64('Inter-Black.ttf');

const FONT_CSS = [
  FONT_REGULAR  && `@font-face{font-family:'Inter';font-weight:400;src:url('data:font/truetype;base64,${FONT_REGULAR}');}`,
  FONT_SEMIBOLD && `@font-face{font-family:'Inter';font-weight:600;src:url('data:font/truetype;base64,${FONT_SEMIBOLD}');}`,
  FONT_BLACK    && `@font-face{font-family:'Inter';font-weight:900;src:url('data:font/truetype;base64,${FONT_BLACK}');}`,
].filter(Boolean).join('');

// ─── Utility ──────────────────────────────────────────────────────────────────
const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function hexToRgb(hex) {
  const c = (hex || '#000').replace('#', '');
  const f = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  return { r: parseInt(f.slice(0, 2), 16) || 0, g: parseInt(f.slice(2, 4), 16) || 0, b: parseInt(f.slice(4, 6), 16) || 0 };
}
function darkenHex(hex, f = 0.6) {
  const { r, g, b } = hexToRgb(hex);
  const h = v => Math.max(0, Math.round(v * f)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function lum({ r, g, b }) { return 0.299 * r + 0.587 * g + 0.114 * b; }

// Estimate pixel width for SVG text wrapping
function estW(text, size, weight = 900) {
  return (text || '').length * size * (weight >= 900 ? 0.62 : weight >= 600 ? 0.57 : 0.52);
}

// Word-wrap text into lines that fit maxPx
function wrapText(text, maxPx, size, weight = 900) {
  if (!text) return [''];
  const words = text.split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (estW(t, size, weight) > maxPx && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

const SKIP_WORDS = ['swipe', 'selengkapnya', 'detail', 'klik', 'link', 'kunjungi', 'baca', 'save', 'simpan', '>>'];
function parseBodyToBullets(body) {
  if (!body) return [];
  return body.split(/[,;\n]+/).map(s => s.trim()).filter(s => s && !SKIP_WORDS.some(w => s.toLowerCase().includes(w)));
}
function detectCTA(body) {
  for (const p of (body || '').split(/[,;\n]+/)) {
    const c = p.trim();
    if (SKIP_WORDS.some(w => c.toLowerCase().includes(w))) return c;
  }
  return null;
}

// Unique ID generator for SVG clip paths
let _uid = 0;
const uid = () => `c${(++_uid).toString(36)}`;

// ─── SVG Element Builders ─────────────────────────────────────────────────────

/** Render centered multiline text. Returns [svgStr, endY] */
function svgTextCentered(lines, y, size, weight, fill, opacity = 1) {
  if (!lines.length) return ['', y];
  const lh = Math.round(size * 1.18);
  const tspans = lines.map((l, i) => `<tspan x="540" ${i ? `dy="${lh}"` : ''}>${esc(l)}</tspan>`).join('');
  return [
    `<text x="540" y="${y}" text-anchor="middle" font-family="Inter,Arial,sans-serif"
      font-weight="${weight}" font-size="${size}" letter-spacing="-0.03em"
      fill="${esc(fill)}" opacity="${opacity}">${tspans}</text>`,
    y + (lines.length - 1) * lh + size
  ];
}

/** Render left-aligned multiline text. Returns [svgStr, endY] */
function svgTextLeft(lines, x, y, size, weight, fill) {
  if (!lines.length) return ['', y];
  const lh = Math.round(size * 1.18);
  const tspans = lines.map((l, i) => `<tspan x="${x}" ${i ? `dy="${lh}"` : ''}>${esc(l)}</tspan>`).join('');
  return [
    `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif"
      font-weight="${weight}" font-size="${size}" letter-spacing="-0.03em"
      fill="${esc(fill)}">${tspans}</text>`,
    y + (lines.length - 1) * lh + size
  ];
}

/** Centered neon highlight rect + text. Returns [svgStr, endY] */
function svgHighlightCentered(text, y, accent, hlText) {
  if (!text) return ['', y];
  const fs = 50; const ph = 22; const pv = 8;
  const tw = estW(text, fs); const rw = tw + ph * 2; const rh = fs + pv * 2 + 8;
  const rx2 = 14; const rx = 540 - rw / 2;
  return [
    `<rect x="${rx}" y="${y}" width="${rw}" height="${rh}" rx="${rx2}" fill="${esc(accent)}"/>
     <text x="540" y="${y + rh - pv - 4}" text-anchor="middle" font-family="Inter,Arial,sans-serif"
       font-weight="900" font-size="${fs}" letter-spacing="-0.03em" fill="${esc(hlText)}">${esc(text)}</text>`,
    y + rh + 4
  ];
}

/** Left-aligned neon highlight rect + text. Returns [svgStr, endY] */
function svgHighlightLeft(text, x, y, accent, hlText) {
  if (!text) return ['', y];
  const fs = 44; const ph = 20; const pv = 8;
  const tw = estW(text, fs); const rw = tw + ph * 2; const rh = fs + pv * 2 + 8;
  const rx = 12;
  return [
    `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="${rx}" fill="${esc(accent)}"/>
     <text x="${x + ph}" y="${y + rh - pv - 4}" font-family="Inter,Arial,sans-serif"
       font-weight="900" font-size="${fs}" letter-spacing="-0.03em" fill="${esc(hlText)}">${esc(text)}</text>`,
    y + rh + 4
  ];
}

/** Centered bullet pills. Returns [svgStr, endY] */
function svgBulletsCentered(bullets, y, accent, textCol, cardFill, cardStroke) {
  if (!bullets.length) return ['', y];
  const ph = 48; const gap = 12; const padX = 18; const fs = 15; const checkW = 26;
  let svg = '';
  for (const b of bullets) {
    const tw = estW(b, fs, 600);
    const pw = checkW + padX * 2 + tw + 12;
    const px = 540 - pw / 2;
    svg += `<rect x="${px}" y="${y}" width="${pw}" height="${ph}" rx="${ph / 2}"
      fill="${esc(cardFill)}" stroke="${esc(cardStroke)}" stroke-width="1"/>
    <text x="${px + padX}" y="${y + 31}" font-family="Inter,Arial,sans-serif"
      font-weight="700" font-size="17" fill="${esc(accent)}">✔</text>
    <text x="${px + padX + checkW}" y="${y + 31}" font-family="Inter,Arial,sans-serif"
      font-weight="600" font-size="${fs}" fill="${esc(textCol)}">${esc(b)}</text>`;
    y += ph + gap;
  }
  return [svg, y];
}

/** Left-aligned bullet pills. Returns [svgStr, endY] */
function svgBulletsLeft(bullets, x, y, accent, textCol, cardFill, cardStroke, maxW) {
  if (!bullets.length) return ['', y];
  const ph = 44; const gap = 10; const padX = 16; const fs = 14; const checkW = 24;
  let svg = '';
  for (const b of bullets) {
    const pw = Math.min(checkW + padX * 2 + estW(b, fs, 600) + 10, maxW);
    svg += `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="${ph / 2}"
      fill="${esc(cardFill)}" stroke="${esc(cardStroke)}" stroke-width="1"/>
    <text x="${x + padX}" y="${y + 28}" font-family="Inter,Arial,sans-serif"
      font-weight="700" font-size="16" fill="${esc(accent)}">✔</text>
    <text x="${x + padX + checkW}" y="${y + 28}" font-family="Inter,Arial,sans-serif"
      font-weight="600" font-size="${fs}" fill="${esc(textCol)}">${esc(b)}</text>`;
    y += ph + gap;
  }
  return [svg, y];
}

/** macOS-style browser window mockup with screen image */
function svgBrowserMockup(fgBase64, x, y, w, h, cardStroke) {
  const barH = 46; const rx = 18;
  const id = uid();
  const urlW = 280; const urlX = x + w / 2 - urlW / 2;
  return `<defs>
    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>
  </defs>
  <!-- Shadow -->
  <rect x="${x + 6}" y="${y + 10}" width="${w}" height="${h}" rx="${rx}" fill="rgba(0,0,0,0.45)"/>
  <!-- Frame -->
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"
    fill="#0c1017" stroke="${esc(cardStroke)}" stroke-width="1.5"/>
  <!-- Title bar -->
  <rect x="${x}" y="${y}" width="${w}" height="${barH}" rx="${rx}" fill="rgba(255,255,255,0.04)"/>
  <rect x="${x}" y="${y + rx}" width="${w}" height="${barH - rx}" fill="rgba(255,255,255,0.04)"/>
  <!-- Bar separator -->
  <rect x="${x}" y="${y + barH}" width="${w}" height="1" fill="${esc(cardStroke)}"/>
  <!-- Traffic lights -->
  <circle cx="${x + 26}" cy="${y + 23}" r="7" fill="#ff5f56"/>
  <circle cx="${x + 48}" cy="${y + 23}" r="7" fill="#ffbd2e"/>
  <circle cx="${x + 70}" cy="${y + 23}" r="7" fill="#27c93f"/>
  <!-- URL bar -->
  <rect x="${urlX}" y="${y + 12}" width="${urlW}" height="22" rx="11" fill="rgba(255,255,255,0.07)"/>
  <text x="${x + w / 2}" y="${y + 27}" text-anchor="middle"
    font-family="monospace" font-size="11" fill="rgba(255,255,255,0.28)">sharesa.space</text>
  ${fgBase64
    ? `<image href="${fgBase64}" x="${x}" y="${y + barH}" width="${w}" height="${h - barH}"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
    : `<rect x="${x}" y="${y + barH}" width="${w}" height="${h - barH}" fill="rgba(255,255,255,0.03)"/>`
  }`;
}

/** Smartphone mockup with screen image */
function svgPhoneMockup(fgBase64, x, y, w, h, cardStroke) {
  const rx = 42; const notchW = 90; const notchH = 20;
  const notchX = x + w / 2 - notchW / 2; const notchY = y + 14;
  const id = uid();
  return `<defs>
    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>
  </defs>
  <!-- Shadow -->
  <rect x="${x + 7}" y="${y + 12}" width="${w}" height="${h}" rx="${rx}" fill="rgba(0,0,0,0.45)"/>
  <!-- Bezel -->
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"
    fill="#0c1017" stroke="${esc(cardStroke)}" stroke-width="6"/>
  ${fgBase64
    ? `<image href="${fgBase64}" x="${x}" y="${y}" width="${w}" height="${h}"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="rgba(255,255,255,0.03)"/>`
  }
  <!-- Notch overlay -->
  <rect x="${notchX}" y="${notchY}" width="${notchW}" height="${notchH}" rx="${notchH / 2}" fill="rgba(0,0,0,0.75)"/>
  <circle cx="${x + w / 2}" cy="${notchY + notchH / 2}" r="4" fill="rgba(255,255,255,0.12)"/>`;
}

// ─── Master SVG Builder ───────────────────────────────────────────────────────
function buildSVG(slide, fgBase64, theme, badgeText) {
  const bg1    = theme.bg1    || '#1a2236';
  const accent = theme.accent || '#00e87a';
  const textCol = theme.text  || '#ffffff';
  const layout = slide.layout_type || 'TextHeavy';
  const bg2 = darkenHex(bg1, 0.58);

  const accRgb  = hexToRgb(accent);
  const hlText  = lum(accRgb) > 145 ? '#0a0a0a' : '#ffffff';
  const isDark  = lum(hexToRgb(textCol)) > 128;
  const cardFill   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const cardStroke = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.10)';
  const mutedText  = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)';

  const bullets = parseBodyToBullets(slide.body);
  const ctaText = detectCTA(slide.body);
  const title1  = slide.title_part1 || '';
  const title2  = slide.title_part2 || '';
  const badgeW  = Math.max(180, (badgeText || '').length * 9 + 80);

  // ── Shared shell ───────────────────────────────────────────────────────────
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>${FONT_CSS}</style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="${esc(bg1)}"/>
      <stop offset="100%" stop-color="${esc(bg2)}"/>
    </linearGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="80"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Ambient glow top-right -->
  <circle cx="1160" cy="-80" r="540" fill="${esc(accent)}" filter="url(#glow)" opacity="0.09"/>
  <!-- Ambient glow bottom-left -->
  <circle cx="-80" cy="1450" r="480" fill="${esc(accent)}" filter="url(#glow)" opacity="0.07"/>

  <!-- Left accent stripe -->
  <rect x="0" y="0" width="6" height="${H}" fill="${esc(accent)}"/>

  <!-- Header badge -->
  <rect x="78" y="58" width="${badgeW}" height="44" rx="22"
    fill="${esc(cardFill)}" stroke="${esc(cardStroke)}" stroke-width="1"/>
  <circle cx="107" cy="80" r="5" fill="${esc(accent)}"/>
  <text x="122" y="86" font-family="Inter,Arial,sans-serif" font-weight="700" font-size="12"
    letter-spacing="0.16em" fill="${esc(textCol)}" opacity="0.85">${esc((badgeText || '').toUpperCase())}</text>
  `];

  // ── Layout-specific ────────────────────────────────────────────────────────

  if (layout === 'CenterMockup' && fgBase64) {
    let y = 196;

    // Title part1
    const t1Lines = wrapText(title1, 880, 64);
    const [t1Svg, t1EndY] = svgTextCentered(t1Lines, y, 64, 900, textCol);
    parts.push(t1Svg); y = t1EndY + 16;

    // Highlight
    const [hlSvg, hlEndY] = svgHighlightCentered(title2, y, accent, hlText);
    parts.push(hlSvg); if (title2) y = hlEndY + 20;

    // Bullets
    const [bSvg, bEndY] = svgBulletsCentered(bullets, y, accent, textCol, cardFill, cardStroke);
    parts.push(bSvg); if (bullets.length) y = bEndY + 12;

    // CTA
    if (ctaText) {
      const cw = estW(ctaText, 15, 700) + 100;
      const cx = 540 - cw / 2;
      parts.push(`<rect x="${cx}" y="${y}" width="${cw}" height="44" rx="22"
        fill="${esc(cardFill)}" stroke="${esc(accent)}" stroke-width="1.5"/>
      <text x="540" y="${y + 28}" text-anchor="middle" font-family="Inter,Arial,sans-serif"
        font-weight="700" font-size="15" fill="${esc(textCol)}">${esc(ctaText)} →</text>`);
      y += 58;
    }

    // Browser mockup
    const my = Math.max(y + 32, 570);
    const mh = 1272 - my;
    if (mh > 180) parts.push(svgBrowserMockup(fgBase64, 80, my, 920, mh, cardStroke));

  } else if ((layout === 'LeftPerson' || layout === 'RightPerson') && fgBase64) {
    const isLeft = layout === 'LeftPerson';
    const tx = isLeft ? 80 : 590;
    const tmaxW = 440;
    const px = isLeft ? 590 : 60;
    const pw = 400; const ph = 960; const py = 170;

    let y = 238;
    const t1Lines = wrapText(title1, tmaxW, 50);
    const [t1Svg, t1EndY] = svgTextLeft(t1Lines, tx, y, 50, 900, textCol);
    parts.push(t1Svg); y = t1EndY + 18;

    const [hlSvg, hlEndY] = svgHighlightLeft(title2, tx, y, accent, hlText);
    parts.push(hlSvg); if (title2) y = hlEndY + 20;

    const [bSvg, bEndY] = svgBulletsLeft(bullets, tx, y, accent, textCol, cardFill, cardStroke, tmaxW);
    parts.push(bSvg); if (bullets.length) y = bEndY + 12;

    if (ctaText) {
      const cw = Math.min(estW(ctaText, 14, 700) + 80, tmaxW);
      parts.push(`<rect x="${tx}" y="${y}" width="${cw}" height="42" rx="21"
        fill="${esc(cardFill)}" stroke="${esc(accent)}" stroke-width="1.5"/>
      <text x="${tx + 20}" y="${y + 27}" font-family="Inter,Arial,sans-serif"
        font-weight="700" font-size="14" fill="${esc(textCol)}">${esc(ctaText)} →</text>`);
    }

    parts.push(svgPhoneMockup(fgBase64, px, py, pw, ph, cardStroke));

  } else {
    // TextHeavy (also fallback if no image)
    const fs = 70;
    const t1Lines = wrapText(title1, 880, fs);
    const lh = Math.round(fs * 1.18);
    const totalH = t1Lines.length * lh + (title2 ? 86 : 0) + (bullets.length * 62) + 80;
    let y = Math.max(Math.round((H - 120 - totalH) / 2) + 100, 210);

    const [t1Svg, t1EndY] = svgTextCentered(t1Lines, y, fs, 900, textCol);
    parts.push(t1Svg); y = t1EndY + 20;

    const [hlSvg, hlEndY] = svgHighlightCentered(title2, y, accent, hlText);
    parts.push(hlSvg); if (title2) y = hlEndY + 24;

    const [bSvg, bEndY] = svgBulletsCentered(bullets, y, accent, textCol, cardFill, cardStroke);
    parts.push(bSvg); if (bullets.length) y = bEndY + 16;

    if (ctaText) {
      const cw = estW(ctaText, 16, 700) + 100;
      const cx = 540 - cw / 2;
      parts.push(`<rect x="${cx}" y="${y}" width="${cw}" height="48" rx="24"
        fill="${esc(cardFill)}" stroke="${esc(accent)}" stroke-width="2"/>
      <text x="540" y="${y + 31}" text-anchor="middle" font-family="Inter,Arial,sans-serif"
        font-weight="700" font-size="16" fill="${esc(textCol)}">${esc(ctaText)} →</text>`);
    }
  }

  // ── Bottom ribbon ──────────────────────────────────────────────────────────
  parts.push(`
  <rect x="0" y="1288" width="${W}" height="62" fill="rgba(0,0,0,0.38)"/>
  <rect x="0" y="1288" width="${W}" height="1" fill="${esc(cardStroke)}"/>
  <text x="80" y="1326" font-family="Inter,Arial,sans-serif" font-weight="400"
    font-size="14" fill="${esc(mutedText)}">www.sharesa.space</text>
  <text x="1000" y="1326" text-anchor="end" font-family="Inter,Arial,sans-serif"
    font-weight="400" font-size="14" fill="${esc(mutedText)}">${esc(badgeText)}</text>
  </svg>`);

  return parts.join('\n');
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export async function renderSlideToBuffer(slide, foregroundBuffer, theme, badgeText) {
  // Convert AI image to JPEG base64 for embedding in SVG (smaller than PNG)
  let fgBase64 = null;
  if (foregroundBuffer) {
    const jpgBuf = await sharp(foregroundBuffer).jpeg({ quality: 88 }).toBuffer();
    fgBase64 = `data:image/jpeg;base64,${jpgBuf.toString('base64')}`;
  }

  const svg = buildSVG(slide, fgBase64, theme, badgeText);
  console.log(`[LayoutEngine] SVG render — layout: ${slide.layout_type}, hasImage: ${!!fgBase64}, svgSize: ${Math.round(svg.length / 1024)}KB`);

  return sharp(Buffer.from(svg))
    .resize(W, H)
    .jpeg({ quality: 93 })
    .toBuffer();
}
