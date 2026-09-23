import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Destination { id: string; lat: number; lng: number }
interface RequestBody {
  origin: { lat: number; lng: number };
  destinations: Destination[];
}
interface DistanceResult { id: string; label: string | null }

function formatDistance(meters: number): string {
  if (meters < 1000) {
    const rounded = Math.round(meters / 50) * 50;
    return `Cách ${rounded} m`;
  }
  return `Cách ${(meters / 1000).toFixed(1)} km`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  const { error: authError } = await supabaseClient.auth.getUser();
  if (authError) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const body: RequestBody = await req.json();
  const { origin, destinations } = body;

  if (!destinations || destinations.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('GOOGLE_ROUTES_API_KEY');
  if (!apiKey) {
    const nullResults: DistanceResult[] = destinations.map((d) => ({ id: d.id, label: null }));
    return new Response(JSON.stringify(nullResults), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const routeMatrixBody = {
      origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } }],
      destinations: destinations.map((d) => ({
        waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
      })),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
    };

    const response = await fetch(
      `https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,status',
        },
        body: JSON.stringify(routeMatrixBody),
      }
    );

    if (!response.ok) {
      const nullResults: DistanceResult[] = destinations.map((d) => ({ id: d.id, label: null }));
      return new Response(JSON.stringify(nullResults), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const rows: { originIndex: number; destinationIndex: number; distanceMeters?: number; status?: string }[] =
      await response.json();

    const results: DistanceResult[] = destinations.map((dest, idx) => {
      const row = rows.find((r) => r.destinationIndex === idx && r.originIndex === 0);
      if (!row || row.status !== 'OK' || row.distanceMeters == null) {
        return { id: dest.id, label: null };
      }
      return { id: dest.id, label: formatDistance(row.distanceMeters) };
    });

    return new Response(JSON.stringify(results), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch {
    const nullResults: DistanceResult[] = destinations.map((d) => ({ id: d.id, label: null }));
    return new Response(JSON.stringify(nullResults), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
