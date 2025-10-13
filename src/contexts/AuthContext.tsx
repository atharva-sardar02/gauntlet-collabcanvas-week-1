import { createContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import * as authService from '../services/auth';

// Define the shape of our Auth Context
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with undefined as default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component that wraps the app
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Sign up a new user with email and password
   * Uses the auth service to handle Firebase operations
   */
  const signup = async (email: string, password: string, displayName: string): Promise<void> => {
    await authService.signUp(email, password, displayName);
    // Auth state will be updated automatically by onAuthStateChanged listener
  };

  /**
   * Sign in an existing user with email and password
   * Uses the auth service to handle Firebase operations
   */
  const login = async (email: string, password: string): Promise<void> => {
    await authService.signIn(email, password);
    // Auth state will be updated automatically by onAuthStateChanged listener
  };

  /**
   * Sign in with Google authentication
   * Uses the auth service to handle Firebase operations
   */
  const loginWithGoogle = async (): Promise<void> => {
    await authService.signInWithGoogle();
    // Auth state will be updated automatically by onAuthStateChanged listener
  };

  /**
   * Sign out the current user
   * Uses the auth service to handle Firebase operations
   */
  const logout = async (): Promise<void> => {
    await authService.signOut();
    // Auth state will be updated automatically by onAuthStateChanged listener
  };

  // Set up auth state listener on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

