import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../theme/colors";

const STATUS_CONFIG = {
  disrupted: { label: "Disrupted", color: colors.textDanger, bg: colors.bgDanger },
  clear: { label: "Clear", color: colors.textSuccess, bg: colors.bgSuccess },
};

export default function RouteRow({ route }) {
  const status = STATUS_CONFIG[route.status] || STATUS_CONFIG.clear;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Ionicons name="navigate" size={15} color={colors.textAccent} />
        <Text style={styles.label}>{route.label}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: status.bg }]}>
        <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface1,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  pill: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  status: {
    fontSize: 11,
    fontWeight: "700",
  },
});
