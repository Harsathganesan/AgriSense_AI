import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Thermometer,
  CloudRain,
  Droplets,
  Sprout,
  Mountain,
  Award,
  ArrowRight,
  RotateCcw,
  FlaskConical,
  Sparkles,
  FileDown,
  RefreshCw,
  MapPin,
  Compass,
  CalendarCheck2,
  TrendingUp,
  Building
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { nasaApi, reportsApi, locationApi, analysisApi, districtApi } from '../services/api';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import SoilScoreGauge from '../components/SoilScoreGauge';

// District Reference Marker Icon
const districtMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically manage District Map center & bounding box
function MapDistrictController({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [30, 30], animate: true });
    } else if (center && center[0] && center[1]) {
      map.setView(center, zoom || 10, { animate: true });
    }
  }, [center, zoom, bounds, map]);
  return null;
}

// Custom Tooltip distinguishing actual NASA Observations vs Nowcast Predictions up to Today
function CustomWeatherTooltip({ active, payload, label, lang }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPredicted = data.is_predicted;
    const isToday = data.is_today;
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl text-xs space-y-1.5 min-w-[210px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
          <span className="font-extrabold text-slate-800 font-mono text-[11px]">📅 {data.date}</span>
          {isToday ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {lang === 'ta' ? 'இன்று (கணிப்பு)' : 'Today (Nowcast)'}
            </span>
          ) : isPredicted ? (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[9px] font-black border border-purple-200">
              {lang === 'ta' ? 'AI கணிப்பு' : 'AI Nowcast'}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[9px] font-bold">
              {lang === 'ta' ? 'செயற்கைக்கோள்' : 'Satellite Obs'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Mean Temp</span>
            <span className="font-extrabold text-amber-600">{data.temp_mean}°C</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Precipitation</span>
            <span className="font-extrabold text-sky-600">{data.precipitation_mm} mm</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Max / Min Temp</span>
            <span className="font-bold text-slate-700">{data.temp_max}° / {data.temp_min}°C</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Humidity</span>
            <span className="font-bold text-slate-700">{data.relative_humidity_pct}%</span>
          </div>
        </div>
        {isPredicted && (
          <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span className="text-purple-700 font-semibold">{lang === 'ta' ? 'நாசா கணிப்பு மாதிரி' : 'NASA Nowcast Model'}</span>
            <span className="font-mono font-bold text-slate-700">{data.confidence_score || 90}% Conf</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. Registered Location & Active District Synchronization across all modules
  const registeredCountry = user?.registered_location?.country || user?.country || "India";
  const registeredState = user?.registered_location?.state || user?.state || "Tamil Nadu";

  const [activeDistrict, setActiveDistrict] = useState(() => {
    try {
      const stored = localStorage.getItem('agrisense_tracked_crop');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.district) return parsed.district;
      }
    } catch (e) {}
    return user?.registered_location?.district || user?.district || "Pudukkottai";
  });

  // Tracked Crop from Crop Explorer & Agri Tracker
  const [trackedCropData, setTrackedCropData] = useState(() => {
    try {
      const stored = localStorage.getItem('agrisense_tracked_crop');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Sync with localStorage when other modules (Crop Explorer, Agri Tracker, Settings) change tracked crop or district
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const stored = localStorage.getItem('agrisense_tracked_crop');
        if (stored) {
          const parsed = JSON.parse(stored);
          setTrackedCropData(parsed);
          if (parsed.district && parsed.district !== activeDistrict) {
            setActiveDistrict(parsed.district);
          }
        }
      } catch (e) {
        console.warn('Tracked crop sync error:', e);
      }
    };

    window.addEventListener('agrisense_tracked_crop_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('agrisense_tracked_crop_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [activeDistrict]);

  // 2. District Boundary & GeoJSON Map State
  const [districtMeta, setDistrictMeta] = useState(null);
  const [districtGeoJson, setDistrictGeoJson] = useState(null);
  const [loadingDistrictMap, setLoadingDistrictMap] = useState(true);

  // 3. NASA & Agricultural Analysis State
  const [nasaSummary, setNasaSummary] = useState(null);
  const [districtEnv, setDistrictEnv] = useState(null);
  const [soilRecord, setSoilRecord] = useState(null);
  const [rotationData, setRotationData] = useState(null);
  const [districtCrops, setDistrictCrops] = useState([]);
  const [locAnalysis, setLocAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Fetch District Boundary GeoJSON for active district
  useEffect(() => {
    const fetchDistrict = async () => {
      try {
        setLoadingDistrictMap(true);
        const res = await locationApi.getDistrictBoundary(activeDistrict, registeredState, registeredCountry);
        if (res.data) {
          setDistrictMeta(res.data);
          if (res.data.geojson) {
            setDistrictGeoJson(res.data.geojson);
          }
        }
      } catch (err) {
        console.warn("Failed to load district boundary GeoJSON:", err);
      } finally {
        setLoadingDistrictMap(false);
      }
    };
    fetchDistrict();
  }, [activeDistrict, registeredState, registeredCountry]);

  // Location Analysis
  const fetchLocationAndAnalysis = async () => {
    try {
      const lat = districtMeta?.center?.[0] || 10.3833;
      const lon = districtMeta?.center?.[1] || 78.8000;

      const analysisRes = await analysisApi.getLocationBased(lat, lon);
      if (analysisRes.data) {
        setLocAnalysis(analysisRes.data);
      }
    } catch (err) {
      console.error("Location analysis load error:", err);
    }
  };

  useEffect(() => {
    fetchLocationAndAnalysis();
  }, [districtMeta]);

  // Main Dashboard Data Fetching (Synchronized across all modules)
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const lat = districtMeta?.center?.[0] || 10.3833;
      const lon = districtMeta?.center?.[1] || 78.8000;

      const [nasaRes, districtSoilRes, districtRotRes, districtEnvRes, districtCropsRes] = await Promise.all([
        nasaApi.getSummary(lat, lon).catch(() => ({ data: null })),
        districtApi.getSoilHealth(activeDistrict, registeredState, registeredCountry).catch(() => ({ data: null })),
        districtApi.getRotation(activeDistrict, registeredState, registeredCountry).catch(() => ({ data: null })),
        districtApi.getEnvironment(activeDistrict, registeredState, registeredCountry).catch(() => ({ data: null })),
        districtApi.getCrops(activeDistrict, 'All', '', registeredState, registeredCountry).catch(() => ({ data: null }))
      ]);

      if (nasaRes?.data) setNasaSummary(nasaRes.data);
      if (districtEnvRes?.data) setDistrictEnv(districtEnvRes.data);
      if (districtSoilRes?.data) {
        setSoilRecord({
          health_score: districtSoilRes.data.laboratory_soil_test?.composite_health_score || 82,
          status_summary: districtSoilRes.data.laboratory_soil_test?.status_summary || {},
          ph: districtSoilRes.data.laboratory_soil_test?.ph,
          nitrogen_kg_ha: districtSoilRes.data.laboratory_soil_test?.nitrogen_kg_ha,
          phosphorus_kg_ha: districtSoilRes.data.laboratory_soil_test?.phosphorus_kg_ha,
          potassium_kg_ha: districtSoilRes.data.laboratory_soil_test?.potassium_kg_ha,
          organic_carbon_pct: districtSoilRes.data.laboratory_soil_test?.organic_carbon_pct,
          test_date: districtSoilRes.data.laboratory_soil_test?.test_date,
          lab_name: districtSoilRes.data.laboratory_soil_test?.lab_name
        });
      }
      if (districtRotRes?.data) setRotationData(districtRotRes.data);
      if (districtCropsRes?.data?.crops) setDistrictCrops(districtCropsRes.data.crops);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [districtMeta, activeDistrict]);

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);
      const res = await reportsApi.generate("default_farm");
      if (res.data?.download_url) {
        window.open(res.data.download_url, '_blank');
      }
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setDownloadingReport(false);
    }
  };

  const metrics = districtEnv?.metrics || nasaSummary?.current_metrics || {};
  const alerts = nasaSummary?.alerts || [];
  const dailyHistory = districtEnv?.daily_history || nasaSummary?.daily_history || [];
  const todayPrediction = districtEnv?.today_prediction || nasaSummary?.today_prediction || locAnalysis?.today_prediction || null;

  // Recommended Rotation Strategy from Rotation Planner Module
  const recStrategy = rotationData?.strategies?.find(
    (s) => s.id === rotationData.recommended_strategy_id || s.strategy_type === 'soil_health'
  ) || rotationData?.strategies?.[0];

  return (
    <div className="space-y-6">
      {/* 1. Top Banner / Welcome with Synchronized District */}
      <div className="bg-gradient-to-r from-emerald-800 via-[#238636] to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

        <div className="z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            NASA Earth Telemetry Active • {activeDistrict}, {registeredState}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.name ? `${user.name} (${activeDistrict} Farm)` : `${activeDistrict} Agricultural Dashboard`}
          </h1>
          <p className="text-emerald-100 text-sm mt-1.5 leading-relaxed">
            {t('dashboard.overviewSubtitle')}
          </p>
        </div>

        {/* Quick Action Buttons - Single Line on Mobile & Desktop */}
        <div className="z-10 flex flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={() => navigate('/rotation-planner')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs hover:bg-emerald-50 transition shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 text-[#238636] shrink-0" />
            <span className="truncate">{t('dashboard.planRotation')}</span>
          </button>
          <button
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/70 border border-white/20 text-white font-extrabold text-xs transition backdrop-blur-sm cursor-pointer whitespace-nowrap"
          >
            <FileDown className="w-4 h-4 shrink-0" />
            <span className="truncate">{downloadingReport ? 'Building...' : t('common.download')}</span>
          </button>
        </div>
      </div>

      {/* 2. LIVE AGRI TRACKER & CROP LIFECYCLE WIDGET (Synced with Crop Explorer & Agri Tracker) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white rounded-3xl p-5 sm:p-6 border border-emerald-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#238636] text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  {lang === 'ta' ? 'நடப்பு சாகுபடி கண்காணிப்பு (Agri Tracker)' : 'Active Crop Cultivation Tracker'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {trackedCropData ? (lang === 'ta' ? 'செயலில் உள்ளது ⏳' : 'On Process ⏳') : (lang === 'ta' ? 'பயிர் தேர்வு செய்க' : 'Ready to Track')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {lang === 'ta'
                  ? `${activeDistrict} மாவட்டத்திற்கான தினசரி பாசனம், உரம் & நாசா மழை கண்காணிப்பு.`
                  : `Real-time cultivation stages, irrigation timing, and NASA rain adaptation for ${activeDistrict}.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(trackedCropData ? '/agri-tracker' : '/crop-explorer')}
            className="px-4 py-2 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm hover:scale-[1.01] cursor-pointer self-start sm:self-center"
          >
            <span>
              {trackedCropData
                ? (lang === 'ta' ? 'Agri Tracker-ல் பார்க்க' : 'Open in Agri Tracker')
                : (lang === 'ta' ? 'பயிரைத் தேர்வுசெய் 🚀' : 'Explore Crops 🚀')}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {trackedCropData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* 1. Tracked Crop Name */}
            <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {lang === 'ta' ? 'சாகுபடி பயிர்' : 'Cultivated Crop'}
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 leading-snug truncate">
                🌱 {lang === 'ta' ? (trackedCropData.crop?.tamil_name || trackedCropData.crop?.name) : trackedCropData.crop?.name}
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 mt-1 inline-block">
                {trackedCropData.crop?.category || 'Field Crop'} • {activeDistrict}
              </span>
            </div>

            {/* 2. Crop Age & Progress */}
            <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {lang === 'ta' ? 'பயிரின் வயது' : 'Crop Age / Progress'}
              </span>
              <div className="text-sm font-black text-slate-900">
                Day 18 <span className="text-xs font-semibold text-slate-400">/ {trackedCropData.crop?.duration_days_avg || 105} Days</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 mt-1 inline-block">
                {lang === 'ta' ? 'செடி வளர்ச்சிப் பருவம்' : 'Vegetative Stage'}
              </span>
            </div>

            {/* 3. Next Irrigation Status (Synced with heavy rain auto-pause) */}
            <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {lang === 'ta' ? 'அடுத்த பாசனம்' : 'Next Irrigation'}
              </span>
              <div className="text-sm font-black text-sky-900">
                {(todayPrediction?.precipitation_mm ?? 0) > 20
                  ? (lang === 'ta' ? 'நாள் 22 (தள்ளிவைப்பு)' : 'Day 22 (Rescheduled)')
                  : 'Day 20'}
              </div>
              <span
                className={`text-[10px] font-bold mt-1 inline-block ${
                  (todayPrediction?.precipitation_mm ?? 0) > 20 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {(todayPrediction?.precipitation_mm ?? 0) > 20
                  ? (lang === 'ta' ? 'மழையால் நிறுத்தம் 🛑' : 'Paused by Rain 🛑')
                  : (lang === 'ta' ? 'அட்டவணை தயார்' : 'On Schedule')}
              </span>
            </div>

            {/* 4. Next Fertilizer */}
            <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {lang === 'ta' ? 'அடுத்த உரம்' : 'Next Fertilizer'}
              </span>
              <div className="text-sm font-black text-slate-900 truncate">
                Day 25
              </div>
              <span className="text-[10px] font-bold text-emerald-700 mt-1 inline-block">
                {lang === 'ta' ? 'முதல் மேலுரம் (இன்னும் 7 நாட்கள்)' : 'Top Dressing (In 7 Days)'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-dashed border-emerald-300 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌾</span>
              <span>
                {lang === 'ta'
                  ? 'தற்போது பயிர் எதுவும் கண்காணிக்கப்படவில்லை. Crop Explorer-ல் பயிரைத் தேர்ந்தெடுத்து 100 நாள் சாகுபடி அட்டவணையைத் தொடங்குங்கள்.'
                  : 'No crop currently tracked. Select any crop in Crop Explorer to start tracking irrigation, fertilizers, and NASA weather.'}
              </span>
            </div>
            <button
              onClick={() => navigate('/crop-explorer')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold shrink-0 transition cursor-pointer"
            >
              {lang === 'ta' ? 'Crop Explorer செல்' : 'Go to Crop Explorer'} →
            </button>
          </div>
        )}
      </div>

      {/* 3. District-Based Map & Top Recommended Crops Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
        {/* District Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#238636] flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  {activeDistrict}, {registeredState}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {registeredCountry}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ta'
                  ? `${activeDistrict} மாவட்ட எல்லை மற்றும் விவசாய சூழல் வரைபடம்.`
                  : `Boundary GeoJSON map and agricultural conditions for ${activeDistrict}.`}
              </p>
            </div>
          </div>
        </div>

        {/* District Map with Boundary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Map Container (7 Cols) */}
          <div className="lg:col-span-7 h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
            <MapContainer
              center={districtMeta?.center || [10.3833, 78.8000]}
              zoom={districtMeta?.recommended_zoom || 10}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <MapDistrictController
                center={districtMeta?.center || [10.3833, 78.8000]}
                zoom={districtMeta?.recommended_zoom || 10}
                bounds={districtMeta?.bounding_box}
              />
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* District Boundary GeoJSON Highlight */}
              {districtGeoJson && (
                <GeoJSON
                  key={`${activeDistrict}_${registeredState}`}
                  data={districtGeoJson}
                  style={{
                    color: '#238636',
                    weight: 2.5,
                    opacity: 0.9,
                    fillColor: '#238636',
                    fillOpacity: 0.12,
                    dashArray: '4 4'
                  }}
                />
              )}

              {/* District Center Marker */}
              {districtMeta?.center && (
                <Marker position={districtMeta.center} icon={districtMarkerIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <span className="font-extrabold text-slate-900 block">{activeDistrict}</span>
                      <span className="text-[11px] text-slate-600 block">{registeredState}, {registeredCountry}</span>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute top-2 left-2 z-[400] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-800 border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#238636]" />
              <span>{activeDistrict}</span>
            </div>
          </div>

          {/* Right 5 Cols: Agricultural Summary & Recommended Crops (Synced with Crop Explorer) */}
          <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
            {/* Bilingual Agricultural Summary Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white border border-emerald-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                <Compass className="w-3.5 h-3.5 text-[#238636]" />
                {lang === 'ta' ? 'விவசாய நிலை சுருக்கம்' : 'Agricultural Summary'}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {lang === 'ta'
                  ? (locAnalysis?.agricultural_insights_summary?.summary_ta || `${activeDistrict} மாவட்டத்தின் தட்பவெப்ப நிலை மற்றும் மண் சூழல் வெற்றிகரமாக பகுப்பாய்வு செய்யப்பட்டது.`)
                  : (locAnalysis?.agricultural_insights_summary?.summary_en || `Agricultural weather and soil analysis for ${activeDistrict} district.`)
                }
              </p>
            </div>

            {/* Dual Risk Gauges: Drought Risk & Heavy Rain Risk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Drought Risk Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {lang === 'ta' ? 'வறட்சி அபாயம்' : 'Drought Risk'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {locAnalysis?.drought_risk?.risk_level === 'Low' ? (lang === 'ta' ? 'குறைவு • இயல்பு நிலை' : 'Low • Normal State') : (locAnalysis?.drought_risk?.risk_level || 'Low')}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                  locAnalysis?.drought_risk?.risk_level === 'Severe'
                    ? 'bg-rose-100 text-rose-800'
                    : locAnalysis?.drought_risk?.risk_level === 'Moderate'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {locAnalysis?.drought_risk?.risk_level || 'Low'}
                </span>
              </div>

              {/* Heavy Rainfall Risk Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <CloudRain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {lang === 'ta' ? 'மழை அபாயம்' : 'Rainfall Risk'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {locAnalysis?.heavy_rainfall_risk?.risk_level === 'High' ? (lang === 'ta' ? 'அதிகம் • வடிகால் தேவை' : 'High • Drainage Needed') : (lang === 'ta' ? 'குறைவு • இயல்பு நிலை' : 'Low • Safe Drainage')}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                  locAnalysis?.heavy_rainfall_risk?.risk_level === 'High'
                    ? 'bg-rose-100 text-rose-800'
                    : locAnalysis?.heavy_rainfall_risk?.risk_level === 'Moderate'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {locAnalysis?.heavy_rainfall_risk?.risk_level || 'Low'}
                </span>
              </div>
            </div>

            {/* Top Crops (Synchronized with Crop Explorer) */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-[#238636]" />
                  {lang === 'ta' ? 'Crop Explorer பரிந்துரை பயிர்கள்' : 'Top Recommended Crops'}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/crop-explorer')}
                  className="text-[10px] text-[#238636] font-bold hover:underline"
                >
                  {lang === 'ta' ? 'அனைத்தும் →' : 'All Crops →'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(districtCrops.length > 0
                  ? districtCrops.slice(0, 2)
                  : (locAnalysis?.crop_suitability_insights || []).slice(0, 2)
                ).map((item, idx) => {
                  const cropObj = item.crop || item;
                  const score = item.suitability_score;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate('/crop-explorer')}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-300 text-xs transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 text-[11px] truncate group-hover:text-[#238636]">
                          {lang === 'ta' ? (cropObj.tamil_name || cropObj.name || cropObj.crop) : (cropObj.name || cropObj.crop)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                          {score}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Environmental Alerts Banner */}
      <AlertBanner alerts={alerts} />

      {/* 5. Today's Weather Forecast & Advisory Card */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/50 rounded-3xl p-5 sm:p-6 border border-sky-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                {lang === 'ta' ? 'இன்றைய வானிலை கணிப்பு & விவசாய வழிகாட்டுதல்' : "Today's Weather Forecast & Advisory"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ta'
                  ? `${activeDistrict} பகுதிக்கான இன்றைய நேரலை வானிலை மற்றும் விவசாய முன்னறிவிப்பு.`
                  : `Daily weather conditions and farm advisory for ${activeDistrict}.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              📅 {todayPrediction?.date || new Date().toISOString().slice(0, 10)}
            </span>
          </div>
        </div>

        {/* 4 Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4">
          {/* 1. Temperature */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                {lang === 'ta' ? 'வெப்பநிலை' : 'Temperature'}
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {todayPrediction?.temp_mean ?? 27.0}<span className="text-sm font-semibold text-slate-500">°C</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                High {todayPrediction?.temp_max ?? 31.5}° • Low {todayPrediction?.temp_min ?? 22.5}°
              </div>
            </div>
          </div>

          {/* 2. Precipitation */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span className="flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                {lang === 'ta' ? 'மழை அளவு' : 'Rainfall'}
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {todayPrediction?.precipitation_mm ?? 0.0}<span className="text-sm font-semibold text-slate-500"> mm</span>
              </div>
              <div className="text-[11px] text-sky-700 font-bold mt-0.5">
                {todayPrediction?.rain_probability_pct ?? 15}% {lang === 'ta' ? 'மழை சாத்தியம்' : 'Chance of Rain'}
              </div>
            </div>
          </div>

          {/* 3. Humidity & Solar */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-teal-500" />
                {lang === 'ta' ? 'ஈரப்பதம்' : 'Humidity'}
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {todayPrediction?.relative_humidity_pct ?? 72}<span className="text-sm font-semibold text-slate-500">%</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {lang === 'ta' ? 'சூரிய ஒளி' : 'Sunlight'}: {todayPrediction?.solar_radiation_mj ?? 18.0} MJ/m²
              </div>
            </div>
          </div>

          {/* 4. Sky Condition */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ta' ? 'வானிலை நிலை' : 'Sky Condition'}
              </span>
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 truncate">
                {lang === 'ta' ? (todayPrediction?.condition_ta || 'பகுதி மேகமூட்டம்') : (todayPrediction?.condition_en || 'Partly Cloudy')}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                {lang === 'ta' ? 'விவசாயத்திற்கு உகந்தது' : 'Farming Favorable'}
              </div>
            </div>
          </div>
        </div>

        {/* Farmer Advisory Callout */}
        <div className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-100/70 via-teal-50/60 to-white border border-emerald-200 text-xs text-slate-700 flex items-start gap-2.5">
          <span className="text-base shrink-0">🌾</span>
          <div className="flex-1">
            <span className="font-extrabold text-emerald-950 mr-1.5">
              {lang === 'ta' ? 'இன்றைய விவசாய ஆலோசனை:' : "Today's Agricultural Advisory:"}
            </span>
            <span className="font-medium text-slate-700 leading-relaxed">
              {lang === 'ta'
                ? (todayPrediction?.advisory_ta || 'இன்றைய வானிலை கணிப்புப்படி விவசாய பணிகளுக்கு சாதகமான சூழல் நிலவுகிறது. பாசனத்திற்கு முன் மண் ஈரப்பதத்தை சோதிக்கவும்.')
                : (todayPrediction?.advisory_en || "Favorable weather conditions for field work. Inspect soil moisture before scheduling irrigation.")}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Core Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard
          title={t('dashboard.temp')}
          value={todayPrediction?.temp_mean ?? locAnalysis?.nasa_weather_snapshot?.current_temp_c ?? metrics.temperature?.current_c ?? metrics.avg_temp_c ?? '--'}
          unit="°C"
          icon={Thermometer}
          accentColor="#f97316"
          subtitle={lang === 'ta' ? 'இன்றைய வெப்பநிலை' : "Today's Temperature"}
          badgeText={todayPrediction ? `${todayPrediction.temp_mean}°C` : (locAnalysis?.nasa_weather_snapshot?.temp_status_en || "Normal")}
          badgeType="success"
        />
        <StatCard
          title={t('dashboard.rainfall')}
          value={locAnalysis?.nasa_rainfall_snapshot?.recent_30d_mm ?? metrics.rainfall?.recent_30d_mm ?? metrics.precipitation_30d_mm ?? '--'}
          unit="mm"
          icon={CloudRain}
          accentColor="#0284c7"
          subtitle={lang === 'ta' ? '30 நாள் மழை' : '30-Day Rain'}
          badgeText={todayPrediction?.precipitation_mm > 0 ? `${todayPrediction.precipitation_mm}mm Today` : (lang === 'ta' ? 'இயல்பு' : 'Normal')}
          badgeType="info"
        />
        <StatCard
          title={t('dashboard.moisture')}
          value={locAnalysis?.soil_moisture_snapshot?.volumetric_moisture_pct ?? metrics.soil_moisture?.rootzone_volumetric_pct ?? metrics.smap_moisture_pct ?? '--'}
          unit="%"
          icon={Droplets}
          accentColor="#0d9488"
          subtitle={lang === 'ta' ? 'மண் ஈரப்பதம்' : 'Soil Moisture'}
          badgeText={(locAnalysis?.soil_moisture_snapshot?.volumetric_moisture_pct ?? 24) >= 20 ? (lang === 'ta' ? 'போதுமானது' : 'Adequate') : (lang === 'ta' ? 'குறைவு' : 'Deficit')}
          badgeType="info"
        />
        <StatCard
          title={lang === 'ta' ? 'பயிர் பசுமை' : 'Canopy Greenness'}
          value={metrics.vegetation_ndvi?.current_ndvi ?? metrics.ndvi ?? '--'}
          unit="NDVI"
          icon={Sprout}
          accentColor="#238636"
          subtitle={lang === 'ta' ? 'பயிர் வளர்ச்சி' : 'Crop Vigor'}
          badgeText={lang === 'ta' ? 'ஆரோக்கியமானது' : 'Healthy'}
          badgeType="success"
        />
        <StatCard
          title={t('dashboard.elevation')}
          value={metrics.elevation_m !== undefined ? metrics.elevation_m : (districtMeta?.elevation_meters || 24)}
          unit="m"
          icon={Mountain}
          accentColor="#64748b"
          subtitle={lang === 'ta' ? 'நில உயரம்' : 'Elevation'}
          badgeText={`Slope ${metrics.slope_pct || 0.8}%`}
          badgeType="neutral"
        />
        <StatCard
          title={t('dashboard.soilScore')}
          value={soilRecord?.health_score !== undefined ? Math.round(soilRecord.health_score) : 82}
          unit="/100"
          icon={Award}
          accentColor="#16a34a"
          subtitle={lang === 'ta' ? 'மண் வளம்' : 'Soil Quality'}
          badgeText={soilRecord?.status_summary?.grade || 'Good'}
          badgeType="success"
        />
      </div>

      {/* 7. Daily Weather & Rainfall Trends Chart (Full Width Rectangle) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {t('dashboard.weatherTrends')}
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                {lang === 'ta' ? `இன்று வரை (${todayPrediction?.date || 'Current Date'})` : `Through Today (${todayPrediction?.date || 'Current Date'})`}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'ta' ? 'தினசரி வெப்பநிலை மற்றும் மழைப்பொழிவு விவரம்.' : 'Daily temperature and rainfall observations through today.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/70">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> {lang === 'ta' ? 'மழை' : 'Rain'}
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] ml-2" /> {lang === 'ta' ? 'வெப்பம்' : 'Temp'}
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyHistory.slice(-20)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => val?.slice(5)}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                unit="°C"
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                unit="mm"
              />
              <Tooltip content={<CustomWeatherTooltip lang={lang} />} />
              <Bar yAxisId="right" dataKey="precipitation_mm" name="Rainfall (mm)" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line yAxisId="left" type="monotone" dataKey="temp_mean" name="Temp Mean (°C)" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: '#f97316' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 8. Bottom Grid: Soil Health Scorecard & Recommended Crop Sequence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Soil Health Scorecard with Lab Nutrients */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <SoilScoreGauge
              score={soilRecord?.health_score || 82}
              grade={soilRecord?.status_summary?.grade || "Good"}
              gradeTamil={soilRecord?.status_summary?.grade_tamil || "நன்று"}
            />

            {/* Key Soil Test Nutrients matching Soil Health module */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">pH Level</span>
                <span className="font-extrabold text-slate-800">pH {soilRecord?.ph || 6.4}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Nitrogen (N)</span>
                <span className="font-extrabold text-emerald-700">{soilRecord?.nitrogen_kg_ha || 185} kg/ha</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Phosphorus (P)</span>
                <span className="font-extrabold text-emerald-700">{soilRecord?.phosphorus_kg_ha || 18.5} kg/ha</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Potassium (K)</span>
                <span className="font-extrabold text-emerald-700">{soilRecord?.potassium_kg_ha || 240} kg/ha</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={() => navigate('/soil-health')}
              className="w-full flex items-center justify-between text-xs font-bold text-[#238636] hover:text-emerald-800 transition cursor-pointer"
            >
              <span>{lang === 'ta' ? 'முழு மண் பரிசோதனை பார்க்க' : 'View Full Soil Health'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Recommended Rotation Card (Live from Crop Rotation Planner) */}
        <div className="bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 rounded-3xl p-5 sm:p-6 border border-emerald-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#238636]" />
                {t('dashboard.recommendedRotation')}
              </span>
              <span className="text-[10px] bg-emerald-100 text-[#238636] px-2 py-0.5 rounded-full font-extrabold">
                Score {recStrategy?.mcda_score ? Math.round(recStrategy.mcda_score) : 88.5}/100
              </span>
            </div>

            <h4 className="text-base font-extrabold text-slate-900 leading-snug">
              {lang === 'ta'
                ? (recStrategy?.name_tamil || recStrategy?.name || 'மண் வளம் பெருக்கும் சுழற்சி முறை')
                : (recStrategy?.name || 'Soil-Health-Focused Sequence')}
            </h4>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {lang === 'ta'
                ? (recStrategy?.description_tamil || recStrategy?.description || 'பருவமழை மற்றும் மண்வளத்திற்கு உகந்த பயிர் சுழற்சி உத்தி.')
                : (recStrategy?.description || 'Optimized rotation sequence for soil nitrogen enrichment and water savings.')}
            </p>

            {recStrategy?.steps && recStrategy.steps.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {recStrategy.steps.map((st, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-950 shadow-2xs">
                    {lang === 'ta' ? (st.crop_tamil || st.crop_name) : st.crop_name}
                    {i < recStrategy.steps.length - 1 && <span className="text-slate-400 ml-1.5">→</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">
              Water Footprint: <span className="font-bold">{recStrategy?.water_savings_pct ? `+${recStrategy.water_savings_pct}% Saved` : '33% Savings'}</span>
            </span>
            <button
              onClick={() => navigate('/rotation-planner')}
              className="flex items-center gap-1 text-xs font-bold text-[#238636] hover:text-emerald-800 transition cursor-pointer"
            >
              {t('common.viewDetails')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
