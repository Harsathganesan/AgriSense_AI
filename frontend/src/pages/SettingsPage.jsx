import React, { useState } from 'react';
import {
  Settings,
  User,
  Languages,
  Sliders,
  LogOut,
  Save,
  CheckCircle2,
  ShieldCheck,
  Phone,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { user, setUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || 'Kandasamy Muthusamy (முத்துசாமி)');
  const [phone, setPhone] = useState(user?.phone || '+91 94431 82740');
  const [district, setDistrict] = useState(user?.district || 'Thanjavur');
  const [state, setState] = useState(user?.state || 'Tamil Nadu');

  // Farmer Priorities
  const [soilRegen, setSoilRegen] = useState(user?.priorities?.soil_regeneration || 0.35);
  const [waterCons, setWaterCons] = useState(user?.priorities?.water_conservation || 0.35);
  const [profitability, setProfitability] = useState(user?.priorities?.market_profitability || 0.30);
  const [riskTolerance, setRiskTolerance] = useState(user?.priorities?.risk_tolerance || 'medium');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name,
        phone,
        district,
        state,
        language: lang,
        priorities: {
          soil_regeneration: Number(soilRegen),
          water_conservation: Number(waterCons),
          market_profitability: Number(profitability),
          risk_tolerance: riskTolerance
        }
      };
      const res = await authApi.updateProfile(payload);
      setUser(res.data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#238636]" />
          {t('nav.settings')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Farmer profile, language localization preferences, and algorithmic weighting priorities.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <User className="w-4 h-4 text-[#238636]" />
            Grower Profile & Identity
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Phone (SMS Alerts)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
              />
            </div>
          </div>
        </div>

        {/* Language & Regional Localization */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Languages className="w-4 h-4 text-[#238636]" />
            Language & Accessibility
          </div>

          <p className="text-xs text-slate-500">
            Select your preferred display language for UI labels, charts, AI assistant interactions, and PDF reports.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md pt-1">
            <button
              type="button"
              onClick={() => {
                setLang('en');
                localStorage.setItem('agrisense_lang', 'en');
              }}
              className={`p-4 rounded-2xl border text-left transition ${
                lang === 'en'
                  ? 'border-emerald-500 bg-emerald-50/70 text-[#238636] ring-2 ring-emerald-500/20 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-black">English</span>
              <span className="text-[11px] text-slate-400">Default International</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLang('ta');
                localStorage.setItem('agrisense_lang', 'ta');
              }}
              className={`p-4 rounded-2xl border text-left transition ${
                lang === 'ta'
                  ? 'border-emerald-500 bg-emerald-50/70 text-[#238636] ring-2 ring-emerald-500/20 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-black">தமிழ் (Tamil)</span>
              <span className="text-[11px] text-slate-400">தமிழ்நாடு விவசாயிகளுக்கு</span>
            </button>
          </div>
        </div>

        {/* Farmer Priorities & Algorithmic Tuning */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#238636]" />
            Crop Rotation Strategy Priorities
          </div>
          <p className="text-xs text-slate-500">
            Tune how the recommendation algorithm balances soil regeneration, water conservation, and cash returns for your land.
          </p>

          <div className="space-y-4 pt-1 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-slate-700">Soil Health & Carbon Building Weight:</span>
                <span className="text-emerald-700 font-extrabold">{Math.round(soilRegen * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={soilRegen}
                onChange={(e) => setSoilRegen(parseFloat(e.target.value))}
                className="w-full accent-[#238636]"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-slate-700">Water Conservation Priority:</span>
                <span className="text-teal-700 font-extrabold">{Math.round(waterCons * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={waterCons}
                onChange={(e) => setWaterCons(parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-slate-700">Commercial Market Profitability:</span>
                <span className="text-orange-700 font-extrabold">{Math.round(profitability * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={profitability}
                onChange={(e) => setProfitability(parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <div className="pt-2">
              <label className="font-bold text-slate-700 block mb-1">Risk Tolerance Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRiskTolerance(level)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition ${
                      riskTolerance === level
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {level} Risk
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Settings Saved!
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#238636] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : t('common.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

