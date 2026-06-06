import * as admin from "firebase-admin";

export let isFirebaseAdminConfigured = false;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    isFirebaseAdminConfigured = true;
    return admin.app();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey || serviceAccountKey.includes("...")) {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is missing or contains placeholders. Firebase Admin features will be disabled.");
    isFirebaseAdminConfigured = false;
    return null;
  }

  try {
    const cleanKey = serviceAccountKey.trim().replace(/^'|'$/g, "");
    const serviceAccount = JSON.parse(cleanKey);

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    isFirebaseAdminConfigured = true;
    return app;
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", error);
    isFirebaseAdminConfigured = false;
    return null;
  }
}

const app = initializeFirebaseAdmin();

export const adminAuth = app ? admin.auth(app) : null;
export const adminDb = app ? admin.firestore(app) : null;


