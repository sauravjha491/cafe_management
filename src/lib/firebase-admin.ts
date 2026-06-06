import * as admin from "firebase-admin";

export let isFirebaseAdminConfigured = false;

function initializeFirebaseAdmin() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // 1. Initial check for missing or placeholder key
  if (!serviceAccountKey || serviceAccountKey.includes("...") || serviceAccountKey.length < 50) {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid. Firebase Admin features will be disabled.");
    isFirebaseAdminConfigured = false;
    return null;
  }

  try {
    const cleanKey = serviceAccountKey.trim().replace(/^'|'$/g, "");
    const serviceAccount = JSON.parse(cleanKey);

    // 2. Strict validation of the private key content
    if (!serviceAccount.private_key || 
        serviceAccount.private_key.includes("...") || 
        serviceAccount.private_key.length < 100) {
      console.warn("⚠️ Firebase Private Key is invalid or contains placeholders. Firebase Admin features will be disabled.");
      isFirebaseAdminConfigured = false;
      return null;
    }

    // 3. Initialize or get existing app
    let app;
    if (admin.apps.length > 0) {
      app = admin.app();
    } else {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    isFirebaseAdminConfigured = true;
    return app;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error);
    isFirebaseAdminConfigured = false;
    return null;
  }
}

const app = initializeFirebaseAdmin();

export const adminAuth = app ? admin.auth(app) : null;
export const adminDb = app ? admin.firestore(app) : null;



