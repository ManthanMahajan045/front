import { useEffect, useState } from "react";
import "./index.css";
import "leaflet/dist/leaflet.css";

import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import ReportHazardScreen from "./screens/ReportHazardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AlertsScreen from "./screens/AlertsScreen";
import ReportsScreen from "./screens/ReportsScreen";
import DirectionsScreen from "./screens/DirectionsScreen";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("roadsense-theme");
    return saved || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("roadsense-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));
  const screenProps = { onNavigate: setScreen, theme, onToggleTheme: toggleTheme };

  return (
    <div className="app-shell">
      {screen === "home" && <HomeScreen {...screenProps} selectedLocation={selectedLocation} />}
      {screen === "search" && <SearchScreen {...screenProps} onSelectLocation={setSelectedLocation} />}
      {screen === "directions" && <DirectionsScreen {...screenProps} selectedLocation={selectedLocation} />}
      {screen === "report" && <ReportHazardScreen {...screenProps} />}
      {screen === "profile" && <ProfileScreen {...screenProps} />}
      {screen === "alerts" && <AlertsScreen {...screenProps} />}
      {screen === "reports" && <ReportsScreen {...screenProps} />}
    </div>
  );
}
