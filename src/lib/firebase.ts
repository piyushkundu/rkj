import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Log Firebase config to help debug connection issues
console.log('[Firebase] Project ID:', firebaseConfig.projectId);
console.log('[Firebase] Has API Key:', !!firebaseConfig.apiKey);

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Enable offline persistence for faster loads
if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db).then(() => {
        console.log('[Firebase] Offline persistence enabled ✅');
    }).catch((err) => {
        console.warn('[Firebase] Persistence failed:', err.code);
    });
}

export { app, db };
