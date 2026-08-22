import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

// This file is expected to be created by the set_up_firebase tool
import firebaseConfig from "../../firebase-applet-config.json";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "polycrow-32b7e";
const appFirebaseConfig = {
  ...firebaseConfig,
  projectId,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  ...(import.meta.env.VITE_FIREBASE_APP_ID ? { appId: import.meta.env.VITE_FIREBASE_APP_ID } : {}),
  ...(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? { messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID } : {}),
  ...(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? { storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET } : {}),
};

export const firebaseAvailable = Boolean(appFirebaseConfig.apiKey);

const app: FirebaseApp | null = firebaseAvailable ? initializeApp(appFirebaseConfig) : null;
export const db = app ? getFirestore(app) : (null as unknown as Firestore);
export const auth = app ? getAuth(app) : (null as unknown as Auth);

async function testConnection() {
  if (!firebaseAvailable) return;

  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connected successfully");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Firebase is offline. Check configuration.");
    }
  }
}

testConnection();
