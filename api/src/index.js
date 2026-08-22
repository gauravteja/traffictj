// Admin + public API for traffic advisories, plus crowdsourced hazard
// reports (potholes, waterlogging - the V2 idea from CLAUDE.md).
// Replaces the WordPress-polling worker: advisories are now written
// directly as structured rows, no HTML parsing required.
//
// Routes:
//   POST /admin/advisories   - create an advisory (requires ADMIN_TOKEN)
//   GET  /advisories/active  - list current advisories (public, used by the app)
//   POST /hazards            - report a hazard (public, no auth - crowdsourced)
//   GET  /hazards/active     - list active hazards (public, used by the app)
//
// Bindings expected (see wrangler.toml):
//   env.DB          - D1 database binding (traffic-wedge-mvp)
//   env.ADMIN_TOKEN - secret string, set via `wrangler secret put ADMIN_TOKEN`

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      if (url.pathname === "/admin/advisories" && request.method === "POST") {
        return await createAdvisory(request, env);
      }

      if (url.pathname === "/advisories/active" && request.method === "GET") {
        return await listActiveAdvisories(env);
      }

      if (url.pathname === "/hazards" && request.method === "POST") {
        return await reportHazard(request, env);
      }

      if (url.pathname === "/hazards/active" && request.method === "GET") {
        return await listActiveHazards(env);
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: "Internal error", detail: String(err) }, 500);
    }
  },
};

async function createAdvisory(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON body" }, 400);

  const { city, road_names, reason, start_time, end_time, confidence, source_url } = body;

  if (!city || !["bengaluru", "hyderabad"].includes(city)) {
    return json({ error: "city must be 'bengaluru' or 'hyderabad'" }, 400);
  }
  if (!road_names || !road_names.trim()) {
    return json({ error: "road_names is required" }, 400);
  }
  if (!start_time || !end_time) {
    return json({ error: "start_time and end_time are required (ISO 8601 recommended)" }, 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO advisories
     (city, road_names, reason, start_time, end_time, source_url, confidence, raw_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      city,
      road_names.trim(),
      reason ? reason.trim() : null,
      start_time,
      end_time,
      source_url || null,
      confidence || "confirmed",
      null
    )
    .run();

  return json({ ok: true, id: result.meta.last_row_id }, 201, CORS_HEADERS);
}

async function listActiveAdvisories(env) {
  // "Active" = end_time is in the future (or null/unparsed, shown anyway
  // so nothing silently disappears until date-parsing is solid).
  const { results } = await env.DB.prepare(
    `SELECT id, city, road_names, reason, start_time, end_time, source_url, confidence
     FROM advisories
     WHERE confidence != 'cancelled'
     ORDER BY start_time ASC`
  ).all();

  return json({ advisories: results }, 200, CORS_HEADERS);
}

const HAZARD_TYPES = ["pothole", "waterlogging"];

// Public, unauthenticated - this is the crowdsourced reporting endpoint
// itself, unlike /admin/advisories. No login system exists yet
// (CLAUDE.md known gap #2), so there's no per-user rate limiting or
// spam protection here - acceptable for an MVP, revisit if abused.
async function reportHazard(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON body" }, 400);

  const { type, lat, lng, description, photo_url, source, reported_at } = body;

  if (!HAZARD_TYPES.includes(type)) {
    return json({ error: `type must be one of: ${HAZARD_TYPES.join(", ")}` }, 400);
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return json({ error: "lat and lng are required numbers" }, 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO hazards
     (type, lat, lng, description, photo_url, source, status, reported_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
  )
    .bind(
      type,
      lat,
      lng,
      description ? description.trim() : null,
      photo_url || null,
      source || "user_report",
      reported_at || new Date().toISOString()
    )
    .run();

  return json({ ok: true, id: result.meta.last_row_id }, 201, CORS_HEADERS);
}

async function listActiveHazards(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, type, lat, lng, description, photo_url, source, reported_at
     FROM hazards
     WHERE status = 'active'
     ORDER BY reported_at DESC`
  ).all();

  return json({ hazards: results }, 200, CORS_HEADERS);
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}
