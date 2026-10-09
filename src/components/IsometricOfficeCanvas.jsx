import React, { useRef, useEffect, useState, useMemo } from 'react';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ISOMETRIC 2.5D OFFICE ENGINE (Canvas Pixel Art War Room)
 * ══════════════════════════════════════════════════════════════════════════════
 * Renders an interactive 2.5D isometric office floor identical to game simulations:
 * - 45° isometric projection with depth sorting (painter's algorithm)
 * - Animated characters typing at dual-monitor desks with glowing screens
 * - Floating speech bubbles with real database status & quotes
 * - Rooms: Open Office, Creative Studio, Dev/Server Lab, Coffee Lounge & Meeting
 * - Pan & Zoom camera navigation, click-to-inspect hit testing
 * ══════════════════════════════════════════════════════════════════════════════
 */

// Tile dimensions in 2:1 isometric ratio
const TILE_W = 64;
const TILE_H = 32;

// Isometric to Screen projection
function isoToScreen(gx, gy, gz, camX, camY, zoom) {
  const sx = (gx - gy) * (TILE_W / 2) * zoom + camX;
  const sy = (gx + gy) * (TILE_H / 2) * zoom - gz * TILE_H * zoom + camY;
  return { x: sx, y: sy };
}

// Screen to Isometric grid (approximate on ground gz=0)
function screenToIso(sx, sy, camX, camY, zoom) {
  const dx = (sx - camX) / zoom;
  const dy = (sy - camY) / zoom;
  const gx = (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2;
  const gy = (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2;
  return { gx, gy };
}

export default function IsometricOfficeCanvas({ workers = [], onSelectWorker, activeWorkerId }) {
  const canvasRef = useRef(null);

  // Camera state (Pan & Zoom)
  const [camera, setCamera] = useState({ x: 0, y: 120, zoom: 1.15 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredWorkerId, setHoveredWorkerId] = useState(null);

  // Map of 15 worker desk positions across office zones
  const deskPositions = useMemo(() => {
    // Layout grid (x, y, zoneName, direction)
    return [
      // Zone 1: Meta Social Hub (Threads 4 bots)
      { id: 'threads-1', gx: 5, gy: 3, role: 'threads', dir: 'SE', zone: 'Threads Desk' },
      { id: 'threads-6', gx: 7, gy: 3, role: 'threads', dir: 'SE', zone: 'Threads Desk' },
      { id: 'threads-3', gx: 5, gy: 5, role: 'threads', dir: 'SE', zone: 'Threads Desk' },
      { id: 'threads-7', gx: 7, gy: 5, role: 'threads', dir: 'SE', zone: 'Threads Desk' },

      // Zone 2: Creative Visual Studio (Instagram 4 bots)
      { id: 'instagram-2', gx: 10, gy: 3, role: 'instagram', dir: 'SE', zone: 'Creative Studio' },
      { id: 'instagram-3', gx: 12, gy: 3, role: 'instagram', dir: 'SE', zone: 'Creative Studio' },
      { id: 'instagram-1', gx: 10, gy: 5, role: 'instagram', dir: 'SE', zone: 'Creative Studio' },
      { id: 'instagram-4', gx: 12, gy: 5, role: 'instagram', dir: 'SE', zone: 'Creative Studio' },

      // Zone 3: Open Protocol Stream (Bluesky 3 bots)
      { id: 'bluesky-3', gx: 5, gy: 9, role: 'bluesky', dir: 'SE', zone: 'Bluesky Hub' },
      { id: 'bluesky-2', gx: 7, gy: 9, role: 'bluesky', dir: 'SE', zone: 'Bluesky Hub' },
      { id: 'bluesky-1', gx: 5, gy: 11, role: 'bluesky', dir: 'SE', zone: 'Bluesky Hub' },

      // Zone 4: Sovereign Node & Dev Lab (Nostr & DEV.TO)
      { id: 'nostr-1', gx: 14, gy: 4, role: 'nostr', dir: 'SW', zone: 'Sovereign Node' },
      { id: 'devto-1', gx: 14, gy: 6, role: 'devto', dir: 'SW', zone: 'Article Lab' },

      // Zone 5: Tumblr Microblogging Suite (2 bots)
      { id: 'tumblr-2', gx: 10, gy: 9, role: 'tumblr', dir: 'SE', zone: 'Tumblr Suite' },
      { id: 'tumblr-1', gx: 12, gy: 9, role: 'tumblr', dir: 'SE', zone: 'Tumblr Suite' },
    ];
  }, []);

  // Center camera initially based on canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCamera(prev => ({
        ...prev,
        x: rect.width / 2,
        y: rect.height * 0.22
      }));
    }
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let tick = 0;

    // Handle high DPI display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Smooth background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, rect.height);
      bgGrad.addColorStop(0, '#070b19');
      bgGrad.addColorStop(1, '#02040a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, rect.width, rect.height);

      const { x: camX, y: camY, zoom } = camera;

      // ── DRAW ISOMETRIC FLOOR TILES (16x16 Grid) ──
      const MAP_SIZE = 16;
      for (let gy = 0; gy < MAP_SIZE; gy++) {
        for (let gx = 0; gx < MAP_SIZE; gx++) {
          const ptTop = isoToScreen(gx, gy, 0, camX, camY, zoom);
          const ptRight = isoToScreen(gx + 1, gy, 0, camX, camY, zoom);
          const ptBottom = isoToScreen(gx + 1, gy + 1, 0, camX, camY, zoom);
          const ptLeft = isoToScreen(gx, gy + 1, 0, camX, camY, zoom);

          // Floor coloring by office zones
          let tileFill = '#1e293b';
          let borderStroke = 'rgba(255,255,255,0.04)';

          // Lounge / Pantry (gx 0..3, gy 0..7)
          if (gx < 4 && gy < 8) {
            tileFill = (gx + gy) % 2 === 0 ? '#334155' : '#273549'; // Checkerboard tiles
          }
          // Server Corner (gx 13..15, gy 2..7)
          else if (gx >= 13 && gy >= 2 && gy <= 7) {
            tileFill = '#0f172a'; // Dark server floor
            borderStroke = 'rgba(56, 189, 248, 0.15)';
          }
          // Meeting Room (gx 9..15, gy 12..15)
          else if (gx >= 9 && gy >= 12) {
            tileFill = '#1e1b4b'; // Deep carpet
            borderStroke = 'rgba(168, 85, 247, 0.15)';
          }
          // Main Office Floor (Warm parquet)
          else {
            tileFill = (gx + gy) % 2 === 0 ? '#1f293d' : '#192233';
          }

          ctx.beginPath();
          ctx.moveTo(ptTop.x, ptTop.y);
          ctx.lineTo(ptRight.x, ptRight.y);
          ctx.lineTo(ptBottom.x, ptBottom.y);
          ctx.lineTo(ptLeft.x, ptLeft.y);
          ctx.closePath();

          ctx.fillStyle = tileFill;
          ctx.fill();
          ctx.strokeStyle = borderStroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ── DRAW OFFICE WALLS (North and West borders) ──
      // North Wall (gy = 0)
      for (let gx = 0; gx < MAP_SIZE; gx++) {
        const b1 = isoToScreen(gx, 0, 0, camX, camY, zoom);
        const b2 = isoToScreen(gx + 1, 0, 0, camX, camY, zoom);
        const t1 = isoToScreen(gx, 0, 2.2, camX, camY, zoom);
        const t2 = isoToScreen(gx + 1, 0, 2.2, camX, camY, zoom);

        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.closePath();
        ctx.fillStyle = gx % 3 === 0 ? '#1e293b' : '#0f172a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.stroke();

        // City skyline window on north wall
        if (gx === 6 || gx === 7 || gx === 10 || gx === 11) {
          const wB1 = isoToScreen(gx + 0.1, 0, 0.6, camX, camY, zoom);
          const wB2 = isoToScreen(gx + 0.9, 0, 0.6, camX, camY, zoom);
          const wT1 = isoToScreen(gx + 0.1, 0, 1.9, camX, camY, zoom);
          const wT2 = isoToScreen(gx + 0.9, 0, 1.9, camX, camY, zoom);

          ctx.beginPath();
          ctx.moveTo(wB1.x, wB1.y);
          ctx.lineTo(wB2.x, wB2.y);
          ctx.lineTo(wT2.x, wT2.y);
          ctx.lineTo(wT1.x, wT1.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // West Wall (gx = 0)
      for (let gy = 0; gy < MAP_SIZE; gy++) {
        const b1 = isoToScreen(0, gy, 0, camX, camY, zoom);
        const b2 = isoToScreen(0, gy + 1, 0, camX, camY, zoom);
        const t1 = isoToScreen(0, gy, 2.2, camX, camY, zoom);
        const t2 = isoToScreen(0, gy + 1, 2.2, camX, camY, zoom);

        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.closePath();
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.stroke();
      }

      // ── ROOM LABELS ON FLOORS ──
      const drawRoomLabel = (text, gx, gy, icon) => {
        const pos = isoToScreen(gx, gy, 0.05, camX, camY, zoom);
        ctx.save();
        ctx.font = `bold ${Math.max(10, 12 * zoom)}px 'Outfit', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.textAlign = 'center';
        ctx.fillText(`${icon} ${text}`, pos.x, pos.y);
        ctx.restore();
      };

      drawRoomLabel('LOUNGE & PANTRY', 2, 4, '☕');
      drawRoomLabel('THREADS HUB', 6, 2, '🧵');
      drawRoomLabel('CREATIVE STUDIO', 11, 2, '📸');
      drawRoomLabel('BLUESKY LAB', 6, 8, '🦋');
      drawRoomLabel('SOVEREIGN NOSTR & DEV', 14, 2, '⚡');
      drawRoomLabel('TUMBLR SUITE', 11, 8, '📝');

      // ── DECORATIVE OBJECTS (Pantry counter, plants, server racks) ──
      // Potted Plants at corners
      const drawPlant = (gx, gy) => {
        const b = isoToScreen(gx, gy, 0, camX, camY, zoom);
        ctx.save();
        // Pot
        ctx.fillStyle = '#b45309';
        ctx.fillRect(b.x - 7 * zoom, b.y - 10 * zoom, 14 * zoom, 10 * zoom);
        // Foliage
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(b.x, b.y - 18 * zoom, 12 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(b.x - 4 * zoom, b.y - 20 * zoom, 8 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawPlant(4, 1);
      drawPlant(9, 1);
      drawPlant(13, 1);
      drawPlant(4, 7);
      drawPlant(15, 8);

      // Server Racks in Dev Lab
      const drawServerRack = (gx, gy) => {
        const base = isoToScreen(gx, gy, 0, camX, camY, zoom);
        ctx.save();
        ctx.fillStyle = '#020617';
        ctx.fillRect(base.x - 12 * zoom, base.y - 45 * zoom, 24 * zoom, 45 * zoom);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(base.x - 12 * zoom, base.y - 45 * zoom, 24 * zoom, 45 * zoom);

        // Blinking LEDs
        for (let i = 0; i < 5; i++) {
          const ledColor = ((tick + i * 15) % 40 < 20) ? '#10b981' : '#38bdf8';
          ctx.fillStyle = ledColor;
          ctx.fillRect(base.x - 8 * zoom, base.y - (40 - i * 8) * zoom, 3 * zoom, 2 * zoom);
          ctx.fillRect(base.x + 5 * zoom, base.y - (40 - i * 8) * zoom, 3 * zoom, 2 * zoom);
        }
        ctx.restore();
      };

      drawServerRack(15, 2);
      drawServerRack(15, 3);

      // Coffee Bar Counter in Lounge (gx: 1, gy: 2)
      const barBase = isoToScreen(1.5, 3, 0, camX, camY, zoom);
      ctx.save();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(barBase.x - 25 * zoom, barBase.y - 18 * zoom, 50 * zoom, 18 * zoom);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(barBase.x - 27 * zoom, barBase.y - 22 * zoom, 54 * zoom, 5 * zoom);
      // Espresso machine
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(barBase.x - 10 * zoom, barBase.y - 32 * zoom, 16 * zoom, 12 * zoom);
      // Steam
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(barBase.x - 2 * zoom, barBase.y - (36 + (tick % 20) * 0.4) * zoom, 3 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── DEPTH SORTED OBJECTS (Desks & Characters) ──
      // Depth = gx + gy determines painter's order
      const sortedDesks = [...deskPositions].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));

      sortedDesks.forEach((deskPos, idx) => {
        // Find matching worker data
        const worker = workers.find(w => w.id === deskPos.id) || {
          id: deskPos.id,
          accountName: deskPos.id,
          platformName: deskPos.role,
          platformIcon: '🤖',
          role: 'AI Agent',
          status: 'WAITING',
          todayCount: 0,
          dailyTarget: 2,
          speech: 'Standby tugas...'
        };

        const isHovered = hoveredWorkerId === worker.id;
        const isSelected = activeWorkerId === worker.id;
        const isWorking = worker.status === 'WORKING';
        const isResting = worker.status === 'RESTING';
        const isAlert = worker.status === 'ALERT';

        const { gx, gy } = deskPos;
        const pos = isoToScreen(gx, gy, 0, camX, camY, zoom);

        ctx.save();

        // 1. Desk Selection / Hover Aura
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y, 35 * zoom, 18 * zoom, 0, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#38bdf8' : '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 2. Desk Shadow & Base
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 2 * zoom, 28 * zoom, 14 * zoom, 0, 0, Math.PI * 2);
        ctx.fill();

        // Desk Table Top (Isometric Box)
        const tableY = pos.y - 14 * zoom;
        ctx.fillStyle = '#334155';
        ctx.fillRect(pos.x - 22 * zoom, tableY, 44 * zoom, 14 * zoom);
        ctx.fillStyle = '#475569';
        ctx.fillRect(pos.x - 24 * zoom, tableY - 3 * zoom, 48 * zoom, 4 * zoom);

        // Desk Legs
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(pos.x - 20 * zoom, tableY + 14 * zoom, 4 * zoom, 10 * zoom);
        ctx.fillRect(pos.x + 16 * zoom, tableY + 14 * zoom, 4 * zoom, 10 * zoom);

        // 3. Dual Computer Monitors
        const glowScreen = isAlert ? '#ef4444' : isWorking ? '#10b981' : isResting ? '#38bdf8' : '#f59e0b';
        // Main Monitor
        ctx.fillStyle = '#020617';
        ctx.fillRect(pos.x - 14 * zoom, tableY - 22 * zoom, 24 * zoom, 18 * zoom);
        ctx.fillStyle = glowScreen;
        ctx.fillRect(pos.x - 12 * zoom, tableY - 20 * zoom, 20 * zoom, 14 * zoom);
        // Code line simulation
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(pos.x - 10 * zoom, tableY - 17 * zoom, 10 * zoom, 2 * zoom);
        ctx.fillRect(pos.x - 10 * zoom, tableY - 13 * zoom, 15 * zoom, 2 * zoom);
        ctx.fillRect(pos.x - 10 * zoom, tableY - 9 * zoom, 8 * zoom, 2 * zoom);

        // Stand
        ctx.fillStyle = '#64748b';
        ctx.fillRect(pos.x - 3 * zoom, tableY - 4 * zoom, 6 * zoom, 4 * zoom);

        // 4. Character Sprite sitting at desk (behind table / in front of chair)
        // Breathing/typing animation
        const bob = Math.sin(tick * 0.15 + idx) * 1.5 * zoom;
        const charY = tableY - 6 * zoom + bob;

        // Character Clothes by Platform
        let shirtColor = '#38bdf8';
        if (deskPos.role === 'instagram') shirtColor = '#f43f5e';
        if (deskPos.role === 'bluesky') shirtColor = '#0284c7';
        if (deskPos.role === 'nostr') shirtColor = '#8b5cf6';
        if (deskPos.role === 'devto') shirtColor = '#10b981';
        if (deskPos.role === 'tumblr') shirtColor = '#1e293b';

        // Body / Shirt
        ctx.fillStyle = shirtColor;
        ctx.fillRect(pos.x - 9 * zoom, charY - 16 * zoom, 18 * zoom, 16 * zoom);

        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(pos.x, charY - 24 * zoom, 8 * zoom, 0, Math.PI * 2);
        ctx.fill();

        // Hair / Cap / Headphone
        if (deskPos.role === 'nostr' || deskPos.role === 'devto') {
          // Hoodie
          ctx.fillStyle = '#312e81';
          ctx.beginPath();
          ctx.arc(pos.x, charY - 26 * zoom, 9 * zoom, Math.PI, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard Hair
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(pos.x, charY - 26 * zoom, 8.5 * zoom, Math.PI * 0.8, Math.PI * 2.2);
          ctx.fill();
        }

        // Animated typing hands
        const handTyping = Math.cos(tick * 0.3 + idx) * 2 * zoom;
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(pos.x - 7 * zoom, tableY - 2 * zoom + handTyping, 4 * zoom, 4 * zoom);
        ctx.fillRect(pos.x + 3 * zoom, tableY - 2 * zoom - handTyping, 4 * zoom, 4 * zoom);

        // 5. Bot Name Tag Below Desk
        const tagY = pos.y + 16 * zoom;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        const tagText = `${worker.platformIcon} ${worker.accountName}`;
        ctx.font = `bold ${Math.max(9, 10 * zoom)}px 'Inter', sans-serif`;
        const textWidth = ctx.measureText(tagText).width;

        ctx.fillRect(pos.x - (textWidth / 2 + 8), tagY, textWidth + 16, 16 * zoom);
        ctx.strokeRect(pos.x - (textWidth / 2 + 8), tagY, textWidth + 16, 16 * zoom);

        // Status indicator dot
        const dotColor = isAlert ? '#ef4444' : isWorking ? '#10b981' : isResting ? '#38bdf8' : '#fbbf24';
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(pos.x - textWidth / 2 - 2, tagY + 8 * zoom, 3 * zoom, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(tagText, pos.x + 4, tagY + 11 * zoom);

        // 6. Floating Speech Bubble (Isometric dialogue)
        const bubbleY = charY - 42 * zoom;
        const speechSnippet = (worker.speech || 'Standby...').slice(0, 36);
        ctx.font = `600 ${Math.max(8, 9 * zoom)}px 'Inter', sans-serif`;
        const speechWidth = Math.min(180 * zoom, ctx.measureText(speechSnippet).width + 16);

        // Speech bubble container
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = isAlert ? '#ef4444' : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(pos.x - speechWidth / 2, bubbleY - 14 * zoom, speechWidth, 20 * zoom, 6 * zoom);
        ctx.fill();
        ctx.stroke();

        // Little speech pointer
        ctx.beginPath();
        ctx.moveTo(pos.x - 4 * zoom, bubbleY + 6 * zoom);
        ctx.lineTo(pos.x, bubbleY + 10 * zoom);
        ctx.lineTo(pos.x + 4 * zoom, bubbleY + 6 * zoom);
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fill();

        // Speech text
        ctx.fillStyle = isAlert ? '#fca5a5' : '#e0f2fe';
        ctx.textAlign = 'center';
        ctx.fillText(speechSnippet, pos.x, bubbleY);

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [camera, workers, hoveredWorkerId, activeWorkerId, deskPositions]);

  // ── MOUSE / TOUCH INTERACTION (PAN, ZOOM & CLICK) ──

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setCamera(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else {
      // Hit testing for hover
      let foundWorkerId = null;
      for (const desk of deskPositions) {
        const pt = isoToScreen(desk.gx, desk.gy, 0, camera.x, camera.y, camera.zoom);
        const dist = Math.hypot(mouseX - pt.x, mouseY - (pt.y - 15 * camera.zoom));
        if (dist < 35 * camera.zoom) {
          foundWorkerId = desk.id;
          break;
        }
      }
      setHoveredWorkerId(foundWorkerId);
      canvas.style.cursor = foundWorkerId ? 'pointer' : isDragging ? 'grabbing' : 'grab';
    }
  };

  const handleMouseUp = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // If mouse didn't drag far, treat as click
    if (isDragging) {
      const moved = Math.hypot((e.clientX - dragStart.x) - camera.x, (e.clientY - dragStart.y) - camera.y);
      if (moved < 5) {
        // Find clicked worker
        for (const desk of deskPositions) {
          const pt = isoToScreen(desk.gx, desk.gy, 0, camera.x, camera.y, camera.zoom);
          const dist = Math.hypot(mouseX - pt.x, mouseY - (pt.y - 15 * camera.zoom));
          if (dist < 35 * camera.zoom) {
            const clickedWorker = workers.find(w => w.id === desk.id);
            if (clickedWorker && onSelectWorker) {
              onSelectWorker(clickedWorker);
            }
            break;
          }
        }
      }
    }
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setCamera(prev => ({
      ...prev,
      zoom: Math.min(2.5, Math.max(0.6, prev.zoom * zoomFactor))
    }));
  };

  // Quick Zoom buttons
  const zoomIn = () => setCamera(prev => ({ ...prev, zoom: Math.min(2.5, prev.zoom * 1.2) }));
  const zoomOut = () => setCamera(prev => ({ ...prev, zoom: Math.max(0.6, prev.zoom * 0.8) }));
  const resetCamera = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCamera({ x: rect.width / 2, y: rect.height * 0.22, zoom: 1.15 });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '620px', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#02040a', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
      {/* ── CANVAS VIEW ── */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* ── IN-GAME OVERLAY CONTROLS ── */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 12px', fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🎮 KANTOR AI 2.5D ISOMETRIC</span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '400' }}>(Geser & Scroll untuk zoom)</span>
        </div>
      </div>

      {/* ── ZOOM & RESET CONTROLS ── */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 10 }}>
        <button onClick={zoomIn} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(30,41,59,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          +
        </button>
        <button onClick={zoomOut} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(30,41,59,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          −
        </button>
        <button onClick={resetCamera} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(30,41,59,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reset Kamera">
          🎯
        </button>
      </div>

      {/* ── QUICK ZONE NAVIGATOR ── */}
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '6px', zIndex: 10, flexWrap: 'wrap' }}>
        <button 
          onClick={() => setCamera(prev => ({ ...prev, x: canvasRef.current.width / (2 * (window.devicePixelRatio||1)) + 120, y: 160, zoom: 1.35 }))}
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          🧵 Threads & IG
        </button>
        <button 
          onClick={() => setCamera(prev => ({ ...prev, x: canvasRef.current.width / (2 * (window.devicePixelRatio||1)) - 60, y: 60, zoom: 1.35 }))}
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          ⚡ Nostr & DEV.TO
        </button>
        <button 
          onClick={() => setCamera(prev => ({ ...prev, x: canvasRef.current.width / (2 * (window.devicePixelRatio||1)) + 200, y: -40, zoom: 1.35 }))}
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          🦋 Bluesky & Tumblr
        </button>
        <button 
          onClick={() => setCamera(prev => ({ ...prev, x: canvasRef.current.width / (2 * (window.devicePixelRatio||1)) + 300, y: 220, zoom: 1.45 }))}
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          ☕ Pantry Lounge
        </button>
      </div>
    </div>
  );
}
