import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RotateCcw,
  Building,
  Droplets,
  Calendar,
  Sparkles,
  MapPin,
  ChevronDown,
  CheckCircle2,
  X,
  Layers,
  ShieldCheck,
  RefreshCw,
  Check,
  ArrowRight,
  TrendingUp,
  Sprout
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { districtApi, authApi } from '../services/api';
import { getDistricts } from '../data/locationHierarchy';

export default function CropRotationPlannerPage() {
  const { lang } = useLanguage();
  const { user, setUser } = useAuth();

  const state = user?.registered_location?.state || user?.state || 'Tamil Nadu';
  const country = user?.registered_location?.country || user?.country || 'India';
  const initialDistrict = user?.registered_location?.district || user?.district || 'Pudukkottai';

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [rotationData, setRotationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switchingDistrict, setSwitchingDistrict] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(1);
  const [detailModalStrategy, setDetailModalStrategy] = useState(null);

  const availableDistricts = getDistricts(country, state);

  // Sync if district changes in AuthContext
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

  const handleDistrictChange = async (newDistrict) => {
    if (!newDistrict || newDistrict === selectedDistrict) return;
    setSelectedDistrict(newDistrict);
    setSwitchingDistrict(true);
    try {
      if (user) {
        const res = await authApi.updateProfile({
          district: newDistrict,
          state,
          country,
          registered_location: {
            country,
            state,
            district: newDistrict
          }
        });
        if (res.data) setUser(res.data);
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
    <div className="space-y-4 sm:space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 text-[#238636] shrink-0" />
            <span>{lang === 'ta' ? 'பயிர் சுழற்சித் திட்டம்' : 'Crop Rotation Planner'}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            {lang === 'ta'
              ? 'மண்வளம் மற்றும் லாபத்தை அதிகரிக்கும் 3 பருவ சுழற்சி முறை'
              : '3-Season Climate-Smart Rotation Cycle for Maximum Soil Health & Profit'}
          </p>
        </div>

        {/* Compact District Selector */}
        <div className="relative w-full md:w-auto md:min-w-[200px]">
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={loading || switchingDistrict}
            className="w-full appearance-none pl-9 pr-9 py-2.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-300 hover:border-emerald-400 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#238636]/40 focus:border-[#238636] transition cursor-pointer disabled:opacity-60"
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

      {/* 2. Key Baseline Snapshot Bar (Clean & Compact) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">
              {lang === 'ta' ? 'மண் வகை' : 'Soil Type'}
            </span>
            <span className="text-[11px] sm:text-xs font-black text-slate-800 block truncate">
              {lang === 'ta' ? rotationData?.primary_soil_tamil || rotationData?.primary_soil : rotationData?.primary_soil || 'Red Sandy Loam'}
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">
              {lang === 'ta' ? 'வருடாந்திர மழை' : 'Normal Rain'}
            </span>
            <span className="text-[11px] sm:text-xs font-black text-slate-800 block truncate">
              {rotationData?.annual_rainfall_normal_mm || 850} mm
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#238636] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">
              {lang === 'ta' ? 'இயற்கை தழைச்சத்து' : 'Nitrogen Added'}
            </span>
            <span className="text-[11px] sm:text-xs font-black text-emerald-700 block truncate">
              +{activeStrategy?.nitrogen_added_kg_ha || 110} kg N/ha
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">
              {lang === 'ta' ? 'உரச் செலவு சேமிப்பு' : 'Fertilizer Saved'}
            </span>
            <span className="text-[11px] sm:text-xs font-black text-teal-700 block truncate">
              ~30% Less Urea
            </span>
          </div>
        </div>
      </div>

      {/* 3. Segmented Plan Selection Tabs (Zero Clutter!) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#238636]" />
            {lang === 'ta' ? 'பயிர் சுழற்சி திட்டத்தைத் தேர்வு செய்க:' : 'Select Cultivation Strategy:'}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {strategies.length} {lang === 'ta' ? 'திட்டங்கள்' : 'Plans'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {strategies.map((strategy, idx) => {
            const isSelected = selectedPlanIndex === idx;
            const isRecommended = strategy.strategy_type === 'soil_health' || idx === 1;

            return (
              <button
                key={strategy.id || idx}
                type="button"
                onClick={() => setSelectedPlanIndex(idx)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#238636] ring-2 ring-[#238636]/30 shadow-md'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        {lang === 'ta' ? `திட்டம் ${idx + 1}` : `Plan ${idx + 1}`}
                      </span>
                      {isRecommended && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#238636] text-white">
                          {lang === 'ta' ? 'பரிந்துரைக்கப்பட்டது ★' : 'Recommended ★'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#238636]">
                      {strategy.overall_score}% {lang === 'ta' ? 'பொருத்தம்' : 'Fit'}
                    </span>
                  </div>

                  <h3 className="text-sm font-normal text-slate-700 leading-snug">
                    {lang === 'ta' && strategy.name_tamil ? strategy.name_tamil : strategy.name}
                  </h3>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-normal text-slate-500">
                  <span>💧 {strategy.estimated_annual_water_mm} mm</span>
                  {strategy.nitrogen_added_kg_ha > 0 && (
                    <span className="text-emerald-700 font-medium">🌱 +{strategy.nitrogen_added_kg_ha} kg N</span>
                  )}
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-[#238636]' : 'text-slate-400'}`}>
                    {isSelected ? (lang === 'ta' ? '✓ செயலில் உள்ளது' : '✓ Active Plan') : (lang === 'ta' ? 'தேர்வு செய்க →' : 'Select →')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. The Visual 3-Season Sequence Flow ("Pathona Ennanu Therinjidum!") */}
      {loading ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-7 h-7 text-[#238636] animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">
            {lang === 'ta' ? 'சுழற்சித் திட்டம் கணக்கிடப்படுகிறது...' : 'Loading rotation schedule...'}
          </p>
        </div>
      ) : activeStrategy ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
          {/* Active Plan Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#238636] shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  {lang === 'ta' && activeStrategy.name_tamil ? activeStrategy.name_tamil : activeStrategy.name}
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                {lang === 'ta'
                  ? 'ஆண்டு முழுவதும் உங்கள் நிலத்தில் அடுத்தடுத்து நட வேண்டிய பயிர்கள்:'
                  : 'Annual sequential planting roadmap across 3 agricultural seasons:'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDetailModalStrategy(activeStrategy)}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#238636] border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 w-full sm:w-fit cursor-pointer shadow-2xs"
            >
              <span>{lang === 'ta' ? 'முழு விவரங்கள்' : 'Full Agronomic Data'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Step Connected Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 relative">
            {(activeStrategy.crop_sequence || []).map((step, sIdx) => {
              const isRestorative = step.soil_impact === 'Restorative' || step.is_nitrogen_fixing;
              const isLast = sIdx === (activeStrategy.crop_sequence?.length || 3) - 1;

              return (
                <div key={sIdx} className="relative flex flex-col">
                  <div
                    className={`h-full rounded-2xl p-4 sm:p-5 border flex flex-col justify-between transition-all ${
                      isRestorative
                        ? 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border-emerald-300 shadow-xs'
                        : 'bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Step Header Badge */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-[#238636] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {sIdx + 1}
                          </span>
                          <div>
                            <span className="text-[10px] uppercase font-medium text-slate-400 block leading-none">
                              {lang === 'ta' ? `பருவம் ${sIdx + 1}` : `Season ${sIdx + 1}`}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {lang === 'ta' && step.season_tamil ? step.season_tamil : step.season}
                            </span>
                          </div>
                        </div>

                        {step.is_nitrogen_fixing && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#238636] text-white shadow-2xs">
                            +N Fixer
                          </span>
                        )}
                      </div>

                      {/* Prominent Crop Name & Months */}
                      <div className="py-2">
                        <div className="flex items-center gap-2">
                          <Sprout className="w-5 h-5 text-[#238636] shrink-0" />
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                            {lang === 'ta' && step.crop_tamil ? step.crop_tamil : step.crop_name}
                          </h3>
                        </div>
                        <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block mt-2">
                          📅 {step.months}
                        </span>
                      </div>

                      {/* Soil Role Tag */}
                      <div className="pt-1">
                        <span
                          className={`text-[10px] font-medium px-2.5 py-1 rounded-lg inline-block ${
                            isRestorative
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {isRestorative
                            ? (lang === 'ta' ? '🌿 மண்ணை வளப்படுத்தும் பயிர்' : '🌿 Restorative (+Soil Health)')
                            : (lang === 'ta' ? '🌾 முதன்மை உற்பத்திப் பயிர்' : '🌾 Primary Food/Cash Harvest')}
                        </span>
                      </div>
                    </div>

                    {/* Step Metrics Footer */}
                    <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{step.duration_days} {lang === 'ta' ? 'நாட்கள்' : 'days'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sky-700 font-semibold">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{step.water_need_mm} mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Arrows (Down on Mobile, Right on Desktop) */}
                  {!isLast && (
                    <>
                      <div className="md:hidden flex justify-center py-2 text-[#238636]">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow-2xs">
                          <ChevronDown className="w-4 h-4 text-[#238636]" />
                        </div>
                      </div>
                      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-300 shadow-sm items-center justify-center text-[#238636]">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3 Core Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#238636] shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-xs text-emerald-950 block">
                  {lang === 'ta' ? 'மண்வளப் பாதுகாப்பு' : 'Natural Soil Recharge'}
                </span>
                <span className="text-[11px] text-emerald-800 font-medium leading-relaxed block mt-0.5">
                  {lang === 'ta'
                    ? 'பயறு வகை பயிர்கள் மண்ணில் நைட்ரஜனைச் சேர்த்து 30% யூரியா செலவைக் குறைக்கிறது.'
                    : 'Legume cycle naturally adds biological nitrogen, reducing urea costs.'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50/60 rounded-2xl border border-sky-100 flex items-start gap-2.5">
              <Droplets className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-xs text-sky-950 block">
                  {lang === 'ta' ? 'தண்ணீர் சேமிப்பு' : 'Water Efficiency'}
                </span>
                <span className="text-[11px] text-sky-800 font-medium leading-relaxed block mt-0.5">
                  {lang === 'ta'
                    ? 'கோடைப் பருவத்தில் குறைந்த நீர் தேவைப்படும் எள்/பயறு சாகுபடி செய்யப்படுகிறது.'
                    : 'Low-water summer crops conserve borewell and canal storage.'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-xs text-amber-950 block">
                  {lang === 'ta' ? 'பூச்சிக் கட்டுப்பாடு' : 'Pest Lifecycle Break'}
                </span>
                <span className="text-[11px] text-amber-800 font-medium leading-relaxed block mt-0.5">
                  {lang === 'ta'
                    ? 'ஒரே பயிரைத் திரும்ப நடாமல் சுழற்சி செய்வதால் பூச்சித் தாக்குதல் குறைகிறது.'
                    : 'Breaks insect and pathogen breeding cycles without excess pesticides.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 5. Detailed Modal (Portaled directly to document.body for zero mobile gap) */}
      {detailModalStrategy && createPortal(
        <div className="fixed inset-0 z-[9999] modal-overlay-full bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {detailModalStrategy.overall_score}% {lang === 'ta' ? 'பொருத்தம்' : 'Suitability'}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {lang === 'ta' && detailModalStrategy.name_tamil ? detailModalStrategy.name_tamil : detailModalStrategy.name}
                </h2>
              </div>
              <button
                onClick={() => setDetailModalStrategy(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Numbers */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'ஆண்டு நீர்' : 'Annual Water'}</span>
                <span className="font-extrabold text-sky-700 text-sm mt-0.5 block">{detailModalStrategy.estimated_annual_water_mm} mm</span>
              </div>
              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{lang === 'ta' ? 'தழைச்சத்து' : 'Nitrogen Added'}</span>
                <span className="font-extrabold text-emerald-700 text-sm mt-0.5 block">+{detailModalStrategy.nitrogen_added_kg_ha} kg N</span>
              </div>
            </div>

            {/* Steps list */}
            <div className="space-y-2 pt-1">
              {(detailModalStrategy.crop_sequence || []).map((step, sIdx) => (
                <div key={sIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                      {sIdx + 1}. {lang === 'ta' && step.crop_tamil ? step.crop_tamil : step.crop_name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {lang === 'ta' && step.season_tamil ? step.season_tamil : step.season} • {step.months}
                    </span>
                  </div>
                  <div className="text-left sm:text-right text-[11px] font-bold text-slate-600">
                    <span>{step.duration_days} d • {step.water_need_mm} mm</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setDetailModalStrategy(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#238636] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ta' ? 'சரி' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
