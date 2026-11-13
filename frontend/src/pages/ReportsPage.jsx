import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileDown,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  DownloadCloud,
  FileCheck2,
  Printer
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { reportsApi } from '../services/api';

export default function ReportsPage() {
  const { t, lang } = useLanguage();
  const { activeFarm } = useFarm();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.list();
      setReports(res.data);
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    if (!activeFarm) return;
    try {
      setGenerating(true);
      const res = await reportsApi.generate(activeFarm.id);
      if (res.data?.download_url) {
        window.open(res.data.download_url, '_blank');
      }
      await fetchReports();
    } catch (err) {
      console.error("Generate report error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-[#238636]" />
            {t('nav.reports')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export comprehensive, publication-grade agronomic diagnostic reports in PDF format.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#238636] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:scale-[1.02] active:scale-[0.98] w-fit"
        >
          <FileDown className="w-4 h-4" />
          {generating ? "Compiling PDF Report..." : "Generate New Farm Report"}
        </button>
      </div>

      {/* Report Features Showcase Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#238636] to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
          <FileCheck2 className="w-4 h-4" />
          Comprehensive Agricultural Decision Document
        </div>
        <h2 className="text-xl sm:text-2xl font-black">
          Official AgriSense Farm Health & Rotation Diagnostic
        </h2>
        <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
          Each report synthesized by AgriSense AI embeds your farm boundary profile, laboratory soil scorecard (pH, NPK, OC), NASA multispectral satellite telemetry (GPM rain, SMAP root-zone moisture, MODIS NDVI, SRTM elevation), 3-strategy MCDA crop sequence tables, and actionable fertilizer-saving guidelines.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="font-extrabold block text-white">Section 1</span>
            <span className="text-[11px] text-emerald-200">Farm & Land Profile</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="font-extrabold block text-white">Section 2</span>
            <span className="text-[11px] text-emerald-200">Soil Health Scorecard</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="font-extrabold block text-white">Section 3</span>
            <span className="text-[11px] text-emerald-200">NASA Earth Telemetry</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="font-extrabold block text-white">Section 4</span>
            <span className="text-[11px] text-emerald-200">3-Strategy Rotation Plan</span>
          </div>
        </div>
      </div>

      {/* Reports Archive Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            Generated Report Archive
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {reports.length} Reports
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <DownloadCloud className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No reports generated yet. Click "Generate New Farm Report" above to compile one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Document Title</th>
                  <th className="py-2.5 px-3">Farm Name</th>
                  <th className="py-2.5 px-3">Created On</th>
                  <th className="py-2.5 px-3">File Size</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reports.map((r) => (
                  <tr key={r.id || r._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-xs">{r.filename}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{r.farm_name}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(r.created_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{r.size_kb} KB</td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={r.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#238636] font-bold transition shadow-2xs"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
