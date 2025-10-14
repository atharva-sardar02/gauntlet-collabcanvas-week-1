// Tool types
export type ToolType = 'select' | 'rectangle' | null;

// Tool configuration
export interface Tool {
  id: ToolType;
  name: string;
  icon: string;
  description: string;
  cursor: string;
}

export const TOOLS: Tool[] = [
  {
    id: 'select',
    name: 'Select',
    icon: '🖱️',
    description: 'Select and move shapes',
    cursor: 'default',
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: '▭',
    description: 'Draw rectangles',
    cursor: 'crosshair',
  },
];

// Get tool by ID
export const getToolById = (id: ToolType): Tool | undefined => {
  return TOOLS.find(tool => tool.id === id);
};

