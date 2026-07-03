/**
 * Crop Sen mascot characters from the mascot sheet.
 * Run: node scripts/crop-mascot.mjs
 *
 * Sheet size: 1402 x 1122 px
 * Adjust x/y/w/h below if crops look off.
 */

import { Jimp } from 'jimp';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const SHEET   = './assets/mascot.jpg';
const OUT_DIR = './assets/mascot';

// ─── Crop regions (x, y, w, h) ───────────────────────────────────────────────
// Tọa độ tính từ góc trên-trái của sheet 1402x1122
// Điều chỉnh nếu kết quả chưa đúng

const CROPS = [
  // ── 3D VERSION – chân dung chính (sheet size: 1402x1122) ──────────────────
  {
    name: 'sen-idle',        // Front-facing, dáng đứng tự nhiên
    x: 640, y: 488, w: 125, h: 255,
  },
  {
    name: 'sen-exploring',   // Pose khám phá với ba lô
    x: 490, y: 488, w: 140, h: 255,
  },

  // ── 3D EXPRESSIONS (y=786, spacing ~115px, h=128 để bỏ label) ────────────
  {
    name: 'sen-happy',       x: 447,  y: 786, w: 100, h: 128,
  },
  {
    name: 'sen-excited',     x: 562,  y: 786, w: 100, h: 128,
  },
  {
    name: 'sen-thinking',    x: 677,  y: 786, w: 100, h: 128,
  },
  {
    name: 'sen-surprised',   x: 792,  y: 786, w: 100, h: 128,
  },
  {
    name: 'sen-love',        x: 907,  y: 786, w: 100, h: 128,
  },
  {
    name: 'sen-winking',     x: 1022, y: 786, w: 100, h: 128,
  },
];

// ─── Script ──────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  console.log(`\nReading sheet: ${SHEET}`);
  const sheet = await Jimp.read(SHEET);
  console.log(`Sheet size: ${sheet.width} x ${sheet.height} px\n`);

  for (const { name, x, y, w, h } of CROPS) {
    const out = `${OUT_DIR}/${name}.png`;
    const cropped = sheet.clone().crop({ x, y, w, h });
    await cropped.write(out);
    console.log(`✓ ${name}.png  (${x},${y} → ${w}x${h})`);
  }


  console.log(`\nDone! Ảnh đã lưu vào ${OUT_DIR}/`);
  console.log('Nếu crop chưa đúng, mở file và điều chỉnh x/y/w/h rồi chạy lại.\n');
}

main().catch(console.error);
