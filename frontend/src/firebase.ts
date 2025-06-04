import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDn5xunNkfspMTq0yF5n9PxRNY1GC1mCnw",
  authDomain: "zenith-assistant-user.firebaseapp.com",
  projectId: "zenith-assistant-user",
  storageBucket: "zenith-assistant-user.firebasestorage.app",
  messagingSenderId: "225635589056",
  appId: "1:225635589056:web:f1dcc8d964a208db93c625"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);