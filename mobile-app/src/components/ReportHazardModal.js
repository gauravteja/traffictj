import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../theme/colors";
import { geocodeAddress } from "../utils/geocoding";
import { reportHazard } from "../services/api";

const TYPES = [
  { value: "pothole", label: "Pothole" },
  { value: "waterlogging", label: "Waterlogging" },
];

export default function ReportHazardModal({ visible, onClose, onSubmitted }) {
  const [type, setType] = useState("pothole");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [errorMessage, setErrorMessage] = useState("");

  const reset = () => {
    setType("pothole");
    setAddress("");
    setDescription("");
    setStatus("idle");
    setErrorMessage("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!address.trim()) {
      setStatus("error");
      setErrorMessage("Enter a location first.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const coords = await geocodeAddress(address);
      if (!coords) {
        setStatus("error");
        setErrorMessage("Couldn't find that location - try a nearby landmark or road name.");
        return;
      }

      await reportHazard({
        type,
        lat: coords.lat,
        lng: coords.lon,
        description: description.trim(),
      });

      onSubmitted?.();
      reset();
      onClose();
    } catch (err) {
      setStatus("error");
      setErrorMessage("Couldn't submit that report - check your connection and try again.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Report a hazard</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeButton, type === t.value && styles.typeButtonActive]}
                onPress={() => setType(t.value)}
              >
                <Text style={[styles.typeButtonText, type === t.value && styles.typeButtonTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Outer Ring Road, Marathahalli"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Details (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Anything that helps other drivers, e.g. size, which lane"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {status === "error" && <Text style={styles.errorText}>{errorMessage}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, status === "submitting" && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={status === "submitting"}
          >
            {status === "submitting" ? (
              <ActivityIndicator color={colors.surface1} />
            ) : (
              <Text style={styles.submitButtonText}>Submit report</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 32, 43, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: colors.bgAccent,
    borderColor: colors.borderAccent,
  },
  typeButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.textAccent,
    fontWeight: "500",
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 13,
    color: colors.textDanger,
    marginBottom: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.textAccent,
    borderRadius: radius.control,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.surface1,
    fontSize: 14,
    fontWeight: "600",
  },
});
