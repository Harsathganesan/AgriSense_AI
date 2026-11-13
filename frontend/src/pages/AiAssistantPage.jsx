import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Tractor,
  Layers
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { assistantApi } from '../services/api';

export default function AiAssistantPage() {
  const { t, lang, toggleLanguage } = useLanguage();
  const { activeFarm } = useFarm();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const messagesEndRef = useRef(null);

  // Load initial welcome message and suggested prompts
  useEffect(() => {
    const initChat = async () => {
      try {
        const pRes = await assistantApi.getPrompts(lang);
        setSuggestedPrompts(pRes.data);

        // Initial welcome
        const welcomeText = lang === 'ta'
          ? `வணக்கம்! நான் உங்கள் அக்ரிசென்ஸ் (AgriSense AI) வேளாண் உதவியாளர். உங்கள் பண்ணை '${activeFarm?.name || "Cauvery Delta Farm"}' மண் பரிசோதனை முடிவுகள் மற்றும் நாசா விண்வெளி மையத்தின் செயற்கைக்கோள் தரவுகளை அடிப்படையாகக் கொண்டு, பயிர் சுழற்சி, நீர் மேலாண்மை மற்றும் உரச் செலவைக் குறைக்கும் வழிகளை தமிழில் விளக்குகிறேன். நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?`
          : `Hello! I am your AgriSense AI Agricultural Advisor. Grounded in your farm '${activeFarm?.name || "Cauvery Delta Farm"}' soil test data and live NASA Earth observations, I can answer your questions on crop rotation strategies, water conservation, and soil rejuvenation in plain English or தமிழ். How can I help you today?`;

        setMessages([
          {
            id: 'init_1',
            sender: 'ai',
            text: welcomeText,
            engine: 'AgriSense Farm AI',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch (err) {
        console.error("Assistant init error:", err);
      }
    };
    initChat();
  }, [lang, activeFarm]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
      const res = await assistantApi.chat(text, activeFarm?.id, lang);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data.reply,
        engine: res.data.engine || "Gemini 2.5 Flash",
        isLive: res.data.is_live_gemini,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: lang === 'ta'
            ? "மன்னிக்கவும், தரவை பெறுவதில் சிறு தாமதம் ஏற்பட்டது. தயவுசெய்து மீண்டும் ஒருமுறை முயற்சிக்கவும்."
            : "Apologies, there was a brief communication issue. Please try your question again.",
          engine: "Error Fallback",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Chat Top Banner */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#238636] to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">
              {t('assistant.title')}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Grounded on {activeFarm?.name || "Active Farm"} & NASA Telemetry
              </span>
            </div>
          </div>
        </div>

        {/* Language switch button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-[#238636] text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>
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
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#238636] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-xs ${
                  isAi
                    ? 'bg-slate-50 border border-slate-200/80 text-slate-800'
                    : 'bg-[#238636] text-white rounded-tr-xs'
                }`}
              >
                <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                  {m.text}
                </div>
                <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                  isAi ? 'border-slate-200/60 text-slate-400' : 'border-white/20 text-emerald-100'
                }`}>
                  <span>{m.engine ? `Engine: ${m.engine}` : 'Farmer'}</span>
                  <span>{m.time}</span>
                </div>
              </div>
              {!isAi && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#238636] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-150" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-300" />
                <span className="ml-2">Analyzing farm metrics & calculating advisory...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pill Container */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 overflow-x-auto flex gap-2 scrollbar-none">
        {suggestedPrompts.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSendMessage(p.text)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-[#238636] text-xs font-semibold whitespace-nowrap transition shadow-2xs shrink-0"
          >
            {p.text}
          </button>
        ))}
      </div>

      {/* Input Box Bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
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
            placeholder={t('assistant.placeholder')}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#238636] text-xs sm:text-sm shadow-2xs"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-5 py-3 rounded-2xl bg-[#238636] hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-50 shadow-md shrink-0"
          >
            <span>{t('assistant.send')}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

