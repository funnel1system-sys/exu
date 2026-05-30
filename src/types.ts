/**
 * Typographies and interfaces for the DC Pass Portal
 */

export interface DCPass {
  id: string;
  dc_number: string;
  vehicle_number: string;
  driver_name: string;
  driver_mobile: string;
  license_number: string;
  mineral_name: string;
  net_weight: string; // net weight can be in string/number format, keeping as string to handle details easily
  concession_holder: string;
  source_place: string;
  destination: string;
  journey_start: string; // Journey Start datetime string
  journey_end: string;   // Journey End datetime string
  route_name: string;
  transporter_name: string;
  buyer_mobile: string;
  pan_gstin: string;
  gps_details: string;
  royalty_issued?: string;
  duration?: string;
  checkpost?: string;
  purchaser_name?: string;
  distance?: string;
  pdf_url?: string;
  pdf_base64?: string;
  created_at: string;
  status: 'active' | 'pending' | 'expired';
}

export type ViewType = 'dashboard' | 'create-pass' | 'all-passes' | 'public-verify';
