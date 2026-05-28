/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { DualModeProvider, useDualMode } from "./context/DualModeContext";
import AuthCard from "./components/AuthCard";
import ThemeToggle from "./components/ThemeToggle";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import VerificationPage from "./components/VerificationPage";
import { 
  ShieldCheck, LogOut, Landmark, User, ShieldAlert, BookOpen, ExternalLink, QrCode
} from "lucide-react";

function RootPageController() {
  const { user, loading, signOut, firebaseActive } = useDualMode();
  
  // Custom router state triggered dynamically by scanning or URLs
  const [verifyPassId, setVerifyPassId] = useState<string | null>(null);
  const [manualVerifyMode, setManualVerifyMode] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/verify/")) {
      const passId = decodeURIComponent(path.split("/verify/")[1] || "").trim();
      if (passId) {
        setVerifyPassId(passId);
      }
    } else if (path.startsWith("/pass/")) {
      const passId = decodeURIComponent(path.split("/pass/")[1] || "").trim();
      if (passId) {
        setVerifyPassId(passId);
      }
    }
  }, []);

  const handleBackToHome = () => {
    setVerifyPassId(null);
    setManualVerifyMode(false);
    // Overwrite route prefix visually
    if (window.location.pathname.startsWith("/verify/") || window.location.pathname.startsWith("/pass/")) {
      window.history.pushState({}, "", "/");
    }
  };

  const handleNavigateVerifyDirect = () => {
    setManualVerifyMode(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 border-4 border-indigo-600/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-4 bg-white dark:bg-slate-900 border border-slate-250/30 dark:border-slate-800 rounded-full flex items-center justify-center">
            <Landmark className="w-6 h-6 text-indigo-500 animate-pulse" />
          </div>
        </div>
        <h3 className="font-sans text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
          Digital DC Pass Hub
        </h3>
        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold font-mono">
          Syncing cryptographic security registers...
        </p>
      </div>
    );
  }

  // Route to Public verification page if active URL match OR manually triggered
  if (verifyPassId !== null || manualVerifyMode) {
    return (
      <VerificationPage 
        initialPassId={verifyPassId || undefined} 
        onBackToHome={handleBackToHome} 
      />
    );
  }

  // Not logged in: Show Authentication card
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-12 px-4 flex flex-col items-center justify-center space-y-8">
        
        {/* Floating Controls at Top Right */}
        <div className="fixed top-6 right-6 flex items-center gap-3">
          <button
            onClick={handleNavigateVerifyDirect}
            className="px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            Verify Pass
          </button>
          <ThemeToggle />
        </div>

        {/* Central Auth Interface */}
        <AuthCard />

        {/* Informative Help Guide footer */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-md text-xs leading-relaxed space-y-3">
          <div className="flex gap-2 items-center text-slate-800 dark:text-slate-200">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h4 className="font-bold uppercase tracking-wide">Quick Operations Guide</h4>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            The pass digital manager provides automatic PDF field extraction. Sign up using the testing controls on our authentication card to immediately preview user uploads and admin compliance approvals.
          </p>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col">
      
      {/* Central Admin/User Header Menu */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">
                  DC Pass Hub
                </span>
                <span className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded-md ${
                  user.role === "admin" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-450" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {user.role} console
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium">
                Official Compliance Validation System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* User profile parameters */}
            <div className="hidden md:flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4 text-right">
              <div>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 block">
                  {user.displayName || "Authorized staff"}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block font-semibold leading-none">
                  {user.email} {user.department ? `| ${user.department}` : ""}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-205/30 dark:border-slate-700 rounded-xl">
                <User className="w-4 h-4 text-indigo-500" />
              </div>
            </div>

            {/* Public search bar query redirect */}
            <button
              onClick={handleNavigateVerifyDirect}
              className="px-3.5 py-2.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              Verify Pass
            </button>

            {/* Quick dashboard custom toggle */}
            <ThemeToggle />

            <button
              onClick={() => signOut()}
              className="p-2.5 rounded-xl border border-red-200 dark:border-red-950 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer shadow-xs"
              title="Portal Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>

          </div>

        </div>
      </header>

      {/* Main Panel Content wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic DB indicator flag warning banner */}
        {!firebaseActive && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5 text-xs text-amber-800 dark:text-amber-400 leading-normal">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase tracking-wider block mb-0.5">Iframe Isolation Sandbox Warning</span>
              We are utilizing our high-fidelity client-only database simulation because the Firebase configuration is not currently provisioned via UI tools. No credentials or files will leak to third-party endpoints, and operations are preserved securely in your browser cache.
            </div>
          </div>
        )}

        {/* Sub-view router mapping */}
        {user.role === "admin" ? <AdminDashboard /> : <UserDashboard />}

      </main>

      {/* Corporate Platform Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <span>© 2026 DIGITAL DC PASS HUB · ALL RECORDS PROTECTED</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${firebaseActive ? "bg-emerald-500 animate-pulse" : "bg-teal-500"}`}></span>
            {firebaseActive ? "SECURE FIREBASE BACKEND ROUTE" : "SECURE OFFLINE SANDBOX SIMULATION"}
          </span>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <DualModeProvider>
      <RootPageController />
    </DualModeProvider>
  );
}
