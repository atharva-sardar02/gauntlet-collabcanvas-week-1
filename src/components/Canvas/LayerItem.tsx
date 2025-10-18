import React, { useState } from 'react';
import type { Shape } from '../../contexts/CanvasContext';

interface LayerItemProps {
  shape: Shape;
  isSelected: boolean;
  isHidden: boolean;
  isDragging: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisibility: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

/**
 * LayerItem Component
 * Individual layer item with drag-and-drop, rename, and actions
 */
export default function LayerItem({
  shape,
  isSelected,
  isHidden,
  isDragging,
  onSelect,
  onToggleVisibility,
  onRename,
  onDelete,
  onMoveToTop,
  onMoveToBottom,
  onDragStart,
  onDragOver,
  onDrop,
}: LayerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(shape.name || '');

  /**
   * Get icon for shape type with proper color
   */
  const getShapeIcon = () => {
    // Use shape's fill color, but ensure visibility with a minimum brightness
    const getIconColor = () => {
      if (!shape.fill) return '#9CA3AF'; // gray-400 default
      
      // Parse hex color to RGB
      const hex = shape.fill.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Calculate relative luminance (perceived brightness)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // If too dark (< 30% brightness), use a lighter version
      if (luminance < 0.3) {
        return `rgb(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)})`;
      }
      
      return shape.fill;
    };

    const iconColor = getIconColor();

    switch (shape.type) {
      case 'rectangle':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" style={{ color: iconColor }}>
            <rect x="4" y="6" width="16" height="12" rx="2" fill="currentColor" />
          </svg>
        );
      case 'circle':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" style={{ color: iconColor }}>
            <circle cx="12" cy="12" r="8" fill="currentColor" />
          </svg>
        );
      case 'triangle':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" style={{ color: iconColor }}>
            <path d="M12 4l8 16H4z" fill="currentColor" />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" style={{ color: iconColor }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
          </svg>
        );
      case 'text':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" style={{ color: iconColor }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              fill="none"
              stroke="currentColor"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  /**
   * Handle rename submit
   */
  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== shape.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  /**
   * Handle rename cancel
   */
  const handleRenameCancel = () => {
    setEditName(shape.name || '');
    setIsEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        group relative mb-1 px-2 py-1.5 rounded border cursor-move text-xs
        transition-all duration-150
        ${isSelected ? 'bg-blue-900/50 border-blue-500' : 'bg-gray-800 border-gray-700'}
        ${isDragging ? 'opacity-50' : 'hover:border-gray-600 hover:bg-gray-750'}
        ${isHidden ? 'opacity-40' : ''}
      `}
    >
      {/* Main Content */}
      <div className="flex items-center gap-1.5">
        {/* Drag Handle */}
        <div className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Shape Icon */}
        <div className="flex-shrink-0">
          {getShapeIcon()}
        </div>

        {/* Shape Name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') handleRenameCancel();
            }}
            className="flex-1 px-1.5 py-0.5 text-xs border border-blue-500 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            onClick={onSelect}
            onDoubleClick={() => setIsEditing(true)}
            className="flex-1 text-left text-xs font-medium text-gray-200 truncate hover:text-gray-100 min-w-0"
            title={shape.name || 'Unnamed'}
          >
            {shape.name || 'Unnamed'}
          </button>
        )}

        {/* Visibility Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          title={isHidden ? 'Show layer' : 'Hide layer'}
        >
          {isHidden ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>

        {/* Actions Menu (on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveToTop();
            }}
            className="text-gray-500 hover:text-gray-300"
            title="Move forward (1 layer)"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveToBottom();
            }}
            className="text-gray-500 hover:text-gray-300"
            title="Move backward (1 layer)"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${shape.name || 'this layer'}"?`)) {
                onDelete();
              }
            }}
            className="text-gray-500 hover:text-red-400"
            title="Delete layer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

