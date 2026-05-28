/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { useDualMode } from "../context/DualModeContext";
import PassCard from "./PassCard";
import { 
  UploadCloud, FileSpreadsheet, Eye, Plus, CheckCircle, Clock, 
  X, Check, AlertCircle, FileText, HelpCircle 
} from "lucide-react";

export default function UserDashboard() {
  const { passes, createPass } = useDualMode();

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Extraction states
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [pdfBase64Str, setPdfBase64Str] = useState<string>("");
  const [pdfFileNameStr, setPdfFileNameStr] = useState<string>("");

  // Form parameters that the user can correct
  const [passNumber, setPassNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [route, setRoute] = useState("");
  const [department, setDepartment] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleManualSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileSelection(e.target.files[0]);
    }
  };

  const processFileSelection = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setScanError("File selection rejection: Systems restrict uploads strictly to PDF formats.");
      return;
    }
    setFile(selectedFile);
    setScanError(null);
    setScanSuccess(null);
    setExtractedData(null);
    setScanning(true);

    // Read file as base64 to send to backend API
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      try {
        const base64Str = reader.result as string;
        setPdfBase64Str(base64Str);
        setPdfFileNameStr(selectedFile.name);
        
        // Execute API extract call in express backend
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            pdfBase64: base64Str,
            filename: selectedFile.name
          })
        });

        const contentType = res.headers.get("content-type");
        let outcome;
        if (contentType && contentType.includes("application/json")) {
          outcome = await res.json();
        } else {
          const rawText = await res.text();
          console.error("Non-JSON Server Response Received:", rawText);
          throw new Error(
            `Unable to parse server compliance response. Status: ${res.status}. Server message: ${
              rawText.length > 100 ? rawText.slice(0, 100) + "..." : rawText || "Empty Response"
            }`
          );
        }

        if (!res.ok || !outcome.success) {
          throw new Error(outcome.error || "Compliance scanning extraction failure.");
        }

        const payload = outcome.data;
        setExtractedData(payload);

        // Autofill verified input parameters
        setPassNumber(payload.passNumber || "");
        setHolderName(payload.holderName || "");
        setVehicleNumber(payload.vehicleNumber || "");
        setRoute(payload.route || "");
        setDepartment(payload.department || "");
        setIssueDate(payload.issueDate || "");
        setExpiryDate(payload.expiryDate || "");

        if (outcome.fallbackActive) {
          setScanSuccess("Layout scanner: standard parsing executed fallback OCR presets successfully! Please audit parsed indices card prior to submit check.");
        } else {
          setScanSuccess("AI Scanner: High fidelity OCR parsing checks generated parameters values successfully!");
        }

      } catch (err: any) {
        setScanError(err.message || "Failed to scan chosen PDF documentation.");
      } finally {
        setScanning(false);
      }
    };
  };

  const handleSubmitPassForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passNumber || !holderName) {
      setScanError("Validation: Both Official serial and Holder identity are mandatory fields.");
      return;
    }

    setLoading(true);
    setScanError(null);

    try {
      // Simulate/Save file URL path
      const fakePdfUrl = file ? URL.createObjectURL(file) : undefined;

      // Extract Gujarat e-pass elements dynamically from extractedData if present
      const complianceFields = extractedData || {};

      await createPass({
        passNumber,
        holderName,
        vehicleNumber: vehicleNumber || undefined,
        route: route || undefined,
        department: department || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        pdfUrl: fakePdfUrl,
        pdfBase64: pdfBase64Str || undefined,
        pdfFileName: pdfFileNameStr || "pass_document.pdf",
        notes: "Scan verified under public portal systems.",
        
        // Forward custom Gujarat parameters extracted from Gemini
        royaltyIssuedOn: complianceFields.royaltyIssuedOn || "",
        carrierType: complianceFields.carrierType || "",
        mineralName: complianceFields.mineralName || "",
        netWeight: complianceFields.netWeight || "",
        netWeightWords: complianceFields.netWeightWords || "",
        concessionHolder: complianceFields.concessionHolder || "",
        sourcePlace: complianceFields.sourcePlace || "",
        purchaserName: complianceFields.purchaserName || "",
        destinationAddress: complianceFields.destinationAddress || "",
        distance: complianceFields.distance || "",
        journeyStart: complianceFields.journeyStart || "",
        journeyEnd: complianceFields.journeyEnd || "",
        routeName: complianceFields.routeName || "",
        duration: complianceFields.duration || "",
        checkpost: complianceFields.checkpost || "",
        driverName: complianceFields.driverName || "",
        driverLicense: complianceFields.driverLicense || "",
        driverMobile: complianceFields.driverMobile || "",
        panGst: complianceFields.panGst || "",
        gpsDetails: complianceFields.gpsDetails || "",
        transporterName: complianceFields.transporterName || "",
        buyerMobile: complianceFields.buyerMobile || ""
      });

      // Clear modalities
      setFile(null);
      setExtractedData(null);
      setPdfBase64Str("");
      setPdfFileNameStr("");
      setShowUploadModal(false);
    } catch (err: any) {
      setScanError("Draft upload clearance failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelUploadForm = () => {
    setFile(null);
    setExtractedData(null);
    setScanError(null);
    setScanSuccess(null);
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Title Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight">
            Your Digital DC Passes
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Upload new government-issued passes to digitize compliance verification trails and monitor approval status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-4.5 py-3 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Upload New PDF
        </button>
      </div>

      {/* Grid of existing user passes */}
      {passes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center py-16 px-6 rounded-2xl max-w-lg mx-auto">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
            No Active Passes
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mt-2.5">
            Submit your first DC Pass document in PDF format using the AI compliance scanner above.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="mt-5 px-4.5 py-2.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
          >
            Scan Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {passes.map((passItem) => (
            <div key={passItem.id} className="relative group">
              {/* Dynamic Status Ribbon Indicator */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-full shadow-xs">
                <span className={`w-2 h-2 rounded-full ${
                  passItem.status === "Approved" ? "bg-emerald-500" :
                  passItem.status === "Pending" ? "bg-amber-500" : "bg-rose-500"
                }`}></span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300">
                  {passItem.status}
                </span>
              </div>
              
              <PassCard pass={passItem} />
            </div>
          ))}
        </div>
      )}

      {/* Upload Compliance Document Modal Overlay */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl transition-all my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-indigo-500/30 p-6 flex justify-between items-center text-white bg-gradient-to-r from-slate-900 to-indigo-950">
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="font-sans text-sm font-bold uppercase tracking-wider">
                  Compliance Document Scanner
                </h3>
              </div>
              <button
                type="button"
                onClick={cancelUploadForm}
                className="p-1.5 bg-slate-800 border border-slate-705 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Alert Message */}
              {scanError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/25 border border-red-200/50 dark:border-red-900/40 rounded-xl flex gap-2.5 text-xs text-red-700 dark:text-red-400 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{scanError}</p>
                </div>
              )}
              {scanSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl flex gap-2.5 text-xs text-emerald-800 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
                  <p>{scanSuccess}</p>
                </div>
              )}

              {/* Drag Drop Selection Zone */}
              {!extractedData && !scanning && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 py-12 text-center transition-all cursor-pointer flex flex-col items-center ${
                    dragActive
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/60"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleManualSelect}
                  />
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mb-4">
                    <FileText className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Select Official DC Pass E-PDF
                  </h4>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                    Drag and drop your PDF pass certificate, or click to browse local folders. File systems restrict validations to PDF format.
                  </p>
                </div>
              )}

              {/* Loading Scan State */}
              {scanning && (
                <div className="py-12 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-teal-500 border-b-transparent rounded-full animate-spin [animation-direction:reverse]"></div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">
                      OCR Document Scan Active
                    </h4>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1.5 leading-relaxed">
                      Executing layout structural text extraction & visual OCR mapping algorithms. Please standby.
                    </p>
                  </div>
                </div>
              )}

              {/* Editable results form matching schema parameters */}
              {extractedData && (
                <form onSubmit={handleSubmitPassForReview} className="space-y-4 text-xs font-semibold">
                  <div className="bg-amber-500/15 border border-amber-500/30 p-4 rounded-xl text-[11px] text-amber-800 dark:text-amber-400 mb-4 font-sans leading-relaxed flex gap-2.5 items-start">
                    <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase tracking-wide block mb-0.5">Audit Check Recommended</span>
                      Our smart OCR pipeline has pre-filled the pass parameters below. Please audit the auto-scanned parameters carefully and correct any typographical errors to maintain absolute compliance.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">DC Pass Serialization Number *</label>
                      <input
                        type="text"
                        required
                        value={passNumber}
                        onChange={(e) => setPassNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-mono tracking-wide"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Authorized Name *</label>
                      <input
                        type="text"
                        required
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Vehicle License Plate Series (Optional)</label>
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. GJ-01-XX-9999"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Issuing Authority / Dept (Optional)</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Office of the District Commissioner"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Authorized Operational Transit Corridors (Optional)</label>
                      <input
                        type="text"
                        value={route}
                        onChange={(e) => setRoute(e.target.value)}
                        placeholder="e.g. North Interstate highway routes"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Issue Date (Optional)</label>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  {/* Modal Footer Controls */}
                  <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/80 justify-end">
                    <button
                      type="button"
                      onClick={cancelUploadForm}
                      className="px-5 py-3 cursor-pointer bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                    >
                      Clear File
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Submit Pass for Audit"
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
