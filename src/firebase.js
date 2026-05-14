import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SENING_API_KEY",
  authDomain: "SENING_AUTH_DOMAIN",
  projectId: "SENING_PROJECT_ID",
  storageBucket: "SENING_STORAGE_BUCKET",
  messagingSenderId: "SENING_MESSAGING_ID",
  appId: "SENING_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);