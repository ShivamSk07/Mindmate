const fs = require("fs");
const path = require("path");

function pngToIco(pngPath, icoPath) {
  const pngBuffer = fs.readFileSync(pngPath);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0); // Width 256 (0 means 256)
  dirEntry.writeUInt8(0, 1); // Height 256 (0 means 256)
  dirEntry.writeUInt8(0, 2); // Colors
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of PNG data
  dirEntry.writeUInt32LE(22, 12); // Offset to PNG data (6 + 16 = 22)

  const icoBuffer = Buffer.concat([header, dirEntry, pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log("Successfully generated:", icoPath, "size:", icoBuffer.length);
}

const src = path.join(__dirname, "logo.png");
const dest = path.join(__dirname, "icon.ico");
pngToIco(src, dest);
