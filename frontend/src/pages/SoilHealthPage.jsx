import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Calendar,
  Building,
  FileCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { soilApi } from '../services/api';
import SoilScoreGauge from '../components/SoilScoreGauge';

export default function SoilHealthPage() {
  const { t, lang } = useLanguage();
  const { activeFarm } = useFarm();

  const [records, setRecords] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    test_date: new Date().toISOString().slice(0, 10),
    ph: 6.8,
    nitrogen_kg_ha: 245.0,
    phosphorus_kg_ha: 16.5,
    potassium_kg_ha: 210.0,
    organic_carbon_pct: 0.58,
    soil_moisture_pct: 24.0,
    electrical_conductivity: 0.45,
    soil_type: 'Alluvial Soil',
    lab_name: 'District Soil Testing Laboratory, Thanjavur',
    notes: ''
  });

  const fetchSoilData = async () => {
    if (!activeFarm) return;
    try {
      setLoading(true);
      const [recsRes, latestRes] = await Promise.all([
        soilApi.getRecords(activeFarm.id),
        soilApi.getLatest(activeFarm.id)
      ]);
      setRecords(recsRes.data);
      setLatestRecord(latestRes.data);
    } catch (err) {
      console.error("Soil fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoilData();
  }, [activeFarm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeFarm) return;
    try {
      const payload = {
        farm_id: activeFarm.id,
        test_date: formData.test_date,
        ph: Number(formData.ph),
        nitrogen_kg_ha: Number(formData.nitrogen_kg_ha),
        phosphorus_kg_ha: Number(formData.phosphorus_kg_ha),
        potassium_kg_ha: Number(formData.potassium_kg_ha),
        organic_carbon_pct: Number(formData.organic_carbon_pct),
        soil_moisture_pct: Number(formData.soil_moisture_pct),
        electrical_conductivity: Number(formData.electrical_conductivity),
        soil_type: formData.soil_type,
        lab_name: formData.lab_name,
        notes: formData.notes
      };
      await soilApi.createRecord(payload);
      setIsModalOpen(false);
      await fetchSoilData();
    } catch (err) {
      console.error("Create soil record error:", err);
    }
  };

  const params = latestRecord?.status_summary?.parameters || {};
  const recomms = (lang === 'ta' && latestRecord?.status_summary?.recommendations_tamil)
    ? latestRecord.status_summary.recommendations_tamil
    : (latestRecord?.status_summary?.recommendations || []);

  const getStatusColor = (score) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FlaskConical className="w-7 h-7 text-[#238636]" />
            {t('soil.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('soil.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#238636] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition hover:scale-[1.02] active:scale-[0.98] w-fit"
        >
          <Plus className="w-4 h-4" />
          {t('soil.newEntry')}
        </button>
      </div>

      {/* Main Composite Health Gauge and Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SoilScoreGauge
            score={latestRecord?.health_score || 82}
            grade={latestRecord?.status_summary?.grade || "Good"}
            gradeTamil={latestRecord?.status_summary?.grade_tamil || "நன்று"}
          />
        </div>

        {/* Advisory Box */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-emerald-50/30 rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <FileCheck className="w-4 h-4 text-[#238636]" />
              {t('soil.guidelines')}
            </div>
            <div className="space-y-2 mt-3">
              {recomms.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-[#238636] shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Last Lab Sample: {latestRecord?.test_date || "Recent"}</span>
            <span>Testing Facility: {latestRecord?.lab_name || "Regional TNAU Center"}</span>
          </div>
        </div>
      </div>

      {/* Nutrient Parameters Cards Grid */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 mb-3">
          Essential Nutrient Indicators & Availability
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* pH */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reaction (pH)</span>
            <div className="text-2xl font-black text-slate-900 my-1">{params.ph?.value || 6.8}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Opt: 6.5 - 7.5</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getStatusColor(params.ph?.score || 95)}`}>
                {lang === 'ta' ? params.ph?.status_tamil : params.ph?.status || 'Optimal'}
              </span>
            </div>
          </div>

          {/* Nitrogen (N) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Nitrogen (N)</span>
            <div className="text-2xl font-black text-slate-900 my-1">{params.nitrogen?.value || 245} <span className="text-xs font-semibold text-slate-400">kg/ha</span></div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Opt: 280 - 560</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getStatusColor(params.nitrogen?.score || 60)}`}>
                {lang === 'ta' ? params.nitrogen?.status_tamil : params.nitrogen?.status || 'Low'}
              </span>
            </div>
          </div>

          {/* Phosphorus (P) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Phosphorus (P)</span>
            <div className="text-2xl font-black text-slate-900 my-1">{params.phosphorus?.value || 16.5} <span className="text-xs font-semibold text-slate-400">kg/ha</span></div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Opt: 11 - 22</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getStatusColor(params.phosphorus?.score || 95)}`}>
                {lang === 'ta' ? params.phosphorus?.status_tamil : params.phosphorus?.status || 'Optimal'}
              </span>
            </div>
          </div>

          {/* Potassium (K) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Potassium (K)</span>
            <div className="text-2xl font-black text-slate-900 my-1">{params.potassium?.value || 210} <span className="text-xs font-semibold text-slate-400">kg/ha</span></div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Opt: 118 - 280</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getStatusColor(params.potassium?.score || 95)}`}>
                {lang === 'ta' ? params.potassium?.status_tamil : params.potassium?.status || 'Optimal'}
              </span>
            </div>
          </div>

          {/* Organic Carbon */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Organic Carbon (OC)</span>
            <div className="text-2xl font-black text-slate-900 my-1">{params.organic_carbon?.value || 0.58}%</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Target: {'>'}0.75%</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getStatusColor(params.organic_carbon?.score || 88)}`}>
                {lang === 'ta' ? params.organic_carbon?.status_tamil : params.organic_carbon?.status || 'Good'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Soil Test Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">
          Historical Soil Test Archive
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Test Date</th>
                <th className="py-2.5 px-3">pH</th>
                <th className="py-2.5 px-3">Nitrogen (N)</th>
                <th className="py-2.5 px-3">Phosphorus (P)</th>
                <th className="py-2.5 px-3">Potassium (K)</th>
                <th className="py-2.5 px-3">Organic Carbon</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Testing Lab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{r.test_date}</td>
                  <td className="py-2.5 px-3">{r.ph}</td>
                  <td className="py-2.5 px-3">{r.nitrogen_kg_ha} kg/ha</td>
                  <td className="py-2.5 px-3">{r.phosphorus_kg_ha} kg/ha</td>
                  <td className="py-2.5 px-3">{r.potassium_kg_ha} kg/ha</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-800">{r.organic_carbon_pct}%</td>
                  <td className="py-2.5 px-3 font-extrabold text-[#238636]">{Math.round(r.health_score)}/100</td>
                  <td className="py-2.5 px-3 text-slate-500">{r.lab_name || "TNAU Lab"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for New Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Enter Soil Test Results
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Record laboratory parameters to calculate updated fertility score and rotation recommendations.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Test Date</label>
                  <input
                    type="date"
                    required
                    value={formData.test_date}
                    onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Soil pH (3.0 - 10.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3.0"
                    max="10.0"
                    required
                    value={formData.ph}
                    onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nitrogen (kg/ha)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.nitrogen_kg_ha}
                    onChange={(e) => setFormData({ ...formData, nitrogen_kg_ha: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phosphorus (kg/ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.phosphorus_kg_ha}
                    onChange={(e) => setFormData({ ...formData, phosphorus_kg_ha: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Potassium (kg/ha)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.potassium_kg_ha}
                    onChange={(e) => setFormData({ ...formData, potassium_kg_ha: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Organic Carbon (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5.0"
                    required
                    value={formData.organic_carbon_pct}
                    onChange={(e) => setFormData({ ...formData, organic_carbon_pct: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Soil Moisture (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.soil_moisture_pct}
                    onChange={(e) => setFormData({ ...formData, soil_moisture_pct: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Testing Laboratory / Source</label>
                <input
                  type="text"
                  value={formData.lab_name}
                  onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })}
                  placeholder="e.g. TNAU Soil Science Laboratory"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                >
                  Calculate & Save Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
