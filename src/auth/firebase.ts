import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if we have minimum requirements for Firebase config
const hasFirebaseConfig = false; // Forced to false for Electron popup testing

let app;
let auth: Auth | null = null;
let isMockMode = false;

if (hasFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    console.log('[Auth] Firebase Authentication initialized successfully.');
  } catch (error) {
    console.error('[Auth] Failed to initialize Firebase App, falling back to mock mode:', error);
    isMockMode = true;
  }
} else {
  console.warn('[Auth] Missing Firebase credentials in env variables. Running in Mock Mode for local development.');
  isMockMode = true;
}

export { auth, isMockMode };
