import { useState } from 'react';
import AuthProvider from './components/Auth/AuthProvider';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Layout/Navbar';
import { useAuth } from './hooks/useAuth';
import './App.css';

/**
 * Main authenticated app view
 * This will later contain the Canvas component
 */
const AuthenticatedApp = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome to CollabCanvas! 🎨
          </h2>
          <p className="text-gray-600 mb-4">
            You are now authenticated and ready to collaborate.
          </p>
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="font-semibold">✓ Authentication System Complete!</p>
            <p className="text-sm mt-1">Canvas component will be added in the next PR.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Auth gate component
 * Shows login/signup if not authenticated, otherwise shows the main app
 */
const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  // Show loading state while determining auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authenticated app if user is logged in
  if (currentUser) {
    return <AuthenticatedApp />;
  }

  // Show login or signup based on state
  return showSignup ? (
    <Signup onSwitchToLogin={() => setShowSignup(false)} />
  ) : (
    <Login onSwitchToSignup={() => setShowSignup(true)} />
  );
};

/**
 * Main App component
 * Wraps everything with AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
