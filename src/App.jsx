import { useEffect, useState } from "react";
import "./index.css";
import "./professional.css";
import "leaflet/dist/leaflet.css";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import ReportHazardScreen from "./screens/ReportHazardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AlertsScreen from "./screens/AlertsScreen";
import ReportsScreen from "./screens/ReportsScreen";
import DirectionsScreen from "./screens/DirectionsScreen";
import AuthorityDashboard from "./screens/AuthorityDashboard";
import SideMenu from "./components/SideMenu";
import { translatePage } from "./i18n";

const AUTH_KEY = "roadsense-auth";
const LANGUAGE_KEY = "roadsense-language";

function readStoredUser() {
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (!stored?.firebaseUid) { localStorage.removeItem(AUTH_KEY); return null; }
    return stored;
  } catch { localStorage.removeItem(AUTH_KEY); return null; }
}

export default function App() {
  const [user, setUser] = useState(readStoredUser);
  const [screen, setScreen] = useState("home");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || "en");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("roadsense-theme");
    return saved || (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light");
  });

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("roadsense-theme", theme); }, [theme]);
  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language === "hi" ? "hi" : "en";
    if (language === "hi") {
      const frame = window.requestAnimationFrame(() => translatePage("hi"));
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [language, screen, menuOpen]);
  const changeLanguage = (nextLanguage) => { setLanguage(nextLanguage); if (nextLanguage === "en") window.setTimeout(() => window.location.reload(), 0); };
  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");
  const navigate = (next) => { setScreen(next); setMenuOpen(false); };
  const screenProps = { onNavigate: navigate, theme, onToggleTheme: toggleTheme, onMenu: () => setMenuOpen(true), language, user };

  if (!user) return <div className="app-shell auth-app-shell"><AuthScreen onAuthenticated={(nextUser) => { localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser)); setUser(nextUser); }} /></div>;
  return <div className="app-shell">{screen === "home" && <HomeScreen {...screenProps} selectedLocation={selectedLocation} onNotifications={() => navigate("alerts")} />}{screen === "search" && <SearchScreen {...screenProps} onSelectLocation={setSelectedLocation} />}{screen === "directions" && <DirectionsScreen {...screenProps} selectedLocation={selectedLocation} />}{screen === "report" && <ReportHazardScreen {...screenProps} />}{screen === "profile" && <ProfileScreen {...screenProps} />}{screen === "alerts" && <AlertsScreen {...screenProps} />}{screen === "reports" && <ReportsScreen {...screenProps} />}{screen === "authority" && <AuthorityDashboard {...screenProps} onBack={() => navigate("home")} />}{menuOpen && <SideMenu onClose={() => setMenuOpen(false)} onNavigate={navigate} language={language} onLanguageChange={changeLanguage} />}</div>;
}
