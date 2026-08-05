# Traffic Wedge - Project Context

**Handoff verification phrase: MASTER-CUBBON-42**

Bengaluru/Hyderabad traffic prediction + alternate route app. This
file gives Claude Code the context built up over an earlier planning
conversation, so a fresh session doesn't have to rediscover it.

## Product wedge (why this app, not just "use Google Maps")

Not competing with Google on raw ETA prediction - can't out-data them.
The wedge is:
1. Proactive "leave-by" alerts for a fixed commute (push, not pull)
2. Advance warning of official road closures (VIP movement, festivals,
   ceremonies) that traffic police publish but most commuters miss
3. Eventually: crowdsourced hazard reports (potholes, flooding) -
   V2, not built yet

## Stack decisions and why

- **Cloudflare (Workers + D1 + Pages) + GitHub** - chosen for free
  tier + simplicity for a solo founder. Auto-deploy via GitHub Actions
  on push to main.
- **WordPress was tried and dropped.** Originally used as a free CMS
  for posting advisories (parsed from blog post HTML). Replaced with
  a direct admin API + static HTML form writing straight to D1 -
  simpler, no parsing fragility. The WordPress site
  (blorehydtrafficfeed.wordpress.com) still exists but is unused;
  safe to ignore or delete.
- **Maps: Leaflet + OpenStreetMap + OSRM, not Google Maps.** All free,
  no API key needed. Verified working in a real browser (outside any
  sandbox) with real route polylines. Google Maps was considered but
  not needed for this piece - may still be worth it later for
  production-grade routing accuracy, but the free stack works now.
- **Route-matching logic is real, not hardcoded.** See
  `mobile-app/src/utils/routeMatching.js` - keyword-overlap matching
  between a route's road segments and an advisory's road_names.
  Tested with real cases including false-positive checks.

## Current live infrastructure

- D1 database: `traffic-wedge-mvp` (id: a5e0d196-576d-4e10-885d-f0ef4656a47d)
  - Tables: users, saved_routes, advisories, alerts_sent
- Worker API: `traffic-admin-api` at traffic-admin-api.tjgt.workers.dev
  - `POST /admin/advisories` (needs ADMIN_TOKEN bearer auth)
  - `GET /advisories/active` (public)
- Admin form: `traffic-admin-form` on Cloudflare Pages
- GitHub repo: gauravteja/traffictj, auto-deploys api/ and
  admin-form/ via .github/workflows/deploy.yml on push to main

## Known gaps (honest, in rough priority order)

1. **Map coordinates are still placeholder**, not derived from real
   saved-route addresses. No geocoding step exists yet (Nominatim,
   OpenStreetMap's free geocoder, is the natural free option here).
2. **No user accounts.** `getSavedRoutes()` in the mobile app is
   still mocked - nothing ties a saved route to a real logged-in
   person yet.
3. **No push notifications.** Data is readable via the API, but
   nothing alerts a phone when a new advisory affects a saved route.
4. **Alternate route screen is a placeholder** (just shows an alert/
   toast) - no real re-routing logic exists.
5. **Pothole/flooding crowdsourced reports** - the original V2 idea,
   no schema or UI built at all yet.

## Things NOT to redo

- Don't reintroduce WordPress for anything.
- Don't default to Google Maps without discussing cost/API key
  tradeoffs first - the free stack is working and preferred unless
  there's a specific reason to switch.
- Route-matching is real logic already - don't hardcode a route id
  again if extending advisory handling.
