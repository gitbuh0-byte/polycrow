import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

// This file is expected to be created by the set_up_firebase tool
import firebaseConfig from "../../firebase-applet-config.json";

const appFirebaseConfig = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
};

export const firebaseAvailable = Boolean(appFirebaseConfig.apiKey);

const app: FirebaseApp | null = firebaseAvailable ? initializeApp(appFirebaseConfig) : null;
export const db = app ? getFirestore(app, appFirebaseConfig.firestoreDatabaseId) : (null as unknown as Firestore);
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
