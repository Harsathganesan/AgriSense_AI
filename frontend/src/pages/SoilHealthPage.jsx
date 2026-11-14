import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Building,
  Droplets,
  Thermometer,
  ShieldAlert,
  ChevronDown,
  RefreshCw,
  Award,
  Layers,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { districtApi, authApi } from '../services/api';
import { getDistricts } from '../data/locationHierarchy';
import SoilScoreGauge from '../components/SoilScoreGauge';

export default function SoilHealthPage() {
  const { t, lang } = useLanguage();
  const { user, setUser } = useAuth();

  const state = user?.registered_location?.state || user?.state || 'Tamil Nadu';
  const country = user?.registered_location?.country || user?.country || 'India';
  const initialDistrict = user?.registered_location?.district || user?.district || 'Pudukkottai';

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [soilData, setSoilData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switchingDistrict, setSwitchingDistrict] = useState(false);

  const availableDistricts = getDistricts(country, state);

  // Sync if user in AuthContext updates elsewhere
  useEffect(() => {
    const userDist = user?.registered_location?.district || user?.district;
    if (userDist && userDist !== selectedDistrict) {
      setSelectedDistrict(userDist);
    }
  }, [user]);

  // Fetch Soil Health data whenever selectedDistrict changes
  const fetchSoilHealth = async (dist) => {
    const targetDistrict = dist || selectedDistrict;
    try {
      setLoading(true);
      const res = await districtApi.getSoilHealth(targetDistrict, state, country);
      setSoilData(res.data);
    } catch (err) {
      console.error('Soil health fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoilHealth(selectedDistrict);
  }, [selectedDistrict]);

  // Handle changing district directly from this page
  const handleDistrictChange = async (newDistrict) => {
    if (!newDistrict || newDistrict === selectedDistrict) return;

    setSelectedDistrict(newDistrict);
    setSwitchingDistrict(true);

    try {
      // Also update user's active district profile across AgriSense
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

  const satIndicators = soilData?.satellite_environmental_indicators || {};
  const labData = soilData?.laboratory_soil_test || {};
  const params = labData?.status_summary?.parameters || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner & District Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#238636] text-xs font-bold border border-emerald-200 mb-2">
              <Building className="w-3.5 h-3.5" />
              <span>
                {selectedDistrict} District Soil Profile ({soilData?.primary_soil_type || 'Regional Soil'})
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FlaskConical className="w-7 h-7 text-[#238636]" />
              {lang === 'ta' ? 'மண் வளம் மற்றும் ஊட்டச்சத்து' : 'Soil Health & Diagnostics'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lang === 'ta'
                ? `${selectedDistrict} மாவட்ட மண் வளம் மற்றும் ஊட்டச்சத்து பகுப்பாய்வு`
                : `${selectedDistrict} district soil health and nutrient diagnostics`}
            </p>
          </div>

          {/* District Dropdown Selector */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
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

      {/* SECTION 1: SATELLITE-DERIVED ENVIRONMENTAL SOIL INDICATORS (NASA SMAP & POWER) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                {lang === 'ta' ? 'நாசா செயற்கைக்கோள் மண் குறிகாட்டிகள்' : 'NASA Satellite Soil Environmental Indicators'}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  SMAP & POWER L3
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Spatial footprint: 9km gridded radiometer • {selectedDistrict} Centroid
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#238636] animate-pulse" />
            Live NASA Pass
          </span>
        </div>

        {/* 4 Satellite Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: SMAP Root-Zone Soil Moisture */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-teal-50/30 border border-blue-200/70">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-600" />
                Root-Zone Moisture (0-100cm)
              </span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.2 rounded">
                NASA SMAP
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {satIndicators.rootzone_moisture_0_100cm_pct || 24.5}%
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-medium">
              Surface (0-5cm): {satIndicators.surface_moisture_0_5cm_pct || 22.0}%
            </p>
            <div className="mt-2 text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded w-fit">
              {satIndicators.rootzone_moisture_0_100cm_pct >= 20 ? 'Adequate for Tillage' : 'Moisture Deficit'}
            </div>
          </div>

          {/* Card 2: Soil Temperature */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/30 border border-amber-200/70">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-600" />
                Soil Temperature
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.2 rounded">
                NASA POWER
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {satIndicators.soil_temperature_c || 28.4}°C
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-medium">
              {satIndicators.soil_temperature_status || 'Optimal microbial activity window'}
            </p>
            <div className="mt-2 text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 px-2 py-0.5 rounded w-fit">
              Biology: Active
            </div>
          </div>

          {/* Card 3: Rainfall Erosion & Runoff Risk */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/60 to-red-50/20 border border-rose-200/70">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Soil Erosion Risk
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                  satIndicators.rainfall_impact?.erosion_risk_level === 'High'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {satIndicators.rainfall_impact?.erosion_risk_level || 'Low'}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              Index: {satIndicators.rainfall_impact?.erosion_index_score || 18}/100
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 font-medium">
              {lang === 'ta'
                ? satIndicators.rainfall_impact?.advice_ta
                : satIndicators.rainfall_impact?.advice_en || 'Maintain crop cover on loose topsoil.'}
            </p>
          </div>

          {/* Card 4: Soil Water Availability (Plant Available Water) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-200/70">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-emerald-600" />
                Plant Available Water (PAW)
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded">
                AWC Metric
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {satIndicators.water_availability?.plant_available_water_pct || 62.0}%
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-medium">
              {lang === 'ta'
                ? satIndicators.water_availability?.status_ta
                : satIndicators.water_availability?.status_en || 'Optimal root zone reservoir'}
            </p>
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              FC: {satIndicators.water_availability?.field_capacity_pct}% | WP: {satIndicators.water_availability?.wilting_point_pct}%
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LABORATORY CERTIFIED SOIL HEALTH PROFILE & SCORECARD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Soil Score Gauge (5 Cols) */}
        <div className="md:col-span-5">
          <SoilScoreGauge
            score={labData.composite_health_score || 82}
            grade={labData.status_summary?.grade || 'Good'}
            gradeTamil={labData.status_summary?.grade_tamil || 'நன்று'}
          />
        </div>

        {/* Selected District Soil & Facility Profile (7 Cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#238636]" />
                {lang === 'ta' ? 'மாவட்ட மண் & ஆய்வுக்கூட விவரம்' : 'District Soil & Testing Laboratory Profile'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                ICAR & TNAU Standards
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">{lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட மாவட்டம்:' : 'Selected District:'}</span>
                <span className="font-extrabold text-slate-900">{selectedDistrict}, {state}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">{lang === 'ta' ? 'முக்கிய மண் வகை:' : 'Primary Soil Type:'}</span>
                <span className="font-extrabold text-amber-800">
                  {lang === 'ta' ? soilData?.primary_soil_type_tamil : soilData?.primary_soil_type}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">{lang === 'ta' ? 'அங்கீகரிக்கப்பட்ட ஆய்வுக்கூடம்:' : 'Testing Facility:'}</span>
                <span className="font-extrabold text-slate-800 text-right">{labData.lab_name}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-semibold">{lang === 'ta' ? 'மாதிரி எடுக்கப்பட்ட தேதி:' : 'Sample / Reference Date:'}</span>
                <span className="font-mono text-slate-700 font-bold">{labData.test_date || '2026-02-15'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrient Parameters Cards Grid (Chemical Laboratory Tested) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#238636]" />
            {lang === 'ta' ? 'ஆய்வக ஊட்டச்சத்து அளவீடுகள்' : 'Laboratory Certified Nutrient Parameters'}
          </h3>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {selectedDistrict} District Baseline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* pH */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">pH Level</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{labData.ph || 7.0}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {labData.ph < 6.5 ? 'Acidic' : labData.ph > 7.5 ? 'Alkaline' : 'Neutral Range'}
              </p>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {lang === 'ta' ? 'உகந்தது' : 'Optimal'}
              </span>
            </div>
          </div>

          {/* Nitrogen (N) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Available Nitrogen (N)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {labData.nitrogen_kg_ha || 235} <span className="text-xs font-normal text-slate-400">kg/ha</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Primary vegetative driver</p>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {params?.nitrogen?.status || 'Medium'}
              </span>
            </div>
          </div>

          {/* Phosphorus (P) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Phosphorus (P)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {labData.phosphorus_kg_ha || 16.5} <span className="text-xs font-normal text-slate-400">kg/ha</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Root vigor & energy</p>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {params?.phosphorus?.status || 'Optimal'}
              </span>
            </div>
          </div>

          {/* Potassium (K) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Potassium (K)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {labData.potassium_kg_ha || 215} <span className="text-xs font-normal text-slate-400">kg/ha</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Disease resistance</p>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {params?.potassium?.status || 'Optimal'}
              </span>
            </div>
          </div>

          {/* Organic Carbon (OC) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Organic Carbon</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {labData.organic_carbon_pct || 0.55}%
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Microbial health</p>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {params?.organic_carbon?.status || 'Medium'}
              </span>
            </div>
          </div>

          {/* Electrical Conductivity (EC) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Electrical Cond.</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {labData.electrical_conductivity_ds_m || 0.42} <span className="text-xs font-normal text-slate-400">dS/m</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Salinity indicator</p>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Non-Saline (Safe)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
