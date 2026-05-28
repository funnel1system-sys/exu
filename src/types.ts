/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "user" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  department?: string;
  createdAt: string;
}

export type PassStatus = "Pending" | "Approved" | "Rejected";

export interface DCPass {
  id: string; // Document ID (pass status verification string)
  passNumber: string;
  holderName: string;
  vehicleNumber?: string;
  route?: string;
  department?: string;
  issueDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  status: PassStatus;
  pdfUrl?: string; // file URL or download location
  pdfBase64?: string; // stored base64 attachment
  pdfFileName?: string; // original uploaded file name
  uploadedBy: string; // User UID
  uploaderEmail?: string;
  notes?: string;
  qrCode?: string; // verification text or URL
  verifiedCount?: number;
  createdAt: string;
  updatedAt: string;

  // Gujarat e-Pass compliance details
  royaltyIssuedOn?: string;
  carrierType?: string;
  mineralName?: string;
  netWeight?: string;
  netWeightWords?: string;
  concessionHolder?: string;
  sourcePlace?: string;
  purchaserName?: string;
  destinationAddress?: string;
  distance?: string;
  journeyStart?: string;
  journeyEnd?: string;
  routeName?: string;
  duration?: string;
  checkpost?: string;
  driverName?: string;
  driverLicense?: string;
  driverMobile?: string;
  panGst?: string;
  gpsDetails?: string;
  transporterName?: string;
  buyerMobile?: string;
}

export interface AuditLog {
  id: string;
  passId?: string;
  action: "CREATE" | "APPROVE" | "REJECT" | "EDIT" | "DELETE" | "VERIFY" | "REGISTER";
  actorUid?: string;
  actorEmail?: string;
  details: string;
  timestamp: string;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
