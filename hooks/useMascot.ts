import { useMemo } from 'react';
import type { MascotEmotion, MascotState } from '@/types/mascot';

interface TimeSlot {
  emotion: MascotEmotion;
  greetings: string[];
}

const TIME_SLOTS: { start: number; end: number; slot: TimeSlot }[] = [
  {
    start: 5, end: 11,
    slot: {
      emotion: 'happy',
      greetings: [
        'Chào buổi sáng! Hôm nay khám phá đâu nào? ☀️',
        'Sáng sớm rồi, sẵn sàng lên đường chưa? 🌸',
        'Buổi sáng đẹp trời! Đi dạo đâu không? 🌿',
      ],
    },
  },
  {
    start: 12, end: 17,
    slot: {
      emotion: 'excited',
      greetings: [
        'Chiều rồi, đi dạo đâu đó không? 🍃',
        'Giờ này ghé thử quán cà phê view đẹp nhé! ☕',
        'Buổi chiều lý tưởng để khám phá phố cổ! 🏮',
      ],
    },
  },
  {
    start: 18, end: 21,
    slot: {
      emotion: 'love',
      greetings: [
        'Tối rồi, tìm chỗ ăn ngon thôi! 🍜',
        'Tối nay thử món mới nhé? Sen biết chỗ ngon lắm! 🌙',
        'Đêm xuống rồi, đi ăn vặt vỉa hè không? 🍢',
      ],
    },
  },
  {
    start: 22, end: 28, // 22:00 - 04:59 (28 = 24+4)
    slot: {
      emotion: 'idle',
      greetings: [
        'Khuya rồi, lên kế hoạch chuyến đi ngày mai nhé 🌙',
        'Đêm khuya vẫn còn thức à? Lên lịch trip thôi! ✨',
        'Chưa ngủ à? Cùng Sen khám phá điểm đến mới nhé 🗺️',
      ],
    },
  },
];

function getTimeSlot(hour: number): TimeSlot {
  const h = hour < 5 ? hour + 24 : hour;
  const match = TIME_SLOTS.find((t) => h >= t.start && h <= t.end);
  return match?.slot ?? TIME_SLOTS[0].slot;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useMascot(overrideEmotion?: MascotEmotion): MascotState {
  return useMemo(() => {
    const hour = new Date().getHours();
    const slot = getTimeSlot(hour);
    return {
      emotion: overrideEmotion ?? slot.emotion,
      greeting: pickRandom(slot.greetings),
    };
  }, [overrideEmotion]);
}
