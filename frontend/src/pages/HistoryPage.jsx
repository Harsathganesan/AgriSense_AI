import React, { useState, useEffect } from 'react';
import {
  History,
  RotateCcw,
  FlaskConical,
  Satellite,
  FileText,
  Clock,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { historyApi } from '../services/api';

export default function HistoryPage() {
  const { t, lang } = useLanguage();
  const { activeFarm } = useFarm();

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await historyApi.list(activeFarm?.id);
      setHistoryItems(res.data || []);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeFarm]);

  const handleDelete = async (id) => {
    const confirmMsg = lang === 'ta'
      ? 'இந்த செயல்பாட்டுப் பதிவை நீக்க விரும்புகிறீர்களா?'
      : 'Remove this activity log?';
    if (window.confirm(confirmMsg)) {
      await historyApi.delete(id);
      await fetchHistory();
    }
  };

  const getTypeIcon = (type) => {
    if (type?.includes('Rotation')) return RotateCcw;
    if (type?.includes('Soil')) return FlaskConical;
    if (type?.includes('NASA')) return Satellite;
    if (type?.includes('Report')) return FileText;
    return Clock;
  };

  const getTypeColor = (type) => {
    if (type?.includes('Rotation')) return 'bg-emerald-100 text-[#238636] border-emerald-200';
    if (type?.includes('Soil')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (type?.includes('NASA')) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (type?.includes('Report')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const filterOptions = [
    { key: 'All', labelEn: 'All', labelTa: 'அனைத்தும்' },
    { key: 'Rotation', labelEn: 'Rotation', labelTa: 'சுழற்சி' },
    { key: 'Soil', labelEn: 'Soil', labelTa: 'மண்வளம்' },
    { key: 'NASA', labelEn: 'NASA', labelTa: 'நாசா' },
    { key: 'Report', labelEn: 'Report', labelTa: 'அறிக்கை' }
  ];

  const filtered = historyItems.filter((item) => {
    if (filterType === 'All') return true;
    return item.analysis_type?.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
            <History className="w-6 h-6 sm:w-7 sm:h-7 text-[#238636] shrink-0" />
            <span>{t('nav.history')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {lang === 'ta'
              ? 'அனைத்து பகுப்பாய்வுகள், நாசா தரவு ஒத்திசைவுகள் மற்றும் பரிந்துரைகளின் காலவரிசைப் பதிவு.'
              : 'Chronological audit log of all algorithmic analyses, NASA syncs, and generated recommendations.'}
          </p>
        </div>

        {/* Filter Pills with Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-1.5 bg-white p-1 sm:p-1.5 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold overflow-x-auto scrollbar-none w-full sm:w-auto">
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer ${
                filterType === f.key
                  ? 'bg-[#238636] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {lang === 'ta' ? f.labelTa : f.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* History Timeline List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>{lang === 'ta' ? 'செயல்பாட்டுப் பதிவுகள்' : 'Activity Timeline'}</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {filtered.length}
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>{lang === 'ta' ? 'வரலாறு பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading activity history...'}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {lang === 'ta' ? 'இந்த வடிகட்டலில் பதிவுகள் எதுவும் இல்லை.' : 'No history recorded matching this filter.'}
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {filtered.map((item) => {
              const Icon = getTypeIcon(item.analysis_type);
              const colorClass = getTypeColor(item.analysis_type);
              return (
                <div
                  key={item.id || item._id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border ${colorClass} mt-0.5`}>
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900">
                          {item.analysis_type}
                        </span>
                        {item.farm_name && (
                          <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[140px] sm:max-w-none">
                            • {item.farm_name}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {new Date(item.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed break-words">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id || item._id)}
                    className="p-2 -mr-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0 cursor-pointer"
                    title={lang === 'ta' ? 'பதிவை நீக்கு' : 'Delete log entry'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

