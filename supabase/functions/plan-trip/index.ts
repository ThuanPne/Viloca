import { BedrockRuntimeClient, ConverseCommand } from 'npm:@aws-sdk/client-bedrock-runtime';
import { FetchHttpHandler } from 'npm:@smithy/fetch-http-handler';
import { createClient } from 'npm:@supabase/supabase-js';

const bedrock = new BedrockRuntimeClient({
  region: Deno.env.get('AWS_REGION') ?? 'ap-southeast-2',
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
  requestHandler: new FetchHttpHandler(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

interface PlanRequest {
  destination: string;
  days: number;
  budget_per_person: number;
  group_size: number;
  vibes: string[];
  accommodation?: string;
  transport?: string;
  activity_level?: string;
  traveling_with?: 'solo' | 'couple' | 'family' | 'friends';
  dietary_restrictions?: string[];
  must_include_ids?: string[];
  arrival_time?: string;    // "HH:MM"
  departure_time?: string;  // "HH:MM"
}

interface Slot {
  location_id: string;
  time_slot: string; // 'sáng' | 'chiều' | 'tối'
  reason?: string;
}

interface DayPlan {
  day: number;
  slots: Slot[];
}

interface TripPlan {
  days: DayPlan[];
}

const TRAVELING_WITH_LABEL: Record<string, string> = {
  solo:    'đi một mình',
  couple:  'cặp đôi',
  family:  'gia đình có trẻ em / người lớn tuổi',
  friends: 'nhóm bạn',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

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
    if (!body.destination || !body.days || !body.budget_per_person || !body.group_size || !body.vibes?.length) {
      throw new Error('missing fields');
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body must include: destination, days, budget_per_person, group_size, vibes[]' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const {
    destination, days, budget_per_person, group_size, vibes,
    accommodation, transport, activity_level,
    traveling_with, dietary_restrictions, must_include_ids, arrival_time, departure_time,
  } = body;

  const COLS = 'id, name, category, vibes, price_per_person, duration_minutes, rating, hint, district';

  // Primary: destination + budget + vibes
  const { data: locations, error: locErr } = await supabase
    .from('locations')
    .select(COLS)
    .eq('is_active', true)
    .ilike('address', `%${destination}%`)
    .lte('price_per_person', budget_per_person)
    .overlaps('vibes', vibes);

  let finalLocations = locations;
  if (locErr || !locations?.length) {
    // Fallback 1: destination + budget, relax vibes
    const { data: fb1 } = await supabase
      .from('locations').select(COLS).eq('is_active', true)
      .ilike('address', `%${destination}%`).lte('price_per_person', budget_per_person);
    if (fb1?.length) {
      finalLocations = fb1;
    } else {
      // Fallback 2: destination only
      const { data: fb2 } = await supabase
        .from('locations').select(COLS).eq('is_active', true)
        .ilike('address', `%${destination}%`);
      if (fb2?.length) {
        finalLocations = fb2;
      } else {
        // Fallback 3: no location filter
        const { data: fb3, error: fb3Err } = await supabase
          .from('locations').select(COLS).eq('is_active', true);
        if (!fb3?.length) {
          return new Response(
            JSON.stringify({ error: 'Database has no active locations.', detail: locErr?.message ?? fb3Err?.message }),
            { status: 404, headers: { 'Content-Type': 'application/json' } },
          );
        }
        finalLocations = fb3;
      }
    }
  }

  const locationMeta = finalLocations!.map((l) => ({
    id: l.id,
    name: l.name,
    category: l.category,
    district: l.district ?? null,
    vibes: l.vibes,
    price_per_person: l.price_per_person,
    duration_minutes: l.duration_minutes,
    rating: l.rating,
  }));

  // must_include_ids: ensure those locations are in pool
  if (must_include_ids?.length) {
    const existingIds = new Set(locationMeta.map((l) => l.id));
    const missing = must_include_ids.filter((id) => !existingIds.has(id));
    if (missing.length) {
      const { data: mustLocs } = await supabase
        .from('locations').select(COLS).in('id', missing);
      if (mustLocs?.length) {
        locationMeta.push(...mustLocs.map((l) => ({
          id: l.id, name: l.name, category: l.category, district: l.district ?? null,
          vibes: l.vibes, price_per_person: l.price_per_person,
          duration_minutes: l.duration_minutes, rating: l.rating,
        })));
      }
    }
  }

  const slotsPerDay = activity_level === 'Thư giãn' ? 'tối đa 2' : activity_level === 'Năng động' ? 'luôn 3' : '2–3';

  const travelingWithLine = traveling_with
    ? `Thành phần nhóm: ${TRAVELING_WITH_LABEL[traveling_with] ?? traveling_with}`
    : '';
  const dietLine = dietary_restrictions?.length
    ? `Yêu cầu ẩm thực: ${dietary_restrictions.join(', ')}`
    : '';
  const mustIncludeLine = must_include_ids?.length
    ? `Địa điểm bắt buộc có trong lịch: ${must_include_ids.join(', ')}`
    : '';
  const arrivalLine  = arrival_time   ? `Giờ đến ngày 1: ${arrival_time} (chỉ xếp địa điểm sau giờ này)` : '';
  const departureLine = departure_time ? `Giờ về ngày cuối: ${departure_time} (kết thúc trước giờ này)` : '';

  const prompt = `Bạn là AI lập kế hoạch du lịch chuyên nghiệp cho khách Việt Nam.

=== THÔNG TIN CHUYẾN ĐI ===
Điểm đến: ${destination}
Thời gian: ${days} ngày
Nhóm: ${group_size} người${traveling_with ? ` – ${TRAVELING_WITH_LABEL[traveling_with]}` : ''}
Ngân sách: tối đa ${budget_per_person.toLocaleString('vi-VN')}đ/người/ngày
Phong cách: ${vibes.join(', ')}
${accommodation   ? `Lưu trú: ${accommodation}` : ''}
${transport       ? `Phương tiện: ${transport}` : ''}
${activity_level  ? `Mức độ hoạt động: ${activity_level}` : ''}
${travelingWithLine}
${dietLine}
${mustIncludeLine}
${arrivalLine}
${departureLine}

=== DANH SÁCH ĐỊA ĐIỂM (CHỈ dùng location_id từ đây) ===
${JSON.stringify(locationMeta, null, 2)}

=== 9 NGUYÊN TẮC BẮT BUỘC ===
1. KHÔNG ĐƯỢC bịa location_id — chỉ dùng uuid có trong danh sách trên
2. Không lặp địa điểm (mỗi uuid xuất hiện tối đa 1 lần)
3. price_per_person của mọi địa điểm phải ≤ ${budget_per_person.toLocaleString('vi-VN')}đ — lọc nghiêm ngặt
4. Nhóm địa điểm cùng district vào cùng nửa ngày để tiết kiệm di chuyển
5. Tôn trọng duration_minutes: tổng thời gian trong 1 slot không vượt 180 phút
6. Ngày đầu tiên: ưu tiên khu vực trung tâm / district nổi tiếng, dễ định hướng
7. Ngày cuối: kết thúc gần điểm xuất phát, ưu tiên Ẩm thực/Café, tránh địa điểm xa
8. Ưu tiên địa điểm có rating cao và vibes phù hợp [${vibes.join(', ')}]
9. Số slot/ngày: ${slotsPerDay} (sáng/chiều/tối)

Với mỗi slot, giải thích ngắn gọn lý do chọn địa điểm này (1 câu) trong field "reason".

=== FORMAT OUTPUT (JSON thuần túy, không markdown, không <think>) ===
{
  "days": [
    {
      "day": 1,
      "slots": [
        {
          "location_id": "<uuid từ danh sách>",
          "time_slot": "sáng",
          "reason": "Lý do ngắn gọn tại sao chọn địa điểm này vào thời điểm này"
        }
      ]
    }
  ]
}`;

  let raw: string;
  try {
    const response = await bedrock.send(new ConverseCommand({
      modelId: Deno.env.get('BEDROCK_MODEL_ID') ?? 'qwen.qwen3-235b-a22b-2507-v1:0',
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 2048, temperature: 0.3 },
    }));
    raw = response.output?.message?.content?.[0]?.text?.trim() ?? '';
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'AI call failed', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let plan: TripPlan;
  try {
    const cleaned = raw
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    plan = JSON.parse(cleaned);
  } catch {
    return new Response(JSON.stringify({ error: 'AI returned invalid JSON', raw }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Enrich slots — filter hallucinated IDs, attach hint + reason
  const hintMap = new Map(finalLocations!.map((l) => [l.id, l.hint]));
  const enriched = plan.days.map((d) => ({
    day: d.day,
    slots: d.slots
      .filter((s) => hintMap.has(s.location_id))
      .map((s) => ({
        location_id: s.location_id,
        time_slot:   s.time_slot,
        hint:        hintMap.get(s.location_id) ?? null,
        reason:      s.reason ?? null,
      })),
  }));

  return new Response(JSON.stringify({ days: enriched }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
