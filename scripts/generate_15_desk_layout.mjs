import fs from 'fs';
import path from 'path';

// Generate a 15-workstation office layout for Threadstomation Kantor AI
// Grid: 21 cols x 22 rows
// Tile values:
// 255 = void
// 0 = wall
// 7 = wood parquet floor
// 1 = carpet
// 9 = decorative floor edge

const cols = 21;
const rows = 22;
const tiles = new Array(cols * rows).fill(255);

// Build floor from row 2 to 20, col 1 to 19
for (let r = 2; r <= 20; r++) {
  for (let c = 1; c <= 19; c++) {
    const idx = r * cols + c;
    if (r === 2) {
      tiles[idx] = 0; // North Wall
    } else if (c === 10 && r >= 3 && r <= 14) {
      // Divider wall between left and right wings with doorways
      if (r === 7 || r === 8 || r === 13) {
        tiles[idx] = 7; // open doorway
      } else {
        tiles[idx] = 0; // partition wall
      }
    } else if (c >= 11 && r >= 15) {
      tiles[idx] = 1; // Carpet in Lounge (bottom right)
    } else {
      tiles[idx] = 7; // Wood floor
    }
  }
}

// West wall (col 1), East wall (col 19), South wall (row 20)
for (let r = 2; r <= 20; r++) {
  tiles[r * cols + 1] = 0;  // West boundary wall
  tiles[r * cols + 19] = 0; // East boundary wall
}
for (let c = 1; c <= 19; c++) {
  tiles[20 * cols + c] = 0; // South boundary wall
}

// Now furniture list
const furniture = [];
let fId = 1000;
function add(type, col, row) {
  furniture.push({
    uid: `f-bot-${fId++}`,
    type,
    col,
    row
  });
}

// ── WALL DECORATIONS (North Wall, row 2) ──────────────────────────────────
add('SMALL_PAINTING', 3, 2);
add('CLOCK', 6, 2);
add('DOUBLE_BOOKSHELF', 8, 2);
add('WHITEBOARD', 12, 2);
add('LARGE_PAINTING', 16, 2);

// ── ZONE 1: THREADS DEPARTMENT (4 Bots: Top Left) ─────────────────────────
// Desk 1 & 2 (cols 3 & 6, row 4)
add('DESK_FRONT', 3, 4);
add('PC_FRONT_ON_1', 4, 4);
add('CUSHIONED_CHAIR_FRONT', 4, 6);

add('DESK_FRONT', 6, 4);
add('PC_FRONT_ON_2', 7, 4);
add('CUSHIONED_CHAIR_FRONT', 7, 6);

// Desk 3 & 4 (cols 3 & 6, row 8)
add('DESK_FRONT', 3, 8);
add('PC_FRONT_ON_3', 4, 8);
add('CUSHIONED_CHAIR_FRONT', 4, 10);

add('DESK_FRONT', 6, 8);
add('PC_FRONT_ON_1', 7, 8);
add('CUSHIONED_CHAIR_FRONT', 7, 10);

add('PLANT', 2, 4);
add('BIN', 2, 8);

// ── ZONE 2: INSTAGRAM VISUAL STUDIO (4 Bots: Top Right) ───────────────────
// Desk 5 & 6 (cols 12 & 15, row 4)
add('DESK_FRONT', 12, 4);
add('PC_FRONT_ON_2', 13, 4);
add('CUSHIONED_CHAIR_FRONT', 13, 6);

add('DESK_FRONT', 15, 4);
add('PC_FRONT_ON_3', 16, 4);
add('CUSHIONED_CHAIR_FRONT', 16, 6);

// Desk 7 & 8 (cols 12 & 15, row 8)
add('DESK_FRONT', 12, 8);
add('PC_FRONT_ON_1', 13, 8);
add('CUSHIONED_CHAIR_FRONT', 13, 10);

add('DESK_FRONT', 15, 8);
add('PC_FRONT_ON_2', 16, 8);
add('CUSHIONED_CHAIR_FRONT', 16, 10);

add('PLANT_2', 18, 4);
add('HANGING_PLANT', 11, 2);

// ── ZONE 3: BLUESKY HUB (3 Bots: Mid Left) ─────────────────────────────────
// Desk 9 & 10 (cols 3 & 6, row 12)
add('DESK_FRONT', 3, 12);
add('PC_FRONT_ON_3', 4, 12);
add('CUSHIONED_CHAIR_FRONT', 4, 14);

add('DESK_FRONT', 6, 12);
add('PC_FRONT_ON_1', 7, 12);
add('CUSHIONED_CHAIR_FRONT', 7, 14);

// Desk 11 (col 3, row 16)
add('DESK_FRONT', 3, 16);
add('PC_FRONT_ON_2', 4, 16);
add('CUSHIONED_CHAIR_FRONT', 4, 18);

add('DOUBLE_BOOKSHELF', 2, 12);
add('CACTUS', 2, 16);

// ── ZONE 4: NOSTR & DEV.TO (2 Bots: Mid-Bottom Left) ──────────────────────
// Desk 12 (col 6, row 16)
add('DESK_FRONT', 6, 16);
add('PC_FRONT_ON_3', 7, 16);
add('CUSHIONED_CHAIR_FRONT', 7, 18);

// ── ZONE 5: TUMBLR MICROBLOGGING (2 Bots: Bottom Hall) ────────────────────
// Desk 13 (col 12, row 12)
add('DESK_FRONT', 12, 12);
add('PC_FRONT_ON_1', 13, 12);
add('CUSHIONED_CHAIR_FRONT', 13, 14);

// Desk 14 & 15 (cols 15 & 12, row 12 / 16)
add('DESK_FRONT', 15, 12);
add('PC_FRONT_ON_2', 16, 12);
add('CUSHIONED_CHAIR_FRONT', 16, 14);

// ── COFFEE LOUNGE & RELAXATION AREA (Bottom Right: Carpet Zone) ───────────
add('COFFEE_TABLE', 14, 17);
add('SOFA_FRONT', 14, 16);
add('SOFA_BACK', 14, 19);
add('SOFA_SIDE', 13, 17);
add('SOFA_SIDE:left', 16, 17);

// Coffee Station & Drinks
add('SMALL_TABLE_FRONT', 17, 16);
add('COFFEE', 17, 16);
add('LARGE_PLANT', 18, 18);
add('PLANT', 12, 19);

const layout = {
  version: 1,
  cols,
  rows,
  layoutRevision: 1,
  tiles,
  tileColors: {},
  furniture
};

// Update world-assets.json layout with this complete 15-workstation office
const worldAssetsPath = path.resolve('public/pixel-office/world-assets.json');
const worldAssets = JSON.parse(fs.readFileSync(worldAssetsPath, 'utf8'));
worldAssets.layout = layout;
fs.writeFileSync(worldAssetsPath, JSON.stringify(worldAssets));
console.log('Successfully updated world-assets.json with 15-workstation office layout!');
console.log('Total furniture placed:', furniture.length);
