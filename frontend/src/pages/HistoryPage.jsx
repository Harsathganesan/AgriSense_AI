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
  Filter
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
      setHistoryItems(res.data);
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
    if (window.confirm("Remove this activity log?")) {
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

  const filtered = historyItems.filter((item) => {
    if (filterType === 'All') return true;
    return item.analysis_type?.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-[#238636]" />
            {t('nav.history')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chronological audit log of all algorithmic analyses, NASA syncs, and generated recommendations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold">
          {['All', 'Rotation', 'Soil', 'NASA', 'Report'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterType === f ? 'bg-[#238636] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* History Timeline List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">
          Activity Timeline ({filtered.length} Entries)
        </h3>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No history recorded matching this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const Icon = getTypeIcon(item.analysis_type);
              const colorClass = getTypeColor(item.analysis_type);
              return (
                <div
                  key={item.id || item._id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${colorClass}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900">
                          {item.analysis_type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          • {item.farm_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {new Date(item.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id || item._id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 transition shrink-0"
                    title="Delete log entry"
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
