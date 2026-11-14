import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Building,
  Droplets,
  Calendar,
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
  Check,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { districtApi, authApi } from '../services/api';
import { getDistricts } from '../data/locationHierarchy';

// Quick popular agricultural districts for one-tap selection
const POPULAR_DISTRICTS = [
  'Pudukkottai',
  'Thanjavur',
  'Tiruvarur',
  'Nagapattinam',
  'Madurai',
  'Coimbatore',
  'Salem',
  'Tiruchirappalli'
];

export default function CropRotationPlannerPage() {
  const { t, lang } = useLanguage();
  const { user, setUser } = useAuth();

  const state = user?.registered_location?.state || user?.state || 'Tamil Nadu';
  const country = user?.registered_location?.country || user?.country || 'India';
  const initialDistrict = user?.registered_location?.district || user?.district || 'Pudukkottai';

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [rotationData, setRotationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switchingDistrict, setSwitchingDistrict] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(1); // Default to recommended plan
  const [detailModalStrategy, setDetailModalStrategy] = useState(null);

  const availableDistricts = getDistricts(country, state);

  // Sync if district changes elsewhere
  useEffect(() => {
    const userDist = user?.registered_location?.district || user?.district;
    if (userDist && userDist !== selectedDistrict) {
      setSelectedDistrict(userDist);
    }
  }, [user]);

  // Fetch Rotation data
  const fetchRotation = async (dist) => {
    const targetDistrict = dist || selectedDistrict;
    try {
      setLoading(true);
      const res = await districtApi.getRotation(targetDistrict, state, country);
      setRotationData(res.data);
      if (res.data?.strategies) {
        const recIdx = res.data.strategies.findIndex(
          (s) => s.id === res.data.recommended_strategy_id || s.strategy_type === 'soil_health'
        );
        setSelectedPlanIndex(recIdx >= 0 ? recIdx : 1);
      }
    } catch (err) {
      console.error('Rotation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRotation(selectedDistrict);
  }, [selectedDistrict]);

  // Handle changing district
  const handleDistrictChange = async (newDistrict) => {
    if (!newDistrict || newDistrict === selectedDistrict) return;

    setSelectedDistrict(newDistrict);
    setSwitchingDistrict(true);

    try {
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
      console.warn('Profile sync warning:', err);
    } finally {
      setSwitchingDistrict(false);
    }
  };

  const strategies = rotationData?.strategies || [];
  const activeStrategy = strategies[selectedPlanIndex] || strategies[0];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & District Selection Bar (Matching Crop Explorer & Soil Health) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#238636] text-xs font-bold border border-emerald-200 mb-2">
              <Building className="w-3.5 h-3.5" />
              <span>{selectedDistrict} District • {lang === 'ta' ? 'பயிர் சுழற்சித் திட்டம்' : 'Seasonal Rotation Planner'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <RotateCcw className="w-7 h-7 text-[#238636]" />
              {lang === 'ta' ? 'பயிர் சுழற்சி திட்டமிடுபவர்' : 'Crop Rotation Planner'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
              {lang === 'ta'
                ? `${selectedDistrict} மாவட்ட மண்வளம் காக்கவும், பூச்சித் தாக்குதலைத் தவிர்க்கவும் பருவ வாரியான சுழற்சித் திட்டம்.`
                : `Season-by-season crop rotation strategies tailored to ${selectedDistrict}'s soil profile, moisture, and rainfall regime.`}
            </p>
          </div>

          {/* District Dropdown Selector */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'ta' ? 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்' : 'Select District'}
              </label>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={loading || switchingDistrict}
                  className="w-full appearance-none pl-9 pr-9 py-2.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-300 hover:border-emerald-400 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#238636]/40 focus:border-[#238636] transition cursor-pointer disabled:opacity-60"
                >
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-[#238636] absolute left-3 top-3 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Popular District Chips */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'ta' ? 'விரைவு மாவட்டங்கள்:' : 'Quick Select:'}
          </span>
          {POPULAR_DISTRICTS.map((d) => {
            const isCurrent = selectedDistrict.toLowerCase() === d.toLowerCase();
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDistrictChange(d)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all border ${
                  isCurrent
                    ? 'bg-[#238636] text-white border-[#238636] shadow-xs'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-900 border-slate-200'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selected District Soil & Agro Profile Summary Strip */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white p-5 rounded-2xl border border-emerald-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#238636] text-white">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-black text-slate-900 block leading-tight">
                {lang === 'ta'
                  ? `${selectedDistrict} மாவட்ட மண் & காலநிலைப் பின்னணி:`
                  : `${selectedDistrict} District Agro & Soil Baseline:`}
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                {lang === 'ta' ? rotationData?.primary_soil_tamil || rotationData?.primary_soil : rotationData?.primary_soil || 'Red Sandy Loam'} • {rotationData?.agro_climatic_zone || 'Tamil Nadu Zone'}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-emerald-800 border border-emerald-300 w-fit">
            {strategies.length} {lang === 'ta' ? 'சுழற்சித் திட்டங்கள்' : 'Rotation Plans Evaluated'}
          </span>
        </div>

        {/* 4 Quick Soil & Rotation Baseline Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Soil Type */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              {lang === 'ta' ? 'மண் வகை' : 'Primary Soil'}
            </span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block truncate">
              {lang === 'ta' ? rotationData?.primary_soil_tamil || rotationData?.primary_soil : rotationData?.primary_soil || 'Red Sandy Loam'}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">
              {lang === 'ta' ? 'ஆய்வக தரவு இணைக்கப்பட்டது' : 'Lab Baseline Linked'}
            </span>
          </div>

          {/* Normal Rainfall */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              {lang === 'ta' ? 'ஆண்டு சராசரி மழை' : 'Normal Rainfall'}
            </span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
              {rotationData?.annual_rainfall_normal_mm || 850} mm/year
            </span>
            <span className="text-[10px] font-semibold text-slate-600">
              {lang === 'ta' ? 'நாசா மழை கண்காணிப்பு' : 'NASA Historical Normal'}
            </span>
          </div>

          {/* Natural Nitrogen Added */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#238636]" />
              {lang === 'ta' ? 'இயற்கை தழைச்சத்து' : 'Biological Nitrogen'}
            </span>
            <span className="text-sm font-extrabold text-emerald-800 mt-0.5 block">
              +{activeStrategy?.nitrogen_added_kg_ha || 110} kg N/ha
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">
              {lang === 'ta' ? '30% உரச் செலவு மிச்சம்' : '30% Fertilizer Saved'}
            </span>
          </div>

          {/* Water Conservation */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              {lang === 'ta' ? 'நீர் சேமிப்பு' : 'Water Savings'}
            </span>
            <span className="text-sm font-extrabold text-sky-800 mt-0.5 block">
              {activeStrategy?.water_savings_pct ? `${activeStrategy.water_savings_pct}% Saved` : 'Optimized'}
            </span>
            <span className="text-[10px] font-semibold text-slate-600">
              {lang === 'ta' ? 'வறட்சி தாங்கும் உத்தி' : 'Drought Resilient'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Three Strategy Cards Grid (Matching Crop Explorer Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#238636]" />
            {lang === 'ta' ? `${selectedDistrict} மாவட்டத்திற்கான 3 சுழற்சித் திட்டங்கள்` : `3 Cultivation Plans Evaluated for ${selectedDistrict}`}
          </h2>
          <span className="text-xs font-bold text-[#238636]">
            {lang === 'ta' ? 'திட்டத்தைத் தேர்வு செய்து பார்க்கவும்' : 'Click a Plan to view full timeline'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <RefreshCw className="w-7 h-7 text-[#238636] animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">
              {lang === 'ta' ? `${selectedDistrict} மாவட்ட சுழற்சித் திட்டங்கள் கணக்கிடப்படுகின்றன...` : `Calculating rotation strategies for ${selectedDistrict}...`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {strategies.map((strategy, idx) => {
              const isSelected = selectedPlanIndex === idx;
              const isRecommended = strategy.strategy_type === 'soil_health' || idx === 1;

              return (
                <div
                  key={strategy.id || idx}
                  onClick={() => setSelectedPlanIndex(idx)}
                  className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    isSelected
                      ? 'border-[#238636] ring-2 ring-[#238636]/30 shadow-md'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-md shadow-xs'
                  }`}
                >
                  <div>
                    {/* Card Top Banner with Score */}
                    <div className={`p-4 border-b flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-emerald-50/70 border-emerald-100' : 'bg-slate-50/60 border-slate-100'
                    }`}>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900/80 text-white">
                            {lang === 'ta' ? `திட்டம் ${idx + 1}` : `Plan ${idx + 1}`}
                          </span>
                          {isRecommended && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#238636] text-white shadow-xs">
                              {lang === 'ta' ? 'சிறந்தது ★' : 'Recommended ★'}
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#238636] transition leading-snug">
                          {lang === 'ta' && strategy.name_tamil ? strategy.name_tamil : strategy.name}
                        </h3>
                      </div>

                      {/* Suitability Score Pill */}
                      <div className="text-right shrink-0">
                        <div className={`px-2.5 py-1 rounded-full text-xs font-black shadow-xs flex items-center gap-1 ${
                          strategy.overall_score >= 85
                            ? 'bg-[#238636] text-white'
                            : strategy.overall_score >= 70
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-700 text-white'
                        }`}>
                          <span>{strategy.overall_score}%</span>
                          <span className="text-[9px] font-semibold opacity-90">{lang === 'ta' ? 'பொருத்தம்' : 'Fit'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Seasonal Sequence Steps Box */}
                    <div className="p-4 space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {lang === 'ta' ? 'பருவ வரிசை (3 பருவங்கள்):' : 'Seasonal Order (3 Seasons):'}
                      </span>

                      <div className="space-y-2">
                        {(strategy.crop_sequence || []).map((step, sIdx) => {
                          const isRestorative = step.soil_impact === 'Restorative' || step.is_nitrogen_fixing;
                          return (
                            <div
                              key={sIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                                isRestorative
                                  ? 'bg-emerald-50/60 border-emerald-200/80'
                                  : 'bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#238636] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {sIdx + 1}
                                </span>
                                <div>
                                  <span className="font-extrabold text-slate-900 block leading-tight">
                                    {lang === 'ta' && step.crop_tamil ? step.crop_tamil : step.crop_name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {lang === 'ta' && step.season_tamil ? step.season_tamil : step.season}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right text-[11px] font-semibold text-slate-600 shrink-0">
                                <span>{step.duration_days} d</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Economic Outlook text */}
                      <p className="text-slate-500 text-[11px] leading-relaxed pt-1 font-medium line-clamp-2">
                        {strategy.economic_outlook}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Metrics & Details */}
                  <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                      <span>💧 {strategy.estimated_annual_water_mm} mm</span>
                      {strategy.nitrogen_added_kg_ha > 0 && (
                        <span>• 🌱 +{strategy.nitrogen_added_kg_ha} kg N</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModalStrategy(strategy);
                      }}
                      className="text-[11px] font-bold text-[#238636] hover:underline flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                    >
                      {lang === 'ta' ? 'விவரம் →' : 'Details →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Active Selected Plan: Detailed Visual Seasonal Sequence Timeline */}
      {activeStrategy && !loading && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-[#238636]">
                  {lang === 'ta' ? `தேர்வு செய்யப்பட்ட திட்டம் ${selectedPlanIndex + 1}` : `Active Plan ${selectedPlanIndex + 1}`}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {lang === 'ta' && activeStrategy.name_tamil ? activeStrategy.name_tamil : activeStrategy.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {activeStrategy.economic_outlook}
              </p>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {activeStrategy.water_savings_pct > 0 && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
                  💧 -{activeStrategy.water_savings_pct}% {lang === 'ta' ? 'நீர் சேமிப்பு' : 'Water Saved'}
                </span>
              )}
              {activeStrategy.nitrogen_added_kg_ha > 0 && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  🌱 +{activeStrategy.nitrogen_added_kg_ha} kg N/ha {lang === 'ta' ? 'தழைச்சத்து' : 'Nitrogen Added'}
                </span>
              )}
            </div>
          </div>

          {/* 3 Step Timeline Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#238636]" />
                {lang === 'ta' ? 'பருவ வாரியாக பயிர் நடும் கால அட்டவணை:' : 'Season-by-Season Planting Timeline:'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {activeStrategy.crop_sequence?.length || 3} {lang === 'ta' ? 'பருவங்கள்' : 'Seasons'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(activeStrategy.crop_sequence || []).map((step, sIdx) => {
                const isRestorative = step.soil_impact === 'Restorative' || step.is_nitrogen_fixing;
                const isDepletive = step.soil_impact === 'Depletive';

                return (
                  <div
                    key={sIdx}
                    className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                      isRestorative
                        ? 'bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border-emerald-300 shadow-xs'
                        : isDepletive
                        ? 'bg-gradient-to-br from-rose-50/40 to-slate-50 border-rose-200'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Step Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#238636] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                            {sIdx + 1}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            {lang === 'ta' && step.season_tamil ? step.season_tamil : step.season}
                          </span>
                        </div>
                        {step.is_nitrogen_fixing && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#238636] text-white">
                            {lang === 'ta' ? '+மண்வளம்' : '+N Fixer'}
                          </span>
                        )}
                      </div>

                      {/* Crop Name */}
                      <div className="my-2">
                        <h4 className="font-black text-slate-900 text-base leading-tight">
                          {lang === 'ta' && step.crop_tamil ? step.crop_tamil : step.crop_name}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                          {step.months}
                        </span>
                      </div>

                      {/* Soil Role Badge */}
                      <div className="my-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                            isRestorative
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isDepletive
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {lang === 'ta'
                            ? isRestorative
                              ? 'மண்ணை வளப்படுத்தும் பயிர் (Restorative)'
                              : isDepletive
                              ? 'சத்தை உறிஞ்சும் பயிர் (Depletive)'
                              : 'நடுத்தர பயிர் (Neutral)'
                            : `${step.soil_impact} Soil Impact`}
                        </span>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-1.5 my-3 text-[11px] text-slate-600 font-medium">
                        {(step.benefits || []).slice(0, 2).map((b, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#238636] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step Metrics Footer */}
                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{step.duration_days} {lang === 'ta' ? 'நாட்கள்' : 'Days'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-sky-500" />
                        <span>{step.water_need_mm} mm</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simple Agronomic Advice Box */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#238636] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-extrabold text-emerald-900 block mb-0.5">
                {lang === 'ta' ? 'விவசாயிகளுக்கான வழிகாட்டல்:' : 'Agronomic Farmer Guidance:'}
              </span>
              <p className="text-emerald-800 font-medium">
                {lang === 'ta'
                  ? `இந்த சுழற்சியைப் பின்பற்றுவதன் மூலம் ${selectedDistrict} மாவட்ட நிலத்தில் பூச்சி மற்றும் நோய்களின் வாழ்க்கைச் சுழற்சி உடைக்கப்படுகிறது. இரசாயன உரச் செலவு 30% வரை மிச்சமாகும்.`
                  : `Adopting this rotation schedule in ${selectedDistrict} disrupts pest & pathogen lifecycles while naturally recharging available soil nitrogen.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Detailed Strategy Sowing Modal (Matching Crop Explorer Modal) */}
      {detailModalStrategy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {detailModalStrategy.overall_score}% {lang === 'ta' ? 'பொருத்தம்' : 'Suitability Score'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  {lang === 'ta' && detailModalStrategy.name_tamil ? detailModalStrategy.name_tamil : detailModalStrategy.name}
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {selectedDistrict} District • {detailModalStrategy.economic_outlook}
                </p>
              </div>
              <button
                onClick={() => setDetailModalStrategy(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'ஆண்டு நீர் தேவை' : 'Annual Water'}</span>
                <span className="font-extrabold text-sky-700 text-sm mt-0.5 block">{detailModalStrategy.estimated_annual_water_mm} mm</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'தழைச்சத்து சேர்ப்பு' : 'Nitrogen Fixed'}</span>
                <span className="font-extrabold text-emerald-700 text-sm mt-0.5 block">+{detailModalStrategy.nitrogen_added_kg_ha} kg N</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'மண்வள உயர்வு' : 'Soil Health Delta'}</span>
                <span className="font-extrabold text-[#238636] text-sm mt-0.5 block">{detailModalStrategy.soil_health_delta_score > 0 ? `+${detailModalStrategy.soil_health_delta_score}` : detailModalStrategy.soil_health_delta_score} pts</span>
              </div>
            </div>

            {/* All 3 Steps in Detail */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                {lang === 'ta' ? 'பருவ வரிசை விவரங்கள்:' : 'Full Seasonal Cultivation Details:'}
              </h4>
              {(detailModalStrategy.crop_sequence || []).map((step, sIdx) => (
                <div key={sIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {sIdx + 1}. {lang === 'ta' && step.crop_tamil ? step.crop_tamil : step.crop_name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {lang === 'ta' && step.season_tamil ? step.season_tamil : step.season}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {lang === 'ta' ? 'பயிர் காலம்:' : 'Duration:'} {step.duration_days} {lang === 'ta' ? 'நாட்கள்' : 'days'} • {lang === 'ta' ? 'நீர் தேவை:' : 'Water:'} {step.water_need_mm} mm
                  </div>
                  <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                    {(step.benefits || []).map((b, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#238636] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setDetailModalStrategy(null)}
                className="px-5 py-2 bg-[#238636] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
              >
                {lang === 'ta' ? 'சரி' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
