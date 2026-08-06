// Address -> lat/lng via Nominatim, OpenStreetMap's free geocoder.
// No API key needed - consistent with the rest of the map stack
// (Leaflet + OSM + OSRM, see CLAUDE.md "Stack decisions").
//
// Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
// asks for a real identifying User-Agent and no more than ~1 request/
// second. We cache in-memory per session - the same address string is
// never looked up twice - and queue requests so concurrent callers
// (e.g. geocoding a route's origin and destination together) never
// fire faster than that limit.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TrafficWedge/0.1 (traffic-wedge-mvp; contact: gauravteja@gmail.com)";
const MIN_REQUEST_GAP_MS = 1100;

const cache = new Map();
let lastRequestAt = 0;
let queue = Promise.resolve();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throttledFetch(url) {
  const run = queue.then(async () => {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < MIN_REQUEST_GAP_MS) {
      await wait(MIN_REQUEST_GAP_MS - elapsed);
    }
    lastRequestAt = Date.now();
    return fetch(url, { headers: { "User-Agent": USER_AGENT } });
  });
  // Keep the queue alive even if this request fails, so one bad
  // lookup doesn't wedge every geocode call after it.
  queue = run.catch(() => {});
  return run;
}

// Resolves free-text address to { lat, lon }, or null if Nominatim
// has no match. Only throws for actual network/HTTP failures, so
// callers can tell "not found" apart from "couldn't check."
export async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;

  const key = address.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await throttledFetch(url);
  if (!res.ok) {
    throw new Error(`Nominatim request failed: ${res.status}`);
  }

  const results = await res.json();
  const coords = results.length
    ? { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) }
    : null;

  cache.set(key, coords);
  return coords;
}
