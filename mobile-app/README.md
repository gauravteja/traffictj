# Traffic Wedge — mobile app (Expo)

This is the home screen from the mockup, built as a real, runnable
Expo app. Free to develop and test — no paid Apple/Google dev account
needed until you're ready to publish to app stores.

## Run it (from your own machine, not this sandbox)

1. Install dependencies:
   npm install

2. To test in a browser on your computer (no phone needed):
   npm run web

   This opens the app at http://localhost:19006 in your default
   browser. Same code, same components — Expo/React Native supports
   running the identical app on web, iOS, and Android. This is the
   fastest way to iterate while building.

3. To test on your actual phone instead (recommended once the layout
   is close to final, since phone screens render slightly
   differently than a browser window):
   npx expo start

   Then install "Expo Go" from the App Store / Play Store on your
   phone, and scan the QR code the terminal prints.

Note: what you may have seen earlier in chat as a "preview" was a
static mockup image, not this running app — this is the first point
where the actual code is live and clickable.

## What's real vs. stubbed

- All UI components (LeaveByCard, ClosureAlertCard, RouteRow) are
  fully real and functional.
- Data currently comes from `src/services/api.js`, which returns
  hardcoded mock data (the same Cubbon Park closure example we built
  in WordPress/D1).
- To connect real data: build the route-matching API endpoint on the
  Cloudflare Worker (the gap flagged in traffic-worker/README.md),
  then swap the two functions in `src/services/api.js` for real
  `fetch()` calls — the shapes are already documented in comments
  there so the screens won't need to change.

## Structure

```
App.js                          entry point
src/screens/HomeScreen.js       main screen, data loading, pull-to-refresh
src/components/LeaveByCard.js   "leave by X" card
src/components/ClosureAlertCard.js  route closure warning + CTA
src/components/RouteRow.js      single row in "your routes" list
src/services/api.js             data layer (currently mocked)
src/theme/colors.js             all colors/spacing in one place
```

## Tested before handoff

- All files pass a Babel JSX/syntax check (no typos or broken JSX).
- The screen's core logic — picking the primary "leave by" route and
  matching an advisory to the correct saved route — was tested
  against the mock data and confirmed correct.

## Known gaps

- No navigation library yet — this is a single screen. Add
  `@react-navigation/native` when you build a second screen (e.g. the
  alternate-route view, currently just an alert placeholder).
- No auth/user system yet — `getSavedRoutes()` doesn't know who's
  asking.
- "View alternate route" button is a placeholder alert, not a real
  screen.
