import { useEffect, useRef, useState, useContext } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import Konva from 'konva';
import CanvasContext from '../../contexts/CanvasContext';
import CanvasControls from './CanvasControls';
import Shape from './Shape';
import Cursor from '../Collaboration/Cursor';
import { useCursors } from '../../hooks/useCursors';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_CENTER_X,
  CANVAS_CENTER_Y,
  GRID_SPACING,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  MIN_SHAPE_SIZE,
  getViewportDimensions,
  getRandomShapeColor,
} from '../../utils/constants';

const Canvas = () => {
  const context = useContext(CanvasContext);
  
  if (!context) {
    throw new Error('Canvas must be used within a CanvasProvider');
  }

  const { shapes, selectedId, loading, error, setStageRef, selectShape, addShape, updateShape, deleteShape } = context;
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState(getViewportDimensions());
  const [scale, setScale] = useState(DEFAULT_ZOOM);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  
  // Shape drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Cursor tracking
  const { cursors, updateCursorPosition } = useCursors();

  // Set the stage ref in context
  useEffect(() => {
    if (stageRef.current) {
      setStageRef(stageRef);
    }
  }, [setStageRef]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(getViewportDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard events for spacebar panning and delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key functionality
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        const shape = shapes.find(s => s.id === selectedId);
        // Only delete if not locked by another user
        if (shape && !shape.isLocked) {
          deleteShape(selectedId);
        }
        return;
      }

      // Spacebar panning
      if (e.code === 'Space' && !spacePressed && !isDrawing) {
        e.preventDefault();
        setSpacePressed(true);
        if (stageRef.current) {
          stageRef.current.container().style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
        setIsPanning(false);
        if (stageRef.current) {
          stageRef.current.container().style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, selectedId, shapes, deleteShape, isDrawing]);

  // Calculate initial position to center the canvas
  const initialX = -CANVAS_CENTER_X + dimensions.width / 2;
  const initialY = -CANVAS_CENTER_Y + dimensions.height / 2;

  /**
   * Constrain stage position to canvas boundaries
   */
  const constrainPosition = (stage: Konva.Stage) => {
    const scale = stage.scaleX();
    const x = stage.x();
    const y = stage.y();

    const minX = -CANVAS_WIDTH * scale + dimensions.width;
    const maxX = 0;
    const minY = -CANVAS_HEIGHT * scale + dimensions.height;
    const maxY = 0;

    const newX = Math.min(maxX, Math.max(minX, x));
    const newY = Math.min(maxY, Math.max(minY, y));

    stage.position({ x: newX, y: newY });
  };

  /**
   * Get relative pointer position on the canvas
   */
  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return null;

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();

    const pos = stage.getPointerPosition();
    if (!pos) return null;

    return transform.point(pos);
  };

  /**
   * Handle mouse down - start drawing shape or panning
   */
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Panning with middle mouse button or space + left click
    if (e.evt.button === 1 || (spacePressed && e.evt.button === 0)) {
      e.evt.preventDefault();
      setIsPanning(true);
      if (stageRef.current) {
        stageRef.current.container().style.cursor = 'grabbing';
      }
      return;
    }

    // Start drawing shape with left click on empty canvas
    if (e.evt.button === 0 && !spacePressed && e.target === e.target.getStage()) {
      const pos = getRelativePointerPosition();
      if (pos) {
        setIsDrawing(true);
        setNewShape({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        });
      }
    }
  };

  /**
   * Handle mouse move - update shape preview and cursor position
   */
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Update cursor position for other users
    const stage = stageRef.current;
    if (stage) {
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Update cursor position (screen coordinates for other users to see)
        updateCursorPosition(pointerPos.x, pointerPos.y);
      }
    }

    // Handle shape drawing preview
    if (!isDrawing || !newShape) return;

    const pos = getRelativePointerPosition();
    if (!pos) return;

    setNewShape({
      x: Math.min(pos.x, newShape.x),
      y: Math.min(pos.y, newShape.y),
      width: Math.abs(pos.x - newShape.x),
      height: Math.abs(pos.y - newShape.y),
    });
  };

  /**
   * Handle mouse up - finalize shape creation or end panning
   */
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      if (stageRef.current) {
        stageRef.current.container().style.cursor = spacePressed ? 'grab' : 'default';
      }
    }

    if (isDrawing && newShape) {
      // Only create shape if it meets minimum size
      if (newShape.width >= MIN_SHAPE_SIZE && newShape.height >= MIN_SHAPE_SIZE) {
        addShape({
          type: 'rectangle',
          x: newShape.x,
          y: newShape.y,
          width: newShape.width,
          height: newShape.height,
          fill: getRandomShapeColor(),
          createdAt: Date.now(),
        });
      }
      setIsDrawing(false);
      setNewShape(null);
    }
  };

  /**
   * Handle stage drag (panning)
   */
  const handleDragMove = () => {
    if (stageRef.current) {
      constrainPosition(stageRef.current);
    }
  };

  /**
   * Handle zoom with mouse wheel
   */
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.05;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    constrainPosition(stage);
    setScale(newScale);
  };

  /**
   * Handle stage click to deselect shapes
   */
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      selectShape(null);
    }
  };

  /**
   * Handle shape selection
   */
  const handleShapeSelect = (id: string) => {
    selectShape(id);
  };

  /**
   * Handle shape drag end - update shape position
   */
  const handleShapeDragEnd = (id: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateShape(id, {
      x: node.x(),
      y: node.y(),
    });
  };

  /**
   * Reset view to initial position and zoom
   */
  const handleResetView = () => {
    if (stageRef.current) {
      stageRef.current.position({ x: initialX, y: initialY });
      stageRef.current.scale({ x: DEFAULT_ZOOM, y: DEFAULT_ZOOM });
      setScale(DEFAULT_ZOOM);
    }
  };

  /**
   * Zoom in
   */
  const handleZoomIn = () => {
    if (stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const newScale = Math.min(MAX_ZOOM, oldScale * 1.2);
      
      const center = {
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      };

      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      stage.scale({ x: newScale, y: newScale });
      
      const newPos = {
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      constrainPosition(stage);
      setScale(newScale);
    }
  };

  /**
   * Zoom out
   */
  const handleZoomOut = () => {
    if (stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const newScale = Math.max(MIN_ZOOM, oldScale / 1.2);
      
      const center = {
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      };

      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      stage.scale({ x: newScale, y: newScale });
      
      const newPos = {
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      constrainPosition(stage);
      setScale(newScale);
    }
  };

  /**
   * Generate grid lines for visual reference
   */
  const generateGridLines = () => {
    const lines = [];
    
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SPACING) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, CANVAS_HEIGHT]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SPACING) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, CANVAS_WIDTH, i]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    
    return lines;
  };

  // Show loading state while initial shapes load
  if (loading) {
    return (
      <div className="relative w-full flex items-center justify-center" style={{ height: dimensions.height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading canvas...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="relative w-full flex items-center justify-center" style={{ height: dimensions.height }}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold mb-2">Error loading canvas</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: dimensions.height }}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={initialX}
        y={initialY}
        scaleX={scale}
        scaleY={scale}
        draggable={isPanning || spacePressed}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragMove={handleDragMove}
        onWheel={handleWheel}
        onClick={handleStageClick}
      >
        {/* Background Layer */}
        <Layer>
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#f5f5f5"
            listening={false}
          />
          
          {generateGridLines()}
          
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            stroke="#cccccc"
            strokeWidth={2}
            listening={false}
          />
        </Layer>

        {/* Shapes Layer */}
        <Layer>
          {/* Render existing shapes */}
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedId}
              onSelect={() => handleShapeSelect(shape.id)}
              onDragEnd={handleShapeDragEnd(shape.id)}
            />
          ))}

          {/* Preview of shape being drawn */}
          {isDrawing && newShape && newShape.width > 0 && newShape.height > 0 && (
            <Rect
              x={newShape.x}
              y={newShape.y}
              width={newShape.width}
              height={newShape.height}
              fill={getRandomShapeColor()}
              opacity={0.5}
              stroke="#0066ff"
              strokeWidth={2}
              dash={[10, 5]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Canvas Controls */}
      <CanvasControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        currentZoom={scale}
      />

      {/* Canvas Info Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Shapes:</span> {shapes.length}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Zoom:</span> {Math.round(scale * 100)}%
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Users:</span> {Object.keys(cursors).length + 1}
        </p>
        <p className="text-sm text-gray-500 text-xs mt-1">
          Click & Drag to create shapes
        </p>
        <p className="text-sm text-gray-500 text-xs">
          Delete/Backspace to remove
        </p>
      </div>

      {/* Render other users' cursors */}
      {Object.entries(cursors).map(([userId, cursorData]) => (
        <Cursor
          key={userId}
          x={cursorData.cursorX}
          y={cursorData.cursorY}
          color={cursorData.cursorColor}
          name={cursorData.displayName}
        />
      ))}
    </div>
  );
};

export default Canvas;
