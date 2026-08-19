import { useEffect, useState } from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { colors, radius, spacing } from "../theme/colors";
import { geocodeAddress } from "../utils/geocoding";

function buildMapHtml({ origin, destination, closurePoint, originLabel, destinationLabel, closureLabel }) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const origin = [${origin.lat}, ${origin.lon}];
  const destination = [${destination.lat}, ${destination.lon}];
  const closurePoint = [${closurePoint.lat}, ${closurePoint.lon}];

  const map = L.map('map').setView(origin, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  L.marker(origin).addTo(map).bindPopup(${JSON.stringify(originLabel)});
  L.marker(destination).addTo(map).bindPopup(${JSON.stringify(destinationLabel)});
  L.circleMarker(closurePoint, { radius: 8, color: '#A32D2D', fillColor: '#A32D2D', fillOpacity: 0.8 })
    .addTo(map)
    .bindPopup(${JSON.stringify(closureLabel)});

  const osrmUrl = \`https://router.project-osrm.org/route/v1/driving/\${origin[1]},\${origin[0]};\${destination[1]},\${destination[0]}?overview=full&geometries=geojson\`;

  fetch(osrmUrl)
    .then((res) => res.json())
    .then((data) => {
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const routeLine = L.polyline(coords, { color: '#185FA5', weight: 5 }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
      }
    })
    .catch(() => {});
</script>
</body>
</html>
`;
}

export default function RouteMap({ route, advisory }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    if (!route?.originAddress || !route?.destinationAddress) {
      setState({ status: "error" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      try {
        const [origin, destination] = await Promise.all([
          geocodeAddress(route.originAddress),
          geocodeAddress(route.destinationAddress),
        ]);

        if (cancelled) return;
        if (!origin || !destination) {
          setState({ status: "error" });
          return;
        }

        // Best-effort: place the closure marker at the advisory's own
        // location. Advisories only store free-text road names (see
        // api/src/index.js), so geocoding them can miss - fall back
        // to the destination so the map still shows something.
        let closurePoint = destination;
        if (advisory?.roadNames) {
          const advisoryPoint = await geocodeAddress(`${advisory.roadNames}, Bengaluru`);
          if (advisoryPoint) closurePoint = advisoryPoint;
        }

        if (cancelled) return;
        setState({
          status: "ready",
          origin,
          destination,
          closurePoint,
          originLabel: route.originAddress,
          destinationLabel: route.destinationAddress,
          closureLabel: advisory ? `Closed: ${advisory.roadNames}` : "No active closure",
        });
      } catch (err) {
        if (!cancelled) setState({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route?.originAddress, route?.destinationAddress, advisory?.roadNames]);

  if (state.status === "loading") {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.muted}>Locating your route…</Text>
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.muted}>Couldn't locate this route on the map.</Text>
      </View>
    );
  }

  const html = buildMapHtml(state);

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <iframe
          title="Route map"
          srcDoc={html}
          style={{ width: "100%", height: 200, border: 0 }}
        />
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          style={styles.webview}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface1,
  },
  muted: {
    fontSize: 13,
    color: colors.textMuted,
  },
  webview: {
    flex: 1,
  },
});
