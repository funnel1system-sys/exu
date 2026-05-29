import { useEffect, useState, FormEvent } from 'react';
import { DCPass, ViewType } from '../types';
import { db } from '../supabase';
import { 
  FileSpreadsheet, 
  Search, 
  Eye, 
  Trash2, 
  Edit3, 
  QrCode, 
  ExternalLink, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Calendar, 
  Check,
  Download
} from 'lucide-react';
import QRCode from 'qrcode';

interface AllPassesViewProps {
  onSelectPass: (dcNumber: string) => void;
  onNavigate: (view: ViewType) => void;
}

export default function AllPassesView({ onSelectPass, onNavigate }: AllPassesViewProps) {
  const [passes, setPasses] = useState<DCPass[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [mineralFilter, setMineralFilter] = useState('all');
  const [uniqueMinerals, setUniqueMinerals] = useState<string[]>([]);

  // Modals & Sliders
  const [selectedQRPass, setSelectedQRPass] = useState<DCPass | null>(null);
  const [modalQRDataUrl, setModalQRDataUrl] = useState('');
  
  // Edit Pass State
  const [editingPass, setEditingPass] = useState<DCPass | null>(null);
  const [editVehicle, setEditVehicle] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editDriverMobile, setEditDriverMobile] = useState('');
  const [editNetWeight, setEditNetWeight] = useState('');
  const [editRouteName, setEditRouteName] = useState('');
  const [editJourneyEnd, setEditJourneyEnd] = useState('');

  // Notifications
  const [alertMsg, setAlertMsg] = useState('');
  const [isErrorAlert, setIsErrorAlert] = useState(false);

  const formatFlexibleDate = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getFlexibleStatus = (pass: DCPass): 'expired' | 'pending' | 'active' => {
    const now = new Date();
    const parseFlexibleDateLoc = (dateStr: string): Date => {
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
    const start = parseFlexibleDateLoc(pass.journey_start);
    const end = parseFlexibleDateLoc(pass.journey_end);
    if (end < now) return 'expired';
    if (start > now) return 'pending';
    return 'active';
  };

  const loadPasses = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await db.getAllPasses();
      setPasses(data);
      
      // Compute unique minerals list
      const mineralsSet = new Set<string>();
      data.forEach(p => {
        const primaryMin = p.mineral_name.split(' (')[0] || p.mineral_name;
        mineralsSet.add(primaryMin);
      });
      setUniqueMinerals(Array.from(mineralsSet));
    } catch (err: any) {
      console.error(err);
      if (!silent) triggerAlert('Failed to load passes database.', true);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPasses();
    const syncInterval = setInterval(() => {
      loadPasses(true);
    }, 4000);
    return () => clearInterval(syncInterval);
  }, []);

  const triggerAlert = (msg: string, isError = false) => {
    setAlertMsg(msg);
    setIsErrorAlert(isError);
    setTimeout(() => setAlertMsg(''), 5000);
  };

  const handleDelete = async (id: string, number: string) => {
    if (window.confirm(`Are you sure you want to delete pass #${number}? This action is irreversible.`)) {
      const deleted = await db.deletePass(id);
      if (deleted) {
        triggerAlert('Pass successfully purged from record.');
        loadPasses();
      } else {
        triggerAlert('Failed to complete pass erasure.', true);
      }
    }
  };

  // Triggers QR preview Modal
  const handleOpenQRModal = async (pass: DCPass) => {
    setSelectedQRPass(pass);
    try {
      const verificationUrl = `${window.location.origin}/#/pass/${pass.dc_number}`;
      const dataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 2
      });
      setModalQRDataUrl(dataUrl);
    } catch (err) {
      console.error('QR rendering error:', err);
      setModalQRDataUrl('');
    }
  };

  // Sets up Edit inline values
  const handleStartEdit = (pass: DCPass) => {
    setEditingPass(pass);
    setEditVehicle(pass.vehicle_number);
    setEditDriverName(pass.driver_name);
    setEditDriverMobile(pass.driver_mobile);
    setEditNetWeight(pass.net_weight);
    setEditRouteName(pass.route_name);
    
    // Format timestamp back to datetimelocal format
    try {
      const endParsed = new Date(pass.journey_end);
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${endParsed.getFullYear()}-${pad(endParsed.getMonth() + 1)}-${pad(endParsed.getDate())}T${pad(endParsed.getHours())}:${pad(endParsed.getMinutes())}`;
      setEditJourneyEnd(timeStr);
    } catch {
      setEditJourneyEnd('');
    }
  };

  const handleSaveEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPass) return;

    try {
      const endISO = new Date(editJourneyEnd).toISOString();
      const statusCheck = new Date(endISO) < new Date() ? 'expired' : 'active';

      await db.updatePass(editingPass.id, {
        vehicle_number: editVehicle.trim().toUpperCase(),
        driver_name: editDriverName.trim().toUpperCase(),
        driver_mobile: editDriverMobile.trim(),
        net_weight: editNetWeight.trim(),
        route_name: editRouteName.trim(),
        journey_end: endISO,
        status: statusCheck
      });

      triggerAlert('Transit credentials updated successfully.');
      setEditingPass(null);
      loadPasses();
    } catch (err: any) {
      console.error(err);
      triggerAlert(err.message || 'Failed to update credentials record.', true);
    }
  };

  // File download helper
  const handleDownloadInvoice = async (pass: DCPass) => {
    if (!pass.pdf_url) {
      // If no PDF URL at all, navigate and trigger printing of the pass layout
      onSelectPass(pass.dc_number);
      setTimeout(() => {
        window.print();
      }, 800);
      return;
    }

    try {
      const urlToDownload = await db.resolvePdfUrl(pass.pdf_url);
      if (!urlToDownload) throw new Error("Empty PDF URL");

      // For base64 data: or local blob: URLs
      if (urlToDownload.startsWith('blob:') || urlToDownload.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = urlToDownload;
        link.download = `DC-PASS-${pass.dc_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Try the most robust Ajax Blob download first to bypass iframe sandbox navigation restrictions
      try {
        const resp = await fetch(urlToDownload);
        if (resp.ok) {
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `DC-PASS-${pass.dc_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
          return; // Succeeded!
        }
      } catch (fetchErr) {
        console.warn("Blob fetch download failed, falling back to direct location/window trigger:", fetchErr);
      }

      // Fallback: browser default navigation or window opening
      const downloadUrl = urlToDownload.includes('?') 
        ? `${urlToDownload}&download=true` 
        : `${urlToDownload}?download=true`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = `DC-PASS-${pass.dc_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("All download routes failed:", err);
      // Fallback fallback: print standard layout if everything failed
      onSelectPass(pass.dc_number);
      setTimeout(() => {
        window.print();
      }, 800);
    }
  };

  // Searching index matching query
  const filteredPasses = passes.filter(pass => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = 
      pass.dc_number.toLowerCase().includes(q) ||
      pass.vehicle_number.toLowerCase().includes(q) ||
      pass.driver_name.toLowerCase().includes(q) ||
      pass.concession_holder.toLowerCase().includes(q);

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

    // Filter statuses (calculated dynamically on view based on system end datetime)
    const now = new Date();
    const end = parseFlexibleDate(pass.journey_end);
    const start = parseFlexibleDate(pass.journey_start);
    let currentStatus = pass.status;
    if (end < now) {
      currentStatus = 'expired';
    } else if (start > now) {
      currentStatus = 'pending';
    } else {
      currentStatus = 'active';
    }

    const matchStatus = statusFilter === 'all' || currentStatus === statusFilter;
    
    // Filter minerals
    const primaryMin = pass.mineral_name.split(' (')[0] || pass.mineral_name;
    const matchMineral = mineralFilter === 'all' || primaryMin === mineralFilter;

    return matchQuery && matchStatus && matchMineral;
  });

  return (
    <div className="space-y-6 text-slate-100 font-sans" id="all-passes-view">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-display text-white">Transit Logistics Ledger</h1>
          <p className="text-xs text-gray-400 mt-0.5">Unified registry containing official DC Mineral passage permissions and checkpost verifications.</p>
        </div>
        <button
          onClick={() => onNavigate('create-pass')}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-150 active:scale-95"
          id="new-pass-navigation-btn"
        >
          Issue New Pass
        </button>
      </div>

      {/* FLOATING SUCCESS ALERTS */}
      {alertMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
          isErrorAlert 
            ? 'bg-rose-950/40 border-rose-600/30 text-rose-200' 
            : 'bg-emerald-950/40 border-emerald-600/30 text-emerald-200'
        }`}>
          {isErrorAlert ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-xs font-semibold leading-relaxed">{alertMsg}</span>
        </div>
      )}

      {/* SEARCH AND SEARCH FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-950/30 p-4 border border-slate-900 rounded-2xl items-center" id="search-filter-controls">
        
        {/* Search */}
        <div className="md:col-span-5 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Pass No, Driver, Vehicle, Concession holder..."
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl glass-input placeholder-slate-500"
          />
        </div>

        {/* Status Category */}
        <div className="md:col-span-3 flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0 w-14">STATUS:</label>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Unfiltered (All)</option>
            <option value="active">Active Transit</option>
            <option value="pending">Scheduled (Pending)</option>
            <option value="expired">Expired Journey</option>
          </select>
        </div>

        {/* Mineral Category */}
        <div className="md:col-span-4 flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0 w-16">MINERAL:</label>
          <select
            value={mineralFilter}
            onChange={(e) => setMineralFilter(e.target.value)}
            className="w-full text-xs bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Minerals</option>
            {uniqueMinerals.map((m, idx) => (
              <option key={idx} value={m}>{m}</option>
            ))}
          </select>
        </div>

      </div>

      {/* DENSE LIST RESPONSIVE COMPONENT */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 overflow-hidden" id="pass-ledger-grid-view">
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400 mx-auto mb-3"></div>
            <p className="text-xs text-gray-400 font-mono animate-pulse">Consulting Secure Ledger Index...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-400">
              <thead className="text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="py-3 px-4">Pass Identifier</th>
                  <th className="py-3 px-4">Vehicle No</th>
                  <th className="py-3 px-4">Mineral specs</th>
                  <th className="py-3 px-4">Operator Crew</th>
                  <th className="py-3 px-4">Duration End</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-900/25 transition">
                    
                    {/* ID & Number */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-300">
                      <div className="flex flex-col">
                        <span className="text-white text-xs">{pass.dc_number.substring(0, 14)}...</span>
                        <span className="text-[9px] text-gray-500 break-all">{pass.dc_number.substring(14)}</span>
                      </div>
                    </td>

                    {/* Vehicle Number */}
                    <td className="py-3.5 px-4 font-mono text-white font-bold">{pass.vehicle_number}</td>

                    {/* Mineral Name & Weight */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 block truncate max-w-[140px]">{pass.mineral_name}</span>
                      <span className="font-mono text-[10px] text-green-400 font-black">{pass.net_weight} MT</span>
                    </td>

                    {/* Driver Detail */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 block font-medium truncate max-w-[120px]">{pass.driver_name}</span>
                      <span className="text-[10px] text-gray-500 font-mono block">{pass.driver_mobile || 'No contact'}</span>
                    </td>

                    {/* Journey Timeline */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">
                      {formatFlexibleDate(pass.journey_end)}
                    </td>

                    {/* State Status dynamic */}
                    <td className="py-3.5 px-4 text-center">
                      {(() => {
                        const s = getFlexibleStatus(pass);
                        return (
                          <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                            s === 'expired'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : s === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {s}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Button Controls */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenQRModal(pass)}
                          className="p-2 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-lg transition text-slate-400"
                          title="Generate QR Badge"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {pass.pdf_url && (
                          <button
                            onClick={() => handleDownloadInvoice(pass)}
                            className="p-2 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-lg transition text-slate-400"
                            title="Download Original PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectPass(pass.dc_number)}
                          className="p-2 hover:bg-emerald-505/10 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition text-slate-400"
                          title="Official Gujarat Government Pass Page"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(pass)}
                          className="p-2 hover:bg-amber-500/10 hover:text-amber-300 rounded-lg transition text-slate-400"
                          title="Modify active details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pass.id, pass.dc_number)}
                          className="p-2 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition text-slate-400"
                          title="Delete pass record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}

                {filteredPasses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500 text-xs font-mono">
                      No matching registered passes exist in this query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL 1: QR CODE BADGE VALIDATION */}
      {selectedQRPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in" id="qr-modal-window">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedQRPass(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mx-auto w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">QR Code Validation badge</h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5 select-all">DC: {selectedQRPass.dc_number}</p>
            </div>

            {/* QR display block */}
            <div className="p-3 bg-white max-w-[200px] mx-auto rounded-lg border border-slate-200">
              {modalQRDataUrl ? (
                <img src={modalQRDataUrl} className="w-full h-auto object-contain select-none" alt="Verification QR Code" />
              ) : (
                <div className="h-44 flex items-center justify-center bg-gray-50 text-gray-500">
                  Compiling QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-400 leading-normal bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              This code binds to <span className="text-emerald-400">{window.location.host}/#/pass/{selectedQRPass.dc_number.substring(0, 10)}...</span> that works as an online verification target for Gujarat police checking forces at terminal checkposts.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => onSelectPass(selectedQRPass.dc_number)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-2 px-3 rounded-lg text-xs tracking-wider text-white flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                Launch Verification Form <ExternalLink className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => setSelectedQRPass(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 font-bold py-2 px-3 rounded-lg text-xs text-slate-300 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TRANSIT PASS CREDENTIALS */}
      {editingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" id="edit-modal-window">
          <form onSubmit={handleSaveEditSubmit} className="bg-[#090d16] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingPass(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-lg">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Modify Transit Credentials</h3>
                <span className="text-[10px] text-indigo-400 font-mono">IDC: {editingPass.dc_number}</span>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vehicle License Plate</label>
                <input
                  type="text"
                  required
                  value={editVehicle}
                  onChange={(e) => setEditVehicle(e.target.value)}
                  className="w-full glass-input text-xs py-2 px-3 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Driver Name</label>
                <input
                  type="text"
                  required
                  value={editDriverName}
                  onChange={(e) => setEditDriverName(e.target.value)}
                  className="w-full glass-input text-xs py-2 px-3 rounded-lg uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Driver Mobile No</label>
                  <input
                    type="tel"
                    value={editDriverMobile}
                    onChange={(e) => setEditDriverMobile(e.target.value)}
                    className="w-full glass-input text-xs py-2 px-3 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Load Weight (MT)</label>
                  <input
                    type="text"
                    required
                    value={editNetWeight}
                    onChange={(e) => setEditNetWeight(e.target.value)}
                    className="w-full glass-input text-xs py-2 px-3 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned Highway Route</label>
                <input
                  type="text"
                  value={editRouteName}
                  onChange={(e) => setEditRouteName(e.target.value)}
                  className="w-full glass-input text-xs py-2 px-3 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Extended Journey Expiration End</label>
                <input
                  type="datetime-local"
                  required
                  value={editJourneyEnd}
                  onChange={(e) => setEditJourneyEnd(e.target.value)}
                  className="w-full glass-input text-xs py-2 px-3 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider hover:opacity-90 transition cursor-pointer"
              >
                Commit Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingPass(null)}
                className="w-full bg-slate-800 text-slate-350 hover:bg-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
export {};
