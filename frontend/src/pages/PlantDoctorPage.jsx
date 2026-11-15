import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  UploadCloud,
  Camera,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Leaf,
  FlaskConical,
  RotateCcw,
  History,
  Trash2,
  Calendar,
  Thermometer,
  Droplets,
  Satellite,
  Info,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  X,
  FileText
} from 'lucide-react';
import { diseaseApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';

export default function PlantDoctorPage() {
  const { lang } = useLanguage();
  const { currentDistrict } = useFarm();
  const isTamil = lang === 'ta';

  // Scanner State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('organic'); // organic, chemical, prevention, nasa
  const [supportedClasses, setSupportedClasses] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const analysisSteps = isTamil
    ? [
        'இலையின் தோற்றம் மற்றும் புண்கள் ஆய்வு செய்யப்படுகின்றன...',
        '15 வகையான பயிர் நோய் மாதிரிகளுடன் ஒப்பிடப்படுகிறது...',
        'நாசா (NASA POWER & SMAP) வானிலை மற்றும் ஈரப்பதம் சரிபார்க்கப்படுகிறது...',
        'TNAU & ICAR சான்றளிக்கப்பட்ட மருந்து பரிந்துரைகள் உருவாக்கப்படுகின்றன...'
      ]
    : [
        'Analyzing leaf morphology and lesion boundaries...',
        'Matching spectral features with 15 PlantVillage diagnostic classes...',
        'Querying NASA POWER & SMAP microclimate environmental risk...',
        'Formulating ICAR & TNAU certified agronomic advisory...'
      ];

  // Load classes and history on mount
  useEffect(() => {
    fetchSupportedClasses();
    fetchHistory();
  }, []);

  const fetchSupportedClasses = async () => {
    try {
      const res = await diseaseApi.getClasses();
      setSupportedClasses(res.data);
    } catch (err) {
      console.warn('Could not load classes:', err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await diseaseApi.getHistory();
      setHistory(res.data?.history || []);
    } catch (err) {
      console.warn('Could not load scan history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(isTamil ? 'தயவுசெய்து சரியான படக்கோப்பை பதிவேற்றவும் (JPG/PNG/WEBP).' : 'Please upload a valid image file (JPG/PNG/WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(isTamil ? 'படத்தின் அளவு 10MB-க்குள் இருக்க வேண்டும்.' : 'Image size must be under 10MB.');
      return;
    }

    setError(null);
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setDiagnosis(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setDiagnosis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const runDiagnosis = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setError(null);
    setDiagnosis(null);
    setAnalysisStep(0);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 600);

    const formData = new FormData();
    formData.append('file', selectedImage);
    formData.append('district', currentDistrict || 'Pudukkottai');
    if (selectedCrop !== 'All') {
      formData.append('crop_hint', selectedCrop);
    }
    formData.append('save_history', 'true');

    try {
      const res = await diseaseApi.predict(formData);
      clearInterval(stepInterval);
      setDiagnosis(res.data);
      fetchHistory(); // Refresh recent history
    } catch (err) {
      clearInterval(stepInterval);
      const errMsg = err.response?.data?.detail || (isTamil ? 'நோய் கண்டறிவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' : 'Diagnostic pipeline encountered an error. Please try again.');
      setError(errMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteScan = async (e, scanId) => {
    e.stopPropagation();
    try {
      await diseaseApi.deleteScan(scanId);
      setHistory((prev) => prev.filter((s) => (s._id || s.id) !== scanId));
      if (diagnosis && (diagnosis.scan_id === scanId || diagnosis._id === scanId)) {
        setDiagnosis(null);
      }
    } catch (err) {
      console.error('Delete scan error:', err);
    }
  };

  const loadPastScan = async (scan) => {
    try {
      const res = await diseaseApi.getScan(scan._id || scan.id);
      const scanData = res.data;
      if (scanData.full_advisory) {
        const adv = scanData.full_advisory;
        setDiagnosis({
          status: 'diagnosed',
          confidence_score: scanData.confidence_score,
          threshold_score: 60.0,
          predicted_class: scanData.predicted_class,
          crop_en: adv.crop_en,
          crop_ta: adv.crop_ta,
          disease_name_en: adv.disease_name_en,
          disease_name_ta: adv.disease_name_ta,
          causal_agent: adv.causal_agent,
          pathogen_type: adv.pathogen_type,
          is_healthy: adv.is_healthy,
          severity: adv.severity,
          symptoms_en: adv.symptoms_en,
          symptoms_ta: adv.symptoms_ta,
          causes_en: adv.causes_en,
          causes_ta: adv.causes_ta,
          organic_controls_en: adv.organic_controls_en,
          organic_controls_ta: adv.organic_controls_ta,
          chemical_controls_en: adv.chemical_controls_en,
          chemical_controls_ta: adv.chemical_controls_ta,
          preventive_measures_en: adv.preventive_measures_en,
          preventive_measures_ta: adv.preventive_measures_ta,
          nasa_environmental_risk: {
            risk_level: scanData.nasa_risk_level || 'Low',
            risk_badge: 'Historical Observation',
            environmental_telemetry: { district: scanData.district, source: 'NASA Satellite Archive' }
          },
          observations: scanData.observations,
          engine: 'Archive View'
        });
      } else {
        setDiagnosis({
          status: 'diagnosed',
          confidence_score: scanData.confidence_score,
          crop_en: scanData.crop_en,
          crop_ta: scanData.crop_ta,
          disease_name_en: scanData.disease_name_en,
          disease_name_ta: scanData.disease_name_ta,
          severity: scanData.severity,
          is_healthy: scanData.is_healthy,
          organic_controls_en: scanData.treatment_summary_en || [],
          chemical_controls_en: scanData.chemical_summary_en || [],
          nasa_environmental_risk: { risk_level: scanData.nasa_risk_level || 'Low' }
        });
      }
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (err) {
      console.error('Error fetching past scan details:', err);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">🚨 {isTamil ? 'மிக ஆபத்தானது (Critical)' : 'Critical Severity'}</span>;
      case 'high':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">⚠️ {isTamil ? 'அதிக தீவிரம் (High)' : 'High Severity'}</span>;
      case 'moderate':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">⚡ {isTamil ? 'மிதமான தீவிரம்' : 'Moderate'}</span>;
      case 'none':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✅ {isTamil ? 'ஆரோக்கியமானது' : 'Healthy Plant'}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">{sev || 'Standard'}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              {isTamil ? 'AI பயிர் நோய் கண்டறிதல் & தீர்வுகள்' : 'AI Plant Disease Diagnosis & Treatment'}
            </h1>
          </div>

          <div className="flex items-center self-stretch sm:self-auto">
            <div className="w-full sm:w-auto bg-black/20 backdrop-blur-md rounded-xl px-3.5 py-2 border border-white/15 flex items-center justify-between sm:block text-left sm:text-right">
              <div className="text-[10px] sm:text-[11px] text-emerald-200 font-semibold uppercase tracking-wider flex items-center sm:justify-end gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isTamil ? 'மாவட்ட வானிலை' : 'District Telemetry'}</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white sm:mt-0.5">
                {currentDistrict || 'Pudukkottai'}, Tamil Nadu
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Scanner / Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Capture & Upload (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                {isTamil ? 'இலை புகைப்பட ஆய்வு' : 'Leaf Specimen Inspection'}
              </h2>
              {imagePreview && (
                <button
                  onClick={clearSelectedImage}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  {isTamil ? 'அகற்று' : 'Clear'}
                </button>
              )}
            </div>

            {/* Dropzone / Preview Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`relative border-2 border-dashed rounded-2xl min-h-[260px] flex flex-col items-center justify-center p-4 transition-all duration-200 text-center ${
                imagePreview
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/10'
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full flex flex-col items-center">
                  <div className="relative max-h-[240px] rounded-xl overflow-hidden shadow-inner border border-slate-200">
                    <img
                      src={imagePreview}
                      alt="Plant Leaf Specimen"
                      className="max-h-[240px] w-auto object-contain mx-auto rounded-xl"
                    />

                    {/* Scanning radar line when analyzing */}
                    {analyzing && (
                      <div className="absolute inset-0 bg-emerald-500/10 flex flex-col justify-between overflow-hidden">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 font-medium mt-2 truncate max-w-xs">
                    {selectedImage?.name} ({(selectedImage?.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                    <UploadCloud className="w-8 h-8 stroke-[2]" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      {isTamil ? 'இலை புகைப்படத்தை இங்கே இழுத்து விடவும்' : 'Drag & drop your leaf photo here'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isTamil ? 'அல்லது உங்கள் கேமரா / கேலரியில் இருந்து தேர்வு செய்யவும்' : 'or choose from camera / gallery (JPEG, PNG, WEBP)'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 w-full max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">{isTamil ? 'கோப்பை தேர்வு செய்' : 'Browse File'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-200 shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{isTamil ? 'கேமரா மூலம் எடு' : 'Use Camera'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0])}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Analyze Button */}
            <button
              onClick={runDiagnosis}
              disabled={!selectedImage || analyzing}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition-all ${
                !selectedImage || analyzing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#238636] hover:bg-emerald-700 text-white shadow-emerald-700/20 hover:scale-[1.01]'
              }`}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{analysisSteps[analysisStep]}</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  <span>{isTamil ? 'இலையை பரிசோதித்து நோயறி (Diagnose)' : 'Diagnose Plant Disease'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Diagnosis Results & Treatment Navigator (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!diagnosis && !analyzing && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center min-h-[380px] flex flex-col items-center justify-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Leaf className="w-8 h-8 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                {isTamil ? 'நோயறிதல் முடிவு காத்திருக்கிறது' : 'Ready for Leaf Diagnosis'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                {isTamil
                  ? 'இடதுபுறத்தில் ஒரு இலையின் புகைப்படத்தை பதிவேற்றி "Diagnose" பொத்தானை அழுத்தவும். நோயின் விவரங்கள், கரிம மற்றும் ரசாயன மருந்துகள் இங்கே தோன்றும்.'
                  : 'Select or snap a photo of a suspicious leaf to run real-time deep learning analysis with verified ICAR/TNAU agronomic treatment recommendations.'}
              </p>
            </div>
          )}

          {analyzing && (
            <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center min-h-[380px] flex flex-col items-center justify-center shadow-sm space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-emerald-700">
                  <Stethoscope className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {isTamil ? 'AI பரிசோதனை நடைபெறுகிறது...' : 'Running Diagnostic AI Model...'}
                </h3>
                <p className="text-xs font-semibold text-emerald-700 animate-pulse">
                  {analysisSteps[analysisStep]}
                </p>
              </div>
              <div className="w-64 bg-slate-100 rounded-full h-2 overflow-hidden mx-auto">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(analysisStep + 1) * 25}%` }}
                />
              </div>
            </div>
          )}

          {diagnosis && (
            <div className="space-y-4">
              {/* Main Diagnosis Card */}
              <div className={`bg-white rounded-2xl border p-4 sm:p-6 shadow-sm space-y-4 ${
                diagnosis.status === 'inconclusive'
                  ? 'border-amber-300 bg-amber-50/10'
                  : diagnosis.is_healthy
                  ? 'border-emerald-300 bg-emerald-50/10'
                  : 'border-slate-200'
              }`}>
                {/* Header Badge & Title */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                      {diagnosis.status === 'inconclusive' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                          {isTamil ? 'தெளிவற்ற முடிவு (Inconclusive)' : 'Inconclusive / Low Confidence'}
                        </span>
                      ) : diagnosis.is_healthy ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          {isTamil ? 'ஆரோக்கியமான பயிர்' : 'Healthy Specimen'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                          {isTamil ? 'நோய் கண்டறியப்பட்டது' : 'Pathology Detected'}
                        </span>
                      )}

                      {getSeverityBadge(diagnosis.severity)}

                      {diagnosis.crop_en && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-100 text-slate-700">
                          🌱 {isTamil && diagnosis.crop_ta ? diagnosis.crop_ta : diagnosis.crop_en}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                      {isTamil && diagnosis.disease_name_ta
                        ? diagnosis.disease_name_ta
                        : diagnosis.disease_name_en}
                    </h3>
                    {diagnosis.causal_agent && diagnosis.causal_agent !== 'None' && (
                      <p className="text-xs italic text-slate-500 font-serif mt-1">
                        Causal Organism: {diagnosis.causal_agent} ({diagnosis.pathogen_type})
                      </p>
                    )}
                  </div>

                  {/* Confidence Meter */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between sm:block sm:text-right shrink-0">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {isTamil ? 'நம்பகத்தன்மை அளவு' : 'Diagnostic Confidence'}
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        {diagnosis.confidence_score}%
                      </div>
                    </div>
                    <div className="w-24 bg-slate-200 rounded-full h-1.5 sm:mt-1 overflow-hidden sm:ml-auto">
                      <div
                        className={`h-1.5 rounded-full ${
                          diagnosis.confidence_score >= 85
                            ? 'bg-emerald-600'
                            : diagnosis.confidence_score >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${diagnosis.confidence_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Inconclusive Warning message */}
                {diagnosis.status === 'inconclusive' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      {isTamil ? 'பாதுகாப்பு விழிப்புணர்வு அறிவிப்பு:' : 'Safety Uncertainty Threshold Triggered:'}
                    </div>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      {isTamil ? diagnosis.message_ta : diagnosis.message_en}
                    </p>
                    {diagnosis.observations && (
                      <p className="text-[11px] text-amber-800 italic bg-amber-100/50 p-2 rounded-lg">
                        <strong>{isTamil ? 'கண்காணிப்பு:' : 'AI Observation:'}</strong> {isTamil && diagnosis.observations_ta ? diagnosis.observations_ta : diagnosis.observations}
                      </p>
                    )}
                  </div>
                )}

                {/* Top 3 Alternative Candidates Breakdown */}
                {diagnosis.top_3_predictions && diagnosis.top_3_predictions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                      {isTamil ? 'சாத்தியமான பிற கணிப்புகள் (Top Candidates):' : 'Top Candidate Predictions:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {diagnosis.top_3_predictions.map((c, i) => (
                        <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span className="truncate pr-1">{c.label || c.class}</span>
                            <span>{Math.round(c.confidence * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1 rounded-full"
                              style={{ width: `${Math.round(c.confidence * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptoms Summary */}
                {diagnosis.status === 'diagnosed' && diagnosis.symptoms_en && (
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      {isTamil ? 'அடையாள அறிகுறிகள் (Symptoms):' : 'Key Diagnostic Symptoms:'}
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                      {(isTamil && diagnosis.symptoms_ta ? diagnosis.symptoms_ta : diagnosis.symptoms_en).map((sym, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{sym}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Treatment Tabs Navigator */}
              {diagnosis.status === 'diagnosed' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Tabs Bar */}
                  <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto scrollbar-none py-0.5 px-1">
                    {[
                      { id: 'organic', labelEn: '🌿 Organic Control', labelTa: '🌿 இயற்கை மருத்துவம்' },
                      { id: 'chemical', labelEn: '🧪 Chemical Control', labelTa: '🧪 பூச்சிக்கொல்லிகள்' },
                      { id: 'prevention', labelEn: '🛡️ Prevention & Rotation', labelTa: '🛡️ தடுப்பு & சுழற்சி' },
                      { id: 'nasa', labelEn: '🛰️ NASA Telemetry Risk', labelTa: '🛰️ நாசா வானிலை ஆபத்து' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3 px-3.5 text-xs font-extrabold whitespace-nowrap transition-all border-b-2 shrink-0 ${
                          activeTab === tab.id
                            ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                        }`}
                      >
                        {isTamil ? tab.labelTa : tab.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="p-3.5 sm:p-6 text-sm">
                    {/* Tab 1: Organic & Biocontrol */}
                    {activeTab === 'organic' && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
                            {isTamil ? 'இயற்கை மற்றும் உயிரியல் கட்டுப்பாடு முறைகள்' : 'Organic & Biological Treatment Protocols'}
                          </h4>
                          <span className="self-start sm:self-auto text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            ICAR / TNAU Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {isTamil
                            ? 'மண்வளத்தை பாதிக்காத வகையில் இயற்கை பூஞ்சாணக்கொல்லிகள் மற்றும் மூலிகைக் கரைசல்கள்:'
                            : 'Eco-friendly biocontrol agents and herbal botanical extracts recommended for integrated pest management:'}
                        </p>
                        <div className="space-y-2">
                          {(isTamil && diagnosis.organic_controls_ta ? diagnosis.organic_controls_ta : diagnosis.organic_controls_en)?.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 flex items-start gap-2.5 text-xs text-slate-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Chemical Control */}
                    {activeTab === 'chemical' && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-blue-600 shrink-0" />
                            {isTamil ? 'சான்றளிக்கப்பட்ட ரசாயன மருந்துகள் & அளவுகள்' : 'Certified Chemical Formulations & Precise Dosage'}
                          </h4>
                          <span className="self-start sm:self-auto text-[10px] sm:text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            CIBRC / TNAU Approved
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                          ⚠️ <strong>{isTamil ? 'பாதுகாப்பு எச்சரிக்கை:' : 'Safety Warning:'}</strong> {isTamil
                            ? 'மருந்து தெளிக்கும் போது கையுறைகள் மற்றும் முகக்கவசம் அணியவும். பயிர் அறுவடை இடைவெளியை (PHI) தவறாமல் பின்பற்றவும்.'
                            : 'Wear protective gloves and masks when spraying. Strictly adhere to certified Pre-Harvest Intervals (PHI).'}
                        </div>
                        <div className="space-y-2">
                          {(isTamil && diagnosis.chemical_controls_ta ? diagnosis.chemical_controls_ta : diagnosis.chemical_controls_en)?.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-800">
                              <FlaskConical className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed font-semibold">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Prevention & Rotation */}
                    {activeTab === 'prevention' && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                            {isTamil ? 'வருமுன் காக்கும் தடுப்பு & பயிர் சுழற்சி முறைகள்' : 'Agronomic Prevention & Crop Rotation Strategy'}
                          </h4>
                          <span className="self-start sm:self-auto text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Sustainable Agronomy
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {isTamil
                            ? 'மீண்டும் நோய் தாக்காமல் இருக்க பண்ணையில் பின்பற்ற வேண்டிய நீண்டகால நடைமுறைகள்:'
                            : 'Preventative field cultural practices to break the pathogen lifecycle and safeguard future seasons:'}
                        </p>
                        <div className="space-y-2">
                          {(isTamil && diagnosis.preventive_measures_ta ? diagnosis.preventive_measures_ta : diagnosis.preventive_measures_en)?.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-800">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 4: NASA Telemetry Environmental Risk */}
                    {activeTab === 'nasa' && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <Satellite className="w-4 h-4 text-teal-600 shrink-0" />
                            {isTamil ? 'நாசா செயற்கைக்கோள் வானிலை ஆபத்து பகுப்பாய்வு' : 'NASA Satellite Environmental Conduciveness Assessment'}
                          </h4>
                          <span className={`self-start sm:self-auto text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            diagnosis.nasa_environmental_risk?.risk_level === 'High'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : diagnosis.nasa_environmental_risk?.risk_level === 'Moderate'
                              ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}>
                            {diagnosis.nasa_environmental_risk?.risk_badge || 'Active Telemetry'}
                          </span>
                        </div>

                        {/* Climate telemetry grid */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div className="bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-200 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase">
                              <Thermometer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="truncate">{isTamil ? 'வெப்பநிலை' : 'Mean Temp'}</span>
                            </div>
                            <div className="text-sm sm:text-lg font-black text-slate-900 mt-1">
                              {diagnosis.nasa_environmental_risk?.environmental_telemetry?.avg_temp_c || 28.5}°C
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">NASA POWER</span>
                          </div>

                          <div className="bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-200 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase">
                              <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">{isTamil ? 'ஈரப்பதம்' : 'Humidity'}</span>
                            </div>
                            <div className="text-sm sm:text-lg font-black text-slate-900 mt-1">
                              {diagnosis.nasa_environmental_risk?.environmental_telemetry?.relative_humidity_pct || 75}%
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">Relative Hum</span>
                          </div>

                          <div className="bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-200 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase">
                              <Satellite className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{isTamil ? 'மண் ஈரம்' : 'Root Moist'}</span>
                            </div>
                            <div className="text-sm sm:text-lg font-black text-slate-900 mt-1">
                              {diagnosis.nasa_environmental_risk?.environmental_telemetry?.smap_soil_moisture_pct || 25.5}%
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">SMAP Radar</span>
                          </div>
                        </div>

                        {/* Summary description */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                          {isTamil && diagnosis.nasa_environmental_risk?.summary_ta
                            ? diagnosis.nasa_environmental_risk.summary_ta
                            : diagnosis.nasa_environmental_risk?.summary_en}
                        </div>

                        {/* Formal Disclaimer */}
                        <p className="text-[11px] text-slate-400 italic">
                          ℹ️ {isTamil
                            ? 'குறிப்பு: நாசா வானிலை குறியீடுகள் நோய் பரவலுக்கான வானிலை சூழலை மட்டுமே குறிக்கின்றன; இது நேரடி மருத்துவ உறுதிப்படுத்தல் அல்ல.'
                            : 'Note: NASA environmental telemetry evaluates climate conduciveness for pathogen reproduction, not as proof of disease diagnosis.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

