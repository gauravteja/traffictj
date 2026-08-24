// Weather advisory - the "weather" part of the "bumps, potholes and
// weather" hazard-detection follow-up (bumps/potholes landed as a
// third hazards type; this is the piece that was deliberately
// deferred until it could be scoped on its own - see CLAUDE.md).
//
// Uses Open-Meteo's free forecast API: no API key, no signup, no
// rate-limit tier to worry about, and CORS-enabled for direct browser
// calls - unlike most weather APIs. https://open-meteo.com/en/docs
//
// Scoped narrow on purpose: one citywide reading (Bengaluru's
// center), not per-route or per-hazard-pin. Good enough to answer
// "is it raining hard right now" the moment the user opens the app -
// same pull-based model as the rest of this app, nothing pushed.
// Per-route weather (e.g. actually geocoding each saved route's
// origin) is a reasonable next step, not done here.

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

const DEFAULT_LAT = 12.9716;
const DEFAULT_LON = 77.5946;

// WMO weather codes (see the Open-Meteo docs' "WMO Weather
// interpretation codes" table) that mean actual rain, not just cloud
// cover or fog.
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
// Subset of the above heavy enough to flag a real waterlogging risk,
// not just "it's drizzling."
const HEAVY_RAIN_CODES = new Set([65, 67, 82, 95, 96, 99]);

export async function getCurrentWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load weather");
  const data = await res.json();

  const current = data.current;
  if (!current || typeof current.weather_code !== "number") {
    throw new Error("Unexpected weather response shape");
  }

  const weatherCode = current.weather_code;
  const precipitationMm = current.precipitation ?? 0;
  const isRaining = RAIN_CODES.has(weatherCode) || precipitationMm > 0;
  // Either signal alone is enough - a heavy WMO code, or just a lot of
  // water falling right now regardless of which bucket the forecast
  // landed in.
  const waterloggingRisk = HEAVY_RAIN_CODES.has(weatherCode) || precipitationMm >= 4;

  return {
    tempC: current.temperature_2m,
    precipitationMm,
    weatherCode,
    isRaining,
    waterloggingRisk,
    description: describeWeatherCode(weatherCode),
  };
}

function describeWeatherCode(code) {
  if (HEAVY_RAIN_CODES.has(code)) return "Heavy rain";
  if (RAIN_CODES.has(code)) return "Rain";
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  return "Overcast";
}
