import { useState } from 'react';

export type ExportScope = 'canvas' | 'selection';
export type PixelRatio = 1 | 2 | 3;

interface ExportDialogProps {
  onExport: (scope: ExportScope, pixelRatio: PixelRatio) => void;
  onCancel: () => void;
  hasSelection: boolean;
  isExporting: boolean;
}

const ExportDialog = ({ onExport, onCancel, hasSelection, isExporting }: ExportDialogProps) => {
  const [scope, setScope] = useState<ExportScope>('canvas');
  const [pixelRatio, setPixelRatio] = useState<PixelRatio>(1);

  const handleExport = () => {
    onExport(scope, pixelRatio);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Export Canvas</h2>
          <p className="text-gray-400 text-sm">
            Export your canvas as a PNG image
          </p>
        </div>

        {/* Export Scope */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Export Scope
          </label>
          <div className="space-y-2">
            {/* Full Canvas Option */}
            <label
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                scope === 'canvas'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
              }`}
            >
              <input
                type="radio"
                name="scope"
                value="canvas"
                checked={scope === 'canvas'}
                onChange={(e) => setScope(e.target.value as ExportScope)}
                className="w-4 h-4 text-blue-500 focus:ring-blue-500 focus:ring-2"
              />
              <div className="ml-3">
                <div className="text-white font-medium">Full Canvas</div>
                <div className="text-gray-400 text-sm">Export the entire canvas (5000x5000px)</div>
              </div>
            </label>

            {/* Selected Shapes Option */}
            <label
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                !hasSelection
                  ? 'opacity-50 cursor-not-allowed'
                  : scope === 'selection'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
              }`}
            >
              <input
                type="radio"
                name="scope"
                value="selection"
                checked={scope === 'selection'}
                onChange={(e) => setScope(e.target.value as ExportScope)}
                disabled={!hasSelection}
                className="w-4 h-4 text-purple-500 focus:ring-purple-500 focus:ring-2"
              />
              <div className="ml-3">
                <div className="text-white font-medium">Selected Shapes</div>
                <div className="text-gray-400 text-sm">
                  {hasSelection
                    ? 'Export only the selected shapes'
                    : 'Select shapes first to enable this option'}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Pixel Ratio */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Image Quality (Pixel Ratio)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPixelRatio(1)}
              className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                pixelRatio === 1
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="text-lg">1x</div>
              <div className="text-xs mt-1">Standard</div>
            </button>
            <button
              onClick={() => setPixelRatio(2)}
              className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                pixelRatio === 2
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="text-lg">2x</div>
              <div className="text-xs mt-1">Retina</div>
            </button>
            <button
              onClick={() => setPixelRatio(3)}
              className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                pixelRatio === 3
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="text-lg">3x</div>
              <div className="text-xs mt-1">Ultra HD</div>
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Higher pixel ratios produce larger, more detailed images
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isExporting}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || (scope === 'selection' && !hasSelection)}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Exporting...
              </>
            ) : (
              <>
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
                Export PNG
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;

