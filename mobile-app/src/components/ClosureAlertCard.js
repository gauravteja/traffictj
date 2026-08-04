import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../theme/colors";

export default function ClosureAlertCard({ advisory, onViewAlternate }) {
  if (!advisory) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="warning-outline" size={18} color={colors.textDanger} />
        <Text style={styles.headerText}>Route closure today</Text>
      </View>
      <Text style={styles.title}>
        {advisory.roadNames} closed, {advisory.windowText}
      </Text>
      <Text style={styles.subtitle}>{advisory.reason}</Text>
      <TouchableOpacity style={styles.button} onPress={onViewAlternate}>
        <Text style={styles.buttonText}>View alternate route</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgDanger,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
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
    color: colors.textDanger,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textDanger,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  button: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface1,
  },
  buttonText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
});
