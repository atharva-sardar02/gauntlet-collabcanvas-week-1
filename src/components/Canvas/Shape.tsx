import { useContext, useRef, useEffect, useState } from 'react';
import { Rect, Circle, Line, Text, Transformer, Star, Group, Label, Tag } from 'react-konva';
import Konva from 'konva';
import CanvasContext from '../../contexts/CanvasContext';
import { useAuth } from '../../hooks/useAuth';
import type { Shape as ShapeType } from '../../contexts/CanvasContext';

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
}

const Shape = ({ shape, isSelected, onSelect, onDragEnd, onTransformEnd, onContextMenu }: ShapeProps) => {
  const context = useContext(CanvasContext);
  const { currentUser } = useAuth();
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Get user display name for the last editor
  const getEditorName = () => {
    if (!shape.lastModifiedBy) return null;
    
    // If it's the current user
    if (currentUser && shape.lastModifiedBy === currentUser.uid) {
      return 'You';
    }
    
    // Use the stored name if available
    if (shape.lastModifiedByName) {
      return shape.lastModifiedByName;
    }
    
    // Try to get name from lockedByName (if shape was locked)
    if (shape.lockedByName && shape.lockedBy === shape.lastModifiedBy) {
      return shape.lockedByName;
    }
    
    // Fallback: show user ID (first 8 chars)
    return shape.lastModifiedBy.substring(0, 8);
  };
  
  const editorName = getEditorName();

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

  // Different selection styles for text vs other shapes
  const commonProps = {
    ref: shapeRef,
    id: shape.id,
    x: shape.x,
    y: shape.y,
    // Text: yellow when selected, white when not selected
    // Other shapes: keep their fill color
    fill: shape.type === 'text' 
      ? (isSelected ? '#FFD700' : 'white')  // Yellow when selected, white when not
      : shape.fill,
    // Other shapes: white border when selected OR hovered (for translucent shapes)
    // Text: no border
    stroke: (isSelected || isHovered) && shape.type !== 'text'
      ? 'white'
      : shape.isLocked ? shape.lockedByColor || '#ff0000' : undefined,
    strokeWidth: (isSelected || isHovered) && shape.type !== 'text' || shape.isLocked 
      ? 2 
      : 0,
    draggable: !shape.isLocked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onContextMenu: onContextMenu,
    // Hover effect: make shape translucent to see through it
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    opacity: isHovered ? 0.4 : 1, // 40% opacity when hovered, fully opaque otherwise
    // Other shapes: solid border with glow
    // Text shapes: no border, no glow
    shadowBlur: isSelected && shape.type !== 'text' ? 5 : 0,
    shadowColor: isSelected && shape.type !== 'text' ? 'white' : undefined,
    shadowOpacity: isSelected && shape.type !== 'text' ? 0.8 : 0,
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
        // Circle is centered, so we need to adjust position to match other shapes
        const circleRadius = Math.min(shape.width, shape.height) / 2;
        return (
          <Circle
            {...commonProps}
            x={shape.x + shape.width / 2}  // Center the circle horizontally
            y={shape.y + shape.height / 2}  // Center the circle vertically
            radius={circleRadius}
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

      case 'star':
        // Star is centered, so we need to adjust position to match other shapes
        const starRadius = Math.min(shape.width, shape.height) / 2;
        return (
          <Star
            {...commonProps}
            x={shape.x + shape.width / 2}  // Center the star horizontally
            y={shape.y + shape.height / 2}  // Center the star vertically
            numPoints={5}
            innerRadius={starRadius * 0.5}
            outerRadius={starRadius}
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
      <Group>
        {renderShape()}
        
        {/* Show editor badge on hover or if recently edited (within 10 seconds) */}
        {editorName && shape.lastModifiedAt && (Date.now() - shape.lastModifiedAt < 10000) && (
          <Label
            x={shape.x + 5}
            y={shape.y + 5}
            opacity={0.9}
          >
            <Tag
              fill="#1f2937"
              pointerDirection=""
              lineJoin="round"
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={0.3}
            />
            <Text
              text={`✏️ ${editorName}`}
              fontSize={10}
              fontFamily="Arial"
              fill="white"
              padding={4}
            />
          </Label>
        )}
      </Group>
      
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

