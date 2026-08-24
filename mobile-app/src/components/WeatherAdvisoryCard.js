import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows, eyebrow } from "../theme/colors";

// Only renders when it's actually raining - same "only show it if it
// matters" rule as ClosureAlertCard. A clear-sky reading has nothing
// useful to say the moment the user opens the app, so it says
// nothing, rather than adding a permanent "72°F, sunny" tile no one
// asked for.
export default function WeatherAdvisoryCard({ weather }) {
  if (!weather || !weather.isRaining) return null;

  const severe = weather.waterloggingRisk;

  return (
    <View style={[styles.card, severe ? styles.cardDanger : styles.cardWarning]}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons
            name="rainy"
            size={16}
            color={severe ? colors.textDanger : colors.textWarning}
          />
        </View>
        <Text style={[styles.headerText, severe ? styles.textDanger : styles.textWarning]}>
          {severe ? "Waterlogging risk" : "Weather heads-up"}
        </Text>
      </View>
      <Text style={[styles.title, severe ? styles.textDanger : styles.textWarning]}>
        {weather.description} right now, {Math.round(weather.tempC)}°C
      </Text>
      <Text style={styles.subtitle}>
        {severe
          ? "Low-lying stretches of your route may be waterlogged - budget extra time."
          : "Roads may be slick - drive carefully."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  cardWarning: {
    backgroundColor: colors.bgWarning,
  },
  cardDanger: {
    backgroundColor: colors.bgDanger,
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
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  textWarning: {
    color: colors.textWarning,
  },
  textDanger: {
    color: colors.textDanger,
  },
});
