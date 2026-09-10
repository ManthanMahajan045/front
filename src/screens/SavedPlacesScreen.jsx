import { useEffect, useMemo, useState } from "react";
import { Bookmark, BriefcaseBusiness, Check, Home, LocateFixed, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import TopBar from "../components/TopBar";
import { createSavedLocation, deleteSavedLocation, getSavedLocations, updateSavedLocation } from "../firebase";
import { fetchLiveSuggestions } from "./SearchScreen";
import { getCurrentLocation, reverseGeocode } from "../utils/geo";
import "./SavedPlacesScreen.css";

const DEFAULT_CENTER = { lat: 26.9124, lng: 75.7873 };
const TYPES = [{ id: "home", label: "Home", icon: Home }, { id: "work", label: "Work", icon: BriefcaseBusiness }, { id: "custom", label: "Custom", icon: Bookmark }];
const savedPinIcon = L.divIcon({ className: "saved-place-pin", html: "<span></span>", iconSize: [30, 30], iconAnchor: [15, 30] });

function Recenter({ center }) { const map = useMap(); useEffect(() => { if (center) map.setView([center.lat, center.lng], 16, { animate: true, duration: 0.3 }); }, [center?.lat, center?.lng, map]); return null; }
function MapPicker({ center, onPick }) { useMapEvents({ click: async (event) => { const point = { lat: event.latlng.lat, lng: event.latlng.lng }; let address = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`; try { address = await reverseGeocode(point.lat, point.lng, 5000); } catch {} onPick({ id: `map-${Date.now()}`, name: address.split(",")[0] || "Pinned location", address, coordinates: point }); } }); return center ? <Marker position={[center.lat, center.lng]} icon={savedPinIcon} /> : null; }
function normalizeLocation(place) { return { name: place.name, address: place.address, latitude: place.coordinates.lat, longitude: place.coordinates.lng, coordinates: place.coordinates }; }

export default function SavedPlacesScreen({ onNavigate, onSelectLocation, user }) {
  const [places, setPlaces] = useState([]), [status, setStatus] = useState("loading"), [error, setError] = useState(""), [editorOpen, setEditorOpen] = useState(false), [editing, setEditing] = useState(null), [type, setType] = useState("custom"), [name, setName] = useState(""), [query, setQuery] = useState(""), [suggestions, setSuggestions] = useState([]), [searching, setSearching] = useState(false), [pickerPoint, setPickerPoint] = useState(null), [address, setAddress] = useState(""), [saving, setSaving] = useState(false), [locating, setLocating] = useState(false);

  const loadPlaces = async () => { if (!user?.firebaseUid) return; setStatus("loading"); setError(""); try { setPlaces(await getSavedLocations(user.firebaseUid)); setStatus("ready"); } catch (err) { console.error("Saved places load failed:", err); setStatus("error"); setError(err?.message || "Could not load your saved places."); } };
  useEffect(() => { loadPlaces(); }, [user?.firebaseUid]);
  useEffect(() => { if (query.trim().length < 3) { setSuggestions([]); setSearching(false); return undefined; } const controller = new AbortController(); const timer = window.setTimeout(async () => { setSearching(true); try { setSuggestions(await fetchLiveSuggestions(query, controller.signal)); } catch (err) { if (err.name !== "AbortError") setSuggestions([]); } finally { setSearching(false); } }, 450); return () => { controller.abort(); window.clearTimeout(timer); }; }, [query]);

  const hasHome = places.some((place) => place.type === "home"), hasWork = places.some((place) => place.type === "work"), selectedPlace = pickerPoint, mapCenter = selectedPlace?.coordinates || DEFAULT_CENTER, canUseCurrent = typeof navigator !== "undefined" && Boolean(navigator.geolocation), emptyCopy = useMemo(() => status === "ready" && places.length === 0, [status, places.length]);
  const resetEditor = () => { setEditorOpen(false); setEditing(null); setQuery(""); setSuggestions([]); setPickerPoint(null); setAddress(""); setName(""); setError(""); };
  const openEditor = (place = null, initialType = "custom") => { setEditing(place); setType(place?.type || initialType); setName(place?.name || (initialType === "home" ? "Home" : initialType === "work" ? "Work" : "")); setQuery(""); setSuggestions([]); setPickerPoint(place ? normalizeLocation(place) : null); setAddress(place?.address || ""); setError(""); setEditorOpen(true); };
  const closeEditor = () => { if (!saving) resetEditor(); };
  const chooseSuggestion = (place) => { setPickerPoint(place); setAddress(place.address); setQuery(place.address); };

  const useCurrentLocation = async () => { setLocating(true); setError(""); try { const point = await getCurrentLocation({ timeout: 10000, targetAccuracy: 50 }); let nextAddress = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`; try { nextAddress = await reverseGeocode(point.lat, point.lng, 5000); } catch {} chooseSuggestion({ id: `current-${Date.now()}`, name: nextAddress.split(",")[0] || "Current location", address: nextAddress, coordinates: { lat: point.lat, lng: point.lng } }); } catch { setError("We could not get your current location. Allow location access and try again."); } finally { setLocating(false); } };

  const save = async (event) => {
    event.preventDefault(); setError("");
    const coordinates = selectedPlace?.coordinates;
    if (!coordinates || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) { setError("Choose a location from search, the map, or your current location first."); return; }
    const cleanName = name.trim(); if (!cleanName) { setError("Give this place a name."); return; }
    if (type === "home" && hasHome && editing?.type !== "home") { setError("You already have a Home location. Edit the existing Home instead."); return; }
    if (type === "work" && hasWork && editing?.type !== "work") { setError("You already have a Work location. Edit the existing Work instead."); return; }
    setSaving(true);
    try { const payload = { type, name: cleanName, address: address.trim() || selectedPlace.address || `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`, latitude: coordinates.lat, longitude: coordinates.lng }; await (editing ? updateSavedLocation(editing.id, payload) : createSavedLocation(payload)); resetEditor(); await loadPlaces(); }
    catch (err) { setError(err?.message || "Could not save this place."); }
    finally { setSaving(false); }
  };

  const remove = async (place) => { if (!window.confirm(`Delete ${place.name}?`)) return; try { await deleteSavedLocation(place.id); setPlaces((current) => current.filter((item) => item.id !== place.id)); } catch (err) { setError(err?.message || "Could not delete this place."); } };
  const viewPlace = (place) => { onSelectLocation?.({ id: place.id, name: place.name, address: place.address, coordinates: { lat: place.latitude, lng: place.longitude } }); onNavigate("home"); };

  return <div className="screen saved-places-screen">
    <TopBar variant="back" title="Saved Places" onBack={() => onNavigate("home")} onNavigate={onNavigate} />
    <section className="saved-hero"><div className="saved-hero-icon"><Bookmark size={19} /></div><div><span>Private to your account</span><h1>Places you return to</h1><p>Save Home, Work, College, Hostel or any custom destination for quick access.</p></div></section>
    {status === "error" && <div className="saved-error">{error}<button onClick={loadPlaces}>Try again</button></div>}
    {status === "loading" && <p className="saved-loading">Loading your saved places…</p>}
    {status === "ready" && <>
      <div className="saved-shortcuts"><button disabled={hasHome} onClick={() => openEditor(null, "home")}><Home size={17} /><span><strong>Home</strong><small>{hasHome ? "Already saved" : "Add home"}</small></span><Plus size={15} /></button><button disabled={hasWork} onClick={() => openEditor(null, "work")}><BriefcaseBusiness size={17} /><span><strong>Work</strong><small>{hasWork ? "Already saved" : "Add work"}</small></span><Plus size={15} /></button><button onClick={() => openEditor(null, "custom")}><Bookmark size={17} /><span><strong>Custom</strong><small>College, hostel, gym…</small></span><Plus size={15} /></button></div>
      {emptyCopy ? <div className="saved-empty"><MapPin size={24} /><h2>No saved places yet</h2><p>Save a place once and it will stay linked to your RoadSense account.</p><button onClick={() => openEditor(null, "custom")}><Plus size={15} /> Save your first place</button></div> : <div className="saved-list">{places.map((place) => { const TypeIcon = TYPES.find((item) => item.id === place.type)?.icon || Bookmark; return <article className="saved-card" key={place.id}><button className="saved-main" onClick={() => viewPlace(place)}><span className={`saved-type-icon saved-${place.type}`}><TypeIcon size={17} /></span><span className="saved-copy"><strong>{place.name}</strong><small className="saved-type-label">{place.type === "custom" ? "Custom place" : place.type === "home" ? "Home" : "Work"}</small><span>{place.address}</span></span></button><div className="saved-actions"><button onClick={() => viewPlace(place)} title="View on map" aria-label={`View ${place.name} on map`}><MapPin size={15} /></button><button onClick={() => openEditor(place)} title="Edit" aria-label={`Edit ${place.name}`}><Pencil size={15} /></button><button onClick={() => remove(place)} title="Delete" aria-label={`Delete ${place.name}`}><Trash2 size={15} /></button></div></article>; })}</div>}
    </>}
    {editorOpen && <div className="saved-editor-backdrop" onClick={closeEditor}><section className="saved-editor" onClick={(event) => event.stopPropagation()}>
      <div className="saved-editor-head"><div><span>{editing ? "Edit saved place" : "New saved place"}</span><h2>{editing ? "Change this place" : "Save a destination"}</h2></div><button onClick={closeEditor} aria-label="Close"><X size={18} /></button></div>
      <div className="saved-type-tabs">{TYPES.map((item) => { const Icon = item.icon; const disabled = item.id === "home" ? hasHome && editing?.type !== "home" : item.id === "work" ? hasWork && editing?.type !== "work" : false; return <button key={item.id} disabled={disabled} className={type === item.id ? "active" : ""} onClick={() => { setType(item.id); if (!editing) setName(item.label === "Custom" ? "" : item.label); }}><Icon size={14} />{item.label}</button>; })}</div>
      <label className="saved-field"><span>Place name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder={type === "custom" ? "e.g. College, Hostel, Gym" : type === "home" ? "Home" : "Work"} maxLength={60} /></label>
      <div className="saved-field"><span>Choose location</span><div className="saved-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search an address or place" /><span>{searching ? "…" : ""}</span></div></div>
      {suggestions.length > 0 && <div className="saved-suggestions">{suggestions.map((place) => <button key={place.id} onClick={() => chooseSuggestion(place)}><MapPin size={15} /><span><strong>{place.name}</strong><small>{place.address}</small></span></button>)}</div>}
      <div className="saved-map-wrap"><MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={15} zoomControl style={{ height: "100%", width: "100%" }}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Recenter center={mapCenter} /><MapPicker center={pickerPoint?.coordinates} onPick={chooseSuggestion} /></MapContainer><div className="map-hint">Tap anywhere on the map to pin this place</div></div>
      <button className="current-location-btn" onClick={useCurrentLocation} disabled={!canUseCurrent || locating}><LocateFixed size={15} />{locating ? "Getting your location…" : "Use my current location"}</button>
      <div className="selected-address"><Check size={14} /><span>{address || "Choose a search result, tap the map, or use your current location"}</span></div>
      {error && <p className="saved-form-error">{error}</p>}
      <div className="saved-editor-actions"><button onClick={closeEditor} disabled={saving}>Cancel</button><button className="save-place-btn" onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Save place"}</button></div>
    </section></div>}
  </div>;
}
