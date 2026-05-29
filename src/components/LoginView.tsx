import { useState, FormEvent } from 'react';
import { authService, isMock } from '../supabase';
import { KeyRound, Mail, AlertCircle, Sparkles, Building2, Eye, EyeOff } from 'lucide-react';

interface LoginViewProps {
  onSuccess: (user: any) => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('admin@faruk.com');
  const [password, setPassword] = useState('faruq12345');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickLogin = async () => {
    setEmail('admin@faruk.com');
    setPassword('faruq12345');
    setLoading(true);
    setErrorMsg('');
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

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await authService.signIn(email, password);
      if (response.success) {
        onSuccess(response.user);
      } else {
        setErrorMsg(response.error || 'Authentication rejected. Verification failed.');
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
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-emerald-500/10 mb-3">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight font-display text-white">DC Pass Portal</h2>
          <p className="text-gray-400 text-xs mt-1">Commissioner of Geology & Mining Department Admin Platform</p>
        </div>



        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5" htmlFor="email-input">
              Administrator Email
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
                  Authenticating Session...
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
