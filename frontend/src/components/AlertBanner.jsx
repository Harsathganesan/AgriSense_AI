import React from 'react';
import { AlertTriangle, Info, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AlertBanner({ alerts = [] }) {
  const { lang } = useLanguage();

  if (!alerts || alerts.length === 0) return null;

  const severityConfig = {
    danger: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertOctagon,
      iconColor: 'text-rose-600',
      badge: 'Critical',
      badgeBg: 'bg-rose-100 text-rose-800'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      badge: 'Advisory',
      badgeBg: 'bg-amber-100 text-amber-800'
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: Info,
      iconColor: 'text-sky-600',
      badge: 'Observed',
      badgeBg: 'bg-sky-100 text-sky-800'
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      badge: 'Favorable',
      badgeBg: 'bg-emerald-100 text-emerald-800'
    }
  };

  return (
    <div className="space-y-2.5 my-4">
      {alerts.map((alert, index) => {
        const config = severityConfig[alert.severity] || severityConfig.info;
        const Icon = config.icon;
        const title = lang === 'ta' && alert.title_tamil ? alert.title_tamil : alert.title;
        const msg = lang === 'ta' && alert.message_tamil ? alert.message_tamil : alert.message;

        return (
          <div
            key={alert.id || index}
            className={`p-4 rounded-2xl border ${config.bg} flex items-start gap-3.5 shadow-2xs transition-all`}
          >
            <div className={`p-1 rounded-xl shrink-0 ${config.iconColor}`}>
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-sm text-slate-900">
                  {title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${config.badgeBg}`}>
                  {config.badge}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {msg}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

