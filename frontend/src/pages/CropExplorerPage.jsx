import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Search,
  Filter,
  Droplets,
  Calendar,
  Thermometer,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cropsApi } from '../services/api';

export default function CropExplorerPage() {
  const { t, lang } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState(null);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);
        const res = await cropsApi.list();
        setCrops(res.data);
      } catch (err) {
        console.error("Failed to load crops:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  const categories = ['All', 'Cereal', 'Pulse', 'Oilseed', 'Millet', 'Cash Crop', 'Green Manure'];

  const filteredCrops = crops.filter(c => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = c.name.toLowerCase().includes(q) ||
        c.tamil_name.toLowerCase().includes(q) ||
        (c.botanical_name && c.botanical_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sprout className="w-7 h-7 text-[#238636]" />
            {t('nav.cropExplorer')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Agronomic database of Tamil Nadu and peninsular crops, optimal seasons, water needs, and soil impacts.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search crop, botanical or தமிழ் பெயர்..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#238636] shadow-2xs"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#238636] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Crop Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCrops.map((crop) => (
          <div
            key={crop.id}
            onClick={() => setSelectedCrop(crop)}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Image Container */}
              <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={crop.image_url}
                  alt={crop.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900/75 text-white backdrop-blur-xs">
                    {crop.category}
                  </span>
                  {crop.is_nitrogen_fixing && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                      +N Fixer
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#238636] transition">
                    {crop.name}
                  </h3>
                </div>
                <p className="text-xs font-bold text-emerald-800 mb-2">
                  {crop.tamil_name}
                </p>
                <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed mb-4">
                  {lang === 'ta' && crop.description_tamil ? crop.description_tamil : crop.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{crop.duration_days_avg} Days</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>{crop.water_req_mm} mm</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-500">
                Soil: <span className="text-slate-800 font-bold">{crop.suitable_soils?.[0]}</span>
              </span>
              <span className="text-[11px] font-bold text-[#238636] group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedCrop && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {selectedCrop.botanical_name}
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  {selectedCrop.name}
                </h2>
                <p className="text-sm font-bold text-emerald-700">
                  {selectedCrop.tamil_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCrop(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {selectedCrop.description}
            </p>

            {/* Grid of Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Growth Duration</span>
                <span className="font-extrabold text-slate-800">{selectedCrop.duration_days_min} - {selectedCrop.duration_days_max} days</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Water Need</span>
                <span className="font-extrabold text-sky-700">{selectedCrop.water_req_mm} mm</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Drought Tolerance</span>
                <span className="font-extrabold text-emerald-800">{selectedCrop.drought_tolerance}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Temperature Tolerance</span>
                <span className="font-extrabold text-orange-700">{selectedCrop.temp_min_c}°C to {selectedCrop.temp_max_c}°C</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Soil pH Compatibility</span>
                <span className="font-extrabold text-slate-800">{selectedCrop.ph_min} - {selectedCrop.ph_max}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Average Yield</span>
                <span className="font-extrabold text-slate-800">{selectedCrop.avg_yield_kg_acre}</span>
              </div>
            </div>

            {/* Soil Health Impact & Nitrogen Fixation */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs mb-4">
              <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#238636]" />
                Nutrient Cycling & Nitrogen Role
              </h4>
              <p className="text-emerald-800 leading-relaxed">
                {selectedCrop.nutrient_benefits}
              </p>
              {selectedCrop.is_nitrogen_fixing && (
                <div className="mt-2 font-extrabold text-[#238636]">
                  Biological Nitrogen Fixed: +{selectedCrop.nitrogen_fixation_kg_ha} kg N/ha
                </div>
              )}
            </div>

            {/* Break Crop Compatibility */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Recommended Following / Break Crops:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCrop.break_crop_compatibility || []).map((b) => (
                    <span key={b} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-700 block mb-1">Pest & Disease Vulnerabilities to Monitor:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCrop.pests_diseases_susceptibility || []).map((p) => (
                    <span key={p} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-semibold text-xs border border-rose-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

