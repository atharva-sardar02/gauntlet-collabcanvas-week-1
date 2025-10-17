import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAIAgent } from '../../contexts/AIAgentContext';
import { usePresence } from '../../hooks/usePresence';

interface NavbarProps {
  onExport?: () => void;
  hasShapes?: boolean;
}

const Navbar = ({ onExport, hasShapes = false }: NavbarProps) => {
  const { currentUser, logout } = useAuth();
  const { openCommandBar } = useAIAgent();
  const { onlineUsers } = usePresence();
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUsersDropdown(false);
      }
    };

    if (showUsersDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUsersDropdown]);

  return (
    <nav className="bg-gray-900 shadow-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              CollabCanvas
            </h1>
          </div>

          {/* User Info & Actions */}
          {currentUser && (
            <div className="flex items-center gap-4">
              {/* AI Command Button */}
              <button
                onClick={openCommandBar}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
                title="AI Commands (Ctrl+/ or Cmd+/)"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="hidden sm:inline">AI Agent</span>
                <kbd className="hidden md:inline-block px-2 py-0.5 text-xs font-semibold bg-white/20 rounded border border-white/30">
                  Ctrl+/
                </kbd>
              </button>

              {/* Export Button */}
              {onExport && (
                <button
                  onClick={onExport}
                  disabled={!hasShapes}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  title={hasShapes ? "Export Canvas (Ctrl/Cmd+E)" : "No shapes to export"}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}

              {/* Online Users Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUsersDropdown(!showUsersDropdown)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-gray-500/30 hover:scale-105 border border-gray-700"
                  title="View online users"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
                  </span>
                  <span className="sm:hidden">
                    {onlineUsers.length}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showUsersDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                {showUsersDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-semibold text-gray-300">
                        Online Users ({onlineUsers.length})
                      </p>
                    </div>
                    <div className="py-1">
                      {onlineUsers.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">
                          No other users online
                        </div>
                      ) : (
                        onlineUsers.map((user) => (
                          <div
                            key={user.userId}
                            className="px-4 py-2 hover:bg-gray-700 transition-colors flex items-center gap-3"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: user.cursorColor }}
                            />
                            <span className="text-sm text-gray-200">
                              {user.displayName}
                              {user.userId === currentUser?.uid && (
                                <span className="text-xs text-gray-400 ml-2">(You)</span>
                              )}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Display Name */}
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold shadow-lg">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-gray-200 font-medium hidden sm:block">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50 hover:scale-105"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

