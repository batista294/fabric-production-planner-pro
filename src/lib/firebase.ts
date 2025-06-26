
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBTaeqbH5XgjwuXM-s6tyzdhfqJ1tdLRRs",
  authDomain: "planeja-ec7ed.firebaseapp.com",
  projectId: "planeja-ec7ed",
  storageBucket: "planeja-ec7ed.firebasestorage.app",
  messagingSenderId: "902412192203",
  appId: "1:902412192203:web:c6150b7db13b3817198e4e",
  measurementId: "G-KR2CE1Z7XY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
