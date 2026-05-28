/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useDualMode } from "../context/DualModeContext";
import { DCPass } from "../types";
import PassCard from "./PassCard";
import ThemeToggle from "./ThemeToggle";
import { ShieldAlert, ShieldCheck, Search, ShieldX, ArrowLeft, Landmark } from "lucide-react";

interface VerificationPageProps {
  initialPassId?: string;
  onBackToHome: () => void;
}

export default function VerificationPage({ initialPassId, onBackToHome }: VerificationPageProps) {
  const { verifyPassStatus } = useDualMode();
  
  const [searchId, setSearchId] = useState(initialPassId || "");
  const [targetPass, setTargetPass] = useState<DCPass | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialPassId) {
      handleVerification(initialPassId);
    }
  }, [initialPassId]);

  const handleVerification = async (passIdStr: string) => {
    if (!passIdStr.trim()) return;
    setLoading(true);
    setErrorStatus(null);
    setChecked(true);
    setTargetPass(null);

    try {
      // Direct database or local fallback verification
      const fetchedPass = await verifyPassStatus(passIdStr.trim());
      if (fetchedPass) {
        setTargetPass(fetchedPass);
      } else {
        setErrorStatus("No registered digital DC Pass was identified under this verification sequence code.");
      }
    } catch (err: any) {
      setErrorStatus("A communication fault occurred during database check logic.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerification(searchId);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col items-center">
      
      {/* Top Banner Navigation */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-slate-800 rounded-xl">
            <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              DC Pass Validation Center
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              National Authority Verification Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={onBackToHome}
            className="px-3.5 py-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Home Console
          </button>
        </div>
      </header>

      {/* Main Validation Container */}
      <main className="w-full max-w-4xl p-6 md:p-12 flex flex-col items-center">
        
        {/* Verification status header alert badge */}
        <div className="text-center mb-8 max-w-xl">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Public Verification Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Verify the compliance, authenticity, and expiration status of any Digital DC Pass. Ensure parameters correspond with original physical transit manifests.
          </p>
        </div>

        {/* Search Check Bar */}
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md mb-8">
          <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter DC Pass ID (e.g., verify-dcp-400827)"
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Verify Code
            </button>
          </form>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-semibold uppercase font-mono text-slate-500">
              Querying Official Registry Databases...
            </p>
          </div>
        )}

        {/* Verification Result Showcase */}
        {checked && !loading && (
          <div className="w-full max-w-2xl space-y-6">
            
            {targetPass ? (
              <>
                {/* Certified Header Ribbon */}
                <div className={`p-4 rounded-2xl border flex gap-4 items-center ${
                  targetPass.status === "Approved" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400" 
                    : targetPass.status === "Pending"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-400"
                    : "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-400"
                }`}>
                  {targetPass.status === "Approved" ? (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex-shrink-0 animate-bounce">
                      <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl flex-shrink-0">
                      <ShieldAlert className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wide">
                      Registry Response: {targetPass.status === "Approved" ? "Certified Authenticity" : "Pass Status Checklist Check"}
                    </h3>
                    <p className="text-xs opacity-90 leading-tight mt-0.5">
                      This DC Pass documentation is registered under DC Pass registry databases. Official Status: <span className="font-bold underline">{targetPass.status}</span>.
                    </p>
                  </div>
                </div>

                {/* Actual Pass Display */}
                <PassCard pass={targetPass} />
              </>
            ) : (
              errorStatus && (
                <div className="p-8 rounded-3xl border border-red-200 dark:border-red-950 bg-white dark:bg-slate-900 shadow-lg text-center max-w-md mx-auto">
                  <div className="p-4 bg-red-100 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/60 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <ShieldX className="w-8 h-8 text-red-600 dark:text-rose-500" />
                  </div>
                  <h3 className="text-md font-extrabold text-red-700 dark:text-red-400 uppercase tracking-tight">
                    Verification Unsuccessful
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {errorStatus}
                  </p>
                </div>
              )
            )}

          </div>
        )}

      </main>
    </div>
  );
}
