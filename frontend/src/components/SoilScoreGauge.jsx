import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';

export default function SoilScoreGauge({ score = 75, grade = "Good", gradeTamil = "நன்று" }) {
  const normalizedScore = Math.min(100, Math.max(0, Number(score) || 0));

  // Determine color theme
  let color = '#238636'; // Green
  let bgColor = '#dcfce7';
  if (normalizedScore < 50) {
    color = '#e11d48'; // Rose
    bgColor = '#ffe4e6';
  } else if (normalizedScore < 70) {
    color = '#d97706'; // Amber
    bgColor = '#fef3c7';
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          <Award className="w-4 h-4 text-[#238636]" />
          Soil Health Scorecard
        </div>
        <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {grade} Soil Condition
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Index computed from laboratory pH, NPK balance, and soil organic carbon fraction.
        </p>
      </div>

      {/* Circular Gauge */}
      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-900 leading-none">
            {Math.round(normalizedScore)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-0.5">
            /100
          </span>
        </div>
      </div>
    </div>
  );
}
