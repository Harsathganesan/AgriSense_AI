import React, { useState } from 'react';
import {
  Menu,
  Languages,
  ChevronDown,
  Tractor,
  Plus,
  User,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const { farms, activeFarm, setActiveFarm } = useFarm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farmDropdownOpen, setFarmDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Farm Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Farm Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setFarmDropdownOpen(!farmDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/40 text-slate-800 transition-all text-sm font-semibold shadow-2xs"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#238636] flex items-center justify-center shrink-0">
              <Tractor className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">
                {t('common.activeFarm')}
              </span>
              <span className="text-xs font-bold text-slate-800 truncate max-w-[170px] block leading-tight">
                {activeFarm ? activeFarm.name : 'Select Farm'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {farmDropdownOpen && (
            <div
              className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95"
              onMouseLeave={() => setFarmDropdownOpen(false)}
            >
              <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Your Farms ({farms.length})
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {farms.map((farm) => {
                  const isSelected = activeFarm && activeFarm.id === farm.id;
                  return (
                    <button
                      key={farm.id}
                      onClick={() => {
                        setActiveFarm(farm);
                        setFarmDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-emerald-50/60 transition-colors ${
                        isSelected ? 'bg-emerald-50/90 text-[#238636]' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold truncate">{farm.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {farm.district}, {farm.state} • {farm.area_acres} {t('common.acres')}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#238636] shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setFarmDropdownOpen(false);
                    navigate('/farms');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-[#238636] hover:bg-emerald-50 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add or Manage Farms
                </button>
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
