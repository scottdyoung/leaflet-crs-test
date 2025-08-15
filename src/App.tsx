import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  useMap,
  WMSTileLayer,
} from "react-leaflet";
import L, { CRS } from "leaflet";
import React from "react";

import "leaflet/dist/leaflet.css";
import "proj4leaflet";
import proj4 from "proj4";

// Define projections for GIBS WMTS
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

proj4.defs(
  "EPSG:3857",
  "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
);

const CRS_4326 = new L.Proj.CRS(
  "EPSG:4326",
  "+proj=longlat +datum=WGS84 +no_defs",
  {
    origin: [-180, 90], // lon/lat of top-left corner in degrees
    resolutions: Array.from({ length: 7 }, (_, z) => 0.5625 / Math.pow(2, z)),
    bounds: L.bounds(
      [-180, -90], // minX, minY in degrees
      [180, 90] // maxX, maxY in degrees
    ),
  }
);

// Marker location (lat, lon)
const MARKER = { lat: 37.08, lon: -76.35 };
// const MARKER = { lat: 0, lon: 0 };

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
  "EPSG:4326": CRS_4326,
};

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <div>{children}</div>}
    </div>
  );
}

interface CustomMapProps {
  crs: CRS;
  selectedEPSG: string;
}

const Mundialis = ({
  crs,
  selectedEPSG,
}: CustomMapProps): React.JSX.Element => {
  return (
    <div className="rounded-2xl overflow-hidden shadow border">
      <MapContainer
        key={selectedEPSG}
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
  );
};

const NasaLayer = ({ epsg }: { epsg: string }): React.JSX.Element => {
  const map = useMap();
  // const layerId = "BlueMarble_ShadedRelief";
  // const time = "default";
  // const tileMatrixSet =
  //   epsg === "EPSG:4326" ? "500m" : "GoogleMapsCompatible_Level9";

  // const baseUrl =
  //   epsg === "EPSG:4326"
  //     ? `nasa/epsg4326/best/${layerId}/default/${time}/${tileMatrixSet}/{z}/{y}/{x}.jpg`
  //     : `nasa/epsg3857/best/${layerId}/default/${time}/${tileMatrixSet}/{z}/{y}/{x}.jpg`;

  // return (
  //   <TileLayer
  //     url={baseUrl}
  //     tileSize={512}
  //     noWrap={true}
  //     attribution="Imagery courtesy NASA Earth Observations"
  //   />
  // );
  useEffect(() => {
    const layerId = "BlueMarble_ShadedRelief";
    const time = "default";
    const tileMatrixSet =
      epsg === "EPSG:4326" ? "500m" : "GoogleMapsCompatible_Level8";
    const tileSize = epsg === "EPSG:4326" ? 512 : 256;

    const baseUrl =
      epsg === "EPSG:4326"
        ? `nasa/epsg4326/best/${layerId}/default/${time}/${tileMatrixSet}/{z}/{y}/{x}.jpg`
        : `nasa/epsg3857/best/${layerId}/default/${time}/${tileMatrixSet}/{z}/{y}/{x}.jpg`;

    const wmtsLayer = L.tileLayer(baseUrl, {
      tileSize,
      noWrap: true,
    });

    wmtsLayer.addTo(map);

    return () => {
      map.removeLayer(wmtsLayer);
    };
  }, [map, epsg]);

  return <></>;
};

const Nasa = ({ crs, selectedEPSG }: CustomMapProps): React.JSX.Element => {
  return (
    <MapContainer
      key={selectedEPSG}
      center={[MARKER.lat, MARKER.lon]}
      zoom={2}
      crs={crs}
      style={{ height: "70vh", width: "100%" }}
      worldCopyJump
    >
      <NasaLayer epsg={selectedEPSG} />
      <Marker position={[MARKER.lat, MARKER.lon]}>
        <Popup>
          Marker at lat {MARKER.lat}, lon {MARKER.lon}
          <br />
          Current projection: {selectedEPSG}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

const Bifrost = ({ crs, selectedEPSG }: CustomMapProps): React.JSX.Element => {
  return (
    <div className="rounded-2xl overflow-hidden shadow border">
      <MapContainer
        key={selectedEPSG}
        center={[MARKER.lat, MARKER.lon]}
        zoom={6}
        style={{ height: "70vh", width: "100%" }}
        crs={crs}
        worldCopyJump={true}
      >
        <WMSTileLayer
          transparent="TRUE"
          url="/bifrost/ogc/AFW_WMS?"
          layers="LAND"
          format="image/png"
          version="1.3.0"
          uppercase
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
  );
};
export default function App() {
  const [selectedEPSG, setSelectedEPSG] = useState<string>("EPSG:3857");
  const [tabIndex, setTabIndex] = useState(1);

  const crs =
    selectedEPSG === "EPSG:4326"
      ? SUPPORTED_EPSG["EPSG:4326"]
      : SUPPORTED_EPSG["EPSG:3857"];

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
            {Object.keys(SUPPORTED_EPSG).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="tabs">
          <button
            className={`tab ${tabIndex === 0 ? "active" : ""}`}
            onClick={() => setTabIndex(0)}
          >
            Mundialis
          </button>
          <button
            className={`tab ${tabIndex === 1 ? "active" : ""}`}
            onClick={() => setTabIndex(1)}
          >
            Kartverket
          </button>
          <button
            className={`tab ${tabIndex === 2 ? "active" : ""}`}
            onClick={() => setTabIndex(2)}
          >
            BiFROST
          </button>
        </div>

        <TabPanel value={tabIndex} index={0}>
          <Mundialis crs={crs} selectedEPSG={selectedEPSG} />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <Nasa crs={crs} selectedEPSG={selectedEPSG} />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <Bifrost crs={crs} selectedEPSG={selectedEPSG} />
        </TabPanel>
      </div>
    </div>
  );
}
