import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Sign up a new user with email, password, and display name
 * @param email - User's email address
 * @param password - User's password
 * @param displayName - User's display name (will be truncated to 20 chars if needed)
 * @returns UserCredential from Firebase
 */
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  try {
    // Truncate display name to 20 characters if too long
    const truncatedName = displayName.length > 20 
      ? displayName.substring(0, 20) 
      : displayName;

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with display name
    await updateProfile(userCredential.user, {
      displayName: truncatedName
    });

    // Force refresh the user object to get the updated display name
    await userCredential.user.reload();
    
    return userCredential;
  } catch (error) {
    console.error('Error in signUp:', error);
    throw error;
  }
};

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns UserCredential from Firebase
 */
export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error('Error in signIn:', error);
    throw error;
  }
};

/**
 * Sign in with Google authentication
 * Display name logic: Extract from Google profile or use email prefix
 * @returns UserCredential from Firebase
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Get display name from Google profile or use email prefix
    let displayName = result.user.displayName;
    
    if (!displayName) {
      // Extract name from email if Google didn't provide one
      displayName = result.user.email?.split('@')[0] || 'User';
    }

    // Truncate to 20 characters if needed
    const truncatedName = displayName.length > 20 
      ? displayName.substring(0, 20) 
      : displayName;

    // Update profile if display name needs truncation or wasn't set
    if (result.user.displayName !== truncatedName) {
      await updateProfile(result.user, { displayName: truncatedName });
      await result.user.reload();
    }
    
    return result;
  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
};

/**
 * Update the current user's display name
 * @param displayName - New display name (will be truncated to 20 chars if needed)
 */
export const updateUserProfile = async (displayName: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    // Truncate display name to 20 characters if too long
    const truncatedName = displayName.length > 20 
      ? displayName.substring(0, 20) 
      : displayName;

    await updateProfile(currentUser, {
      displayName: truncatedName
    });

    // Force refresh the user object
    await currentUser.reload();
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

