import React from 'react';

export default function StatCard({
  title,
  value,
  unit = '',
  icon: Icon,
  badgeText,
  badgeType = 'neutral',
  subtitle,
  accentColor = '#238636',
  trend
}) {
  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
      {/* Top Accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-transform origin-left scale-x-90 group-hover:scale-x-100"
        style={{ backgroundColor: accentColor }}
      />

      <div>
        <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block truncate">
            {title}
          </span>
          {Icon && (
            <div
              className="w-7 h-7 sm:w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1 my-0.5 sm:my-1">
          <span className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-xs sm:text-sm font-semibold text-slate-400">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] sm:text-xs">
        {subtitle && (
          <span className="text-slate-500 truncate text-[10px] sm:text-xs">
            {subtitle}
          </span>
        )}
        {badgeText && (
          <span
            className={`text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap shrink-0 ${badgeStyles[badgeType] || badgeStyles.neutral}`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

