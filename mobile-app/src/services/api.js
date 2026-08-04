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

const API_BASE = "https://traffic-admin-api.YOUR_SUBDOMAIN.workers.dev";

export async function getSavedRoutes() {
  // TODO: still mocked - no /routes endpoint or auth/user system yet.
  return [
    {
      id: 1,
      label: "Home to office",
      etaMinutes: 32,
      etaDeltaMinutes: 8,
      leaveByTime: "8:52am",
      status: "disrupted",
    },
    {
      id: 2,
      label: "Office to gym",
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

function formatWindow(start, end) {
  const opts = { hour: "numeric", minute: "2-digit" };
  const s = new Date(start).toLocaleTimeString("en-IN", opts);
  const e = new Date(end).toLocaleTimeString("en-IN", opts);
  return `${s} to ${e}`;
}
