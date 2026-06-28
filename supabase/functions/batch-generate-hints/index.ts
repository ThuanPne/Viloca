import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function generateHint(loc: {
  id: string;
  description: string | null;
  short_description: string | null;
  category: string;
  vibes: string[];
}): Promise<string> {
  const sourceText = loc.description || loc.short_description || '';
  const vibesStr = (loc.vibes as string[])?.join(', ') || '';

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
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
Mô tả nội bộ (KHÔNG tiết lộ chi tiết này): ${sourceText}

Viết bằng tiếng Việt, văn phong thơ mộng và cuốn hút.`,
    }],
  });

  return (message.content[0] as { type: string; text: string }).text.trim();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!req.headers.get('Authorization')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch active locations without a hint yet
  const { data: locs, error: locsErr } = await supabase
    .from('locations')
    .select('id, description, short_description, category, vibes')
    .eq('is_active', true)
    .is('hint', null);

  if (locsErr) {
    return new Response(JSON.stringify({ error: locsErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only process those with some source text
  const eligible = (locs ?? []).filter((l) => l.description || l.short_description);

  if (!eligible.length) {
    return new Response(
      JSON.stringify({ message: 'No locations need hints', count: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const results = { success: 0, failed: 0, errors: [] as string[] };
  const BATCH_SIZE = 5;

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (loc) => {
        try {
          const hint = await generateHint(loc as any);
          const { error: updateErr } = await supabase
            .from('locations')
            .update({ hint, hint_generated_at: new Date().toISOString() })
            .eq('id', loc.id);
          if (updateErr) throw new Error(updateErr.message);
          results.success++;
        } catch (e) {
          results.failed++;
          results.errors.push(`${loc.id}: ${String(e)}`);
        }
      }),
    );

    if (i + BATCH_SIZE < eligible.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return new Response(
    JSON.stringify({ message: `Processed ${eligible.length} locations`, ...results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
