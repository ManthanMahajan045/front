export const DEFAULT_CENTER = { latitude: 26.9124, longitude: 75.7873 };

export const SEVERITY_COLORS = {
  red: "#dc2626",
  orange: "#f97316",
  yellow: "#eab308"
};

const rawHazards = [
  ["Jhar black spot, Bassi, Jaipur (NH 21)",26.8472143,75.7230006,"Official black spot","red","Rajasthan State Road Safety cell"],
  ["Kanya Kheri Choraha, Hamirgarh, Bhilwara (NH 48)",25.200552,74.5821344,"Official black spot","red","Rajasthan State Road Safety Cell"],
  ["Gordhanpura puliya, kotputli, Behror",27.646595,76.13419,"Black spot","red","Mission safer road (by Jaipur police)"],
  ["Lasadiya mod, Jaipur rural",26.3147,75.31523,"Black spot","orange","Mission safer road (by Jaipur police)"],
  ["Achrol, Chandwaji",27.07543,75.57399,"Potholes, black spot","yellow","Mission safer road (by Jaipur police)"],
  ["Bilpur, Chandwaji",27.13224,75.56051,"Black spots, potholes","orange","Mission safer road (by Jaipur police)"],
  ["Thali puliya, Andhi",27.03306,76.10273,"Black spots","orange","Mission safer road (by Jaipur police)"],
  ["Bharatpur district intersections",27.3114891,77.1445598,"Official black spot / poor lighting","orange","Bharatpur SP digital repository"],
  ["Panorama exit route, Ramnagaria",26.8147756,75.8614913,"Pothole","red","Local road-safety report"],
  ["High tension road, Jaipur",26.8457836,75.754312,"Potholes","red","Local road-safety report"],
  ["Bombay hospital circle, Sitapura",26.7824912,75.853799,"Potholes and black spots","orange","Local road-safety report"],
  ["7, Rd Number - 1D, Vishwakarma Industrial Area",26.9711103,75.777581,"Local-knowledge hazard","red","Daily road user"],
  ["Chappa chauraha, Mansarovar",26.8232896,75.6787535,"Potholes and black spots","orange","Local road-safety report"],
  ["NRI circle, Pratap Nagar, Jaipur",26.8072126,75.8336619,"Potholes","orange","Local road-safety report"],
  ["D-mart chauraha, Ramnagaria",26.8497087,75.6823924,"Local-knowledge hazard","orange","Local road-safety report"]
];

export const CONFIRMED_HAZARDS = rawHazards.map(function (item, index) {
  return {
    id: "hazard-" + index,
    name: item[0],
    location: item[0],
    coordinate: { latitude: item[1], longitude: item[2] },
    type: item[3],
    severity: item[4],
    severityLabel: item[4] === "red" ? "High" : item[4] === "orange" ? "Moderate" : "Low",
    source: item[5],
    status: "verified"
  };
});

export const HAZARD_TYPES = ["Pothole","Accident","Blockage","Waterlogging","Blind Turn","Broken Signal"];

export const SEARCHABLE_LOCATIONS = [
  { id: "skit", name: "Swami Keshavnand Institute of Technology", address: "Ram Nagariya Rd, Jagatpura, Jaipur", coordinate: { latitude: 26.8147756, longitude: 75.8614913 } },
  { id: "railway", name: "Jaipur Railway Station", address: "Station Rd, Jaipur", coordinate: { latitude: 26.9196, longitude: 75.7878 } },
  { id: "wtp", name: "World Trade Park", address: "Malviya Nagar, Jaipur", coordinate: { latitude: 26.9138, longitude: 75.7368 } },
  { id: "malviya", name: "Malviya Nagar", address: "Malviya Nagar, Jaipur", coordinate: { latitude: 26.8546, longitude: 75.8103 } },
  { id: "statue", name: "Statue Circle", address: "C Scheme, Jaipur", coordinate: { latitude: 26.9067, longitude: 75.7935 } },
  { id: "sitapura", name: "Sitapura Industrial Area", address: "Sitapura, Jaipur", coordinate: { latitude: 26.7825, longitude: 75.8538 } },
  { id: "vishwakarma", name: "Vidhyadhar Nagar", address: "Vidhyadhar Nagar, Jaipur", coordinate: { latitude: 26.9711, longitude: 75.7776 } },
  { id: "bassi", name: "Bassi", address: "NH 21, Bassi, Jaipur", coordinate: { latitude: 26.84, longitude: 76.03 } }
];

export function mergeHazards(localReports) {
  return CONFIRMED_HAZARDS.concat((localReports || []).map(function (report) {
    return {
      id: report.id,
      name: report.hazardType || "Community report",
      location: report.location || "Citizen submitted report",
      coordinate: {
        latitude: Number(report.coordinates && (report.coordinates.latitude ?? report.coordinates.lat)),
        longitude: Number(report.coordinates && (report.coordinates.longitude ?? report.coordinates.lng))
      },
      type: report.hazardType || "Reported hazard",
      severity: report.severity || "yellow",
      severityLabel: report.severityLabel || "Reported",
      source: "RoadSense community",
      status: report.status || "pending"
    };
  })).filter(function (item) {
    return Number.isFinite(item.coordinate.latitude) && Number.isFinite(item.coordinate.longitude);
  });
}
