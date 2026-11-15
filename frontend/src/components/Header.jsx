import React from 'react';
import {
  Menu,
  Languages,
  ShieldCheck,
  Leaf
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
  const { lang, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Mobile Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus:outline-none transition -ml-1"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Title */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#238636] to-emerald-700 flex items-center justify-center text-white shadow-xs">
            <Leaf className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
            AgriSense <span className="text-[#238636]">AI</span>
          </span>
        </div>
      </div>

      {/* Right Controls: Language Toggle & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title="Switch Language / மொழியை மாற்றுக"
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#238636] font-bold text-xs transition shadow-2xs active:scale-95"
        >
          <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
          <span className="sm:hidden">{lang === 'en' ? 'TA' : 'EN'}</span>
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100 cursor-pointer transition active:scale-95"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#238636] to-emerald-400 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <div className="hidden sm:block text-left text-xs leading-tight">
            <span className="font-bold text-slate-800 block truncate max-w-[110px] md:max-w-[140px]">
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
