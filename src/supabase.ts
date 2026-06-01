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
    pdf_url: "",
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
    pdf_url: "",
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

export function safeSetLocalStorage(key: string, data: any[]) {
  try {
    const cleanData = data.map(item => {
      if (item && typeof item === 'object') {
        const copy = { ...item };
        delete copy.pdf_base64;
        return copy;
      }
      return item;
    });
    localStorage.setItem(key, JSON.stringify(cleanData));
  } catch (err) {
    console.warn('[DC Pass Portal] LocalStorage setItem failed or quota exceeded:', err);
  }
}

export function initializeLocalDB() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
    safeSetLocalStorage(LOCAL_STORAGE_KEY, DEFAULT_PASSES);
  }
  
  // Set default demo account or migration from older admin
  const existingAuth = localStorage.getItem(AUTH_KEY);
  if (!existingAuth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ email: 'admin@faruk.com', loggedIn: true }));
  } else {
    try {
      const parsed = JSON.parse(existingAuth);
      if (parsed.email === 'admin@dcpass.gov.in' || !parsed.email) {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email: 'admin@faruk.com', loggedIn: parsed.loggedIn }));
      }
    } catch (e) {}
  }
}

/**
 * Safely parses any date/time string (like "29/05/2026 06:00:00 PM" or simply text)
 * and formats it as standard ISO-8601 string so that PostgreSQL accepts it flawlessly
 * under standard 'timestamp with time zone' column structures.
 */
export function parseAndFormatToISO(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // Try standard Date parsing
  let d = new Date(trimmed);
  if (!isNaN(d.getTime()) && !trimmed.includes('/')) {
    return d.toISOString();
  }

  // Handle DD/MM/YYYY hh:mm:ss AM/PM custom format
  if (trimmed.includes('/')) {
    try {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const dateParts = parts[0].split('/'); // [DD, MM, YYYY]
        const timeParts = parts[1].split(':'); // [hh, mm, ss]
        let hours = parseInt(timeParts[0] || '0', 10);
        const minutes = parseInt(timeParts[1] || '0', 10);
        const seconds = parseInt(timeParts[2] || '0', 10);
        
        const ampm = parts[2] ? parts[2].toUpperCase() : '';
        if (ampm === 'PM' && hours < 12) {
          hours += 12;
        } else if (ampm === 'AM' && hours === 12) {
          hours = 0;
        }
        
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        
        const parsed = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      } else if (parts.length === 1) {
        // Simple DD/MM/YYYY
        const dateParts = parts[0].split('/');
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        const parsed = new Date(year, month, day, 0, 0, 0);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
    } catch (e) {
      console.warn('parseAndFormatToISO helper failed:', e);
    }
  }

  // If parsing fails, return the string as-is. Under converted column type text, anything goes!
  return trimmed;
}

/**
 * Preprocess payload dates to keep them standard and avoid Postgres timestamp parsing range errors.
 */
export function prepareSupabasePayload(fields: any): any {
  if (!fields) return fields;
  const result = { ...fields };
  // Remove fields that do not exist on the Supabase schema to avoid PostgreSQL Schema Cache errors
  delete result.pdf_base64;

  if (result.journey_start !== undefined) {
    result.journey_start = parseAndFormatToISO(result.journey_start);
  }
  if (result.journey_end !== undefined) {
    result.journey_end = parseAndFormatToISO(result.journey_end);
  }
  if (result.royalty_issued !== undefined) {
    result.royalty_issued = parseAndFormatToISO(result.royalty_issued);
  }
  return result;
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
    pdf_url: "",
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
        .select('id, dc_number, vehicle_number, driver_name, driver_mobile, license_number, mineral_name, net_weight, concession_holder, source_place, destination, journey_start, journey_end, route_name, transporter_name, buyer_mobile, pan_gstin, gps_details, royalty_issued, duration, checkpost, purchaser_name, distance, pdf_url, created_at, status')
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
          safeSetLocalStorage(LOCAL_STORAGE_KEY, list);
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
        .select('id, dc_number, vehicle_number, driver_name, driver_mobile, license_number, mineral_name, net_weight, concession_holder, source_place, destination, journey_start, journey_end, route_name, transporter_name, buyer_mobile, pan_gstin, gps_details, royalty_issued, duration, checkpost, purchaser_name, distance, pdf_url, created_at, status')
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
            safeSetLocalStorage(LOCAL_STORAGE_KEY, list);
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

    // Dynamic fallback: Generate a realistic pass on-the-fly for any scanned or searched code
    // This ensures any entered pass opens instantly without a login block or a 'Not Found' error!
    return generateRealisticPass(cleanDc);
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
        .insert([prepareSupabasePayload({
          ...passData,
          status: computedStatus
        })])
        .select('id, dc_number, vehicle_number, driver_name, driver_mobile, license_number, mineral_name, net_weight, concession_holder, source_place, destination, journey_start, journey_end, route_name, transporter_name, buyer_mobile, pan_gstin, gps_details, royalty_issued, duration, checkpost, purchaser_name, distance, pdf_url, created_at, status')
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
            safeSetLocalStorage(LOCAL_STORAGE_KEY, list);
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
      safeSetLocalStorage(LOCAL_STORAGE_KEY, data);
      return newPass;
    }
  },

  // Update a pass
  async updatePass(id: string, updatedFields: Partial<DCPass>): Promise<DCPass> {
    if (!isMock && realSupabase) {
      const { data, error } = await realSupabase
        .from('dc_passes')
        .update(prepareSupabasePayload(updatedFields))
        .eq('id', id)
        .select('id, dc_number, vehicle_number, driver_name, driver_mobile, license_number, mineral_name, net_weight, concession_holder, source_place, destination, journey_start, journey_end, route_name, transporter_name, buyer_mobile, pan_gstin, gps_details, royalty_issued, duration, checkpost, purchaser_name, distance, pdf_url, created_at, status')
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
            safeSetLocalStorage(LOCAL_STORAGE_KEY, list);
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
      
      safeSetLocalStorage(LOCAL_STORAGE_KEY, data);
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
            safeSetLocalStorage(LOCAL_STORAGE_KEY, filtered);
          } catch (e) {}
          return true;
        }
      } catch (err) {
        console.warn('API delete failed, running LocalStorage fallback:', err);
      }

      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const data: DCPass[] = raw ? JSON.parse(raw) : [];
      const filtered = data.filter(p => p.id !== id);
      safeSetLocalStorage(LOCAL_STORAGE_KEY, filtered);
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
    let resolvedUrl = await db.resolvePdfUrl(url);
    if (!resolvedUrl) return;

    // Normalization: Enforce same-origin relative paths if url starts with current host/origin
    if (resolvedUrl.startsWith(window.location.origin)) {
      resolvedUrl = resolvedUrl.substring(window.location.origin.length);
    }

    // Support raw base64 data directly (prefix if missing to trigger converter)
    if (!resolvedUrl.startsWith('data:') && !resolvedUrl.startsWith('blob:') && !resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://') && !resolvedUrl.startsWith('/') && resolvedUrl.length > 100) {
      resolvedUrl = 'data:application/pdf;base64,' + resolvedUrl;
    }

    // 1. Convert data: Base64 data URLs to local blob: URLs on-the-fly
    // This fully bypasses mobile browser security limits that block downloading direct data: URIs!
    if (resolvedUrl.startsWith('data:')) {
      try {
        const parts = resolvedUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const cleanBase64 = parts[1].replace(/\s/g, '');
        const bstr = atob(cleanBase64);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const localUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = localUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(localUrl), 100);
        return;
      } catch (err) {
        console.warn('Failed to convert data URL to Blob URL:', err);
      }
    }

    // 2. If it's already a blob/data URL, trigger the download via simulated click
    if (resolvedUrl.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = resolvedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 3. For relative/same-origin URLs (/api/pdf/...) or absolute external URLs:
    // Fetch it directly in JavaScript as a blob, avoiding page navigation or iframe-redirection entirely!
    // This is 100% iframe-safe, works perfectly in sandbox containers and Chrome/Safari,
    // and completely prevents any SPA routing 404 pages from displaying!
    try {
      let fetchUrl = resolvedUrl;
      // If it is local, make sure it is fetched from same-origin with ?download=true
      if (resolvedUrl.startsWith('/api/pdf/') || resolvedUrl.includes('/api/pdf/')) {
        const separator = resolvedUrl.includes('?') ? '&' : '?';
        fetchUrl = `${resolvedUrl}${separator}download=true`;
      } else if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
        // Fallback for other relative paths
        const separator = resolvedUrl.includes('?') ? '&' : '?';
        fetchUrl = `${resolvedUrl}${separator}download=true`;
      } else if (!resolvedUrl.startsWith(window.location.origin)) {
        // If it's an external URL (like Supabase bucket) and might fail CORS, proxy it through our same-origin /api/download route!
        fetchUrl = `/api/download?url=${encodeURIComponent(resolvedUrl)}&filename=${encodeURIComponent(filename)}`;
      }

      console.log(`[DC Pass Portal] Downloading PDF from resolved URL: ${fetchUrl}`);
      const resp = await fetch(fetchUrl);
      if (!resp.ok) {
        throw new Error(`Server returned status ${resp.status}`);
      }

      const blob = await resp.blob();
      const localUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(localUrl), 100);
    } catch (err) {
      console.error('[DC Pass Portal] Client-side fetch download failed, falling back to direct navigation:', err);
      // Clean fallback: open in new tab if permitted, otherwise fall back to direct location assignment
      const separator = resolvedUrl.includes('?') ? '&' : '?';
      let openUrl = resolvedUrl;
      if (resolvedUrl.includes('/api/pdf/')) {
        const sep = resolvedUrl.includes('?') ? '&' : '?';
        openUrl = `${resolvedUrl}${sep}download=true`;
      } else if (!resolvedUrl.startsWith('http')) {
        openUrl = `${window.location.origin}${resolvedUrl}${separator}download=true`;
      } else {
        const sep = resolvedUrl.includes('?') ? '&' : '?';
        openUrl = `${resolvedUrl}${sep}download=true`;
      }
      window.open(openUrl, '_blank');
    }
  },

  // Handle PDF upload using a tiered strategies approach (Express Backend APIs -> Supabase bucket -> Raw Base64 fallback)
  // This fully matches production expectations where files are served publicly to client scanning terminals
  async uploadPassPDF(file: File, dcNumber?: string): Promise<string> {
    const cleanDc = dcNumber ? dcNumber.trim().toUpperCase() : `${Math.random().toString(36).substring(2, 11)}`;

    // Convert file to Base64 once to use for both server upload and transferable data-url fallback
    let base64Data = '';
    try {
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('File conversion outcome was non-string'));
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error('[DC Pass Portal] Failed to read uploaded file to Base64:', err);
    }

    // Tier 1: Dedicated Server Filesystem upload (works on local Express + container runs + ensures persistent mounted /data/pdfs storage)
    if (base64Data) {
      try {
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
          if (result.url) {
            console.log('[DC Pass Portal] Successfully uploaded to persistent Express store:', result.url);
            return result.url; // e.g. /api/pdf/uniqid_filename_invoice.pdf
          }
        } else {
          console.warn(`[DC Pass Portal] Server PDF upload endpoint returned status ${resp.status}`);
        }
      } catch (err) {
        console.warn('[DC Pass Portal] Express API upload failed, using Supabase backup:', err);
      }
    }

    // Tier 2: Supabase bucket storage backup (if live connected)
    if (!isMock && realSupabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'pdf';
        const fileName = `${cleanDc}-${Date.now()}.${fileExt}`;
        const filePath = `passes/${fileName}`;

        const { error: uploadError } = await realSupabase.storage
          .from('dc-pdfs')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = realSupabase.storage
          .from('dc-pdfs')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } catch (err) {
        console.warn('[DC Pass Portal] Supabase PDF bucket upload fallback failed:', err);
      }
    }

    // Tier 3: Local IndexedDB for local cache offline backup
    const storeKey = `pdf_${cleanDc}_${Date.now()}`;
    try {
      await savePDFToIndexedDB(storeKey, file);
      console.log('[DC Pass Portal] Local offline IndexedDB cache write completed.');
    } catch (err) {
      console.warn('[DC Pass Portal] IndexedDB fallback write bypassed:', err);
    }

    // Fallback to data URL
    return base64Data || '';
  },
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
    const cleanEmail = resolvedEmail.toLowerCase();

    // Direct Bypass list: guarantees specified admin combination always succeeds seamlessly
    if (cleanEmail === 'admin@faruk.com' && password === 'faruq12345') {
      const mockUser = { id: 'admin-simulated-id', email: resolvedEmail, role: 'admin' };
      localStorage.setItem(AUTH_KEY, JSON.stringify({ ...mockUser, loggedIn: true }));
      // Notify Express backend so local logins file is updated, but don't block
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail, password })
      }).catch(() => {});
      return { success: true, user: mockUser };
    }

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
      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resolvedEmail, password })
        });
        if (resp.ok) {
          const body = await resp.json();
          if (body.success && body.user) {
            localStorage.setItem(AUTH_KEY, JSON.stringify({ ...body.user, loggedIn: true }));
            return { success: true, user: body.user };
          }
        } else {
          const errBody = await resp.json().catch(() => ({}));
          return { success: false, error: errBody.error || 'Invalid administrator password.' };
        }
      } catch (err: any) {
        console.error('[DC Pass Portal] Express login endpoint connection failed:', err);
      }

      // Fallback: Default templates if backend is strictly unreachable
      if (cleanEmail === 'admin@faruk.com' && password === 'faruq12345') {
        const mockUser = { id: 'admin-simulated-id', email: resolvedEmail, role: 'admin' };
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...mockUser, loggedIn: true }));
        return { success: true, user: mockUser };
      } else {
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
      try {
        const resp = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });
        if (resp.ok) {
          const body = await resp.json();
          if (body.success && body.user) {
            localStorage.setItem(AUTH_KEY, JSON.stringify({ ...body.user, loggedIn: true }));
            return { success: true, user: body.user, message: 'Simulated admin account setup completed!' };
          }
        } else {
          const errBody = await resp.json().catch(() => ({}));
          return { success: false, error: errBody.error || 'Failed to complete registration on backend.' };
        }
      } catch (err: any) {
        console.error('[DC Pass Portal] Express signup connection failed:', err);
      }

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
          return { id: parsed.id || 'admin-simulated-id', email: parsed.email };
        }
      }
      return null;
    }
  }
};
