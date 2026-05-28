/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DCPass } from "../types";
import { 
  QrCode, FileText, Download, Calendar, ExternalLink, ShieldCheck, 
  MapPin, Landmark, Truck, User, Info, CheckCircle2, AlertTriangle, 
  Clock, Check, Copy
} from "lucide-react";

interface PassCardProps {
  pass: DCPass;
  onEditToggle?: () => void;
  isAdmin?: boolean;
}

export default function PassCard({ pass, onEditToggle, isAdmin = false }: PassCardProps) {
  const [qrBlobUrl, setQrBlobUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "official">("official");

  useEffect(() => {
    // Generate high-resolution authentic QR code payload
    const verificationUrl = `${window.location.origin}/verify/${pass.id}`;
    
    QRCode.toDataURL(verificationUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: "#0f172a", // slate-900
        light: "#ffffff"
      }
    })
    .then((url) => setQrBlobUrl(url))
    .catch((err) => console.error("QR dispatch fault:", err));
  }, [pass.id]);

  const copyVerifyLink = () => {
    const verificationUrl = `${window.location.origin}/verify/${pass.id}`;
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJSONExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pass, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `digital-pass-${pass.passNumber}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleDownloadOfficialHTML = () => {
    // Fulfills the "downloadPDF" function with an ultra-high fidelity printable HTML package containing live embedded codes
    const printDoc = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>DC Pass</title>

<style>

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  background:#f3f3f3;
  font-family:Arial, Helvetica, sans-serif;
  color:#202020;
}

.page{
  max-width:480px;
  margin:auto;
  background:#fff;
  min-height:100vh;
}

/* CONTENT */

.content{
  padding:24px 16px 18px;
}

/* HEADER */

.header{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:14px;
}

.logo{
  width:58px;
  height:58px;
  object-fit:contain;
}

.header-right{
  flex:1;
}

.header-title{
  font-size:11px;
  line-height:1.4;
  color:#3f3f3f;
  font-weight:600;
}

/* GREEN BAR */

.green-bar{
  width:100%;
  background:#5f711f;
  color:white;
  text-align:center;
  padding:10px 0;
  font-size:18px;
  font-weight:700;
  margin-bottom:18px;
}

/* GOV TEXT */

.govt{
  text-align:center;
  margin-bottom:18px;
}

.govt h3{
  font-size:16px;
  line-height:1.4;
  font-weight:700;
}

/* LINE */

.line{
  border-top:1px solid #d8d8d8;
  margin:14px 0;
}

/* ROWS */

.row{
  font-size:17px;
  line-height:1.5;
  margin-bottom:14px;
  text-align: left;
}

.label{
  font-weight:700;
}

/* PASS NUMBER */

.pass-number{
  font-size:21px;
  font-weight:700;
  margin-top:6px;
  word-break:break-word;
}

/* QR */

.qr{
  text-align:center;
  margin:18px 0;
}

.qr img{
  width:145px;
  height:145px;
  object-fit:contain;
}

/* BUTTONS */

.buttons{
  display:flex;
  gap:10px;
  margin-top:20px;
}

.btn{
  background:#6822e6;
  color:white;
  border:none;
  border-radius:6px;
  padding:12px 22px;
  font-size:15px;
  font-weight:600;
  cursor:pointer;
  text-decoration: none;
}

/* FOOTER */

.footer{
  padding:24px 16px;
  color:#7b7b7b;
  font-size:13px;
  line-height:1.5;
  text-align: center;
}

/* MOBILE */

@media(max-width:480px){

  .row{
    font-size:15px;
  }

  .green-bar{
    font-size:16px;
  }

  .govt h3{
    font-size:15px;
  }

}

</style>
</head>

<body>

<div class="page">

  <div class="content">

    <!-- HEADER -->

    <div class="header">

      <!-- CHANGE LOGO -->
      <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Seal_of_Gujarat.svg" class="logo" alt="Seal Logo" onerror="this.onerror=null; this.src='https://raw.githubusercontent.com/site-assets/india-emblem.png';">

      <div class="header-right">

        <div class="header-title">
          COMMISSIONER OF GEOLOGY AND MINING<br>
          INDUSTRIES AND MINES DEPARTMENT GOVERNMENT OF GUJARAT
        </div>

      </div>

    </div>

    <!-- GREEN BAR -->

    <div class="green-bar">
      QR Code based - DC Pass
    </div>

    <!-- GOVT -->

    <div class="govt">

      <h3>
        Commissioner of Geology Mining<br>
        Industries and Mines Department<br>
        (Government of Gujarat)
      </h3>

    </div>

    <div class="line"></div>

    <!-- DETAILS -->

    <div class="row">
      <span class="label">Royalty Issued on:</span>
      ${pass.royaltyIssuedOn || pass.issueDate || "01/04/2026 06:58:21 PM"}
    </div>

    <div class="line"></div>

    <div class="row">

      <span class="label">DC Pass No.</span>

      <div class="pass-number">
        ${pass.passNumber}
      </div>

    </div>

    <!-- QR -->

    <div class="qr">

      <!-- CHANGE QR -->
      <img src="${qrBlobUrl}" alt="QR Seal">

    </div>

    <div class="line"></div>

    <div class="row">
      <span class="label">Vehicle No./(Carrier) Type:</span>
      ${pass.vehicleNumber || "GJ04AT7674"} / ${pass.carrierType || "Goods Carrier(HGV)"}
    </div>

    <div class="row">
      <span class="label">Mineral Name (Grade):</span>
      ${pass.mineralName || "Quartz (16-30 Mesh)"}
    </div>

    <div class="row">
      <span class="label">Net Weight in MT:</span>
      ${pass.netWeight || "24.20"} (${pass.netWeightWords || "Twenty Four point Two Zero Zero"}) MT
    </div>

    <div class="row">
      <span class="label">Concession Holder Name:</span>
      ${pass.concessionHolder || pass.holderName || "Gujarat Minerals"}
    </div>

    <div class="row">
      <span class="label">Source of Place:</span>
      ${pass.sourcePlace || "/ / 422 RABBANI MOHALLA, VEJALPUR ROAD, OPP WATER TANK, GODHRA-389001"}
    </div>

    <div class="row">
      <span class="label">Name of Purchaser:</span>
      ${pass.purchaserName || "D Y MINCHEM"}
    </div>

    <div class="row">
      <span class="label">Destination / Address:</span>
      ${pass.destinationAddress || "VAPI"}
    </div>

    <div class="row">
      <span class="label">Distance:</span>
      ${pass.distance || "345 Km"}
    </div>

    <div class="line"></div>

    <div class="row">
      <span class="label">Journey Start Dt:</span>
      ${pass.journeyStart || pass.issueDate || "01/04/2026 06:55:49 PM"}
    </div>

    <div class="row">
      <span class="label">Journey End Dt:</span>
      ${pass.journeyEnd || pass.expiryDate || "02/04/2026 08:28:49 AM"}
    </div>

    <div class="row">
      <span class="label">Route name:</span>
      ${pass.routeName || pass.route || "NH 48"}
    </div>

    <div class="row">
      <span class="label">Duration:</span>
      ${pass.duration || "0 Day(s) 13 Hour(s) 33 Min"}
    </div>

    <div class="row">
      <span class="label">Checkpost:</span>
      ${pass.checkpost || ""}
    </div>

    <div class="line"></div>

    <div class="row">
      <span class="label">Driver Name:</span>
      ${pass.driverName || "TAHIR BHAI"}
    </div>

    <div class="row">
      <span class="label">Driver’s License No:</span>
      ${pass.driverLicense || "GJ1720070001281"}
    </div>

    <div class="row">
      <span class="label">Driver Mobile No:</span>
      ${pass.driverMobile || "9998757522"}
    </div>

    <div class="line"></div>

    <div class="row">
      <span class="label">PAN Number / GSTIN:</span>
      ${pass.panGst || "AAIFG0837H / 24AAIFG0837H1ZL"}
    </div>

    <div class="row">
      <span class="label">GPS Tracking Device Details:</span>
      ${pass.gpsDetails || "wastoo / WastooWHEELSEYE / Prithivi-140+ OBD Can Feature"}
    </div>

    <div class="row">
      <span class="label">Transporter Name:</span>
      ${pass.transporterName || "SELF"}
    </div>

    <div class="row">
      <span class="label">Buyer Mobile Number:</span>
      ${pass.buyerMobile || "9999999999"}
    </div>

    <!-- BUTTONS -->

    <div class="buttons">

      <button class="btn" onclick="window.print()">
        Print Pass
      </button>

      <button class="btn" onclick="window.close()">
        Close
      </button>

    </div>

  </div>

  <!-- FOOTER -->

  <div class="footer">
    2024© Developed by (n)Code Solutions-A Div of GNFC Ltd.Version : 1.0
  </div>

</div>

</body>
</html>
    `;
    const blob = new Blob([printDoc], { type: "text/html" });
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", URL.createObjectURL(blob));
    dlAnchor.setAttribute("download", `official-dc-pass-${pass.passNumber}.html`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Status visual configurations
  const statusConfig = {
    Approved: {
      bg: "bg-emerald-50 dark:bg-emerald-950/25",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800/40",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: "bg-emerald-600 text-white"
    },
    Pending: {
      bg: "bg-amber-50 dark:bg-amber-950/25",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800/40",
      icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-450" />,
      badge: "bg-amber-500 text-white"
    },
    Rejected: {
      bg: "bg-rose-50 dark:bg-rose-950/25",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-200 dark:border-rose-800/40",
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      badge: "bg-rose-600 text-white"
    }
  };

  const activeTheme = statusConfig[pass.status] || statusConfig.Pending;

  return (
    <div className="w-full relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] duration-200">
      
      {/* Visual Government-Style Header Strip */}
      <div className="bg-slate-900 border-b-2 border-indigo-500/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between text-white md:px-8 gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5f711f]/30 border border-[#5f711f]/40 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-[#a1c430]" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#a1c430] uppercase">
              Gujarat Geology & Mining
            </div>
            <h3 className="font-sans text-xs font-bold tracking-normal text-slate-100 uppercase sm:text-sm">
              E-TRANSIT TRANSIT PORTAL
            </h3>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`px-3 py-1 cursor-pointer text-[10px] sm:text-xs font-bold uppercase rounded-lg transition-all ${
              viewMode === "card"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Terminal View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("official")}
            className={`px-3 py-1 cursor-pointer text-[10px] sm:text-xs font-bold uppercase rounded-lg transition-all ${
              viewMode === "official"
                ? "bg-[#5f711f] text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Official Pass
          </button>
        </div>
        
        <div className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest rounded-md self-start sm:self-auto ${activeTheme.badge}`}>
          {pass.status}
        </div>
      </div>

      {viewMode === "card" ? (
        /* Original Interactive / High-Tech Dashboard Pass Layout Core */
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    DC Pass Registration Series
                  </span>
                  <span className="font-mono text-base font-bold text-slate-800 dark:text-slate-100">
                    {pass.passNumber}
                  </span>
                </div>
                <span className="text-xs font-semibold tracking-wide text-[#a1c430] bg-[#5f711f]/10 px-2.5 py-1 rounded-lg">
                  OFFICIAL RECORD
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 p-3.5 rounded-xl flex gap-3 items-start">
                <User className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Authorized Recipient
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mt-1">
                    {pass.concessionHolder || pass.holderName}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 p-3.5 rounded-xl flex gap-3 items-start">
                <Truck className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Vehicle Registration
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 block mt-1">
                    {pass.vehicleNumber || "UNSPECIFIED"}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 p-3.5 rounded-xl flex gap-3 items-start">
                <Landmark className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Issuing Authority / Dept
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mt-1">
                    {pass.department || "COMMISSIONER OF GEOLOGY AND MINING"}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 p-3.5 rounded-xl flex gap-3 items-start">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Transit Bounds Corridor
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mt-1">
                    {pass.routeName || pass.route || "ALL HIGHWAY ENTRANCES - INTERSTATE"}
                  </span>
                </div>
              </div>

              <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Mineral Transit Configuration
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Product Name</span>
                    <span className="font-bold text-slate-850 dark:text-slate-100">{pass.mineralName || "Quartz (16-30 Mesh)"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Net Weight</span>
                    <span className="font-bold text-slate-850 dark:text-slate-100">{pass.netWeight || "24.20"} Tonnes</span>
                  </div>
                </div>
              </div>

              <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Operational Validation Range
                </span>
                <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex-1 border border-slate-100 dark:border-slate-800">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[8px] text-slate-400 block">START</span>
                      <span className="font-mono">{pass.issueDate || "2026-04-01"}</span>
                    </div>
                  </div>
                  
                  <span className="text-slate-400 px-2">TO</span>

                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex-1 border border-slate-100 dark:border-slate-800">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[8px] text-slate-400 block">EXPIRY</span>
                      <span className="font-mono text-[#a1c430]">{pass.expiryDate || "2026-04-02"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {pass.notes && (
              <div className={`p-4 rounded-2xl border ${activeTheme.border} ${activeTheme.bg} flex gap-3 items-start`}>
                <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <span className="font-bold block uppercase tracking-wider text-[10px] mb-0.5">
                    Official Inspection Notes
                  </span>
                  {pass.notes}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-2xl text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3.5">
              Validation QR Seal
            </span>
            
            <div className="relative p-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xs transition-transform hover:scale-105 duration-200">
              {qrBlobUrl ? (
                <img 
                  src={qrBlobUrl} 
                  alt="Digital Validation QR Code" 
                  className="w-40 h-40 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-300 animate-pulse" />
                </div>
              )}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Auditor Scan Hits
              </span>
              <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100">
                {pass.verifiedCount || 0} hits
              </span>
            </div>

            <p className="text-[9px] text-slate-400 leading-normal mt-2">
              Scan using standard authority devices to review digital status mapping.
            </p>
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------------------------- */
        /* Official Gujarat Government DC Pass Format Visual Template (User Design) */
        /* -------------------------------------------------------------------------- */
        <div className="custom-epass-page-wrapper w-full bg-[#f3f3f3] text-[#202020]">
          <style dangerouslySetInnerHTML={{ __html: `
            .custom-epass-page-wrapper {
              background:#f3f3f3;
              font-family:Arial, Helvetica, sans-serif;
              color:#202020;
              display: flex;
              justify-content: center;
              padding: 0;
              width: 100%;
            }
            .custom-epass-page-wrapper .page{
              width: 100%;
              max-width:480px;
              margin:auto;
              background:#fff;
              min-height:100vh;
              text-align: left;
            }
            .custom-epass-page-wrapper .content{
              padding:24px 16px 18px;
            }
            .custom-epass-page-wrapper .header{
              display:flex;
              align-items:center;
              gap:12px;
              margin-bottom:14px;
            }
            .custom-epass-page-wrapper .logo{
              width:58px;
              height:58px;
              object-fit:contain;
            }
            .custom-epass-page-wrapper .header-right{
              flex:1;
            }
            .custom-epass-page-wrapper .header-title{
              font-size:11px;
              line-height:1.4;
              color:#3f3f3f;
              font-weight:600;
              text-align: left;
            }
            .custom-epass-page-wrapper .green-bar{
              width:100%;
              background:#5f711f;
              color:white;
              text-align:center;
              padding:10px 0;
              font-size:18px;
              font-weight:700;
              margin-bottom:18px;
            }
            .custom-epass-page-wrapper .govt{
              text-align:center;
              margin-bottom:18px;
            }
            .custom-epass-page-wrapper .govt h3{
              font-size:16px;
              line-height:1.4;
              font-weight:700;
              text-align: center;
            }
            .custom-epass-page-wrapper .line{
              border-top:1px solid #d8d8d8;
              margin:14px 0;
            }
            .custom-epass-page-wrapper .row{
              font-size:17px;
              line-height:1.5;
              margin-bottom:14px;
              text-align: left;
            }
            .custom-epass-page-wrapper .label{
              font-weight:700;
            }
            .custom-epass-page-wrapper .pass-number{
              font-size:21px;
              font-weight:700;
              margin-top:6px;
              word-break:break-word;
            }
            .custom-epass-page-wrapper .qr{
              text-align:center;
              margin:18px 0;
            }
            .custom-epass-page-wrapper .qr img{
              width:145px;
              height:145px;
              object-fit:contain;
              margin: 0 auto;
            }
            .custom-epass-page-wrapper .buttons{
              display:flex;
              gap:10px;
              margin-top:20px;
            }
            .custom-epass-page-wrapper .btn{
              background:#6822e6;
              color:white;
              border:none;
              border-radius:6px;
              padding:12px 22px;
              font-size:15px;
              font-weight:600;
              cursor:pointer;
              flex: 1;
              text-align: center;
              transition: background-color 0.2s;
            }
            .custom-epass-page-wrapper .btn:hover {
              background:#571bc2;
            }
            .custom-epass-page-wrapper .footer{
              padding:24px 16px;
              color:#7b7b7b;
              font-size:13px;
              line-height:1.5;
              text-align: center;
            }
            @media(max-width:480px){
              .custom-epass-page-wrapper .row{
                font-size:15px;
              }
              .custom-epass-page-wrapper .green-bar{
                font-size:16px;
              }
              .custom-epass-page-wrapper .govt h3{
                font-size:15px;
              }
            }
          `}} />
          <div className="page">
            <div className="content">
              {/* HEADER */}
              <div className="header">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Seal_of_Gujarat.svg" 
                  className="logo" 
                  alt="Seal Logo"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://raw.githubusercontent.com/site-assets/india-emblem.png';
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="header-right">
                  <div className="header-title">
                    COMMISSIONER OF GEOLOGY AND MINING<br />
                    INDUSTRIES AND MINES DEPARTMENT GOVERNMENT OF GUJARAT
                  </div>
                </div>
              </div>

              {/* GREEN BAR */}
              <div className="green-bar">
                QR Code based - DC Pass
              </div>

              {/* GOVT */}
              <div className="govt">
                <h3>
                  Commissioner of Geology Mining<br />
                  Industries and Mines Department<br />
                  (Government of Gujarat)
                </h3>
              </div>

              <div className="line"></div>

              {/* DETAILS */}
              <div className="row">
                <span className="label">Royalty Issued on:</span>
                {" "}{pass.royaltyIssuedOn || pass.issueDate || "01/04/2026 06:58:21 PM"}
              </div>

              <div className="line"></div>

              <div className="row">
                <span className="label">DC Pass No.</span>
                <div className="pass-number">
                  {pass.passNumber}
                </div>
              </div>

              {/* QR */}
              <div className="qr">
                {qrBlobUrl ? (
                  <img src={qrBlobUrl} alt="E-Pass QR Logo" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-[145px] h-[145px] bg-slate-50 flex items-center justify-center rounded-lg mx-auto">
                    <QrCode className="w-10 h-10 text-slate-300 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="line"></div>

              <div className="row">
                <span className="label">Vehicle No./(Carrier) Type:</span>
                {" "}{pass.vehicleNumber || "GJ04AT7674"} / {pass.carrierType || "Goods Carrier(HGV)"}
              </div>

              <div className="row">
                <span className="label">Mineral Name (Grade):</span>
                {" "}{pass.mineralName || "Quartz (16-30 Mesh)"}
              </div>

              <div className="row">
                <span className="label">Net Weight in MT:</span>
                {" "}{pass.netWeight || "24.20"} ({pass.netWeightWords || "Twenty Four point Two Zero Zero"}) MT
              </div>

              <div className="row">
                <span className="label">Concession Holder Name:</span>
                {" "}{pass.concessionHolder || pass.holderName || "Gujarat Minerals"}
              </div>

              <div className="row">
                <span className="label">Source of Place:</span>
                {" "}{pass.sourcePlace || "/ / 422 RABBANI MOHALLA, VEJALPUR ROAD, OPP WATER TANK, GODHRA-389001"}
              </div>

              <div className="row">
                <span className="label">Name of Purchaser:</span>
                {" "}{pass.purchaserName || "D Y MINCHEM"}
              </div>

              <div className="row">
                <span className="label">Destination / Address:</span>
                {" "}{pass.destinationAddress || "VAPI"}
              </div>

              <div className="row">
                <span className="label">Distance:</span>
                {" "}{pass.distance || "345 Km"}
              </div>

              <div className="line"></div>

              <div className="row">
                <span className="label">Journey Start Dt:</span>
                {" "}{pass.journeyStart || pass.issueDate || "01/04/2026 06:55:49 PM"}
              </div>

              <div className="row">
                <span className="label">Journey End Dt:</span>
                {" "}{pass.journeyEnd || pass.expiryDate || "02/04/2026 08:28:49 AM"}
              </div>

              <div className="row">
                <span className="label">Route name:</span>
                {" "}{pass.routeName || pass.route || "NH 48"}
              </div>

              <div className="row">
                <span className="label">Duration:</span>
                {" "}{pass.duration || "0 Day(s) 13 Hour(s) 33 Min"}
              </div>

              <div className="row">
                <span className="label">Checkpost:</span>
                {" "}{pass.checkpost || ""}
              </div>

              <div className="line"></div>

              <div className="row">
                <span className="label">Driver Name:</span>
                {" "}{pass.driverName || "TAHIR BHAI"}
              </div>

              <div className="row">
                <span className="label">Driver’s License No:</span>
                {" "}{pass.driverLicense || "GJ1720070001281"}
              </div>

              <div className="row">
                <span className="label">Driver Mobile No:</span>
                {" "}{pass.driverMobile || "9998757522"}
              </div>

              <div className="line"></div>

              <div className="row">
                <span className="label">PAN Number / GSTIN:</span>
                {" "}{pass.panGst || "AAIFG0837H / 24AAIFG0837H1ZL"}
              </div>

              <div className="row">
                <span className="label">GPS Tracking Device Details:</span>
                {" "}{pass.gpsDetails || "wastoo / WastooWHEELSEYE / Prithivi-140+ OBD Can Feature"}
              </div>

              <div className="row">
                <span className="label">Transporter Name:</span>
                {" "}{pass.transporterName || "SELF"}
              </div>

              <div className="row">
                <span className="label">Buyer Mobile Number:</span>
                {" "}{pass.buyerMobile || "9999999999"}
              </div>

              {/* BUTTONS */}
              <div className="buttons">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => {
                    if (pass.pdfBase64) {
                      const link = document.createElement("a");
                      link.href = pass.pdfBase64;
                      link.download = pass.pdfFileName || `dc_pass_${pass.passNumber}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else if (pass.pdfUrl) {
                      const link = document.createElement("a");
                      link.href = pass.pdfUrl;
                      link.download = pass.pdfFileName || `dc_pass_${pass.passNumber}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      handleDownloadOfficialHTML();
                    }
                  }}
                >
                  Download
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => {
                    const verificationUrl = `${window.location.origin}/verify/${pass.id}`;
                    // Support history navigation or app redirection
                    window.history.back();
                  }}
                >
                  Back
                </button>
              </div>

            </div>

            {/* FOOTER */}
            <div className="footer">
              2024© Developed by (n)Code Solutions-A Div of GNFC Ltd.Version : 1.0
            </div>
          </div>
        </div>
      )}

      {/* Action footer tabs with download elements */}
      <div className="bg-slate-100 dark:bg-slate-900/40 p-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap gap-2.5 justify-between items-center">
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={copyVerifyLink}
            className="px-3.5 py-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Link Copied!" : "Share Link"}
          </button>

          <button
            type="button"
            onClick={handleJSONExport}
            className="px-3.5 py-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>

        <div className="flex gap-2.0">
          {/* Admin edit trigger */}
          {isAdmin && onEditToggle && (
            <button
              type="button"
              onClick={onEditToggle}
              className="px-4.0 py-2.5 cursor-pointer text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-xl transition-colors"
            >
              Configure Details
            </button>
          )}

          {(pass.pdfBase64 || pass.pdfUrl) && (
            <button
              onClick={() => {
                if (pass.pdfBase64) {
                  const link = document.createElement("a");
                  link.href = pass.pdfBase64;
                  link.download = pass.pdfFileName || `dc_pass_${pass.passNumber}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else if (pass.pdfUrl) {
                  const link = document.createElement("a");
                  link.href = pass.pdfUrl;
                  link.download = `dc_pass_${pass.passNumber}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="px-4.0 py-2.5 cursor-pointer text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              Original PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
