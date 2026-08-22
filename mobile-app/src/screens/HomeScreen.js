import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows, eyebrow } from "../theme/colors";
import { getSavedRoutes, getActiveAdvisories } from "../services/api";
import LeaveByCard from "../components/LeaveByCard";
import ClosureAlertCard from "../components/ClosureAlertCard";
import RouteRow from "../components/RouteRow";
import RouteMap from "../components/RouteMap";
import ReportHazardModal from "../components/ReportHazardModal";

export default function HomeScreen() {
  const [routes, setRoutes] = useState([]);
  const [advisories, setAdvisories] = useState([]);
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const primaryRoute = routes.find((r) => r.leaveByTime) || routes[0];
  const activeAdvisory = advisories[0];
  const affectedRoute = activeAdvisory
    ? routes.find((r) => r.id === activeAdvisory.affectedRouteId)
    : null;

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

      
        <RouteMap route={primaryRoute} advisory={activeAdvisory} refreshToken={hazardsVersion} />
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
