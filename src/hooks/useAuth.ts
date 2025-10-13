import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

/**
 * Custom hook to access the Auth Context
 * 
 * This hook provides access to:
 * - currentUser: The currently authenticated user (or null)
 * - loading: Boolean indicating if auth state is being determined
 * - signup: Function to create a new user account
 * - login: Function to sign in with email/password
 * - loginWithGoogle: Function to sign in with Google
 * - logout: Function to sign out the current user
 * 
 * @throws Error if used outside of AuthProvider
 * @returns Auth context values
 * 
 * @example
 * const { currentUser, login, logout } = useAuth();
 * 
 * if (currentUser) {
 *   return <button onClick={logout}>Sign Out</button>;
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;

