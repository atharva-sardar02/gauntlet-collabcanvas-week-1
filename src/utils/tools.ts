// Tool types
export type ToolType = 'select' | 'rectangle' | 'circle' | 'triangle' | 'star' | 'text' | null;

// Tool configuration
export interface Tool {
  id: ToolType;
  name: string;
  icon: string;
  description: string;
  cursor: string;
  shortcut?: string;
}

export const TOOLS: Tool[] = [
  {
    id: 'select',
    name: 'Select',
    icon: '🖱️',
    description: 'Select and move shapes',
    cursor: 'default',
    shortcut: 'V',
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: '▭',
    description: 'Draw rectangles',
    cursor: 'crosshair',
    shortcut: 'R',
  },
  {
    id: 'circle',
    name: 'Circle',
    icon: '●',
    description: 'Draw circles',
    cursor: 'crosshair',
    shortcut: 'C',
  },
  {
    id: 'triangle',
    name: 'Triangle',
    icon: '▲',
    description: 'Draw triangles',
    cursor: 'crosshair',
    shortcut: 'T',
  },
  {
    id: 'star',
    name: 'Star',
    icon: '★',
    description: 'Draw stars',
    cursor: 'crosshair',
    shortcut: 'S',
  },
  {
    id: 'text',
    name: 'Text',
    icon: 'T',
    description: 'Add text',
    cursor: 'text',
    shortcut: 'X',
  },
];

// Get tool by ID
export const getToolById = (id: ToolType): Tool | undefined => {
  return TOOLS.find(tool => tool.id === id);
};

