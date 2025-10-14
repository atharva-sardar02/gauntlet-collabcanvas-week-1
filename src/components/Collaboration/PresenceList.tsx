import { useState } from 'react';
import UserPresence from './UserPresence';
import type { OnlineUser } from '../../services/presence';

interface PresenceListProps {
  users: OnlineUser[];
  currentUserId?: string;
}

const PresenceList = ({ users, currentUserId }: PresenceListProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter out current user and get count
  const otherUsers = users.filter(user => user.userId !== currentUserId);
  const totalUsers = users.length;

  return (
    <div className="fixed top-20 right-4 z-40 max-w-xs">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden min-w-[200px]">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-200 flex items-center justify-between text-white shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            <span className="font-semibold text-sm">
              {totalUsers} {totalUsers === 1 ? 'user' : 'users'} online
            </span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* User List */}
        {isExpanded && (
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto bg-gray-800">
            {users.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No users online
              </p>
            ) : (
              <>
                {users.map((user) => (
                  <div key={user.userId} className="flex items-center gap-2">
                    <UserPresence
                      name={user.displayName}
                      color={user.cursorColor}
                    />
                    {user.userId === currentUserId && (
                      <span className="text-xs text-gray-500 italic">(You)</span>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Collapsed view - just show count */}
        {!isExpanded && otherUsers.length > 0 && (
          <div className="px-4 py-2 text-xs text-gray-400 text-center bg-gray-900">
            Click to see who's here
          </div>
        )}
      </div>
    </div>
  );
};

export default PresenceList;

