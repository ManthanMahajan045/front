# RoadSense Expo mobile app

This directory is the native Expo conversion of the RoadSense web application.

## Run

1. Install Node.js LTS and Expo prerequisites.
2. From this directory run: npm install
3. Run: npx expo start
4. Open the project in Expo Go or an Android/iOS simulator.

## Native replacements

- Browser screen switching -> Expo Router file-based navigation.
- Leaflet/react-leaflet -> react-native-maps.
- navigator.geolocation -> expo-location.
- input type=file -> expo-image-picker.
- Browser CSS -> React Native StyleSheet.
- localStorage auth state -> Firebase Auth + AsyncStorage persistence.
- Browser Google Maps links -> native deep-link launch through Linking.
- Web-only Firebase phone reCAPTCHA and Google popup flows are intentionally not copied into native code; email/password auth is implemented natively while the existing web auth remains unchanged.

The original Vite web app remains in the repository root.
