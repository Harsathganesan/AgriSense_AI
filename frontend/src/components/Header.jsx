import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Languages,
  Building,
  ShieldCheck,
  ChevronDown,
  Check,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { getDistricts } from '../data/locationHierarchy';

export default function Header({ onToggleSidebar }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);

  const district = user?.registered_location?.district || user?.district || 'Thanjavur';
  const state = user?.registered_location?.state || user?.state || 'Tamil Nadu';
  const country = user?.registered_location?.country || user?.country || 'India';

  const availableDistricts = getDistricts(country, state);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDistrict = async (newDistrict) => {
    if (newDistrict === district) {
      setIsDropdownOpen(false);
      return;
    }
    try {
      setSwitching(true);
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
      setUser(res.data);
      setIsDropdownOpen(false);
    } catch (err) {
      console.error("Failed to switch district:", err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & District Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Selected District Interactive Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/90 hover:bg-emerald-50/70 hover:border-emerald-300 transition text-slate-800 text-sm font-semibold shadow-2xs group cursor-pointer"
            title="Click to switch district / மாவட்டத்தை மாற்றுக"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#238636] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none">
                {lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட மாவட்டம்' : 'Selected District'}
              </span>
              <span className="text-xs font-bold text-slate-800 truncate max-w-[170px] block leading-tight">
                {district}, {state}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#238636] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#238636]' : ''}`} />
          </button>

          {/* District Switcher Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  {lang === 'ta' ? 'மாவட்டத்தை தேர்ந்தெடுக்கவும்' : 'Switch Farm District'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {lang === 'ta' ? 'அனைத்து வேளாண் தகவல்களும் மாறும்' : 'All agricultural telemetry adapts to this district'}
                </span>
              </div>
              <div className="py-1">
                {availableDistricts.map((d) => {
                  const isSelected = d === district;
                  return (
                    <button
                      key={d}
                      onClick={() => handleSelectDistrict(d)}
                      disabled={switching}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                        isSelected
                          ? 'bg-emerald-50 text-[#238636]'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#238636]' : 'text-slate-400'}`} />
                        <span>{d}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#238636]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Language Toggle & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title="Switch Language / மொழியை மாற்றுக"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#238636] font-bold text-xs transition shadow-2xs"
        >
          <Languages className="w-4 h-4" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100 cursor-pointer transition"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#238636] to-emerald-400 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <div className="hidden md:block text-left text-xs leading-tight">
            <span className="font-bold text-slate-800 block truncate max-w-[130px]">
              {user?.name || 'Farmer'}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" />
              Verified Grower
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
