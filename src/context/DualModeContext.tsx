/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { auth, db, isFirebaseActive } from "../firebase";
import { UserProfile, DCPass, AuditLog, PassStatus, UserRole, OperationType, FirestoreErrorInfo } from "../types";

interface DualModeContextType {
  firebaseActive: boolean;
  user: UserProfile | null;
  loading: boolean;
  passes: DCPass[];
  logs: AuditLog[];
  users: UserProfile[];
  signUp: (email: string, password: string, displayName: string, role: UserRole, department?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  createPass: (pass: Omit<DCPass, "id" | "uploadedBy" | "uploaderEmail" | "createdAt" | "updatedAt" | "verifiedCount">) => Promise<DCPass>;
  updatePassStatus: (passId: string, status: PassStatus, notes?: string) => Promise<void>;
  editPassData: (passId: string, updatedData: Partial<DCPass>) => Promise<void>;
  deletePass: (passId: string) => Promise<void>;
  verifyPassStatus: (passId: string) => Promise<DCPass | null>;
  updateUserRole: (uid: string, newRole: UserRole) => Promise<void>;
  addSystemLog: (action: AuditLog["action"], passId: string | undefined, details: string) => Promise<void>;
}

const DualModeContext = createContext<DualModeContextType | undefined>(undefined);

// Helper to standardise and format Firestore error JSON according to security constraints
function formatFirestoreError(error: any, operationType: OperationType, path: string | null): Error {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error("Firestore Error Block Triggered:", JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

export const DualModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Real-time Collections
  const [passes, setPasses] = useState<DCPass[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Local Storage Database implementation for fallback mode
  const getLocalDB = () => {
    const rawUsers = localStorage.getItem("local_users");
    const rawPasses = localStorage.getItem("local_passes");
    const rawLogs = localStorage.getItem("local_logs");

    let finalUsers: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [];
    let finalPasses: DCPass[] = rawPasses ? JSON.parse(rawPasses) : [];
    let finalLogs: AuditLog[] = rawLogs ? JSON.parse(rawLogs) : [];

    // Seed data if empty
    if (finalUsers.length === 0) {
      finalUsers = [
        {
          uid: "bootstrap-admin",
          email: "funnel1system@gmail.com",
          displayName: "Official Administrator",
          role: "admin",
          department: "Office of the District Commissioner",
          createdAt: new Date("2026-05-15").toISOString()
        },
        {
          uid: "sample-user",
          email: "user@example.com",
          displayName: "Sarah Jenkins",
          role: "user",
          department: "Health Logistics Division",
          createdAt: new Date("2026-05-20").toISOString()
        }
      ];
      localStorage.setItem("local_users", JSON.stringify(finalUsers));
    }

    if (finalPasses.length === 0) {
      finalPasses = [
        {
          id: "verify-stql14010368060001000600",
          passNumber: "STQL14010368060001000600",
          holderName: "Gujarat Minerals",
          vehicleNumber: "GJ04AT7674",
          route: "NH 48",
          department: "COMMISSIONER OF GEOLOGY AND MINING",
          issueDate: "2026-04-01",
          expiryDate: "2026-04-02",
          status: "Approved",
          uploadedBy: "sample-user",
          uploaderEmail: "user@example.com",
          notes: "Auto-approved mineral transit pass under industries safety codes.",
          qrCode: `${window.location.origin}/verify/verify-stql14010368060001000600`,
          verifiedCount: 12,
          createdAt: new Date("2026-04-01T18:55:49Z").toISOString(),
          updatedAt: new Date("2026-04-01T18:58:21Z").toISOString(),

          // Gujarat e-Pass compliance details
          royaltyIssuedOn: "01/04/2026 06:58:21 PM",
          carrierType: "Goods Carrier(HGV)",
          mineralName: "Quartz (16-30 Mesh)",
          netWeight: "24.20",
          netWeightWords: "Twenty Four point Two Zero Zero",
          concessionHolder: "Gujarat Minerals",
          sourcePlace: "422 RABBANI MOHALLA, VEJALPUR ROAD, OPP WATER TANK, GODHRA-389001",
          purchaserName: "D Y MINCHEM",
          destinationAddress: "VAPI",
          distance: "345 Km",
          journeyStart: "01/04/2026 06:55:49 PM",
          journeyEnd: "02/04/2026 08:28:49 AM",
          routeName: "NH 48",
          duration: "0 Day(s) 13 Hour(s) 33 Min",
          checkpost: "Godhra Bypass Checkpost",
          driverName: "TAHIR BHAI",
          driverLicense: "GJ1720070001281",
          driverMobile: "9998757522",
          panGst: "AAIFG0837H / 24AAIFG0837H1ZL",
          gpsDetails: "wastoo / WastooWHEELSEYE / Prithivi-140+ OBD Can Feature",
          transporterName: "SELF",
          buyerMobile: "9999999999"
        },
        {
          id: "verify-stql14010368060001000789",
          passNumber: "STQL14010368060001000789",
          holderName: "Narmada Alloys Private Ltd",
          vehicleNumber: "GJ06ZZ4202",
          route: "SH 5",
          department: "COMMISSIONER OF GEOLOGY AND MINING",
          issueDate: "2026-05-28",
          expiryDate: "2026-05-29",
          status: "Pending",
          uploadedBy: "sample-user",
          uploaderEmail: "user@example.com",
          notes: "Extraction review pending for secondary chemical cargo audit.",
          qrCode: `${window.location.origin}/verify/verify-stql14010368060001000789`,
          verifiedCount: 0,
          createdAt: new Date("2026-05-28T07:24:00Z").toISOString(),
          updatedAt: new Date("2026-05-28T07:24:00Z").toISOString(),

          // Gujarat e-Pass compliance details
          royaltyIssuedOn: "28/05/2026 07:35:12 AM",
          carrierType: "Goods Carrier(HGV)",
          mineralName: "Lignite (Industrial Grade)",
          netWeight: "18.50",
          netWeightWords: "Eighteen point Five Zero Zero",
          concessionHolder: "Narmada Alloys Private Ltd",
          sourcePlace: "MINING SECTOR 4, RAJPIPLA, GUJARAT",
          purchaserName: "GUJARAT ALKALIES",
          destinationAddress: "DAHEJ",
          distance: "120 Km",
          journeyStart: "28/05/2026 08:00:00 AM",
          journeyEnd: "29/05/2026 08:00:00 AM",
          routeName: "SH 5",
          duration: "1 Day(s) 0 Hour(s) 0 Min",
          checkpost: "Rajpipla Border Outpost",
          driverName: "KISHORE KUMAR",
          driverLicense: "GJ1620150002844",
          driverMobile: "9876543210",
          panGst: "AABCN9911X / 24AABCN9911X1ZA",
          gpsDetails: "LocoNav OBD Basic Core Series Tracker",
          transporterName: "NARMADA LOGISTICS",
          buyerMobile: "9911223344"
        }
      ];
      localStorage.setItem("local_passes", JSON.stringify(finalPasses));
    }

    if (finalLogs.length === 0) {
      finalLogs = [
        {
          id: "log-1",
          passId: "verify-dcp-400827",
          action: "CREATE",
          actorUid: "sample-user",
          actorEmail: "user@example.com",
          details: "Uploaded and auto-scanned DC Pass PDF (sarah_jenkins_pass.pdf).",
          timestamp: new Date("2026-05-20T10:00:00Z").toISOString()
        },
        {
          id: "log-2",
          passId: "verify-dcp-400827",
          action: "APPROVE",
          actorUid: "bootstrap-admin",
          actorEmail: "funnel1system@gmail.com",
          details: "Approved DC Pass and marked compliance parameters as certified.",
          timestamp: new Date("2026-05-21T14:32:00Z").toISOString()
        }
      ];
      localStorage.setItem("local_logs", JSON.stringify(finalLogs));
    }

    return { users: finalUsers, passes: finalPasses, logs: finalLogs };
  };

  const saveLocalDB = (newUsers: UserProfile[], newPasses: DCPass[], newLogs: AuditLog[]) => {
    localStorage.setItem("local_users", JSON.stringify(newUsers));
    localStorage.setItem("local_passes", JSON.stringify(newPasses));
    localStorage.setItem("local_logs", JSON.stringify(newLogs));
    setUsers(newUsers);
    setPasses(newPasses);
    setLogs(newLogs);
  };

  // -------------------------------------------------------------
  // Synchronization Engine Initialization
  // -------------------------------------------------------------
  useEffect(() => {
    if (isFirebaseActive && auth && db) {
      console.log("Activating dynamic Firebase Real-Time Listeners...");
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // Sync profile info
          const userDocRef = doc(db, "users", firebaseUser.uid);
          try {
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              setUser(userSnap.data() as UserProfile);
            } else {
              // Standard fallback context for freshly provisioned OAuth accounts
              const systemRole: UserRole = firebaseUser.email === "funnel1system@gmail.com" ? "admin" : "user";
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Authorized User",
                role: systemRole,
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, newProfile);
              setUser(newProfile);
            }
          } catch (e) {
            console.error("Profile synchronization error:", e);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      // passes list listener sync (admins see all, normal see self)
      const unsubPasses = onSnapshot(collection(db, "passes"), (snap) => {
        const passList: DCPass[] = [];
        snap.forEach((docSnap) => {
          passList.push(docSnap.data() as DCPass);
        });
        setPasses(passList);
      }, (err) => {
        formatFirestoreError(err, OperationType.LIST, "passes");
      });

      // audit trail sync
      const unsubLogs = onSnapshot(collection(db, "logs"), (snap) => {
        const logList: AuditLog[] = [];
        snap.forEach((docSnap) => {
          logList.push(docSnap.data() as AuditLog);
        });
        // Sort descending by timestamp
        logList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(logList);
      }, (err) => {
        formatFirestoreError(err, OperationType.LIST, "logs");
      });

      // users administration sync (only readable for admins)
      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const userList: UserProfile[] = [];
        snap.forEach((docSnap) => {
          userList.push(docSnap.data() as UserProfile);
        });
        setUsers(userList);
      }, (err) => {
        formatFirestoreError(err, OperationType.LIST, "users");
      });

      return () => {
        unsubscribeAuth();
        unsubPasses();
        unsubLogs();
        unsubUsers();
      };
    } else {
      // Local fallbacks setup
      const localData = getLocalDB();
      setUsers(localData.users);
      setPasses(localData.passes);
      setLogs(localData.logs);

      // Check for current user session mock
      const storedSession = localStorage.getItem("dc_pass_session");
      if (storedSession) {
        const activeProfile = localData.users.find(u => u.uid === storedSession);
        if (activeProfile) {
          setUser(activeProfile);
        }
      }
      setLoading(false);
    }
  }, [isFirebaseActive]);

  // -------------------------------------------------------------
  // Authentication Actions
  // -------------------------------------------------------------
  const signUp = async (email: string, password: string, displayName: string, role: UserRole, department?: string) => {
    if (isFirebaseActive && auth && db) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const systemRole: UserRole = email === "funnel1system@gmail.com" ? "admin" : role;
        const newProfile: UserProfile = {
          uid: userCred.user.uid,
          email,
          displayName,
          role: systemRole,
          department,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", userCred.user.uid), newProfile);
        setUser(newProfile);
        await addSystemLog("REGISTER", undefined, `New user registration: ${email} as ${systemRole}`);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : String(err));
      }
    } else {
      // Offline fallback profile creation
      const local = getLocalDB();
      if (local.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Local user account already registered with this email.");
      }
      const newUid = "uid-" + Math.floor(Math.random() * 1000000);
      const systemRole: UserRole = email === "funnel1system@gmail.com" ? "admin" : role;
      const newProfile: UserProfile = {
        uid: newUid,
        email,
        displayName,
        role: systemRole,
        department,
        createdAt: new Date().toISOString()
      };
      
      const nextUsers = [...local.users, newProfile];
      const mockLog: AuditLog = {
        id: "log-" + Date.now(),
        action: "REGISTER",
        details: `Offline fallback user registry: ${email} with privileges: ${systemRole}`,
        timestamp: new Date().toISOString()
      };
      saveLocalDB(nextUsers, local.passes, [...local.logs, mockLog]);
      setUser(newProfile);
      localStorage.setItem("dc_pass_session", newUid);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (isFirebaseActive && auth) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        // User profile will be fetched automatically via onAuthStateChanged observer
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : String(err));
      }
    } else {
      const local = getLocalDB();
      const matched = local.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        throw new Error("Invalid credential profile identifier. (Tips: Registered credentials: `funnel1system@gmail.com` and `user@example.com`) ");
      }
      // Set local session
      setUser(matched);
      localStorage.setItem("dc_pass_session", matched.uid);
    }
  };

  const signOut = async () => {
    if (isFirebaseActive && auth) {
      try {
        await firebaseSignOut(auth);
        setUser(null);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : String(err));
      }
    } else {
      setUser(null);
      localStorage.removeItem("dc_pass_session");
    }
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseActive && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : String(err));
      }
    } else {
      const local = getLocalDB();
      const matched = local.users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        throw new Error("No account identified under this email registry.");
      }
      // Simulate password reset notification block
      alert(`[Offline Mock System] A visual password override link was successfully dispatched to: ${email}`);
    }
  };

  // -------------------------------------------------------------
  // Passes Core Actions
  // -------------------------------------------------------------
  const createPass = async (passData: Omit<DCPass, "id" | "uploadedBy" | "uploaderEmail" | "createdAt" | "updatedAt" | "verifiedCount">) => {
    if (!user) throw new Error("Authentication mandatory prior to upload operations.");
    
    // Unique identifier build
    const simpleId = "verify-" + passData.passNumber.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const todayStr = new Date().toISOString();

    const fullPass: DCPass = {
      ...passData,
      id: simpleId,
      uploadedBy: user.uid,
      uploaderEmail: user.email,
      status: (passData as any).status || "Pending", // support custom initial status
      verifiedCount: 0,
      qrCode: `${window.location.origin}/verify/${simpleId}`,
      createdAt: todayStr,
      updatedAt: todayStr
    };

    if (isFirebaseActive && db) {
      const passDocRef = doc(db, "passes", simpleId);
      try {
        await setDoc(passDocRef, fullPass);
        await addSystemLog("CREATE", simpleId, `Uploaded DC Pass #${fullPass.passNumber} for Compliance Audit.`);
        return fullPass;
      } catch (err) {
        throw formatFirestoreError(err, OperationType.WRITE, `passes/${simpleId}`);
      }
    } else {
      const local = getLocalDB();
      if (local.passes.some(p => p.passNumber.toLowerCase() === passData.passNumber.toLowerCase())) {
        throw new Error(`Pass registration error: DC Pass serial #${passData.passNumber} already entered in system.`);
      }

      const nextPasses = [...local.passes, fullPass];
      const nextLogs = [
        ...local.logs,
        {
          id: "log-" + Date.now(),
          passId: simpleId,
          action: "CREATE" as const,
          actorUid: user.uid,
          actorEmail: user.email,
          details: `Uploaded DC Pass #${fullPass.passNumber} (Fallback Local Host).`,
          timestamp: todayStr
        }
      ];
      saveLocalDB(local.users, nextPasses, nextLogs);
      return fullPass;
    }
  };

  const updatePassStatus = async (passId: string, status: PassStatus, notes?: string) => {
    if (!user || user.role !== "admin") throw new Error("Administrative level required to evaluate pass requests.");
    
    const todayStr = new Date().toISOString();

    if (isFirebaseActive && db) {
      const passDocRef = doc(db, "passes", passId);
      try {
        const updatePayload: Partial<DCPass> = { status, updatedAt: todayStr };
        if (notes !== undefined) updatePayload.notes = notes;
        
        await updateDoc(passDocRef, updatePayload);
        const act: AuditLog["action"] = status === "Approved" ? "APPROVE" : "REJECT";
        await addSystemLog(act, passId, `Pass status modified to [${status}] by admin. Notes: ${notes || "None"}`);
      } catch (err) {
        throw formatFirestoreError(err, OperationType.WRITE, `passes/${passId}`);
      }
    } else {
      const local = getLocalDB();
      const nextPasses = local.passes.map((p) => {
        if (p.id === passId) {
          return { ...p, status, notes: notes || p.notes, updatedAt: todayStr };
        }
        return p;
      });
      const act: AuditLog["action"] = status === "Approved" ? "APPROVE" : "REJECT";
      const nextLogs = [
        ...local.logs,
        {
          id: "log-" + Date.now(),
          passId,
          action: act,
          actorUid: user.uid,
          actorEmail: user.email,
          details: `Pass check assessed. Decision: [${status}] by Office Admin. Feed: ${notes || "None"}`,
          timestamp: todayStr
        }
      ];
      saveLocalDB(local.users, nextPasses, nextLogs);
    }
  };

  const editPassData = async (passId: string, updatedFields: Partial<DCPass>) => {
    if (!user) throw new Error("Administrative authorization verification check mandatory.");
    
    const todayStr = new Date().toISOString();

    if (isFirebaseActive && db) {
      const passDocRef = doc(db, "passes", passId);
      try {
        const payload = { ...updatedFields, updatedAt: todayStr };
        await updateDoc(passDocRef, payload);
        await addSystemLog("EDIT", passId, `Fields modified. Audit modifications details: ${JSON.stringify(updatedFields)}`);
      } catch (err) {
        throw formatFirestoreError(err, OperationType.WRITE, `passes/${passId}`);
      }
    } else {
      const local = getLocalDB();
      const nextPasses = local.passes.map((p) => {
        if (p.id === passId) {
          return { ...p, ...updatedFields, updatedAt: todayStr };
        }
        return p;
      });
      const nextLogs = [
        ...local.logs,
        {
          id: "log-" + Date.now(),
          passId,
          action: "EDIT" as const,
          actorUid: user?.uid,
          actorEmail: user?.email,
          details: `Direct edits executed on credential pass. Context: ${JSON.stringify(updatedFields)}`,
          timestamp: todayStr
        }
      ];
      saveLocalDB(local.users, nextPasses, nextLogs);
    }
  };

  const deletePass = async (passId: string) => {
    if (!user || user.role !== "admin") throw new Error("Administrative clearance necessary to perform record deletion.");
    
    if (isFirebaseActive && db) {
      const passDocRef = doc(db, "passes", passId);
      try {
        await deleteDoc(passDocRef);
        await addSystemLog("DELETE", passId, `Removed pass serialization record: ${passId}`);
      } catch (err) {
        throw formatFirestoreError(err, OperationType.DELETE, `passes/${passId}`);
      }
    } else {
      const local = getLocalDB();
      const nextPasses = local.passes.filter(p => p.id !== passId);
      const nextLogs = [
        ...local.logs,
        {
          id: "log-" + Date.now(),
          passId,
          action: "DELETE" as const,
          actorUid: user.uid,
          actorEmail: user.email,
          details: `Permanently expunged record mapping from local dashboard database: ${passId}`,
          timestamp: new Date().toISOString()
        }
      ];
      saveLocalDB(local.users, nextPasses, nextLogs);
    }
  };

  const verifyPassStatus = async (passId: string) => {
    // Normalise ID to lookup both direct ID, simple formatting, and raw passNumber
    const lookupIds = [
      passId,
      "verify-" + passId.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      passId.toLowerCase()
    ];

    if (isFirebaseActive && db) {
      try {
        let foundPass: DCPass | null = null;
        let matchedId = "";
        
        // 1. Try direct identifiers
        for (const lid of lookupIds) {
          const snap = await getDoc(doc(db, "passes", lid));
          if (snap.exists()) {
            foundPass = snap.data() as DCPass;
            matchedId = lid;
            break;
          }
        }

        // 2. Query fallback (by passNumber field)
        if (!foundPass) {
          const q = query(collection(db, "passes"), where("passNumber", "==", passId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            foundPass = snap.docs[0].data() as DCPass;
            matchedId = foundPass.id;
          }
        }

        if (foundPass && matchedId) {
          const currentCount = foundPass.verifiedCount || 0;
          await updateDoc(doc(db, "passes", matchedId), { verifiedCount: currentCount + 1 });
          await addSystemLog("VERIFY", matchedId, `Credential verify hit recorded publicly.`);
          return { ...foundPass, verifiedCount: currentCount + 1 };
        }
        return null;
      } catch (err) {
        throw formatFirestoreError(err, OperationType.GET, `passes/${passId}`);
      }
    } else {
      const local = getLocalDB();
      let matchedPass: DCPass | null = null;
      const normalizedIds = lookupIds.map(id => id.toLowerCase());

      const nextPasses = local.passes.map((p) => {
        const isMatched = normalizedIds.includes(p.id.toLowerCase()) || 
                          p.passNumber.toLowerCase() === passId.toLowerCase();
                          
        if (isMatched && !matchedPass) {
          matchedPass = { ...p, verifiedCount: (p.verifiedCount || 0) + 1 };
          return matchedPass;
        }
        return p;
      });

      if (matchedPass) {
        const pId = (matchedPass as DCPass).id;
        const nextLogs = [
          ...local.logs,
          {
            id: "log-" + Date.now(),
            passId: pId,
            action: "VERIFY" as const,
            details: `Secure check lookup on Pass serial #${(matchedPass as DCPass).passNumber}. Verified scan total: ${(matchedPass as DCPass).verifiedCount}`,
            timestamp: new Date().toISOString()
          }
        ];
        saveLocalDB(local.users, nextPasses, nextLogs);
        return matchedPass;
      }
      return null;
    }
  };

  const updateUserRole = async (targetUid: string, newRole: UserRole) => {
    if (!user || user.role !== "admin") throw new Error("Administrative security clearance only.");
    
    if (isFirebaseActive && db) {
      const userDocRef = doc(db, "users", targetUid);
      try {
        await updateDoc(userDocRef, { role: newRole });
        await addSystemLog("EDIT", undefined, `Modified User UID: ${targetUid} clearance index mapping to: ${newRole}`);
      } catch (err) {
        throw formatFirestoreError(err, OperationType.WRITE, `users/${targetUid}`);
      }
    } else {
      const local = getLocalDB();
      const nextUsers = local.users.map((u) => {
        if (u.uid === targetUid) {
          return { ...u, role: newRole };
        }
        return u;
      });
      const nextLogs = [
        ...local.logs,
        {
          id: "log-" + Date.now(),
          action: "EDIT" as const,
          actorUid: user.uid,
          actorEmail: user.email,
          details: `Modified User: [${targetUid}] authentication role level to: ${newRole}`,
          timestamp: new Date().toISOString()
        }
      ];
      saveLocalDB(nextUsers, local.passes, nextLogs);
    }
  };

  const addSystemLog = async (action: AuditLog["action"], passId: string | undefined, details: string) => {
    const timestampStr = new Date().toISOString();
    const mockLog: AuditLog = {
      id: "log-" + Math.floor(Math.random() * 1000000),
      passId,
      action,
      actorUid: user?.uid || "public-agent",
      actorEmail: user?.email || "anonymous-verify",
      details,
      timestamp: timestampStr
    };

    if (isFirebaseActive && db) {
      try {
        await addDoc(collection(db, "logs"), mockLog);
      } catch (err) {
        // Fallback trace logging to console so rules testing output logs stay transparent
        console.warn("Silent failure writing log to server db:", err);
      }
    } else {
      const local = getLocalDB();
      const nextLogs = [...local.logs, mockLog];
      nextLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      saveLocalDB(local.users, local.passes, nextLogs);
    }
  };

  return (
    <DualModeContext.Provider
      value={{
        firebaseActive: isFirebaseActive,
        user,
        loading,
        passes: passes.filter(p => user && (user.role === "admin" || p.uploadedBy === user.uid)),
        logs,
        users,
        signUp,
        signIn,
        signOut,
        resetPassword,
        createPass,
        updatePassStatus,
        editPassData,
        deletePass,
        verifyPassStatus,
        updateUserRole,
        addSystemLog
      }}
    >
      {children}
    </DualModeContext.Provider>
  );
};

export const useDualMode = () => {
  const context = useContext(DualModeContext);
  if (context === undefined) {
    throw new Error("useDualMode hooks must be mounted within a corresponding Provider wrapper.");
  }
  return context;
};
