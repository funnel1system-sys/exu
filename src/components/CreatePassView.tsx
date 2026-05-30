import { useState, useRef, FormEvent, DragEvent, ChangeEvent } from 'react';
import { db } from '../supabase';
import { DCPass, ViewType } from '../types';
import { 
  PlusCircle, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  User, 
  Calendar, 
  Activity, 
  FileText 
} from 'lucide-react';

interface CreatePassViewProps {
  onNavigate: (view: ViewType) => void;
  onSelectPass: (dcNumber: string) => void;
}

export default function CreatePassView({ onNavigate, onSelectPass }: CreatePassViewProps) {
  // Input fields for all template components - strictly text or simple number fields (zero selectors or picker dropdowns)
  const [dcNumber, setDcNumber] = useState('');
  const [royaltyIssued, setRoyaltyIssued] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [mineralName, setMineralName] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [concessionHolder, setConcessionHolder] = useState('');
  const [sourcePlace, setSourcePlace] = useState('');
  const [purchaserName, setPurchaserName] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  const [journeyStart, setJourneyStart] = useState('');
  const [journeyEnd, setJourneyEnd] = useState('');
  const [routeName, setRouteName] = useState('');
  const [duration, setDuration] = useState('');
  const [checkpost, setCheckpost] = useState('');
  const [driverName, setDriverName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [panGstin, setPanGstin] = useState('');
  const [gpsDetails, setGpsDetails] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [buyerMobile, setBuyerMobile] = useState('');
  
  // File upload state (Invoices / Pass PDF)
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status logs
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successPass, setSuccessPass] = useState<DCPass | null>(null);

  // Quick action: Autofill exactly the template details from the Gujarat screenshot
  const handleAutofillMock = () => {
    const randomSuffix = String(Math.floor(10 + Math.random() * 90));
    setDcNumber(`STQL220912770544112233${randomSuffix}`);
    setRoyaltyIssued('27/05/2026 02:00:00 PM');
    setVehicleNumber('GJ01XY9988 / Goods Carrier(HGV)');
    setMineralName('Silica Sand Grade-II');
    setNetWeight('32.50');
    setConcessionHolder('Saurashtra Mining Corp');
    setSourcePlace('Mines Plot 12, Chotila, Surendranagar');
    setPurchaserName('D Y MINCHEM');
    setDestination('Morbi Ceramic Hub, Morbi');
    setDistance('395 Km');
    setJourneyStart('27/05/2026 08:00:00 AM');
    setJourneyEnd('29/05/2026 06:00:00 PM');
    setRouteName('State Highway 17 & NH 8A');
    setDuration('2 Day(s) 10 Hour(s) 0 Min');
    setCheckpost('');
    setDriverName('RAJESH PATEL');
    setLicenseNumber('GJ0120220011992');
    setDriverMobile('9876543210');
    setPanGstin('ABCPG3241F / 24ABCPG3241F1ZD');
    setGpsDetails('Whelseye OBD-T14');
    setTransporterName('Maruti Transport');
    setBuyerMobile('9426123456');
  };

  // Drag and drop events
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setPdfFile(file);
        setPdfFileName(file.name);
      } else {
        setErrorMsg('Only PDF documents are validated for government compliance invoices.');
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setPdfFile(file);
        setPdfFileName(file.name);
      } else {
        setErrorMsg('Only PDF documents are validated for government compliance invoices.');
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessPass(null);

    // Initial validations to keep the form reliable
    if (!dcNumber || !vehicleNumber || !mineralName || !netWeight || !journeyStart || !journeyEnd) {
      setErrorMsg('Ensure all marked fields are completed properly.');
      setSubmitting(false);
      return;
    }

    try {
      let uploadedPdfUrl = '';
      let pdfBase64 = '';
      if (pdfFile) {
        // Read file to base64 string
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('Conversion to base64 was empty'));
          };
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(pdfFile);
        });
        uploadedPdfUrl = await db.uploadPassPDF(pdfFile, dcNumber.trim().toUpperCase());
      }

      const newPassData = {
        dc_number: dcNumber.trim().toUpperCase(),
        vehicle_number: vehicleNumber.trim(),
        driver_name: driverName.trim().toUpperCase(),
        driver_mobile: driverMobile.trim(),
        license_number: licenseNumber.trim().toUpperCase(),
        mineral_name: mineralName.trim(),
        net_weight: netWeight.trim(),
        concession_holder: concessionHolder.trim(),
        source_place: sourcePlace.trim(),
        destination: destination.trim(),
        journey_start: journeyStart.trim(),
        journey_end: journeyEnd.trim(),
        route_name: routeName.trim(),
        transporter_name: transporterName.trim(),
        buyer_mobile: buyerMobile.trim(),
        pan_gstin: panGstin.trim().toUpperCase(),
        gps_details: gpsDetails.trim(),
        royalty_issued: royaltyIssued.trim(),
        duration: duration.trim(),
        checkpost: checkpost.trim(),
        purchaser_name: purchaserName.trim(),
        distance: distance.trim(),
        pdf_url: uploadedPdfUrl,
        pdf_base64: pdfBase64
      };

      const created = await db.createPass(newPassData);
      setSuccessPass(created);
      
      // Clear inputs
      setDcNumber('');
      setRoyaltyIssued('');
      setVehicleNumber('');
      setMineralName('');
      setNetWeight('');
      setConcessionHolder('');
      setSourcePlace('');
      setPurchaserName('');
      setDestination('');
      setDistance('');
      setJourneyStart('');
      setJourneyEnd('');
      setRouteName('');
      setDuration('');
      setCheckpost('');
      setDriverName('');
      setLicenseNumber('');
      setDriverMobile('');
      setPanGstin('');
      setGpsDetails('');
      setTransporterName('');
      setBuyerMobile('');
      setPdfFile(null);
      setPdfFileName('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Database transaction failed. Verify details are unique.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans" id="create-pass-view">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-display text-white">Generate DC Pass</h1>
          <p className="text-xs text-gray-400 mt-0.5">Initialize beautiful Passage certificates utilizing 100% text-input custom templates.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAutofillMock}
            className="flex items-center gap-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 font-bold px-4 py-2 text-xs rounded-xl transition duration-150 active:scale-95 cursor-pointer animate-pulse"
            type="button"
            id="autofill-mock-btn"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Autofill GJ01XY9988 Template
          </button>
        </div>
      </div>

      {/* SUCCESS POPUP */}
      {successPass && (
        <div className="bg-emerald-950/40 border-2 border-emerald-500/40 p-5 rounded-2xl text-emerald-200 animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white">Pass Registered Successfully!</h3>
              <p className="text-xs text-emerald-300 mt-1">
                New transit pass created under identifier: <code className="font-bold text-yellow-300 font-mono text-sm">{successPass.dc_number}</code>
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectPass(successPass.dc_number)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
            id="view-created-pass-btn"
          >
            Launch Official QR Viewer
          </button>
        </div>
      )}

      {/* ERROR MESSAGE BAR */}
      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-xl text-rose-200 text-xs flex gap-2 items-center" id="create-pass-error">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* FORM WORKSPACE */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        
        {/* SECTION 1: PASSAGE CODES & CONTROL */}
        <div>
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Section 1: Official Passage & Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                DC Pass Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={dcNumber}
                onChange={(e) => setDcNumber(e.target.value)}
                placeholder="STQL22091277054411223344"
                className="w-full py-2.5 px-3 rounded-xl glass-input text-sm font-mono tracking-wider uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Royalty Issued On (Datetime Text)
              </label>
              <input
                type="text"
                value={royaltyIssued}
                onChange={(e) => setRoyaltyIssued(e.target.value)}
                placeholder="e.g. 27/05/2026 02:00:00 PM"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80"></div>

        {/* SECTION 2: MINERAL CARGO SPECS */}
        <div>
          <h3 className="text-sm font-bold text-[#818cf8] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#818cf8]" /> Section 2: Carrier identity & Mineral Specs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Vehicle No. / Carrier Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. GJ01XY9988 / Goods Carrier(HGV)"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Mineral Name (Grade) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={mineralName}
                onChange={(e) => setMineralName(e.target.value)}
                placeholder="e.g. Silica Sand Grade-II"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Net Weight in MT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={netWeight}
                onChange={(e) => setNetWeight(e.target.value)}
                placeholder="e.g. 32.50"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Concession Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={concessionHolder}
                onChange={(e) => setConcessionHolder(e.target.value)}
                placeholder="e.g. Saurashtra Mining Corp"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Name of Purchaser
              </label>
              <input
                type="text"
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
                placeholder="e.g. D Y MINCHEM"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80"></div>

        {/* SECTION 3: RECTITUDE & ROUTING SCHEDULING */}
        <div>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" /> Section 3: Route Parameters & Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Source of Place <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sourcePlace}
                onChange={(e) => setSourcePlace(e.target.value)}
                placeholder="e.g. Mines Plot 12, Chotila, Surendranagar"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Destination Address / Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Morbi Ceramic Hub, Morbi"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Distance (Text)
              </label>
              <input
                type="text"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="e.g. 395 Km"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Journey Start Dt (Datetime Text) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={journeyStart}
                onChange={(e) => setJourneyStart(e.target.value)}
                placeholder="e.g. 27/05/2026 08:00:00 AM"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Journey End Dt (Datetime Text) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={journeyEnd}
                onChange={(e) => setJourneyEnd(e.target.value)}
                placeholder="e.g. 29/05/2026 06:00:00 PM"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Duration (Text)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2 Day(s) 10 Hour(s) 0 Min"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Route Name
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g. State Highway 17 & NH 8A"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Checkpost (Text)
              </label>
              <input
                type="text"
                value={checkpost}
                onChange={(e) => setCheckpost(e.target.value)}
                placeholder="e.g. Morbi Checkpost"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80"></div>

        {/* SECTION 4: LOGISTICS Crew & Operator ID Details */}
        <div>
          <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-400" /> Section 4: Driver & Operator Logistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. RAJESH PATEL"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Driver’s License No
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. GJ0120220011992"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Driver Mobile No
              </label>
              <input
                type="tel"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                PAN Number / GSTIN
              </label>
              <input
                type="text"
                value={panGstin}
                onChange={(e) => setPanGstin(e.target.value)}
                placeholder="e.g. ABCPG3241F / 24ABCPG3241F1ZD"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                GPS Tracking Device Details
              </label>
              <input
                type="text"
                value={gpsDetails}
                onChange={(e) => setGpsDetails(e.target.value)}
                placeholder="e.g. Whelseye OBD-T14"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Transporter Name
              </label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                placeholder="e.g. Maruti Transport"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wide mb-1.5 uppercase">
                Buyer Mobile Number
              </label>
              <input
                type="tel"
                value={buyerMobile}
                onChange={(e) => setBuyerMobile(e.target.value)}
                placeholder="e.g. 9426123456"
                className="w-full py-2.5 px-3 text-sm rounded-xl glass-input font-mono"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80"></div>

        {/* SECTION 5: COMPLIANCE DOCUMENTS */}
        <div>
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" /> Section 5: compliance Documents & PDF Invoice
          </h3>
          <div 
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 transition duration-200 text-center flex flex-col items-center justify-center ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-500/5' 
                : pdfFileName
                ? 'border-indigo-500/20 bg-indigo-500/5 border-indigo-400'
                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/20'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />
            <div className="p-3 bg-slate-900/60 rounded-xl mb-3 border border-slate-800 text-slate-300">
              <UploadCloud className="w-8 h-8 text-indigo-400" />
            </div>

            {pdfFileName ? (
              <div>
                <p className="text-sm font-bold text-white mb-1">compliance Invoice Loaded</p>
                <p className="text-xs text-indigo-300 font-mono italic">{pdfFileName}</p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPdfFile(null);
                    setPdfFileName('');
                  }}
                  className="mt-3 text-xs font-bold text-rose-400 hover:text-rose-300 underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-white">Drag & drop compliance transit PDF invoice here</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-normal">
                  Support both PDF drag-overs or <span className="text-indigo-400 underline scroll-py-1 font-bold">manual file click selection</span> (Required size limit: 12MB).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SUBMIT ENGINE */}
        <div className="pt-4 text-right">
          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold px-8 py-3.5 rounded-xl text-sm tracking-wide transition transform hover:-translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95"
            id="register-transit-credential-submit"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Uploading Carriage credentials...
              </span>
            ) : (
              'Verify & Issue DC Transit Pass'
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
export {};
