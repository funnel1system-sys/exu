import { useEffect, useState } from 'react';
import { DCPass } from '../types';
import { db } from '../supabase';
import QRCode from 'qrcode';
// @ts-ignore
import logoImg from '../assets/images/cgm_gujarat_logo_1779943769415.png';

interface PublicPassViewProps {
  dcNumber: string;
  onBackToPortal?: () => void;
  isAdmin?: boolean;
}

export default function PublicPassView({ dcNumber, onBackToPortal, isAdmin }: PublicPassViewProps) {
  const [pass, setPass] = useState<DCPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // Force body background to be white and clean when the pass is actively loaded
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#202020';
    
    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, []);

  useEffect(() => {
    if (isAdmin) return;

    // Push an initial dummy entry to history stack immediately
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Re-push again instantly to lock the route
      window.history.pushState(null, '', window.location.href);
      // Reload current component / page as requested
      window.location.reload();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [dcNumber, isAdmin]);

  useEffect(() => {
    async function loadPass(silent = false) {
      try {
        if (!silent) setLoading(true);
        const data = await db.getPassByNumber(dcNumber);
        if (data) {
          setPass(data);
          
          // Generate verification QR code pointing back to the active verification portal
          const verificationUrl = `${window.location.origin}/#/pass/${data.dc_number}`;
          const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 300,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          setQrCodeUrl(qrDataUrl);
        } else {
          if (!silent) setErrorMsg('Pass Not Found or Invalid DC Number');
        }
      } catch (err: any) {
        console.error('Error fetching pass:', err);
        if (!silent) setErrorMsg('Failed to fetch from credentials database');
      } finally {
        if (!silent) setLoading(false);
      }
    }
    loadPass();
    const intervalId = setInterval(() => {
      loadPass(true);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [dcNumber]);

  const handleDownloadPDF = async () => {
    if (!pass) return;

    if (!pass.pdf_base64 && !pass.pdf_url) {
      alert("No uploaded transit PDF document is available for this pass. Falling back to print view.");
      window.print();
      return;
    }

    try {
      const downloadUrl = pass.pdf_base64 || pass.pdf_url!;
      await db.downloadPdf(downloadUrl, `DC-PASS-${pass.dc_number}.pdf`);
    } catch (err) {
      console.error("[DC Pass Portal] Admin uploaded PDF download failed:", err);
      alert("Failed to download the uploaded pass PDF document. Opening print view.");
      window.print();
    }
  };

  // Format date helper matching Gujarat government standard format: '01/04/2026 06:58:21 PM'
  const formatGovDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const pad = (num: number) => String(num).padStart(2, '0');
      
      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const strTime = pad(hours) + ':' + minutes + ':' + seconds + ' ' + ampm;
      
      return `${day}/${month}/${year} ${strTime}`;
    } catch {
      return dateStr;
    }
  };

  // Convert weight number representation (e.g., 24.20) into exact text words representation
  const formatWeightToWords = (weightStr: string) => {
    try {
      const num = parseFloat(weightStr || '0');
      if (isNaN(num)) return weightStr;
      
      const ones = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
      const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      
      const convertUnderHundred = (n: number): string => {
        if (n < 20) return ones[n];
        const unit = n % 10;
        return tens[Math.floor(n / 10)] + (unit ? " " + ones[unit] : "");
      };
      
      const convertInteger = (n: number): string => {
        if (n === 0) return "Zero";
        let words = "";
        if (n >= 100) {
          words += ones[Math.floor(n / 100)] + " Hundred";
          n %= 100;
          if (n > 0) words += " and ";
        }
        if (n > 0) {
          words += convertUnderHundred(n);
        }
        return words;
      };

      const parts = weightStr.split('.');
      const integerPart = parseInt(parts[0] || '0', 10);
      let words = convertInteger(integerPart);
      
      // Pad decimals to 3 spaces for standard weight verbal output matching GGM (e.g. .20 -> .200)
      let decimalStr = parts[1] || '000';
      if (decimalStr.length < 3) {
        decimalStr = decimalStr.padEnd(3, '0');
      }
      
      words += " point";
      for (let i = 0; i < decimalStr.length; i++) {
        const digit = parseInt(decimalStr[i], 10);
        if (!isNaN(digit)) {
          words += " " + ones[digit];
        }
      }
      
      return words;
    } catch {
      return "";
    }
  };

  // Compute duration block: '0 Day(s) 13 Hour(s) 33 Min'
  const getDurationString = (start: string, end: string) => {
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      if (isNaN(s) || isNaN(e)) return "0 Day(s) 13 Hour(s) 33 Min";
      const diffMs = e - s;
      if (diffMs <= 0) return "0 Day(s) 0 Hour(s) 0 Min";
      
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);
      const remainingHrs = diffHrs % 24;
      const remainingMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffDays} Day(s) ${remainingHrs} Hour(s) ${remainingMins} Min`;
    } catch {
      return "0 Day(s) 0 Hour(s) 0 Min";
    }
  };

  // Generate a consistent deterministic distance value for the pass route
  const getDeterministicDistance = (dcNo: string) => {
    if (!dcNo) return "345 Km";
    let sum = 0;
    for (let i = 0; i < dcNo.length; i++) {
      const code = dcNo.charCodeAt(i);
      if (code >= 48 && code <= 57) {
        sum += (code - 48);
      }
    }
    const val = (sum * 5) % 400 + 80;
    return `${val} Km`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f3f3f3] text-gray-800 p-6 font-sans">
        <style>{`
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border-left-color: #5f711f;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div className="spinner"></div>
        <p style={{ fontWeight: 600, color: '#333' }}>Loading Secure Transit Record...</p>
      </div>
    );
  }

  if (errorMsg || !pass) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3f3f3] p-4 font-sans text-gray-900">
        <style>{`
          .error-card {
            background: #fff;
            max-width: 400px;
            width: 100%;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
            border-top: 6px solid #b91c1c;
          }
          .error-title {
            font-size: 20px;
            font-weight: 700;
            color: #b91c1c;
            margin-bottom: 12px;
          }
          .error-desc {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 20px;
            line-height: 1.5;
          }
          .btn-error {
            background: #1f2937;
            color: #fff;
            border: none;
            padding: 10px 16px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: opacity 0.2s;
          }
          .btn-error:hover {
            opacity: 0.9;
          }
        `}</style>
        <div className="error-card">
          <div className="error-title">Transit Pass Verification Blocked</div>
          <p className="error-desc">
            {errorMsg || "The requested transit pass identifier could not be validated against the Commissioner of Geology and Mining system database."}
          </p>
          <button className="btn-error" onClick={onBackToPortal}>
            Return to Portal Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-pass-scope">
      {/* SCOPED STYLES PREVENTING LEAKAGE AND GUARANTEEING EXACT COLOR AND RENDERING OF USER'S LAYOUT */}
      <style>{`
        .public-pass-scope {
          background: #ffffff;
          min-height: 100vh;
          font-family: Arial, Helvetica, sans-serif;
          color: #202020;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          display: block;
        }

        .public-pass-scope * {
          box-sizing: border-box;
        }

        .public-pass-scope .page {
          max-width: 480px;
          margin: auto;
          background: #fff;
          min-height: 100vh;
          box-shadow: 0 0 20px rgba(0,0,0,0.08);
        }

        /* CONTENT */
        .public-pass-scope .content {
          padding: 24px 16px 18px;
        }

        /* HEADER */
        .public-pass-scope .header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          text-align: left;
        }

        .public-pass-scope .header-logo {
          width: 75px;
          height: 75px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .public-pass-scope .header-title {
          font-size: 11px;
          line-height: 1.4;
          color: #3f3f3f;
          font-weight: 700;
          font-family: Arial, Helvetica, sans-serif;
          text-align: left;
        }

        /* GREEN BAR */
        .public-pass-scope .green-bar {
          width: 100%;
          background: #5f711f;
          color: white;
          text-align: center;
          padding: 10px 0;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        /* GOV TEXT */
        .public-pass-scope .govt {
          text-align: center;
          margin-bottom: 18px;
        }

        .public-pass-scope .govt h3 {
          font-size: 16px;
          line-height: 1.4;
          font-weight: 700;
          color: #202020;
        }

        /* LINE */
        .public-pass-scope .line {
          border-top: 1px solid #d8d8d8;
          margin: 14px 0;
        }

        /* ROWS */
        .public-pass-scope .row {
          font-size: 17px;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .public-pass-scope .label {
          font-weight: 700;
        }

        /* PASS NUMBER */
        .public-pass-scope .pass-number {
          font-size: 14.7px;
          font-weight: 700;
          margin-top: 6px;
          word-break: break-all;
        }

        /* QR */
        .public-pass-scope .qr {
          text-align: center;
          margin: 18px 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .public-pass-scope .qr img {
          width: 145px;
          height: 145px;
          object-fit: contain;
          border: 1px solid #ddd;
          padding: 4px;
          background: #fff;
          display: block;
          margin: 0 auto;
        }

        /* BUTTONS */
        .public-pass-scope .buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .public-pass-scope .btn {
          background: #6822e6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          text-align: center;
          flex: 1;
        }

        .public-pass-scope .btn:hover {
          background: #5619cc;
        }

        .public-pass-scope .btn-secondary {
          background: #4b5563;
        }

        .public-pass-scope .btn-secondary:hover {
          background: #374151;
        }

        /* FOOTER */
        .public-pass-scope .footer {
          padding: 24px 16px;
          color: #7b7b7b;
          font-size: 13px;
          line-height: 1.5;
          text-align: center;
        }

        /* MOBILE */
        @media(max-width: 480px){
          .public-pass-scope .row {
            font-size: 15px;
          }

          .public-pass-scope .green-bar {
            font-size: 16px;
          }

          .public-pass-scope .govt h3 {
            font-size: 15px;
          }
        }

        /* PRINT STYLINGS TO HIDE BUTTONS */
        @media print {
          .public-pass-scope .buttons {
            display: none !important;
          }
          .public-pass-scope {
            background: #fff !important;
          }
          .public-pass-scope .page {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className="page">
        <div className="content">
          {/* HEADER */}
          <div className="header">
            <img 
              src={logoImg} 
              alt="Commissioner of Geology & Mining Gujarat Logo" 
              className="header-logo"
              referrerPolicy="no-referrer"
            />
            <div className="header-title">
              COMMISSIONER OF GEOLOGY AND MINING<br />
              INDUSTRIES AND MINES DEPARTMENT GOVERNMENT OF GUJARAT
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
            <span className="label">Royalty Issued on:</span>{' '}
            {pass.royalty_issued || formatGovDate(pass.created_at)}
          </div>

          <div className="line"></div>

          <div className="row">
            <span className="label">DC Pass No.</span>
            <div className="pass-number">
              {pass.dc_number}
            </div>
          </div>

          {/* QR */}
          <div className="qr">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="DC Pass QR Code" />
            ) : (
              <div style={{ width: 145, height: 145, background: '#eee', margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#666' }}>
                Rendering ...
              </div>
            )}
          </div>

          <div className="line"></div>

          <div className="row">
            <span className="label">Vehicle No./(Carrier) Type:</span>{' '}
            {pass.vehicle_number ? (pass.vehicle_number.includes('/') ? pass.vehicle_number : `${pass.vehicle_number} / Goods Carrier(HGV)`) : ''}
          </div>

          <div className="row">
            <span className="label">Mineral Name (Grade):</span>{' '}
            {pass.mineral_name}
          </div>

          <div className="row">
            <span className="label">Net Weight in MT:</span>{' '}
            {pass.net_weight} ({formatWeightToWords(pass.net_weight)}) MT
          </div>

          <div className="row">
            <span className="label">Concession Holder Name:</span>{' '}
            {pass.concession_holder}
          </div>

          <div className="row">
            <span className="label">Source of Place:</span>{' '}
            / / {pass.source_place}
          </div>

          <div className="row">
            <span className="label">Name of Purchaser:</span>{' '}
            {pass.purchaser_name || 'D Y MINCHEM'}
          </div>

          <div className="row">
            <span className="label">Destination / Address:</span>{' '}
            {pass.destination}
          </div>

          <div className="row">
            <span className="label">Distance:</span>{' '}
            {pass.distance || getDeterministicDistance(pass.dc_number)}
          </div>

          <div className="line"></div>

          <div className="row">
            <span className="label">Journey Start Dt:</span>{' '}
            {pass.journey_start ? (pass.journey_start.includes('/') ? pass.journey_start : formatGovDate(pass.journey_start)) : ''}
          </div>

          <div className="row">
            <span className="label">Journey End Dt:</span>{' '}
            {pass.journey_end ? (pass.journey_end.includes('/') ? pass.journey_end : formatGovDate(pass.journey_end)) : ''}
          </div>

          <div className="row">
            <span className="label">Route name:</span>{' '}
            {pass.route_name}
          </div>

          <div className="row">
            <span className="label">Duration:</span>{' '}
            {pass.duration || getDurationString(pass.journey_start, pass.journey_end)}
          </div>

          <div className="row">
            <span className="label">Checkpost:</span>{' '}
            {pass.checkpost || ''}
          </div>

          <div className="line"></div>

          <div className="row">
            <span className="label">Driver Name:</span>{' '}
            {pass.driver_name}
          </div>

          <div className="row">
            <span className="label">Driver’s License No:</span>{' '}
            {pass.license_number}
          </div>

          <div className="row">
            <span className="label">Driver Mobile No:</span>{' '}
            {pass.driver_mobile}
          </div>

          <div className="line"></div>

          <div className="row">
            <span className="label">PAN Number / GSTIN:</span>{' '}
            {pass.pan_gstin || 'ABCPG3241F / 24ABCPG3241F1ZD'}
          </div>

          <div className="row">
            <span className="label">GPS Tracking Device Details:</span>{' '}
            {pass.gps_details}
          </div>

          <div className="row">
            <span className="label">Transporter Name:</span>{' '}
            {pass.transporter_name}
          </div>

          <div className="row">
            <span className="label">Buyer Mobile Number:</span>{' '}
            {pass.buyer_mobile}
          </div>

          {/* BUTTONS */}
          <div className="buttons">
            <button className="btn" onClick={handleDownloadPDF}>
              Download
            </button>

            <button 
              className="btn btn-secondary" 
              onClick={() => {
                if (isAdmin && onBackToPortal) {
                  onBackToPortal();
                } else {
                  window.location.reload();
                }
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
  );
}
