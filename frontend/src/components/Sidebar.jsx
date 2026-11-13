import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Tractor,
  Satellite,
  FlaskConical,
  Sprout,
  RotateCcw,
  Sparkles,
  Map,
  FileText,
  History,
  Settings,
  Leaf,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Sidebar({ isOpen, onClose }) {
  const { t, lang } = useLanguage();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/farms', label: t('nav.myFarm'), icon: Tractor },
    { to: '/nasa-explorer', label: t('nav.nasaExplorer'), icon: Satellite, badge: 'Live' },
    { to: '/soil-health', label: t('nav.soilHealth'), icon: FlaskConical },
    { to: '/crop-explorer', label: t('nav.cropExplorer'), icon: Sprout },
    { to: '/rotation-planner', label: t('nav.rotationPlanner'), icon: RotateCcw, highlight: true },
    { to: '/ai-assistant', label: t('nav.aiAssistant'), icon: Sparkles, badge: 'AI' },
    { to: '/map', label: t('nav.farmMap'), icon: Map },
    { to: '/reports', label: t('nav.reports'), icon: FileText },
    { to: '/history', label: t('nav.history'), icon: History },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-[#238636] text-white shadow-sm shadow-[#238636]/30 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${item.highlight && !isActive ? 'border border-emerald-200 bg-emerald-50/40 text-emerald-800' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4.5 h-4.5 shrink-0 ${
                          isActive ? 'text-white' : item.highlight ? 'text-[#238636]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wider ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-emerald-100 text-[#238636]'
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

        {/* Footer info badge */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="rounded-xl p-3 bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                NASA Telemetry
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                POWER & SMAP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {lang === 'ta'
                ? 'நேரடி செயற்கைக்கோள் & மண் நலன் உத்திகள்'
                : 'Satellite analytics & ICAR soil heuristics active.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
