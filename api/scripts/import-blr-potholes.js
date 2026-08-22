#!/usr/bin/env node
// One-time (or re-run whenever you want a fresh sync) import: pulls
// every issue from warlockdn/blr-potholes-data - a Bengaluru citizen's
// pothole-tracking project that stores each report as a GitHub Issue
// titled "Add location data: lat, lng" - and posts them to this
// project's own /hazards endpoint.
//
// This can't run from a network-restricted sandbox (api.github.com
// gets blocked there) - run it from your own machine, which is why
// this exists as a standalone script instead of something Claude ran
// directly. See CLAUDE.md for why only a 24-point partial sample was
// seeded directly instead of the full ~223.
//
// Usage:
//   node api/scripts/import-blr-potholes.js
//   GITHUB_TOKEN=ghp_xxx node api/scripts/import-blr-potholes.js   # higher rate limit (5000/hr vs 60/hr)
//   DRY_RUN=1 node api/scripts/import-blr-potholes.js              # parse + dedupe, don't POST
//
// Note: this doesn't check for the 24 points already seeded directly
// via D1 (source='seed_blr_potholes_github') - running this will add
// duplicates of those. Harmless (just a few overlapping pins on the
// map), but if you want it clean first, delete them via:
//   wrangler d1 execute traffic-wedge-mvp --command="DELETE FROM hazards WHERE source='seed_blr_potholes_github'"

const GITHUB_REPO = "warlockdn/blr-potholes-data";
const API_BASE = "https://traffic-admin-api.tjgt.workers.dev";
const TITLE_RE = /Add location data:\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;

async function fetchAllIssues() {
  const issues = [];
  let page = 1;
  const headers = { "User-Agent": "traffic-wedge-import-script" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  for (;;) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/issues?state=all&per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GitHub API error ${res.status} on page ${page}: ${await res.text()}`);
    }
    const batch = await res.json();
    if (batch.length === 0) break;
    issues.push(...batch);
    page += 1;
    // Polite pacing even though we're within rate limits.
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return issues;
}

function parseIssue(issue) {
  const match = issue.title.match(TITLE_RE);
  if (!match) return null;
  return {
    lat: parseFloat(match[1]),
    lng: parseFloat(match[2]),
    status: issue.state === "closed" ? "resolved" : "active",
    reportedAt: issue.created_at,
    description: `Imported from ${GITHUB_REPO}#${issue.number}`,
  };
}

function dedupe(points) {
  const seen = new Set();
  const out = [];
  for (const p of points) {
    const key = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

async function postHazard(point) {
  const res = await fetch(`${API_BASE}/hazards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "pothole",
      lat: point.lat,
      lng: point.lng,
      description: point.description,
      source: "seed_blr_potholes_github",
      reported_at: point.reportedAt,
    }),
  });
  return res.ok;
}

async function main() {
  console.log(`Fetching issues from ${GITHUB_REPO}...`);
  const issues = await fetchAllIssues();
  console.log(`Fetched ${issues.length} issues (open + closed).`);

  const parsed = issues.map(parseIssue).filter(Boolean);
  console.log(`Parsed ${parsed.length} valid "lat, lng" entries.`);

  const deduped = dedupe(parsed);
  console.log(`${deduped.length} unique locations after dedup.`);

  if (process.env.DRY_RUN) {
    console.log("DRY_RUN set - not posting anything. First 5:", deduped.slice(0, 5));
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const point of deduped) {
    const success = await postHazard(point);
    if (success) ok += 1;
    else failed += 1;
    process.stdout.write(success ? "." : "x");
  }
  console.log(`\nDone. ${ok} imported, ${failed} failed.`);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exitCode = 1;
});
