import { ReactNode } from 'react';
import { AuthProvider as AuthContextProvider } from '../../contexts/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider wrapper component
 * Wraps the entire app with AuthContext and shows loading state during auth check
 */
const AuthProvider = ({ children }: AuthProviderProps) => {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  );
};

export default AuthProvider;

