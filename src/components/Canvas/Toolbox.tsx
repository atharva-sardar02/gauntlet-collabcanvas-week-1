import { useState, useEffect, useRef } from 'react';
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
  // Visibility control
  isVisible?: boolean;
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
  isVisible = true,
}: ToolboxProps) => {
  const tools = TOOLS;
  const [tooltip, setTooltip] = useState<string | null>(null);
  
  // Draggable state
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('toolbox-position');
    return saved ? JSON.parse(saved) : { x: 16, y: 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolboxRef = useRef<HTMLDivElement>(null);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('toolbox-position', JSON.stringify(position));
  }, [position]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header area
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = toolboxRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  // Handle dragging with viewport constraints
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!toolboxRef.current) return;
      
      const toolboxRect = toolboxRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate new position
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to viewport bounds
      // Keep at least 50px of toolbox visible on each edge
      const minVisible = 50;
      newX = Math.max(minVisible - toolboxRect.width, Math.min(newX, viewportWidth - minVisible));
      newY = Math.max(0, Math.min(newY, viewportHeight - minVisible));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;

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
    <div 
      ref={toolboxRef}
      className="fixed bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 select-none" 
      style={{ 
        zIndex: 30,
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        maxHeight: '90vh',
        overflow: 'hidden',
      }}
    >
      {/* Drag Handle Header */}
      <div 
        className="drag-handle bg-gray-900/50 px-2 py-1.5 border-b border-gray-700 flex items-center justify-between cursor-grab active:cursor-grabbing rounded-t-xl"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h.01M8 12h.01M8 18h.01M12 6h.01M12 12h.01M12 18h.01M16 6h.01M16 12h.01M16 18h.01" />
          </svg>
          <span className="text-[10px] font-semibold text-gray-400">TOOLBOX</span>
        </div>
        <div className="text-[9px] text-gray-500">Drag</div>
      </div>

      <div className="p-2" style={{ overflow: 'hidden' }}>
        {/* DRAWING TOOLS SECTION */}
        <div className="flex flex-col gap-1.5">
          <div className="text-gray-400 text-[10px] font-semibold px-1 mb-0.5">
            TOOLS
          </div>
        
        {/* Tools in 2-column grid */}
        <div className="grid grid-cols-2 gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`
                group relative flex items-center justify-center w-10 h-8 rounded
                transition-all duration-200 z-10
                ${
                  selectedTool === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
              title={tool.name}
            >
              <span className="text-lg relative z-10">{tool.icon}</span>
              
              {/* Tooltip */}
              <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl border border-gray-700"
                   style={{ zIndex: 10000 }}>
                <div className="font-semibold">{tool.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* HISTORY SECTION */}
      {(onUndo || onRedo) && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-gray-400 text-[10px] font-semibold px-1 mb-1">
              HISTORY
            </div>
            <div className="flex gap-1">
              {onUndo && (
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`
                    group relative flex items-center justify-center w-10 h-8 rounded
                    transition-all duration-200 z-10
                    ${
                      canUndo
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Undo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                  </svg>
                  
                  <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl border border-gray-700"
                       style={{ zIndex: 10000 }}>
                    Undo
                  </div>
                </button>
              )}
              {onRedo && (
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`
                    group relative flex items-center justify-center w-10 h-8 rounded
                    transition-all duration-200 z-10
                    ${
                      canRedo
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Redo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                  </svg>
                  
                  <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl border border-gray-700"
                       style={{ zIndex: 10000 }}>
                    Redo
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
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-gray-400 text-[10px] font-semibold px-1 mb-1">
              LAYERS {!layerControlsEnabled && <span className="text-gray-600 text-[9px] ml-1">(Select 1)</span>}
            </div>
            
            {/* Layer position indicator */}
            {layerInfo && layerControlsEnabled && (
              <div className="text-gray-400 text-[9px] px-1 mb-1">
                Layer {layerInfo.current}/{layerInfo.total}
              </div>
            )}
            
            {/* New Layout: Single layer (↑,↓) on left, Multi-layer (↑↑,↓↓) on right */}
            <div className="grid grid-cols-2 gap-1">
              {/* LEFT COLUMN - Single layer moves */}
              <div className="flex flex-col gap-1">
                {/* Bring Forward */}
                <button
                  onClick={onBringForward}
                  disabled={!layerControlsEnabled}
                  onMouseEnter={() => setTooltip('Forward')}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-7 rounded
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Bring Forward"
                >
                  <div className="relative z-10 text-xs font-semibold">↑</div>
                  
                  {tooltip === 'Forward' && layerControlsEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      Forward
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
                    group relative flex items-center justify-center h-7 rounded
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Send Backward"
                >
                  <div className="relative z-10 text-xs font-semibold">↓</div>
                  
                  {tooltip === 'Backward' && layerControlsEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      Backward
                    </div>
                  )}
                </button>
              </div>

              {/* RIGHT COLUMN - Front/Back moves */}
              <div className="flex flex-col gap-1">
                {/* Bring to Front */}
                <button
                  onClick={onBringToFront}
                  disabled={!layerControlsEnabled}
                  onMouseEnter={() => setTooltip('To Front')}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-7 rounded
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Bring to Front"
                >
                  <div className="relative z-10 text-xs font-semibold">↑↑</div>
                  
                  {tooltip === 'To Front' && layerControlsEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      To Front
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
                    group relative flex items-center justify-center h-7 rounded
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Send to Back"
                >
                  <div className="relative z-10 text-xs font-semibold">↓↓</div>
                  
                  {tooltip === 'To Back' && layerControlsEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      To Back
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
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-gray-400 text-[10px] font-semibold px-1 mb-1">
              ALIGN {!alignmentEnabled && <span className="text-gray-600 text-[9px] ml-1">(2+)</span>}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {alignmentButtons.slice(0, 6).map((button) => (
                <button
                  key={button.id}
                  onClick={button.action}
                  disabled={!alignmentEnabled}
                  onMouseEnter={() => setTooltip(button.label)}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-7 rounded
                    transition-all duration-200 z-10
                    ${
                      alignmentEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title={button.label}
                >
                  <div className="relative z-10 scale-75">{button.icon}</div>
                  
                  {tooltip === button.label && alignmentEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                         style={{ zIndex: 10000 }}>
                      {button.label}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Distribute section */}
            <div className="text-gray-400 text-[10px] font-semibold px-1 mt-2 mb-1">
              DISTRIBUTE {!alignmentEnabled && <span className="text-gray-600 text-[9px] ml-1">(2+)</span>}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {alignmentButtons.slice(6).map((button) => (
                <button
                  key={button.id}
                  onClick={button.action}
                  disabled={!alignmentEnabled}
                  onMouseEnter={() => setTooltip(button.label)}
                  onMouseLeave={() => setTooltip(null)}
                  className={`
                    group relative flex items-center justify-center h-7 rounded
                    transition-all duration-200 z-10
                    ${
                      alignmentEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title={button.label}
                >
                  <div className="relative z-10 scale-75">{button.icon}</div>
                  
                  {tooltip === button.label && alignmentEnabled && (
                    <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
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
          <div className="mt-2 pt-2 border-t border-gray-700">
            <button
              onClick={onClearCanvas}
              onMouseEnter={() => setTooltip('Clear Canvas')}
              onMouseLeave={() => setTooltip(null)}
              className="relative w-full px-2 py-1.5 text-xs font-semibold text-red-400 bg-red-900/20 hover:bg-red-900/40 rounded transition-all duration-200 z-10 flex items-center justify-center gap-1.5"
              title="Clear Canvas"
            >
              <span className="text-sm">🗑️</span>
              <span>Clear</span>
              
              {tooltip === 'Clear Canvas' && (
                <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-100 pointer-events-none whitespace-nowrap shadow-2xl border border-gray-700"
                     style={{ zIndex: 10000 }}>
                  Clear All
                </div>
              )}
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default Toolbox;

