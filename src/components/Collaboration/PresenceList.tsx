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
    <div className="fixed top-20 right-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-between text-white"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
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
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
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
          <div className="px-4 py-2 text-xs text-gray-600 text-center bg-gray-50">
            Click to see who's here
          </div>
        )}
      </div>
    </div>
  );
};

export default PresenceList;

