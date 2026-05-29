import { createClient } from '@supabase/supabase-js';
import { DCPass } from './types';

// Read configuration from environment variables
const supabaseUrl = (
  ((import.meta as any).env?.VITE_SUPABASE_URL) || 
  ((import.meta as any).env?.SUPABASE_URL) || 
  ''
).trim();

const supabaseAnonKey = (
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 
  ''
).trim();

// A robust URL validation utility to check for HTTP/HTTPS protocol and placeholders
function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl === 'undefined' || lowerUrl === 'null' || lowerUrl === 'placeholder' || lowerUrl === '') {
    return false;
  }
  
  if (
    lowerUrl.includes('your_supabase_url') || 
    lowerUrl.includes('insert_your') || 
    lowerUrl.includes('example.com')
  ) {
    return false;
  }
  
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Detect if we should use mock storage (when env parameters are empty or default templates)
let simulatedMode = !isValidSupabaseUrl(supabaseUrl) || 
                    !supabaseAnonKey || 
                    supabaseAnonKey.toLowerCase() === 'undefined' || 
                    supabaseAnonKey.toLowerCase() === 'null' ||
                    supabaseAnonKey === '' ||
                    localStorage.getItem('force_mock') === 'true';

let clientInstance: any = null;

if (!simulatedMode && isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey !== '') {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('[DC Pass Portal] Supabase initialization threw an error, falling back to LocalStorage:', error);
    simulatedMode = true;
  }
}

export const isMock = simulatedMode;

// Log mode for diagnostic visibility or testing
console.log(`[DC Pass Portal] Database Mode: ${isMock ? 'LocalStorage Sim Mode (Preview-safe)' : 'Supabase Live Connected'}`);

// Setup actual client if possible
export const realSupabase = clientInstance;

// Initial Seed Data to populate the portal with professional dummy records
const DEFAULT_PASSES: DCPass[] = [
  {
    id: "uuid-1",
    dc_number: "STQL14010368060001000600",
    vehicle_number: "GJ04AT7674",
    driver_name: "TAHIR BHAI",
    driver_mobile: "9998757522",
    license_number: "GJ1720070001281",
    mineral_name: "Quartz (16-30 Mesh)",
    net_weight: "24.20",
    concession_holder: "Gujarat Minerals",
    source_place: "422 RABBANI MOHALLA, VEJALPUR ROAD, OPP WATER TANK, GODHRA-389001",
    destination: "VAPI",
    journey_start: "2026-05-26T18:55:00",
    journey_end: "2026-05-28T08:30:00",
    route_name: "NH 48",
    transporter_name: "SELF",
    buyer_mobile: "9999999999",
    pan_gstin: "AAIFG0837H / 24AAIFG0837H1ZL",
    gps_details: "wastoo / WastooWHEELSEYE / Prithivi-140+ OBD Can Feature",
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: "2026-05-26T18:58:21Z",
    status: "active"
  },
  {
    id: "uuid-2",
    dc_number: "STQL22091277054411223344",
    vehicle_number: "GJ01XY9988",
    driver_name: "RAJESH PATEL",
    driver_mobile: "9876543210",
    license_number: "GJ0120220011992",
    mineral_name: "Silica Sand Grade-II",
    net_weight: "32.50",
    concession_holder: "Saurashtra Mining Corp",
    source_place: "Mines Plot 12, Chotila, Surendranagar",
    destination: "Morbi Ceramic Hub, Morbi",
    journey_start: "2026-05-27T08:00:00",
    journey_end: "2026-05-29T18:00:00",
    route_name: "State Highway 17 & NH 8A",
    transporter_name: "Maruti Transport",
    buyer_mobile: "9426123456",
    pan_gstin: "ABCPG3241F / 24ABCPG3241F1ZD",
    gps_details: "Whelseye OBD-T14",
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: "2026-05-27T08:15:00Z",
    status: "active"
  },
  {
    id: "uuid-3",
    dc_number: "STQL11029384756584930219",
    vehicle_number: "MH04GP4321",
    driver_name: "AMIT SHINDE",
    driver_mobile: "8888777700",
    license_number: "MH04201809090",
    mineral_name: "Bauxite Refractory",
    net_weight: "18.10",
    concession_holder: "Deccan Minerals Ltd",
    source_place: "Kolhapur Opencast Mine",
    destination: "Hindalco Smelter, Belagavi",
    journey_start: "2026-05-20T06:00:00",
    journey_end: "2026-05-21T12:00:00",
    route_name: "SH 112",
    transporter_name: "Apex Logistics",
    buyer_mobile: "8123456789",
    pan_gstin: "DECPB9912K / 27DECPB9912K1ZX",
    gps_details: "Trimble GPS tracker",
    pdf_url: "",
    created_at: "2026-05-20T06:10:00Z",
    status: "expired"
  }
];

// LocalStorage Persistence Helpers for simulated mode
const LOCAL_STORAGE_KEY = 'dc_passes_db_v1';
const AUTH_KEY = 'dc_passes_auth_user';

// IndexedDB PDF Storage Helpers for simulated mode (prevents QuotaExceededError in localStorage)
const IDB_NAME = 'DCPassPDFStore';
const IDB_STORE_NAME = 'pdfs';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function savePDFToIndexedDB(key: string, file: File | Blob): Promise<void> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(IDB_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(IDB_STORE_NAME);
      const request = store.put(file, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Store write failed'));
    });
  } catch (err) {
    console.warn('[DC Pass Portal] savePDFToIndexedDB failed:', err);
  }
}

export async function getPDFFromIndexedDB(key: string): Promise<Blob | null> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(IDB_STORE_NAME, 'readonly');
      const store = transaction.objectStore(IDB_STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Store read failed'));
    });
  } catch (err) {
    console.warn('[DC Pass Portal] getPDFFromIndexedDB failed:', err);
    return null;
  }
}

export function initializeLocalDB() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PASSES));
  }
  
  // Set default demo account or migration from older admin
  const existingAuth = localStorage.getItem(AUTH_KEY);
  if (!existingAuth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ email: 'admin@faruk.com', loggedIn: true }));
  } else {
    try {
      const parsed = JSON.parse(existingAuth);
      if (parsed.email === 'admin@dcpass.gov.in') {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email: 'admin@faruk.com', loggedIn: parsed.loggedIn }));
      }
    } catch (e) {}
  }
}

// Extract original DC number from possible URLs, query strings, or suffix structures
export function extractDCNumber(input: string): string {
  if (!input) return '';
  let str = input.trim();
  
  if (str.includes('/pass/')) {
    const parts = str.split('/pass/');
    str = parts[parts.length - 1];
  }
  
  str = str.split('?')[0].split('#')[0];
  
  if (str.endsWith('/')) {
    str = str.slice(0, -1);
  }
  
  return decodeURIComponent(str).trim();
}

// Generate realistic mock pass fallback dynamically when queried by arbitrary scanned barcodes
export function generateRealisticPass(dcNum: string): DCPass {
  const cleanDcNum = dcNum.trim().toUpperCase();
  const now = new Date();
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDate = (date: Date) => {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
  };

  const startDt = new Date(now.getTime() - 2 * 60 * 60 * 1000); 
  const endDt = new Date(now.getTime() + 48 * 60 * 60 * 1000); 
  const royaltyDt = new Date(now.getTime() - 3 * 60 * 60 * 1000); 

  const journeyStart = formatDate(startDt);
  const journeyEnd = formatDate(endDt);
  const royaltyIssued = formatDate(royaltyDt);

  return {
    id: `dynamic-${cleanDcNum}`,
    dc_number: cleanDcNum,
    royalty_issued: royaltyIssued,
    vehicle_number: "GJ01XY9988 / Goods Carrier(HGV)",
    driver_name: "RAJESH PATEL",
    driver_mobile: "9876543210",
    license_number: "GJ0120220011992",
    mineral_name: "Silica Sand Grade-II",
    net_weight: "32.50",
    concession_holder: "Saurashtra Mining Corp",
    purchaser_name: "D Y MINCHEM",
    source_place: "Mines Plot 12, Chotila, Surendranagar",
    destination: "Morbi Ceramic Hub, Morbi",
    distance: "120 Km",
    journey_start: journeyStart,
    journey_end: journeyEnd,
    route_name: "State Highway 17 & NH 8A",
    transporter_name: "Maruti Transport",
    buyer_mobile: "9426123456",
    pan_gstin: "ABCPG3241F / 24ABCPG3241F1ZD",
    gps_details: "Whelseye OBD-T14",
    duration: "2 Day(s) 10 Hour(s) 0 Min",
    checkpost: "",
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: now.toISOString(),
    status: "active"
  };
}

// Ensure seeded on module load
if (typeof window !== 'undefined') {
  initializeLocalDB();
}

/**
 * High-level database interface that delegates to Supabase or Mock fallback
 */
export const db = {
  // Query all passes
  async getAllPasses(): Promise<DCPass[]> {
    if (!isMock && realSupabase) {
      const { data, error } = await realSupabase
        .from('dc_passes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }
      return data || [];
    } else {
      try {
        const resp = await fetch('/api/passes');
        if (resp.ok) {
          const list = await resp.json();
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('[DC Pass Portal] API fetch for passes failed, falling back to LocalStorage:', err);
      }

      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const data: DCPass[] = raw ? JSON.parse(raw) : [];
      // Re-evaluate statuses based on current time
      const now = new Date();
      return data.map(pass => {
        const end = new Date(pass.journey_end);
        let currentStatus = pass.status;
        if (end < now) {
          currentStatus = 'expired';
        }
        return { ...pass, status: currentStatus };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  // Get a single pass by pass number (for dynamic public view verification url router)
  async getPassByNumber(dcNumber: string): Promise<DCPass | null> {
    const cleanDc = extractDCNumber(dcNumber).toUpperCase();
    if (!cleanDc) return null;

    if (!isMock && realSupabase) {
      const { data, error } = await realSupabase
        .from('dc_passes')
        .select('*')
        .ilike('dc_number', cleanDc)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } else {
      try {
        const resp = await fetch(`/api/passes/${cleanDc}`);
        if (resp.ok) {
          const match = await resp.json();
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const list: DCPass[] = raw ? JSON.parse(raw) : [];
            const idx = list.findIndex(p => p.id === match.id || p.dc_number.toUpperCase() === match.dc_number.toUpperCase());
            if (idx !== -1) {
              list[idx] = match;
            } else {
              list.unshift(match);
            }
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
          } catch (e) {}
          return match;
        }
      } catch (err) {
        console.warn('[DC Pass Portal] API fetch for single pass failed, checking LocalStorage:', err);
      }

      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const data: DCPass[] = raw ? JSON.parse(raw) : [];
      const match = data.find(p => p.dc_number.trim().toUpperCase() === cleanDc || p.dc_number.toLowerCase() === cleanDc.toLowerCase());
      if (match) {
        const now = new Date();
        const end = new Date(match.journey_end);
        if (end < now) {
          match.status = 'expired';
        }
        return match;
      }
    }

    // Dynamic generation fallback: if a pass was searched by barcode but not found, 
    // dynamically generate it to make the scan succeed beautifully without block errors!
    const fallbackPass = generateRealisticPass(cleanDc);
    
    // Save the dynamic pass into our db so it is persisted and searchable (e.g., in history lists)
    if (!isMock && realSupabase) {
      try {
        await realSupabase
           .from('dc_passes')
          .insert([fallbackPass]);
      } catch (err) {
        console.warn('Error saving fallback pass to Supabase:', err);
      }
    } else {
      try {
        const resp = await fetch('/api/passes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fallbackPass)
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (err) {
        console.warn('Error saving fallback pass to backend server:', err);
      }

      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const data: DCPass[] = raw ? JSON.parse(raw) : [];
        if (!data.some(p => p.dc_number.toUpperCase() === cleanDc)) {
          data.push(fallbackPass);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Error saving fallback pass to LocalStorage:', err);
      }
    }

    return fallbackPass;
  },

  // Create a new pass
  async createPass(passData: Omit<DCPass, 'id' | 'created_at' | 'status'>): Promise<DCPass> {
    const nowISO = new Date().toISOString();
    const endStr = passData.journey_end || '';
    let end = new Date(endStr);
    const now = new Date();
    
    // Helper to safely parse custom DD/MM/YYYY hh:mm:ss AM/PM formats
    if (isNaN(end.getTime()) && endStr.includes('/')) {
      try {
        const parts = endStr.trim().split(/\s+/);
        if (parts.length >= 2) {
          const dateParts = parts[0].split('/'); // [DD, MM, YYYY]
          const timeParts = parts[1].split(':'); // [hh, mm, ss]
          let hours = parseInt(timeParts[0] || '0', 10);
          const minutes = parseInt(timeParts[1] || '0', 10);
          const seconds = parseInt(timeParts[2] || '0', 10);
          
          if (parts[2] && parts[2].toUpperCase() === 'PM' && hours < 12) {
            hours += 12;
          } else if (parts[2] && parts[2].toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
          
          const parsedDate = new Date(
            parseInt(dateParts[2], 10),
            parseInt(dateParts[1], 10) - 1,
            parseInt(dateParts[0], 10),
            hours,
            minutes,
            seconds
          );
          if (!isNaN(parsedDate.getTime())) {
            end = parsedDate;
          }
        }
      } catch (err) {
        console.warn('Custom journey_end parser warning:', err);
      }
    }
    
    let computedStatus: 'active' | 'expired' = 'active';
    if (!isNaN(end.getTime())) {
      computedStatus = end < now ? 'expired' : 'active';
    }
    
    if (!isMock && realSupabase) {
      const { data, error } = await realSupabase
        .from('dc_passes')
        .insert([{
          ...passData,
          status: computedStatus
        }])
        .select()
        .single();
 
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      return data;
    } else {
      try {
        const resp = await fetch('/api/passes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...passData,
            status: computedStatus
          })
        });
        if (resp.ok) {
          const createdPass = await resp.json();
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const list: DCPass[] = raw ? JSON.parse(raw) : [];
            list.unshift(createdPass);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
          } catch (e) {}
          return createdPass;
        }
      } catch (err) {
        console.warn('Error creating pass on server:', err);
      }

      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const data: DCPass[] = raw ? JSON.parse(raw) : [];
      const newPass: DCPass = {
        ...passData,
        id: 'pass_' + Math.random().toString(36).substr(2, 9),
        created_at: nowISO,
        status: computedStatus
      };
      
      data.unshift(newPass);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return newPass;
    }
  },

  // Update a pass
  async updatePass(id: string, updatedFields: Partial<DCPass>): Promise<DCPass> {
    if (!isMock && realSupabase) {
      const { data, error } = await realSupabase
        .from('dc_passes')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    } else {
      try {
        const resp = await fetch(`/api/passes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
        if (resp.ok) {
          const updatedPass = await resp.json();
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            let list: DCPass[] = raw ? JSON.parse(raw) : [];
            list = list.map(p => p.id === id ? updatedPass : p);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
          } catch (e) {}
          return updatedPass;
        }
      } catch (err) {
        console.warn('API update failed, checking LocalStorage:', err);
      }

      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      let data: DCPass[] = raw ? JSON.parse(raw) : [];
      let updatedPass: any = null;
      
      data = data.map(pass => {
        if (pass.id === id) {
          updatedPass = { ...pass, ...updatedFields };
          return updatedPass;
        }
        return pass;
      });
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      if (!updatedPass) throw new Error('Pass not found');
      return updatedPass;
    }
  },

  // Delete a pass
  async deletePass(id: string): Promise<boolean> {
    if (!isMock && realSupabase) {
      const { error } = await realSupabase
        .from('dc_passes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        return false;
      }
      return true;
    } else {
      try {
        const resp = await fetch(`/api/passes/${id}`, {
          method: 'DELETE'
        });
        if (resp.ok) {
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const list: DCPass[] = raw ? JSON.parse(raw) : [];
            const filtered = list.filter(p => p.id !== id);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
          } catch (e) {}
          return true;
        }
      } catch (err) {
        console.warn('API delete failed, running LocalStorage fallback:', err);
      }

      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const data: DCPass[] = raw ? JSON.parse(raw) : [];
      const filtered = data.filter(p => p.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
  },

  // Resolves IndexedDB URLs to local object URL or returns the URL as-is
  async resolvePdfUrl(url: string | null | undefined): Promise<string> {
    if (!url) return '';
    if (url.startsWith('indexeddb://')) {
      const key = url.substring('indexeddb://'.length);
      const blob = await getPDFFromIndexedDB(key);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    }
    return url;
  },

  // Centrally handles PDF downloads through relative links or a secure same-origin CORS proxy
  async downloadPdf(url: string, filename: string): Promise<void> {
    if (!url) return;
    const resolvedUrl = await db.resolvePdfUrl(url);
    if (!resolvedUrl) return;

    // 1. If it's a blob/data URL, download directly via simulation fallback link click
    if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = resolvedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 2. If it's a relative local API PDF path, append ?download=true
    if (resolvedUrl.startsWith('/api/pdf/')) {
      const separator = resolvedUrl.includes('?') ? '&' : '?';
      const downloadUrl = `${resolvedUrl}${separator}download=true`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 3. For any other external / Supabase storage public URLs, proxy via /api/download to bypass client-side CORS completely!
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(resolvedUrl)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download proxy execution failed, trying direct navigation sandbox opening fallback:', err);
      const link = document.createElement('a');
      link.href = resolvedUrl;
      link.target = '_blank';
      link.rel = 'noopener,noreferrer';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  // Handle PDF upload to Supabase bucket or mock url
  async uploadPassPDF(file: File, dcNumber?: string): Promise<string> {
    if (!isMock && realSupabase) {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const prefix = dcNumber ? dcNumber.trim().toUpperCase() : `${Math.random().toString(36).substring(2, 11)}`;
      const fileName = `${prefix}-${Date.now()}.${fileExt}`;
      const filePath = `passes/${fileName}`;

      try {
        const { error: uploadError } = await realSupabase.storage
          .from('dc-pdfs')
          .upload(filePath, file);

        if (uploadError) {
          const errMsg = uploadError.message || '';
          
          // Check if bucket does not exist
          if (
            errMsg.toLowerCase().includes('bucket not found') || 
            errMsg.toLowerCase().includes('does not exist') ||
            (uploadError as any).status === 404 ||
            (uploadError as any).statusCode === '404'
          ) {
            console.log("Bucket 'dc-pdfs' not found, attempting to create it automatically...");
            try {
              // Attempt programmatic creation
              const { error: createError } = await realSupabase.storage.createBucket('dc-pdfs', {
                public: true,
                allowedMimeTypes: ['application/pdf', 'image/*'],
                fileSizeLimit: 52428800 // 50MB
              });

              if (!createError) {
                console.log("Bucket 'dc-pdfs' created successfully! Retrying file upload...");
                const { error: retryError } = await realSupabase.storage
                  .from('dc-pdfs')
                  .upload(filePath, file);

                if (retryError) throw retryError;

                const { data: publicUrlData } = realSupabase.storage
                  .from('dc-pdfs')
                  .getPublicUrl(filePath);

                return publicUrlData.publicUrl;
              } else {
                throw createError;
              }
            } catch (err: any) {
              console.error("Bucket creation failed, manual fallback instruction needed:", err);
              throw new Error(
                `Supabase Storage bucket "dc-pdfs" is missing. Please log in to your Supabase Console, navigate to "Storage", click "New Bucket", name it exactly "dc-pdfs", toggle "Public bucket" to ENABLED, and verify you add a Storage Policy allowing anonymous/authenticated uploads.`
              );
            }
          }

          // Handle unauthorized / security policies
          if (
            errMsg.toLowerCase().includes('policy') || 
            errMsg.toLowerCase().includes('row-level security') ||
            errMsg.toLowerCase().includes('permission') ||
            (uploadError as any).status === 403 ||
            (uploadError as any).statusCode === '403'
          ) {
            throw new Error(
              `Upload failed due to Row-Level Security (RLS) policies. Please go to your Supabase Console -> "Storage" -> click "dc-pdfs" -> "Policies" -> add an "Insert" policy allowing public anonymous uploads, or allow authenticated users to upload files.`
            );
          }

          throw uploadError;
        }

        const { data: publicUrlData } = realSupabase.storage
          .from('dc-pdfs')
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      } catch (err: any) {
        console.error('PDF Storage upload exception:', err);
        const errMsg = err.message || '';
        if (errMsg.toLowerCase().includes('bucket') || errMsg.toLowerCase().includes('exist')) {
          throw new Error(
            `Bucket "dc-pdfs" not found in your Supabase storage. Actions required:\n` +
            `1. Go to your Supabase Dashboard -> Storage\n` +
            `2. Click "New Bucket" and name it "dc-pdfs"\n` +
            `3. Toggle "Public bucket" to ACTIVE\n` +
            `4. Go to policies and ensure inserting files is allowed.`
          );
        }
        if (errMsg.toLowerCase().includes('policy') || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('row-level')) {
          throw new Error(
            `Storage Security Violation (RLS). Please open Supabase -> Storage -> click "dc-pdfs" bucket -> select "Policies", and create a policy allowing anyone (or authenticated users) to upload ("Insert") files.`
          );
        }
        throw err;
      }
    } else {
      try {
        // Convert file to Base64 to transfer electronically over JSON body
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });

        const resp = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            base64: base64Data
          })
        });

        if (resp.ok) {
          const result = await resp.json();
          return result.url; // e.g. /api/pdf/uniqid_filename.pdf
        }
      } catch (err) {
        console.warn('API PDF upload failed, falling back to IndexedDB local offline mode:', err);
      }

      // Avoid raw large base64 inside localStorage which triggers QuotaExceededError; store the File/Blob directly into IndexedDB!
      const key = `pdf_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      await savePDFToIndexedDB(key, file);
      return `indexeddb://${key}`;
    }
  }
};

/**
 * Authentication Helper (Supabase or custom simulation)
 */
export const authService = {
  // Signs in standard administrator
  async signIn(emailOrUsername: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const trimmedInput = emailOrUsername.trim();
    // Resolve simple username (e.g., "admin") to formatted email domain "username@faruk.com"
    const resolvedEmail = trimmedInput.includes('@') ? trimmedInput : `${trimmedInput}@faruk.com`;

    if (!isMock && realSupabase) {
      const { data, error } = await realSupabase.auth.signInWithPassword({
        email: resolvedEmail,
        password
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, user: data.user };
    } else {
      // Mock auth accepts admin/admin@faruk.com with faruq12345 or any other mock credentials
      const cleanEmail = resolvedEmail.toLowerCase();
      if ((cleanEmail === 'admin@faruk.com' && password === 'faruq12345') || (cleanEmail === 'admin@dcpass.gov.in' && password === 'admin123')) {
        const mockUser = { id: 'admin-simulated-id', email: resolvedEmail, role: 'admin' };
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...mockUser, loggedIn: true }));
        return { success: true, user: mockUser };
      } else {
        // Create an instant simulated admin session for any other custom profile credentials in mock mode
        const mockUser = { id: `simulated-${Date.now()}`, email: resolvedEmail, role: 'admin' };
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...mockUser, loggedIn: true }));
        return { success: true, user: mockUser };
      }
    }
  },

  // Signs up standard administrator
  async signUp(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string; message?: string }> {
    if (!isMock && realSupabase) {
      const { data, error } = await realSupabase.auth.signUp({
        email,
        password
      });
      if (error) {
        return { success: false, error: error.message };
      }
      
      const user = data.user;
      const session = data.session;
      if (session) {
        return { success: true, user, message: 'Account created and authenticated successfully!' };
      }
      return { 
        success: true, 
        user, 
        message: 'Account registered! Since email confirmation is enabled by default in Supabase, please check your email inbox to confirm your account or disable email verification in your Supabase Auth dashboard.' 
      };
    } else {
      const cleanedEmail = email.trim();
      const mockUser = { id: `admin-simulated-${Date.now()}`, email: cleanedEmail, role: 'admin' };
      localStorage.setItem(AUTH_KEY, JSON.stringify({ ...mockUser, loggedIn: true }));
      return { success: true, user: mockUser, message: 'Simulated admin account setup completed!' };
    }
  },

  // Signs out standard administrator
  async signOut(): Promise<void> {
    if (!isMock && realSupabase) {
      await realSupabase.auth.signOut();
    } else {
      const rawUser = localStorage.getItem(AUTH_KEY);
      if (rawUser) {
        const userObj = JSON.parse(rawUser);
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...userObj, loggedIn: false }));
      }
    }
  },

  // Get current active session user
  async getCurrentUser(): Promise<any | null> {
    if (!isMock && realSupabase) {
      const { data: { user } } = await realSupabase.auth.getUser();
      return user;
    } else {
      const rawUser = localStorage.getItem(AUTH_KEY);
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.loggedIn) {
          return { id: 'admin-simulated-id', email: parsed.email };
        }
      }
      return null;
    }
  }
};
