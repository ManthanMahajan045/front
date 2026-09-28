import * as Location from "expo-location";

export async function getPhoneLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    const error = new Error("Location permission was denied.");
    error.code = "permission-denied";
    throw error;
  }
  const position = await Location.getCurrentPositionAsync({});
  return position.coords;
}
