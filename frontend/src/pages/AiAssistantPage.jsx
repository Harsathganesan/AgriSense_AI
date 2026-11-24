import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  Bot,
  User,
  X,
  HelpCircle,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';
import { assistantApi } from '../services/api';

export default function AiAssistantPage() {
  const { lang, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const { currentDistrict } = useFarm();

  const district = currentDistrict || user?.registered_location?.district || user?.district || 'Thanjavur';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [showSuggested, setShowSuggested] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initial welcome message builder
  const getWelcomeMessage = () => {
    return lang === 'ta'
      ? 'வணக்கம்! 👋 நான் உங்கள் அக்ரிசென்ஸ் (AgriSense AI) உதவியாளர். என்னிடம் நீங்கள் சாதாரணமாகவும் உரையாடலாம், அல்லது நாசா செயற்கைக்கோள் தரவுகளுடன் கூடிய பயிர், மண் மற்றும் விவசாய ஆலோசனைகளையும் பெறலாம். இன்று உங்களுக்கு நான் எப்படி உதவலாம்?'
      : "Hello! 👋 I'm your AgriSense AI assistant. You can chat with me about anything, or ask me for expert farming, soil, and crop guidance grounded in NASA satellite observations. How can I help you today?";
  };

  // Load initial welcome message and suggested prompts for district & language
  useEffect(() => {
    const initChat = async () => {
      try {
        const pRes = await assistantApi.getPrompts(lang, district);
        setSuggestedPrompts(pRes.data || []);

        setMessages([
          {
            id: 'init_welcome',
            sender: 'ai',
            text: getWelcomeMessage(),
            engine: 'AgriSense AI',
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

  // Auto-resize textarea as user types
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Handle keypress (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat option
  const handleClearChat = () => {
    setMessages([
      {
        id: `clear_${Date.now()}`,
        sender: 'ai',
        text: getWelcomeMessage(),
        engine: 'AgriSense AI',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Copy message text to clipboard
  const handleCopyMessage = async (msgId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Copy to clipboard failed:', err);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    const historyPayload = messages.slice(-10).map((m) => ({
      sender: m.sender,
      text: m.text
    }));

    try {
      const res = await assistantApi.chat(text.trim(), district, lang, historyPayload);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data?.reply || (lang === 'ta' ? 'பதில் பெறப்பட்டது.' : 'Response received.'),
        engine: res.data?.engine || 'Gemini AI',
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
            ? 'மன்னிக்கவும், பதிலளிப்பதில் சிறு தாமதம் ஏற்பட்டது. தயவுசெய்து மீண்டும் ஒருமுறை முயற்சிக்கவும்.'
            : 'Apologies, I encountered a brief communication issue. Please try sending your message again.',
          engine: 'AgriSense Fallback',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Format message text with markdown-like bold, lists, and spacing
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Bold text formatting **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-extrabold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      // Bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-[#238636] font-bold shrink-0">•</span>
            <span className="leading-relaxed">{formattedParts}</span>
          </div>
        );
      }

      // Empty line / paragraph break
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <div key={idx} className="leading-relaxed">
          {formattedParts}
        </div>
      );
    });
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4 pb-3">
      {/* 1. ChatGPT-like Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 truncate">
            <Sparkles className="w-5 h-5 sm:w-6 h-6 text-[#238636] shrink-0" />
            <span className="truncate">{lang === 'ta' ? 'AI பண்ணை உதவியாளர்' : 'AgriSense AI Assistant'}</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 sm:mt-1 font-medium line-clamp-1 sm:line-clamp-none">
            {lang === 'ta'
              ? 'நட்பான உரையாடல் மற்றும் நாசா செயற்கைக்கோள் தரவுகளுடன் கூடிய விவசாய வழிகாட்டி.'
              : 'Smart conversational AI for general chat & precision agriculture grounded in NASA Earth telemetry.'}
          </p>
        </div>

        {/* Action Buttons: Clear Chat & Language Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
            title={lang === 'ta' ? 'அரட்டையை அழிக்கவும்' : 'Clear conversation'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{lang === 'ta' ? 'அழிக்க' : 'Clear'}</span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#238636] text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
            title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
          >
            <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[11px] sm:text-xs">{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Chat Screen */}
      <div className="h-[calc(100dvh-185px)] sm:h-[calc(100vh-210px)] min-h-[480px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 sm:gap-3 group ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-7 h-7 sm:w-8 h-8 rounded-lg sm:rounded-xl bg-emerald-100 text-[#238636] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                )}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-5 shadow-xs transition-all relative ${
                    isAi
                      ? 'bg-slate-50 border border-slate-200/90 text-slate-800'
                      : 'bg-[#238636] text-white rounded-tr-xs shadow-sm shadow-[#238636]/20'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-medium">
                    {renderFormattedText(m.text)}
                  </div>

                  {/* Message Meta Bar */}
                  <div
                    className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[9px] sm:text-[10px] ${
                      isAi ? 'border-slate-200/60 text-slate-400' : 'border-white/20 text-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{m.engine || (isAi ? 'AgriSense AI' : 'You')}</span>
                      <span>•</span>
                      <span>{m.time}</span>
                    </div>

                    {/* Copy Button for AI Messages */}
                    {isAi && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="opacity-70 hover:opacity-100 transition p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        title={lang === 'ta' ? 'பதிலை நகலெடு' : 'Copy message'}
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-[9px] text-emerald-600 font-bold">{lang === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Copied'}</span>
                          </>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {!isAi && (
                  <div className="w-7 h-7 sm:w-8 h-8 rounded-lg sm:rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex items-start gap-2.5 sm:gap-3 justify-start">
              <div className="w-7 h-7 sm:w-8 h-8 rounded-lg sm:rounded-xl bg-emerald-100 text-[#238636] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-150" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-300" />
                  <span className="ml-1 font-semibold text-slate-700 text-xs sm:text-sm">
                    {lang === 'ta' ? 'அக்ரிசென்ஸ் AI பதிலளிக்கிறது...' : 'AgriSense AI is thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Container */}
        {showSuggested && suggestedPrompts.length > 0 && (
          <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-slate-50/80 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#238636]" />
                <span>{lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட வினாக்கள்:' : 'Suggested Questions:'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSuggested(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer active:scale-95"
                title={lang === 'ta' ? 'வினாக்களை மறைக்க' : 'Hide suggested questions'}
                aria-label="Hide suggested questions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSendMessage(p.text)}
                  className="text-left text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-[#238636] transition shadow-2xs cursor-pointer active:scale-98 leading-snug"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ChatGPT-style Input Bar with Auto-expanding Textarea */}
        <div className="p-2.5 sm:p-3.5 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            {/* Quick Suggestions Restore Button if hidden */}
            {!showSuggested && suggestedPrompts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSuggested(true)}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-[#238636] transition shadow-2xs shrink-0 cursor-pointer active:scale-95 mb-0.5"
                title={lang === 'ta' ? 'பரிந்துரை வினாக்களைக் காட்டு' : 'Show suggested questions'}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            <div className="flex-1 min-w-0 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  lang === 'ta'
                    ? 'எதையும் கேளுங்கள்... (Shift + Enter புதிய வரிக்கு)'
                    : 'Ask anything... (Shift + Enter for new line)'
                }
                className="w-full resize-none px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] focus:ring-2 focus:ring-[#238636]/20 text-xs sm:text-sm bg-slate-50/50 focus:bg-white transition leading-relaxed max-h-32 overflow-y-auto block"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-xs cursor-pointer shrink-0 active:scale-95 mb-0.5"
              title={lang === 'ta' ? 'அனுப்ப (Enter)' : 'Send message (Enter)'}
            >
              <span className="hidden sm:inline">{lang === 'ta' ? 'அனுப்பு' : 'Send'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
