# Traffic Wedge - Project Context

**Handoff verification phrase: MASTER-CUBBON-42**

Bengaluru/Hyderabad traffic prediction + alternate route app. This
file gives Claude Code the context built up over an earlier planning
conversation, so a fresh session doesn't have to rediscover it.

## Product wedge (why this app, not just "use Google Maps")

Not competing with Google on raw ETA prediction - can't out-data them.
The wedge is:
1. Proactive "leave-by" info for a fixed commute, shown the moment
   you open the app - pull-based by design, not push. Push
   notifications were considered and explicitly dropped from scope
   (gauravteja, 2026-08-22) - see "Things NOT to redo"
2. Advance warning of official road closures (VIP movement, festivals,
   ceremonies) that traffic police publish but most commuters miss
3. Crowdsourced hazard reports (potholes, waterlogging) - built
   2026-08-22, see known gap #5 for what's still unverified

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
  See known gap #5 below.
- **Geocoding: Nominatim (OpenStreetMap's free geocoder), no API key.**
  `mobile-app/src/utils/geocoding.js` resolves a route's
  `originAddress`/`destinationAddress` to lat/lon, in-memory cached,
  throttled to Nominatim's ~1 req/sec usage policy.
  `RouteMap.js` calls it instead of hardcoding coordinates - see
  known gap #1. The geocoding logic itself is confirmed working: run
  live in a real browser on 2026-08-06 against the actual
  `geocodeAddress()` code (Indiranagar -> 12.9732913, 77.6404672;
  Cubbon Park -> 12.9742535, 77.5921906), with a real OSRM route
  rendered on top (8.4 km, 13 min). What's still unconfirmed is
  `RouteMap.js`'s in-app behavior on native - it's been run as a web
  build (see below), just not on an actual phone/simulator yet.
- **`mobile-app` had no lockfile or `.gitignore` until 2026-08-06.**
  That let `npm install` silently resolve `expo-font` to an
  incompatible version (57.x instead of the SDK 51-correct 12.0.10),
  which crashed `npx expo start --web` with
  `registerWebModule is not a function`. Fixed by pinning
  `expo-font` and committing `package-lock.json` - if a fresh
  install ever breaks the same way again, check for a lockfile drift
  first before assuming the app code is at fault.
- **`api.js`'s `API_BASE` was a literal unreplaced placeholder for a
  long time.** It read `traffic-admin-api.YOUR_SUBDOMAIN.workers.dev`
  - a domain that has never resolved - so `getActiveAdvisories()`
  always failed, on any device, not just in a sandboxed session.
  `admin-form/index.html` had the correct URL
  (`traffic-admin-api.tjgt.workers.dev`) the whole time; `api.js`
  just never got the same fix. Fixed 2026-08-22. If a fetch call
  anywhere in this app mysteriously fails, check the literal URL
  string before assuming it's a network/CORS/backend issue.
- **Hazard reports seeded from a citizen's open pothole-tracking
  project, not scraped live.** `warlockdn/blr-potholes-data` stores
  each report as a GitHub Issue titled `Add location data: lat, lng`.
  It's anonymous, undocumented, unlicensed, and could change or
  disappear anytime - treated as a one-time seed
  (`source='seed_blr_potholes_github'`), not a live dependency. Only
  24 deduped points were imported directly (via D1, not the app) -
  `api.github.com` is blocked from a sandboxed session, so the full
  ~223-issue sync has to run from a real machine via
  `api/scripts/import-blr-potholes.js`.

## Current live infrastructure

- D1 database: `traffic-wedge-mvp` (id: a5e0d196-576d-4e10-885d-f0ef4656a47d)
  - Tables: users, saved_routes, advisories, alerts_sent, hazards
  - `hazards` is the only one with a migration file checked in
    (`api/migrations/0001_create_hazards.sql`) - the others exist only
    as whatever's live in D1, no schema file for them yet.
- Worker API: `traffic-admin-api` at traffic-admin-api.tjgt.workers.dev
  - `POST /admin/advisories` (needs ADMIN_TOKEN bearer auth)
  - `GET /advisories/active` (public)
  - `POST /hazards` (public, no auth - crowdsourced)
  - `GET /hazards/active` (public)
- Admin form: `traffic-admin-form` on Cloudflare Pages
- Mobile app web preview: `traffic-wedge-web` on Cloudflare Pages
  (added 2026-08-06). Static `expo export -p web` build of
  `mobile-app`, deployed on every push to main. **Not the native app**
  - no real WebView, no push notifications - it's a browser-testable
  stand-in for showing clients real UI/behavior before there's an
  installable phone build. **Confirmed working end-to-end 2026-08-22**
  in a real browser at https://traffic-wedge-web.pages.dev: routes
  load, advisories load from the real Worker API, and the map
  geocodes and renders a real route. (Took 3 deploy fixes to get the
  pipeline itself working, then one more for the `API_BASE` bug above
  - see git history on `.github/workflows/deploy.yml` and
  `mobile-app/src/services/api.js` around 2026-08-19/22 if any of
  this breaks again.)
- GitHub repo: gauravteja/traffictj, auto-deploys api/, admin-form/,
  and the mobile-app web preview via .github/workflows/deploy.yml on
  push to main

## Known gaps (honest, in rough priority order)

1. **Map coordinates: confirmed working on web, native still unverified.**
   `RouteMap.js` calls `utils/geocoding.js` (Nominatim) on
   `route.originAddress`/`destinationAddress` instead of hardcoding
   coordinates. Confirmed end-to-end on 2026-08-22 in the deployed web
   preview (traffic-wedge-web.pages.dev, in a real browser, not this
   session's sandbox) - real routes load, real geocoding resolves,
   real OSRM route renders. What's still unconfirmed is native:
   `RouteMap.js`'s `react-native-webview` branch (as opposed to the
   web build's `<iframe>` branch) has never been run on an actual
   phone/simulator. Also still downstream of gap #2: the addresses
   themselves are mocked in `getSavedRoutes()`, not tied to a real
   user yet.
2. **No user accounts.** `getSavedRoutes()` in the mobile app is
   still mocked - nothing ties a saved route to a real logged-in
   person yet.
3. **Alternate route screen is a placeholder** (just shows an alert/
   toast) - no real re-routing logic exists.
4. **Hazard reports: built 2026-08-22, not yet confirmed with real
   data on a real device.** `POST/GET /hazards`, a `ReportHazardModal`
   form, and pins on `RouteMap.js` all exist and were verified locally
   (app mounts, form validates, submission fails gracefully when
   network calls are blocked) - but that verification ran in this
   session's sandbox, where Nominatim and the Worker API are both
   blocked, same limitation gap #1 had before someone confirmed it on
   a real browser. Nobody has yet submitted a real report or seen a
   real hazard pin render end-to-end. Only 24 of blr-potholes-data's
   ~223 points are seeded (see Stack decisions above) - run
   `api/scripts/import-blr-potholes.js` from a real machine for the
   rest.
5. **Route-matching is hardcoded, not real.** `getActiveAdvisories()`
   in `mobile-app/src/services/api.js` sets every advisory's
   `affectedRouteId` to `1` regardless of content. No keyword-overlap
   or road-segment matching exists. (An earlier version of this file
   claimed this was already built in `routeMatching.js` - that file
   never existed; verified against full git history on 2026-08-05.)

## Things NOT to redo

- Don't build push notifications. Explicitly decided against
  (gauravteja, 2026-08-22) - the app is pull-based by design: leave-by
  info and advisories show when the user opens the app, nothing
  proactively alerts a phone. Don't reintroduce this as a "known gap"
  or start wiring up device push tokens/FCM without asking first.
- Don't reintroduce WordPress for anything.
- Don't default to Google Maps without discussing cost/API key
  tradeoffs first - the free stack is working and preferred unless
  there's a specific reason to switch.
- Don't claim route-matching is done again until
  `mobile-app/src/utils/routeMatching.js` (or equivalent) actually
  exists and `affectedRouteId` is no longer hardcoded to `1`.
