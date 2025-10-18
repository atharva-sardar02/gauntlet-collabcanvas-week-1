import React, { useState, useContext } from 'react';
import CanvasContext from '../../contexts/CanvasContext';
import LayerItem from './LayerItem';

interface LayersPanelProps {
  onClose: () => void;
}

/**
 * LayersPanel Component
 * Right-side panel showing all shapes/layers with drag-and-drop reordering
 */
export default function LayersPanel({ onClose }: LayersPanelProps) {
  const context = useContext(CanvasContext);
  
  if (!context) {
    throw new Error('LayersPanel must be used within a CanvasProvider');
  }

  const {
    shapes,
    selectedId,
    selectedIds,
    selectShape,
    selectShapes,
    toggleShapeSelection,
    updateShape,
    updateShapeName,
    deleteShape,
    bringShapeForward,
    sendShapeBackward,
  } = context;

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hiddenShapeIds, setHiddenShapeIds] = useState<Set<string>>(new Set());

  // Sort shapes by zIndex (highest first = top of canvas = top of list)
  const sortedShapes = [...shapes].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  const layersArray = sortedShapes;

  /**
   * Toggle visibility (local UI only - uses opacity)
   */
  const toggleVisibility = (shapeId: string) => {
    const isCurrentlyHidden = hiddenShapeIds.has(shapeId);
    
    if (isCurrentlyHidden) {
      // Show the shape
      setHiddenShapeIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shapeId);
        return newSet;
      });
      // Reset opacity to 1 (or whatever it was)
      updateShape(shapeId, { opacity: 1 });
    } else {
      // Hide the shape
      setHiddenShapeIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(shapeId);
        return newSet;
      });
      // Set opacity to 0.1 to make it mostly invisible but still there
      updateShape(shapeId, { opacity: 0.1 });
    }
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    // Visual feedback (handled by CSS)
  };

  /**
   * Handle drop - reorder layers
   */
  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const draggedShape = layersArray[draggedIndex];
    
    // Calculate how many steps to move
    const stepsToMove = Math.abs(targetIndex - draggedIndex);
    
    // Determine direction
    if (draggedIndex < targetIndex) {
      // Moving down in list = sending backward in z-index
      for (let i = 0; i < stepsToMove; i++) {
        await sendShapeBackward(draggedShape.id);
      }
    } else {
      // Moving up in list = bringing forward in z-index
      for (let i = 0; i < stepsToMove; i++) {
        await bringShapeForward(draggedShape.id);
      }
    }

    setDraggedIndex(null);
  };

  /**
   * Handle selection
   */
  const handleSelect = (shapeId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection for multi-select
      toggleShapeSelection(shapeId);
    } else if (event.shiftKey) {
      // Add to selection
      const newSelection = [...selectedIds, shapeId];
      selectShapes(newSelection);
    } else {
      // Single selection
      selectShape(shapeId);
    }
  };

  return (
    <div className="h-full w-64 bg-gray-900 border-l border-gray-700 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700 bg-gray-800">
        <h2 className="text-base font-semibold text-gray-100">Layers</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          title="Close Layers Panel"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-1.5 bg-gray-900">
        {layersArray.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No layers yet</p>
            <p className="text-sm mt-2">Create shapes to see them here</p>
          </div>
        ) : (
          layersArray.map((shape) => (
            <LayerItem
              key={shape.id}
              shape={shape}
              isSelected={selectedId === shape.id || selectedIds.includes(shape.id)}
              isHidden={hiddenShapeIds.has(shape.id)}
              isDragging={draggedIndex === layersArray.indexOf(shape)}
              onSelect={(e) => handleSelect(shape.id, e)}
              onToggleVisibility={() => toggleVisibility(shape.id)}
              onRename={(newName) => updateShapeName(shape.id, newName)}
              onDelete={() => deleteShape(shape.id)}
              onMoveToTop={() => bringShapeForward(shape.id)}
              onMoveToBottom={() => sendShapeBackward(shape.id)}
              onDragStart={() => handleDragStart(layersArray.indexOf(shape))}
              onDragOver={(e) => handleDragOver(e, layersArray.indexOf(shape))}
              onDrop={() => handleDrop(layersArray.indexOf(shape))}
            />
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-gray-700 bg-gray-800">
        <p className="text-xs text-gray-400">
          {shapes.length} {shapes.length === 1 ? 'layer' : 'layers'}
          {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
        </p>
      </div>
    </div>
  );
}

