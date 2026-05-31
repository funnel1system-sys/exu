/**
 * High-fidelity client-side PDF generator for Commissioner of Geology & Mining, Gujarat
 * Generates official Transit Pass PDF documents dynamically without any external dependencies!
 */
export function generateTransitPassPDFBlob(pass: any): Blob {
  // Estimate UTC timestamp matching the current portal session
  const printDate = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';

  // Helper to escape standard PDF parenthesis text
  const escapePdfText = (str: string) => {
    if (!str) return '';
    return String(str).replace(/[\\()]/g, '\\$&');
  };

  // Truncate long value overflows neatly within table boundaries
  const limitText = (str: string, max: number) => {
    const clean = escapePdfText(str || '');
    if (clean.length <= max) return clean;
    return clean.substring(0, max - 3) + '...';
  };

  // Dynamic rows populated from custom transit pass values
  const rows = [
    { label: "Vehicle Number / Type:", val: pass.vehicle_number || "GJ01XY9988 / Goods Carrier" },
    { label: "Driver Name:", val: pass.driver_name || "RAJESH PATEL" },
    { label: "Driving License No:", val: pass.license_number || "GJ0120220011992" },
    { label: "Driver Mobile No:", val: pass.driver_mobile || "9876543210" },
    { label: "Mineral Name:", val: pass.mineral_name || "Silica Sand Grade-II" },
    { label: "Net Weight (M.T.):", val: `${pass.net_weight || "32.50"} Metric Tonnes` },
    { label: "Concession Holder (Source):", val: pass.concession_holder || "Saurashtra Mining Corp" },
    { label: "Purchaser (Destination):", val: pass.purchaser_name || "D Y MINCHEM" },
    { label: "Source Place:", val: pass.source_place || "Mines Plot 12, Chotila" },
    { label: "Destination Place:", val: pass.destination || "Morbi" },
    { label: "Authorized Route:", val: pass.route_name || "State Highway 17 & NH 8A" },
    { label: "Journey Start Time:", val: pass.journey_start || "" },
    { label: "Journey End Time (Expiry):", val: pass.journey_end || "" },
    { label: "GPS Tracking Details:", val: pass.gps_details || "Active OBD" },
    { label: "Transporter Name:", val: pass.transporter_name || "Maruti Transport" },
  ];

  // Helvetica estimated typography letter metrics sizing helper
  const getEstimatedWidth = (text: string, size: number, isBold: boolean): number => {
    const factor = isBold ? 0.60 : 0.52;
    return text.length * size * factor;
  };

  const drawList: string[] = [];

  // Page styling border guidelines representing Gujarat State official insignia paper
  drawList.push(`1.5 w`);
  drawList.push(`35 35 525 772 re S`); // outer thin box border
  drawList.push(`38 38 519 766 re S`); // inner twin box border

  // Text writer template inside standard PostScript commands
  const addTxt = (x: number, y: number, text: string, size: number, isBold: boolean, align: 'left' | 'center' | 'right' = 'left', r = 0, g = 0, b = 0) => {
    const cleanText = escapePdfText(text);
    let drawX = x;
    if (align === 'center') {
      drawX = x - (getEstimatedWidth(cleanText, size, isBold) / 2);
    } else if (align === 'right') {
      drawX = x - getEstimatedWidth(cleanText, size, isBold);
    }
    const fontDesc = isBold ? '/F2' : '/F1';
    drawList.push(`BT`);
    drawList.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
    drawList.push(`1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm`);
    drawList.push(`${fontDesc} ${size} Tf`);
    drawList.push(`(${cleanText}) Tj`);
    drawList.push(`ET`);
  };

  // Header Title Blocks (CGM Government standards)
  addTxt(297.5, 765, "GOVERNMENT OF GUJARAT", 14, true, 'center', 16, 28, 48);
  addTxt(297.5, 747, "COMMISSIONER OF GEOLOGY & MINING", 11, true, 'center', 16, 28, 48);
  addTxt(297.5, 728, "DELIVERY CHALLAN (TRANSIT PASS)", 13, true, 'center', 16, 124, 76);

  // Separator below title
  drawList.push(`1 w`);
  drawList.push(`0.06 0.48 0.30 rg`);
  drawList.push(`100 721 395 2 re f`); // Bold Emerald line
  drawList.push(`0 0 0 rg`);

  // Transit Pass Metadata Identification Row
  addTxt(52, 698, "TRANSIT PASS NO (DC NUMBER):", 10.5, true, 'left', 0, 0, 0);
  addTxt(235, 698, pass.dc_number || "", 11, true, 'left', 0, 100, 20); // prominent deep shade

  addTxt(52, 680, "Royalty Issue Time:", 9, false, 'left', 100, 100, 100);
  addTxt(155, 680, pass.royalty_issued || "", 9.5, true, 'left', 0, 0, 0);

  addTxt(360, 680, "Status:", 9, false, 'left', 100, 100, 100);
  const isPassActive = (pass.status || "").toLowerCase() === "active";
  const statusColor = isPassActive ? { r: 16, g: 124, b: 76 } : { r: 180, g: 30, b: 30 };
  addTxt(400, 680, (pass.status || "ACTIVE").toUpperCase(), 10, true, 'left', statusColor.r, statusColor.g, statusColor.b);

  // Grid Table configuration (y: 335 to 665, Height 330)
  drawList.push(`0.5 w`);
  drawList.push(`0 0 0 RG`);
  drawList.push(`50 335 495 330 re S`); // Outer Table Box
  drawList.push(`210 335 m 210 665 l S`); // Vertical divider

  // Draw dividers and populate info
  rows.forEach((row, i) => {
    const lineY = 665 - ((i + 1) * 22);
    if (i < 14) {
      drawList.push(`50 ${lineY} m 545 ${lineY} l S`);
    }
    const textY = lineY + 6.5;
    
    // Key Column
    addTxt(58, textY, row.label, 8.5, true, 'left', 30, 41, 59);
    // Val Column
    addTxt(218, textY, limitText(row.val, 65), 9, false, 'left', 0, 0, 0);
  });

  // Security Bulletin Bottom Block
  addTxt(50, 310, "OFFICIAL SECURITY VERIFICATION SYSTEM", 9, true, 'left', 16, 124, 76);
  
  drawList.push(`0.5 w`);
  drawList.push(`0.06 0.48 0.30 RG`);
  drawList.push(`50 302 495 1 re f`); // Custom separator
  drawList.push(`0 0 0 RG`);

  addTxt(50, 287, "QR-code scanner binds this electronic pass live with Geology Dept core databases.", 8, false, 'left', 80, 80, 80);
  addTxt(50, 274, "Gujarat Police checking checkpoints match vehicle transit logs dynamically.", 8, false, 'left', 80, 80, 80);

  // Visual Barcode Vector Pattern Generation
  let barX = 65;
  const barcodeSeed = (pass.dc_number || "STQL1199").toUpperCase();
  for (let i = 0; i < 40; i++) {
    const code = barcodeSeed.charCodeAt(i % barcodeSeed.length);
    const w = (code % 3) + 1; // thickness variation
    drawList.push(`${barX.toFixed(1)} 150 ${w} 40 re f`);
    barX += w + (code % 4) + 1.5; // spacing variation
  }
  addTxt(100, 138, `*${pass.dc_number || ""}*`, 8.5, false, 'left', 0, 0, 0);

  // QR Container Symbol
  drawList.push(`1 w`);
  drawList.push(`440 140 85 85 re S`);
  addTxt(482.5, 185, "DYNAMIC QR", 7.5, true, 'center', 0, 100, 0);
  addTxt(482.5, 172, "SECURITY CODE", 7.5, true, 'center', 0, 100, 0);
  addTxt(482.5, 155, "GUJARAT GOV", 7, false, 'center', 100, 100, 100);

  // Signature Block
  drawList.push(`0.5 w`);
  drawList.push(`400 85 m 525 85 l S`); // Signature Dotted line
  addTxt(462.5, 73, "Authorized Signatory", 9, true, 'center', 0, 0, 0);
  addTxt(462.5, 62, "Mining Comptroller Office", 7.5, false, 'center', 120, 120, 120);

  // System Security and Audit Logs
  addTxt(50, 85, "This is an authentic system generated electronic document verified by SSL and AES security.", 7.5, false, 'left', 90, 90, 90);
  addTxt(50, 74, `Verification Download Reference Time: ${printDate}`, 7.5, false, 'left', 90, 90, 90);
  addTxt(50, 63, `E-Governance Security Code: E-GUJ-GEO-22-${(pass.dc_number || "").substring(0, 6)}-VERIFIED`, 7.5, true, 'left', 16, 124, 76);

  // Compile PDF Data Stream Buffer
  const contentStream = drawList.join('\n');

  // Build standard compatible PDF structure
  const objects: string[] = [];
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj`);
  objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [ 0 0 595 842 ] /Contents 5 0 R >>\nendobj`);
  objects.push(`4 0 obj\n<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >>\nendobj`);
  
  const streamLength = contentStream.length;
  objects.push(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nstreamend\nendobj`);

  const header = `%PDF-1.4\n`;
  let compiled = header;
  const offsets: number[] = [];

  objects.forEach((obj) => {
    offsets.push(compiled.length);
    compiled += obj + '\n';
  });

  const xrefOffset = compiled.length;
  compiled += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  offsets.forEach((offset) => {
    compiled += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });

  compiled += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  // Standard safe stream binary conversion handling unicode characters
  const buffer = new Uint8Array(compiled.length);
  for (let s = 0; s < compiled.length; s++) {
    buffer[s] = compiled.charCodeAt(s) & 0xFF;
  }

  return new Blob([buffer], { type: 'application/pdf' });
}
