/**
 * Default system color palettes
 */

export interface Palette {
  id: string;
  name: string;
  colors: string[];
  isDefault: boolean;
  description?: string;
}

/**
 * Material Design Colors
 * https://material.io/design/color/the-color-system.html
 */
export const MATERIAL_PALETTE: Palette = {
  id: 'material',
  name: 'Material Design',
  isDefault: true,
  description: 'Google Material Design color palette',
  colors: [
    '#F44336', // Red
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#8BC34A', // Light Green
    '#CDDC39', // Lime
    '#FFEB3B', // Yellow
    '#FFC107', // Amber
    '#FF9800', // Orange
    '#FF5722', // Deep Orange
  ],
};

/**
 * Tailwind CSS Colors
 * https://tailwindcss.com/docs/customizing-colors
 */
export const TAILWIND_PALETTE: Palette = {
  id: 'tailwind',
  name: 'Tailwind CSS',
  isDefault: true,
  description: 'Tailwind CSS default color palette',
  colors: [
    '#EF4444', // Red 500
    '#F97316', // Orange 500
    '#F59E0B', // Amber 500
    '#EAB308', // Yellow 500
    '#84CC16', // Lime 500
    '#22C55E', // Green 500
    '#10B981', // Emerald 500
    '#14B8A6', // Teal 500
    '#06B6D4', // Cyan 500
    '#0EA5E9', // Sky 500
    '#3B82F6', // Blue 500
    '#6366F1', // Indigo 500
    '#8B5CF6', // Violet 500
    '#A855F7', // Purple 500
    '#D946EF', // Fuchsia 500
    '#EC4899', // Pink 500
  ],
};

/**
 * Grayscale Colors
 */
export const GRAYSCALE_PALETTE: Palette = {
  id: 'grayscale',
  name: 'Grayscale',
  isDefault: true,
  description: 'Shades of gray from white to black',
  colors: [
    '#FFFFFF', // White
    '#F3F4F6', // Gray 100
    '#E5E7EB', // Gray 200
    '#D1D5DB', // Gray 300
    '#9CA3AF', // Gray 400
    '#6B7280', // Gray 500
    '#4B5563', // Gray 600
    '#374151', // Gray 700
    '#1F2937', // Gray 800
    '#111827', // Gray 900
    '#000000', // Black
  ],
};

/**
 * Pastel Colors
 */
export const PASTEL_PALETTE: Palette = {
  id: 'pastel',
  name: 'Pastel',
  isDefault: true,
  description: 'Soft pastel colors',
  colors: [
    '#FFB3BA', // Pastel Pink
    '#FFDFBA', // Pastel Orange
    '#FFFFBA', // Pastel Yellow
    '#BAFFC9', // Pastel Green
    '#BAE1FF', // Pastel Blue
    '#C5B3FF', // Pastel Purple
    '#FFB3E6', // Pastel Magenta
    '#FFD6CC', // Pastel Peach
    '#E0FFE0', // Pastel Mint
    '#F0E6FF', // Pastel Lavender
  ],
};

/**
 * Brand Colors (CollabCanvas)
 */
export const BRAND_PALETTE: Palette = {
  id: 'brand',
  name: 'CollabCanvas Brand',
  isDefault: true,
  description: 'CollabCanvas brand colors',
  colors: [
    '#3B82F6', // Primary Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#1F2937', // Dark Gray
    '#F3F4F6', // Light Gray
  ],
};

/**
 * Vibrant Colors
 */
export const VIBRANT_PALETTE: Palette = {
  id: 'vibrant',
  name: 'Vibrant',
  isDefault: true,
  description: 'Bold and vibrant colors',
  colors: [
    '#FF0000', // Pure Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Lime
    '#00FFFF', // Cyan
    '#0000FF', // Blue
    '#8B00FF', // Violet
    '#FF00FF', // Magenta
  ],
};

/**
 * Earth Tones
 */
export const EARTH_PALETTE: Palette = {
  id: 'earth',
  name: 'Earth Tones',
  isDefault: true,
  description: 'Natural earth tone colors',
  colors: [
    '#8B4513', // Saddle Brown
    '#A0522D', // Sienna
    '#D2691E', // Chocolate
    '#CD853F', // Peru
    '#DEB887', // Burlywood
    '#F4A460', // Sandy Brown
    '#BC8F8F', // Rosy Brown
    '#8B7355', // Wheat Brown
    '#A0826D', // Mocha
    '#C19A6B', // Camel
  ],
};

/**
 * Ocean Colors
 */
export const OCEAN_PALETTE: Palette = {
  id: 'ocean',
  name: 'Ocean',
  isDefault: true,
  description: 'Ocean and water-inspired colors',
  colors: [
    '#001F3F', // Navy
    '#0074D9', // Blue
    '#7FDBFF', // Aqua
    '#39CCCC', // Teal
    '#3D9970', // Olive
    '#2ECC40', // Green
    '#01FF70', // Lime
    '#AAFFAA', // Light Green
  ],
};

/**
 * Sunset Colors
 */
export const SUNSET_PALETTE: Palette = {
  id: 'sunset',
  name: 'Sunset',
  isDefault: true,
  description: 'Warm sunset colors',
  colors: [
    '#FF6B6B', // Coral Red
    '#FF8E53', // Orange
    '#FFA600', // Amber
    '#FFD166', // Yellow
    '#FF87AB', // Pink
    '#C77DFF', // Purple
    '#7209B7', // Deep Purple
    '#3A0CA3', // Indigo
  ],
};

/**
 * All default palettes
 */
export const DEFAULT_PALETTES: Palette[] = [
  BRAND_PALETTE,
  TAILWIND_PALETTE,
  MATERIAL_PALETTE,
  VIBRANT_PALETTE,
  PASTEL_PALETTE,
  GRAYSCALE_PALETTE,
  EARTH_PALETTE,
  OCEAN_PALETTE,
  SUNSET_PALETTE,
];

/**
 * Get a palette by ID
 */
export function getPaletteById(id: string): Palette | undefined {
  return DEFAULT_PALETTES.find(p => p.id === id);
}

/**
 * Get all default palette IDs
 */
export function getDefaultPaletteIds(): string[] {
  return DEFAULT_PALETTES.map(p => p.id);
}

