import { useEffect, useRef, useState, useContext } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import Konva from 'konva';
import CanvasContext from '../../contexts/CanvasContext';
import CanvasControls from './CanvasControls';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_CENTER_X,
  CANVAS_CENTER_Y,
  GRID_SPACING,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  getViewportDimensions,
} from '../../utils/constants';

const Canvas = () => {
  const context = useContext(CanvasContext);
  
  if (!context) {
    throw new Error('Canvas must be used within a CanvasProvider');
  }

  const { setStageRef, selectShape } = context;
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState(getViewportDimensions());
  const [scale, setScale] = useState(DEFAULT_ZOOM);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

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

  // Handle keyboard events for spacebar panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
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
  }, [spacePressed]);

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
   * Handle mouse down for panning
   */
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Enable panning with middle mouse button or space + left click
    if (e.evt.button === 1 || (spacePressed && e.evt.button === 0)) {
      e.evt.preventDefault();
      setIsPanning(true);
      if (stageRef.current) {
        stageRef.current.container().style.cursor = 'grabbing';
      }
    }
  };

  /**
   * Handle mouse up for panning
   */
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      if (stageRef.current) {
        stageRef.current.container().style.cursor = spacePressed ? 'grab' : 'default';
      }
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

    // Calculate new scale
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.05;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Constrain scale
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
    // Deselect if clicking on stage background
    if (e.target === e.target.getStage()) {
      selectShape(null);
    }
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
   * Creates vertical and horizontal lines at GRID_SPACING intervals
   */
  const generateGridLines = () => {
    const lines = [];
    
    // Vertical lines
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
    
    // Horizontal lines
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
        onMouseUp={handleMouseUp}
        onDragMove={handleDragMove}
        onWheel={handleWheel}
        onClick={handleStageClick}
      >
        {/* Background Layer */}
        <Layer>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#f5f5f5"
            listening={false}
          />
          
          {/* Grid lines */}
          {generateGridLines()}
          
          {/* Canvas border */}
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

        {/* Shapes Layer (will be populated later) */}
        <Layer>
          {/* Shapes will be rendered here in future tasks */}
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
          <span className="font-semibold">Canvas:</span> {CANVAS_WIDTH}x{CANVAS_HEIGHT}px
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Zoom:</span> {Math.round(scale * 100)}%
        </p>
        <p className="text-sm text-gray-500 text-xs mt-1">
          Space + Drag or Middle Mouse to Pan
        </p>
      </div>
    </div>
  );
};

export default Canvas;
