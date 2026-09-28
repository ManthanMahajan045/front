import { ScrollView, StyleSheet, Text, View } from "react-native";
import LocationStatus from "../components/LocationStatus";
import AlertFeatureDemo from "../components/AlertFeatureDemo";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>RoadSense</Text>
      <Text style={styles.subtitle}>Road safety information from your phone.</Text>
      <LocationStatus />
      <AlertFeatureDemo />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, backgroundColor: "#F5F7F8", flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "900", color: "#17202A" },
  subtitle: { fontSize: 14, lineHeight: 20, color: "#68737D", marginBottom: 4 }
});
