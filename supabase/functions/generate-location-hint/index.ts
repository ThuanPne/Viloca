import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let location_id: string;
  try {
    ({ location_id } = await req.json());
    if (!location_id) throw new Error('missing location_id');
  } catch {
    return new Response(JSON.stringify({ error: 'Body must be JSON with location_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch the location's admin description
  const { data: loc, error: fetchErr } = await supabase
    .from('locations')
    .select('id, description, category, vibes')
    .eq('id', location_id)
    .single();

  if (fetchErr || !loc) {
    return new Response(JSON.stringify({ error: 'Location not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!loc.description) {
    return new Response(JSON.stringify({ error: 'Location has no description to generate hint from' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const vibesStr = (loc.vibes as string[])?.join(', ') || '';

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Bạn là copywriter du lịch sáng tạo. Viết 2-3 câu gợi mở sự tò mò về một địa điểm du lịch văn hóa Việt Nam.

TUYỆT ĐỐI KHÔNG được nhắc đến:
- Tên địa điểm, tên tỉnh/thành phố, tên đường
- Địa chỉ cụ thể, tọa độ, vị trí

CHỈ được gợi lên:
- Cảm xúc, trải nghiệm, bầu không khí
- Điều đặc biệt mà người đến đây sẽ cảm nhận được
- Sự kỳ bí, nét văn hóa độc đáo

Thể loại: ${loc.category}
Vibes: ${vibesStr}
Mô tả nội bộ (KHÔNG tiết lộ chi tiết này): ${loc.description}

Viết bằng tiếng Việt, văn phong thơ mộng và cuốn hút.`,
      },
    ],
  });

  const hint = (message.content[0] as { type: string; text: string }).text.trim();

  // Save hint back to locations table
  const { error: updateErr } = await supabase
    .from('locations')
    .update({ hint, hint_generated_at: new Date().toISOString() })
    .eq('id', location_id);

  if (updateErr) {
    return new Response(JSON.stringify({ error: 'Failed to save hint', detail: updateErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ location_id, hint }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
