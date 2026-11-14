import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  Bot,
  User,
  MapPin,
  ChevronDown,
  RefreshCw,
  Building,
  CheckCircle2,
  Layers,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { assistantApi, authApi } from '../services/api';
import { getDistricts } from '../data/locationHierarchy';

// Quick popular agricultural districts for one-tap selection
const POPULAR_DISTRICTS = [
  'Pudukkottai',
  'Thanjavur',
  'Tiruvarur',
  'Nagapattinam',
  'Madurai',
  'Coimbatore',
  'Salem',
  'Tiruchirappalli'
];

export default function AiAssistantPage() {
  const { t, lang, toggleLanguage } = useLanguage();
  const { user, setUser } = useAuth();

  const state = user?.registered_location?.state || user?.state || 'Tamil Nadu';
  const country = user?.registered_location?.country || user?.country || 'India';
  const initialDistrict = user?.registered_location?.district || user?.district || 'Pudukkottai';

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [switchingDistrict, setSwitchingDistrict] = useState(false);
  const messagesEndRef = useRef(null);

  const availableDistricts = getDistricts(country, state);

  // Sync if district changes in auth user
  useEffect(() => {
    const userDist = user?.registered_location?.district || user?.district;
    if (userDist && userDist !== selectedDistrict) {
      setSelectedDistrict(userDist);
    }
  }, [user]);

  // Load initial welcome message and suggested prompts for district & language
  useEffect(() => {
    const initChat = async () => {
      try {
        const pRes = await assistantApi.getPrompts(lang, selectedDistrict);
        setSuggestedPrompts(pRes.data || []);

        const welcomeText = lang === 'ta'
          ? `வணக்கம்! நான் உங்கள் அக்ரிசென்ஸ் (AgriSense AI) வேளாண் ஆலோசகர்.\n\n${selectedDistrict} மாவட்டத்தின் மண்வள ஆய்வு முடிவுகள் (செம்மண்/வண்டல், TNAU ஆய்வக கார அமிலத்தன்மை) மற்றும் நாசா (NASA SMAP/GPM) விண்வெளித் தரவுகளை அடிப்படையாகக் கொண்டு, பயிர் சுழற்சி, விதைப்புப் பருவம், நீர் சேமிப்பு மற்றும் உரச் செலவைக் குறைக்கும் வழிகளை விளக்குகிறேன்.\n\nநீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்? கீழேயுள்ள வினாக்களைத் தேர்வு செய்யலாம் அல்லது உங்கள் கேள்வியைத் தட்டச்சு செய்யவும்.`
          : `Hello! I am your AgriSense AI Agricultural Advisor.\n\nGrounded in ${selectedDistrict} district (${state}) certified soil test records and live NASA Earth satellite telemetry (SMAP root-zone moisture, GPM rainfall), I provide scientific recommendations on 3-season crop rotation, drought-resilient crops, water conservation, and soil carbon replenishment in plain English or தமிழ்.\n\nHow can I help your farm today? Tap any suggested question below or type your inquiry.`;

        setMessages([
          {
            id: 'init_welcome',
            sender: 'ai',
            text: welcomeText,
            engine: 'AgriSense Farm AI • NASA Grounded',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch (err) {
        console.error('Assistant init error:', err);
      }
    };
    initChat();
  }, [lang, selectedDistrict]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle changing district
  const handleDistrictChange = async (newDistrict) => {
    if (!newDistrict || newDistrict === selectedDistrict) return;

    setSelectedDistrict(newDistrict);
    setSwitchingDistrict(true);

    try {
      if (user) {
        const res = await authApi.updateProfile({
          district: newDistrict,
          state: state,
          country: country,
          registered_location: {
            country: country,
            state: state,
            district: newDistrict
          }
        });
        if (res.data) {
          setUser(res.data);
        }
      }
    } catch (err) {
      console.warn('Profile sync warning:', err);
    } finally {
      setSwitchingDistrict(false);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await assistantApi.chat(text, selectedDistrict, lang);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data?.reply || (lang === 'ta' ? 'பதில் பெறப்பட்டது.' : 'Response received.'),
        engine: res.data?.engine || 'AgriSense Farm AI',
        isLive: res.data?.is_live_gemini,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: lang === 'ta'
            ? `மன்னிக்கவும், ${selectedDistrict} மாவட்ட தரவைப் பெறுவதில் சிறு தாமதம் ஏற்பட்டது. தயவுசெய்து மீண்டும் ஒருமுறை முயற்சிக்கவும்.`
            : `Apologies, there was a brief communication issue for ${selectedDistrict}. Please try your question again.`,
          engine: 'AgriSense Fallback',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Header & District Selection Bar (Matching other modules) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#238636] text-xs font-bold border border-emerald-200 mb-2">
              <Building className="w-3.5 h-3.5" />
              <span>{selectedDistrict} District • {lang === 'ta' ? 'அக்ரிசென்ஸ் AI ஆலோசகர்' : 'AI Farm Advisor'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-[#238636]" />
              {lang === 'ta' ? 'AI பண்ணை உதவியாளர்' : 'AI Farm Assistant'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
              {lang === 'ta'
                ? `${selectedDistrict} மாவட்ட மண் பரிசோதனை மற்றும் நாசா விண்வெளித் தகவல்களுடன் இணைக்கப்பட்ட நேரடி AI விவசாய ஆலோசகர்.`
                : `Interactive bilingual farm advisor grounded in ${selectedDistrict}'s soil tests and NASA Earth telemetry.`}
            </p>
          </div>

          {/* District Dropdown Selector & Language Switch */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'ta' ? 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்' : 'Select District'}
              </label>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={loading || switchingDistrict}
                  className="w-full appearance-none pl-9 pr-9 py-2.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-300 hover:border-emerald-400 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#238636]/40 focus:border-[#238636] transition cursor-pointer disabled:opacity-60"
                >
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-[#238636] absolute left-3 top-3 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="self-end pb-0.5">
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-[#238636] text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
              >
                <Languages className="w-4 h-4" />
                <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Popular District Chips */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'ta' ? 'விரைவு மாவட்டங்கள்:' : 'Quick Select:'}
          </span>
          {POPULAR_DISTRICTS.map((d) => {
            const isCurrent = selectedDistrict.toLowerCase() === d.toLowerCase();
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDistrictChange(d)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all border ${
                  isCurrent
                    ? 'bg-[#238636] text-white border-[#238636] shadow-xs'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-900 border-slate-200'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Chat Container */}
      <div className="h-[560px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Chat Status Sub-bar */}
        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-slate-800">
              {lang === 'ta'
                ? `${selectedDistrict} மாவட்ட மண் & நாசா செயற்கைக்கோள் தரவுகளுடன் இணைக்கப்பட்டுள்ளது`
                : `Grounded on ${selectedDistrict} District Soil & NASA Telemetry`}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {lang === 'ta' ? 'நேரடி வேளாண்மை ஆலோசனை' : 'Live Agri Advisor'}
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#238636] flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                    isAi
                      ? 'bg-slate-50 border border-slate-200/90 text-slate-800'
                      : 'bg-[#238636] text-white rounded-tr-xs shadow-sm shadow-[#238636]/20'
                  }`}
                >
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                    {m.text}
                  </div>
                  <div
                    className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                      isAi ? 'border-slate-200/60 text-slate-400' : 'border-white/20 text-emerald-100'
                    }`}
                  >
                    <span>{m.engine || (isAi ? 'AgriSense Farm AI' : 'Farmer')}</span>
                    <span>{m.time}</span>
                  </div>
                </div>
                {!isAi && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#238636] flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-150" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-300" />
                  <span className="ml-1 font-semibold text-slate-700">
                    {lang === 'ta'
                      ? `${selectedDistrict} மாவட்ட மண் & வானிலை தரவுகளை ஆராய்கிறது...`
                      : `Analyzing ${selectedDistrict} soil health & NASA observations...`}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pill Container */}
        {suggestedPrompts.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 overflow-x-auto flex gap-2 scrollbar-none">
            {suggestedPrompts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSendMessage(p.text)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-[#238636] text-xs font-semibold whitespace-nowrap transition shadow-2xs shrink-0 cursor-pointer"
              >
                {p.text}
              </button>
            ))}
          </div>
        )}

        {/* Input Box Bar */}
        <div className="p-3.5 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                lang === 'ta'
                  ? `${selectedDistrict} மாவட்ட பயிர் சுழற்சி, மண், உரம் பற்றி எதையும் கேளுங்கள்...`
                  : `Ask anything about ${selectedDistrict} crop rotation, soil, fertilizer, or NASA weather...`
              }
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] focus:ring-2 focus:ring-[#238636]/20 text-xs sm:text-sm bg-slate-50/50 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-5 py-2.5 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-50 shadow-xs cursor-pointer shrink-0"
            >
              <span>{lang === 'ta' ? 'அனுப்பு' : 'Send'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
