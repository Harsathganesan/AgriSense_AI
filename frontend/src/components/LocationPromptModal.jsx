import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Satellite,
  ChevronRight,
  ShieldCheck,
  Building,
  Tractor
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { locationApi } from '../services/api';

const TN_DISTRICT_PRESETS = [
  { name: 'Thanjavur (தஞ்சாவூர்)', district: 'Thanjavur', village: 'Kallaperambur', lat: 10.7870, lon: 79.1378 },
  { name: 'Tiruvarur (திருவாரூர்)', district: 'Tiruvarur', village: 'Needamangalam', lat: 10.7719, lon: 79.6358 },
  { name: 'Tiruchirappalli (திருச்சி)', district: 'Tiruchirappalli', village: 'Lalgudi', lat: 10.8700, lon: 78.8100 },
  { name: 'Coimbatore (கோயம்புத்தூர்)', district: 'Coimbatore', village: 'Sulur', lat: 11.0250, lon: 77.1250 },
  { name: 'Madurai (மதுரை)', district: 'Madurai', village: 'Melur', lat: 10.0200, lon: 78.3300 },
  { name: 'Salem (சேலம்)', district: 'Salem', village: 'Omalur', lat: 11.7400, lon: 78.0400 }
];

export default function LocationPromptModal({ isOpen, onClose, onLocationDetected, initialCoords, autoTrigger = false }) {
  const { t, lang } = useLanguage();

  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [manualMode, setManualMode] = useState(false);

  // Manual inputs
  const [manualLat, setManualLat] = useState(initialCoords?.latitude?.toString() || '10.7870');
  const [manualLon, setManualLon] = useState(initialCoords?.longitude?.toString() || '79.1378');
  const [manualVillage, setManualVillage] = useState('');
  const [manualDistrict, setManualDistrict] = useState('Thanjavur');
  const [manualSaving, setManualSaving] = useState(false);

  // Automatically request browser GPS permission if autoTrigger is enabled
  React.useEffect(() => {
    if (isOpen && autoTrigger && !detecting && !successData && !manualMode) {
      handleAutomaticLocation();
    }
  }, [isOpen, autoTrigger]);

  if (!isOpen) return null;

  const handleAutomaticLocation = () => {
    setErrorMsg('');
    setDetecting(true);

    if (!navigator.geolocation) {
      setErrorMsg(
        lang === 'ta'
          ? "உங்கள் பிரவுசரில் GPS இருப்பிட வசதி இல்லை. கைமுறையாக உள்ளிடவும்."
          : "Geolocation is not supported by your browser. Please enter location manually."
      );
      setDetecting(false);
      setManualMode(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;

          // 1. Reverse Geocode via backend Nominatim proxy
          const geoRes = await locationApi.reverseGeocode(lat, lon);
          const geoData = geoRes.data || {};

          // 2. Save location to backend linked with farmer
          const savePayload = {
            latitude: lat,
            longitude: lon,
            accuracy_meters: accuracy,
            village: geoData.village,
            taluk: geoData.taluk,
            district: geoData.district,
            state: geoData.state || 'Tamil Nadu',
            country: geoData.country || 'India',
            postcode: geoData.postcode,
            display_name: geoData.display_name,
            source: 'gps_browser'
          };

          const savedRes = await locationApi.save(savePayload);
          setSuccessData(savedRes.data);
          localStorage.setItem('agrisense_gps_configured', 'true');

          setTimeout(() => {
            if (onLocationDetected) onLocationDetected(savedRes.data);
            setDetecting(false);
            onClose();
          }, 1200);
        } catch (err) {
          console.error("Location geocoding/saving error:", err);
          setErrorMsg(
            lang === 'ta'
              ? "இருப்பிடத்தை சேமிப்பதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும் அல்லது கைமுறையாக தேர்ந்தெடுக்கவும்."
              : "Failed to reverse geocode and save location. Please retry or pick location below."
          );
          setDetecting(false);
        }
      },
      (err) => {
        console.warn("Geolocation error code:", err.code, err.message);
        setDetecting(false);
        if (err.code === 1) {
          setErrorMsg(
            lang === 'ta'
              ? "இருப்பிட அனுமதி மறுக்கப்பட்டது (Permission Denied). தயவுசெய்து பிரவுசரில் அனுமதியை வழங்கவும் அல்லது கைமுறையாக தேர்ந்தெடுக்கவும்."
              : "Location permission denied. Please allow location in your browser address bar or enter manually."
          );
        } else if (err.code === 2) {
          setErrorMsg(
            lang === 'ta'
              ? "GPS சமிக்ஞை கிடைக்கவில்லை. தயவுசெய்து கீழே உள்ள மாவட்டத்தைத் தேர்ந்தெடுக்கவும்."
              : "GPS position unavailable. Please choose your district preset or enter coordinates manually."
          );
        } else if (err.code === 3) {
          setErrorMsg(
            lang === 'ta'
              ? "GPS சமிக்ஞை பெறுவதில் நேரம் கடந்துவிட்டது. மீண்டும் முயற்சிக்கவும்."
              : "GPS detection timed out. Please retry or select location manually."
          );
        } else {
          setErrorMsg(err.message || "Failed to detect GPS location.");
        }
        setManualMode(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    try {
      setManualSaving(true);
      setErrorMsg('');

      const lat = parseFloat(manualLat);
      const lon = parseFloat(manualLon);

      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setErrorMsg("Please enter valid decimal coordinates (e.g. 10.7870°N, 79.1378°E).");
        setManualSaving(false);
        return;
      }

      // Reverse geocode
      const geoRes = await locationApi.reverseGeocode(lat, lon);
      const geoData = geoRes.data || {};

      const savePayload = {
        latitude: lat,
        longitude: lon,
        accuracy_meters: 25.0,
        village: manualVillage || geoData.village,
        taluk: geoData.taluk,
        district: manualDistrict || geoData.district,
        state: geoData.state || 'Tamil Nadu',
        country: 'India',
        postcode: geoData.postcode,
        display_name: `${manualVillage || geoData.village}, ${manualDistrict || geoData.district}, Tamil Nadu`,
        source: 'manual'
      };

      const savedRes = await locationApi.save(savePayload);
      localStorage.setItem('agrisense_gps_configured', 'true');
      setSuccessData(savedRes.data);

      setTimeout(() => {
        if (onLocationDetected) onLocationDetected(savedRes.data);
        setManualSaving(false);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg("Error saving manual coordinates: " + (err.response?.data?.detail || err.message));
      setManualSaving(false);
    }
  };

  const handleSelectPreset = (p) => {
    setManualLat(p.lat.toString());
    setManualLon(p.lon.toString());
    setManualDistrict(p.district);
    setManualVillage(p.village);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#238636] to-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
            <Navigation className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-1 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {lang === 'ta' ? 'தானியங்கி இருப்பிட பகுப்பாய்வு' : 'Automatic GPS Farm Analysis'}
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {lang === 'ta' ? 'பண்ணை இருப்பிட அனுமதி' : 'Farm Location Detection'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {lang === 'ta'
                ? 'உங்கள் பண்ணையை ஆய்வு செய்து துல்லியமான விவசாய ஆலோசனைகளை வழங்க இருப்பிட அனுமதியை வழங்கவும்.'
                : 'Allow location access to analyze your farm and provide accurate agricultural recommendations.'}
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">{lang === 'ta' ? 'கவனிக்க:' : 'Notice:'}</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Success Confirmation */}
        {successData && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-6 h-6 text-[#238636] shrink-0" />
            <div>
              <span className="font-extrabold block text-sm">
                {lang === 'ta' ? 'இருப்பிடம் வெற்றிகரமாக இணைக்கப்பட்டது!' : 'Location Detected & Synced!'}
              </span>
              <span className="text-[11px] text-emerald-700">
                {successData.village || successData.district}, {successData.state} ({successData.latitude.toFixed(4)}°N, {successData.longitude.toFixed(4)}°E)
              </span>
            </div>
          </div>
        )}

        {/* Detection Active State */}
        {detecting ? (
          <div className="p-8 rounded-2xl bg-slate-900 text-white text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                <Satellite className="w-7 h-7 text-emerald-300 animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {lang === 'ta' ? 'GPS சிக்னலை பெறுகிறது...' : 'Detecting GPS Satellites...'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === 'ta'
                  ? 'துல்லியமான அட்சரேகை/தீர்க்கரேகை மற்றும் நாசா தரவுகளை ஒருங்கிணைக்கிறது.'
                  : 'Acquiring high-accuracy coordinates and reverse geocoding your village.'}
              </p>
            </div>
          </div>
        ) : !manualMode ? (
          /* Normal Option Buttons: Allow vs Manual */
          <div className="space-y-3">
            <button
              onClick={handleAutomaticLocation}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#238636] hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Navigation className="w-4 h-4" />
              {lang === 'ta' ? 'இருப்பிடத்தை அனுமதிக்கவும் (Allow Location)' : 'Allow Location Access'}
            </button>

            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {lang === 'ta' ? 'இருப்பிடத்தை கைமுறையாக உள்ளிடுக (Enter Manually)' : 'Enter Location Manually'}
            </button>
          </div>
        ) : (
          /* Manual Location Entry Form */
          <form onSubmit={handleManualSave} className="space-y-4">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#238636]" />
                {lang === 'ta' ? 'கைமுறை இருப்பிட உள்ளீடு' : 'Manual Location Coordinates'}
              </span>
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-[11px] font-bold text-[#238636] hover:underline"
              >
                {lang === 'ta' ? '← GPS தானியங்கி' : '← Try GPS Again'}
              </button>
            </div>

            {/* Quick Regional Presets */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                {lang === 'ta' ? 'வேகமான தேர்வு (தமிழ்நாடு பகுதிகள்):' : 'Quick Regional Presets (Tamil Nadu):'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {TN_DISTRICT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-2 text-left rounded-xl border border-slate-200 hover:border-[#238636] hover:bg-emerald-50/50 transition text-[11px]"
                  >
                    <span className="font-bold block text-slate-800 truncate">{p.district}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{p.lat}°N, {p.lon}°E</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ta' ? 'கிராமம் / பகுதி' : 'Village / Area Name'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kallaperambur"
                  value={manualVillage}
                  onChange={(e) => setManualVillage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ta' ? 'மாவட்டம்' : 'District'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thanjavur"
                  value={manualDistrict}
                  onChange={(e) => setManualDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={manualSaving}
                className="px-5 py-2 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {manualSaving ? "Saving..." : (lang === 'ta' ? 'சேமித்து பகுப்பாய்வு செய்க' : 'Save & Analyze')}
              </button>
            </div>
          </form>
        )}

        {/* Privacy Note */}
        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {lang === 'ta' ? 'GPS தரவுகள் பாதுகாப்புடன் சேமிக்கப்படும்' : 'GPS data is private & encrypted'}
          </span>
          <span>NASA POWER & GPM Integration</span>
        </div>
      </div>
    </div>
  );
}

