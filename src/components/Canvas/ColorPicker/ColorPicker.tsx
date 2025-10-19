import { useState, useEffect, useRef, type RefObject } from 'react';
import { HexColorPicker } from 'react-colorful';
import { isValidHex, hexToRgb, hexToRgba } from '../../../utils/colorUtils';
import { createPortal } from 'react-dom';

interface ColorPickerProps {
  initialColor?: string;
  initialOpacity?: number;
  onColorChange: (color: string, opacity?: number) => void;
  onClose: () => void;
  showOpacity?: boolean;
  anchorRef?: RefObject<HTMLDivElement | null>;
}

export function ColorPicker({
  initialColor = '#3B82F6',
  initialOpacity = 1,
  onColorChange,
  onClose,
  showOpacity = true,
  anchorRef,
}: ColorPickerProps) {
  const [color, setColor] = useState(initialColor);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [hexInput, setHexInput] = useState(initialColor);
  const [hexError, setHexError] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const isDraggingRef = useRef(false); // Track if user is dragging
  const justOpenedRef = useRef(true); // Track if popover just opened

  // Don't update from props while user is interacting
  const initialColorRef = useRef(initialColor);
  useEffect(() => {
    initialColorRef.current = initialColor;
  }, []);

  // Calculate position based on anchor
  useEffect(() => {
    if (anchorRef?.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popoverWidth = 240; // Reduced from 280
      const popoverHeight = showOpacity ? 340 : 300; // Reduced overall height
      
      // Position to the right of the toolbox with minimal spacing
      let left = anchorRect.right + 8; // Reduced spacing from 16 to 8
      let top = anchorRect.top;
      
      // Adjust if it goes off-screen
      if (left + popoverWidth > window.innerWidth) {
        left = anchorRect.left - popoverWidth - 8; // Position to the left instead
      }
      
      if (top + popoverHeight > window.innerHeight) {
        top = window.innerHeight - popoverHeight - 16;
      }
      
      if (top < 16) {
        top = 16;
      }
      
      setPosition({ top, left });
    }
  }, [anchorRef, showOpacity]);

  // Close on Escape key and click outside (but not while dragging)
  useEffect(() => {
    // Small delay before enabling click-outside detection
    // This prevents the opening click from immediately closing the popover
    justOpenedRef.current = true;
    const enableTimer = setTimeout(() => {
      justOpenedRef.current = false;
    }, 100);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Track mouse down inside popover (start of potential drag)
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        isDraggingRef.current = true;
      }
    };

    // Track mouse up anywhere (end of drag)
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Only close if:
      // 1. Popover has been open for at least 100ms (not just opened)
      // 2. Click is outside the popover
      // 3. User is not currently dragging
      if (
        !justOpenedRef.current &&
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        !isDraggingRef.current
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    // Use 'click' event instead of 'mousedown' for outside detection
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      clearTimeout(enableTimer);
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setHexInput(newColor);
    setHexError(false);
    // Immediately apply color change
    onColorChange(newColor, showOpacity ? opacity : undefined);
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    // Immediately apply opacity change
    onColorChange(color, newOpacity);
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    
    // Add # if missing
    const hexValue = value.startsWith('#') ? value : `#${value}`;
    
    if (isValidHex(hexValue)) {
      setColor(hexValue);
      setHexError(false);
      // Immediately apply color change
      onColorChange(hexValue, showOpacity ? opacity : undefined);
    } else {
      setHexError(true);
    }
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(color);
  };

  const rgb = hexToRgb(color);
  const previewColor = hexToRgba(color, opacity);

  // Render as a popover if anchorRef is provided, otherwise as a modal
  const popoverContent = anchorRef ? (
    <div
      ref={popoverRef}
      className="fixed z-[9999] bg-gray-900 border-2 border-blue-600/30 rounded-lg shadow-2xl p-2.5 w-[240px]"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[11px] font-semibold text-gray-100 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
          </svg>
          Color
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors p-0.5 hover:bg-gray-800 rounded"
          title="Close (Esc)"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Color Picker */}
      <div className="mb-1.5">
        <HexColorPicker 
          color={color} 
          onChange={handleColorChange} 
          style={{ width: '100%', height: '130px' }} 
        />
      </div>

      {/* Preview */}
      <div className="mb-1.5">
        <label className="block text-[9px] font-medium text-gray-300 mb-0.5">Preview</label>
        <div
          className="w-full h-8 rounded border-2 border-gray-700 shadow-inner"
          style={{ backgroundColor: previewColor }}
        />
      </div>

      {/* Hex Input */}
      <div className="mb-1.5">
        <label className="block text-[9px] font-medium text-gray-300 mb-0.5">Hex</label>
        <div className="flex gap-1">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value)}
            className={`flex-1 px-1.5 py-0.5 bg-gray-800 border rounded text-gray-100 text-[10px] focus:outline-none focus:ring-1 font-mono ${
              hexError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-600 focus:ring-blue-500'
            }`}
            placeholder="#3B82F6"
          />
          <button
            onClick={handleCopyHex}
            className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors flex items-center"
            title="Copy"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>
        {hexError && (
          <p className="text-red-400 text-[9px] mt-0.5">Invalid hex</p>
        )}
      </div>

      {/* RGB Display */}
      <div className="mb-1.5">
        <label className="block text-[9px] font-medium text-gray-300 mb-0.5">RGB</label>
        <div className="flex gap-1.5 text-[9px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded font-mono">
          <span>R:{rgb.r}</span>
          <span>G:{rgb.g}</span>
          <span>B:{rgb.b}</span>
        </div>
      </div>

      {/* Opacity Slider (if enabled) */}
      {showOpacity && (
        <div className="mb-1.5">
          <label className="block text-[9px] font-medium text-gray-300 mb-0.5">
            Opacity: <span className="text-blue-400">{Math.round(opacity * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity * 100}
            onChange={(e) => handleOpacityChange(parseInt(e.target.value) / 100)}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, transparent 0%, ${color} 100%)`
            }}
          />
        </div>
      )}
    </div>
  ) : (
    // Original modal layout for backward compatibility
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      style={{ margin: 0, padding: 0 }}
    >
      <div
        ref={popoverRef}
        className="bg-gray-900 border-2 border-gray-700 rounded-xl shadow-2xl p-6 w-[400px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Same content as before for modal mode */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
            </svg>
            Color Picker
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 hover:bg-gray-800 rounded"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <HexColorPicker 
            color={color} 
            onChange={handleColorChange} 
            style={{ width: '100%', height: '200px' }} 
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
          <div
            className="w-full h-16 rounded-lg border-2 border-gray-700 shadow-inner"
            style={{ backgroundColor: previewColor }}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Hex Color</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInputChange(e.target.value)}
              className={`flex-1 px-3 py-2 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:ring-2 font-mono ${
                hexError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-600 focus:ring-blue-500'
              }`}
              placeholder="#3B82F6"
            />
            <button
              onClick={handleCopyHex}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors flex items-center gap-2"
              title="Copy to clipboard"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy
            </button>
          </div>
          {hexError && (
            <p className="text-red-400 text-sm mt-1">Invalid hex color</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">RGB</label>
          <div className="flex gap-4 text-sm text-gray-400 bg-gray-800 px-3 py-2 rounded-lg font-mono">
            <span>R: {rgb.r}</span>
            <span>G: {rgb.g}</span>
            <span>B: {rgb.b}</span>
          </div>
        </div>

        {showOpacity && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Opacity: <span className="text-blue-400">{Math.round(opacity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity * 100}
              onChange={(e) => handleOpacityChange(parseInt(e.target.value) / 100)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, transparent 0%, ${color} 100%)`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Render at document root to avoid positioning issues
  return createPortal(popoverContent, document.body);
}

