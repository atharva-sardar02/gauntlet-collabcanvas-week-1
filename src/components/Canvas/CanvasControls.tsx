interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  currentZoom: number;
}

const CanvasControls = ({ onZoomIn, onZoomOut, onResetView, currentZoom }: CanvasControlsProps) => {
  return (
    <div className="absolute bottom-6 right-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
      {/* Zoom Level Display */}
      <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 text-center">
        <span className="text-sm font-semibold text-blue-400">
          {Math.round(currentZoom * 100)}%
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col">
        {/* Zoom In Button */}
        <button
          onClick={onZoomIn}
          className="px-4 py-3 hover:bg-gray-700 transition-all duration-200 border-b border-gray-700 group"
          title="Zoom In (or Mouse Wheel Up)"
        >
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
            />
          </svg>
        </button>

        {/* Zoom Out Button */}
        <button
          onClick={onZoomOut}
          className="px-4 py-3 hover:bg-gray-700 transition-all duration-200 border-b border-gray-700 group"
          title="Zoom Out (or Mouse Wheel Down)"
        >
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            />
          </svg>
        </button>

        {/* Reset View Button */}
        <button
          onClick={onResetView}
          className="px-4 py-3 hover:bg-gray-700 transition-all duration-200 group"
          title="Reset View (Center Canvas)"
        >
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CanvasControls;

