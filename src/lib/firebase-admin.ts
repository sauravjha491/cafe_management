import * as admin from "firebase-admin";

export let isFirebaseAdminConfigured = false;

function initializeFirebaseAdmin() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // 1. Initial check for missing or placeholder key
  if (!serviceAccountKey || serviceAccountKey.includes("...") || serviceAccountKey.length < 50) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing in Vercel. Go to Project Settings -> Environment Variables and add it.");
    } else {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid. Firebase Admin features will be disabled.");
    }
    isFirebaseAdminConfigured = false;
    return null;
  }

  try {
    // Handle Vercel's multiline/escaped characters
    const cleanKey = serviceAccountKey.trim()
      .replace(/^'|'$/g, "") // Remove wrapping single quotes if any
      .replace(/^"|"$/g, ""); // Remove wrapping double quotes if any
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(cleanKey);
    } catch (parseError) {
      console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON. Ensure it is a valid JSON string.");
      throw parseError;
    }

    // 2. Fix private key formatting (common Vercel issue where \n is not interpreted)
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    // 3. Strict validation of the private key content
    if (!serviceAccount.private_key || 
        serviceAccount.private_key.includes("...") || 
        serviceAccount.private_key.length < 100) {
      console.warn("⚠️ Firebase Private Key is invalid. Ensure you copied the entire 'private_key' field correctly.");
      isFirebaseAdminConfigured = false;
      return null;
    }

    // 4. Initialize or get existing app
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



