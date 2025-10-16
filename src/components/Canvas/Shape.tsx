import { useContext, useRef, useEffect } from 'react';
import { Rect, Circle, Line, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import CanvasContext from '../../contexts/CanvasContext';
import type { Shape as ShapeType } from '../../contexts/CanvasContext';

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}

const Shape = ({ shape, isSelected, onSelect, onDragEnd, onTransformEnd }: ShapeProps) => {
  const context = useContext(CanvasContext);
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const handleDoubleClick = () => {
    if (shape.type === 'text') {
      // Trigger text edit mode - we'll emit a custom event
      window.dispatchEvent(new CustomEvent('editText', { detail: { shapeId: shape.id } }));
    }
  };

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

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    // Don't allow transforming if shape is locked by another user
    if (shape.isLocked && shape.lockedBy !== context?.stageRef?.current) {
      return;
    }
    if (onTransformEnd) {
      onTransformEnd(e);
    }
  };

  const commonProps = {
    ref: shapeRef,
    id: shape.id,
    x: shape.x,
    y: shape.y,
    fill: shape.type === 'text' ? 'white' : shape.fill, // Force white for text
    stroke: isSelected ? (shape.type === 'text' ? '#FFD700' : '#0066ff') : shape.isLocked ? shape.lockedByColor || '#ff0000' : undefined,
    strokeWidth: isSelected || shape.isLocked ? (shape.type === 'text' ? 2 : 3) : 0,
    draggable: !shape.isLocked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    shadowBlur: isSelected ? 10 : 0,
    shadowColor: isSelected ? (shape.type === 'text' ? '#FFD700' : '#0066ff') : undefined,
    shadowOpacity: isSelected ? 0.5 : 0,
  };

  const renderShape = () => {
    switch (shape.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={shape.width}
            height={shape.height}
          />
        );

      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={Math.min(shape.width, shape.height) / 2}
          />
        );

      case 'triangle':
        const halfWidth = shape.width / 2;
        return (
          <Line
            {...commonProps}
            points={[
              halfWidth, 0,                    // Top point
              shape.width, shape.height,       // Bottom right
              0, shape.height,                 // Bottom left
            ]}
            closed
          />
        );

      case 'text':
        return (
          <Text
            {...commonProps}
            text={shape.text || 'Double-click to edit'}
            fontSize={shape.fontSize || 16}
            fontFamily={shape.fontFamily || 'Arial'}
            fontStyle={shape.fontStyle || 'normal'}
            textDecoration={shape.textDecoration || ''}
            width={shape.width}
            height={shape.height}
            align="center"
            verticalAlign="middle"
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderShape()}
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

