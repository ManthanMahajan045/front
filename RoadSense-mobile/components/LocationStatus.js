import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { MapPin, Navigation } from "lucide-react-native";
import { getPhoneLocation } from "../services/location";

export default function LocationStatus() {
  const [status, setStatus] = useState("loading");
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    let active = true;
    getPhoneLocation()
      .then((value) => {
        if (!active) return;
        setCoords(value);
        setStatus("granted");
      })
      .catch((error) => {
        if (!active) return;
        setStatus(error?.code === "permission-denied" ? "denied" : "error");
      });
    return () => { active = false; };
  }, []);

  if (status === "loading") {
    return <View style={styles.row}><ActivityIndicator /><Text style={styles.text}>Detecting your location…</Text></View>;
  }

  if (status === "denied") {
    return <View style={styles.card}><MapPin size={22} color="#B03A2E" /><Text style={styles.title}>Location permission denied</Text><Text style={styles.text}>Allow location access to show nearby hazards.</Text></View>;
  }

  if (status === "error") {
    return <View style={styles.card}><MapPin size={22} color="#B03A2E" /><Text style={styles.title}>Location unavailable</Text><Text style={styles.text}>We could not read the phone location. Please try again.</Text></View>;
  }

  return (
    <View style={styles.card}>
      <Navigation size={22} color="#2E7D32" />
      <View style={styles.copy}>
        <Text style={styles.title}>Current location</Text>
        <Text style={styles.text}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E7EB" },
  row: { flexDirection: "row", gap: 10, alignItems: "center", padding: 16 },
  copy: { flex: 1 },
  title: { fontSize: 15, fontWeight: "800", color: "#17202A" },
  text: { marginTop: 4, fontSize: 13, lineHeight: 19, color: "#68737D" }
});
