import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  LayoutDashboard,
  MapPin,
  Stethoscope,
  FlaskConical,
  CalendarCheck2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lang } = useLanguage();

  const mobileNavItems = [
    { to: '/', label: lang === 'ta' ? 'முகப்பு' : 'Home', icon: LayoutDashboard },
    { to: '/my-farm', label: lang === 'ta' ? 'பண்ணை' : 'My Farm', icon: MapPin },
    { to: '/plant-doctor', label: lang === 'ta' ? 'மருத்துவர்' : 'Doctor', icon: Stethoscope },
    { to: '/soil-health', label: lang === 'ta' ? 'மண் நலம்' : 'Soil', icon: FlaskConical },
    { to: '/agri-tracker', label: lang === 'ta' ? 'டிராக்கர்' : 'Tracker', icon: CalendarCheck2 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sidebar for Desktop & Drawer for Mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-2.5 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb Friendly & Safe Area Aware) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 min-w-0 ${
                  isActive
                    ? 'text-[#238636] font-extrabold'
                    : 'text-slate-400 hover:text-slate-600 font-semibold'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-emerald-50 text-[#238636] scale-110' : ''}`}>
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
