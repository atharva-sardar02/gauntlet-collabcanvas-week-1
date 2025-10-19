import { useState, useEffect, useRef } from 'react';
import { TOOLS } from '../../utils/tools';
import type { ToolType } from '../../utils/tools';
import type { Shape } from '../../contexts/CanvasContext';
import { ColorPicker } from './ColorPicker/ColorPicker';
import { useRecentColors } from '../../hooks/useRecentColors';

interface ToolboxProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  // History actions
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // Edit actions
  onDuplicate?: () => void;
  onDelete?: () => void;
  onUpdateColor?: (color: string, opacity: number) => void; // Color picker
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
  // Visual effects
  selectedShape?: Shape | null;
  selectedShapes?: Shape[]; // For multi-select
  onUpdateShape?: (updates: Partial<Shape>) => void;
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
  onDuplicate,
  onDelete,
  onUpdateColor,
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
  selectedShape = null,
  selectedShapes = [],
  onUpdateShape,
  isVisible = true,
}: ToolboxProps) => {
  // Determine if we're in multi-select mode
  const isMultiSelect = selectedShapes && selectedShapes.length > 1;
  const effectiveShape = isMultiSelect ? selectedShapes[0] : selectedShape; // Use first shape as reference for multi-select
  const tools = TOOLS;
  const [tooltip, setTooltip] = useState<string | null>(null);
  
  // Color picker state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(effectiveShape?.fill || '#3B82F6');
  const { addRecentColor } = useRecentColors();
  const lastShapeIdRef = useRef<string | null>(null);
  
  // Update current color only when a different shape is selected
  useEffect(() => {
    const currentShapeId = effectiveShape?.id || null;
    if (currentShapeId !== lastShapeIdRef.current) {
      if (effectiveShape?.fill) {
        setCurrentColor(effectiveShape.fill);
      }
      lastShapeIdRef.current = currentShapeId;
    }
  }, [effectiveShape?.id, effectiveShape?.fill]);
  
  const handleColorChange = (color: string, opacity: number) => {
    setCurrentColor(color);
    addRecentColor(color);
    
    if (onUpdateColor) {
      onUpdateColor(color, opacity);
    }
  };
  
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
      className={`fixed bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 select-none ${effectiveShape ? 'toolbox-with-effects' : ''}`}
      style={{ 
        zIndex: 30,
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        // Custom scrollbar styling for dark theme (Firefox)
        scrollbarWidth: 'thin',
        scrollbarColor: '#4B5563 #1F2937',
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

      <div className="p-2">
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
                group relative flex items-center justify-center h-8 rounded
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
            <div className="grid grid-cols-2 gap-1">
              {onUndo && (
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`
                    group relative flex items-center justify-center h-8 rounded
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
                    Undo (Ctrl+Z)
                  </div>
                </button>
              )}
              {onRedo && (
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`
                    group relative flex items-center justify-center h-8 rounded
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
                    Redo (Ctrl+Shift+Z)
                  </div>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* EDIT SECTION - Visual Effects */}
      {onUpdateShape && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-gray-400 text-[10px] font-semibold px-1 mb-1">
              EDIT {!effectiveShape && <span className="text-gray-600 text-[9px] ml-1">(Select 1)</span>}
              {isMultiSelect && <span className="text-gray-500 text-[9px] ml-1">({selectedShapes.length})</span>}
            </div>
            
            {/* Collapsed State - Show icons when no shape selected */}
            {!effectiveShape && (
              <div className="grid grid-cols-3 gap-1">
                {/* Color Icon */}
                <button
                  disabled
                  className="flex items-center justify-center h-7 rounded bg-gray-800 text-gray-600 cursor-not-allowed"
                  title="Select a shape to edit color"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                </button>
                
                {/* Opacity Icon */}
                <button
                  disabled
                  className="flex items-center justify-center h-7 rounded bg-gray-800 text-gray-600 cursor-not-allowed"
                  title="Select a shape to edit opacity"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    <line x1="8" y1="16" x2="16" y2="8" opacity="0.4"/>
                  </svg>
                </button>
                
                {/* Blend Icon */}
                <button
                  disabled
                  className="flex items-center justify-center h-7 rounded bg-gray-800 text-gray-600 cursor-not-allowed"
                  title="Select a shape to edit blend mode"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="9" r="7" opacity="0.5"/>
                    <circle cx="15" cy="15" r="7" opacity="0.5"/>
                  </svg>
                </button>
              </div>
            )}
            
            {/* Expanded State - Show full controls when shape selected */}
            {effectiveShape && (
              <>
                {/* Color Picker Button */}
                {onUpdateColor && (
                  <div className="px-1 mb-2 relative">
                    <label className="text-[10px] text-gray-400 block mb-1">Color</label>
                    <button
                      onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                      disabled={!layerControlsEnabled}
                      className={`
                        group relative w-full h-8 rounded border transition-all duration-200 z-10 flex items-center gap-2 px-2
                        ${
                          layerControlsEnabled
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-800 cursor-not-allowed opacity-50'
                        }
                      `}
                      style={{ backgroundColor: layerControlsEnabled ? currentColor : '#374151' }}
                      title="Color Picker"
                    >
                      {/* Color palette icon overlay */}
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-lg flex-shrink-0"
                        style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}
                      >
                        <circle cx="13.5" cy="6.5" r=".5" fill="white"/>
                        <circle cx="17.5" cy="10.5" r=".5" fill="white"/>
                        <circle cx="8.5" cy="7.5" r=".5" fill="white"/>
                        <circle cx="6.5" cy="12.5" r=".5" fill="white"/>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                      </svg>
                      <span className="text-[10px] font-medium text-white drop-shadow-lg" style={{ textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                        Color
                      </span>
                    </button>

                    {/* Color Picker Popover */}
                    {isColorPickerOpen && (
                      <ColorPicker
                        initialColor={currentColor}
                        onColorChange={(color) => {
                          handleColorChange(color, effectiveShape.opacity ?? 1);
                        }}
                        onClose={() => setIsColorPickerOpen(false)}
                        showOpacity={false}
                        anchorRef={toolboxRef}
                      />
                    )}
                  </div>
                )}
                
                {/* Opacity Slider */}
                <div className="px-1 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-gray-400">Opacity</label>
                    <span className="text-[10px] text-gray-300">
                      {Math.round((effectiveShape.opacity || 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={Math.round((effectiveShape.opacity || 1) * 100)}
                    onChange={(e) => {
                      const newOpacity = parseInt(e.target.value) / 100;
                      onUpdateShape({ opacity: newOpacity });
                    }}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${Math.round((effectiveShape.opacity || 1) * 100)}%, #374151 ${Math.round((effectiveShape.opacity || 1) * 100)}%, #374151 100%)`,
                    }}
                  />
                </div>
                
                {/* Blend Mode Dropdown */}
                <div className="px-1">
                  <label className="text-[10px] text-gray-400 block mb-1">Blend Mode</label>
                  <select
                    value={effectiveShape.blendMode || 'source-over'}
                    onChange={(e) => {
                      onUpdateShape({ blendMode: e.target.value });
                    }}
                    className="w-full px-2 py-1 text-[10px] bg-gray-700 text-gray-300 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="source-over">Normal</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="overlay">Overlay</option>
                    <option value="darken">Darken</option>
                    <option value="lighten">Lighten</option>
                    <option value="color-dodge">Color Dodge</option>
                    <option value="color-burn">Color Burn</option>
                    <option value="hard-light">Hard Light</option>
                    <option value="soft-light">Soft Light</option>
                    <option value="difference">Difference</option>
                    <option value="exclusion">Exclusion</option>
                    <option value="hue">Hue</option>
                    <option value="saturation">Saturation</option>
                    <option value="color">Color</option>
                    <option value="luminosity">Luminosity</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ACTIONS SECTION - Duplicate and Delete */}
      {(onDuplicate || onDelete) && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-gray-400 text-[10px] font-semibold px-1 mb-1">
              ACTIONS {!layerControlsEnabled && <span className="text-gray-600 text-[9px] ml-1">(Select 1)</span>}
            </div>
            <div className="flex gap-1">
              {onDuplicate && (
                <button
                  onClick={onDuplicate}
                  disabled={!layerControlsEnabled}
                  className={`
                    group relative flex items-center justify-center flex-1 h-8 rounded
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Duplicate"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  
                  <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl border border-gray-700"
                       style={{ zIndex: 10000 }}>
                    Duplicate (Ctrl+D)
                  </div>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  disabled={!layerControlsEnabled}
                  className={`
                    group relative flex items-center justify-center flex-1 h-8 rounded
                    transition-all duration-200 z-10
                    ${
                      layerControlsEnabled
                        ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  
                  <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl border border-gray-700"
                       style={{ zIndex: 10000 }}>
                    Delete (Del)
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
            
            {/* Compact Layout: Only single-step buttons when no shape selected */}
            {!layerControlsEnabled && (
              <div className="grid grid-cols-2 gap-1">
                {/* Bring Forward */}
                <button
                  onClick={onBringForward}
                  disabled
                  className="flex items-center justify-center h-7 rounded bg-gray-800 text-gray-600 cursor-not-allowed"
                  title="Select a shape to bring forward"
                >
                  <div className="text-xs font-semibold">↑</div>
                </button>

                {/* Send Backward */}
                <button
                  onClick={onSendBackward}
                  disabled
                  className="flex items-center justify-center h-7 rounded bg-gray-800 text-gray-600 cursor-not-allowed"
                  title="Select a shape to send backward"
                >
                  <div className="text-xs font-semibold">↓</div>
                </button>
              </div>
            )}
            
            {/* Full Layout: All 4 buttons when shape is selected */}
            {layerControlsEnabled && (
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
            )}
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

