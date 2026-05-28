/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "./firebase-applet-config.json";

// Detect if we have a real Firebase configuration
const isConfigured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "");

export const isFirebaseActive = isConfigured;

let app: any = null;
export let db: any = null;
export let auth: any = null;
export let storage: any = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log("Firebase initialized successfully inside the container.");
  } catch (error) {
    console.error("Firebase SDK failed to initialize with provided config:", error);
  }
} else {
  console.log("Using Local Storage Dual-Mode Engine (Waiting for Firebase Setup UI completion).");
}
