import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';

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

let db: Firestore;

if (getApps().length === 0) {
    const app = initializeApp(firebaseConfig);
    // Firebase v12: Use persistentLocalCache for offline data caching
    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });
        console.log('[Firebase] ✅ Firestore initialized with persistent cache');
    } catch {
        // If persistent cache fails (e.g. some browsers), fallback to default
        db = getFirestore(app);
        console.log('[Firebase] Firestore initialized with default cache');
    }
} else {
    db = getFirestore(getApps()[0]);
}

export { db };
