import { useState } from 'react';
import { TOOLS } from '../../utils/tools';
import type { ToolType } from '../../utils/tools';

interface ToolboxProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  // History actions
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // Alignment actions
  onAlign?: (mode: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => void;
  onDistribute?: (axis: 'horizontal' | 'vertical') => void;
  alignmentEnabled?: boolean;
  // Layer management
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  layerControlsEnabled?: boolean;
  layerInfo?: { current: number; total: number } | null;
  // Canvas actions
  onClearCanvas?: () => void;
}

const Toolbox = ({ 
  selectedTool, 
  onSelectTool, 
  onUndo, 
  onRedo, 
  canUndo = false, 
  canRedo = false,
  onAlign,
  onDistribute,
  alignmentEnabled = false,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  layerControlsEnabled = false,
  layerInfo = null,
  onClearCanvas,
}: ToolboxProps) => {
  const tools = TOOLS;
  const [tooltip, setTooltip] = useState<string | null>(null);

  const alignmentButtons = [
    {
      id: 'left',
      label: 'Align Left',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <line x1="2" y1="2" x2="2" y2="18" strokeWidth="2" />
          <rect x="4" y="4" width="6" height="4" fill="currentColor" opacity="0.7" />
          <rect x="4" y="11" width="10" height="4" fill="currentColor" opacity="0.7" />
        </svg>
      ),
      action: () => onAlign?.('left'),
    },
    {
      id: 'center-h',
      label: 'Center H',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <line x1="10" y1="2" x2="10" y2="18" strokeWidth="2" strokeDasharray="2,2" />
          <rect x="7" y="4" width="6" height="4" fill="currentColor" opacity="0.7" />
          <rect x="5" y="11" width="10" height="4" fill="currentColor" opacity="0.7" />
        </svg>
      ),
      action: () => onAlign?.('center-h'),
    },
    {
      id: 'right',
      label: 'Align Right',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <line x1="18" y1="2" x2="18" y2="18" strokeWidth="2" />
          <rect x="10" y="4" width="6" height="4" fill="currentColor" opacity="0.7" />
          <rect x="6" y="11" width="10" height="4" fill="currentColor" opacity="0.7" />
        </svg>
      ),
      action: () => onAlign?.('right'),
    },
    {
      id: 'top',
      label: 'Align Top',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <line x1="2" y1="2" x2="18" y2="2" strokeWidth="2" />
          <rect x="4" y="4" width="4" height="6" fill="currentColor" opacity="0.7" />
          <rect x="11" y="4" width="4" height="10" fill="currentColor" opacity="0.7" />
        </svg>
      ),
      action: () => onAlign?.('top'),
    },
    {
      id: 'center-v',
      label: 'Center V',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <line x1="2" y1="10" x2="18" y2="10" strokeWidth="2" strokeDasharray="2,2" />
          <rect x="4" y="7" width="4" height="6" fill="currentColor" opacity="0.7" />
          <rect x="11" y="5" width="4" height="10" fill="currentColor" opacity="0.7" />
        </svg>
      ),
      action: () => onAlign?.('center-v'),
    },
    {
      id: 'bottom',
      label: 'Align Bottom',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <line x1="2" y1="18" x2="18" y2="18" strokeWidth="2" />
          <rect x="4" y="10" width="4" height="6" fill="currentColor" opacity="0.7" />
          <rect x="11" y="6" width="4" height="10" fill="currentColor" opacity="0.7" />
        </svg>
      ),
      action: () => onAlign?.('bottom'),
    },
    {
      id: 'distribute-h',
      label: 'Distribute H',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <rect x="2" y="7" width="4" height="6" fill="currentColor" opacity="0.7" />
          <rect x="8" y="7" width="4" height="6" fill="currentColor" opacity="0.7" />
          <rect x="14" y="7" width="4" height="6" fill="currentColor" opacity="0.7" />
        </svg>
      ),
      action: () => onDistribute?.('horizontal'),
    },
    {
      id: 'distribute-v',
      label: 'Distribute V',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <rect x="7" y="2" width="6" height="4" fill="currentColor" opacity="0.7" />
          <rect x="7" y="8" width="6" height="4" fill="currentColor" opacity="0.7" />
          <rect x="7" y="14" width="6" height="4" fill="currentColor" opacity="0.7" />
        </svg>
      ),
      action: () => onDistribute?.('vertical'),
    },
  ];

  return (
    <div className="fixed left-4 top-20 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl p-3 border border-gray-700 max-h-[calc(100vh-6rem)] overflow-y-auto" style={{ zIndex: 30 }}>
      {/* DRAWING TOOLS SECTION */}
      <div className="flex flex-col gap-2">
        <div className="text-gray-400 text-xs font-semibold px-2 mb-1">
          TOOLS
        </div>
        
        {/* Tools in 2-column grid */}
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`
                group relative flex items-center justify-center w-12 h-12 rounded-lg
                transition-all duration-200 ease-out z-10
                ${
                  selectedTool === tool.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                }
              `}
              title={tool.name}
            >
              <span className="text-2xl relative z-10">{tool.icon}</span>
              
              {/* Tooltip - positioned at bottom-right of button */}
              <div className="absolute left-full bottom-0 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl border border-gray-700"
                   style={{ zIndex: 10000 }}>
                <div className="font-semibold">{tool.name}</div>
                <div className="text-gray-400 text-xs">{tool.description}</div>
                {tool.shortcut && (
                  <div className="text-gray-500 text-xs mt-1">
                    Press <kbd className="bg-gray-800 px-1 rounded">{tool.shortcut}</kbd>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* HISTORY SECTION */}
      {(onUndo || onRedo) && (
        <>
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-xs font-semibold px-2 mb-2">
              HISTORY
            </div>
            <div className="flex gap-2">
              {onUndo && (
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`
                    group relative flex items-center justify-center w-12 h-10 rounded-lg
                    transition-all duration-200 z-10
                    ${
                      canUndo
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Undo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                  </svg>
                  
                  <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl border border-gray-700"
                       style={{ zIndex: 10000 }}>
                    Undo <kbd className="bg-gray-800 px-1 rounded text-[10px]">Ctrl+Z</kbd>
                  </div>
                </button>
              )}
              {onRedo && (
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`
                    group relative flex items-center justify-center w-12 h-10 rounded-lg
                    transition-all duration-200 z-10
                    ${
                      canRedo
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Redo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                  </svg>
                  
                  <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl border border-gray-700"
                       style={{ zIndex: 10000 }}>
                    Redo <kbd className="bg-gray-800 px-1 rounded text-[10px]">Ctrl+Shift+Z</kbd>
                  </div>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* LAYERS SECTION */}
      {(onBringToFront || onSendToBack || onBringForward || onSendBackward) && (
        <>
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-xs font-semibold px-2 mb-2">
              LAYERS {!layerControlsEnabled && <span className="text-gray-600 text-[10px] ml-1">(Select 1)</span>}
            </div>
            
            {/* Layer position indicator */}
            {layerInfo && layerControlsEnabled && (
              <div className="text-gray-400 text-xs px-2 mb-2">
                Layer {layerInfo.current} of {layerInfo.total}
              </div>
            )}
            
            {/* New Layout: Single layer (↑,↓) on left, Multi-layer (↑↑,↓↓) on right */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* LEFT COLUMN - Single layer moves */}
              <div className="flex flex-col gap-1.5">
                {/* Bring Forward */}
                <button
                  onClick={onBringForward}
                  disabled={!layerControlsEnabled}
                  onMouseEnter={() => setTooltip('Forward')}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-9 rounded-lg
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Bring Forward"
                >
                  <div className="relative z-10 text-sm font-semibold">↑</div>
                  
                  {tooltip === 'Forward' && layerControlsEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      <div>Bring Forward</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        <kbd className="bg-gray-800 px-1 rounded">Ctrl+]</kbd>
                      </div>
                    </div>
                  )}
                </button>

                {/* Send Backward */}
                <button
                  onClick={onSendBackward}
                  disabled={!layerControlsEnabled}
                  onMouseEnter={() => setTooltip('Backward')}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-9 rounded-lg
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Send Backward"
                >
                  <div className="relative z-10 text-sm font-semibold">↓</div>
                  
                  {tooltip === 'Backward' && layerControlsEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      <div>Send Backward</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        <kbd className="bg-gray-800 px-1 rounded">Ctrl+[</kbd>
                      </div>
                    </div>
                  )}
                </button>
              </div>

              {/* RIGHT COLUMN - Front/Back moves */}
              <div className="flex flex-col gap-1.5">
                {/* Bring to Front */}
                <button
                  onClick={onBringToFront}
                  disabled={!layerControlsEnabled}
                  onMouseEnter={() => setTooltip('To Front')}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-9 rounded-lg
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Bring to Front"
                >
                  <div className="relative z-10 text-sm font-semibold">↑↑</div>
                  
                  {tooltip === 'To Front' && layerControlsEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      <div>Bring to Front</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+]</kbd>
                      </div>
                    </div>
                  )}
                </button>

                {/* Send to Back */}
                <button
                  onClick={onSendToBack}
                  disabled={!layerControlsEnabled}
                  onMouseEnter={() => setTooltip('To Back')}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-9 rounded-lg
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Send to Back"
                >
                  <div className="relative z-10 text-sm font-semibold">↓↓</div>
                  
                  {tooltip === 'To Back' && layerControlsEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      <div>Send to Back</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+[</kbd>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ALIGNMENT SECTION */}
      {(onAlign || onDistribute) && (
        <>
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-xs font-semibold px-2 mb-2">
              ALIGN {!alignmentEnabled && <span className="text-gray-600 text-[10px] ml-1">(Select 2+)</span>}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {alignmentButtons.slice(0, 6).map((button) => (
                <button
                  key={button.id}
                  onClick={button.action}
                  disabled={!alignmentEnabled}
                  onMouseEnter={() => setTooltip(button.label)}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-9 rounded-lg
                    transition-all duration-200 z-10
                    ${
                      alignmentEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title={button.label}
                >
                  <div className="relative z-10">{button.icon}</div>
                  
                  {tooltip === button.label && alignmentEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      <div>{button.label}</div>
                      {/* Show keyboard shortcuts for alignments */}
                      {button.id === 'left' && (
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+L</kbd>
                        </div>
                      )}
                      {button.id === 'right' && (
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+R</kbd>
                        </div>
                      )}
                      {button.id === 'top' && (
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+T</kbd>
                        </div>
                      )}
                      {button.id === 'bottom' && (
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+B</kbd>
                        </div>
                      )}
                      {button.id === 'center-h' && (
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+H</kbd>
                        </div>
                      )}
                      {button.id === 'center-v' && (
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+V</kbd>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Distribute section */}
            <div className="text-gray-400 text-xs font-semibold px-2 mt-3 mb-2">
              DISTRIBUTE {!alignmentEnabled && <span className="text-gray-600 text-[10px] ml-1">(Select 2+)</span>}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {alignmentButtons.slice(6).map((button) => (
                <button
                  key={button.id}
                  onClick={button.action}
                  disabled={!alignmentEnabled}
                  onMouseEnter={() => setTooltip(button.label)}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-9 rounded-lg
                    transition-all duration-200 z-10
                    ${
                      alignmentEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title={button.label}
                >
                  <div className="relative z-10">{button.icon}</div>
                  
                  {tooltip === button.label && alignmentEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      {button.label}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CLEAR CANVAS BUTTON - At Bottom */}
      {onClearCanvas && (
        <>
          <div className="mt-4 pt-3 border-t border-gray-700">
            <button
              onClick={onClearCanvas}
              onMouseEnter={() => setTooltip('Clear Canvas')}
              onMouseLeave={() => setTooltip(null)}
              className="relative w-full px-3 py-2 text-sm font-semibold text-red-400 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-all duration-200 z-10 flex items-center justify-center gap-2"
              title="Clear Canvas"
            >
              <span>🗑️</span>
              <span>Clear Canvas</span>
              
              {tooltip === 'Clear Canvas' && (
                <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                     style={{ zIndex: 10000 }}>
                  Delete all shapes
                </div>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Toolbox;

