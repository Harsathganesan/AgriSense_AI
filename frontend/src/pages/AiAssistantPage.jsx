import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  Bot,
  User
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';
import { assistantApi } from '../services/api';

export default function AiAssistantPage() {
  const { lang, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const { currentDistrict } = useFarm();

  const district = currentDistrict || user?.registered_location?.district || user?.district || 'Pudukkottai';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const messagesEndRef = useRef(null);

  // Load initial welcome message and suggested prompts for district & language
  useEffect(() => {
    const initChat = async () => {
      try {
        const pRes = await assistantApi.getPrompts(lang, district);
        setSuggestedPrompts(pRes.data || []);

        const welcomeText = lang === 'ta'
          ? `வணக்கம்! நான் உங்கள் அக்ரிசென்ஸ் (AgriSense AI) வேளாண் ஆலோசகர்.\n\n${district} மாவட்டத்தின் மண்வள ஆய்வு முடிவுகள் மற்றும் நாசா (NASA SMAP/GPM) விண்வெளித் தரவுகளை அடிப்படையாகக் கொண்டு, பயிர் சுழற்சி, விதைப்புப் பருவம், நீர் சேமிப்பு மற்றும் உரச் செலவைக் குறைக்கும் வழிகளை விளக்குகிறேன்.\n\nநீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்? கீழேயுள்ள வினாக்களைத் தேர்வு செய்யலாம் அல்லது உங்கள் கேள்வியைத் தட்டச்சு செய்யவும்.`
          : `Hello! I am your AgriSense AI Agricultural Advisor.\n\nGrounded in ${district} certified soil test records and live NASA Earth satellite telemetry (SMAP root-zone moisture, GPM rainfall), I provide scientific recommendations on 3-season crop rotation, drought-resilient crops, water conservation, and soil carbon replenishment in plain English or தமிழ்.\n\nHow can I help your farm today? Tap any suggested question below or type your inquiry.`;

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
  }, [lang, district]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
      const res = await assistantApi.chat(text, district, lang);
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
            ? `மன்னிக்கவும், ${district} மாவட்ட தரவைப் பெறுவதில் சிறு தாமதம் ஏற்பட்டது. தயவுசெய்து மீண்டும் ஒருமுறை முயற்சிக்கவும்.`
            : `Apologies, there was a brief communication issue for ${district}. Please try your question again.`,
          engine: 'AgriSense Fallback',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* 1. Header (Mela Heading) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#238636]" />
            {lang === 'ta' ? 'AI பண்ணை உதவியாளர்' : 'AI Farm Assistant'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {lang === 'ta'
              ? 'மண் பரிசோதனை, நாசா விண்வெளித் தகவல்கள் மற்றும் பயிர் சுழற்சிக்கான நேரடி AI விவசாய ஆலோசகர்.'
              : 'Interactive bilingual farm advisor grounded in certified soil tests and NASA Earth telemetry.'}
          </p>
        </div>

        {/* Language Switch */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#238636] text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
        >
          <Languages className="w-4 h-4" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>
      </div>

      {/* 2. Interactive Chat Container (Keela Chat Screen) */}
      <div className="h-[calc(100vh-230px)] min-h-[520px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                      ? 'மண் & வானிலை தரவுகளை ஆராய்கிறது...'
                      : 'Analyzing soil health & NASA observations...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pill Container - Wrapped & Fitted (No Horizontal Scrolling) */}
        {suggestedPrompts.length > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/70">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#238636]" />
              <span>{lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட வினாக்கள்:' : 'Suggested Questions:'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSendMessage(p.text)}
                  className="text-left text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-[#238636] transition shadow-2xs cursor-pointer active:scale-98"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Box Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
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
                  ? 'பயிர் சுழற்சி, மண் வளம், உரம் பற்றி எதையும் கேளுங்கள்...'
                  : 'Ask anything about crop rotation, soil health, fertilizer, or NASA weather...'
              }
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] focus:ring-2 focus:ring-[#238636]/20 text-xs sm:text-sm bg-slate-50/50 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-50 shadow-xs cursor-pointer shrink-0"
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
