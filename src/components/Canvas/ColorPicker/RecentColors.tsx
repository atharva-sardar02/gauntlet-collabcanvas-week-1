
interface RecentColorsProps {
  colors: string[];
  onColorClick: (color: string) => void;
  onClear: () => void;
}

export function RecentColors({ colors, onColorClick, onClear }: RecentColorsProps) {
  if (colors.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No recent colors yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-300">Recent Colors</h4>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          title="Clear recent colors"
        >
          Clear
        </button>
      </div>
      
      <div className="grid grid-cols-10 gap-1">
        {colors.map((color, index) => (
          <button
            key={`${color}-${index}`}
            onClick={() => onColorClick(color)}
            className="w-8 h-8 rounded border-2 border-gray-700 hover:border-gray-500 transition-colors cursor-pointer"
            style={{ backgroundColor: color }}
            title={color}
            aria-label={`Select color ${color}`}
          >
            {/* Empty button with colored background */}
          </button>
        ))}
      </div>
    </div>
  );
}

