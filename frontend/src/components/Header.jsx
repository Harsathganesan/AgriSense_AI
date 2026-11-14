import React from 'react';
import {
  Menu,
  Languages,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
  const { lang, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
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
