import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Search,
  Building,
  Droplets,
  Calendar,
  CalendarCheck2,
  Sparkles,
  Award,
  MapPin,
  ChevronDown,
  CheckCircle2,
  X,
  Layers,
  Thermometer,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';
import { districtApi, authApi } from '../services/api';
import { getDistricts } from '../data/locationHierarchy';

const SOIL_OPTIONS = [
  { id: 'Red Sandy Loam', en: 'Red Sandy Loam', ta: 'செம்மண் மற்றும் சரளை மண்' },
  { id: 'Alluvial Soil', en: 'Alluvial Soil (Delta / River)', ta: 'வண்டல் மண்' },
  { id: 'Black Cotton Soil', en: 'Black Cotton Soil (Clayey)', ta: 'கரிசல் மண்' },
  { id: 'Clay Loam', en: 'Clay Loam Soil', ta: 'களிமண் கலந்த வண்டல்' },
  { id: 'Laterite Soil', en: 'Laterite Soil', ta: 'செம்பொறை மண்' },
  { id: 'Sandy Coastal Soil', en: 'Sandy Coastal Soil', ta: 'மணல் பாங்கான மண்' },
];

export default function CropExplorerPage() {
  const { t, lang } = useLanguage();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const state = user?.registered_location?.state || user?.state || 'Tamil Nadu';
  const country = user?.registered_location?.country || user?.country || 'India';
  const initialDistrict = user?.registered_location?.district || user?.district || 'Pudukkottai';

  const { activeFarm } = useFarm();
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [cropList, setCropList] = useState([]);
  const [districtSoilInfo, setDistrictSoilInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switchingDistrict, setSwitchingDistrict] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCropItem, setSelectedCropItem] = useState(null);

  // Cultivation Plan Setup Modal State
  const [confirmingCropItem, setConfirmingCropItem] = useState(null);
  const [acresInput, setAcresInput] = useState(2.0);
  const [soilTypeInput, setSoilTypeInput] = useState('Red Sandy Loam');
  const [trackedCropsList, setTrackedCropsList] = useState(() => {
    try {
      const savedList = localStorage.getItem('agrisense_tracked_crops_list');
      if (savedList) return JSON.parse(savedList);
      const savedSingle = localStorage.getItem('agrisense_tracked_crop');
      return savedSingle ? [JSON.parse(savedSingle)] : [];
    } catch (e) {
      return [];
    }
  });

  const availableDistricts = getDistricts(country, state);

  // Sync tracked crops from localStorage and events
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const savedList = localStorage.getItem('agrisense_tracked_crops_list');
        if (savedList) {
          setTrackedCropsList(JSON.parse(savedList));
          return;
        }
        const savedSingle = localStorage.getItem('agrisense_tracked_crop');
        setTrackedCropsList(savedSingle ? [JSON.parse(savedSingle)] : []);
      } catch (e) {
        setTrackedCropsList([]);
      }
    };
    window.addEventListener('agrisense_tracked_crop_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('agrisense_tracked_crop_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Open Track Plan Setup modal to specify acres and soil type before proceeding
  const handleOpenTrackConfirm = (item) => {
    setConfirmingCropItem(item);
    const defaultAcres = activeFarm?.area_acres || 2.0;
    setAcresInput(defaultAcres);
    const defaultSoil = activeFarm?.soil_type || districtSoilInfo?.primary_soil || 'Red Sandy Loam';
    setSoilTypeInput(defaultSoil);
  };

  // Confirm and proceed to Agri Tracker
  const handleConfirmTrackPlan = () => {
    if (!confirmingCropItem) return;
    const numAcres = parseFloat(acresInput) > 0 ? parseFloat(acresInput) : 1.0;

    const data = {
      crop: confirmingCropItem.crop,
      suitability_score: confirmingCropItem.suitability_score,
      district: selectedDistrict,
      area_acres: numAcres,
      soil_type: soilTypeInput,
      tracked_at: new Date().toISOString()
    };

    try {
      localStorage.setItem('agrisense_tracked_crop', JSON.stringify(data));

      let list = [];
      try {
        const storedList = localStorage.getItem('agrisense_tracked_crops_list');
        if (storedList) list = JSON.parse(storedList);
      } catch (e) {}

      const idx = list.findIndex(
        (c) =>
          (c.crop?.id && String(c.crop.id) === String(confirmingCropItem.crop.id)) ||
          (c.crop?.name && c.crop.name.toLowerCase() === confirmingCropItem.crop.name.toLowerCase())
      );
      if (idx >= 0) {
        list[idx] = data;
      } else {
        list.push(data);
      }
      localStorage.setItem('agrisense_tracked_crops_list', JSON.stringify(list));
      setTrackedCropsList(list);

      window.dispatchEvent(new Event('agrisense_tracked_crop_updated'));
    } catch (e) {
      console.warn('Tracked crop load error:', e);
    }

    setConfirmingCropItem(null);
    setSelectedCropItem(null);
    navigate('/agri-tracker');
  };

  const categories = [
    { id: 'All', en: 'All Crops', ta: 'அனைத்துப் பயிர்கள்' },
    { id: 'Cereal', en: 'Cereal', ta: 'தானியங்கள் (நெல்/சோளம்)' },
    { id: 'Pulse', en: 'Pulses', ta: 'பயறு வகைகள் (உளுந்து/பாசிப்பயறு)' },
    { id: 'Oilseed', en: 'Oilseeds', ta: 'எண்ணெய் வித்துக்கள் (கடலை/எள்)' },
    { id: 'Millet', en: 'Millets', ta: 'சிறுதானியங்கள் (கம்பு/ராகி)' },
    { id: 'Cash Crop', en: 'Cash Crops', ta: 'பணப்பயிர்கள் (கரும்பு/பருத்தி)' }
  ];

  // Sync if district changes in Header or AuthContext
  useEffect(() => {
    const userDist = user?.registered_location?.district || user?.district;
    if (userDist && userDist !== selectedDistrict) {
      setSelectedDistrict(userDist);
    }
  }, [user]);

  // Fetch both Crops and Soil Health for the selected district
  const fetchData = async (dist) => {
    const targetDistrict = dist || selectedDistrict;
    try {
      setLoading(true);

      // 1. Fetch district crops suitability
      const cropsRes = await districtApi.getCrops(targetDistrict, selectedCategory, '', state, country);
      if (cropsRes.data) {
        setCropList(cropsRes.data.crops || []);
      }

      // 2. Fetch district soil health analysis
      const soilRes = await districtApi.getSoilHealth(targetDistrict, state, country);
      if (soilRes.data) {
        setDistrictSoilInfo(soilRes.data);
      }
    } catch (err) {
      console.error('Failed to load district crops and soil analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDistrict);
  }, [selectedDistrict, selectedCategory]);

  // Handle changing district directly from this page
  const handleDistrictChange = async (newDistrict) => {
    if (!newDistrict || newDistrict === selectedDistrict) return;

    setSelectedDistrict(newDistrict);
    setSwitchingDistrict(true);

    try {
      // Sync across platform
      if (user) {
        const res = await authApi.updateProfile({
          district: newDistrict,
          state: state,
          country: country,
          registered_location: {
            country: country,
            state: state,
            district: newDistrict
          }
        });
        if (res.data) {
          setUser(res.data);
        }
      }
    } catch (err) {
      console.warn('Profile sync optional warning:', err);
    } finally {
      setSwitchingDistrict(false);
    }
  };

  // Filter crops by search query (name in English or Tamil or botanical)
  const filteredCrops = cropList.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const c = item.crop;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.tamil_name && c.tamil_name.toLowerCase().includes(q)) ||
      (c.botanical_name && c.botanical_name.toLowerCase().includes(q))
    );
  });

  const soilMetrics = districtSoilInfo?.satellite_environmental_indicators || {};
  const labMetrics = districtSoilInfo?.laboratory_soil_test || {};

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* 1. Header & District Selection Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-[#238636] text-[11px] sm:text-xs font-bold border border-emerald-200 mb-1.5 sm:mb-2">
              <Building className="w-3.5 h-3.5" />
              <span>{selectedDistrict} District • {lang === 'ta' ? 'பயிர் பரிந்துரை' : 'Crop Suitability Matrix'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-[#238636]" />
              {lang === 'ta' ? 'பயிர் வழிகாட்டி' : 'Crop Explorer'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium">
              {lang === 'ta'
                ? `${selectedDistrict} மாவட்டத்திற்கான உகந்த பயிர் பரிந்துரைகள்`
                : `Optimal crop recommendations for ${selectedDistrict} district`}
            </p>
          </div>

          {/* District Selector Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto md:min-w-[200px]">
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={loading || switchingDistrict}
                  className="w-full appearance-none pl-9 pr-9 py-2 bg-slate-50 hover:bg-emerald-50/50 border border-slate-300 hover:border-emerald-400 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#238636]/40 focus:border-[#238636] transition cursor-pointer disabled:opacity-60"
                >
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-[#238636] absolute left-3 top-2.5 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Soil Health Analysis Summary Strip for Selected District */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white p-3.5 sm:p-5 rounded-2xl border border-emerald-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#238636] text-white shrink-0">
              <Layers className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 block leading-tight truncate">
                {lang === 'ta'
                  ? `${selectedDistrict} மாவட்ட மண் வளம் & காலநிலைப் பகுப்பாய்வு:`
                  : `${selectedDistrict} Soil Health & Environmental Analysis:`}
              </span>
              <span className="text-[11px] text-slate-600 font-medium truncate block">
                {lang === 'ta' ? districtSoilInfo?.primary_soil_type_tamil : districtSoilInfo?.primary_soil_type} • {districtSoilInfo?.soil_texture}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-white text-emerald-800 border border-emerald-300 w-fit shrink-0">
            {lang === 'ta' ? 'பரிந்துரைக்கப்படும் பயிர்கள்' : `${filteredCrops.length} Crops Evaluated`}
          </span>
        </div>

        {/* 4 Quick Soil Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Soil Moisture */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              {lang === 'ta' ? 'மண் ஈரப்பதம்' : 'Root-Zone Moisture'}
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {soilMetrics.rootzone_moisture_0_100cm_pct ?? 25.7}%
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">
              {soilMetrics.rootzone_moisture_0_100cm_pct >= 20 ? (lang === 'ta' ? 'போதுமானது' : 'Adequate') : (lang === 'ta' ? 'குறைவு' : 'Deficit')}
            </span>
          </div>

          {/* Soil Temperature */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              {lang === 'ta' ? 'மண் வெப்பநிலை' : 'Soil Temperature'}
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {soilMetrics.soil_temperature_c ?? 28.4}°C
            </span>
            <span className="text-[10px] font-semibold text-slate-600">
              {lang === 'ta' ? 'உயிரியல் சுறுசுறுப்பு' : 'Optimal Biology'}
            </span>
          </div>

          {/* Soil pH */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'ta' ? 'மண் கார அமிலத்தன்மை' : 'Soil pH Level'}
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              pH {labMetrics.ph ?? 6.4}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">
              {labMetrics.ph < 6.5 ? (lang === 'ta' ? 'சற்று அமிலம்' : 'Slightly Acidic') : (lang === 'ta' ? 'நடுநிலை' : 'Neutral')}
            </span>
          </div>

          {/* Available Nitrogen & Carbon */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#238636]" />
              {lang === 'ta' ? 'நைட்ரஜன் & கரியமிலம்' : 'Nitrogen & OC'}
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {labMetrics.nitrogen_kg_ha ?? 185} <span className="text-xs font-normal text-slate-400">kg/ha</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-600">
              OC: {labMetrics.organic_carbon_pct ?? 0.38}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Category Filter Pills */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 sm:space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              lang === 'ta'
                ? 'பயிரின் பெயரை தமிழில் அல்லது ஆங்கிலத்தில் தேடவும் (எ.கா. நிலக்கடலை, எள், நெல்)...'
                : 'Search crop in English or Tamil (e.g. Groundnut, Sesame, Rice, Maize)...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#238636]/40 focus:border-[#238636] transition"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#238636] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {lang === 'ta' ? cat.ta : cat.en}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Simple, Farmer-Friendly Crop Cards Grid */}
      {loading ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-7 h-7 text-[#238636] animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">
            {lang === 'ta' ? `${selectedDistrict} மாவட்ட பயிர் பொருத்தங்கள் கணக்கிடப்படுகின்றன...` : `Analyzing soil & crop suitability for ${selectedDistrict}...`}
          </p>
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Sprout className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">
            {lang === 'ta' ? 'பயிர்கள் எதுவும் கிடைக்கவில்லை' : 'No matching crops found'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ta' ? 'தேடல் சொல்லை மாற்றி முயற்சிக்கவும் அல்லது வேறு வகையைத் தேர்ந்தெடுக்கவும்.' : 'Try adjusting your search query or selecting "All Crops".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          {filteredCrops.map((item) => {
            const crop = item.crop;
            const score = item.suitability_score;
            const isHighlySuitable = score >= 85;
            const isModerate = score >= 70 && score < 85;

            return (
              <div
                key={crop.id}
                onClick={() => setSelectedCropItem(item)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Crop Image */}
                  <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={crop.image_url}
                      alt={crop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=600&q=80';
                      }}
                    />

                    {/* Category Badge */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                        {crop.category}
                      </span>
                      {crop.is_nitrogen_fixing && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#238636] text-white shadow-xs">
                          {lang === 'ta' ? '+மண்வளம்' : '+N Fixer'}
                        </span>
                      )}
                    </div>

                    {/* Suitability Score Pill */}
                    <div className="absolute top-2.5 right-2.5">
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1 backdrop-blur-md ${
                          isHighlySuitable
                            ? 'bg-[#238636] text-white'
                            : isModerate
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <span>{score}%</span>
                        <span className="text-[9px] font-semibold opacity-90">
                          {lang === 'ta' ? 'பொருத்தம்' : 'Fit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5">
                    {/* Crop Name */}
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#238636] transition leading-tight">
                        {crop.tamil_name || crop.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {crop.name}
                      </p>
                    </div>

                    {/* Suitability Status Badge */}
                    <div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md inline-block ${
                          isHighlySuitable
                            ? 'bg-emerald-50 text-[#238636] border border-emerald-200'
                            : isModerate
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {lang === 'ta' ? item.suitability_label_tamil : item.suitability_label} ({selectedDistrict})
                      </span>
                    </div>

                    {/* Why this crop fits this soil (Simple Farmer Advice) */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-medium">
                      {lang === 'ta'
                        ? item.seasonal_recommendations?.advice_ta
                        : item.seasonal_recommendations?.advice_en}
                    </div>

                    {/* 3 Simple Metrics: Duration, Water, Season */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{crop.duration_days_avg} {lang === 'ta' ? 'நாட்கள்' : 'Days'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="font-semibold">{crop.water_req_mm} mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Actions */}
                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  {(() => {
                    const isTracked = trackedCropsList.some(
                      (c) =>
                        (c.crop?.id && String(c.crop.id) === String(crop.id)) ||
                        (c.crop?.name && c.crop.name.toLowerCase() === crop.name.toLowerCase())
                    );

                    return isTracked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/agri-tracker');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title={lang === 'ta' ? 'Agri Tracker-ல் பார்க்க' : 'View in Agri Tracker'}
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>{lang === 'ta' ? 'செயலில் உள்ளது ⏳' : 'On Process ⏳'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTrackConfirm(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#238636] text-[#238636] hover:text-white border border-emerald-300 font-extrabold text-[11px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ta' ? 'சாகுபடி திட்டம் 🚀' : 'Track Plan 🚀'}</span>
                      </button>
                    );
                  })()}
                  <span className="text-[11px] font-bold text-[#238636] group-hover:translate-x-1 transition-transform">
                    {lang === 'ta' ? 'விவரம் →' : 'Details →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Detailed Crop & Sowing Guidelines Modal */}
      {selectedCropItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-3 sm:space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 sm:pb-3">
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedCropItem.crop.botanical_name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {selectedCropItem.suitability_score}% {lang === 'ta' ? 'பொருத்தம்' : 'Fit'} in {selectedDistrict}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {selectedCropItem.crop.tamil_name || selectedCropItem.crop.name}
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedCropItem.crop.name} • {selectedCropItem.crop.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedCropItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
                title={lang === 'ta' ? 'மூடு' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* District Soil & Climate Advice */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs">
              <h4 className="font-extrabold text-emerald-950 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#238636]" />
                {selectedDistrict} {lang === 'ta' ? 'மண் மற்றும் பயிர் வழிகாட்டல்:' : 'Agronomic Sowing Advice:'}
              </h4>
              <p className="text-emerald-900 leading-relaxed font-medium">
                {lang === 'ta'
                  ? selectedCropItem.seasonal_recommendations?.advice_ta
                  : selectedCropItem.seasonal_recommendations?.advice_en}
              </p>
            </div>

            {/* Quick Farming Facts Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'பயிர் காலம்' : 'Growth Duration'}</span>
                <span className="font-extrabold text-slate-800">{selectedCropItem.crop.duration_days_min} - {selectedCropItem.crop.duration_days_max} {lang === 'ta' ? 'நாட்கள்' : 'days'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'நீர் தேவை' : 'Water Requirement'}</span>
                <span className="font-extrabold text-sky-700">{selectedCropItem.crop.water_req_mm} mm</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'ஏற்ற பருவம்' : 'Best Sowing Season'}</span>
                <span className="font-extrabold text-slate-800">{selectedCropItem.seasonal_recommendations?.best_planting_season}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'ஏற்ற மண் வகை' : 'Suitable Soil Match'}</span>
                <span className="font-extrabold text-amber-800">{districtSoilInfo?.primary_soil_type_tamil || districtSoilInfo?.primary_soil_type}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedCropItem.crop.description}
            </p>

            {/* Soil Health Benefit / Nitrogen Fixation */}
            {selectedCropItem.crop.nutrient_benefits && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1">
                  {lang === 'ta' ? 'மண்வளப் பலன் & சத்து மேம்பாடு:' : 'Nutrient Cycling & Soil Health:'}
                </span>
                <p className="text-slate-600">{selectedCropItem.crop.nutrient_benefits}</p>
                {selectedCropItem.crop.is_nitrogen_fixing && (
                  <span className="inline-block mt-2 font-bold text-[#238636]">
                    ✓ {lang === 'ta' ? `இயற்கை நைட்ரஜன் சேர்ப்பு: +${selectedCropItem.crop.nitrogen_fixation_kg_ha} kg N/ha` : `Biological Nitrogen Fixed: +${selectedCropItem.crop.nitrogen_fixation_kg_ha} kg N/ha`}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons: Launch Tracker & Close */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              {(() => {
                const isSelectedTracked = trackedCropsList.some(
                  (c) =>
                    (c.crop?.id && String(c.crop.id) === String(selectedCropItem.crop.id)) ||
                    (c.crop?.name && c.crop.name.toLowerCase() === selectedCropItem.crop.name.toLowerCase())
                );

                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelectedTracked) {
                        navigate('/agri-tracker');
                      } else {
                        handleOpenTrackConfirm(selectedCropItem);
                      }
                    }}
                    className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                      isSelectedTracked
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-[#238636] hover:bg-emerald-700 text-white hover:scale-[1.01]'
                    }`}
                  >
                    <CalendarCheck2 className="w-4 h-4" />
                    <span>
                      {isSelectedTracked
                        ? (lang === 'ta' ? 'செயலில் உள்ளது ⏳ (Agri Tracker-ல் பார்க்க)' : 'On Process ⏳ (View in Agri Tracker)')
                        : (lang === 'ta'
                            ? `சாகுபடி திட்டத்தை உறுதிசெய் (${selectedCropItem.crop.duration_days_avg || 100} நாள் திட்டம்)`
                            : `Setup & Track ${selectedCropItem.crop.duration_days_avg || 100}-Day Plan`)}
                    </span>
                  </button>
                );
              })()}
              <button
                type="button"
                onClick={() => setSelectedCropItem(null)}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ta' ? 'மூடு' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRACK PLAN SETUP & CONFIRMATION MODAL (Acre & Soil Type Confirmation)     */}
      {/* ========================================================================= */}
      {confirmingCropItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-4 animate-in fade-in-50 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                  <Sprout className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                    {lang === 'ta' ? 'சாகுபடி திட்ட உறுதிப்படுத்தல்' : 'Cultivation Plan Setup'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-emerald-200 font-medium truncate">
                    {lang === 'ta'
                      ? (confirmingCropItem.crop.tamil_name || confirmingCropItem.crop.name)
                      : confirmingCropItem.crop.name} • {selectedDistrict} District
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingCropItem(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {lang === 'ta'
                  ? 'சாகுபடியைத் தொடங்குவதற்கு முன், உங்கள் நிலப்பரப்பு (ஏக்கர்) மற்றும் மண் வகையை உறுதிப்படுத்தவும். இதன் மூலம் உர மற்றும் நீர் அட்டவணை துல்லியமாக கணக்கிடப்படும்.'
                  : 'Please confirm your planned acreage and soil type before proceeding to Agri Tracker for accurate irrigation and fertilizer scheduling.'}
              </p>

              {/* 1. Acres Input Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{lang === 'ta' ? 'எத்தனை ஏக்கர் நிலம்?' : 'Cultivation Area (Acres):'}</span>
                  <span className="text-[11px] font-semibold text-[#238636]">{acresInput} {lang === 'ta' ? 'ஏக்கர்' : 'Acres'}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.5"
                    value={acresInput}
                    onChange={(e) => setAcresInput(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#238636] focus:ring-2 focus:ring-[#238636]/20 font-bold text-slate-900 text-sm bg-slate-50 focus:bg-white transition"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    {lang === 'ta' ? 'ஏக்கர்' : 'Acres'}
                  </span>
                </div>

                {/* Quick Selection Chips for Acres */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'ta' ? 'தேர்வு:' : 'Quick:'}</span>
                  {[1, 2, 3, 5, 10].map((ac) => (
                    <button
                      key={ac}
                      type="button"
                      onClick={() => setAcresInput(ac)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                        Number(acresInput) === ac
                          ? 'bg-[#238636] text-white border-[#238636]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ac} {lang === 'ta' ? 'ஏ' : 'ac'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Soil Type Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {lang === 'ta' ? 'மண் வகை (Soil Type):' : 'Soil Type:'}
                </label>
                <div className="relative">
                  <select
                    value={soilTypeInput}
                    onChange={(e) => setSoilTypeInput(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#238636]/20 focus:border-[#238636] transition cursor-pointer"
                  >
                    {SOIL_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {lang === 'ta' ? `${opt.ta} (${opt.en})` : `${opt.en}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Plan Summary Card */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{lang === 'ta' ? 'திட்ட காலம்' : 'Duration'}</span>
                  <span className="font-extrabold text-slate-900">{confirmingCropItem.crop.duration_days_avg || 100} {lang === 'ta' ? 'நாட்கள்' : 'Days'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{lang === 'ta' ? 'நீர் தேவை' : 'Water Req'}</span>
                  <span className="font-extrabold text-emerald-800">{confirmingCropItem.crop.water_req_mm || 450} mm</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmingCropItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  {lang === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTrackPlan}
                  className="px-5 py-2.5 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-[#238636]/20 cursor-pointer active:scale-95"
                >
                  <CalendarCheck2 className="w-4 h-4" />
                  <span>{lang === 'ta' ? 'உறுதிப்படுத்தி தொடங்கு 🚀' : 'Confirm & Track Plan 🚀'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
