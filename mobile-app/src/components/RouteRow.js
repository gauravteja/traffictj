import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../theme/colors";

const STATUS_CONFIG = {
  disrupted: { label: "Disrupted", color: colors.textDanger },
  clear: { label: "Clear", color: colors.textSuccess },
};

export default function RouteRow({ route }) {
  const status = STATUS_CONFIG[route.status] || STATUS_CONFIG.clear;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.label}>{route.label}</Text>
      </View>
      <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface1,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  status: {
    fontSize: 12,
    fontWeight: "500",
  },
});
