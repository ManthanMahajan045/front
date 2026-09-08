/**
 * Hazard/Pothole Seed Script (FINAL - confirmed data from Sreshta)
 * ------------------------------------------------------------------
 * Reads roadsense_hazard_seed.json (array of 15 confirmed hazard points)
 * and seeds them into Firestore.
 *
 * Run: node seedPotholes.js
 *
 * Prerequisites:
 * 1. npm install firebase-admin
 * 2. Download serviceAccountKey.json from:
 *    Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
 *    Place it in the same folder as this script.
 * 3. Place roadsense_hazard_seed.json in the same folder as this script.
 */

const admin = require("firebase-admin");
const fs = require("fs");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Source data uses a mix of scales:
// Red/Orange/Yellow (official black spots) and High/Moderate (local-knowledge
// reports). Normalized to a single red/orange/yellow scale for the app.
function normalizeSeverity(raw) {
  const s = (raw || "").toLowerCase();
  if (s === "red" || s === "high") return "red";
  if (s === "orange" || s === "moderate") return "orange";
  if (s === "yellow" || s === "low") return "yellow";
  return "yellow"; // fallback, should not happen with current data
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

async function seed() {
  const raw = fs.readFileSync("./roadsense_hazard_seed.json", "utf8");
  const hazards = JSON.parse(raw);

  const batch = db.batch();
  const collectionRef = db.collection("potholes");

  hazards.forEach((h) => {
    const docId = slugify(h.name);
    const docRef = collectionRef.doc(docId);
    batch.set(docRef, {
      name: h.name,
      location: new admin.firestore.GeoPoint(h.lat, h.lng),
      severity: normalizeSeverity(h.severity),
      originalSeverityLabel: h.severity,
      type: h.type,
      source: h.source,
      reportCount: 1,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`Seeded ${hazards.length} hazard points into Firestore.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
