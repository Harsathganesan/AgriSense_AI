import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Sprout,
  CalendarCheck2,
  RotateCcw,
  Sparkles,
  History,
  Settings,
  Leaf,
  MapPin,
  Stethoscope,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Sidebar({ isOpen, onClose }) {
  const { t, lang } = useLanguage();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/my-farm', label: t('nav.myFarm'), icon: MapPin },
    { to: '/soil-health', label: t('nav.soilHealth'), icon: FlaskConical },
    { to: '/crop-explorer', label: t('nav.cropExplorer'), icon: Sprout },
    { to: '/agri-tracker', label: t('nav.agriTracker'), icon: CalendarCheck2, badge: 'Track' },
    { to: '/plant-doctor', label: t('nav.plantDoctor') || (lang === 'ta' ? 'பயிர் மருத்துவர்' : 'Plant Doctor'), icon: Stethoscope, badge: 'AI' },
    { to: '/rotation-planner', label: t('nav.rotationPlanner'), icon: RotateCcw },
    { to: '/ai-assistant', label: t('nav.aiAssistant'), icon: Sparkles, badge: 'AI' },
    { to: '/history', label: t('nav.history'), icon: History },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:w-64 lg:translate-x-0 m-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo and Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#238636] to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Leaf className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                AgriSense <span className="text-[#238636]">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                NASA Earth Agro-Platform
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 overscroll-contain">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-[#238636] text-white shadow-sm shadow-[#238636]/30 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wider ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-emerald-50 text-[#238636] border border-emerald-200/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
