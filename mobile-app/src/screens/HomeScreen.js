import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../theme/colors";
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

      <TouchableOpacity style={styles.reportButton} onPress={() => setReportModalVisible(true)}>
        <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
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
    fontSize: 13,
    color: colors.textMuted,
  },
  city: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    color: colors.textDanger,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  reportButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
