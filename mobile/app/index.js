import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6d28d9"/><Text style={styles.text}>Loading RoadSense…</Text></View>;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}
const styles=StyleSheet.create({center:{flex:1,alignItems:"center",justifyContent:"center",gap:12},text:{color:"#6b7280"}});
