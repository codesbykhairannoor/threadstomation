import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function hexColor(r, g, b, a) {
  if (a < 2) return '';
  const hex = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
  return (a >= 255 ? hex : hex + a.toString(16).padStart(2, '0')).toUpperCase();
}

async function getRaw(imagePath) {
  const buf = fs.readFileSync(imagePath);
  return await sharp(buf).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
}

function slicePixels(raw, startX, startY, width, height) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const idx = ((startY + y) * raw.info.width + (startX + x)) * 4;
      const r = raw.data[idx];
      const g = raw.data[idx + 1];
      const b = raw.data[idx + 2];
      const a = raw.data[idx + 3];
      row.push(hexColor(r, g, b, a));
    }
    rows.push(row);
  }
  return rows;
}

// 1. Characters
async function loadCharacters(assetsDir) {
  const dir = path.join(assetsDir, 'characters');
  const characters = [];
  const dirs = ['down', 'up', 'right'];

  for (let i = 0; i < 6; i++) {
    const file = path.join(dir, `char_${i}.png`);
    if (!fs.existsSync(file)) {
      console.warn(`Missing character: ${file}`);
      continue;
    }
    const raw = await getRaw(file);
    const charData = { down: [], up: [], right: [] };
    for (let d = 0; d < dirs.length; d++) {
      const dirName = dirs[d];
      const rowOffset = d * 32;
      for (let frame = 0; frame < 7; frame++) {
        const colOffset = frame * 16;
        charData[dirName].push(slicePixels(raw, colOffset, rowOffset, 16, 32));
      }
    }
    characters.push(charData);
  }
  console.log(`Loaded ${characters.length} characters`);
  return characters;
}

// 2. Floors
async function loadFloors(assetsDir) {
  const dir = path.join(assetsDir, 'floors');
  const files = fs.readdirSync(dir)
    .filter(f => /^floor_\d+\.png$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    });

  const sprites = [];
  for (const f of files) {
    const raw = await getRaw(path.join(dir, f));
    sprites.push(slicePixels(raw, 0, 0, 16, 16));
  }
  console.log(`Loaded ${sprites.length} floor tiles`);
  return sprites;
}

// 3. Walls
async function loadWalls(assetsDir) {
  const dir = path.join(assetsDir, 'walls');
  const files = fs.readdirSync(dir)
    .filter(f => /^wall_\d+\.png$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    });

  const sets = [];
  for (const f of files) {
    const raw = await getRaw(path.join(dir, f));
    const set = [];
    for (let s = 0; s < 16; s++) {
      const col = (s % 4) * 16;
      const row = Math.floor(s / 4) * 32;
      set.push(slicePixels(raw, col, row, 16, 32));
    }
    sets.push(set);
  }
  console.log(`Loaded ${sets.length} wall sets`);
  return sets;
}

// 4. Carpets
async function loadCarpets(assetsDir) {
  const dir = path.join(assetsDir, 'carpets');
  const files = fs.readdirSync(dir)
    .filter(f => /^carpet_\d+\.png$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    });

  const sets = [];
  for (const f of files) {
    const raw = await getRaw(path.join(dir, f));
    const set = [];
    for (let s = 0; s < 16; s++) {
      const col = (s % 4) * 16;
      const row = Math.floor(s / 4) * 16;
      set.push(slicePixels(raw, col, row, 16, 16));
    }
    sets.push(set);
  }
  console.log(`Loaded ${sets.length} carpet sets`);
  return sets;
}

// 5. Pets
async function loadPets(assetsDir) {
  const dir = path.join(assetsDir, 'pets');
  if (!fs.existsSync(dir)) return { pets: [], petNames: [] };
  const subdirs = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
  const pets = [];
  const petNames = [];

  for (const name of subdirs) {
    const pdir = path.join(dir, name);
    const mfile = path.join(pdir, 'manifest.json');
    const pfile = path.join(pdir, 'pet.png');
    if (!fs.existsSync(mfile) || !fs.existsSync(pfile)) continue;

    const manifest = JSON.parse(fs.readFileSync(mfile, 'utf8'));
    const raw = await getRaw(pfile);

    const s = (x, y, w, h) => slicePixels(raw, x, y, w, h);
    const walkDown = [s(0, 0, 16, 32), s(16, 0, 16, 32), s(32, 0, 16, 32)];
    const idleDown = [s(48, 0, 16, 32), s(64, 0, 16, 32), s(80, 0, 16, 32)];
    const walkUp = [s(0, 32, 16, 32), s(16, 32, 16, 32), s(32, 32, 16, 32)];
    const idleUp = [s(48, 32, 16, 32), s(64, 32, 16, 32), s(80, 32, 16, 32)];
    const walkRight = [s(0, 64, 32, 32), s(32, 64, 32, 32), s(64, 64, 32, 32)];

    pets.push({ walkDown, idleDown, walkUp, idleUp, walkRight });
    petNames.push(manifest.name);
  }
  console.log(`Loaded ${pets.length} pets`);
  return { pets, petNames };
}

// 6. Furniture
function parseManifestMembers(item, ctx) {
  if (item.type === 'asset') {
    const o = item;
    const r = o.orientation ?? ctx.orientation;
    const i = o.state ?? ctx.state;
    return [{
      id: o.id,
      name: ctx.name,
      label: ctx.name,
      category: ctx.category,
      file: o.file ?? `${o.id}.png`,
      width: o.width,
      height: o.height,
      footprintW: o.footprintW,
      footprintH: o.footprintH,
      isDesk: ctx.category === 'desks',
      canPlaceOnWalls: ctx.canPlaceOnWalls,
      canPlaceOnSurfaces: ctx.canPlaceOnSurfaces,
      backgroundTiles: ctx.backgroundTiles,
      groupId: ctx.groupId,
      ...(r ? { orientation: r } : {}),
      ...(i ? { state: i } : {}),
      ...(o.mirrorSide ? { mirrorSide: true } : {}),
      ...(ctx.rotationScheme ? { rotationScheme: ctx.rotationScheme } : {}),
      ...(ctx.animationGroup ? { animationGroup: ctx.animationGroup } : {}),
      ...(o.frame !== undefined ? { frame: o.frame } : {})
    }];
  }

  const res = [];
  for (const m of item.members) {
    const nextCtx = { ...ctx };
    if (item.groupType === 'rotation' && item.rotationScheme) nextCtx.rotationScheme = item.rotationScheme;
    if (item.groupType === 'state') {
      if (item.orientation) nextCtx.orientation = item.orientation;
      if (item.state) nextCtx.state = item.state;
    }
    if (item.groupType === 'animation') {
      const ori = item.orientation ?? ctx.orientation ?? '';
      const st = item.state ?? ctx.state ?? '';
      nextCtx.animationGroup = `${ctx.groupId}_${ori}_${st}`.toUpperCase();
      if (item.state) nextCtx.state = item.state;
    }
    if (item.orientation && !nextCtx.orientation) nextCtx.orientation = item.orientation;
    res.push(...parseManifestMembers(m, nextCtx));
  }
  return res;
}

async function loadFurniture(assetsDir) {
  const dir = path.join(assetsDir, 'furniture');
  const subdirs = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory());
  const catalog = [];
  const sprites = {};

  for (const sub of subdirs) {
    const fdir = path.join(dir, sub.name);
    const mfile = path.join(fdir, 'manifest.json');
    if (!fs.existsSync(mfile)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(mfile, 'utf8'));
      const ctx = {
        groupId: manifest.id,
        name: manifest.name,
        category: manifest.category,
        canPlaceOnWalls: manifest.canPlaceOnWalls,
        canPlaceOnSurfaces: manifest.canPlaceOnSurfaces,
        backgroundTiles: manifest.backgroundTiles
      };
      if (manifest.rotationScheme) ctx.rotationScheme = manifest.rotationScheme;

      const items = manifest.type === 'asset'
        ? parseManifestMembers({ ...manifest, type: 'asset' }, ctx)
        : parseManifestMembers({ type: 'group', groupType: manifest.groupType, rotationScheme: manifest.rotationScheme, members: manifest.members }, ctx);

      for (const it of items) {
        const file = path.join(fdir, it.file);
        if (fs.existsSync(file)) {
          const raw = await getRaw(file);
          sprites[it.id] = slicePixels(raw, 0, 0, it.width, it.height);
        }
      }
      catalog.push(...items);
    } catch (err) {
      console.warn(`Error loading furniture folder ${sub.name}:`, err.message);
    }
  }

  console.log(`Loaded ${catalog.length} catalog items, ${Object.keys(sprites).length} sprites`);
  return { catalog, sprites };
}

async function main() {
  const assetsDir = path.resolve('scratch/pixel-agents/package/dist/assets');
  console.log('Extracting assets from:', assetsDir);

  const characters = await loadCharacters(assetsDir);
  const floorTiles = await loadFloors(assetsDir);
  const wallTiles = await loadWalls(assetsDir);
  const carpetTiles = await loadCarpets(assetsDir);
  const { pets, petNames } = await loadPets(assetsDir);
  const { catalog, sprites } = await loadFurniture(assetsDir);

  const layoutFile = path.join(assetsDir, 'default-layout-1.json');
  const layout = JSON.parse(fs.readFileSync(layoutFile, 'utf8'));

  const payload = {
    characters,
    pets,
    petNames,
    floorTiles,
    wallTiles,
    carpetTiles,
    furniture: { catalog, sprites },
    layout
  };

  const outFile = path.resolve('public/pixel-office/world-assets.json');
  fs.writeFileSync(outFile, JSON.stringify(payload));
  console.log('SUCCESS! Wrote world-assets.json:', (fs.statSync(outFile).size / 1024).toFixed(1), 'KB');
}

main().catch(console.error);
