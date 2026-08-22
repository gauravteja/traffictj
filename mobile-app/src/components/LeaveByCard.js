import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows, eyebrow } from "../theme/colors";

export default function LeaveByCard({ route }) {
  if (!route || !route.leaveByTime) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="time" size={16} color={colors.textAccent} />
        </View>
        <Text style={styles.headerText}>Leave by {route.leaveByTime}</Text>
      </View>
      <Text style={styles.title}>{route.label}</Text>
      <Text style={styles.subtitle}>
        {route.etaMinutes} min today
        {route.etaDeltaMinutes > 0
          ? `, ${route.etaDeltaMinutes} min slower than usual`
          : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.bgAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    ...eyebrow,
    color: colors.textAccent,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
