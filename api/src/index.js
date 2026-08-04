// Admin + public API for traffic advisories.
// Replaces the WordPress-polling worker: advisories are now written
// directly as structured rows, no HTML parsing required.
//
// Routes:
//   POST /admin/advisories   - create an advisory (requires ADMIN_TOKEN)
//   GET  /advisories/active  - list current advisories (public, used by the app)
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

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}
