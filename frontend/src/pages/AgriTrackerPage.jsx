import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck2,
  Droplets,
  CloudRain,
  Volume2,
  VolumeX,
  Building,
  Sprout,
  Layers,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

// Pre-configured agronomic crop lifecycles for Tamil Nadu districts
const CROP_TEMPLATES = {
  groundnut: {
    id: 'groundnut',
    name: 'Groundnut (நிலக்கடலை)',
    name_ta: 'நிலக்கடலை',
    variety: 'VRI 2 / TMV 7 / Dharani',
    category: 'Oilseed',
    total_days: 105,
    water_req_mm: 450,
    stages: [
      { id: 1, name: 'Sowing & Germination', name_ta: 'விதைப்பு மற்றும் முளைப்பு', start_day: 1, end_day: 10 },
      { id: 2, name: 'Vegetative Growth', name_ta: 'செடி வளர்ச்சிப் பருவம்', start_day: 11, end_day: 35 },
      { id: 3, name: 'Flowering & Pegging', name_ta: 'பூக்கும் மற்றும் விழுது பாய்தல்', start_day: 36, end_day: 60 },
      { id: 4, name: 'Pod Formation & Filling', name_ta: 'காய் பிடிக்கும் பருவம்', start_day: 61, end_day: 85 },
      { id: 5, name: 'Maturation & Harvest', name_ta: 'முதிர்ச்சி மற்றும் அறுவடை', start_day: 86, end_day: 105 }
    ],
    irrigations: [
      { id: 'i1', day: 1, stage: 'Sowing Irrigation (விதைப்பு நீர்)' },
      { id: 'i2', day: 5, stage: 'Life Irrigation (உயிர் தண்ணீர்)' },
      { id: 'i3', day: 20, stage: 'Vegetative Irrigation (வளர்ச்சி நீர்)' },
      { id: 'i4', day: 38, stage: 'Flowering Irrigation (பூக்கும் பருவம்)' },
      { id: 'i5', day: 52, stage: 'Pegging Irrigation (விழுது பாயும் நீர்)' },
      { id: 'i6', day: 70, stage: 'Pod Filling Irrigation (காய் வளர்ச்சி)' },
      { id: 'i7', day: 88, stage: 'Maturation Irrigation (பருப்பு முதிர்ச்சி)' }
    ],
    fertilizers: [
      {
        id: 'f1',
        day: 1,
        stage: 'Basal Application (அடி உரம்)',
        dosage: '5 tonnes FYM + 40 kg DAP + 25 kg MOP + 100 kg Neem cake / acre',
        dosage_ta: '5 டன் தொழுவுரம் + 40 கிலோ DAP + 25 கிலோ பொட்டாஷ் + 100 கிலோ வேப்பம் புண்ணாக்கு / ஏக்கர்'
      },
      {
        id: 'f2',
        day: 25,
        stage: 'Top Dressing 1 (முதல் மேலுரம்)',
        dosage: '20 kg Urea + 80 kg Gypsum / acre',
        dosage_ta: '20 கிலோ யூரியா + 80 கிலோ ஜிப்சம் / ஏக்கர்'
      },
      {
        id: 'f3',
        day: 45,
        stage: 'Flower Booster (பூ பூக்கும் சமயம்)',
        dosage: '2 kg Groundnut Wonder in 200 L water + 200 g Borax / acre',
        dosage_ta: '2 கிலோ நிலக்கடலை வொண்டர் + 200 கிராம் போரான் (200 லி நீரில்) / ஏக்கர்'
      },
      {
        id: 'f4',
        day: 65,
        stage: 'Pod Hardening (காய் முற்றும் சமயம்)',
        dosage: '2 kg MOP in 200 L water / acre',
        dosage_ta: '2 கிலோ பொட்டாஷ் (200 லிட்டர் நீரில்) / ஏக்கர்'
      }
    ]
  },
  paddy: {
    id: 'paddy',
    name: 'Paddy / Rice (நெல்)',
    name_ta: 'நெல்',
    variety: 'ADT 43 / CR 1009 / ASD 16',
    category: 'Cereal',
    total_days: 120,
    water_req_mm: 1100,
    stages: [
      { id: 1, name: 'Transplanting & Anchor', name_ta: 'நடவு மற்றும் வேர் பிடித்தல்', start_day: 1, end_day: 20 },
      { id: 2, name: 'Active Tillering', name_ta: 'தூர்கட்டும் பருவம்', start_day: 21, end_day: 45 },
      { id: 3, name: 'Panicle Initiation', name_ta: 'கதிர் உருவாகும் பருவம்', start_day: 46, end_day: 75 },
      { id: 4, name: 'Grain Filling', name_ta: 'பால் பிடிக்கும் மற்றும் தானிய நிரம்பல்', start_day: 76, end_day: 100 },
      { id: 5, name: 'Harvest & Ripening', name_ta: 'முதிர்ச்சி மற்றும் அறுவடை', start_day: 101, end_day: 120 }
    ],
    irrigations: [
      { id: 'pi1', day: 1, stage: 'Transplanting Submergence (நடவு நீர்)' },
      { id: 'pi2', day: 10, stage: 'Seedling Establishment (உயிர் நீர்)' },
      { id: 'pi3', day: 25, stage: 'Tillering Irrigation (தூர்கட்டும் நீர்)' },
      { id: 'pi4', day: 48, stage: 'Panicle Irrigation (கதிர் உருவாகும் நீர்)' },
      { id: 'pi5', day: 78, stage: 'Milking Stage (பால் பிடிக்கும் நீர்)' }
    ],
    fertilizers: [
      {
        id: 'pf1',
        day: 1,
        stage: 'Basal (அடி உரம்)',
        dosage: '50 kg DAP + 25 kg MOP + 10 kg Zinc Sulphate / acre',
        dosage_ta: '50 கிலோ DAP + 25 கிலோ பொட்டாஷ் + 10 கிலோ ஜிங்க் சல்பேட் / ஏக்கர்'
      },
      {
        id: 'pf2',
        day: 25,
        stage: 'Tillering Top Dressing (முதல் மேலுரம்)',
        dosage: '30 kg Urea + 2 kg Azospirillum / acre',
        dosage_ta: '30 கிலோ யூரியா + 2 கிலோ அசோஸ்பைரில்லம் / ஏக்கர்'
      },
      {
        id: 'pf3',
        day: 50,
        stage: 'Panicle Top Dressing (இரண்டாம் மேலுரம்)',
        dosage: '25 kg Urea + 15 kg MOP / acre',
        dosage_ta: '25 கிலோ யூரியா + 15 கிலோ பொட்டாஷ் / ஏக்கர்'
      }
    ]
  },
  blackgram: {
    id: 'blackgram',
    name: 'Black Gram / Urad (உளுந்து)',
    name_ta: 'உளுந்து',
    variety: 'Vamban 8 / Vamban 11 / ADT 5',
    category: 'Pulse',
    total_days: 75,
    water_req_mm: 220,
    stages: [
      { id: 1, name: 'Sowing & Emergence', name_ta: 'விதைப்பு மற்றும் முளைப்பு', start_day: 1, end_day: 10 },
      { id: 2, name: 'Vegetative Growth', name_ta: 'செடி வளர்ச்சிப் பருவம்', start_day: 11, end_day: 30 },
      { id: 3, name: 'Flowering & Podding', name_ta: 'பூக்கும் மற்றும் நெற்று உருவாகும் பருவம்', start_day: 31, end_day: 50 },
      { id: 4, name: 'Harvest & Drying', name_ta: 'முதிர்ச்சி மற்றும் அறுவடை', start_day: 51, end_day: 75 }
    ],
    irrigations: [
      { id: 'bi1', day: 1, stage: 'Sowing Irrigation (விதைப்பு நீர்)' },
      { id: 'bi2', day: 28, stage: 'Pre-flowering Irrigation (பூக்கும் முன் நீர்)' }
    ],
    fertilizers: [
      {
        id: 'bf1',
        day: 1,
        stage: 'Basal Seed Inoculation (விதை நேர்த்தி & அடி உரம்)',
        dosage: '25 kg DAP / acre + 200 g Rhizobium packet',
        dosage_ta: '25 கிலோ DAP / ஏக்கர் + 200 கிராம் ரைசோபியம் பாக்கெட்'
      },
      {
        id: 'bf2',
        day: 35,
        stage: 'Flowering Spray (பூக்கும் சமயம்)',
        dosage: '2 kg Pulse Wonder in 200 L water / acre',
        dosage_ta: '2 கிலோ பல்ஸ் வொண்டர் (200 லி நீரில்) / ஏக்கர்'
      }
    ]
  }
};

// Generates dynamic lifecycle if another crop was tracked from Crop Explorer
const getCropLifecycle = (cropData) => {
  if (!cropData) return CROP_TEMPLATES.groundnut;
  const name = (cropData.name || '').toLowerCase();
  const tamilName = cropData.tamil_name || cropData.name || '';

  if (name.includes('groundnut') || name.includes('peanut') || tamilName.includes('நிலக்கடலை')) {
    return CROP_TEMPLATES.groundnut;
  }
  if (name.includes('paddy') || name.includes('rice') || tamilName.includes('நெல்')) {
    return CROP_TEMPLATES.paddy;
  }
  if (name.includes('black') || name.includes('urad') || name.includes('pulse') || tamilName.includes('உளுந்து')) {
    return CROP_TEMPLATES.blackgram;
  }

  // Dynamic template for any custom crop from Crop Explorer catalog
  const totalDays = cropData.duration_days_avg || 100;
  const waterReq = cropData.water_req_mm || 450;
  return {
    id: cropData.id || name,
    name: cropData.name,
    name_ta: cropData.tamil_name || cropData.name,
    variety: cropData.variety || 'Recommended TNAU Variety',
    category: cropData.category || 'Field Crop',
    total_days: totalDays,
    water_req_mm: waterReq,
    stages: [
      { id: 1, name: 'Sowing & Germination', name_ta: 'விதைப்பு மற்றும் முளைப்பு', start_day: 1, end_day: Math.max(10, Math.round(totalDays * 0.1)) },
      { id: 2, name: 'Vegetative Growth', name_ta: 'செடி வளர்ச்சிப் பருவம்', start_day: Math.max(11, Math.round(totalDays * 0.1) + 1), end_day: Math.round(totalDays * 0.35) },
      { id: 3, name: 'Flowering & Podding', name_ta: 'பூக்கும் & காய் பிடிக்கும் பருவம்', start_day: Math.round(totalDays * 0.35) + 1, end_day: Math.round(totalDays * 0.75) },
      { id: 4, name: 'Maturation & Harvest', name_ta: 'முதிர்ச்சி மற்றும் அறுவடை', start_day: Math.round(totalDays * 0.75) + 1, end_day: totalDays }
    ],
    irrigations: [
      { id: 'di1', day: 1, stage: 'Sowing Irrigation (விதைப்பு நீர்)' },
      { id: 'di2', day: Math.round(totalDays * 0.08), stage: 'Life Irrigation (உயிர் தண்ணீர்)' },
      { id: 'di3', day: Math.round(totalDays * 0.25), stage: 'Vegetative Irrigation (வளர்ச்சி நீர்)' },
      { id: 'di4', day: Math.round(totalDays * 0.5), stage: 'Flowering Irrigation (பூக்கும் பருவம்)' },
      { id: 'di5', day: Math.round(totalDays * 0.75), stage: 'Maturation Irrigation (காய் வளர்ச்சி)' }
    ],
    fertilizers: [
      {
        id: 'df1',
        day: 1,
        stage: 'Basal Application (அடி உரம்)',
        dosage: 'FYM 5 tonnes + DAP 40 kg + Potash 25 kg / acre',
        dosage_ta: '5 டன் தொழுவுரம் + 40 கிலோ DAP + 25 கிலோ பொட்டாஷ் / ஏக்கர்'
      },
      {
        id: 'df2',
        day: Math.round(totalDays * 0.25),
        stage: 'Top Dressing 1 (முதல் மேலுரம்)',
        dosage: 'Urea 30 kg / acre',
        dosage_ta: '30 கிலோ யூரியா / ஏக்கர்'
      },
      {
        id: 'df3',
        day: Math.round(totalDays * 0.5),
        stage: 'Booster Top Dressing (இரண்டாம் மேலுரம்)',
        dosage: '1% Micronutrient Foliar Spray / acre',
        dosage_ta: '1% நுண்ணூட்டக் கரைசல் தெளிப்பு / ஏக்கர்'
      }
    ]
  };
};

export default function AgriTrackerPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const initialDistrict = user?.registered_location?.district || user?.district || 'Pudukkottai';

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [currentDay, setCurrentDay] = useState(18);
  const [rainfallAmountMm, setRainfallAmountMm] = useState(0.0); // Default clear/dry (0 mm)
  const [speaking, setSpeaking] = useState(false);

  // User requirement: ONLY what we clicked 'Track' on in Crop Explorer must be present in Agri Tracker!
  const [trackedCropsList, setTrackedCropsList] = useState(() => {
    try {
      const savedList = localStorage.getItem('agrisense_tracked_crops_list');
      if (savedList) return JSON.parse(savedList);
      const savedSingle = localStorage.getItem('agrisense_tracked_crop');
      return savedSingle ? [JSON.parse(savedSingle)] : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedTrackedItem, setSelectedTrackedItem] = useState(() => {
    try {
      const savedList = localStorage.getItem('agrisense_tracked_crops_list');
      if (savedList) {
        const parsed = JSON.parse(savedList);
        if (parsed.length > 0) return parsed[0];
      }
      const savedSingle = localStorage.getItem('agrisense_tracked_crop');
      return savedSingle ? JSON.parse(savedSingle) : null;
    } catch (e) {
      return null;
    }
  });

  // Flow: First show ONLY the crop name card. Only when clicked, show the next tracking page!
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  // Rain condition: Only show indication if rain exceeds 20.0 mm
  const isHeavyRain = rainfallAmountMm > 20.0;

  // Sync tracked crops from localStorage and events
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const savedList = localStorage.getItem('agrisense_tracked_crops_list');
        if (savedList) {
          const parsed = JSON.parse(savedList);
          setTrackedCropsList(parsed);
          if (parsed.length > 0 && !selectedTrackedItem) {
            setSelectedTrackedItem(parsed[0]);
          }
          return;
        }
        const savedSingle = localStorage.getItem('agrisense_tracked_crop');
        if (savedSingle) {
          const parsed = JSON.parse(savedSingle);
          setTrackedCropsList([parsed]);
          if (!selectedTrackedItem) setSelectedTrackedItem(parsed);
        } else {
          setTrackedCropsList([]);
        }
      } catch (e) {
        setTrackedCropsList([]);
      }
    };

    handleUpdate();
    window.addEventListener('agrisense_tracked_crop_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('agrisense_tracked_crop_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const activeCrop = selectedTrackedItem
    ? getCropLifecycle(selectedTrackedItem.crop)
    : (trackedCropsList.length > 0 ? getCropLifecycle(trackedCropsList[0].crop) : CROP_TEMPLATES.groundnut);

  const activeDistrict = selectedTrackedItem?.district || selectedDistrict;

  // Active Stage
  const currentStage = activeCrop.stages.find(
    (s) => currentDay >= s.start_day && currentDay <= s.end_day
  ) || activeCrop.stages[0];

  const daysRemaining = Math.max(0, activeCrop.total_days - currentDay);
  const progressPct = Math.min(100, Math.round((currentDay / activeCrop.total_days) * 100));

  // Voice speech synthesis
  const handleVoiceGuidance = () => {
    if (!('speechSynthesis' in window)) {
      alert(lang === 'ta' ? 'உங்கள் உலாவியில் குரல் வசதி இல்லை.' : 'Voice speech not supported on this browser.');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    let speechText = '';
    if (lang === 'ta') {
      speechText = `வணக்கம் விவசாயி! இன்று உங்கள் ${activeCrop.name_ta} பயிரின் ${currentDay}-வது நாள். பருவம்: ${currentStage.name_ta}. `;
      if (isHeavyRain) {
        speechText += `கவனம்! ${activeDistrict} மாவட்டத்தில் ${rainfallAmountMm} மில்லிமீட்டர் கனமழை பதிவாகியுள்ளது. எனவே இன்று மோட்டார் போட வேண்டாம். நிலத்தில் நல்ல ஈரப்பதம் உள்ளது. 4 நாட்களுக்கு தண்ணீர் விடத் தேவையில்லை. மோட்டார் கரண்ட் மிச்சமாகும்! `;
      } else {
        speechText += `வானிலை சீராக உள்ளது. அட்டவணைப்படி தண்ணீர் பாய்ச்சவும். `;
      }
      speechText += `அடுத்த உரம் 25-வது நாளில் இட வேண்டும்.`;
    } else {
      speechText = `Hello Farmer! Today is day ${currentDay} for your ${activeCrop.name}. Stage: ${currentStage.name}. `;
      if (isHeavyRain) {
        speechText += `Attention! ${rainfallAmountMm} millimeters of heavy rain has been recorded in ${activeDistrict}. Do not turn on your irrigation motor today. Natural rain provides enough moisture. Next watering is postponed by 4 days. You save pump electricity! `;
      } else {
        speechText += `Weather is clear. Proceed with scheduled irrigation. `;
      }
      speechText += `Your next fertilizer is due on day 25.`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // =========================================================================
  // VIEW 1: FIRST ONLY SHOW THE CROP NAME (ONLY crops clicked Track in Crop Explorer!)
  // Only when clicked, open the next tracking page!
  // =========================================================================
  if (!isTrackingActive) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in-50">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#238636] text-xs font-bold border border-emerald-200 mb-2">
            <Building className="w-3.5 h-3.5" />
            <span>{activeDistrict} District</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck2 className="w-7 h-7 text-[#238636]" />
            {lang === 'ta' ? 'அக்ரி டிராக்கர் (பயிர் வழிகாட்டி)' : 'Agri Tracker (Crop Lifecycle Manager)'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
            {lang === 'ta'
              ? 'பயிர் எக்ஸ்ப்ளோரரில் நீங்கள் தேர்ந்தெடுத்த பயிர் மட்டுமே இங்கு காட்டப்படும். அட்டவணையைப் பார்க்க பயிரைத் தொடவும்.'
              : 'Only crops selected in Crop Explorer appear here. Click the crop card to view its tracking schedule.'}
          </p>
        </div>

        {/* Empty State: If no crop has been tracked in Crop Explorer yet */}
        {trackedCropsList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#238636] flex items-center justify-center mx-auto mb-2 border border-emerald-100">
              <Sprout className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              {lang === 'ta' ? 'கண்காணிக்கப்படும் பயிர்கள் எதுவும் இல்லை' : 'No Crops Being Tracked Yet'}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
              {lang === 'ta'
                ? 'பயிர் எக்ஸ்ப்ளோரருக்குச் சென்று நீங்கள் சாகுபடி செய்ய விரும்பும் பயிரில் "Track Plan 🚀" கிளிக் செய்யவும். அந்த பயிர் மட்டுமே இங்கு தோன்றும்.'
                : 'Go to Crop Explorer and click "Track Plan 🚀" on the crop you want to cultivate. Only that crop will be present here in Agri Tracker.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/crop-explorer')}
                className="px-5 py-2.5 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                {lang === 'ta' ? 'பயிர் எக்ஸ்ப்ளோரருக்குச் செல் 🚀' : 'Go to Crop Explorer 🚀'}
              </button>
            </div>
          </div>
        ) : (
          /* ONLY crops clicked Track in Crop Explorer are displayed here! */
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {lang === 'ta' ? 'Crop Explorer-ல் நீங்கள் தேர்வுசெய்த பயிர்:' : 'Your Tracked Crop from Crop Explorer:'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {trackedCropsList.map((item, index) => {
                const crop = item.crop;
                const cropDist = item.district || activeDistrict;
                const lifecycle = getCropLifecycle(crop);

                return (
                  <div
                    key={crop.id || index}
                    onClick={() => {
                      setSelectedTrackedItem(item);
                      setSelectedDistrict(cropDist);
                      setIsTrackingActive(true);
                    }}
                    className="p-6 rounded-2xl border border-[#238636]/60 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 transition-all cursor-pointer group shadow-xs hover:shadow-md ring-2 ring-[#238636]/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">🌱</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>{lang === 'ta' ? 'செயலில் உள்ளது ⏳' : 'On Process ⏳'}</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 group-hover:text-[#238636] transition leading-snug">
                      {lang === 'ta' ? (crop.tamil_name || crop.name) : crop.name}
                    </h3>

                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      {cropDist} District • {lifecycle.total_days} {lang === 'ta' ? 'நாட்கள் திட்டம்' : 'Days Plan'}
                    </p>

                    {item.area_acres && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-[#238636] border border-emerald-200">
                          🌾 {item.area_acres} {lang === 'ta' ? 'ஏக்கர்' : 'Acres'}
                        </span>
                        {item.soil_type && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate">
                            {item.soil_type}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#238636]">
                      <span>{lang === 'ta' ? 'சாகுபடி அட்டவணையைப் பார்க்க' : 'View Tracking Schedule'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: NEXT TRACKING PAGE (Shown ONLY when the crop name is clicked!)
  // =========================================================================
  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50">
      {/* 1. Header with Back Button */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#238636] text-xs font-bold border border-emerald-200 mb-2 flex-wrap">
            <Building className="w-3.5 h-3.5" />
            <span>{activeDistrict} District • {lang === 'ta' ? activeCrop.name_ta : activeCrop.name}</span>
            {selectedTrackedItem?.area_acres && (
              <span className="text-emerald-800 font-extrabold">• 🌾 {selectedTrackedItem.area_acres} {lang === 'ta' ? 'ஏக்கர்' : 'Acres'}</span>
            )}
            {selectedTrackedItem?.soil_type && (
              <span className="text-slate-600 font-semibold">• {selectedTrackedItem.soil_type}</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck2 className="w-7 h-7 text-[#238636]" />
            {lang === 'ta' ? activeCrop.name_ta : activeCrop.name} - {lang === 'ta' ? 'சாகுபடி அட்டவணை' : 'Tracking Schedule'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
            {lang === 'ta'
              ? `${activeDistrict} மாவட்டத்திற்கான நாள்வாரியான நீர் பாசனம் & உர அட்டவணை.`
              : `Day-by-day irrigation stages & certified fertilizer dosages for ${activeDistrict}.`}
          </p>
        </div>

        {/* Back to Crops Button */}
        <button
          type="button"
          onClick={() => setIsTrackingActive(false)}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition cursor-pointer self-start md:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'ta' ? 'பயிர்கள் பட்டியல் (Back)' : 'Back to Crops'}</span>
        </button>
      </div>

      {/* 2. Selected District & Crop Agro Summary Strip */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white p-5 rounded-2xl border border-emerald-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#238636] text-white">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-black text-slate-900 block leading-tight">
                {lang === 'ta'
                  ? `${activeDistrict} மாவட்ட பயிர் சாகுபடி நிலவரம்:`
                  : `${activeDistrict} Live Cultivation Status:`}
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                {lang === 'ta' ? activeCrop.name_ta : activeCrop.name} • {activeCrop.variety}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Audio Speech Button */}
            <button
              type="button"
              onClick={handleVoiceGuidance}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                speaking
                  ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#238636]" />}
              <span>{speaking ? (lang === 'ta' ? 'குரல் நிறுத்து' : 'Stop Audio') : (lang === 'ta' ? 'குரலில் கேட்க 🔊' : 'Listen Advice 🔊')}</span>
            </button>

            {/* Rain Simulation Toggle (> 20mm vs 0mm) */}
            <button
              type="button"
              onClick={() => setRainfallAmountMm((prev) => (prev > 20 ? 0.0 : 25.0))}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                isHeavyRain
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Toggle rain simulation (>20mm)"
            >
              <span>{isHeavyRain ? '🌧️ Rain Active (25 mm)' : '☀️ Test Rain (>20mm)'}</span>
            </button>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-emerald-800 border border-emerald-300">
              {activeCrop.total_days} {lang === 'ta' ? 'நாட்கள் திட்டம்' : 'Days Total'}
            </span>
          </div>
        </div>

        {/* 4 Quick Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Card 1: Crop Age */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#238636]" />
              {lang === 'ta' ? 'பயிரின் வயது' : 'Crop Age'}
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              Day {currentDay} <span className="text-xs font-semibold text-slate-400">/ {activeCrop.total_days}</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">
              {daysRemaining} {lang === 'ta' ? 'நாட்களில் அறுவடை' : 'days to harvest'}
            </span>
          </div>

          {/* Card 2: Current Stage */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-amber-600" />
              {lang === 'ta' ? 'தற்போதைய பருவம்' : 'Active Stage'}
            </span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block truncate">
              {lang === 'ta' ? currentStage.name_ta : currentStage.name}
            </span>
            <span className="text-[10px] font-semibold text-slate-600">
              {progressPct}% {lang === 'ta' ? 'முன்னேற்றம்' : 'Completed'}
            </span>
          </div>

          {/* Card 3: Next Watering */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              {lang === 'ta' ? 'அடுத்த தண்ணீர்' : 'Next Watering'}
            </span>
            <span className="text-sm font-extrabold text-sky-900 mt-0.5 block">
              {isHeavyRain ? (lang === 'ta' ? 'நாள் 22 (தள்ளிவைப்பு)' : 'Day 22 (Rescheduled)') : 'Day 20'}
            </span>
            <span className={`text-[10px] font-semibold ${isHeavyRain ? 'text-rose-600' : 'text-emerald-700'}`}>
              {isHeavyRain ? (lang === 'ta' ? 'மழையால் நிறுத்தம் 🛑' : 'Paused by Rain 🛑') : (lang === 'ta' ? 'அட்டவணை தயார்' : 'On Schedule')}
            </span>
          </div>

          {/* Card 4: Next Fertilizer */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'ta' ? 'அடுத்த உரம்' : 'Next Fertilizer'}
            </span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block truncate">
              Day 25
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">
              {lang === 'ta' ? 'இன்னும் 7 நாட்களில்' : 'In 7 days'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. NASA REAL-TIME RAIN TELEMETRY - ONLY SHOWN IF RAINFALL > 20.0 mm */}
      {isHeavyRain && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50/40 to-white border border-sky-300 ring-2 ring-sky-300/30 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <CloudRain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-700 text-white shadow-xs">
                    🌧️ NASA Rain Telemetry
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {activeDistrict} District • {rainfallAmountMm} mm Recorded (&gt; 20 mm)
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {lang === 'ta'
                    ? 'கனமழை (20 மி.மீ-க்கு மேல்) பதிவாகியுள்ளது: பாசனம் தானாகவே நிறுத்தி வைக்கப்பட்டுள்ளது (Watering Paused)'
                    : 'Heavy Rain Detected (&gt; 20 mm): Irrigation Rescheduled Automatically (Watering Paused)'}
                </h3>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl font-medium">
                  {lang === 'ta'
                    ? `நாசா செயற்கைக்கோள் தரவுகளின்படி ${activeDistrict} மாவட்டத்தில் ${rainfallAmountMm} மி.மீ மழை பெய்துள்ளது. நிலத்தில் போதுமான ஈரப்பதம் உள்ளதால் இன்றைய பாசனம் நிறுத்தப்பட்டு 4 நாட்கள் தள்ளி வைக்கப்பட்டுள்ளது. 2.5 மணி நேர பம்பு மின்சாரமும் மிச்சமாகிறது!`
                    : `Over 20 mm natural rainfall recorded in ${activeDistrict}. Root zone moisture is saturated. Motor irrigation is automatically paused for 4 days, saving pump electricity!`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRainfallAmountMm(0.0)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer shrink-0 self-start sm:self-center"
            >
              {lang === 'ta' ? 'மழையை நீக்கு (Clear)' : 'Clear Rain'}
            </button>
          </div>

          {/* Rain Impact Indicators Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 border-t border-sky-200/70 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-sky-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'ta' ? 'மழை அளவு' : 'Recorded Rain'}</span>
              <span className="text-sm font-extrabold text-sky-800">{rainfallAmountMm} mm</span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-sky-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'ta' ? 'பாசன நிலை' : 'Watering Status'}</span>
              <span className="text-sm font-extrabold text-rose-700">{lang === 'ta' ? 'நிறுத்தப்பட்டது 🛑' : 'Paused 🛑'}</span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-sky-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'ta' ? 'அடுத்த பாசனம்' : 'Next Irrigation'}</span>
              <span className="text-sm font-extrabold text-[#238636]">{lang === 'ta' ? 'நாள் 24 அன்று' : 'Day 24'} (+4d)</span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-sky-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'ta' ? 'மிச்சமான மின்சாரம்' : 'Pump Time Saved'}</span>
              <span className="text-sm font-extrabold text-emerald-800">2.5 {lang === 'ta' ? 'மணி நேரம்' : 'Hours'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. TWO COLUMNS: IRRIGATION SCHEDULE & FERTILIZER SCHEDULE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1: IRRIGATION SCHEDULE (Watering time removed) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <Droplets className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {lang === 'ta' ? 'நீர் பாசன அட்டவணை' : 'Irrigation Schedule'}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {lang === 'ta' ? 'எந்த நாளில் எதற்கு பாசனம் செய்ய வேண்டும்' : 'Day & Irrigation Stage'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
              {activeCrop.water_req_mm} mm {lang === 'ta' ? 'மொத்த தேவை' : 'Total'}
            </span>
          </div>

          {/* Irrigation Items: Day + Stage - Watering time removed */}
          <div className="space-y-2.5">
            {activeCrop.irrigations.map((irr) => {
              const isNear = Math.abs(currentDay - irr.day) <= 4;
              const isPausedByRain = isHeavyRain && isNear;

              return (
                <div
                  key={irr.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPausedByRain
                      ? 'bg-sky-50/70 border-sky-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white shrink-0">
                        {lang === 'ta' ? `நாள் ${irr.day}` : `Day ${irr.day}`}
                      </span>

                      {/* Ethuku nu (Stage / Purpose) */}
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {irr.stage}
                      </h4>
                    </div>

                    {isPausedByRain && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300 shrink-0">
                        {lang === 'ta' ? '🌧️ மழையால் நிறுத்தம்' : '🌧️ Paused by Rain'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: FERTILIZER SCHEDULE (No Method, No Description) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-[#238636] border border-emerald-100">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {lang === 'ta' ? 'உர மேலாண்மை அட்டவணை' : 'Fertilizer Schedule'}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {lang === 'ta' ? 'எந்த நாளில் எதற்கு & எவ்வளவு உரம் இட வேண்டும்' : 'Day, Purpose & Fertilizer Dosage'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {lang === 'ta' ? 'TNAU பரிந்துரை' : 'TNAU Certified'}
            </span>
          </div>

          {/* Fertilizer Items: Day + Stage (Ethuku nu) + Exact Dosage */}
          <div className="space-y-2.5">
            {activeCrop.fertilizers.map((fert) => (
              <div
                key={fert.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white shrink-0 mt-0.5">
                    {lang === 'ta' ? `நாள் ${fert.day}` : `Day ${fert.day}`}
                  </span>

                  <div className="space-y-1.5 flex-1">
                    {/* Ethuku nu (Stage) */}
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {fert.stage}
                    </h4>

                    {/* Exact Dosage */}
                    <div className="bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-xs font-black text-emerald-950 inline-block">
                      📦 {lang === 'ta' ? fert.dosage_ta || fert.dosage : fert.dosage}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. AGRONOMIC ACTION BANNER: WEEDING & PEST CONTROL */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#238636]" />
          <h3 className="font-black text-slate-900 text-base">
            {lang === 'ta' ? `தற்போதைய நாள் ${currentDay} - பயிர் பராமரிப்பு மற்றும் பூச்சி மேலாண்மை` : `Day ${currentDay} Advisory: Weed, Pest & Soil Care`}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">
              🌱 {lang === 'ta' ? 'களை மேலாண்மை (Weed Control):' : 'Weed Control Protocol:'}
            </span>
            <p className="text-slate-600 leading-relaxed font-medium">
              {lang === 'ta'
                ? 'விதைத்த 20-வது நாளில் முதல் கைக்களை எடுக்கவும். விழுது பாயும் பருவத்தில் (35 நாளுக்குப் பின்) மண்வெட்டி கொண்டு கொத்தக்கூடாது.'
                : 'Complete hand weeding by Day 20-22. Avoid soil disturbance after Day 35 to protect entering gynophores/pegs.'}
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">
              🐛 {lang === 'ta' ? 'பூச்சி தடுப்பு (Pest Protection):' : 'Pest Surveillance:'}
            </span>
            <p className="text-slate-600 leading-relaxed font-medium">
              {lang === 'ta'
                ? 'இலைசுருட்டு புழு மற்றும் வெட்டுப்புழுவை கட்டுப்படுத்த ஏக்கருக்கு 5 விளக்கு பொறிகள் மற்றும் வேப்ப எண்ணெய் (3 ml/L) தெளிக்கவும்.'
                : 'Monitor for leaf miner and Spodoptera. Install 5 light traps per acre and apply neem seed kernel extract (NSKE 5%).'}
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">
              🌾 {lang === 'ta' ? 'மண்வள ஆலோசனை (Soil Health):' : 'Soil Rejuvenation Action:'}
            </span>
            <p className="text-slate-600 leading-relaxed font-medium">
              {lang === 'ta'
                ? `${activeDistrict} மாவட்ட செம்மண்ணில் ஜிப்சம் இடுவது பருப்பு தரத்தை 25% உயர்த்தும். வேர் அழுகல் நோய் வராமல் தடுக்க வடிகால் அவசியம்.`
                : `Ensure gypsum is applied at 40-45 DAS. Essential calcium hardens pod shells and minimizes empty/hollow pods.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
