interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

// Helper function to determine if text should be black or white based on background color
const getContrastColor = (hexColor: string): string => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const Cursor = ({ x, y, color, name }: CursorProps) => {
  const textColor = getContrastColor(color);

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100 ease-linear"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Custom cursor icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cursor pointer shape */}
        <path
          d="M5.65376 12.3673L8.84197 15.5555L10.6321 19.7488C10.8002 20.1554 11.3557 20.2011 11.5887 19.8281L16.8961 11.4774C17.1241 11.1118 16.8753 10.6308 16.4418 10.5929L5.84686 9.96042C5.42699 9.92352 5.1409 10.4189 5.40108 10.7755L5.65376 12.3673Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User name label */}
      <div
        className="absolute left-6 top-1 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap shadow-lg border border-white border-opacity-20"
        style={{
          backgroundColor: color,
          color: textColor,
        }}
      >
        {name}
      </div>
    </div>
  );
};

export default Cursor;

