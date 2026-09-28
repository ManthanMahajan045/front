import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Speech from "expo-speech";
import { AlertTriangle, Volume2 } from "lucide-react-native";

const ALERT_TEXT = "Hazard reported nearby. Please drive carefully.";

export default function AlertFeatureDemo() {
  const [speaking, setSpeaking] = useState(false);

  const speakAlert = () => {
    Speech.stop();
    setSpeaking(true);
    Speech.speak(ALERT_TEXT, {
      language: "en-IN",
      rate: 0.95,
      pitch: 1,
      volume: 1,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false)
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <AlertTriangle size={26} color="#B03A2E" strokeWidth={2.4} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.heading}>Hazard detected</Text>
        <Text style={styles.message}>Hazard reported nearby</Text>
        <Text style={styles.hint}>Tap the button to hear the safety alert.</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Play RoadSense voice alert"
        onPress={speakAlert}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Volume2 size={19} color="#FFFFFF" />
        <Text style={styles.buttonText}>{speaking ? "Speaking…" : "Play alert"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E7EB",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FDECEA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  copy: { marginBottom: 18 },
  heading: { fontSize: 19, fontWeight: "800", color: "#17202A" },
  message: { fontSize: 15, fontWeight: "600", color: "#B03A2E", marginTop: 5 },
  hint: { fontSize: 13, lineHeight: 19, color: "#6B7680", marginTop: 7 },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#B03A2E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9
  },
  buttonPressed: { opacity: 0.82 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }
});