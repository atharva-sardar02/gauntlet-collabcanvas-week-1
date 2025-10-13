import { useContext, useRef, useEffect } from 'react';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import CanvasContext from '../../contexts/CanvasContext';
import type { Shape as ShapeType } from '../../contexts/CanvasContext';

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

const Shape = ({ shape, isSelected, onSelect, onDragEnd }: ShapeProps) => {
  const context = useContext(CanvasContext);
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Attach transformer to selected shape
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Don't allow dragging if shape is locked by another user
    if (shape.isLocked && shape.lockedBy !== context?.stageRef?.current) {
      return;
    }
    onDragEnd(e);
  };

  return (
    <>
      <Rect
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={isSelected ? '#0066ff' : shape.isLocked ? shape.lockedByColor || '#ff0000' : undefined}
        strokeWidth={isSelected || shape.isLocked ? 3 : 0}
        draggable={!shape.isLocked}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        shadowBlur={isSelected ? 10 : 0}
        shadowColor={isSelected ? '#0066ff' : undefined}
        shadowOpacity={isSelected ? 0.5 : 0}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default Shape;

