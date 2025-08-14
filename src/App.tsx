import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, WMSTileLayer } from "react-leaflet";
import L from "leaflet";
// If your bundler complains, install deps: npm i react-leaflet leaflet proj4 proj4leaflet
// Types: npm i -D @types/leaflet
// Vite tip: add the CSS import in your main entry: import 'leaflet/dist/leaflet.css'

// --- Config ---
const WMS_BASE_URL = "/mundialis/services/service?";
const WMS_LAYER = "TOPO-OSM-WMS"; // Also available: TOPO-WMS, OSM-Overlay-WMS
const WMS_VERSION = "1.1.1"; // Use 1.1.1 to avoid axis order headaches

// Marker location (lat, lon)
const MARKER = { lat: 36, lon: -78 };

// Leaflet default icon fix (Vite/Cra often need this tweak)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Supported CRS in vanilla Leaflet (no proj4 needed). You can extend this list with Proj4Leaflet if desired.
const SUPPORTED_EPSG: Record<string, L.CRS> = {
  "EPSG:3857": L.CRS.EPSG3857,
  "EPSG:4326": L.CRS.EPSG4326,
};

// Fetch and parse WMS GetCapabilities to extract available EPSG codes for the chosen layer.
async function fetchWmsCRS(): Promise<string[]> {
  const url = `${WMS_BASE_URL}SERVICE=WMS&REQUEST=GetCapabilities&VERSION=${WMS_VERSION}`;
  const res = await fetch(url);
  const text = await res.text();

  // Parse XML
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  console.log(xml);
  // Find the Layer entry that matches WMS_LAYER
  const layers = Array.from(xml.getElementsByTagName("Layer"));
  const target = layers.find((lyr) => {
    const nameEl = lyr.getElementsByTagName("Name")[0];
    return nameEl && nameEl.textContent === WMS_LAYER;
  });

  // Collect CRS/SRS tags
  const crsTags = target
    ? [
        ...Array.from(target.getElementsByTagName("CRS")).map(
          (n) => n.textContent || ""
        ),
        ...Array.from(target.getElementsByTagName("SRS")).map(
          (n) => n.textContent || ""
        ),
      ]
    : [];

  // Fallback to root supported CRS if none found at layer level
  const rootCRS = [
    ...Array.from(xml.getElementsByTagName("CRS")).map(
      (n) => n.textContent || ""
    ),
    ...Array.from(xml.getElementsByTagName("SRS")).map(
      (n) => n.textContent || ""
    ),
  ];
  const epsgList = (crsTags.length ? crsTags : rootCRS)
    .filter((s) => s && /EPSG:\d+/.test(s))
    .map((s) => s!.match(/EPSG:\d+/)![0])
    .filter((v, i, a) => a.indexOf(v) === i);

  console.log(rootCRS, epsgList);
  return epsgList;
}

export default function App() {
  const [epsgOptions, setEpsgOptions] = useState<string[]>([]);
  const [selectedEPSG, setSelectedEPSG] = useState<string>("EPSG:3857");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchWmsCRS();
        // Only keep ones we can render without Proj4 definitions (extend as needed)
        const usable = list.filter((code) => SUPPORTED_EPSG[code]);
        const finalList = usable.length ? usable : Object.keys(SUPPORTED_EPSG);
        setEpsgOptions(finalList);
        if (!usable.length) {
          setError(
            "Could not read CRS list from WMS (or none usable without Proj4). Falling back to common EPSG codes."
          );
        }
      } catch (e) {
        console.warn(e);
        setEpsgOptions(Object.keys(SUPPORTED_EPSG));
        setError(
          "WMS GetCapabilities fetch failed (possibly CORS). Using fallback EPSG list."
        );
      }
    })();
  }, []);

  const crs: L.CRS = useMemo(() => {
    return SUPPORTED_EPSG[selectedEPSG] || L.CRS.EPSG3857;
  }, [selectedEPSG]);

  // Force MapContainer to remount when CRS changes
  const mapKey = selectedEPSG;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto grid gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Projection (EPSG):</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedEPSG}
            onChange={(e) => setSelectedEPSG(e.target.value)}
          >
            {epsgOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          {error && (
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
              {error}
            </span>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden shadow border">
          <MapContainer
            key={mapKey}
            center={[MARKER.lat, MARKER.lon]}
            zoom={6}
            style={{ height: "70vh", width: "100%" }}
            crs={crs}
            worldCopyJump={true}
          >
            <WMSTileLayer
              url="https://ows.mundialis.de/services/service?"
              layers="TOPO-OSM-WMS"
              format="image/png"
              transparent={true}
              version="1.1.1"
              attribution="Mundialis WMS"
            />
            <Marker position={[MARKER.lat, MARKER.lon]}>
              <Popup>
                Marker at lat {MARKER.lat}, lon {MARKER.lon}
                <br />
                Current projection: {selectedEPSG}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
