const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

let lastCallAt = 0;
const MIN_INTERVAL_MS = 1000;

async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const wait = Math.max(0, lastCallAt + MIN_INTERVAL_MS - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
  return fn();
}

interface NominatimResponse {
  display_name: string;
  lat: string;
  lon: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  return throttled(async () => {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ro`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'charging-station-thesis/0.3 (admin map)' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as NominatimResponse | { error?: string };
    if ('error' in json) return null;
    return (json as NominatimResponse).display_name;
  });
}

export async function forwardGeocode(
  query: string,
): Promise<{ lat: number; lon: number; displayName: string } | null> {
  return throttled(async () => {
    const url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1&accept-language=ro`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'charging-station-thesis/0.3 (admin map)' },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as NominatimResponse[];
    if (arr.length === 0) return null;
    const first = arr[0]!;
    return {
      lat: parseFloat(first.lat),
      lon: parseFloat(first.lon),
      displayName: first.display_name,
    };
  });
}
