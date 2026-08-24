// Keyword-overlap matching between an advisory's affected roads and
// a saved route's known road segments. Neither side is normalized or
// geocoded - advisories store road_names as whatever free text the
// source said (see api/src/index.js), routes store roadNames the
// same way (see services/api.js's mocked getSavedRoutes()) - so this
// is deliberately a fuzzy match on distinctive words, not an exact
// string or geometric match.
//
// This file did not exist before 2026-08-22 despite CLAUDE.md having
// claimed at one point that it did - see "Stack decisions" there for
// the full story. `affectedRouteId` was hardcoded to 1 until this.

// Generic terms that show up in nearly every Indian road name and so
// carry no matching signal on their own - "MG Road" and "Outer Ring
// Road" would falsely "overlap" on "Road" alone without this list.
const STOPWORDS = new Set([
  "road", "st", "street", "marg", "circle", "layout", "cross",
  "main", "stretch", "junction", "signal", "flyover", "bridge",
  "to", "and", "the", "of", "near", "at", "in", "on", "via",
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[()]/g, " ")
    .split(/[\s,/-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

// True if the advisory shares at least one distinctive word with the
// route's known road segments.
export function routeMatchesAdvisory(route, advisory) {
  if (!route?.roadNames || !advisory?.roadNames) return false;
  const routeTokens = new Set(tokenize(route.roadNames));
  return tokenize(advisory.roadNames).some((token) => routeTokens.has(token));
}

// The first saved route an advisory actually affects, or null if it
// doesn't match any of them. Ties (more than one matching route)
// resolve to whichever comes first in the routes array - fine for
// the small number of routes a person is likely to save.
export function findAffectedRoute(routes, advisory) {
  return routes.find((route) => routeMatchesAdvisory(route, advisory)) || null;
}

// The first advisory that matches any saved route, paired with the
// route it matched - or null if nothing currently affects any of
// them. This is the real replacement for the old
// `advisories[0]` + hardcoded `affectedRouteId: 1` pairing: an
// advisory that doesn't overlap with any saved route no longer shows
// up as a false alarm.
export function findActiveAdvisoryMatch(routes, advisories) {
  for (const advisory of advisories) {
    const route = findAffectedRoute(routes, advisory);
    if (route) return { advisory, route };
  }
  return null;
}
