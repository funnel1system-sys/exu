/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useDualMode } from "../context/DualModeContext";
import { DCPass, PassStatus, UserRole } from "../types";
import PassCard from "./PassCard";
import { 
  Users, Layers, Search, CheckCircle, Clock, ShieldAlert, FileSpreadsheet, 
  Trash2, Edit3, Check, X, ClipboardList, TrendingUp, AlertCircle, Landmark, Upload, FileText
} from "lucide-react";

export default function AdminDashboard() {
  const { 
    passes, 
    logs, 
    users, 
    updatePassStatus, 
    editPassData, 
    deletePass, 
    updateUserRole,
    createPass
  } = useDualMode();

  // Selected state filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  
  // Selected single pass for detailed review (Card modal/overlay)
  const [activePass, setActivePass] = useState<DCPass | null>(null);
  
  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedHolder, setEditedHolder] = useState("");
  const [editedVehicle, setEditedVehicle] = useState("");
  const [editedRoute, setEditedRoute] = useState("");
  const [editedDept, setEditedDept] = useState("");
  const [editedIssue, setEditedIssue] = useState("");
  const [editedExpiry, setEditedExpiry] = useState("");

  // Gujarat e-Pass fields
  const [editedRoyaltyIssuedOn, setEditedRoyaltyIssuedOn] = useState("");
  const [editedCarrierType, setEditedCarrierType] = useState("");
  const [editedMineralName, setEditedMineralName] = useState("");
  const [editedNetWeight, setEditedNetWeight] = useState("");
  const [editedNetWeightWords, setEditedNetWeightWords] = useState("");
  const [editedConcessionHolder, setEditedConcessionHolder] = useState("");
  const [editedSourcePlace, setEditedSourcePlace] = useState("");
  const [editedPurchaserName, setEditedPurchaserName] = useState("");
  const [editedDestinationAddress, setEditedDestinationAddress] = useState("");
  const [editedDistance, setEditedDistance] = useState("");
  const [editedJourneyStart, setEditedJourneyStart] = useState("");
  const [editedJourneyEnd, setEditedJourneyEnd] = useState("");
  const [editedRouteName, setEditedRouteName] = useState("");
  const [editedDuration, setEditedDuration] = useState("");
  const [editedCheckpost, setEditedCheckpost] = useState("");
  const [editedDriverName, setEditedDriverName] = useState("");
  const [editedDriverLicense, setEditedDriverLicense] = useState("");
  const [editedDriverMobile, setEditedDriverMobile] = useState("");
  const [editedPanGst, setEditedPanGst] = useState("");
  const [editedGpsDetails, setEditedGpsDetails] = useState("");
  const [editedTransporterName, setEditedTransporterName] = useState("");
  const [editedBuyerMobile, setEditedBuyerMobile] = useState("");

  const [editTab, setEditTab] = useState<"authority" | "material" | "safety">("authority");
  
  // Review validation feedback
  const [reviewNotes, setReviewNotes] = useState("");
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<"passes" | "users" | "logs">("passes");

  // Admin PDF Upload & Extraction States
  const [showAdminUploadModal, setShowAdminUploadModal] = useState(false);
  const [adminFile, setAdminFile] = useState<File | null>(null);
  const [adminScanning, setAdminScanning] = useState(false);
  const [adminExtractedData, setAdminExtractedData] = useState<any | null>(null);
  const [adminScanError, setAdminScanError] = useState<string | null>(null);
  const [adminScanSuccess, setAdminScanSuccess] = useState<string | null>(null);
  const [adminPdfBase64, setAdminPdfBase64] = useState<string>("");
  const [adminPdfFileName, setAdminPdfFileName] = useState<string>("");
  const [adminDragActive, setAdminDragActive] = useState(false);

  // Editor states in admin extraction modal
  const [adminPassNumber, setAdminPassNumber] = useState("");
  const [adminHolderName, setAdminHolderName] = useState("");
  const [adminVehicleNumber, setAdminVehicleNumber] = useState("");
  const [adminRoute, setAdminRoute] = useState("");
  const [adminDepartment, setAdminDepartment] = useState("");
  const [adminIssueDate, setAdminIssueDate] = useState("");
  const [adminExpiryDate, setAdminExpiryDate] = useState("");
  const [adminAddAsApproved, setAdminAddAsApproved] = useState(true);

  const processAdminFileSelection = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setAdminScanError("File selection rejection: Systems restrict uploads strictly to PDF formats.");
      return;
    }
    setAdminFile(selectedFile);
    setAdminScanError(null);
    setAdminScanSuccess(null);
    setAdminExtractedData(null);
    setAdminScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      try {
        const base64Str = reader.result as string;
        setAdminPdfBase64(base64Str);
        setAdminPdfFileName(selectedFile.name);

        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        setAdminExtractedData(payload);

        // Populate editor state
        setAdminPassNumber(payload.passNumber || "");
        setAdminHolderName(payload.holderName || "");
        setAdminVehicleNumber(payload.vehicleNumber || "");
        setAdminRoute(payload.route || "");
        setAdminDepartment(payload.department || "");
        setAdminIssueDate(payload.issueDate || "");
        setAdminExpiryDate(payload.expiryDate || "");

        if (outcome.fallbackActive) {
          setAdminScanSuccess("Layout scanner: standard OCR parsing executed fallback successfully! Verify details below.");
        } else {
          setAdminScanSuccess("AI Scanner: High fidelity OCR parsing generated parameter values successfully! Review details below.");
        }
      } catch (err: any) {
        setAdminScanError(err.message || "Failed to scan chosen PDF documentation.");
      } finally {
        setAdminScanning(false);
      }
    };
  };

  const handleAdminSubmitPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassNumber || !adminHolderName) {
      setAdminScanError("Validation: Serial number and Holder name are mandatory.");
      return;
    }

    setAdminScanning(true);
    setAdminScanError(null);

    try {
      const fakePdfUrl = adminFile ? URL.createObjectURL(adminFile) : undefined;
      const complianceFields = adminExtractedData || {};

      await createPass({
        passNumber: adminPassNumber,
        holderName: adminHolderName,
        vehicleNumber: adminVehicleNumber || undefined,
        route: adminRoute || undefined,
        department: adminDepartment || undefined,
        issueDate: adminIssueDate || undefined,
        expiryDate: adminExpiryDate || undefined,
        pdfUrl: fakePdfUrl,
        pdfBase64: adminPdfBase64 || undefined,
        pdfFileName: adminPdfFileName || "pass_document.pdf",
        status: adminAddAsApproved ? "Approved" : "Pending",
        notes: "Admin scan verified and approved instantly.",

        // Extract extra Gujarat e-pass elements
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

      // Reset
      setAdminFile(null);
      setAdminExtractedData(null);
      setAdminPdfBase64("");
      setAdminPdfFileName("");
      setShowAdminUploadModal(false);
    } catch (err: any) {
      setAdminScanError("Submission failure: " + err.message);
    } finally {
      setAdminScanning(false);
    }
  };

  const handleSelectPass = (pass: DCPass) => {
    setActivePass(pass);
    setIsEditing(false);
    setReviewNotes(pass.notes || "");
    setEditedHolder(pass.holderName);
    setEditedVehicle(pass.vehicleNumber || "");
    setEditedRoute(pass.route || "");
    setEditedDept(pass.department || "");
    setEditedIssue(pass.issueDate || "");
    setEditedExpiry(pass.expiryDate || "");

    // Initialize Gujarat details
    setEditedRoyaltyIssuedOn(pass.royaltyIssuedOn || "");
    setEditedCarrierType(pass.carrierType || "");
    setEditedMineralName(pass.mineralName || "");
    setEditedNetWeight(pass.netWeight || "");
    setEditedNetWeightWords(pass.netWeightWords || "");
    setEditedConcessionHolder(pass.concessionHolder || "");
    setEditedSourcePlace(pass.sourcePlace || "");
    setEditedPurchaserName(pass.purchaserName || "");
    setEditedDestinationAddress(pass.destinationAddress || "");
    setEditedDistance(pass.distance || "");
    setEditedJourneyStart(pass.journeyStart || "");
    setEditedJourneyEnd(pass.journeyEnd || "");
    setEditedRouteName(pass.routeName || "");
    setEditedDuration(pass.duration || "");
    setEditedCheckpost(pass.checkpost || "");
    setEditedDriverName(pass.driverName || "");
    setEditedDriverLicense(pass.driverLicense || "");
    setEditedDriverMobile(pass.driverMobile || "");
    setEditedPanGst(pass.panGst || "");
    setEditedGpsDetails(pass.gpsDetails || "");
    setEditedTransporterName(pass.transporterName || "");
    setEditedBuyerMobile(pass.buyerMobile || "");
  };

  const handleSaveFields = async () => {
    if (!activePass) return;
    try {
      const updatedPayload = {
        holderName: editedHolder,
        vehicleNumber: editedVehicle,
        route: editedRoute,
        department: editedDept,
        issueDate: editedIssue,
        expiryDate: editedExpiry,

        royaltyIssuedOn: editedRoyaltyIssuedOn,
        carrierType: editedCarrierType,
        mineralName: editedMineralName,
        netWeight: editedNetWeight,
        netWeightWords: editedNetWeightWords,
        concessionHolder: editedConcessionHolder,
        sourcePlace: editedSourcePlace,
        purchaserName: editedPurchaserName,
        destinationAddress: editedDestinationAddress,
        distance: editedDistance,
        journeyStart: editedJourneyStart,
        journeyEnd: editedJourneyEnd,
        routeName: editedRouteName,
        duration: editedDuration,
        checkpost: editedCheckpost,
        driverName: editedDriverName,
        driverLicense: editedDriverLicense,
        driverMobile: editedDriverMobile,
        panGst: editedPanGst,
        gpsDetails: editedGpsDetails,
        transporterName: editedTransporterName,
        buyerMobile: editedBuyerMobile
      };

      await editPassData(activePass.id, updatedPayload);
      
      // Update local detailed active view block
      setActivePass({
        ...activePass,
        ...updatedPayload
      });
      setIsEditing(false);
    } catch (err: any) {
      alert("Error saving pass metrics: " + err.message);
    }
  };

  const handleAssessStatus = async (status: PassStatus) => {
    if (!activePass) return;
    try {
      await updatePassStatus(activePass.id, status, reviewNotes);
      setActivePass(null);
    } catch (err: any) {
      alert("Evaluation failed: " + err.message);
    }
  };

  const handleDirectDelete = async (passId: string) => {
    if (!window.confirm("CONFIRMATION MANDATORY: Are you certain you want to permanently expunge this pass record mapping?")) return;
    try {
      await deletePass(passId);
      if (activePass?.id === passId) {
        setActivePass(null);
      }
    } catch (err: any) {
      alert("Delete operation aborted: " + err.message);
    }
  };

  const triggerCSVExport = () => {
    // Compile CSV string
    const headers = ["ID", "PassNumber", "HolderName", "VehicleNumber", "Route", "Department", "IssueDate", "ExpiryDate", "Status", "UploaderEmail", "VerifiedHits"];
    const rows = passes.map(p => [
      p.id,
      p.passNumber,
      p.holderName,
      p.vehicleNumber || "None",
      p.route || "None",
      p.department || "None",
      p.issueDate || "None",
      p.expiryDate || "None",
      p.status,
      p.uploaderEmail || "None",
      p.verifiedCount || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registered_dc_passes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Quick statistics extraction
  const totalCount = passes.length;
  const approvedCount = passes.filter(p => p.status === "Approved").length;
  const pendingCount = passes.filter(p => p.status === "Pending").length;
  const rejectedCount = passes.filter(p => p.status === "Rejected").length;

  // Extract unique departments list
  const deptsList = ["All", ...Array.from(new Set(passes.map(p => p.department).filter(Boolean)))];

  // Filtering passes logic
  const filteredPasses = passes.filter((p) => {
    const matchesSearch = p.holderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.passNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.vehicleNumber && p.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesDept = deptFilter === "All" || p.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-8">
      
      {/* Analytics Bento Grid KPIs Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric box total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pass Records
            </span>
            <span className="text-3xl font-mono font-extrabold text-slate-800 dark:text-slate-100 block mt-1">
              {totalCount}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Metric box approved */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Approved Certified
            </span>
            <span className="text-3xl font-mono font-extrabold text-emerald-600 dark:text-emerald-450 block mt-1">
              {approvedCount}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-slate-805 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Metric box pending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Compliance
            </span>
            <span className="text-3xl font-mono font-extrabold text-amber-500 dark:text-amber-400 block mt-1 animate-pulse">
              {pendingCount}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded-xl">
            <Clock className="w-6 h-6 text-amber-500 dark:text-amber-400" />
          </div>
        </div>

        {/* Metric box rejected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Rejected Anomalies
            </span>
            <span className="text-3xl font-mono font-extrabold text-rose-600 dark:text-rose-450 block mt-1">
              {rejectedCount}
            </span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-slate-800/80 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

      </section>

      {/* Admin Module Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("passes")}
          className={`px-5 py-3 cursor-pointer text-xs uppercase tracking-wider font-extrabold border-b-2 flex items-center gap-2 ${
            activeTab === "passes"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          Pass Registers ({filteredPasses.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-3 cursor-pointer text-xs uppercase tracking-wider font-extrabold border-b-2 flex items-center gap-2 ${
            activeTab === "users"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Staff Registry ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-5 py-3 cursor-pointer text-xs uppercase tracking-wider font-extrabold border-b-2 flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          System Log Audit ({logs.length})
        </button>
      </div>

      {activeTab === "passes" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* List display panel */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 shadow-xs space-y-6">
            
            {/* Filter and control blocks */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by pass, holder name, or vehicle number..."
                  className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                />
              </div>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Only</option>
                <option value="Approved">Approved Only</option>
                <option value="Rejected">Rejected Only</option>
              </select>

              {/* Dept Select */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                {deptsList.map((dept, idx) => (
                  <option key={idx} value={String(dept)}>{String(dept)}</option>
                ))}
              </select>

              {/* CSV Extract button */}
              <button
                type="button"
                onClick={triggerCSVExport}
                className="px-4.5 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>

              {/* AI PDF Extraction button */}
              <button
                type="button"
                onClick={() => {
                  setAdminFile(null);
                  setAdminExtractedData(null);
                  setAdminScanError(null);
                  setAdminScanSuccess(null);
                  setAdminPassNumber("");
                  setAdminHolderName("");
                  setAdminVehicleNumber("");
                  setAdminRoute("");
                  setAdminDepartment("");
                  setAdminIssueDate("");
                  setAdminExpiryDate("");
                  setShowAdminUploadModal(true);
                }}
                className="px-4.5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                Upload & Extract PDF
              </button>
            </div>

            {/* Passes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/40">
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4 animate-pulse">Holder</th>
                    <th className="py-3 px-4">Department / Issuers</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Expiration</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredPasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500 font-medium">
                        No registered passes match selected query criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPasses.map((p) => {
                      const colorBadge = 
                        p.status === "Approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450" : 
                        p.status === "Pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-405" : 
                        "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450";

                      return (
                        <tr 
                          key={p.id} 
                          onClick={() => handleSelectPass(p)}
                          className={`group hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-all text-xs cursor-pointer ${activePass?.id === p.id ? "bg-indigo-50/40 dark:bg-indigo-950/15" : ""}`}
                        >
                          <td className="py-4.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                            {p.passNumber}
                          </td>
                          <td className="py-4.5 px-4 font-semibold text-slate-700 dark:text-slate-200">
                            {p.holderName}
                          </td>
                          <td className="py-4.5 px-4 font-medium text-slate-500 dark:text-slate-400">
                            {p.department || "General"}
                          </td>
                          <td className="py-4.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${colorBadge}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {p.expiryDate || "Pending"}
                          </td>
                          <td className="py-4.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleSelectPass(p)}
                                className="p-2 cursor-pointer text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/35 rounded-lg transition-colors"
                                title="Audit Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDirectDelete(p.id)}
                                className="p-2 cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/35 rounded-lg transition-colors"
                                title="Permanently Delete Pass"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right audit details panel */}
          <div className="xl:col-span-1 space-y-6">
            
            {activePass ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
                    Audit Review Deck
                  </h3>
                  <button
                    onClick={() => setActivePass(null)}
                    className="p-1.5 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isEditing ? (
                  /* Edit pass parameters inline with neat sub-panels */
                  <div className="space-y-4 text-xs font-semibold">
                    
                    {/* Subsection Edit Navigation Tabs */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide gap-1">
                      <button
                        type="button"
                        onClick={() => setEditTab("authority")}
                        className={`flex-1 pb-2 cursor-pointer border-b-2 text-center transition-all ${editTab === "authority" ? "border-indigo-600 text-indigo-600 dark:text-indigo-450" : "border-transparent text-slate-400"}`}
                      >
                        General/Auth
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditTab("material")}
                        className={`flex-1 pb-2 cursor-pointer border-b-2 text-center transition-all ${editTab === "material" ? "border-indigo-600 text-indigo-600 dark:text-indigo-450" : "border-transparent text-slate-400"}`}
                      >
                        Material/Transit
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditTab("safety")}
                        className={`flex-1 pb-2 cursor-pointer border-b-2 text-center transition-all ${editTab === "safety" ? "border-indigo-600 text-indigo-600 dark:text-indigo-450" : "border-transparent text-slate-400"}`}
                      >
                        Logistics/Driver
                      </button>
                    </div>

                    <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                      {editTab === "authority" && (
                        <>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Holder Name</label>
                            <input
                              type="text"
                              value={editedHolder}
                              onChange={(e) => setEditedHolder(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Vehicle Match</label>
                            <input
                              type="text"
                              value={editedVehicle}
                              onChange={(e) => setEditedVehicle(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Carrier Type</label>
                            <input
                              type="text"
                              value={editedCarrierType}
                              onChange={(e) => setEditedCarrierType(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                              placeholder="e.g. Goods Carrier(HGV)"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Transit Route Bounds</label>
                            <input
                              type="text"
                              value={editedRoute}
                              onChange={(e) => setEditedRoute(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Issuing Department</label>
                            <input
                              type="text"
                              value={editedDept}
                              onChange={(e) => setEditedDept(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Issue Date</label>
                              <input
                                type="date"
                                value={editedIssue}
                                onChange={(e) => setEditedIssue(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Expiry Date</label>
                              <input
                                type="date"
                                value={editedExpiry}
                                onChange={(e) => setEditedExpiry(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Royalty Timestamp stamp</label>
                            <input
                              type="text"
                              value={editedRoyaltyIssuedOn}
                              onChange={(e) => setEditedRoyaltyIssuedOn(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                              placeholder="e.g. 01/04/2026 06:58:21 PM"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">PAN Number / GSTIN</label>
                            <input
                              type="text"
                              value={editedPanGst}
                              onChange={(e) => setEditedPanGst(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                              placeholder="e.g. AAIFG0837H / 24AAIFG0837H1ZL"
                            />
                          </div>
                        </>
                      )}

                      {editTab === "material" && (
                        <>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mineral Name (Grade)</label>
                            <input
                              type="text"
                              value={editedMineralName}
                              onChange={(e) => setEditedMineralName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                              placeholder="e.g. Quartz (16-30 Mesh)"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Net Weight MT</label>
                            <input
                              type="text"
                              value={editedNetWeight}
                              onChange={(e) => setEditedNetWeight(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                              placeholder="e.g. 24.20"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Net Weight (In Words)</label>
                            <input
                              type="text"
                              value={editedNetWeightWords}
                              onChange={(e) => setEditedNetWeightWords(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                              placeholder="e.g. Twenty Four point Two Zero Zero"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Concession Holder</label>
                            <input
                              type="text"
                              value={editedConcessionHolder}
                              onChange={(e) => setEditedConcessionHolder(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Source Place</label>
                            <textarea
                              rows={2}
                              value={editedSourcePlace}
                              onChange={(e) => setEditedSourcePlace(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Purchaser Name</label>
                            <input
                              type="text"
                              value={editedPurchaserName}
                              onChange={(e) => setEditedPurchaserName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Destination Address</label>
                            <input
                              type="text"
                              value={editedDestinationAddress}
                              onChange={(e) => setEditedDestinationAddress(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Distance</label>
                              <input
                                type="text"
                                value={editedDistance}
                                onChange={(e) => setEditedDistance(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                                placeholder="345 Km"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Duration</label>
                              <input
                                type="text"
                                value={editedDuration}
                                onChange={(e) => setEditedDuration(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                                placeholder="0 Day 13 Hr"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {editTab === "safety" && (
                        <>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Driver Name</label>
                            <input
                              type="text"
                              value={editedDriverName}
                              onChange={(e) => setEditedDriverName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Driver License</label>
                            <input
                              type="text"
                              value={editedDriverLicense}
                              onChange={(e) => setEditedDriverLicense(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Driver Mobile</label>
                            <input
                              type="text"
                              value={editedDriverMobile}
                              onChange={(e) => setEditedDriverMobile(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Route name (Detail)</label>
                            <input
                              type="text"
                              value={editedRouteName}
                              onChange={(e) => setEditedRouteName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                              placeholder="e.g. NH 48"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Checkpost Outpost</label>
                            <input
                              type="text"
                              value={editedCheckpost}
                              onChange={(e) => setEditedCheckpost(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">GPS Tracking Details</label>
                            <input
                              type="text"
                              value={editedGpsDetails}
                              onChange={(e) => setEditedGpsDetails(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Transporter Name</label>
                            <input
                              type="text"
                              value={editedTransporterName}
                              onChange={(e) => setEditedTransporterName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Buyer Mobile</label>
                            <input
                              type="text"
                              value={editedBuyerMobile}
                              onChange={(e) => setEditedBuyerMobile(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handleSaveFields}
                        className="flex-1 py-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg uppercase text-[10px] tracking-wider transition-colors"
                      >
                        Commit Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-lg uppercase text-[10px] tracking-wider transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Render active PassCard */}
                    <PassCard pass={activePass} />

                    {/* Inline compliance check review input form */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                          Auditor Review notes
                        </label>
                        <textarea
                          rows={3}
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Provide reasons for compliance clearance or deficiency logs..."
                          className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100 transition-colors"
                        />
                      </div>

                      <div className="flex gap-2.0">
                        <button
                          type="button"
                          onClick={() => handleAssessStatus("Approved")}
                          className="flex-1 py-3 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10"
                        >
                          <Check className="w-4 h-4" />
                          Approve Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssessStatus("Rejected")}
                          className="flex-1 py-3 cursor-pointer bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/10"
                        >
                          <X className="w-4 h-4" />
                          Reject Pass
                        </button>
                      </div>

                      <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/85 pt-3 justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Extracted Compliance Fields
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDirectDelete(activePass.id)}
                          className="text-[10px] font-extrabold uppercase tracking-wide text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                          title="Permanently Delete Pass"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Pass
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select a DC Pass Record
                </h4>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Click on any pass register row to open the active evaluation review panel deck.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
              User Administrative Accounts
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Promote registered profile clearance flags. Bootstrapped admin is locked.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/40">
                  <th className="py-3 px-4">Authorized Name</th>
                  <th className="py-3 px-4">E-Mail Identity</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">System Role Clearance</th>
                  <th className="py-3 px-4 text-right">Clearance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {users.map((item) => (
                  <tr key={item.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4.5 px-4 font-bold text-slate-700 dark:text-slate-200">
                      {item.displayName || "Unspecified"}
                    </td>
                    <td className="py-4.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {item.email}
                    </td>
                    <td className="py-4.5 px-4 text-slate-500 dark:text-slate-400">
                      {item.department || "General Public"}
                    </td>
                    <td className="py-4.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        item.role === "admin" 
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-450" 
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="py-4.5 px-4 text-right">
                      {item.email === "funnel1system@gmail.com" ? (
                        <span className="text-[10px] text-slate-400 italic font-semibold">System Root Lock</span>
                      ) : (
                        <select
                          value={item.role}
                          onChange={(e) => updateUserRole(item.uid, e.target.value as UserRole)}
                          className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-hidden "
                        >
                          <option value="user">User Carrier</option>
                          <option value="admin">Admin Auditor</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
              Compliance Activity Audit Trails
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Unalterable system ledger tracking document uploads, validations, and administrative rulings.
            </p>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {logs.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500 font-medium">No system entries registered.</p>
              ) : (
                logs.map((logNode, index) => {
                  return (
                    <li key={logNode.id}>
                      <div className="relative pb-8">
                        {index !== logs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100 dark:bg-slate-800" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center ring-8 ring-white dark:ring-slate-900">
                              <ClipboardList className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {logNode.details}{" "}
                                {logNode.actorEmail && (
                                  <span className="font-mono font-normal text-slate-450 dark:text-slate-480 text-[10px] block mt-0.5">
                                    Action by: {logNode.actorEmail}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right text-[10px] whitespace-nowrap font-mono text-slate-400 dark:text-slate-500 font-semibold self-start">
                              {new Date(logNode.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Admin AI PDF Extraction Modal */}
      {showAdminUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 text-slate-900 dark:text-slate-100">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-605 dark:text-indigo-400" />
                  Administrative Pass Extractor
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 dark:text-slate-400">
                  Upload PDF transit passes for automatic field mapping and instant system registration with the barcode generator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-202 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Modal Content Form Scroll Area */}
            <form onSubmit={handleAdminSubmitPass} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setAdminDragActive(true);
                }}
                onDragLeave={() => setAdminDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setAdminDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processAdminFileSelection(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  adminDragActive 
                    ? "border-indigo-650 bg-indigo-50/10" 
                    : adminFile 
                    ? "border-emerald-500/50 bg-emerald-500/5" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-950/20"
                }`}
              >
                {!adminFile ? (
                  <label className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-10 h-10 text-slate-400 mb-3 animate-bounce" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Drag & Drop original DC Pass PDF here
                    </span>
                    <span className="text-[10px] text-slate-450 block mt-1.5 dark:text-slate-400">
                      Or browse storage to select a file
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processAdminFileSelection(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-150 p-3 rounded-xl dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 dark:bg-slate-900 rounded-lg text-rose-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                          {adminFile.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(adminFile.size / 1024).toFixed(1)} KB • Ready for registration
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminFile(null);
                        setAdminExtractedData(null);
                        setAdminScanError(null);
                        setAdminScanSuccess(null);
                      }}
                      className="text-[10px] font-bold uppercase text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Loader */}
              {adminScanning && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/50 rounded-2xl flex items-center gap-3.5">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-indigo-750 dark:text-indigo-400 uppercase tracking-wider font-mono">
                    Parser active: Extracting high-fidelity metadata structure from PDF...
                  </span>
                </div>
              )}

              {/* Error or Success Toast */}
              {adminScanError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold leading-relaxed">
                  {adminScanError}
                </div>
              )}

              {adminScanSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold leading-relaxed">
                  {adminScanSuccess}
                </div>
              )}

              {/* Data Audit Panel fields */}
              {(adminFile || adminExtractedData) && (
                <div className="space-y-4 pt-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
                    Extracted Compliance Parameters
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        DC Pass Serial Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={adminPassNumber}
                        onChange={(e) => setAdminPassNumber(e.target.value)}
                        placeholder="e.g. STQL140103680"
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Holder Name / Concession *
                      </label>
                      <input
                        type="text"
                        required
                        value={adminHolderName}
                        onChange={(e) => setAdminHolderName(e.target.value)}
                        placeholder="e.g. D Y MINCHEM"
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Vehicle / Carrier Number
                      </label>
                      <input
                        type="text"
                        value={adminVehicleNumber}
                        onChange={(e) => setAdminVehicleNumber(e.target.value)}
                        placeholder="e.g. GJ04AT7674"
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Transit Route
                      </label>
                      <input
                        type="text"
                        value={adminRoute}
                        onChange={(e) => setAdminRoute(e.target.value)}
                        placeholder="e.g. GODHRA - VAPI"
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Department / Issuers
                      </label>
                      <input
                        type="text"
                        value={adminDepartment}
                        onChange={(e) => setAdminDepartment(e.target.value)}
                        placeholder="e.g. Geology & Mining"
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Issue Date
                      </label>
                      <input
                        type="text"
                        value={adminIssueDate}
                        onChange={(e) => setAdminIssueDate(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={adminExpiryDate}
                        onChange={(e) => setAdminExpiryDate(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                        System Configuration Options
                      </span>
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                        <input
                          type="checkbox"
                          checked={adminAddAsApproved}
                          onChange={(e) => setAdminAddAsApproved(e.target.checked)}
                          className="rounded-lg border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
                        />
                        Pre-Approve and certify this digital pass immediately
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <footer className="border-t border-slate-200 dark:border-slate-800 pt-5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdminUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminScanning || !adminFile || !adminPassNumber || !adminHolderName}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Save Pass Record
                </button>
              </footer>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
