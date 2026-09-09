const fs = require("fs");
const path = require("path");

function createBmp(width, height, colorFn) {
  // BMP rows must be padded to a multiple of 4 bytes
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buf = Buffer.alloc(fileSize);

  // Bitmap File Header (14 bytes)
  buf.write("BM", 0); // Signature
  buf.writeUInt32LE(fileSize, 2); // File size
  buf.writeUInt32LE(0, 6); // Reserved
  buf.writeUInt32LE(54, 10); // Offset to pixel data

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buf.writeUInt32LE(40, 14); // Header size
  buf.writeInt32LE(width, 18); // Width
  buf.writeInt32LE(height, 22); // Height (positive for bottom-up)
  buf.writeUInt16LE(1, 26); // Color planes
  buf.writeUInt16LE(24, 28); // Bits per pixel (24 bit RGB)
  buf.writeUInt32LE(0, 30); // Compression (BI_RGB)
  buf.writeUInt32LE(pixelArraySize, 34); // Image size
  buf.writeInt32LE(2835, 38); // Horizontal resolution (pixels/meter ~ 72 dpi)
  buf.writeInt32LE(2835, 42); // Vertical resolution
  buf.writeUInt32LE(0, 46); // Colors in palette
  buf.writeUInt32LE(0, 50); // Important colors

  // Write Pixels (Bottom-Up order in BMP)
  for (let y = 0; y < height; y++) {
    const rowOffset = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + x * 3;
      const { r, g, b } = colorFn(x, y, width, height);
      buf.writeUInt8(b, pixelOffset); // Blue
      buf.writeUInt8(g, pixelOffset + 1); // Green
      buf.writeUInt8(r, pixelOffset + 2); // Red
    }
  }

  return buf;
}

// 1. Installer Sidebar (164 x 314) - Dark Charcoal with subtle gradient & subtle grid/border accent
const sidebarBuf = createBmp(164, 314, (x, y, w, h) => {
  // Dark charcoal base (#09090b -> #121215)
  const normY = y / h;
  let r = Math.round(9 + normY * 12);
  let g = Math.round(9 + normY * 12);
  let b = Math.round(11 + normY * 15);

  // Right vertical accent line
  if (x === w - 1) {
    r = 39; g = 39; b = 42; // #27272a
  }

  return { r, g, b };
});

// 2. Installer Header (150 x 57) - Dark Charcoal Header with bottom border
const headerBuf = createBmp(150, 57, (x, y, w, h) => {
  let r = 12;
  let g = 12;
  let b = 15;

  // Bottom horizontal accent line
  if (y === h - 1) {
    r = 39; g = 39; b = 42; // #27272a
  }

  return { r, g, b };
});

const buildDir = path.join(__dirname);
fs.writeFileSync(path.join(buildDir, "installerSidebar.bmp"), sidebarBuf);
fs.writeFileSync(path.join(buildDir, "uninstallerSidebar.bmp"), sidebarBuf);
fs.writeFileSync(path.join(buildDir, "installerHeader.bmp"), headerBuf);

console.log("Successfully generated dark BMP wizard assets!");
