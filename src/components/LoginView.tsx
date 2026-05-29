import { useState, FormEvent } from 'react';
import { authService, isMock } from '../supabase';
import { KeyRound, Mail, AlertCircle, Sparkles, Building2, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface LoginViewProps {
  onSuccess: (user: any) => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('admin@faruk.com');
  const [password, setPassword] = useState('faruq12345');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleQuickLogin = async () => {
    setEmail('admin@faruk.com');
    setPassword('faruq12345');
    setIsRegistering(false);
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await authService.signIn('admin@faruk.com', 'faruq12345');
      if (response.success) {
        onSuccess(response.user);
      } else {
        setErrorMsg(response.error || 'Autofill and login query failed.');
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
      if (isRegistering) {
        // Register standard administrator account
        const response = await authService.signUp(email, password);
        if (response.success) {
          if (response.user && !isMock) {
            setSuccessMsg(response.message || 'Verification email sent! If auto-confirm is enabled in your database, you can switch to the Sign In tab and log in immediately.');
          } else {
            // Simulated / Mock success or auto-login
            onSuccess(response.user);
          }
        } else {
          setErrorMsg(response.error || 'Registration failed. Please check your credentials.');
        }
      } else {
        // Log in standard administrator
        const response = await authService.signIn(email, password);
        if (response.success) {
          onSuccess(response.user);
        } else {
          setErrorMsg(response.error || 'Authentication rejected. Email or password incorrect.');
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

        {/* DATABASE CONNECTION STATUS INDICATOR */}
        <div className="mb-5 flex justify-center">
          {isMock ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Simulated Local Mode
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Supabase Connected
            </div>
          )}
        </div>

        {/* TABS SELECTOR */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition duration-200 ${
              !isRegistering
                ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-400 border border-emerald-500/25 shadow-inner'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition duration-200 ${
              isRegistering
                ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-400 border border-emerald-500/25 shadow-inner'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Admin
          </button>
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
        {!isRegistering && email === 'admin@faruk.com' && (
          <div className="mb-5 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-200">Test Account:</span> admin@faruk.com
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
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5" htmlFor="email-input">
              {isRegistering ? 'Register Admin Email' : 'Administrator Email'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@faruk.com"
                className="w-full pl-10 pr-4 py-3 text-sm glass-input rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5" htmlFor="password-input">
              {isRegistering ? 'Choose Security Password' : 'Secret Security Password'}
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
                className="w-full pl-10 pr-10 py-3 text-sm glass-input rounded-xl"
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
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold py-3.5 px-4 rounded-xl text-white tracking-wide transition duration-300 transform hover:-translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Processing Option...
                </div>
              ) : isRegistering ? (
                'Create Admin Credentials'
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
