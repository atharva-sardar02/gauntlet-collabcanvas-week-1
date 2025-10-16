import { useState } from 'react';
import AuthProvider from './components/Auth/AuthProvider';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Layout/Navbar';
import Canvas from './components/Canvas/Canvas';
import { CanvasProvider } from './contexts/CanvasContext';
import { HistoryProvider } from './contexts/HistoryContext';
import { useAuth } from './hooks/useAuth';
import './App.css';

/**
 * Main authenticated app view
 * Contains the Canvas component wrapped in CanvasProvider and HistoryProvider
 */
const AuthenticatedApp = () => {
  const { currentUser } = useAuth();
  const [exportHandler, setExportHandler] = useState<(() => void) | null>(null);
  const [hasShapes, setHasShapes] = useState(false);

  // Callback to receive export handler from Canvas
  const handleExportRequest = (handler: () => void, hasShapesValue: boolean) => {
    setExportHandler(() => handler);
    setHasShapes(hasShapesValue);
  };

  return (
    <HistoryProvider userId={currentUser?.uid || null}>
      <CanvasProvider>
        <div className="min-h-screen bg-gray-900 flex flex-col">
          <Navbar onExport={exportHandler || undefined} hasShapes={hasShapes} />
          <div className="flex-1 overflow-hidden">
            <Canvas onExportRequest={handleExportRequest} />
          </div>
        </div>
      </CanvasProvider>
    </HistoryProvider>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
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
