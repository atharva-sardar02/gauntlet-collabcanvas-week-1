import { BulkCreateShapesArgs, CreateComplexLayoutArgs } from '../schemas/tools';

/**
 * Geometry Executors
 * Server-side computation for bulk operations
 * Computes coordinates in <10ms for 500+ shapes
 */

export interface ComputedShape {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  blendMode?: string;
  rotation?: number;
  text?: string;
  fontSize?: number;
}

/**
 * Execute bulk create shapes with pattern-based layout
 */
export function executeBulkCreateShapes(args: BulkCreateShapesArgs): ComputedShape[] {
  const shapes: ComputedShape[] = [];
  const { pattern, shape, count, style, layout } = args;

  const shapeWidth = style?.width || 50;
  const shapeHeight = style?.height || 50;
  const fill = style?.fill || '#3B82F6';
  const stroke = style?.stroke;
  const opacity = style?.opacity || 1;
  const blendMode = style?.blendMode || 'source-over';
  const spacing = layout?.spacing || 10;
  const origin = layout?.origin || { x: 100, y: 100 };

  switch (pattern) {
    case 'grid': {
      // Calculate rows and cols if not provided
      let rows = layout?.rows || Math.ceil(Math.sqrt(count));
      let cols = layout?.cols || Math.ceil(count / rows);
      
      let shapeIndex = 0;
      for (let r = 0; r < rows && shapeIndex < count; r++) {
        for (let c = 0; c < cols && shapeIndex < count; c++) {
          shapes.push({
            type: shape,
            x: origin.x + c * (shapeWidth + spacing),
            y: origin.y + r * (shapeHeight + spacing),
            width: shapeWidth,
            height: shapeHeight,
            fill,
            stroke,
            opacity,
            blendMode,
          });
          shapeIndex++;
        }
      }
      break;
    }

    case 'row': {
      for (let i = 0; i < count; i++) {
        shapes.push({
          type: shape,
          x: origin.x + i * (shapeWidth + spacing),
          y: origin.y,
          width: shapeWidth,
          height: shapeHeight,
          fill,
          stroke,
          opacity,
          blendMode,
        });
      }
      break;
    }

    case 'column': {
      for (let i = 0; i < count; i++) {
        shapes.push({
          type: shape,
          x: origin.x,
          y: origin.y + i * (shapeHeight + spacing),
          width: shapeWidth,
          height: shapeHeight,
          fill,
          stroke,
          opacity,
          blendMode,
        });
      }
      break;
    }

    case 'circle': {
      const radius = layout?.radius || 200;
      const angleStep = (2 * Math.PI) / count;
      
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        shapes.push({
          type: shape,
          x: origin.x + radius * Math.cos(angle) - shapeWidth / 2,
          y: origin.y + radius * Math.sin(angle) - shapeHeight / 2,
          width: shapeWidth,
          height: shapeHeight,
          fill,
          stroke,
          opacity,
          blendMode,
        });
      }
      break;
    }

    case 'spiral': {
      const radius = layout?.radius || 200;
      const angleStep = (2 * Math.PI) / 10; // One full rotation every 10 shapes
      
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const spiralRadius = (radius / count) * i;
        shapes.push({
          type: shape,
          x: origin.x + spiralRadius * Math.cos(angle) - shapeWidth / 2,
          y: origin.y + spiralRadius * Math.sin(angle) - shapeHeight / 2,
          width: shapeWidth,
          height: shapeHeight,
          fill,
          stroke,
          opacity,
          blendMode,
        });
      }
      break;
    }
  }

  return shapes;
}

/**
 * Execute complex layout creation
 */
export function executeCreateComplexLayout(args: CreateComplexLayoutArgs): ComputedShape[] {
  const shapes: ComputedShape[] = [];
  const { type, config, position } = args;
  const { x, y } = position || { x: 100, y: 100 };
  const style = config?.style || {};
  const primaryColor = style.primaryColor || '#3B82F6';
  const backgroundColor = style.backgroundColor || '#FFFFFF';
  const textColor = style.textColor || '#000000';

  switch (type) {
    case 'login_form': {
      const formWidth = 400;
      const formHeight = 350;
      const padding = 30;
      
      // Layer 1: Background shadow (bottom-most) - kept!
      shapes.push({
        type: 'rectangle',
        x: x - 10,
        y: y - 10,
        width: formWidth + 20,
        height: formHeight + 20,
        fill: '#1F2937', // Dark gray shadow
        opacity: 0.3,
      });
      
      // Layer 2: Input fields (middle layer)
      // Username field
      shapes.push({
        type: 'rectangle',
        x: x + padding,
        y: y + 105,
        width: formWidth - padding * 2,
        height: 45,
        fill: '#F9FAFB',
        stroke: '#D1D5DB',
      });

      // Password field
      shapes.push({
        type: 'rectangle',
        x: x + padding,
        y: y + 190,
        width: formWidth - padding * 2,
        height: 45,
        fill: '#F9FAFB',
        stroke: '#D1D5DB',
      });

      // Login button
      shapes.push({
        type: 'rectangle',
        x: x + padding,
        y: y + 260,
        width: formWidth - padding * 2,
        height: 50,
        fill: primaryColor,
      });
      
      // Layer 3: All text elements (top layer - added last for highest z-index)
      // Title
      shapes.push({
        type: 'text',
        text: config?.title || 'Welcome Back',
        x: x + formWidth / 2 - 80,
        y: y + padding,
        width: 160,
        height: 30,
        fontSize: 28,
        fill: '#111827', // Dark text for contrast
      });
      
      // Username label
      shapes.push({
        type: 'text',
        text: 'Username',
        x: x + padding,
        y: y + 80,
        width: 80,
        height: 20,
        fontSize: 14,
        fill: '#374151', // Dark gray
      });
      
      // Password label
      shapes.push({
        type: 'text',
        text: 'Password',
        x: x + padding,
        y: y + 165,
        width: 80,
        height: 20,
        fontSize: 14,
        fill: '#374151', // Dark gray
      });
      
      // Button text (on top, contrasting)
      shapes.push({
        type: 'text',
        text: 'Sign In',
        x: x + formWidth / 2 - 40,
        y: y + 275,
        width: 80,
        height: 20,
        fontSize: 16,
        fill: '#FFFFFF',
      });
      break;
    }

    case 'navbar': {
      const items = config?.items || ['Home', 'About', 'Services', 'Contact'];
      
      // Navbar background
      shapes.push({
        type: 'rectangle',
        x,
        y,
        width: 800,
        height: 60,
        fill: primaryColor,
      });

      // Logo/Title
      shapes.push({
        type: 'text',
        text: config?.title || 'Logo',
        x: x + 20,
        y: y + 25,
        width: 100,
        height: 30,
        fontSize: 20,
        fill: '#FFFFFF',
      });

      // Menu items
      items.forEach((item, i) => {
        shapes.push({
          type: 'rectangle',
          x: x + 200 + i * 120,
          y: y + 15,
          width: 100,
          height: 30,
          fill: 'transparent',
          stroke: '#FFFFFF',
        });
        shapes.push({
          type: 'text',
          text: item,
          x: x + 230 + i * 120,
          y: y + 27,
          width: 60,
          height: 20,
          fontSize: 14,
          fill: '#FFFFFF',
        });
      });
      break;
    }

    case 'card': {
      // Card background
      shapes.push({
        type: 'rectangle',
        x,
        y,
        width: 300,
        height: 400,
        fill: backgroundColor,
        stroke: '#E5E7EB',
      });

      // Image placeholder
      shapes.push({
        type: 'rectangle',
        x: x + 20,
        y: y + 20,
        width: 260,
        height: 180,
        fill: '#F3F4F6',
        stroke: '#D1D5DB',
      });

      // Title
      shapes.push({
        type: 'text',
        text: config?.title || 'Card Title',
        x: x + 20,
        y: y + 220,
        width: 200,
        height: 30,
        fontSize: 18,
        fill: textColor,
      });

      // Description lines
      for (let i = 0; i < 3; i++) {
        shapes.push({
          type: 'rectangle',
          x: x + 20,
          y: y + 260 + i * 30,
          width: 260,
          height: 15,
          fill: '#F3F4F6',
        });
      }

      // Button
      shapes.push({
        type: 'rectangle',
        x: x + 20,
        y: y + 350,
        width: 260,
        height: 35,
        fill: primaryColor,
      });
      shapes.push({
        type: 'text',
        text: 'Learn More',
        x: x + 110,
        y: y + 362,
        width: 80,
        height: 20,
        fontSize: 14,
        fill: '#FFFFFF',
      });
      break;
    }

    case 'button_group': {
      const items = config?.items || ['Option 1', 'Option 2', 'Option 3'];
      
      items.forEach((item, i) => {
        shapes.push({
          type: 'rectangle',
          x: x + i * 120,
          y,
          width: 110,
          height: 40,
          fill: i === 0 ? primaryColor : backgroundColor,
          stroke: primaryColor,
        });
        shapes.push({
          type: 'text',
          text: item,
          x: x + 20 + i * 120,
          y: y + 15,
          width: 70,
          height: 20,
          fontSize: 14,
          fill: i === 0 ? '#FFFFFF' : textColor,
        });
      });
      break;
    }

    case 'form': {
      const fields = config?.fields || ['Name', 'Email', 'Message'];
      
      // Form title
      shapes.push({
        type: 'text',
        text: config?.title || 'Contact Form',
        x: x + 150,
        y: y + 20,
        width: 150,
        height: 30,
        fontSize: 22,
        fill: textColor,
      });

      // Form fields
      fields.forEach((field, i) => {
        shapes.push({
          type: 'rectangle',
          x: x + 50,
          y: y + 60 + i * 60,
          width: 350,
          height: 45,
          fill: backgroundColor,
          stroke: '#D1D5DB',
        });
        shapes.push({
          type: 'text',
          text: field,
          x: x + 60,
          y: y + 77 + i * 60,
          width: 100,
          height: 20,
          fontSize: 14,
          fill: '#6B7280',
        });
      });

      // Submit button
      const submitY = y + 60 + fields.length * 60 + 20;
      shapes.push({
        type: 'rectangle',
        x: x + 50,
        y: submitY,
        width: 350,
        height: 45,
        fill: primaryColor,
      });
      shapes.push({
        type: 'text',
        text: 'Submit',
        x: x + 200,
        y: submitY + 17,
        width: 60,
        height: 20,
        fontSize: 16,
        fill: '#FFFFFF',
      });
      break;
    }

    case 'dashboard': {
      // Dashboard header
      shapes.push({
        type: 'rectangle',
        x,
        y,
        width: 1000,
        height: 80,
        fill: primaryColor,
      });
      shapes.push({
        type: 'text',
        text: config?.title || 'Dashboard',
        x: x + 20,
        y: y + 30,
        width: 150,
        height: 30,
        fontSize: 24,
        fill: '#FFFFFF',
      });

      // Stat cards (3 cards)
      for (let i = 0; i < 3; i++) {
        shapes.push({
          type: 'rectangle',
          x: x + 20 + i * 330,
          y: y + 100,
          width: 300,
          height: 120,
          fill: backgroundColor,
          stroke: '#E5E7EB',
        });
        shapes.push({
          type: 'text',
          text: `Metric ${i + 1}`,
          x: x + 40 + i * 330,
          y: y + 120,
          width: 150,
          height: 20,
          fontSize: 16,
          fill: textColor,
        });
        shapes.push({
          type: 'text',
          text: `${(i + 1) * 1234}`,
          x: x + 40 + i * 330,
          y: y + 160,
          width: 100,
          height: 30,
          fontSize: 32,
          fill: primaryColor,
        });
      }
      break;
    }
  }

  return shapes;
}

