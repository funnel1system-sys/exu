import { LayoutDashboard, FileSpreadsheet, PlusCircle, LogOut, AppWindow, ShieldAlert } from 'lucide-react';
import { ViewType } from '../types';
import { isMock } from '../supabase';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  adminEmail?: string;
}

export default function Sidebar({ currentView, onNavigate, onLogout, adminEmail }: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Overview metrics'
    },
    {
      id: 'create-pass' as ViewType,
      label: 'Create Pass',
      icon: PlusCircle,
      desc: 'Generate new transit pass'
    },
    {
      id: 'all-passes' as ViewType,
      label: 'All Passes',
      icon: FileSpreadsheet,
      desc: 'Manage & verify records'
    }
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-[#090d16] border-r border-slate-800 h-screen sticky top-0 justify-between self-start p-6 text-slate-100 shadow-xl" id="desktop-sidebar">
        <div>
          {/* Header Portal Title */}
          <div className="flex items-center gap-3.5 mb-8" id="sidebar-header">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              CGM
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-emerald-400 font-display">DC Pass Portal</h2>
              <span className="text-[10px] text-gray-400 block -mt-0.5">ADMIN PANEL V1.0</span>
            </div>
          </div>

          {/* Sandbox Indicator */}
          {isMock && (
            <div className="mb-6 p-3 bg-teal-950/30 border border-teal-800/30 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>SANDBOX ENGINE ACTIVE</span>
            </div>
          )}

          {/* Nav Items */}
          <nav className="space-y-1.5" id="sidebar-nav">
            <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-3 mb-2">OPERATIONS</span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-150 text-left font-sans text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-indigo-500/10 text-emerald-300 border-l-4 border-emerald-500'
                      : 'text-gray-400 hover:text-white hover:bg-slate-800/20 hover:translate-x-1'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-white'}`} />
                  <div>
                    <span className="font-semibold block leading-tight">{item.label}</span>
                    <span className="text-[10px] text-gray-500 block leading-none mt-0.5">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info / Logout */}
        <div className="space-y-4 pt-6 border-t border-slate-800 font-sans">
          <div className="flex items-center gap-2.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs text-uppercase font-mono">
              {adminEmail ? adminEmail.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white leading-tight truncate">{adminEmail || 'Admin Officer'}</p>
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Mines Registrar</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full text-left text-slate-400 hover:text-rose-400 flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-rose-500/5 transition text-xs font-semibold"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
            <span>Terminate Admin Session</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM MENU RAIL */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-4 items-center justify-center text-center text-[10px] z-50 shadow-inner px-2" id="mobile-bottom-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1.5 h-full ${
                isActive ? 'text-emerald-400 font-bold' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center gap-1.5 h-full text-gray-400 hover:text-rose-400"
        >
          <LogOut className="w-5 h-5 text-gray-500" />
          <span className="text-[10px] leading-none">Logout</span>
        </button>
      </nav>
    </>
  );
}
