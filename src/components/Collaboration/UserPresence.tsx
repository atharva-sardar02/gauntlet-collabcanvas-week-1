interface UserPresenceProps {
  name: string;
  color: string;
}

const UserPresence = ({ name, color }: UserPresenceProps) => {
  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div 
      className="group relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 hover:scale-105"
      style={{ backgroundColor: `${color}20` }}
    >
      {/* Avatar with initial */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
        style={{ backgroundColor: color }}
      >
        {getInitials(name)}
      </div>

      {/* Name (visible on hover or larger screens) */}
      <span className="hidden md:inline text-sm font-semibold text-gray-100">
        {name}
      </span>

      {/* Tooltip for small screens */}
      <div className="md:hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
        {name}
      </div>
    </div>
  );
};

export default UserPresence;

