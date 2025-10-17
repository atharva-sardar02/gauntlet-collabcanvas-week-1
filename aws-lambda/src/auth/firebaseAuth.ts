import * as admin from 'firebase-admin';

/**
 * Firebase Authentication
 * Verifies Firebase ID tokens sent from the frontend
 */

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'collabcanvas-f7ee2',
  });
}

export interface AuthUser {
  uid: string;
  email?: string;
}

/**
 * Verify Firebase ID token
 * @param token - Firebase ID token from Authorization header
 * @returns User information (uid, email)
 * @throws Error if token is invalid or expired
 */
export async function verifyFirebaseToken(token: string): Promise<AuthUser> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error: any) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error('Unauthorized: Invalid or expired Firebase token');
  }
}


