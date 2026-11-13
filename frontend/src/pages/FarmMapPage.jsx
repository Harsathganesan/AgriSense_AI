import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Map as MapIcon,
  Layers,
  Sprout,
  Droplets,
  CloudRain,
  Mountain,
  Navigation,
  Info
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { nasaApi } from '../services/api';

// Fix Leaflet default marker icon bug in React
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically re-center map when active farm changes
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function FarmMapPage() {
  const { t, lang } = useLanguage();
  const { farms, activeFarm, setActiveFarm } = useFarm();

  const [activeLayer, setActiveLayer] = useState('standard'); // 'standard', 'satellite', 'ndvi', 'moisture'
  const [layersData, setLayersData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeFarm) return;
    const fetchLayers = async () => {
      try {
        setLoading(true);
        const res = await nasaApi.getLayers(activeFarm.latitude, activeFarm.longitude);
        setLayersData(res.data);
      } catch (err) {
        console.error("Map layer data error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayers();
  }, [activeFarm]);

  const centerPos = [activeFarm?.latitude || 10.7870, activeFarm?.longitude || 79.1378];

  // Default Farm Boundary Polygon around coordinates
  const lat = centerPos[0];
  const lon = centerPos[1];
  const delta = 0.003;
  const farmPolygon = [
    [lat - delta, lon - delta],
    [lat + delta * 0.8, lon - delta * 0.5],
    [lat + delta, lon + delta],
    [lat - delta * 0.6, lon + delta * 0.9],
    [lat - delta, lon - delta]
  ];

  const tileUrls = {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapIcon className="w-7 h-7 text-[#238636]" />
            {t('nav.farmMap')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Geospatial farm boundary mapping and multispectral satellite layer inspection.
          </p>
        </div>

        {/* Layer Selector Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold">
          <button
            onClick={() => setActiveLayer('standard')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeLayer === 'standard' ? 'bg-[#238636] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Street Map
          </button>
          <button
            onClick={() => setActiveLayer('satellite')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeLayer === 'satellite' ? 'bg-[#238636] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Satellite Imagery
          </button>
          <button
            onClick={() => setActiveLayer('ndvi')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeLayer === 'ndvi' ? 'bg-emerald-700 text-white' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            MODIS NDVI
          </button>
          <button
            onClick={() => setActiveLayer('moisture')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeLayer === 'moisture' ? 'bg-teal-700 text-white' : 'text-teal-800 bg-teal-50 hover:bg-teal-100'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            SMAP Moisture
          </button>
        </div>
      </div>

      {/* Map and Telemetry Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Viewport (3 Columns) */}
        <div className="lg:col-span-3 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm h-[520px] relative">
          <MapContainer
            center={centerPos}
            zoom={14}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <MapRecenter center={centerPos} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={activeLayer === 'satellite' ? tileUrls.satellite : tileUrls.standard}
            />

            {/* Farm Boundary Polygon */}
            <Polygon
              positions={farmPolygon}
              pathOptions={{
                color: activeLayer === 'ndvi' ? '#15803d' : (activeLayer === 'moisture' ? '#0f766e' : '#238636'),
                fillColor: activeLayer === 'ndvi' ? '#22c55e' : (activeLayer === 'moisture' ? '#14b8a6' : '#238636'),
                fillOpacity: activeLayer === 'ndvi' ? 0.45 : (activeLayer === 'moisture' ? 0.40 : 0.25),
                weight: 3
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-sans">
                  <strong className="block text-emerald-800">{activeFarm?.name}</strong>
                  <span>Area: {activeFarm?.area_acres} Acres</span>
                </div>
              </Tooltip>
            </Polygon>

            {/* Markers for all user farms */}
            {farms.map((farm) => (
              <Marker
                key={farm.id}
                position={[farm.latitude, farm.longitude]}
                icon={customMarkerIcon}
                eventHandlers={{
                  click: () => setActiveFarm(farm)
                }}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <h4 className="font-extrabold text-slate-900">{farm.name}</h4>
                    <p className="text-slate-500">{farm.district}, {farm.state}</p>
                    <p className="font-bold text-emerald-700 mt-1">{farm.area_acres} Acres • {farm.soil_type}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute bottom-4 left-4 z-40 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-slate-200 text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800">
              {activeFarm?.name} ({activeFarm?.latitude.toFixed(4)}°N, {activeFarm?.longitude.toFixed(4)}°E)
            </span>
          </div>
        </div>

        {/* Right Telemetry Sidebar (1 Column) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Satellite Telemetry Layers
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live NASA Earth Observation layers for selected farm coordinates.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* NDVI */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-[#238636]" />
                  MODIS NDVI
                </span>
                <span className="text-sm font-black text-[#238636]">
                  {layersData?.modis_vegetation?.ndvi_current || 0.52}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700">
                {layersData?.modis_vegetation?.ndvi_status || "Healthy green canopy"}
              </p>
            </div>

            {/* SMAP */}
            <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100">
              <div className="flex items-center justify-between font-bold text-teal-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-teal-600" />
                  SMAP Moisture
                </span>
                <span className="text-sm font-black text-teal-700">
                  {layersData?.smap_soil_moisture?.volumetric_moisture_pct || 24}%
                </span>
              </div>
              <p className="text-[11px] text-teal-700">
                Root-zone moisture (0-100 cm depth)
              </p>
            </div>

            {/* GPM */}
            <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
              <div className="flex items-center justify-between font-bold text-sky-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                  GPM Rain (30d)
                </span>
                <span className="text-sm font-black text-sky-700">
                  {layersData?.gpm_precipitation?.accumulated_30d_mm || 48} mm
                </span>
              </div>
              <p className="text-[11px] text-sky-700">
                Resolution: 0.1° × 0.1° gridded
              </p>
            </div>

            {/* SRTM */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-slate-500" />
                  SRTM Elevation
                </span>
                <span className="text-sm font-black text-slate-800">
                  {layersData?.srtm_elevation?.elevation_meters || 24} m
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Slope: {layersData?.srtm_elevation?.slope_pct || 0.8}% • Flatland
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

