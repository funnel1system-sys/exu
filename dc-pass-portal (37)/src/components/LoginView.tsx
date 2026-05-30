import { useState, FormEvent } from 'react';
import { authService, isMock } from '../supabase';
import { KeyRound, User, AlertCircle, Sparkles, Building2, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface LoginViewProps {
  onSuccess: (user: any) => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('faruq12345');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleQuickLogin = async () => {
    setUsername('admin');
    setPassword('faruq12345');
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await authService.signIn('admin', 'faruq12345');
      if (response.success) {
        onSuccess(response.user);
      } else {
        if (!isMock) {
          setErrorMsg("Account 'admin' (mapped to admin@faruk.com) does not exist in your live Supabase database yet. Create it in your Supabase Auth Panel first or switch to Simulated Local Mode below to test instantly!");
        } else {
          setErrorMsg(response.error || 'Autofill and login query failed.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Log in standard administrator using username/ID or email
      const response = await authService.signIn(username, password);
      if (response.success) {
        onSuccess(response.user);
      } else {
        if (!isMock && (response.error || '').toLowerCase().includes('invalid login')) {
          setErrorMsg("Invalid login credentials. Note: If using live Supabase, make sure a user with this username formatted as '" + (username.includes('@') ? username : `${username}@faruk.com`) + "' exists in your database.");
        } else {
          setErrorMsg(response.error || 'Authentication rejected. Email/Username or password incorrect.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Server connection error during authentication query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b13] p-4 relative overflow-hidden" id="admin-login-view">
      {/* Dynamic Cosmic Background Accents */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-emerald-950/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] glass-panel rounded-2xl md:p-8 p-6 shadow-2xl relative z-10 border border-slate-800 animate-fade-in">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center justify-center text-center mb-5">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-emerald-500/10 mb-3">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight font-display text-white">DC Pass Portal</h2>
          <p className="text-gray-400 text-xs mt-1">Commissioner of Geology & Mining Department Admin Platform</p>
        </div>

        {/* DATABASE CONNECTION STATUS INDICATOR & TOGGLE */}
        <div className="mb-5 flex flex-col items-center gap-2">
          {!isMock ? (
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Supabase Connected
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('force_mock', 'true');
                  window.location.reload();
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-medium underline mt-1.5 cursor-pointer"
              >
                Switch to Simulated Local Mode to test demo without DB setup
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                Simulated Local Mode
              </div>
              {localStorage.getItem('force_mock') === 'true' && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('force_mock');
                    window.location.reload();
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium underline mt-1.5 cursor-pointer"
                >
                  Click here to switch back to Live database mode
                </button>
              )}
            </div>
          )}
        </div>

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-start gap-2 text-xs">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-start gap-2 text-xs">
            <AlertCircle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* DEFAULT ACCOUNT PROMPT FOR EASY TESTING */}
        {username === 'admin' && (
          <div className="mb-5 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-200">Default Admin ID:</span> admin
            </div>
            <button
              type="button"
              onClick={handleQuickLogin}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider underline cursor-pointer"
            >
              Instant Login
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5" htmlFor="username-input">
              Administrator Username / ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                <User className="w-4.5 h-4.5" />
              </span>
              <input
                id="username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or username"
                className="w-full pl-10 pr-4 py-3 text-sm glass-input rounded-xl text-white bg-slate-950/50 border border-slate-850 focus:border-emerald-500 focus:outline-none transition duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5" htmlFor="password-input">
              Secret Security Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                <KeyRound className="w-4.5 h-4.5" />
              </span>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 text-sm glass-input rounded-xl text-white bg-slate-950/50 border border-slate-850 focus:border-emerald-500 focus:outline-none transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold py-3.5 px-4 rounded-xl text-white tracking-wide transition duration-300 transform hover:-translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Authenticating...
                </div>
              ) : (
                'Unseal Admin Dashboard'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-[11px] text-gray-500">
          Authorized personnel only. Access strictly logged & audited. <br />
          Department of Mines and Industries (Govt of Gujarat)
        </div>
      </div>
    </div>
  );
}
