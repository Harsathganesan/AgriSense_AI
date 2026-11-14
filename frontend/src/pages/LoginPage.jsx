import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, User, ArrowRight, ArrowLeft, Globe, MapPin, Building, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCountries, getStates, getDistricts } from '../data/locationHierarchy';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1: Credentials, 2: Location

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Dynamic Cascading Location Selection
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Thanjavur');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Available options
  const countries = getCountries();
  const states = getStates(country);
  const districts = getDistricts(country, state);

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    const newStates = getStates(newCountry);
    const firstState = newStates[0] || '';
    setState(firstState);
    const newDistricts = getDistricts(newCountry, firstState);
    setDistrict(newDistricts[0] || '');
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setState(newState);
    const newDistricts = getDistricts(country, newState);
    setDistrict(newDistricts[0] || '');
  };

  const handleToggleMode = (registerMode) => {
    setIsRegister(registerMode);
    setRegisterStep(1);
    setError('');
  };

  const handleNextStep = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'ta' ? 'தயவுசெய்து உங்கள் முழுப் பெயரை உள்ளிடவும்.' : 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(lang === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError(lang === 'ta' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.' : 'Password must be at least 6 characters long.');
      return;
    }

    setRegisterStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          country,
          state,
          district,
          registered_location: {
            country,
            state,
            district
          },
          language: lang
        });
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || (lang === 'ta' ? "உள்நுழைவு தோல்வியடைந்தது. விவரங்களை சரிபார்க்கவும்." : "Authentication failed. Please verify credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#238636] to-emerald-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-700/25 mb-3">
            <Leaf className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AgriSense <span className="text-[#238636]">AI</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ta'
              ? 'விவசாயிகளுக்கான மண் வளம் மற்றும் பயிர் சுழற்சி வழிகாட்டி'
              : 'Smart Crop Rotation & Soil Health Decision Platform'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in">
            {error}
          </div>
        )}

        {/* Stepper Header for Registration */}
        {isRegister && (
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#238636] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                1
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {lang === 'ta' ? 'கணக்கு' : 'Account'}
              </span>
            </div>
            <div className="h-0.5 flex-1 mx-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-[#238636] transition-all duration-300 ${
                  registerStep === 2 ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  registerStep === 2
                    ? 'bg-[#238636] text-white shadow-sm'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </span>
              <span
                className={`font-bold text-xs ${
                  registerStep === 2 ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {lang === 'ta' ? 'இருப்பிடம்' : 'Location'}
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* LOGIN OR REGISTER STEP 1 */}
          {(!isRegister || registerStep === 1) && (
            <div className="space-y-3.5">
              {isRegister && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {lang === 'ta' ? 'விவசாயி முழுப் பெயர்' : 'Farmer Full Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder={lang === 'ta' ? 'எ.கா. கந்தசாமி முத்துசாமி' : 'e.g. Kandasamy Muthusamy'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="farmer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ta' ? 'கடவுச்சொல்' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                  />
                </div>
              </div>

              {isRegister ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-3 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <span>{lang === 'ta' ? 'அடுத்து (இருப்பிடம்)' : 'Next (Location)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <span>
                    {loading
                      ? (lang === 'ta' ? 'சரிபார்க்கப்படுகிறது...' : 'Signing In...')
                      : (lang === 'ta' ? 'தளத்தில் உள்நுழைக' : 'Sign In to Platform')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* REGISTER STEP 2: LOCATION */}
          {isRegister && registerStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                <MapPin className="w-3.5 h-3.5 text-[#238636]" />
                {lang === 'ta' ? 'பண்ணை இருப்பிட விவரங்கள்' : 'Farm Location Details'}
              </div>

              {/* Cascading 1: Country */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ta' ? 'நாடு (Country)' : 'Country'}
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={country}
                    onChange={handleCountryChange}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#238636] text-sm appearance-none font-medium cursor-pointer"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cascading 2: State */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ta' ? 'மாநிலம் (State)' : 'State / Province'}
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={state}
                    onChange={handleStateChange}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#238636] text-sm appearance-none font-medium cursor-pointer"
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cascading 3: District */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ta' ? 'மாவட்டம் (District)' : 'District'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#238636] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#238636] text-sm appearance-none font-semibold cursor-pointer"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Navigation Buttons for Step 2 */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setRegisterStep(1);
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'ta' ? 'பின்செல்' : 'Back'}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {loading
                      ? (lang === 'ta' ? 'கணக்கு உருவாக்கப்படுகிறது...' : 'Creating Account...')
                      : (lang === 'ta' ? 'கணக்கை உருவாக்கு' : 'Create Farmer Account')}
                  </span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
          {isRegister ? (
            <p>
              {lang === 'ta' ? 'ஏற்கனவே கணக்கு உள்ளதா?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => handleToggleMode(false)}
                className="font-bold text-[#238636] hover:underline cursor-pointer"
              >
                {lang === 'ta' ? 'உள்நுழைக (Sign In)' : 'Sign In'}
              </button>
            </p>
          ) : (
            <p>
              {lang === 'ta' ? 'புதிய விவசாயியா?' : 'New grower?'}{' '}
              <button
                type="button"
                onClick={() => handleToggleMode(true)}
                className="font-bold text-[#238636] hover:underline cursor-pointer"
              >
                {lang === 'ta' ? 'புதிய கணக்கு பதிவு செய்' : 'Register Farm Profile'}
              </button>
            </p>
          )}
        </div>

        {/* Clean Cloud Backend Status Footer */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AgriSense AI Cloud Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
