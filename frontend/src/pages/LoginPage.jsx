import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, User, ShieldCheck, Tractor, ArrowRight, Globe, MapPin, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCountries, getStates, getDistricts } from '../data/locationHierarchy';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('farmer@agrisense.ai');
  const [password, setPassword] = useState('farmer123');
  const [name, setName] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          name,
          email,
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
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login('farmer@agrisense.ai', 'farmer123');
      navigate('/');
    } catch (err) {
      setError("Demo login error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-6">
        {/* Brand */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#238636] to-emerald-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-700/25 mb-3">
            <Leaf className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AgriSense <span className="text-[#238636]">AI</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Smart Crop Rotation & Soil Health Decision Platform
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Farmer Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Kandasamy Muthusamy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="farmer@agrisense.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#238636] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
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

          {isRegister && (
            <div className="space-y-3 pt-1">
              <div className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#238636]" />
                {lang === 'ta' ? 'பண்ணை இருப்பிடத் தேர்வு' : 'Farm Location Selection'}
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
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#238636] hover:bg-emerald-700 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2"
          >
            <span>{loading ? "Processing..." : (isRegister ? "Create Farmer Account" : "Sign In to Platform")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-bold">Or</span>
          </div>
        </div>

        {/* Instant Demo Access Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-[#238636] font-extrabold text-xs transition border border-slate-200 flex items-center justify-center gap-2"
        >
          <Tractor className="w-4 h-4 text-[#238636]" />
          Instant Demo Access (Cauvery Delta Farm)
        </button>

        <div className="text-center text-xs text-slate-500 pt-2">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="font-bold text-[#238636] hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New grower?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="font-bold text-[#238636] hover:underline"
              >
                Register Farm Profile
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

