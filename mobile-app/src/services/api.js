// Stub data service. Replace these functions with real fetch() calls
// once the route-matching + alerts Worker exists (the piece flagged
// as "not built yet" in the traffic-worker README).
//
// Expected real endpoints, once built:
//   GET  /routes           -> saved_routes for the logged-in user
//   GET  /advisories/active -> current advisories matching the user's routes
//
// Swap each function body below for a fetch() against those endpoints.
// Keep the same return shape so screens don't need to change.

const API_BASE = "https://traffic-admin-api.tjgt.workers.dev";

export async function getSavedRoutes() {
  // TODO: still mocked - no /routes endpoint or auth/user system yet.
  // originAddress/destinationAddress are real, geocodable place names
  // (fed to utils/geocoding.js) so RouteMap can show an actual map
  // instead of the old hardcoded coordinates - see CLAUDE.md known
  // gap #1. Once real accounts exist, these come from the user.
  return [
    {
      id: 1,
      label: "Home to office",
      originAddress: "Indiranagar, Bengaluru",
      destinationAddress: "Cubbon Park, Bengaluru",
      etaMinutes: 32,
      etaDeltaMinutes: 8,
      leaveByTime: "8:52am",
      status: "disrupted",
    },
    {
      id: 2,
      label: "Office to gym",
      originAddress: "Cubbon Park, Bengaluru",
      destinationAddress: "Koramangala, Bengaluru",
      etaMinutes: 14,
      etaDeltaMinutes: 0,
      leaveByTime: null,
      status: "clear",
    },
  ];
}

export async function getActiveAdvisories() {
  const res = await fetch(`${API_BASE}/advisories/active`);
  if (!res.ok) throw new Error("Failed to load advisories");
  const data = await res.json();

  // Map D1's raw shape to what the UI components expect.
  return data.advisories.map((a) => ({
    id: a.id,
    roadNames: a.road_names,
    windowText: formatWindow(a.start_time, a.end_time),
    reason: a.reason,
    affectedRouteId: 1, // TODO: real route-matching, not hardcoded
  }));
}

// Crowdsourced hazard reports (potholes, waterlogging) - CLAUDE.md's
// V2 idea, now a real endpoint. Seeded with a sample from a Bengaluru
// citizen's open pothole-tracking project (source: 'seed_blr_potholes_github'),
// plus whatever gets reported through reportHazard() below
// ('user_report').
export async function getActiveHazards() {
  const res = await fetch(`${API_BASE}/hazards/active`);
  if (!res.ok) throw new Error("Failed to load hazards");
  const data = await res.json();
  return data.hazards.map((h) => ({
    id: h.id,
    type: h.type,
    lat: h.lat,
    lng: h.lng,
    description: h.description,
  }));
}

// Takes already-geocoded lat/lng - geocoding an address is the UI
// layer's job (see ReportHazardModal), same as RouteMap does its own
// geocoding rather than pushing it into this service file.
export async function reportHazard({ type, lat, lng, description }) {
  const res = await fetch(`${API_BASE}/hazards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, lat, lng, description: description || undefined }),
  });
  if (!res.ok) throw new Error("Failed to submit report");
  return res.json();
}

function formatWindow(start, end) {
  const opts = { hour: "numeric", minute: "2-digit" };
  const s = new Date(start).toLocaleTimeString("en-IN", opts);
  const e = new Date(end).toLocaleTimeString("en-IN", opts);
  return `${s} to ${e}`;
}
