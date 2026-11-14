import React, { useState } from 'react';
import {
  Settings,
  User,
  Languages,
  LogOut,
  Save,
  CheckCircle2,
  MapPin,
  Globe,
  Building
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { getCountries, getStates, getDistricts } from '../data/locationHierarchy';

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { user, setUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || 'Kandasamy Muthusamy (முத்துசாமி)');
  const [phone, setPhone] = useState(user?.phone || '+91 94431 82740');
  const [country, setCountry] = useState(user?.registered_location?.country || user?.country || 'India');
  const [state, setState] = useState(user?.registered_location?.state || user?.state || 'Tamil Nadu');
  const [district, setDistrict] = useState(user?.registered_location?.district || user?.district || 'Thanjavur');

  const availableCountries = getCountries();
  const availableStates = getStates(country);
  const availableDistricts = getDistricts(country, state);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    const newStates = getStates(newCountry);
    const defaultState = newStates[0] || '';
    setState(defaultState);
    const newDistricts = getDistricts(newCountry, defaultState);
    setDistrict(newDistricts[0] || '');
  };

  const handleStateChange = (newState) => {
    setState(newState);
    const newDistricts = getDistricts(country, newState);
    setDistrict(newDistricts[0] || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name,
        phone,
        country,
        state,
        district,
        language: lang,
        priorities: user?.priorities || {
          soil_regeneration: 0.35,
          water_conservation: 0.35,
          market_profitability: 0.30,
          risk_tolerance: 'medium'
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
          {lang === 'ta'
            ? 'விவசாயி சுயவிவரம் மற்றும் மொழி விருப்பத்தேர்வுகள்.'
            : 'Farmer profile and language localization preferences.'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <User className="w-4 h-4 text-[#238636]" />
            {lang === 'ta' ? 'விவசாயி சுயவிவரம்' : 'Grower Profile & Identity'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {lang === 'ta' ? 'முழுப் பெயர்' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {lang === 'ta' ? 'கைபேசி எண் (SMS எச்சரிக்கைகள்)' : 'Mobile Phone (SMS Alerts)'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm font-mono"
              />
            </div>

            {/* Cascading Location Hierarchy: Country -> State -> District */}
            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {lang === 'ta' ? 'நாடு' : 'Country'}
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm bg-white"
              >
                {availableCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {lang === 'ta' ? 'மாநிலம்' : 'State / Province'}
              </label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm bg-white"
              >
                {availableStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#238636]" />
                {lang === 'ta' ? 'மாவட்டம் (பதிவு செய்யப்பட்ட பண்ணை இருப்பிடம்)' : 'District (Registered Farm Location)'}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm bg-white font-medium"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'ta'
                  ? 'இது உங்கள் பண்ணை பகுதிக்கான அடிப்படை மண் மற்றும் நாசா காலநிலைக் குறிப்புகளை அமைக்கும்.'
                  : 'This sets your baseline district, GeoJSON boundaries, and NASA agro-climatology references.'}
              </p>
            </div>
          </div>
        </div>

        {/* Language & Regional Localization */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Languages className="w-4 h-4 text-[#238636]" />
            {lang === 'ta' ? 'மொழி விருப்பங்கள்' : 'Language & Accessibility'}
          </div>

          <p className="text-xs text-slate-500">
            {lang === 'ta'
              ? 'பயன்பாட்டு இடைமுகம் மற்றும் தகவல்களுக்கான மொழியைத் தேர்வுசெய்யவும்.'
              : 'Select your preferred display language for UI labels, charts, and AI assistant interactions.'}
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
                {lang === 'ta' ? 'அமைப்புகள் சேமிக்கப்பட்டன!' : 'Settings Saved!'}
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#238636] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              {saving ? (lang === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : t('common.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

