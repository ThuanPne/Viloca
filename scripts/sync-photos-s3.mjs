/**
 * Quét S3 → cập nhật cột `photos` trong Supabase locations table.
 *
 * Chạy:
 *   node scripts/sync-photos-s3.mjs --dry-run   ← chỉ in, không update DB
 *   node scripts/sync-photos-s3.mjs             ← update thật
 */

import { execSync }  from 'child_process';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ─── Đọc .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync('.env.local', 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
  } catch { /* file không tồn tại */ }
  return env;
}

const env      = loadEnv();
const SB_URL   = env.EXPO_PUBLIC_SUPABASE_URL   || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SB_KEY   = env.SUPABASE_SERVICE_ROLE_KEY  || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN  = process.argv.includes('--dry-run');
const AWS_CLI  = '"C:/Program Files/Amazon/AWSCLIV2/aws.exe"';
const BUCKET   = 'viloca-media';
const REGION   = 'ap-southeast-1';
const BASE_URL = `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
const IMG_RE   = /\.(jpg|jpeg|png|webp|avif)$/i;

// ─── Mapping folder S3 → DB ──────────────────────────────────────────────────
const FOLDER_MAP = {
  // TP. Hồ Chí Minh
  'dinh-doc-lap':            { city: 'SG', name: 'Dinh Độc Lập' },
  'buu-dien-trung-tam':      { city: 'SG', name: 'Bưu Điện Trung Tâm Sài Gòn' },
  'nha-hat-thanh-pho':       { city: 'SG', name: 'Nhà Hát Thành Phố Hồ Chí Minh' },
  'bao-tang-lich-su':        { city: 'SG', name: 'Bảo Tàng Lịch Sử TP. Hồ Chí Minh' },
  'cho-ben-thanh':           { city: 'SG', name: 'Chợ Bến Thành' },
  'bao-tang-chung-tich':     { city: 'SG', name: 'Bảo Tàng Chứng Tích Chiến Tranh' },

  // Đà Nẵng / Hội An
  'ta-lang-gian-bi':         { city: 'DN', name: 'Trung Tâm Văn Hóa Du Lịch Cộng Đồng Tà Lang - Giàn Bí' },
  'the-hang-art':            { city: 'DN', name: 'The Hang Art' },
  'lang-toom-sara':          { city: 'DN', name: 'Làng Toom Sara' },
  'giong-cafe':              { city: 'DN', name: 'Gióng Café' },
  'bao-tang-dieu-khac-cham': { city: 'DN', name: 'Bảo Tàng Điêu Khắc Chăm' },
  'lang-cui-lu-hoi-an':      { city: 'DN', name: 'Làng Củi Lũ Hội An (Driftwood Village)' },
  'homestay-alang-nhu':      { city: 'DN', name: 'Homestay Alang Nhu' },
  'the-heritage-show':       { city: 'DN', name: 'The Heritage Show' },
  'cong-vien-dat-nung':      { city: 'DN', name: 'Công Viên Đất Nung Thanh Hà' },
  'lang-moc-kim-bong':       { city: 'DN', name: 'Làng Mộc Kim Bồng' },
  'ngon-pho-da':             { city: 'DN', name: 'Ngon Phố Đà' },
  'ky-uc-hoi-an':            { city: 'DN', name: 'Ký Ức Hội An' },
  'hang-ganh':               { city: 'DN', name: 'Hàng Gánh' },
  'truc-lam-vien':           { city: 'DN', name: 'Nhà Hàng Café Trúc Lâm Viên' },
  'cong-troi-dong-giang':    { city: 'DN', name: 'Cổng Trời Đông Giang' },
  'ngon-thi-hoa':            { city: 'DN', name: 'Ngon Thị Hoa Restaurant' },
  'bep-cuon':                { city: 'DN', name: 'Bếp Cuốn' },
  'bao-tang-sa-huynh':       { city: 'DN', name: 'Bảo Tàng Văn Hóa Sa Huỳnh' },
  'lang-rau-tra-que':        { city: 'DN', name: 'Làng Rau Trà Quế' },
  'nha-co-tan-ky':           { city: 'DN', name: 'Nhà Cổ Tân Kỳ' },
  'leaf-village-farm':       { city: 'DN', name: 'Leaf Village & Farm' },
  'the-farmers':             { city: 'DN', name: 'The Farmers' },
  'hoi-quan-phuoc-kien':     { city: 'DN', name: 'Hội Quán Phước Kiến' },
  'bao-tang-dong-dinh':      { city: 'DN', name: 'Bảo Tàng Đồng Đình' },
  'nha-go-villa':            { city: 'DN', name: 'Nhà Gỗ Villa' },
  'rung-dua-bay-mau':        { city: 'DN', name: 'Rừng Dừa Bảy Mẫu' },

  // Hà Nội
  'bao-tang-dan-toc':        { city: 'HN', name: 'Bảo Tàng Dân Tộc Học Việt Nam' },
  'bao-tang-gom-bat-trang':  { city: 'HN', name: 'Bảo Tàng Gốm Bát Tràng' },
  'lang-nghe-quang-phu-cau': { city: 'HN', name: 'Làng Nghề Tăm Hương Quảng Phú Cầu' },
  'cau-long-bien':           { city: 'HN', name: 'Cầu Long Biên' },
  'cho-dong-xuan':           { city: 'HN', name: 'Chợ Đồng Xuân' },
  'cot-co-ha-noi':           { city: 'HN', name: 'Cột Cờ Hà Nội (Kỳ Đài)' },
  'nha-tu-hoa-lo':           { city: 'HN', name: 'Nhà Tù Hỏa Lò' },
  'ho-hoan-kiem':            { city: 'HN', name: 'Hồ Hoàn Kiếm (Hồ Gươm)' },
  'hoang-thanh-thang-long':  { city: 'HN', name: 'Hoàng Thành Thăng Long' },
  'lang-chu-tich-hcm':       { city: 'HN', name: 'Lăng Chủ Tịch Hồ Chí Minh' },
  'nha-hat-lon-ha-noi':      { city: 'HN', name: 'Nhà Hát Lớn Hà Nội' },
  'nha-hat-mua-roi':         { city: 'HN', name: 'Nhà Hát Múa Rối Thăng Long' },
  'khu-phu-chu-tich':        { city: 'HN', name: 'Khu Di Tích Phủ Chủ Tịch (Nhà Sàn Bác Hồ)' },
  'o-quan-chuong':           { city: 'HN', name: 'Ô Quan Chưởng' },
  'van-mieu-quoc-tu-giam':   { city: 'HN', name: 'Văn Miếu - Quốc Tử Giám' },
};

// ─── List files trong S3 folder ──────────────────────────────────────────────
function listS3(prefix) {
  try {
    const out = execSync(
      `${AWS_CLI} s3 ls "s3://${BUCKET}/${prefix}" 2>nul`,
      { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
    );
    return out.trim().split('\n')
      .filter(Boolean)
      .map(l => l.trim().split(/\s+/).pop())
      .filter(f => IMG_RE.test(f));
  } catch {
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!SB_URL || !SB_KEY) {
    console.error('Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
    process.exit(1);
  }

  const supabase = createClient(SB_URL, SB_KEY);
  console.log(DRY_RUN ? '── DRY RUN ──\n' : '── LIVE ──\n');

  let ok = 0, skip = 0;

  for (const [key, { city, name }] of Object.entries(FOLDER_MAP)) {
    const prefix = `locations/${city}/${key}/`;
    const files  = listS3(prefix);

    if (!files.length) {
      console.warn(`⚠  Không có ảnh: ${city}/${key}`);
      skip++;
      continue;
    }

    const photoUrls = files.map(f => `${BASE_URL}/${prefix}${f}`).join(',');

    if (DRY_RUN) {
      console.log(`[DRY] ${name}`);
      console.log(`      ${photoUrls}\n`);
      ok++;
      continue;
    }

    const { error } = await supabase
      .from('locations')
      .update({ photos: photoUrls })
      .eq('city', city)
      .eq('name', name);

    if (error) {
      console.error(`✗ ${name}:`, error.message);
    } else {
      console.log(`✓ ${name} (${files.length} ảnh)`);
      ok++;
    }
  }

  console.log(`\n── Kết quả: ${ok} cập nhật, ${skip} bỏ qua ──`);
}

main().catch(console.error);
