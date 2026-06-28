export type TourStatus = 'pending' | 'confirmed' | 'active' | 'completed';

export interface StopItem {
  id: string;
  time: string;
  name: string;
  category: string;
  durationLabel: string;
  travelNext?: { label: string; mode: 'drive' | 'walk' };
}

export interface MockBookingDetail {
  id: string;
  bookingCode: string;
  status: TourStatus;
  title: string;
  dateLabel: string;
  timeRange: string;
  coverSeed: string;
  meetingPoint: string;
  guideEarning: number;
  tourPrice: number;
  platformFee: number;
  deadlineMinutes: number | null;
  customer: {
    initials: string;
    name: string;
    role: string;
    source: string;
    guestCount: number;
    language: string;
  };
  specialRequests: { emoji: string; text: string }[];
  schedule: StopItem[];
  payment: {
    base: number;
    extras: { label: string; amount: number }[];
    total: number;
  };
}

export let MOCK_BOOKING_DETAILS: MockBookingDetail[] = [
  {
    id: '1',
    bookingCode: 'VL-7842',
    status: 'pending',
    title: 'Tour Ngũ Hành Sơn',
    dateLabel: '21 Th7, 2026',
    timeRange: '08:00 – 13:00',
    coverSeed: 'ngu-hanh-son',
    meetingPoint: 'Cổng chính Ngũ Hành Sơn, Đà Nẵng',
    guideEarning: 1_200_000,
    tourPrice: 1_800_000,
    platformFee: 600_000,
    deadlineMinutes: 150,
    customer: {
      initials: 'NT',
      name: 'Nguyễn Thị Thu',
      role: 'Khách du lịch',
      source: 'Booking trực tiếp',
      guestCount: 15,
      language: 'Tiếng Anh',
    },
    specialRequests: [
      { emoji: '👶', text: 'Nhóm có 2 trẻ em dưới 10 tuổi, cần hỗ trợ thêm' },
      { emoji: '🦽', text: 'Một thành viên đi xe lăn — cần tuyến đường bằng phẳng' },
    ],
    schedule: [
      {
        id: 's1-1',
        time: '08:00',
        name: 'Điểm danh – Cổng chính Ngũ Hành Sơn',
        category: 'Điểm danh',
        durationLabel: '15 phút',
        travelNext: { label: '5 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's1-2',
        time: '08:20',
        name: 'Động Âm Phủ',
        category: 'Di tích',
        durationLabel: '45 phút',
        travelNext: { label: '8 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's1-3',
        time: '09:15',
        name: 'Động Huyền Không',
        category: 'Di tích',
        durationLabel: '50 phút',
        travelNext: { label: '10 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's1-4',
        time: '10:20',
        name: 'Chùa Tam Thai',
        category: 'Tâm linh',
        durationLabel: '30 phút',
        travelNext: { label: '15 phút xe', mode: 'drive' },
      },
      {
        id: 's1-5',
        time: '11:30',
        name: 'Ăn trưa – Nhà hàng Non Nước',
        category: 'Ẩm thực',
        durationLabel: '60 phút',
      },
    ],
    payment: {
      base: 1_800_000,
      extras: [{ label: 'Phí nền tảng (33%)', amount: -600_000 }],
      total: 1_200_000,
    },
  },

  {
    id: '2',
    bookingCode: 'VL-3391',
    status: 'confirmed',
    title: 'Tour Phố cổ Hội An — Đêm',
    dateLabel: '18 Th7, 2026',
    timeRange: '18:00 – 21:30',
    coverSeed: 'hoi-an-night',
    meetingPoint: 'Cầu Nhật Bản, Hội An',
    guideEarning: 800_000,
    tourPrice: 1_200_000,
    platformFee: 400_000,
    deadlineMinutes: null,
    customer: {
      initials: 'LV',
      name: 'Lê Văn Minh',
      role: 'Khách quốc tế',
      source: 'Klook',
      guestCount: 8,
      language: 'Tiếng Việt',
    },
    specialRequests: [
      { emoji: '🌙', text: 'Muốn xem đèn lồng và chụp ảnh theo phong cách retro' },
    ],
    schedule: [
      {
        id: 's2-1',
        time: '18:00',
        name: 'Điểm danh – Cầu Nhật Bản',
        category: 'Điểm danh',
        durationLabel: '10 phút',
        travelNext: { label: '3 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's2-2',
        time: '18:15',
        name: 'Chùa Cầu – Japanese Bridge',
        category: 'Di tích',
        durationLabel: '25 phút',
        travelNext: { label: '5 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's2-3',
        time: '18:45',
        name: 'Bảo tàng Gốm sứ Mậu Dịch',
        category: 'Văn hóa',
        durationLabel: '30 phút',
        travelNext: { label: '7 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's2-4',
        time: '19:20',
        name: 'Phố đèn lồng Nguyễn Thái Học',
        category: 'Thiên nhiên',
        durationLabel: '40 phút',
        travelNext: { label: '10 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's2-5',
        time: '20:10',
        name: 'Ăn tối – Cơm Gà Bà Buội',
        category: 'Ẩm thực',
        durationLabel: '75 phút',
      },
    ],
    payment: {
      base: 1_200_000,
      extras: [{ label: 'Phí nền tảng (33%)', amount: -400_000 }],
      total: 800_000,
    },
  },

  {
    id: '3',
    bookingCode: 'VL-5517',
    status: 'active',
    title: 'Tour Bà Nà Hills',
    dateLabel: '28 Th6, 2026',
    timeRange: '07:30 – 17:00',
    coverSeed: 'ba-na-hills',
    meetingPoint: 'Trạm cáp treo Sun World, Đà Nẵng',
    guideEarning: 2_500_000,
    tourPrice: 3_500_000,
    platformFee: 1_000_000,
    deadlineMinutes: null,
    customer: {
      initials: 'CT',
      name: 'Công ty ABC Travel',
      role: 'Đoàn công ty',
      source: 'Hợp đồng B2B',
      guestCount: 20,
      language: 'Tiếng Anh',
    },
    specialRequests: [
      { emoji: '🎙️', text: 'Cần loa di động để thuyết minh cho cả đoàn' },
      { emoji: '📸', text: 'Dừng lâu hơn ở Cầu Vàng để chụp ảnh nhóm' },
    ],
    schedule: [
      {
        id: 's3-1',
        time: '07:30',
        name: 'Điểm danh – Trạm cáp treo Sun World',
        category: 'Điểm danh',
        durationLabel: '15 phút',
        travelNext: { label: '20 phút cáp treo', mode: 'drive' },
      },
      {
        id: 's3-2',
        time: '08:00',
        name: 'Đỉnh Bà Nà Hills – Vọng lâu',
        category: 'Thiên nhiên',
        durationLabel: '45 phút',
        travelNext: { label: '10 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's3-3',
        time: '09:00',
        name: 'Làng Pháp – French Village',
        category: 'Văn hóa',
        durationLabel: '50 phút',
        travelNext: { label: '8 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's3-4',
        time: '10:00',
        name: 'Cầu Vàng – Golden Bridge',
        category: 'Di tích',
        durationLabel: '40 phút',
        travelNext: { label: '12 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's3-5',
        time: '11:00',
        name: 'Vườn hoa Le Jardin D\'Amour',
        category: 'Thiên nhiên',
        durationLabel: '50 phút',
        travelNext: { label: '15 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's3-6',
        time: '12:30',
        name: 'Ăn trưa – Buffet Tây trong khu resort',
        category: 'Ẩm thực',
        durationLabel: '90 phút',
      },
    ],
    payment: {
      base: 3_500_000,
      extras: [{ label: 'Phụ phí loa di động', amount: 200_000 }, { label: 'Phí nền tảng (33%)', amount: -1_000_000 }],
      total: 2_700_000,
    },
  },

  {
    id: '4',
    bookingCode: 'VL-1105',
    status: 'completed',
    title: 'Tour Mỹ Sơn Thánh địa',
    dateLabel: '15 Th6, 2026',
    timeRange: '09:00 – 14:00',
    coverSeed: 'my-son-sanctuary',
    meetingPoint: 'Cổng Thánh địa Mỹ Sơn, Quảng Nam',
    guideEarning: 900_000,
    tourPrice: 1_400_000,
    platformFee: 500_000,
    deadlineMinutes: null,
    customer: {
      initials: 'PB',
      name: 'Pierre Beaumont',
      role: 'Du khách Pháp',
      source: 'GetYourGuide',
      guestCount: 6,
      language: 'Tiếng Pháp',
    },
    specialRequests: [
      { emoji: '📖', text: 'Khách quan tâm đến lịch sử Chăm Pa, muốn nghe kỹ thuyết minh' },
    ],
    schedule: [
      {
        id: 's4-1',
        time: '09:00',
        name: 'Điểm danh – Cổng Mỹ Sơn',
        category: 'Điểm danh',
        durationLabel: '10 phút',
        travelNext: { label: '5 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's4-2',
        time: '09:15',
        name: 'Khu tháp A – Tháp chính Mỹ Sơn',
        category: 'Di tích',
        durationLabel: '45 phút',
        travelNext: { label: '5 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's4-3',
        time: '10:05',
        name: 'Khu tháp B-C – Đền thờ thần Vishnu',
        category: 'Di tích',
        durationLabel: '40 phút',
        travelNext: { label: '8 phút đi bộ', mode: 'walk' },
      },
      {
        id: 's4-4',
        time: '10:55',
        name: 'Bảo tàng Điêu khắc Chăm',
        category: 'Văn hóa',
        durationLabel: '30 phút',
        travelNext: { label: '20 phút xe', mode: 'drive' },
      },
      {
        id: 's4-5',
        time: '12:00',
        name: 'Ăn trưa – Nhà hàng Làng Duy Phú',
        category: 'Ẩm thực',
        durationLabel: '60 phút',
      },
    ],
    payment: {
      base: 1_400_000,
      extras: [{ label: 'Phí nền tảng (33%)', amount: -500_000 }],
      total: 900_000,
    },
  },
];

export function updateTourStatus(id: string, newStatus: TourStatus) {
  const tour = MOCK_BOOKING_DETAILS.find((t) => t.id === id);
  if (tour) tour.status = newStatus;
}

export function getTourById(id: string): MockBookingDetail | undefined {
  return MOCK_BOOKING_DETAILS.find((t) => t.id === id);
}
