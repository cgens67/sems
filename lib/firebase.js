import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAxu9N_CtWYo0zqHekQKCNV6KNI50MTe1M",
  authDomain: "sems-chs.firebaseapp.com",
  projectId: "sems-chs",
  storageBucket: "sems-chs.firebasestorage.app",
  messagingSenderId: "231495326541",
  appId: "1:231495326541:web:11f7a50d912694312e3504",
};

// Prevent re-initializing in Next.js during SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;