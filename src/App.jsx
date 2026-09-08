import { useState } from "react";
import "./index.css";
import "leaflet/dist/leaflet.css";

import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import ReportHazardScreen from "./screens/ReportHazardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AlertsScreen from "./screens/AlertsScreen";
import ReportsScreen from "./screens/ReportsScreen";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const screenProps = { onNavigate: setScreen };

  return (
    <div className="app-shell">
      {screen === "home" && (
        <HomeScreen {...screenProps} selectedLocation={selectedLocation} />
      )}
      {screen === "search" && (
        <SearchScreen {...screenProps} onSelectLocation={setSelectedLocation} />
      )}
      {screen === "report" && <ReportHazardScreen {...screenProps} />}
      {screen === "profile" && <ProfileScreen {...screenProps} />}
      {screen === "alerts" && <AlertsScreen {...screenProps} />}
      {screen === "reports" && <ReportsScreen {...screenProps} />}
    </div>
  );
}
