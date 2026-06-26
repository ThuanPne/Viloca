/**
 * Scan Supabase Storage → tự động cập nhật cột `photos` cho locations.
 *
 * Cách dùng:
 *   npx ts-node scripts/sync-photos.ts --dry-run   ← chỉ in SQL, không chạy
 *   npx ts-node scripts/sync-photos.ts             ← chạy thật
 *
 * Cấu trúc Storage mong đợi:
 *   viloca-media/locations/SG/<folder-địa-điểm>/<ảnh1>, <ảnh2>...
 *   viloca-media/locations/DN/<folder-địa-điểm>/<ảnh1>, <ảnh2>...
 *
 * Mapping folder → tên địa điểm trong DB dựa trên cột `photos_folder`
 * được lưu trong file này (xem FOLDER_MAP bên dưới).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'viloca-media';
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Mapping: tên folder trong Storage → tên địa điểm trong DB ───────────────
// Chỉnh sửa tên folder bên trái cho khớp với tên folder thực tế bạn đã tạo.

const FOLDER_MAP: Record<string, { city: string; name: string }> = {
  // ── TP. Hồ Chí Minh ────────────────────────────────────────────────────────
  'dinh-doc-lap':             { city: 'SG', name: 'Dinh Độc Lập' },
  'buu-dien-trung-tam':       { city: 'SG', name: 'Bưu Điện Trung Tâm Sài Gòn' },
  'nha-hat-thanh-pho':        { city: 'SG', name: 'Nhà Hát Thành Phố Hồ Chí Minh' },
  'bao-tang-lich-su':         { city: 'SG', name: 'Bảo Tàng Lịch Sử TP. Hồ Chí Minh' },
  'cho-ben-thanh':            { city: 'SG', name: 'Chợ Bến Thành' },
  'bao-tang-chung-tich':      { city: 'SG', name: 'Bảo Tàng Chứng Tích Chiến Tranh' },

  // ── Đà Nẵng + Hội An ───────────────────────────────────────────────────────
  'ta-lang-gian-bi':          { city: 'DN', name: 'Trung Tâm Văn Hóa Du Lịch Cộng Đồng Tà Lang - Giàn Bí' },
  'the-hang-art':             { city: 'DN', name: 'The Hang Art' },
  'lang-toom-sara':           { city: 'DN', name: 'Làng Toom Sara' },
  'giong-cafe':               { city: 'DN', name: 'Gióng Café' },
  'bao-tang-dieu-khac-cham':  { city: 'DN', name: 'Bảo Tàng Điêu Khắc Chăm' },
  'lang-cui-lu-hoi-an':       { city: 'DN', name: 'Làng Củi Lũ Hội An (Driftwood Village)' },
  'homestay-alang-nhu':       { city: 'DN', name: 'Homestay Alang Nhu' },
  'the-heritage-show':        { city: 'DN', name: 'The Heritage Show' },
  'cong-vien-dat-nung':       { city: 'DN', name: 'Công Viên Đất Nung Thanh Hà' },
  'lang-moc-kim-bong':        { city: 'DN', name: 'Làng Mộc Kim Bồng' },
  'every-half':               { city: 'DN', name: 'EVERY HALF' },
  'rung-dua-bay-mau':         { city: 'DN', name: 'Rừng Dừa Bảy Mẫu' },
  'ngon-pho-da':              { city: 'DN', name: 'Ngon Phố Đà' },
  'ky-uc-hoi-an':             { city: 'DN', name: 'Ký Ức Hội An' },
  'hang-ganh':                { city: 'DN', name: 'Hàng Gánh' },
  'truc-lam-vien':            { city: 'DN', name: 'Nhà Hàng Café Trúc Lâm Viên' },
  'cong-troi-dong-giang':     { city: 'DN', name: 'Cổng Trời Đông Giang' },
  'ngon-thi-hoa':             { city: 'DN', name: 'Ngon Thị Hoa Restaurant' },
  'bep-cuon':                 { city: 'DN', name: 'Bếp Cuốn' },
  'bao-tang-sa-huynh':        { city: 'DN', name: 'Bảo Tàng Văn Hóa Sa Huỳnh' },
  'lang-rau-tra-que':         { city: 'DN', name: 'Làng Rau Trà Quế' },
  'nha-co-tan-ky':            { city: 'DN', name: 'Nhà Cổ Tân Kỳ' },
  'leaf-village-farm':        { city: 'DN', name: 'Leaf Village & Farm' },
  'the-farmers':              { city: 'DN', name: 'The Farmers' },
  'hoi-quan-phuoc-kien':      { city: 'DN', name: 'Hội Quán Phước Kiến' },
  'bao-tang-dong-dinh':       { city: 'DN', name: 'Bảo Tàng Đồng Đình' },
  'nha-go-villa':             { city: 'DN', name: 'Nhà Gỗ Villa' },
};

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function isImage(name: string) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  return IMAGE_EXTS.has(ext);
}

function publicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong env');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log(DRY_RUN ? '── DRY RUN — chỉ in SQL ──\n' : '── LIVE — cập nhật DB ──\n');

  let updated = 0;
  let skipped = 0;
  const unknown: string[] = [];

  for (const city of ['SG', 'DN']) {
    const prefix = `locations/${city}`;

    // Liệt kê tất cả folder trong city
    const { data: folders, error: fErr } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 200 });

    if (fErr) { console.error(`Lỗi list ${prefix}:`, fErr.message); continue; }
    if (!folders?.length) { console.warn(`Không tìm thấy folder nào trong ${prefix}`); continue; }

    for (const folder of folders) {
      if (folder.metadata) continue; // bỏ qua file (chỉ lấy folder)

      const folderKey = folder.name.toLowerCase();
      const mapping = FOLDER_MAP[folderKey];

      if (!mapping) {
        unknown.push(`${city}/${folder.name}`);
        continue;
      }

      // Liệt kê ảnh trong folder
      const { data: files, error: imgErr } = await supabase.storage
        .from(BUCKET)
        .list(`${prefix}/${folder.name}`, { limit: 50, sortBy: { column: 'name', order: 'asc' } });

      if (imgErr) { console.error(`Lỗi list ảnh ${folder.name}:`, imgErr.message); continue; }

      const images = (files ?? []).filter(f => f.metadata && isImage(f.name));
      if (!images.length) { console.warn(`⚠️  ${city}/${folder.name}: không có ảnh`); continue; }

      const photoUrls = images
        .map(f => publicUrl(`${prefix}/${folder.name}/${f.name}`))
        .join(',');

      const sql = `UPDATE locations SET photos = '${photoUrls}' WHERE city = '${mapping.city}' AND name = '${mapping.name.replace(/'/g, "''")}';`;

      if (DRY_RUN) {
        console.log(sql);
        console.log(`   -- ${images.length} ảnh\n`);
        updated++;
      } else {
        const { error: upErr } = await supabase
          .from('locations')
          .update({ photos: photoUrls })
          .eq('city', mapping.city)
          .eq('name', mapping.name);

        if (upErr) {
          console.error(`✗ ${mapping.name}:`, upErr.message);
        } else {
          console.log(`✓ ${mapping.name} — ${images.length} ảnh`);
          updated++;
        }
      }
    }
  }

  console.log(`\n── Kết quả ──`);
  console.log(`Đã xử lý: ${updated} địa điểm`);
  if (unknown.length) {
    console.log(`\n⚠️  Folder không có trong FOLDER_MAP (cần thêm mapping):`);
    unknown.forEach(f => console.log(`   ${f}`));
  }
}

main().catch(console.error);
