const S3 = 'https://viloca-media.s3.ap-southeast-1.amazonaws.com';

export const DESTINATION_COVERS: Record<string, string[]> = {
  'Hà Nội': [
    `${S3}/locations/HN/ho-hoan-kiem/1.jpg`,
    `${S3}/locations/HN/van-mieu-quoc-tu-giam/1.jpg`,
    `${S3}/locations/HN/cau-long-bien/1.jpg`,
    `${S3}/locations/HN/hoang-thanh-thang-long/1.jpg`,
    `${S3}/locations/HN/o-quan-chuong/1.jpg`,
  ],
  'TP. Hồ Chí Minh': [
    `${S3}/locations/SG/dinh-doc-lap/1.jpg`,
    `${S3}/locations/SG/nha-hat-thanh-pho/1.jpg`,
    `${S3}/locations/SG/cho-ben-thanh/1.jpg`,
    `${S3}/locations/SG/buu-dien-trung-tam/1.jpg`,
  ],
  'Đà Nẵng': [
    `${S3}/locations/DN/hang-ganh/1.jpg`,
    `${S3}/locations/DN/bao-tang-dieu-khac-cham/1.jpg`,
    `${S3}/locations/DN/cong-troi-dong-giang/1.jpg`,
    `${S3}/locations/DN/rung-dua-bay-mau/1.jpg`,
  ],
  'Quảng Nam': [
    `${S3}/locations/DN/ky-uc-hoi-an/1.jpg`,
    `${S3}/locations/DN/nha-co-tan-ky/1.jpg`,
    `${S3}/locations/DN/hoi-quan-phuoc-kien/1.jpg`,
    `${S3}/locations/DN/lang-rau-tra-que/1.jpg`,
  ],
};

export function getCoverForDestination(destination: string, tripId: string): string {
  const covers = DESTINATION_COVERS[destination];
  if (covers?.length) {
    // Dùng tripId để pick ảnh nhất quán (cùng trip luôn cùng ảnh)
    const idx = tripId.charCodeAt(0) % covers.length;
    return covers[idx];
  }
  const seed = `vn-${destination.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/\s+/g, '-')}`;
  return `https://picsum.photos/seed/${seed}/800/400`;
}
