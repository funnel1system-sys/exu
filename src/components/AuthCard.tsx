/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useDualMode } from "../context/DualModeContext";
import { UserRole } from "../types";
import { Shield, KeyRound, Mail, User, Landmark, HelpCircle, Check, AlertCircle } from "lucide-react";

export default function AuthCard() {
  const { signIn, signUp, resetPassword, firebaseActive } = useDualMode();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [department, setDepartment] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) throw new Error("Please fill in all standard credentials fields.");
        await signIn(email, password);
      } else if (mode === "register") {
        if (!email || !password || !displayName) throw new Error("E-Mail, Password, and Full Name are mandatory fields.");
        if (password.length < 6) throw new Error("Security policy checks dictate passwords must exceed 5 letters.");
        await signUp(email, password, displayName, role, department || undefined);
        setInfo("Registration successful! Authorized session active.");
      } else {
        if (!email) throw new Error("E-Mail is required to send recovery link.");
        await resetPassword(email);
        setInfo("E-Mail dispatch checklist active. If verified, access codes have been dispatched.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please verify values.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickMock = (type: "admin" | "user") => {
    setError(null);
    setInfo(null);
    if (type === "admin") {
      setEmail("funnel1system@gmail.com");
      setPassword("admin123");
    } else {
      setEmail("user@example.com");
      setPassword("user123");
    }
    setMode("login");
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Seal / Header banner */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-indigo-500/30 p-8 text-center bg-gradient-to-br from-slate-900 to-indigo-950">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-500/10 rounded-full blur-xl"></div>
        
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600/20 border border-indigo-400/30 rounded-2xl mb-4">
          <Shield className="w-8 h-8 text-indigo-400" />
        </div>
        
        <h1 className="font-sans text-xl font-bold tracking-tight text-white">
          Digital DC Pass Hub
        </h1>
        <p className="text-xs text-indigo-200/70 mt-1 max-w-xs mx-auto">
          Official District Commissioner Portals & Pass Administration System
        </p>

        {/* Quick Testing Badges */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button 
            type="button"
            onClick={() => fillQuickMock("admin")} 
            className="text-[10px] font-mono tracking-wider cursor-pointer bg-amber-500/10 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 py-1 px-2.5 rounded-lg transition-all duration-200"
          >
            🔑 Fill Admin
          </button>
          <button 
            type="button"
            onClick={() => fillQuickMock("user")} 
            className="text-[10px] font-mono tracking-wider cursor-pointer bg-teal-500/10 text-teal-300 hover:bg-teal-500/25 border border-teal-500/30 py-1 px-2.5 rounded-lg transition-all duration-200"
          >
            👤 Fill User
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Alerts Block */}
        {error && (
          <div className="flex gap-2 p-3.5 mb-5 rounded-xl text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}
        {info && (
          <div className="flex gap-2 p-3.5 mb-5 rounded-xl text-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 text-xs">
            <Check className="w-5 h-5 flex-shrink-0" />
            <p className="leading-relaxed">{info}</p>
          </div>
        )}

        {/* Mode Select Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setInfo(null); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center pointer transition-all duration-200 ${
              mode === "login"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            Portal Login
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); setInfo(null); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center pointer transition-all duration-200 ${
              mode === "register"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            Create Profile
          </button>
        </div>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Full Authorized Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter full legal name"
                    className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-hidden text-slate-800 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Testing Role Designation
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
                >
                  <option value="user">User / DC Pass Carrier</option>
                  <option value="admin">Admin / Compliance Auditor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Assigned Department (Optional)
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Civil Defense, Local Goods Dispatch"
                    className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-hidden text-slate-800 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {mode !== "forgot" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Portal Registered Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail address"
                    className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-hidden text-slate-800 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Account Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-hidden text-slate-800 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {mode === "forgot" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Provide Profile Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter registered e-mail address"
                  className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-hidden text-slate-800 dark:text-slate-100 transition-colors"
                />
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer font-medium"
              >
                Forgot Security Code/Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer py-3.5 select-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-colors flex items-center justify-center gap-2 "
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : mode === "login" ? (
              "Sign In"
            ) : mode === "register" ? (
              "Authorize Profile Draft"
            ) : (
              "Send Reset Link"
            )}
          </button>

          {mode === "forgot" && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 cursor-pointer"
              >
                Back to Sign-in Screen
              </button>
            </div>
          )}
        </form>

        {/* Engine mode display banner */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
            <span className={`w-2.5 h-2.5 rounded-full ${firebaseActive ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            <span className="text-[10px] font-mono tracking-wider text-slate-600 dark:text-slate-400 uppercase">
              {firebaseActive ? "Database status: Firebase Active" : "Database status: Local Fallback"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400/85 mt-2 leading-relaxed">
            Unauthorized system entry mapping is strictly monitored. Audit logs are logged and timestamp preserved.
          </p>
        </div>
      </div>
    </div>
  );
}
