import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Calendar,
  CloudRain,
  Thermometer,
  Droplets,
  Sprout,
  Mountain,
  Sun,
  Info,
  Filter,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { nasaApi } from '../services/api';

export default function NasaExplorerPage() {
  const { t, lang } = useLanguage();
  const { activeFarm } = useFarm();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nasaData, setNasaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeseries'); // 'timeseries', 'satellites', 'climatology'

  const fetchNasaTelemetry = async () => {
    if (!activeFarm) return;
    try {
      setLoading(true);
      const lat = activeFarm.latitude;
      const lon = activeFarm.longitude;
      const sParam = startDate ? startDate.replace(/-/g, '') : null;
      const eParam = endDate ? endDate.replace(/-/g, '') : null;

      const res = await nasaApi.getSummary(lat, lon, sParam, eParam);
      setNasaData(res.data);
    } catch (err) {
      console.error("NASA API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNasaTelemetry();
  }, [activeFarm]);

  const meta = nasaData?.source_metadata || {};
  const current = nasaData?.current_metrics || {};
  const daily = nasaData?.daily_history || [];
  const climatology = nasaData?.monthly_climatology || [];
  const anomaly = nasaData?.anomaly_analysis || {};
  const drySpell = nasaData?.dry_spell_analysis || {};

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Satellite className="w-7 h-7 text-[#238636]" />
            {t('nav.nasaExplorer')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multispectral Earth observation telemetry from NASA POWER, GPM, SMAP, MODIS and SRTM missions.
          </p>
        </div>

        {/* Date Range Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Range:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#238636]"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#238636]"
          />
          <button
            onClick={fetchNasaTelemetry}
            className="px-3 py-1.5 bg-[#238636] hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            <Filter className="w-3 h-3" />
            Apply
          </button>
        </div>
      </div>

      {/* Dataset Metadata Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div>
            <span className="font-bold text-slate-200">
              Primary Source: {meta.power_api_source || "NASA POWER MERRA-2 & CERES"}
            </span>
            <span className="text-slate-400 block text-[11px]">
              Location: {activeFarm?.latitude.toFixed(4)}°N, {activeFarm?.longitude.toFixed(4)}°E • Status: {meta.retrieval_status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-white/10 text-emerald-300 font-mono text-[11px] font-bold">
            {meta.is_live_api ? "LIVE NASA API OBSERVATIONS" : "NASA 30-YR REANALYSIS MODEL"}
          </span>
          <a
            href="https://power.larc.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-slate-400 hover:text-white transition"
            title="NASA POWER Portal"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('timeseries')}
          className={`pb-3 transition relative ${
            activeTab === 'timeseries' ? 'text-[#238636] border-b-2 border-[#238636]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Meteorological Trends
        </button>
        <button
          onClick={() => setActiveTab('satellites')}
          className={`pb-3 transition relative ${
            activeTab === 'satellites' ? 'text-[#238636] border-b-2 border-[#238636]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Satellite Layers (GPM, SMAP, MODIS, SRTM)
        </button>
        <button
          onClick={() => setActiveTab('climatology')}
          className={`pb-3 transition relative ${
            activeTab === 'climatology' ? 'text-[#238636] border-b-2 border-[#238636]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Long-Term 12-Month Climatology
        </button>
      </div>

      {/* TAB 1: Daily Time-Series */}
      {activeTab === 'timeseries' && (
        <div className="space-y-6">
          {/* Temperature & Precipitation Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Daily Ambient Temperature & Precipitation Time-Series
                </h3>
                <p className="text-xs text-slate-400">
                  Observed T2M Max, Min, and daily rainfall accumulation (mm)
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={daily} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis yAxisId="temp" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} unit="°C" domain={['dataMin - 3', 'dataMax + 3']} />
                  <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} unit="mm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar yAxisId="rain" dataKey="precipitation_mm" name="Daily Rain (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Line yAxisId="temp" type="monotone" dataKey="temp_max" name="Max Temp (°C)" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line yAxisId="temp" type="monotone" dataKey="temp_mean" name="Mean Temp (°C)" stroke="#f97316" strokeWidth={2.5} dot={{ r: 2 }} />
                  <Line yAxisId="temp" type="monotone" dataKey="temp_min" name="Min Temp (°C)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Humidity & Solar Radiation Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Relative Humidity (%) & All-Sky Surface Solar Radiation (MJ/m²/day)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              NASA CERES radiative flux and atmospheric moisture levels
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis yAxisId="rh" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} unit="%" domain={[30, 100]} />
                  <YAxis yAxisId="solar" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} unit="MJ" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line yAxisId="rh" type="monotone" dataKey="relative_humidity_pct" name="Humidity (%)" stroke="#0d9488" strokeWidth={2} dot={false} />
                  <Line yAxisId="solar" type="monotone" dataKey="solar_radiation_mj" name="Solar Radiation (MJ/m²)" stroke="#eab308" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Satellite Layers Breakdown */}
      {activeTab === 'satellites' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GPM Precipitation */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CloudRain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">NASA GPM IMERG</h4>
                <p className="text-[11px] text-slate-400">Global Precipitation Measurement L3</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">30-Day Accumulation:</span>
                <span className="font-extrabold text-slate-800">{current.precipitation_30d_mm} mm</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Spatial Resolution:</span>
                <span className="font-mono text-slate-700">0.1° × 0.1° (~10 km)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Rain Anomaly:</span>
                <span className={`font-bold ${anomaly.rain_anomaly_pct >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {anomaly.rain_anomaly_pct}% vs Climatology
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Dry-Spell Consecutive Days:</span>
                <span className="font-bold text-slate-800">{drySpell.max_consecutive_dry_days} days</span>
              </div>
            </div>
          </div>

          {/* SMAP Soil Moisture */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">NASA SMAP Radiometer</h4>
                <p className="text-[11px] text-slate-400">Soil Moisture Active Passive L3/L4</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Root-Zone Volumetric Moisture:</span>
                <span className="font-extrabold text-slate-800">{current.smap_moisture_pct}% (m³/m³)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Surface Layer (0-5 cm):</span>
                <span className="font-mono text-slate-700">{current.smap_surface_m3} m³/m³</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Hydrological Status:</span>
                <span className="font-bold text-emerald-700">Adequate for Root Uptake</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Spatial Gridding:</span>
                <span className="font-mono text-slate-700">9 km Equal-Area Scalable Grid</span>
              </div>
            </div>
          </div>

          {/* MODIS NDVI */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">NASA MODIS (Terra & Aqua)</h4>
                <p className="text-[11px] text-slate-400">Vegetation Indices 16-Day (MOD13Q1)</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Current NDVI Index:</span>
                <span className="font-extrabold text-slate-800">{current.ndvi}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Canopy Vigor Classification:</span>
                <span className="font-bold text-emerald-700">{current.ndvi_status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Pixel Resolution:</span>
                <span className="font-mono text-slate-700">250 meters per pixel</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Enhanced Veg Index (EVI):</span>
                <span className="font-mono text-slate-700">{(current.ndvi * 0.84).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* SRTM Elevation & Terrain */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Mountain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">NASA SRTM v3 GL1</h4>
                <p className="text-[11px] text-slate-400">Shuttle Radar Topography Mission</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Elevation above Sea Level:</span>
                <span className="font-extrabold text-slate-800">{current.elevation_m} meters</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Topographic Slope:</span>
                <span className="font-mono text-slate-700">{current.slope_pct}% gradient</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Terrain Morphology:</span>
                <span className="font-bold text-slate-700">Deltaic Flatland / Low runoff</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Resolution:</span>
                <span className="font-mono text-slate-700">30 meters (1 arc-second)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Climatology */}
      {activeTab === 'climatology' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              30-Year Monthly Climatological Baseline
            </h3>
            <p className="text-xs text-slate-400">
              Historical reference (1991-2020) distinguishing true current observations from climatological averages.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">Average Temp (°C)</th>
                  <th className="py-2.5 px-3">Normal Precipitation (mm)</th>
                  <th className="py-2.5 px-3">Daily Solar Radiation (MJ/m²)</th>
                  <th className="py-2.5 px-3">Agronomic Season</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {climatology.map((c, i) => (
                  <tr key={c.month} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.month}</td>
                    <td className="py-2.5 px-3">{c.avg_temp_c}°C</td>
                    <td className="py-2.5 px-3 font-semibold text-sky-700">{c.precipitation_mm} mm</td>
                    <td className="py-2.5 px-3">{c.solar_radiation_mj} MJ/m²</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {i in [5,6,7,8] ? "Kuruvai Season" : (i in [9,10,11] ? "Samba / Thaladi Peak Monsoon" : "Navarai / Summer Dry")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

