import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../theme/colors";

export default function LeaveByCard({ route }) {
  if (!route || !route.leaveByTime) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={18} color={colors.textAccent} />
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
    borderWidth: 2,
    borderColor: colors.borderAccent,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textAccent,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
