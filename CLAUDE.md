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
- **Route-matching is NOT built yet - this earlier note was wrong.**
  `mobile-app/src/utils/routeMatching.js` does not exist (checked full
  git history, all branches - never committed). The real code, in
  `mobile-app/src/services/api.js`, hardcodes
  `affectedRouteId: 1 // TODO: real route-matching, not hardcoded`.
  See known gap #6 below.
- **Geocoding: Nominatim (OpenStreetMap's free geocoder), no API key.**
  `mobile-app/src/utils/geocoding.js` resolves a route's
  `originAddress`/`destinationAddress` to lat/lon, in-memory cached,
  throttled to Nominatim's ~1 req/sec usage policy.
  `RouteMap.js` calls it instead of hardcoding coordinates - see
  known gap #1. Unlike the Leaflet/OSM/OSRM decision above, this has
  **not** been confirmed working in a real device/browser yet, only
  syntax-checked - don't claim it's verified until someone actually
  runs the Expo app and sees a real route render.

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

1. **Map coordinates: geocoding now wired in, not yet verified live.**
   `RouteMap.js` calls `utils/geocoding.js` (Nominatim) on
   `route.originAddress`/`destinationAddress` instead of hardcoding
   coordinates. Written and syntax-checked, but never run in an
   actual Expo session - confirm it renders a real route before
   calling this fully done. Also still downstream of gap #2: the
   addresses themselves are mocked in `getSavedRoutes()`, not tied to
   a real user yet.
2. **No user accounts.** `getSavedRoutes()` in the mobile app is
   still mocked - nothing ties a saved route to a real logged-in
   person yet.
3. **No push notifications.** Data is readable via the API, but
   nothing alerts a phone when a new advisory affects a saved route.
4. **Alternate route screen is a placeholder** (just shows an alert/
   toast) - no real re-routing logic exists.
5. **Pothole/flooding crowdsourced reports** - the original V2 idea,
   no schema or UI built at all yet.
6. **Route-matching is hardcoded, not real.** `getActiveAdvisories()`
   in `mobile-app/src/services/api.js` sets every advisory's
   `affectedRouteId` to `1` regardless of content. No keyword-overlap
   or road-segment matching exists. (An earlier version of this file
   claimed this was already built in `routeMatching.js` - that file
   never existed; verified against full git history on 2026-08-05.)

## Things NOT to redo

- Don't reintroduce WordPress for anything.
- Don't default to Google Maps without discussing cost/API key
  tradeoffs first - the free stack is working and preferred unless
  there's a specific reason to switch.
- Don't claim route-matching is done again until
  `mobile-app/src/utils/routeMatching.js` (or equivalent) actually
  exists and `affectedRouteId` is no longer hardcoded to `1`.
