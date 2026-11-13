import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
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
import { nasaApi, soilApi, rotationApi, reportsApi } from '../services/api';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import SoilScoreGauge from '../components/SoilScoreGauge';

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { activeFarm } = useFarm();
  const navigate = useNavigate();

  const [nasaSummary, setNasaSummary] = useState(null);
  const [soilRecord, setSoilRecord] = useState(null);
  const [rotationData, setRotationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const fetchDashboardData = async () => {
    if (!activeFarm) return;
    try {
      setLoading(true);
      const lat = activeFarm.latitude;
      const lon = activeFarm.longitude;

      const [nasaRes, soilRes, rotRes] = await Promise.all([
        nasaApi.getSummary(lat, lon),
        soilApi.getLatest(activeFarm.id),
        rotationApi.getLatest(activeFarm.id)
      ]);

      setNasaSummary(nasaRes.data);
      setSoilRecord(soilRes.data);
      setRotationData(rotRes.data);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeFarm]);

  const handleDownloadReport = async () => {
    if (!activeFarm) return;
    try {
      setDownloadingReport(true);
      const res = await reportsApi.generate(activeFarm.id);
      if (res.data?.download_url) {
        window.open(res.data.download_url, '_blank');
      }
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setDownloadingReport(false);
    }
  };

  const metrics = nasaSummary?.current_metrics || {};
  const alerts = nasaSummary?.alerts || [];
  const dailyHistory = nasaSummary?.daily_history || [];
  const climatology = nasaSummary?.monthly_climatology || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-emerald-800 via-[#238636] to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Background Subtle Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

        <div className="z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            NASA Earth Observations Active • {activeFarm?.district || 'Tamil Nadu'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {activeFarm?.name || t('dashboard.welcome')}
          </h1>
          <p className="text-emerald-100 text-sm mt-1.5 leading-relaxed">
            {t('dashboard.overviewSubtitle')}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="z-10 flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/rotation-planner')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4 text-[#238636]" />
            {t('dashboard.planRotation')}
          </button>
          <button
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 border border-white/20 text-white font-bold text-xs transition backdrop-blur-sm"
          >
            <FileDown className="w-4 h-4" />
            {downloadingReport ? 'Building PDF...' : t('common.download')}
          </button>
        </div>
      </div>

      {/* Environmental & Agronomic Alerts from NASA */}
      <AlertBanner alerts={alerts} />

      {/* 6 Core Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard
          title={t('dashboard.temp')}
          value={metrics.avg_temp_c !== undefined ? metrics.avg_temp_c : '--'}
          unit="°C"
          icon={Thermometer}
          accentColor="#f97316"
          subtitle="NASA POWER (MERRA-2)"
          badgeText="Normal"
          badgeType="success"
        />
        <StatCard
          title={t('dashboard.rainfall')}
          value={metrics.precipitation_30d_mm !== undefined ? metrics.precipitation_30d_mm : '--'}
          unit="mm"
          icon={CloudRain}
          accentColor="#0284c7"
          subtitle="NASA GPM IMERG"
          badgeText={metrics.precipitation_30d_mm > 50 ? 'Adequate' : 'Dry Spell'}
          badgeType={metrics.precipitation_30d_mm > 50 ? 'success' : 'warning'}
        />
        <StatCard
          title={t('dashboard.moisture')}
          value={metrics.smap_moisture_pct !== undefined ? metrics.smap_moisture_pct : '--'}
          unit="%"
          icon={Droplets}
          accentColor="#0d9488"
          subtitle="NASA SMAP (0-100cm)"
          badgeText="Root Zone"
          badgeType="info"
        />
        <StatCard
          title={t('dashboard.vegetation')}
          value={metrics.ndvi !== undefined ? metrics.ndvi : '--'}
          unit="NDVI"
          icon={Sprout}
          accentColor="#238636"
          subtitle="NASA MODIS (250m)"
          badgeText="Healthy Vigor"
          badgeType="success"
        />
        <StatCard
          title={t('dashboard.elevation')}
          value={metrics.elevation_m !== undefined ? metrics.elevation_m : '--'}
          unit="m"
          icon={Mountain}
          accentColor="#64748b"
          subtitle="NASA SRTM v3"
          badgeText={`Slope ${metrics.slope_pct || 0.8}%`}
          badgeType="neutral"
        />
        <StatCard
          title={t('dashboard.soilScore')}
          value={soilRecord?.health_score !== undefined ? Math.round(soilRecord.health_score) : 78}
          unit="/100"
          icon={Award}
          accentColor="#16a34a"
          subtitle="ICAR Diagnostic"
          badgeText={soilRecord?.status_summary?.grade || 'Good'}
          badgeType="success"
        />
      </div>

      {/* Main Grid: Charts & Recommended Rotation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 30-Day NASA POWER Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {t('dashboard.weatherTrends')}
              </h3>
              <p className="text-xs text-slate-400">
                Daily Mean Temperature (°C) and Precipitation (mm) observations
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/70">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> Rain
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] ml-2" /> Temp
            </div>
          </div>

          <div className="h-72 w-full">
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '12px'
                  }}
                />
                <Bar yAxisId="right" dataKey="precipitation_mm" name="Rainfall (mm)" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="temp_mean" name="Temp Mean (°C)" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: '#f97316' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Soil Health Scorecard & AI Recommendation */}
        <div className="space-y-6">
          <SoilScoreGauge
            score={soilRecord?.health_score || 82}
            grade={soilRecord?.status_summary?.grade || "Good"}
            gradeTamil={soilRecord?.status_summary?.grade_tamil || "நன்று"}
          />

          {/* Recommended Rotation Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 rounded-3xl p-5 border border-emerald-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#238636]" />
                  {t('dashboard.recommendedRotation')}
                </span>
                <span className="text-[10px] bg-emerald-100 text-[#238636] px-2 py-0.5 rounded-full font-extrabold">
                  Score 88.5/100
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                {lang === 'ta'
                  ? 'மண் வளம் பெருக்கும் பயிர் முறை'
                  : 'Soil-Health-Focused Sequence'}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {lang === 'ta'
                  ? 'சணப்பை (பசுந்தாள்) → சம்பா நெல் → நெல் தரிசு உளுந்து. 35% யூரியா சேமிப்பு மற்றும் +105 kg N/ha இயற்கை தழைச்சத்து.'
                  : 'Sunn Hemp (Green Manure) → Samba Rice → Black Gram Relay. 33% water savings and natural nitrogen replenishment.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">
                Water Savings: <span className="font-bold">+33.5%</span>
              </span>
              <button
                onClick={() => navigate('/rotation-planner')}
                className="flex items-center gap-1 text-xs font-bold text-[#238636] hover:text-emerald-800 transition"
              >
                {t('common.viewDetails')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Climatology Baseline Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              {t('dashboard.climatologyTrends')}
            </h3>
            <p className="text-xs text-slate-400">
              30-Year NASA Climatology Reference (1991 - 2020) for Cauvery Basin
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            NASA POWER Agro-Climatology
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={climatology} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} unit="°C" domain={[20, 40]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} unit="mm" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '12px'
                }}
              />
              <Bar yAxisId="right" dataKey="precipitation_mm" name="Historic Rain (mm)" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Line yAxisId="left" type="monotone" dataKey="avg_temp_c" name="Average Temp (°C)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
