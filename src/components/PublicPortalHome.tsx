import React, { useState } from 'react';
import { Search, ShieldAlert, Sparkles, LogIn, ExternalLink } from 'lucide-react';
// @ts-ignore
import logoImg from '../assets/images/cgm_gujarat_logo_1779943769415.png';

interface PublicPortalHomeProps {
  onSearch: (dcNumber: string) => void;
  onGoToLogin: () => void;
}

export default function PublicPortalHome({ onSearch, onGoToLogin }: PublicPortalHomeProps) {
  const [dcNumber, setDcNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = dcNumber.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a valid DC Pass Number');
      return;
    }
    setError('');
    onSearch(clean);
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-300 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white" id="public-portal-root">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-900 bg-[#0b1322]/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="CGM logo" 
              className="w-12 h-12 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">Commissioner of Geology and Mining</h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-tight">GOVERNMENT OF GUJARAT — TRANSIT PASS PORTAL</p>
            </div>
          </div>
          
          <button 
            onClick={onGoToLogin}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-850 hover:bg-emerald-900/50 hover:text-emerald-300 transition-all cursor-pointer self-start sm:self-center"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Administrator Login</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        
        {/* HERO TITLE */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 mb-4 animate-fade-in">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Public Verification Service Active</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Verify Your Delivery Challan <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">(DC Pass)</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400 max-w-xl mx-auto">
            Review live transit statuses, cargo metrics, and authorized routes directly. Open and download authentic digital transit permits without any prior registration.
          </p>
        </div>

        {/* SEARCH WIDGET CARD */}
        <div className="bg-[#0b1322] border border-slate-900 rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden max-w-2xl w-full mx-auto">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="dc-verify-input" className="block text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                Enter Transit Pass Number (DC Number)
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 h-5 text-gray-500" />
                </div>
                <input
                  id="dc-verify-input"
                  type="text"
                  required
                  placeholder="e.g., STQL22091277054411223398"
                  value={dcNumber}
                  onChange={(e) => {
                    setDcNumber(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-10 pr-4 py-3 bg-[#070b13] border border-slate-800 rounded-lg text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base tracking-widest uppercase transition-all"
                />
              </div>
              
              {error && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold text-[#070b13] bg-gradient-to-r from-emerald-400 to-teal-400 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer font-sans uppercase tracking-wide"
            >
              <span>Search & Open Transit Pass</span>
              <ExternalLink className="w-4 h-4 text-[#070b13]" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-900/60 pt-5 flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-mono">Direct URL structure: /pass/YOUR_DC_NUMBER</span>
            <span>CORS Compliant File Engine</span>
          </div>
        </div>

        {/* SECURITY BULLETIN BLOCK */}
        <div className="mt-12 text-center max-w-lg mx-auto">
          <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
            NOTICE: This is an official secure document verification lookup service of the Commissioner of Geology and Mining system of Gujarat. All transactions are logged for security audits in defense against document forgery.
          </p>
        </div>

      </main>

      {/* FOOTER SECTION */}
      <footer className="border-t border-slate-900 bg-[#070b13] px-4 py-4 text-center text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} Commissioner of Geology and Mining. All Rights Reserved.</span>
          <span>Designed with SSL Encryption &amp; Offline Retrieval Falls</span>
        </div>
      </footer>

    </div>
  );
}
