import React, { useState } from 'react';
import {
  Tractor,
  Plus,
  MapPin,
  Layers,
  Droplet,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';

export default function MyFarmPage() {
  const { t, lang } = useLanguage();
  const { farms, activeFarm, setActiveFarm, addFarm, updateFarm, deleteFarm } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    district: 'Thanjavur',
    state: 'Tamil Nadu',
    latitude: 10.7870,
    longitude: 79.1378,
    area_acres: 4.0,
    soil_type: 'Alluvial Soil',
    irrigation_type: 'Canal & Borewell',
    current_crops: 'Rice / Paddy',
    previous_crops: 'Black Gram / Urad Dal, Sesame'
  });

  const openAddModal = () => {
    setEditingFarm(null);
    setFormData({
      name: '',
      district: 'Thanjavur',
      state: 'Tamil Nadu',
      latitude: 10.7870,
      longitude: 79.1378,
      area_acres: 3.5,
      soil_type: 'Alluvial Soil',
      irrigation_type: 'Canal & Borewell',
      current_crops: 'Rice / Paddy',
      previous_crops: 'Black Gram / Urad Dal, Sesame'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name,
      district: farm.district || 'Thanjavur',
      state: farm.state || 'Tamil Nadu',
      latitude: farm.latitude,
      longitude: farm.longitude,
      area_acres: farm.area_acres,
      soil_type: farm.soil_type,
      irrigation_type: farm.irrigation_type,
      current_crops: (farm.current_crops || []).join(', '),
      previous_crops: (farm.previous_crops || []).join(', ')
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      district: formData.district,
      state: formData.state,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      area_acres: Number(formData.area_acres),
      soil_type: formData.soil_type,
      irrigation_type: formData.irrigation_type,
      current_crops: formData.current_crops.split(',').map((s) => s.trim()).filter(Boolean),
      previous_crops: formData.previous_crops.split(',').map((s) => s.trim()).filter(Boolean),
      is_active: true
    };

    if (editingFarm) {
      await updateFarm(editingFarm.id, payload);
    } else {
      await addFarm(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (farmId) => {
    if (window.confirm("Are you sure you want to delete this farm record?")) {
      await deleteFarm(farmId);
    }
  };

  const tnDistricts = [
    "Thanjavur", "Tiruvarur", "Nagapattinam", "Mayiladuthurai",
    "Tiruchirappalli", "Madurai", "Coimbatore", "Cuddalore",
    "Salem", "Dindigul", "Erode", "Tirunelveli", "Virudhunagar"
  ];

  const soilTypes = [
    "Alluvial Soil", "Black Soil / Clay Loam", "Red Sandy Loam", "Sandy Loam", "Laterite"
  ];

  const irrigationTypes = [
    "Canal & Borewell", "Canal only", "Borewell only", "Drip Irrigation", "Rainfed", "Sprinkler"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Tractor className="w-7 h-7 text-[#238636]" />
            {t('nav.myFarm')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your land holdings, coordinates, soil characteristics, and active rotation cycles.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#238636] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition hover:scale-[1.02] active:scale-[0.98] w-fit"
        >
          <Plus className="w-4 h-4" />
          Add New Farm
        </button>
      </div>

      {/* Farm Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => {
          const isSelected = activeFarm && activeFarm.id === farm.id;
          return (
            <div
              key={farm.id}
              className={`bg-white rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {farm.district}, {farm.state}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                      {farm.name}
                    </h3>
                  </div>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#238636] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveFarm(farm)}
                      className="text-xs font-bold text-slate-500 hover:text-[#238636] px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition"
                    >
                      Set Active
                    </button>
                  )}
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-2 gap-2 my-4 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Area</span>
                    <span className="font-extrabold text-slate-800">{farm.area_acres} Acres</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Soil Type</span>
                    <span className="font-extrabold text-slate-800 truncate block">{farm.soil_type}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Irrigation Source</span>
                    <span className="font-extrabold text-slate-800">{farm.irrigation_type}</span>
                  </div>
                </div>

                {/* Coordinates & Crops */}
                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{farm.latitude.toFixed(4)}° N, {farm.longitude.toFixed(4)}° E</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Standing Crop:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {(farm.current_crops || []).join(', ') || 'None registered'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Previous Harvests:</span>
                    <span className="text-slate-600 text-[11px]">
                      {(farm.previous_crops || []).join(', ') || 'No previous history'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => openEditModal(farm)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-[#238636] font-bold transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                {farms.length > 1 && (
                  <button
                    onClick={() => handleDelete(farm.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-rose-600 font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {editingFarm ? "Edit Farm Properties" : "Register New Farm Land"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Enter farm location and agronomic details for NASA satellite telemetry sync.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cauvery River Organic Plot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">District</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm bg-white"
                  >
                    {tnDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.area_acres}
                    onChange={(e) => setFormData({ ...formData, area_acres: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Soil Classification</label>
                  <select
                    value={formData.soil_type}
                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm bg-white"
                  >
                    {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Irrigation System</label>
                  <select
                    value={formData.irrigation_type}
                    onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm bg-white"
                  >
                    {irrigationTypes.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Standing Crop</label>
                <input
                  type="text"
                  value={formData.current_crops}
                  onChange={(e) => setFormData({ ...formData, current_crops: e.target.value })}
                  placeholder="e.g. Rice / Paddy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Previous Crops (Comma separated)</label>
                <input
                  type="text"
                  value={formData.previous_crops}
                  onChange={(e) => setFormData({ ...formData, previous_crops: e.target.value })}
                  placeholder="e.g. Black Gram, Sesame"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                >
                  {editingFarm ? "Save Changes" : "Create Farm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

