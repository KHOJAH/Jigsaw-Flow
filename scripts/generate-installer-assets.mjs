import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure build directory exists
const buildDir = path.resolve(rootDir, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

/**
 * Encodes a 24-bit uncompressed Windows BMP file buffer.
 * @param {number} width 
 * @param {number} height 
 * @param {(x: number, y: number) => [number, number, number]} getPixel 
 * @returns {Buffer}
 */
export function encodeBMP24(width, height, getPixel) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // BMP Header
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30); // BI_RGB
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38); // 72 DPI (2835 ppm)
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  // Pixel data (bottom-up)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = offset;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      buf[offset++] = Math.max(0, Math.min(255, Math.round(b)));
      buf[offset++] = Math.max(0, Math.min(255, Math.round(g)));
      buf[offset++] = Math.max(0, Math.min(255, Math.round(r)));
    }
    while (offset < rowStart + rowSize) {
      buf[offset++] = 0;
    }
  }

  return buf;
}

/**
 * Builds a multi-image Windows ICO file from raw PNG buffers.
 * @param {Array<{ width: number, height: number, data: Buffer }>} pngImages
 * @returns {Buffer}
 */
export function buildIco(pngImages) {
  const count = pngImages.length;
  const headerSize = 6 + count * 16;
  let totalDataSize = 0;
  for (const img of pngImages) {
    totalDataSize += img.data.length;
  }

  const icoBuf = Buffer.alloc(headerSize + totalDataSize);

  icoBuf.writeUInt16LE(0, 0); // Reserved
  icoBuf.writeUInt16LE(1, 2); // Type: 1 = ICO
  icoBuf.writeUInt16LE(count, 4); // Count

  let currentOffset = headerSize;

  for (let i = 0; i < count; i++) {
    const img = pngImages[i];
    const entryOffset = 6 + i * 16;

    icoBuf.writeUInt8(img.width >= 256 ? 0 : img.width, entryOffset + 0);
    icoBuf.writeUInt8(img.height >= 256 ? 0 : img.height, entryOffset + 1);
    icoBuf.writeUInt8(0, entryOffset + 2); // Colors
    icoBuf.writeUInt8(0, entryOffset + 3); // Reserved
    icoBuf.writeUInt16LE(1, entryOffset + 4); // Planes
    icoBuf.writeUInt16LE(32, entryOffset + 6); // Bits
    icoBuf.writeUInt32LE(img.data.length, entryOffset + 8); // Size
    icoBuf.writeUInt32LE(currentOffset, entryOffset + 12); // Offset

    img.data.copy(icoBuf, currentOffset);
    currentOffset += img.data.length;
  }

  return icoBuf;
}

async function main() {
  console.log('--- Generating Jigsaw Flow Installer Assets ---');

  let sharpModule;
  try {
    const sharpImport = await import('sharp');
    sharpModule = sharpImport.default || sharpImport;
  } catch (err) {
    console.error('Sharp not available, checking dependencies...', err);
  }

  const iconSourcePath = path.resolve(rootDir, 'public', 'icon.png');
  const artSourcePath = path.resolve(rootDir, 'public', 'art', 'art1.jpg');

  // 1. Generate ICO with multiple sizes (16, 24, 32, 48, 64, 128, 256)
  if (sharpModule && fs.existsSync(iconSourcePath)) {
    console.log('Generating multi-resolution build/icon.ico...');
    const sizes = [16, 24, 32, 48, 64, 128, 256];
    const pngImages = [];

    for (const size of sizes) {
      const resizedBuffer = await sharpModule(iconSourcePath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      pngImages.push({ width: size, height: size, data: resizedBuffer });
    }

    const icoBuffer = buildIco(pngImages);
    fs.writeFileSync(path.resolve(buildDir, 'icon.ico'), icoBuffer);
    console.log('Created build/icon.ico successfully.');
  }

  // 2. Generate Sidebar BMP (164x314)
  console.log('Generating build/installerSidebar.bmp (164x314)...');
  const sidebarWidth = 164;
  const sidebarHeight = 314;

  let puzzleArtRaw = null;
  if (sharpModule) {
    try {
      const sourceImage = fs.existsSync(iconSourcePath) ? iconSourcePath : (fs.existsSync(artSourcePath) ? artSourcePath : null);
      if (sourceImage) {
        const badgeSize = 104;
        puzzleArtRaw = await sharpModule(sourceImage)
          .resize(badgeSize, badgeSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
      }
    } catch (e) {
      console.warn('Could not render puzzle badge image:', e.message);
    }
  }

  const sidebarBmp = encodeBMP24(sidebarWidth, sidebarHeight, (x, y) => {
    // Base gradient: Deep space navy / rich indigo -> deep obsidian slate
    const t = y / sidebarHeight;
    
    let r, g, b;
    if (t < 0.5) {
      const k = t / 0.5;
      r = 15 + (30 - 15) * k;
      g = 23 + (27 - 23) * k;
      b = 42 + (75 - 42) * k;
    } else {
      const k = (t - 0.5) / 0.5;
      r = 30 + (10 - 30) * k;
      g = 27 + (15 - 27) * k;
      b = 75 + (29 - 75) * k;
    }

    // Radial glow behind badge (x: 82, y: 100)
    const dx = x - 82;
    const dy = y - 95;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 80) {
      const glow = Math.pow(1 - dist / 80, 2) * 0.45;
      r += 80 * glow;
      g += 70 * glow;
      b += 190 * glow;
    }

    // Subtle decorative grid pattern
    if ((x % 16 === 0 || y % 16 === 0) && y > 180) {
      r += 4;
      g += 5;
      b += 12;
    }

    // Blend overlay badge icon if available
    if (puzzleArtRaw) {
      const { data, info } = puzzleArtRaw;
      const startX = Math.floor((sidebarWidth - info.width) / 2);
      const startY = 42;
      if (x >= startX && x < startX + info.width && y >= startY && y < startY + info.height) {
        const px = x - startX;
        const py = y - startY;
        const idx = (py * info.width + px) * 4;
        const iconR = data[idx];
        const iconG = data[idx + 1];
        const iconB = data[idx + 2];
        const alpha = data[idx + 3] / 255;

        r = r * (1 - alpha) + iconR * alpha;
        g = g * (1 - alpha) + iconG * alpha;
        b = b * (1 - alpha) + iconB * alpha;
      }
    }

    // Bottom indigo accent line
    if (y >= sidebarHeight - 4) {
      r = 99; g = 102; b = 241;
    }

    return [r, g, b];
  });

  fs.writeFileSync(path.resolve(buildDir, 'installerSidebar.bmp'), sidebarBmp);
  fs.writeFileSync(path.resolve(buildDir, 'uninstallerSidebar.bmp'), sidebarBmp);
  console.log('Created build/installerSidebar.bmp and build/uninstallerSidebar.bmp.');

  // 3. Generate Header BMP (150x57)
  console.log('Generating build/installerHeader.bmp (150x57)...');
  const headerWidth = 150;
  const headerHeight = 57;

  let headerIconRaw = null;
  if (sharpModule && fs.existsSync(iconSourcePath)) {
    try {
      headerIconRaw = await sharpModule(iconSourcePath)
        .resize(40, 40, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    } catch (e) {
      console.warn('Could not render header icon:', e.message);
    }
  }

  const headerBmp = encodeBMP24(headerWidth, headerHeight, (x, y) => {
    // Soft cool slate gradient matching standard modern wizard header
    const t = x / headerWidth;
    let r = 248 - 15 * t;
    let g = 250 - 15 * t;
    let b = 252 - 10 * t;

    // Draw header icon on right side (x: 102 to 142, y: 8 to 48)
    if (headerIconRaw) {
      const { data, info } = headerIconRaw;
      const startX = 102;
      const startY = 8;
      if (x >= startX && x < startX + info.width && y >= startY && y < startY + info.height) {
        const px = x - startX;
        const py = y - startY;
        const idx = (py * info.width + px) * 4;
        const iconR = data[idx];
        const iconG = data[idx + 1];
        const iconB = data[idx + 2];
        const alpha = data[idx + 3] / 255;

        r = r * (1 - alpha) + iconR * alpha;
        g = g * (1 - alpha) + iconG * alpha;
        b = b * (1 - alpha) + iconB * alpha;
      }
    }

    return [r, g, b];
  });

  fs.writeFileSync(path.resolve(buildDir, 'installerHeader.bmp'), headerBmp);
  console.log('Created build/installerHeader.bmp.');

  console.log('--- All installer assets successfully generated in build/ ---');
}

main().catch((err) => {
  console.error('Error generating installer assets:', err);
  process.exit(1);
});
