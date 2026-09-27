import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown:false, contentStyle:{backgroundColor:"#f8fafc"} }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="report" />
        <Stack.Screen name="search" />
        <Stack.Screen name="directions" />
        <Stack.Screen name="saved" />
      </Stack>
    </AuthProvider>
  );
}
