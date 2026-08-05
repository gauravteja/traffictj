import { Platform, View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { colors, radius } from "../theme/colors";

function buildMapHtml({ origin, destination, closurePoint, closureLabel }) {
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
  const origin = [${origin[0]}, ${origin[1]}];
  const destination = [${destination[0]}, ${destination[1]}];
  const closurePoint = [${closurePoint[0]}, ${closurePoint[1]}];

  const map = L.map('map').setView(origin, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  L.marker(origin).addTo(map).bindPopup('Home');
  L.marker(destination).addTo(map).bindPopup('Office');
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
  const origin = [12.9784, 77.6408];
  const destination = [12.9757, 77.5937];
  const closurePoint = [12.9757, 77.5937];
  const closureLabel = advisory ? `Closed: ${advisory.roadNames}` : "No active closure";

  const html = buildMapHtml({ origin, destination, closurePoint, closureLabel });

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
    marginBottom: 16,
  },
  webview: {
    flex: 1,
  },
});
