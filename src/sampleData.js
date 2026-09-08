// Final confirmed hazard/black-spot data (from Sreshta) — mirrors
// seed/roadsense_hazard_seed.json, used to power the map, alerts and
// "Community Verified" reports. Severity is normalized the same way
// seed/seedPotholes.js does it, so frontend and Firestore agree.

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function normalizeSeverity(raw) {
  const s = (raw || "").toLowerCase();
  if (s === "red" || s === "high") return "red";
  if (s === "orange" || s === "moderate") return "orange";
  if (s === "yellow" || s === "low") return "yellow";
  return "yellow";
}

export const severityColors = {
  red: "#dc2626",
  orange: "#f97316",
  yellow: "#eab308",
};

const RAW_HAZARDS = [
  { name: "Jhar black spot, Bassi, Jaipur (NH 21)", lat: 26.8472143, lng: 75.7230006, type: "Official black spot", severity: "Red", source: "Rajasthan State Road Safety cell" },
  { name: "Kanya Kheri Choraha, Hamirgarh, Bhilwara (NH 48)", lat: 25.200552, lng: 74.5821344, type: "Official black spot", severity: "Red", source: "Rajasthan State Road Safety Cell" },
  { name: "Gordhanpura puliya, kotputli, Behror", lat: 27.646595, lng: 76.13419, type: "Black spot", severity: "Red", source: "Mission safer road (by Jaipur police)" },
  { name: "Lasadiya mod, Jaipur rural", lat: 26.3147, lng: 75.31523, type: "Black spot", severity: "Orange", source: "Mission safer road (by Jaipur police)" },
  { name: "Achrol, Chandwaji", lat: 27.07543, lng: 75.57399, type: "Potholes, black spot", severity: "Yellow", source: "Mission safer road (by Jaipur police)" },
  { name: "Bilpur, Chandwaji", lat: 27.13224, lng: 75.56051, type: "Black spots, potholes", severity: "Orange", source: "Mission safer road (by Jaipur police)" },
  { name: "Thali puliya, Andhi", lat: 27.03306, lng: 76.10273, type: "Black spots", severity: "Orange", source: "Mission safer road (by Jaipur police)" },
  { name: "Bharatpur district intersections (evening hours)", lat: 27.3114891, lng: 77.1445598, type: "Official black spot / poor lighting", severity: "Orange", source: "Bharatpur SP digital repository — 26%+ accidents occur 6–9 PM (ETV Bharat, Oct 2025)" },
  { name: "Panorama exit route, Ramnagaria", lat: 26.8147756, lng: 75.8614913, type: "Pothole", severity: "High", source: "Local rickshaw driver" },
  { name: "High tension road, Jaipur", lat: 26.8457836, lng: 75.754312, type: "Potholes", severity: "High", source: "Local van driver" },
  { name: "Bombay hospital circle, Sitapura", lat: 26.7824912, lng: 75.853799, type: "Potholes and black spots", severity: "Moderate", source: "Local head constable (Ramnagariya police station)" },
  { name: "7, Rd Number - 1D, Vishwakarma Industrial Area, Vidhyadhar Nagar", lat: 26.9711103, lng: 75.777581, type: "Local-knowledge hazard", severity: "High", source: "Daily bike rider" },
  { name: "Chappa chauraha, Mansarovar", lat: 26.8232896, lng: 75.6787535, type: "Potholes and black spots", severity: "Moderate", source: "Local school van driver" },
  { name: "NRI circle, Pratap Nagar, Jaipur", lat: 26.8072126, lng: 75.8336619, type: "Potholes", severity: "Moderate", source: "Local school van driver" },
  { name: "D-mart chauraha, behind SKIT, Ramnagaria", lat: 26.8497087, lng: 75.6823924, type: "Local-knowledge hazard", severity: "Moderate", source: "Auto rickshaw driver" },
];

export const confirmedHazards = RAW_HAZARDS.map((h) => ({
  id: slugify(h.name),
  name: h.name,
  location: h.name,
  coordinates: { lat: h.lat, lng: h.lng },
  type: h.type,
  severity: normalizeSeverity(h.severity), // "red" | "orange" | "yellow"
  severityLabel: h.severity, // original label, as given
  source: h.source,
  status: "verified", // these are all official/confirmed entries
}));

export const hazardTypeOptions = [
  "Pothole",
  "Accident",
  "Blockage",
  "Waterlogging",
  "Blind Turn",
  "Broken Signal",
];

// Reference locations for the search screen — replace with a real
// geocoding API (OpenRouteService / Nominatim) once wired in.
export const searchableLocations = [
  { id: 1, name: "Swami Keshavnand Institute of Technology", address: "Ram Nagariya Rd, Shivam Nagar, Jagatpura", coordinates: { lat: 26.8147756, lng: 75.8614913 } },
  { id: 2, name: "Jaipur Railway Station", address: "Station Rd, Jaipur", coordinates: { lat: 26.9196, lng: 75.7878 } },
  { id: 3, name: "World Trade Park", address: "Amrapali Circle, Vaishali Nagar, Jaipur", coordinates: { lat: 26.9138, lng: 75.7368 } },
  { id: 4, name: "Malviya Nagar", address: "Malviya Nagar, Jaipur", coordinates: { lat: 26.8546, lng: 75.8103 } },
  { id: 5, name: "Statue Circle", address: "C Scheme, Jaipur", coordinates: { lat: 26.9067, lng: 75.7935 } },
  { id: 6, name: "Sitapura Industrial Area", address: "Sitapura, Jaipur", coordinates: { lat: 26.7825, lng: 75.8538 } },
  { id: 7, name: "Vidhyadhar Nagar", address: "Vidhyadhar Nagar, Jaipur", coordinates: { lat: 26.9711, lng: 75.7776 } },
  { id: 8, name: "Bassi", address: "NH 21, Bassi, Jaipur", coordinates: { lat: 26.84, lng: 76.03 } },
];
