/**
 * One-time geocode script: populate lat/lng for all locations that have an address.
 *
 * Usage (PowerShell):
 *   $env:EXPO_PUBLIC_AWS_MAP_API_KEY="v1.public.xxx"
 *   $env:EXPO_PUBLIC_SUPABASE_URL="https://..."
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   npx ts-node --skip-project --compiler-options '{\"module\":\"commonjs\",\"esModuleInterop\":true}' scripts/geocode-locations.ts --dry-run
 */

// @ts-ignore — node globals available at runtime
const process = globalThis.process;

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

const API_KEY = process.env.EXPO_PUBLIC_AWS_MAP_API_KEY as string;
const REGION = (process.env.AWS_REGION as string) ?? 'ap-southeast-2';
const GEOCODE_URL = `https://places.geo.${REGION}.amazonaws.com/v2/geocode?key=${API_KEY}`;

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(GEOCODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        QueryText: query,
        BiasPosition: [106.6297, 10.8231], // [lng, lat] — HCM City bias
        MaxResults: 1,
      }),
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status}: ${await res.text()}`);
      return null;
    }
    const data = await res.json() as any;
    const point = data.ResultItems?.[0]?.Position as [number, number] | undefined;
    if (!point) return null;
    return { lat: point[1], lng: point[0] }; // AWS returns [lng, lat]
  } catch (err: any) {
    console.error(`  Error: ${err?.message}`);
    return null;
  }
}

async function main() {
  if (!API_KEY) {
    console.error('Missing EXPO_PUBLIC_AWS_MAP_API_KEY');
    process.exit(1);
  }

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Region: ${REGION}\n`);

  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, address, city, district')
    .is('lat', null)
    .not('address', 'is', null)
    .eq('is_active', true)
    .order('city');

  if (error || !locations) {
    console.error('Supabase fetch error:', error);
    process.exit(1);
  }

  console.log(`Found ${locations.length} locations to geocode\n`);

  let success = 0;
  let failed = 0;

  for (const loc of locations) {
    const query = [loc.name, loc.address, loc.district, loc.city]
      .filter(Boolean)
      .join(', ');

    process.stdout.write(`[${loc.city}] ${loc.name} → `);

    const coords = await geocode(query);

    if (!coords) {
      console.log('FAILED');
      failed++;
    } else {
      console.log(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      if (!DRY_RUN) {
        const { error: updateErr } = await supabase
          .from('locations')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('id', loc.id);
        if (updateErr) {
          console.error('  Update error:', updateErr);
          failed++;
        } else {
          success++;
        }
      } else {
        success++;
      }
    }

    await sleep(200);
  }

  console.log(`\nDone: ${success} geocoded, ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
