import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows, eyebrow } from "../theme/colors";
import { getSavedRoutes, getActiveAdvisories } from "../services/api";
import { findActiveAdvisoryMatch } from "../utils/routeMatching";
import { getCurrentWeather } from "../utils/weather";
import LeaveByCard from "../components/LeaveByCard";
import ClosureAlertCard from "../components/ClosureAlertCard";
import WeatherAdvisoryCard from "../components/WeatherAdvisoryCard";
import RouteRow from "../components/RouteRow";
import RouteMap from "../components/RouteMap";
import ReportHazardModal from "../components/ReportHazardModal";

export default function HomeScreen() {
  const [routes, setRoutes] = useState([]);
  const [advisories, setAdvisories] = useState([]);
  // Weather is best-effort and separate from the loading/error state
  // below - a failed weather fetch (or the sandbox network blocks
  // Open-Meteo) shouldn't take down routes/advisories, it should just
  // mean no weather card renders.
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  // Bumped after a successful hazard report so RouteMap re-fetches and
  // shows the new pin without a full pull-to-refresh.
  const [hazardsVersion, setHazardsVersion] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [routesData, advisoriesData] = await Promise.all([
        getSavedRoutes(),
        getActiveAdvisories(),
      ]);
      setRoutes(routesData);
      setAdvisories(advisoriesData);
    } catch (err) {
      setError("Couldn't load your routes. Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    // Deliberately outside the try/catch above and its own errors
    // swallowed here - a weather fetch failing is not a "couldn't load
    // your routes" situation, it just means no weather card.
    try {
      setWeather(await getCurrentWeather());
    } catch (err) {
      setWeather(null);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const primaryRoute = routes.find((r) => r.leaveByTime) || routes[0];

  // Real keyword-overlap matching (utils/routeMatching.js) - only an
  // advisory that actually shares a road with one of the user's
  // routes surfaces here, instead of the old hardcoded "always
  // route 1" behavior showing every advisory regardless of relevance.
  const activeMatch = findActiveAdvisoryMatch(routes, advisories);
  const activeAdvisory = activeMatch?.advisory ?? null;
  // The map centers on whichever route the advisory actually affects,
  // falling back to the primary route when nothing's disrupted.
  const mapRoute = activeMatch?.route ?? primaryRoute;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading your routes…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.city}>Bengaluru</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={18} color={colors.textAccent} />
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <WeatherAdvisoryCard weather={weather} />

      <RouteMap route={mapRoute} advisory={activeAdvisory} refreshToken={hazardsVersion} />
      <LeaveByCard route={primaryRoute} />

      {activeAdvisory && (
        <ClosureAlertCard
          advisory={activeAdvisory}
          onViewAlternate={() =>
            Alert.alert(
              "Alternate route",
              "Route re-planning isn't wired up yet — this is where the alternate route screen will open."
            )
          }
        />
      )}

      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => setReportModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="alert-circle" size={16} color={colors.textAccent} />
        <Text style={styles.reportButtonText}>Report a pothole or waterlogging</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Your routes</Text>
      {routes.map((route) => (
        <RouteRow key={route.id} route={route} />
      ))}

      <ReportHazardModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmitted={() => setHazardsVersion((v) => v + 1)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface0,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface0,
  },
  muted: {
    fontSize: 14,
    color: colors.textMuted,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  greeting: {
    ...eyebrow,
    color: colors.textMuted,
  },
  city: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: colors.textPrimary,
    marginTop: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.bgAccent,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  errorText: {
    fontSize: 13,
    color: colors.textDanger,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...eyebrow,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgAccent,
    borderRadius: radius.control,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textAccent,
  },
});
