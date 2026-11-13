import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Sparkles,
  Award,
  Droplets,
  Sprout,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileDown,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { rotationApi, reportsApi } from '../services/api';

export default function CropRotationPlannerPage() {
  const { t, lang } = useLanguage();
  const { activeFarm } = useFarm();

  const [rotationData, setRotationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // What-If Simulation Controls
  const [waterDeficit, setWaterDeficit] = useState(0);
  const [tempIncrease, setTempIncrease] = useState(0);
  const [phShift, setPhShift] = useState(0);

  // Configurable MCDA Weights
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);
  const [weights, setWeights] = useState({
    climate_suitability: 0.25,
    water_suitability: 0.20,
    soil_health: 0.20,
    nutrient_cycling: 0.15,
    environmental_suitability: 0.10,
    market_suitability: 0.10
  });

  const fetchRotation = async () => {
    if (!activeFarm) return;
    try {
      setLoading(true);
      const res = await rotationApi.getLatest(activeFarm.id);
      setRotationData(res.data);
    } catch (err) {
      console.error("Rotation fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRotation();
  }, [activeFarm]);

  const handleGenerate = async () => {
    if (!activeFarm) return;
    try {
      setGenerating(true);
      const res = await rotationApi.generate(activeFarm.id, weights);
      setRotationData(res.data);
      setSimulationResult(null);
    } catch (err) {
      console.error("Rotation generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!activeFarm) return;
    try {
      setSimulating(true);
      const res = await rotationApi.whatIf(activeFarm.id, {
        water_deficit_pct: Number(waterDeficit),
        temperature_increase_c: Number(tempIncrease),
        soil_ph_shift: Number(phShift)
      });
      setSimulationResult(res.data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  const strategies = simulationResult?.strategies || rotationData?.strategies || [];
  const comparisonMatrix = rotationData?.comparison_matrix || [];
  const advisory = (lang === 'ta' && rotationData?.agronomic_advisory_tamil)
    ? rotationData.agronomic_advisory_tamil
    : (rotationData?.agronomic_advisory || "");

  // Chart comparison data
  const chartData = strategies.map(s => ({
    name: s.name.split('(')[0].trim(),
    score: s.overall_score,
    water: s.estimated_annual_water_mm,
    nitrogen: s.nitrogen_added_kg_ha,
    savings: s.water_savings_pct
  }));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-7 h-7 text-[#238636]" />
            {t('rotation.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('rotation.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowWeightsConfig(!showWeightsConfig)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            MCDA Weights
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? 'Calculating...' : t('rotation.generateBtn')}
          </button>
        </div>
      </div>

      {/* Optional Weights Configuration Drawer */}
      {showWeightsConfig && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-in fade-in-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Configurable Multi-Criteria Decision Analysis (MCDA) Weights
              </h3>
              <p className="text-xs text-slate-400">
                Adjust weighting factors based on local agricultural priorities. Total weights normalize to 100%.
              </p>
            </div>
            <button
              onClick={() => {
                setWeights({
                  climate_suitability: 0.25,
                  water_suitability: 0.20,
                  soil_health: 0.20,
                  nutrient_cycling: 0.15,
                  environmental_suitability: 0.10,
                  market_suitability: 0.10
                });
              }}
              className="text-xs font-bold text-[#238636] hover:underline"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Climate: {Math.round(weights.climate_suitability * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={weights.climate_suitability}
                onChange={(e) => setWeights({ ...weights, climate_suitability: parseFloat(e.target.value) })}
                className="w-full accent-[#238636]"
              />
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">Water Need: {Math.round(weights.water_suitability * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={weights.water_suitability}
                onChange={(e) => setWeights({ ...weights, water_suitability: parseFloat(e.target.value) })}
                className="w-full accent-[#238636]"
              />
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">Soil Health: {Math.round(weights.soil_health * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={weights.soil_health}
                onChange={(e) => setWeights({ ...weights, soil_health: parseFloat(e.target.value) })}
                className="w-full accent-[#238636]"
              />
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">Nutrient Fix: {Math.round(weights.nutrient_cycling * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={weights.nutrient_cycling}
                onChange={(e) => setWeights({ ...weights, nutrient_cycling: parseFloat(e.target.value) })}
                className="w-full accent-[#238636]"
              />
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">Pest Break: {Math.round(weights.environmental_suitability * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={weights.environmental_suitability}
                onChange={(e) => setWeights({ ...weights, environmental_suitability: parseFloat(e.target.value) })}
                className="w-full accent-[#238636]"
              />
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">Market Return: {Math.round(weights.market_suitability * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={weights.market_suitability}
                onChange={(e) => setWeights({ ...weights, market_suitability: parseFloat(e.target.value) })}
                className="w-full accent-[#238636]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Advisory Banner */}
      {advisory && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3 shadow-2xs">
          <Info className="w-5 h-5 text-[#238636] shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            {advisory}
          </p>
        </div>
      )}

      {/* 3 Strategy Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {strategies.map((strategy, idx) => {
          const isRecommended = strategy.strategy_type === 'soil_health' || strategy.overall_score >= 87;
          return (
            <div
              key={strategy.id || idx}
              className={`rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between ${
                isRecommended
                  ? 'bg-gradient-to-b from-emerald-50/80 via-white to-white border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Strategy {idx + 1}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5 leading-tight">
                      {lang === 'ta' && strategy.name_tamil ? strategy.name_tamil : strategy.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-[#238636]">
                      {strategy.overall_score}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block">/100</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {isRecommended && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#238636] text-white">
                      Recommended
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Water: {strategy.estimated_annual_water_mm} mm
                  </span>
                  {strategy.water_savings_pct > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      -{strategy.water_savings_pct}% Water
                    </span>
                  )}
                  {strategy.nitrogen_added_kg_ha > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      +{strategy.nitrogen_added_kg_ha} kg N/ha
                    </span>
                  )}
                </div>

                {/* Crop Sequence Timeline */}
                <div className="space-y-3 my-4">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Seasonal Sequence Plan:
                  </span>
                  {(strategy.crop_sequence || []).map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#238636] flex items-center justify-center font-extrabold text-[10px] shrink-0">
                          {sIdx + 1}
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 block leading-tight">
                            {lang === 'ta' && step.crop_tamil ? step.crop_tamil : step.crop_name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {step.months || step.season}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-[11px]">
                        <span className="font-bold text-slate-700 block">{step.duration_days} d</span>
                        <span className="text-[10px] text-slate-400">{step.water_need_mm} mm</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Economic & Evidence Highlights */}
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Agronomic Outlook:</span>
                  <p className="text-[11px] leading-relaxed">
                    {strategy.economic_outlook}
                  </p>
                </div>
              </div>

              {/* Disclaimer footer */}
              <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 italic">
                {strategy.disclaimer}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">
          Cross-Strategy Agronomic Comparison Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Criteria / Metric</th>
                <th className="py-2.5 px-3">Existing Traditional</th>
                <th className="py-2.5 px-3">Soil-Health-Focused</th>
                <th className="py-2.5 px-3">Water-Efficient</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {comparisonMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {lang === 'ta' && row.metric_tamil ? row.metric_tamil : row.metric}
                  </td>
                  <td className="py-2.5 px-3">{row.existing}</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-800 bg-emerald-50/30">{row.soil_health}</td>
                  <td className="py-2.5 px-3 font-semibold text-sky-800">{row.water_efficient}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive What-If Simulation Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Climate Resilience Engine
          </span>
          <h3 className="text-xl font-black tracking-tight">
            {t('rotation.whatIfTitle')}
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Test how each crop rotation strategy holds up under monsoon failure, drought streaks, or extreme heat stress.
          </p>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span>{t('rotation.rainDeficit')}</span>
              <span className="text-sky-300">-{waterDeficit}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={waterDeficit}
              onChange={(e) => setWaterDeficit(e.target.value)}
              className="w-full accent-sky-400"
            />
            <span className="text-[10px] text-slate-400 block">Simulate drought dry spells</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span>{t('rotation.tempRise')}</span>
              <span className="text-orange-300">+{tempIncrease}°C</span>
            </div>
            <input
              type="range"
              min="0"
              max="4.0"
              step="0.5"
              value={tempIncrease}
              onChange={(e) => setTempIncrease(e.target.value)}
              className="w-full accent-orange-400"
            />
            <span className="text-[10px] text-slate-400 block">Simulate summer heatwaves</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span>Soil pH Shift</span>
              <span className="text-emerald-300">{phShift > 0 ? `+${phShift}` : phShift}</span>
            </div>
            <input
              type="range"
              min="-1.5"
              max="1.5"
              step="0.2"
              value={phShift}
              onChange={(e) => setPhShift(e.target.value)}
              className="w-full accent-emerald-400"
            />
            <span className="text-[10px] text-slate-400 block">Simulate soil acidification/alkalization</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 flex-wrap gap-4">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            {simulating ? 'Simulating...' : t('rotation.simulateBtn')}
          </button>

          {simulationResult && (
            <div className="flex items-center gap-3 text-xs bg-white/10 px-4 py-2 rounded-xl border border-white/10">
              <span className="text-emerald-300 font-bold">Optimal Pivot:</span>
              <span className="font-extrabold text-white">
                {simulationResult.impact_analysis?.recommended_pivot}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

