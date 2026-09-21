// Royal Chat — Firebase initialization
//
// All values below are read from environment variables so that no
// real credentials are ever committed to the repository. Copy
// `.env.example` to `.env` and fill in the values from your Firebase
// project (Project settings -> General -> Your apps -> Web app).
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Loud, obvious failure instead of a silently broken app — this is the
  // single most common setup mistake (missing/renamed .env file).
  // eslint-disable-next-line no-console
  console.error(
    '[Royal Chat] Firebase config is missing. Copy .env.example to .env ' +
      'and fill in your Firebase web app credentials, then restart the dev server.'
  );
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Keep the user signed in across page reloads / browser restarts.
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Persistence can fail in some private-browsing contexts — the app
  // still works, the user will just need to sign in again next visit.
});
