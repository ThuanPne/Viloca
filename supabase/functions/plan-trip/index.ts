import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

interface PlanRequest {
  days: number;
  budget_per_person: number; // VND
  group_size: number;
  vibes: string[];           // e.g. ['bình yên', 'cổ kính']
}

interface Slot {
  location_id: string;
  time_slot: string; // e.g. 'sáng', 'chiều', 'tối'
}

interface DayPlan {
  day: number;
  slots: Slot[];
}

interface TripPlan {
  days: DayPlan[];
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: PlanRequest;
  try {
    body = await req.json();
    if (!body.days || !body.budget_per_person || !body.group_size || !body.vibes?.length) {
      throw new Error('missing fields');
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body must include: days, budget_per_person, group_size, vibes[]' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { days, budget_per_person, group_size, vibes } = body;

  // Query locations_preview filtered by price and vibes
  const { data: locations, error: locErr } = await supabase
    .from('locations_preview')
    .select('id, category, vibes, price_per_person, duration_minutes, rating, hint')
    .lte('price_per_person', budget_per_person)
    .overlaps('vibes', vibes);

  if (locErr || !locations?.length) {
    return new Response(
      JSON.stringify({ error: 'No matching locations found', detail: locErr?.message }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Build metadata list for Claude — IDs only, no names/addresses
  const locationMeta = locations.map((l) => ({
    id: l.id,
    category: l.category,
    vibes: l.vibes,
    price_per_person: l.price_per_person,
    duration_minutes: l.duration_minutes,
    rating: l.rating,
  }));

  const slotsPerDay = 3; // sáng / chiều / tối

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Bạn là AI lập kế hoạch du lịch. Hãy lên lịch trip ${days} ngày cho nhóm ${group_size} người với ngân sách ${budget_per_person.toLocaleString('vi-VN')}đ/người/ngày.

Vibes mong muốn: ${vibes.join(', ')}

Danh sách địa điểm có thể chọn (chỉ dùng ID từ danh sách này):
${JSON.stringify(locationMeta, null, 2)}

Yêu cầu:
- Mỗi ngày có tối đa ${slotsPerDay} slot: sáng, chiều, tối
- Không lặp lại địa điểm
- Cân nhắc duration_minutes để xếp hợp lý
- Ưu tiên địa điểm có rating cao và vibes phù hợp

Trả về JSON thuần túy (không markdown, không giải thích), theo đúng cấu trúc:
{
  "days": [
    {
      "day": 1,
      "slots": [
        { "location_id": "<uuid>", "time_slot": "sáng" },
        { "location_id": "<uuid>", "time_slot": "chiều" }
      ]
    }
  ]
}`,
      },
    ],
  });

  let plan: TripPlan;
  try {
    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    plan = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'AI returned invalid JSON' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build a hint lookup from fetched locations
  const hintMap = new Map(locations.map((l) => [l.id, l.hint]));

  // Enrich slots with hints — never expose name/address
  const enriched = plan.days.map((d) => ({
    day: d.day,
    slots: d.slots.map((s) => ({
      location_id: s.location_id,
      time_slot: s.time_slot,
      hint: hintMap.get(s.location_id) ?? null,
    })),
  }));

  return new Response(JSON.stringify({ days: enriched }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
