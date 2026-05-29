import { useEffect, useState } from 'react';
import { DCPass, ViewType } from '../types';
import { db } from '../supabase';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  ChevronRight, 
  Activity, 
  FileSpreadsheet, 
  Truck,
  Layers
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void;
  onSelectPass: (dcNumber: string) => void;
}

export default function DashboardView({ onNavigate, onSelectPass }: DashboardViewProps) {
  const [passes, setPasses] = useState<DCPass[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time metrics based on current system time
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
    totalWeight: 0
  });

  const [mineralData, setMineralData] = useState<{ name: string; weight: number; percent: number }[]>([]);

  useEffect(() => {
    async function loadStats(silent = false) {
      try {
        if (!silent) setLoading(true);
        const data = await db.getAllPasses();
        setPasses(data);
        
        // Calculate dynamic stats
        const now = new Date();
        let activeCount = 0;
        let pendingCount = 0;
        let expiredCount = 0;
        let totalWeightMT = 0;
        
        const mineralCounts: { [key: string]: number } = {};

        const parseFlexibleDate = (dateStr: string): Date => {
          let date = new Date(dateStr);
          if (isNaN(date.getTime()) && dateStr && dateStr.includes('/')) {
            try {
              const parts = dateStr.trim().split(/\s+/);
              if (parts.length >= 2) {
                const dateParts = parts[0].split('/');
                const timeParts = parts[1].split(':');
                let hours = parseInt(timeParts[0] || '0', 10);
                const minutes = parseInt(timeParts[1] || '0', 10);
                const seconds = parseInt(timeParts[2] || '0', 10);
                if (parts[2] && parts[2].toUpperCase() === 'PM' && hours < 12) {
                  hours += 12;
                } else if (parts[2] && parts[2].toUpperCase() === 'AM' && hours === 12) {
                  hours = 0;
                }
                const parsed = new Date(
                  parseInt(dateParts[2], 10),
                  parseInt(dateParts[1], 10) - 1,
                  parseInt(dateParts[0], 10),
                  hours,
                  minutes,
                  seconds
                );
                if (!isNaN(parsed.getTime())) {
                  return parsed;
                }
              }
            } catch (e) {}
          }
          return date;
        };

        data.forEach(pass => {
          const start = parseFlexibleDate(pass.journey_start);
          const end = parseFlexibleDate(pass.journey_end);
          const weightVal = parseFloat(pass.net_weight) || 0;
          
          totalWeightMT += weightVal;
          
          if (end < now) {
            expiredCount++;
          } else if (start > now) {
            pendingCount++;
          } else {
            activeCount++;
          }

          // Group by mineral
          const minName = pass.mineral_name.split(' ')[0] || 'Other';
          mineralCounts[minName] = (mineralCounts[minName] || 0) + weightVal;
        });

        setStats({
          total: data.length,
          active: activeCount,
          pending: pendingCount,
          expired: expiredCount,
          totalWeight: parseFloat(totalWeightMT.toFixed(2))
        });

        // Compute mineral chart distribution
        const maxWeight = Math.max(...Object.values(mineralCounts), 1);
        const sortedMinerals = Object.entries(mineralCounts).map(([name, weight]) => ({
          name,
          weight: parseFloat(weight.toFixed(2)),
          percent: Math.min(Math.round((weight / maxWeight) * 100), 100)
        })).sort((a,b) => b.weight - a.weight);

        setMineralData(sortedMinerals);
      } catch (err) {
        console.error('Failed to compute analytics:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    }
    loadStats();
    const intervalId = setInterval(() => {
      loadStats(true);
    }, 4000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]" id="dashboard-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400 mb-3"></div>
        <p className="text-gray-400 text-sm animate-pulse font-mono">Running Transit Analytics Queries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100" id="dashboard-view">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-indigo-950/25 to-[#0b0f19] p-6 rounded-2xl border border-slate-800/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display text-white">Transit Logistics Command</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time administrative registry tracking mineral transit credentials and active checkposts.
          </p>
        </div>
        <div>
          <button
            onClick={() => onNavigate('create-pass')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold h-11 px-5 rounded-xl text-sm transition duration-150 transform hover:-translate-y-[1px] shadow-md shadow-emerald-500/10 active:scale-95"
            id="quick-create-pass-btn"
          >
            <Plus className="w-4 h-4" /> Issue DC Pass
          </button>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-dashboard-cards">
        
        {/* Total Passes */}
        <div className="glass-panel p-5 rounded-2xl relative border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aggregate Passes</span>
            <span className="p-2 bg-slate-800/40 rounded-xl text-slate-300">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-white mb-1">{stats.total}</h3>
            <p className="text-[11px] text-gray-500 font-mono">Issued state registry passes</p>
          </div>
        </div>

        {/* Active Passes */}
        <div className="glass-panel p-5 rounded-2xl relative border border-slate-800/80 flex flex-col justify-between hover:border-emerald-800/80 transition duration-200">
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Active Transit</span>
            <span className="p-2 bg-emerald-900/15 rounded-xl text-emerald-400 border border-emerald-500/10">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-emerald-400 mb-1">{stats.active}</h3>
            <p className="text-[11px] text-emerald-500 font-mono">On-road validation active</p>
          </div>
        </div>

        {/* Pending Passes */}
        <div className="glass-panel p-5 rounded-2xl relative border border-slate-800/80 flex flex-col justify-between hover:border-amber-800/80 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Scheduled (Pending)</span>
            <span className="p-2 bg-amber-900/15 rounded-xl text-amber-400 border border-amber-500/10">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-amber-400 mb-1">{stats.pending}</h3>
            <p className="text-[11px] text-amber-500/80 font-mono">Yet to initiate journey</p>
          </div>
        </div>

        {/* Expired Passes */}
        <div className="glass-panel p-5 rounded-2xl relative border border-slate-800/80 flex flex-col justify-between hover:border-rose-900/80 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Expired Passes</span>
            <span className="p-2 bg-rose-900/15 rounded-xl text-rose-400 border border-rose-500/10">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-rose-400 mb-1">{stats.expired}</h3>
            <p className="text-[11px] text-rose-500 font-mono">Expired credentials checklist</p>
          </div>
        </div>

      </div>

      {/* DETAILED INSIGHTS PANEL (BENTO COLUMN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="bento-dashboard-details">
        
        {/* CHART WIDGET: MINERAL DISTRIBUTIONS */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Mineral Payload Allocation</h3>
              </div>
              <span className="text-xs bg-slate-800/80 px-2.5 py-1 rounded-md font-mono text-emerald-400 border border-slate-700">
                {stats.totalWeight} Tons Total
              </span>
            </div>
            
            {/* SVG custom highly readable bar components */}
            <div className="space-y-4 mt-6">
              {mineralData.length > 0 ? (
                mineralData.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300 font-mono">{idx + 1}. {item.name}</span>
                      <span className="text-indigo-300 font-mono">{item.weight} MT</span>
                    </div>
                    <div className="w-full bg-slate-900/80 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-gray-500">
                  No active mineral transits on record. Pass lists empty.
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-[11px] text-gray-500 font-mono">
            <span>● Secured Logistics Ledger</span>
            <span>Refreshed: live state sync</span>
          </div>
        </div>

        {/* RECENT PASS LOGS PANEL */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Recent Pass Logs</h3>
              </div>
              <button 
                onClick={() => onNavigate('all-passes')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center font-bold"
              >
                Inspect All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
              {passes.slice(0, 4).map((pass) => (
                <div 
                  key={pass.id}
                  onClick={() => onSelectPass(pass.dc_number)}
                  className="p-3 bg-slate-900/40 hover:bg-slate-800/30 border border-slate-800/40 rounded-xl flex items-center justify-between cursor-pointer transition active:scale-98 group"
                >
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-black font-mono text-indigo-300 tracking-wider block group-hover:text-emerald-300 transition">
                      {pass.dc_number.substring(0, 12)}...
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono mt-0.5 block truncate">
                      {pass.vehicle_number} | {pass.mineral_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${
                      pass.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : pass.status === 'expired'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {pass.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
                  </div>
                </div>
              ))}
              
              {passes.length === 0 && (
                <div className="text-center py-10 text-xs text-gray-500">
                  No registered DC passes found.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs text-slate-400 leading-normal">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-300 flex-shrink-0" />
                <span className="font-semibold">Transit Data Ledger Status</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">Online & Operational</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
export {};
