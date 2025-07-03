
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC7KJHR8vd9t_7wFkua1MydvWBqFhYP6_U",
  authDomain: "controle-de-producao-7575f.firebaseapp.com",
  projectId: "controle-de-producao-7575f",
  storageBucket: "controle-de-producao-7575f.firebasestorage.app",
  messagingSenderId: "490088477536",
  appId: "1:490088477536:web:d0f759ba173f7efb7de405",
  measurementId: "G-P8TM2Y4RL7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
