import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// This file is expected to be created by the set_up_firebase tool
import firebaseConfig from "../../firebase-applet-config.json";

const appFirebaseConfig = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? firebaseConfig.apiKey,
};

const app = initializeApp(appFirebaseConfig);
export const db = getFirestore(app, appFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

async function testConnection() {
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
