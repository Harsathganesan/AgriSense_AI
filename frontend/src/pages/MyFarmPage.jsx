import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Sun,
  CloudRain,
  Droplets,
  Layers,
  RefreshCw,
  AlertTriangle,
  Compass,
  FileSpreadsheet,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { analysisApi } from '../services/api';

// Custom Map Marker Icon
const farmMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [0, -40],
  shadowSize: [41, 41]
});

// Helper to smoothly fly map to new coordinates
function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lon) {
      map.flyTo([coords.lat, coords.lon], 13, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

// Click listener to drop pin anywhere on map
function MapClickSetter({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function MyFarmPage() {
  const { lang } = useLanguage();

  // Pudukkottai default coordinates
  const DEFAULT_LAT = 10.3833;
  const DEFAULT_LON = 78.8000;

  const [inputLat, setInputLat] = useState('10.3833');
  const [inputLon, setInputLon] = useState('78.8000');
  const [activeCoords, setActiveCoords] = useState({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
  
  const [mapLayer, setMapLayer] = useState('standard'); // 'standard', 'satellite'
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');
  const [error, setError] = useState(null);

  // Fetch location-based NASA & Soil analysis
  const fetchAnalysis = async (lat, lon) => {
    try {
      setLoading(true);
      setError(null);
      const res = await analysisApi.getLocationBased(lat, lon);
      setAnalysisData(res.data);
    } catch (err) {
      console.error('Failed to load farm analysis:', err);
      setError(
        lang === 'ta'
          ? 'வானிலை மற்றும் மண் விவரங்களை ஏற்றுவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
          : 'Failed to retrieve NASA telemetry for this location. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load with Pudukkottai
  useEffect(() => {
    fetchAnalysis(DEFAULT_LAT, DEFAULT_LON);
  }, []);

  // Get Current GPS Location from Mobile / Device
  const handleGetCurrentLocation = () => {
    setError(null);
    setLocationSuccessMsg('');

    if (!navigator.geolocation) {
      setError(
        lang === 'ta'
          ? 'உங்கள் உலாவியில் GPS இருப்பிட வசதி இல்லை. கைமுறையாக அட்சரேகை/தீர்க்கரேகை உள்ளிடவும்.'
          : 'Geolocation is not supported by your browser. Please enter coordinates manually.'
      );
      return;
    }

    setDetectingLocation(true);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));

          setInputLat(lat.toString());
          setInputLon(lon.toString());
          setActiveCoords({ lat, lon });

          setLocationSuccessMsg(
            lang === 'ta'
              ? `உங்கள் தற்போதைய இருப்பிடம் பெறப்பட்டது: ${lat}°N, ${lon}°E`
              : `Current device location detected: ${lat}°N, ${lon}°E`
          );

          await fetchAnalysis(lat, lon);
        } catch (err) {
          console.error('Location processing error:', err);
        } finally {
          setDetectingLocation(false);
        }
      },
      (geoErr) => {
        setDetectingLocation(false);
        console.warn('Geolocation error:', geoErr);

        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError(
            lang === 'ta'
              ? 'இருப்பிட அனுமதி மறுக்கப்பட்டது! தயவுசெய்து உங்கள் மொபைலில் GPS Location-ஐ ஆன் செய்து, பிரவுசரில் அனுமதி (Allow) வழங்கவும்.'
              : 'Location permission denied! Please turn on device GPS and allow location access in your browser settings.'
          );
        } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
          setError(
            lang === 'ta'
              ? 'மொபைல் GPS சிக்னல் கிடைக்கவில்லை. உங்கள் மொபைலில் Location/GPS-ஐ இயக்கி மீண்டும் முயற்சிக்கவும்.'
              : 'GPS position unavailable. Please ensure location/GPS is enabled on your device.'
          );
        } else if (geoErr.code === geoErr.TIMEOUT) {
          setError(
            lang === 'ta'
              ? 'GPS தகவல் பெறுவதில் தாமதம் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
              : 'Location request timed out. Please try again.'
          );
        } else {
          setError(
            lang === 'ta'
              ? 'இருப்பிடத்தை கண்டறிய முடியவில்லை. தயவுசெய்து உங்கள் மொபைல் Location-ஐ ஆன் செய்யவும்.'
              : 'Could not retrieve your location. Please check device location settings.'
          );
        }
      },
      geoOptions
    );
  };

  // Handle manual coordinate search
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const lat = parseFloat(inputLat);
    const lon = parseFloat(inputLon);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError(lang === 'ta' ? 'சரியான அட்சரேகை (Latitude) உள்ளிடவும் (-90 to 90).' : 'Please enter a valid Latitude (-90 to 90).');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError(lang === 'ta' ? 'சரியான தீர்க்கரேகை (Longitude) உள்ளிடவும் (-180 to 180).' : 'Please enter a valid Longitude (-180 to 180).');
      return;
    }

    setActiveCoords({ lat, lon });
    fetchAnalysis(lat, lon);
  };

  // Handle click on Leaflet map
  const handleMapClick = (lat, lon) => {
    const formattedLat = Number(lat.toFixed(4));
    const formattedLon = Number(lon.toFixed(4));
    setInputLat(formattedLat.toString());
    setInputLon(formattedLon.toString());
    setActiveCoords({ lat: formattedLat, lon: formattedLon });
    fetchAnalysis(formattedLat, formattedLon);
  };

  const weather = analysisData?.nasa_weather_snapshot;
  const prediction = analysisData?.today_prediction || weather?.today_prediction;
  const rainfall = analysisData?.nasa_rainfall_snapshot;
  const soilProfile = analysisData?.soil_and_sand_profile;
  const loc = analysisData?.location_details;
  const sandComp = soilProfile?.sand_composition;
  const baselineLab = soilProfile?.baseline_lab_chemistry;
  const satMoisture = soilProfile?.satellite_moisture;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Active Location Pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-emerald-50 text-[#238636]">
            <MapPin className="w-6 h-6 stroke-[2.2]" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {lang === 'ta' ? 'என் பண்ணை (My Farm)' : 'My Farm'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              {lang === 'ta'
                ? 'புதுக்கோட்டை & பண்ணை இருப்பிடம், மண்-மணல் கட்டமைப்பு மற்றும் நாசா வானிலை ஆய்வு'
                : 'Pudukkottai farm coordinates, sand-soil composition & NASA weather telemetry'}
            </p>
          </div>
        </div>

        {/* Current Active Location Pill */}
        <div className="flex items-center gap-2.5 bg-emerald-50/70 border border-emerald-200/80 px-4 py-2.5 rounded-xl">
          <MapPin className="w-5 h-5 text-[#238636] shrink-0" />
          <div className="text-xs">
            <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">
              {lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட இடம்' : 'Active Farm Location'}
            </span>
            <span className="font-extrabold text-slate-900">
              {loc?.village || 'Pudukkottai'}, {loc?.district || 'Pudukkottai'}
            </span>
            <span className="text-slate-500 text-[11px] ml-1.5 font-mono">
              ({activeCoords.lat.toFixed(4)}°N, {activeCoords.lon.toFixed(4)}°E)
            </span>
          </div>
        </div>
      </div>

      {/* Coordinate Search Bar with "Your Location" GPS Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Latitude */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {lang === 'ta' ? 'அட்சரேகை (Latitude °N)' : 'Latitude (°N)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                placeholder="10.3833"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#238636]/40 focus:border-[#238636] transition-all"
              />
              <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Longitude */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {lang === 'ta' ? 'தீர்க்கரேகை (Longitude °E)' : 'Longitude (°E)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={inputLon}
                onChange={(e) => setInputLon(e.target.value)}
                placeholder="78.8000"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#238636]/40 focus:border-[#238636] transition-all"
              />
              <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Action Buttons: Your Location & Search */}
          <div className="grid grid-cols-2 md:contents gap-2.5">
            {/* Your Location GPS Button */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={detectingLocation || loading}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#238636] border border-emerald-300 font-extrabold py-2.5 px-3 rounded-xl text-xs sm:text-sm shadow-2xs transition-all duration-150 disabled:opacity-60 cursor-pointer active:scale-95 whitespace-nowrap"
                title={lang === 'ta' ? 'மொபைல் GPS மூலம் உங்கள் இருப்பிடத்தை கண்டறியவும்' : 'Detect your current GPS location'}
              >
                {detectingLocation ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#238636] shrink-0" />
                ) : (
                  <Navigation className="w-4 h-4 text-[#238636] fill-[#238636]/20 shrink-0" />
                )}
                <span>
                  {detectingLocation
                    ? (lang === 'ta' ? 'கண்டறிகிறது...' : 'Locating...')
                    : (lang === 'ta' ? 'உங்கள் இடம்' : 'Your Location')}
                </span>
              </button>
            </div>

            {/* Search Farm Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading || detectingLocation}
                className="w-full flex items-center justify-center gap-1.5 bg-[#238636] hover:bg-[#1f732f] text-white font-extrabold py-2.5 px-3 rounded-xl text-xs sm:text-sm shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Search className="w-4 h-4 stroke-[2.2] shrink-0" />
                )}
                <span>{lang === 'ta' ? 'தேடு' : 'Search Farm'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Location Success Notification */}
        {locationSuccessMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{locationSuccessMsg}</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Rectangular Interactive Farm Map (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Map Toolbar */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#238636] animate-pulse" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              {lang === 'ta' ? 'பண்ணை வரைபடம்' : 'Interactive Farm Plot Map'}
            </span>
          </div>
          <div>
            {/* Layer Switcher */}
            <button
              onClick={() => setMapLayer(mapLayer === 'standard' ? 'satellite' : 'standard')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{mapLayer === 'standard' ? (lang === 'ta' ? 'செயற்கைக்கோள் காட்சி' : 'Satellite View') : (lang === 'ta' ? 'சாலை வரைபடம்' : 'Street Map')}</span>
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative h-[440px] w-full">
          <MapContainer
            center={[activeCoords.lat, activeCoords.lon]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            {mapLayer === 'standard' ? (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            ) : (
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}

            {/* FlyTo and Click listener */}
            <FlyToLocation coords={activeCoords} />
            <MapClickSetter onMapClick={handleMapClick} />

            {/* Farm Marker */}
            <Marker position={[activeCoords.lat, activeCoords.lon]} icon={farmMarkerIcon}>
              <Popup>
                <div className="p-1 min-w-[210px] text-slate-800">
                  <p className="font-extrabold text-sm text-[#238636] flex items-center gap-1">
                    <MapPin className="w-4 h-4 inline" /> {loc?.village || 'Pudukkottai Farm'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {loc?.taluk}, {loc?.district}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'ta' ? 'வெப்பநிலை:' : 'Temperature:'}</span>
                      <span className="font-bold text-slate-800">{weather?.current_temp_c || 26.3}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'ta' ? 'மண் வகை:' : 'Soil Type:'}</span>
                      <span className="font-bold text-amber-700">{lang === 'ta' ? soilProfile?.primary_soil_tamil : soilProfile?.primary_soil}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'ta' ? 'மணல் விகிதம்:' : 'Sand %:'}</span>
                      <span className="font-bold text-slate-800">{sandComp?.sand_pct || 68}%</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Click to pin hint badge overlay */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-md text-slate-700 text-[11px] font-semibold flex items-center gap-1.5 pointer-events-none">
            <MapPin className="w-3.5 h-3.5 text-[#238636]" />
            <span>
              {lang === 'ta'
                ? 'வரைபடத்தில் எங்கு கிளிக் செய்தாலும் அந்த இடத்தின் மண் மற்றும் வானிலை விவரங்களை உடனடியாகப் பெறலாம்.'
                : 'Click anywhere on the map to inspect another plot and view live soil & weather.'}
            </span>
          </div>
        </div>
      </div>

      {/* Four Telemetry Snapshot Cards Placed Under the Map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live Temperature & Nowcast */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ta' ? 'தற்போதைய வெப்பநிலை' : 'Current Temperature'}
              </span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Sun className="w-5 h-5 stroke-[2.2]" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {prediction?.temp_mean ?? weather?.current_temp_c ?? 26.3}°C
              </span>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                {lang === 'ta' ? prediction?.condition_ta || 'பகுதி மேகமூட்டம்' : prediction?.condition_en || 'Partly Cloudy'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{lang === 'ta' ? 'அதிகபட்சம்' : 'Day Max'}</span>
                <span className="font-bold text-slate-800">{prediction?.temp_max ?? weather?.max_temp_c ?? 30.7}°C</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{lang === 'ta' ? 'குறைந்தபட்சம்' : 'Night Min'}</span>
                <span className="font-bold text-slate-800">{prediction?.temp_min ?? weather?.min_temp_c ?? 21.5}°C</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {lang === 'ta' ? weather?.temp_desc_ta : weather?.temp_desc_en}
          </div>
        </div>

        {/* Card 2: Sand & Soil Composition */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ta' ? 'மண் & மணல் வகை' : 'Soil & Sand Texture'}
              </span>
              <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <Layers className="w-5 h-5 stroke-[2.2]" />
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
              {lang === 'ta' ? soilProfile?.primary_soil_tamil || 'செம்மண் மற்றும் சரளை' : soilProfile?.primary_soil || 'Red Sandy Loam'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {lang === 'ta' ? sandComp?.classification_ta : sandComp?.classification_en}
            </p>
            
            {/* Mini Sand Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-amber-700">{lang === 'ta' ? 'மணல்' : 'Sand'}: {sandComp?.sand_pct || 68}%</span>
                <span className="text-slate-500">{lang === 'ta' ? 'வண்டல்' : 'Silt'}: {sandComp?.silt_pct || 18}%</span>
                <span className="text-emerald-700">{lang === 'ta' ? 'களிமண்' : 'Clay'}: {sandComp?.clay_pct || 14}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${sandComp?.sand_pct || 68}%` }} className="bg-amber-400" title="Sand %" />
                <div style={{ width: `${sandComp?.silt_pct || 18}%` }} className="bg-slate-400" title="Silt %" />
                <div style={{ width: `${sandComp?.clay_pct || 14}%` }} className="bg-emerald-500" title="Clay %" />
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {soilProfile?.soil_texture || 'Coarse to medium sandy loam with rapid drainage'}
          </div>
        </div>

        {/* Card 3: Rainfall & Humidity Telemetry */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ta' ? 'மழை & ஈரப்பதம்' : 'Rainfall & Humidity'}
              </span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CloudRain className="w-5 h-5 stroke-[2.2]" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {rainfall?.recent_30d_mm ?? 18.2} <span className="text-sm font-bold text-slate-500">mm</span>
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                30-{lang === 'ta' ? 'நாள் மழை' : 'Day Total'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{lang === 'ta' ? 'ஈரப்பதம்' : 'Humidity'}</span>
                <span className="font-bold text-slate-800">{prediction?.relative_humidity_pct ?? weather?.relative_humidity_pct ?? 81}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{lang === 'ta' ? 'மழை வாய்ப்பு' : 'Rain Prob.'}</span>
                <span className="font-bold text-blue-700">{prediction?.rain_probability_pct ?? 15}%</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {lang === 'ta' ? 'வறண்ட நாட்கள்: ' : 'Consecutive Dry Days: '} 
            <span className="font-bold text-slate-800">{rainfall?.consecutive_dry_days ?? 4} {lang === 'ta' ? 'நாட்கள்' : 'days'}</span>
          </div>
        </div>

        {/* Card 4: Satellite Soil Moisture & Agro Zone */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ta' ? 'நாசா மண் ஈரப்பதம்' : 'NASA SMAP Moisture'}
              </span>
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Droplets className="w-5 h-5 stroke-[2.2]" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {satMoisture?.rootzone_0_100cm_pct ?? 25.7}%
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                {lang === 'ta' ? satMoisture?.status_tamil || 'போதுமானது' : satMoisture?.status || 'Adequate'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{lang === 'ta' ? 'மேற்பரப்பு (0-5cm)' : 'Surface (0-5cm)'}</span>
                <span className="font-bold text-slate-800">{satMoisture?.surface_0_5cm_pct ?? 19.9}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{lang === 'ta' ? 'இயல்பு மழை' : 'Normal Rain'}</span>
                <span className="font-bold text-slate-800">{soilProfile?.annual_rainfall_normal_mm ?? 820} mm</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 truncate">
            {lang === 'ta' ? soilProfile?.agro_climatic_zone_tamil : soilProfile?.agro_climatic_zone}
          </div>
        </div>
      </div>

      {/* Comprehensive Sand & Soil Intelligence Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              {lang === 'ta' ? 'மண் & மணல் பண்புகள் பகுப்பாய்வு' : 'Comprehensive Soil & Sand Analysis'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'ta'
                ? 'வட்டார மண் பரிசோதனை கூடம் (TNAU Vamban, Pudukkottai) மற்றும் நாசா SMAP செயற்கைக்கோள் தரவு'
                : 'Laboratory Soil Benchmark (TNAU Vamban, Pudukkottai) & NASA SMAP Satellite Moisture'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {lang === 'ta' ? soilProfile?.primary_soil_tamil : soilProfile?.primary_soil}
          </span>
        </div>

        {/* Detailed Sand / Silt / Clay Composition Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sand % */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                {lang === 'ta' ? 'மணல் விகிதம் (Sand)' : 'Sand Proportion'}
              </span>
              <span className="text-2xl font-black text-amber-700">{sandComp?.sand_pct ?? 68}%</span>
            </div>
            <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden mb-2">
              <div style={{ width: `${sandComp?.sand_pct ?? 68}%` }} className="bg-amber-500 h-full rounded-full" />
            </div>
            <p className="text-[11px] text-amber-800 font-medium">
              {lang === 'ta'
                ? 'அதிக மணல் கலந்த செம்மண் என்பதால் நீர் வடிதல் மிக விரைவாக நடக்கும். வேரழுகல் அபாயம் குறைவு.'
                : 'Coarse sandy loam ensures rapid aeration and excellent internal drainage, preventing waterlogging.'}
            </p>
          </div>

          {/* Silt % */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {lang === 'ta' ? 'வண்டல் விகிதம் (Silt)' : 'Silt Proportion'}
              </span>
              <span className="text-2xl font-black text-slate-700">{sandComp?.silt_pct ?? 18}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
              <div style={{ width: `${sandComp?.silt_pct ?? 18}%` }} className="bg-slate-500 h-full rounded-full" />
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              {lang === 'ta'
                ? 'நடுத்தர வண்டல் சத்து நுண்ணூட்டச் சத்துக்களை தக்கவைக்க உதவுகிறது.'
                : 'Provides intermediate nutrient retention and smooth loam texture for pulse crops.'}
            </p>
          </div>

          {/* Clay % */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                {lang === 'ta' ? 'களிமண் விகிதம் (Clay)' : 'Clay Proportion'}
              </span>
              <span className="text-2xl font-black text-[#238636]">{sandComp?.clay_pct ?? 14}%</span>
            </div>
            <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden mb-2">
              <div style={{ width: `${sandComp?.clay_pct ?? 14}%` }} className="bg-[#238636] h-full rounded-full" />
            </div>
            <p className="text-[11px] text-emerald-800 font-medium">
              {lang === 'ta'
                ? 'குறைந்த களிமண் என்பதால் நிலம் இறுகாது; நிலக்கடலை காய் வளர்ச்சிக்கு மிகவும் உகந்தது.'
                : 'Low clay content avoids hardpan formation, ideal for subterranean pod development in groundnut.'}
            </p>
          </div>
        </div>

        {/* Certified Soil Chemistry Baseline (ICAR / TNAU Vamban Lab Standard) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#238636]" />
              {lang === 'ta' ? 'மண் வேதியியல் பரிசோதனை அளவுகள் (TNAU Vamban, Pudukkottai)' : 'Certified Soil Nutrient Chemistry (TNAU Vamban, Pudukkottai)'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {baselineLab?.lab_name || 'TNAU Regional Research Station, Vamban, Pudukkottai'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* pH */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Soil pH</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{baselineLab?.ph ?? 6.4}</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {lang === 'ta' ? 'நடுநிலை / சற்று அமிலம்' : 'Slightly Acidic'}
              </span>
            </div>

            {/* Nitrogen */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nitrogen (N)</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{baselineLab?.nitrogen_kg_ha ?? 185}</span>
              <span className="text-[10px] text-slate-500 font-semibold">kg/ha ({lang === 'ta' ? 'குறைவு' : 'Low'})</span>
            </div>

            {/* Phosphorus */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phosphorus (P)</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{baselineLab?.phosphorus_kg_ha ?? 12}</span>
              <span className="text-[10px] text-slate-500 font-semibold">kg/ha ({lang === 'ta' ? 'நடுத்தரம்' : 'Medium'})</span>
            </div>

            {/* Potassium */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Potassium (K)</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{baselineLab?.potassium_kg_ha ?? 175}</span>
              <span className="text-[10px] text-slate-500 font-semibold">kg/ha ({lang === 'ta' ? 'நடுத்தரம்' : 'Medium'})</span>
            </div>

            {/* Organic Carbon */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Organic Carbon</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{baselineLab?.organic_carbon_pct ?? 0.38}%</span>
              <span className="text-[10px] text-amber-600 font-semibold">({lang === 'ta' ? 'உயிர்ப்பொருள் தேவை' : 'Needs FYM'})</span>
            </div>

            {/* Electrical Conductivity */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">EC (Salinity)</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{baselineLab?.electrical_conductivity ?? 0.28}</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                dS/m ({lang === 'ta' ? 'உப்பில்லா நன்னீர்' : 'Non-Saline'})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
