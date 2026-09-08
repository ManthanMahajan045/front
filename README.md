# RoadSense Frontend

Matches the Figma wireframe: Home, Search, Report a Hazard, Profile, Alerts, Reports.
Structure is built exactly per the wireframe layout — styling is intentionally minimal
(neutral grays, light borders) so it's easy to skin with the final visual design.

## Setup

```bash
npm install
```

Fill in your Firebase project config in `src/firebase.js` (Firebase console → Project settings → General → Your apps → SDK setup and configuration).

```bash
npm run dev
```

## Structure

```
src/
  App.jsx              screen-switching shell (no router dependency, just useState)
  firebase.js           Firestore config + submitHazardReport / upvoteReport
  sampleData.js          reference data (black spots, hazards) for local dev
  index.css              all shared styles/tokens
  components/
    TopBar.jsx           header bar (home variant / back variant)
    BottomNav.jsx         Home / Reports / Alerts / Profile tab bar
  screens/
    HomeScreen.jsx        live map (Leaflet + OSM) + nearest alert banner
    SearchScreen.jsx       location search
    ReportHazardScreen.jsx  hazard type + location + submit → Firestore
    ProfileScreen.jsx      stats + settings list
    AlertsScreen.jsx        Active / History proximity alerts
    ReportsScreen.jsx      My Reports / Community Verified, upvote wired live
```

## What's still a placeholder (needs real data/wiring)

- `HomeScreen`: map centers on Jaipur by default — swap in the browser/device
  Geolocation API for the driver's live position.
- `AlertsScreen`: alert list is static sample data — wire to the proximity
  engine (Haversine distance check) described in the deck.
- `ReportHazardScreen`: photo upload box is a placeholder — needs actual
  file/camera input wired to Firebase Storage.
- `SearchScreen`: recent search is one static entry — wire to
  OpenRouteService/Nominatim geocoding.
- No auth yet — `reportedBy` in `firebase.js` is `null` until an auth layer
  is added.
