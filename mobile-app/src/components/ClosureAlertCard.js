import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows, eyebrow } from "../theme/colors";

export default function ClosureAlertCard({ advisory, onViewAlternate }) {
  if (!advisory) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="warning" size={16} color={colors.textDanger} />
        </View>
        <Text style={styles.headerText}>Route closure today</Text>
      </View>
      <Text style={styles.title}>
        {advisory.roadNames} closed, {advisory.windowText}
      </Text>
      <Text style={styles.subtitle}>{advisory.reason}</Text>
      <TouchableOpacity style={styles.button} onPress={onViewAlternate} activeOpacity={0.7}>
        <Ionicons name="git-branch-outline" size={15} color={colors.textPrimary} />
        <Text style={styles.buttonText}>View alternate route</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgDanger,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
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
    backgroundColor: colors.surface1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    ...eyebrow,
    color: colors.textDanger,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDanger,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface1,
    ...shadows.card,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
