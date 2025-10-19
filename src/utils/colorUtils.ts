/**
 * Color utility functions for conversions and validation
 */

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export interface Color {
  hex: string;
  rgb: RGB;
  hsv: HSV;
  opacity: number; // 0-1
}

/**
 * Convert hex color to RGB
 * @param hex - Hex color string (e.g., "#3B82F6" or "3B82F6")
 * @returns RGB object
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Convert RGB to hex color
 * @param rgb - RGB object
 * @returns Hex color string (e.g., "#3B82F6")
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Convert RGB to HSV
 * @param rgb - RGB object
 * @returns HSV object
 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  let s = 0;
  const v = max;
  
  if (delta !== 0) {
    s = delta / max;
    
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert HSV to RGB
 * @param hsv - HSV object
 * @returns RGB object
 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  let r = 0, g = 0, b = 0;
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert hex to HSV
 * @param hex - Hex color string
 * @returns HSV object
 */
export function hexToHsv(hex: string): HSV {
  return rgbToHsv(hexToRgb(hex));
}

/**
 * Convert HSV to hex
 * @param hsv - HSV object
 * @returns Hex color string
 */
export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv));
}

/**
 * Validate hex color format
 * @param hex - Hex color string
 * @returns True if valid hex color
 */
export function isValidHex(hex: string): boolean {
  const cleanHex = hex.replace('#', '');
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex);
}

/**
 * Add opacity/alpha to hex color
 * @param hex - Hex color string
 * @param opacity - Opacity value (0-1)
 * @returns RGBA string
 */
export function hexToRgba(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Parse color from any format to normalized Color object
 * @param input - Color string (hex, rgb, rgba, etc.)
 * @param defaultOpacity - Default opacity if not specified
 * @returns Color object
 */
export function parseColor(input: string, defaultOpacity: number = 1): Color {
  // Handle hex format
  if (input.startsWith('#')) {
    const hex = input;
    const rgb = hexToRgb(hex);
    const hsv = rgbToHsv(rgb);
    return { hex, rgb, hsv, opacity: defaultOpacity };
  }
  
  // Handle rgba format
  if (input.startsWith('rgba')) {
    const match = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const rgb: RGB = {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
      const opacity = match[4] ? parseFloat(match[4]) : defaultOpacity;
      const hex = rgbToHex(rgb);
      const hsv = rgbToHsv(rgb);
      return { hex, rgb, hsv, opacity };
    }
  }
  
  // Default to black if parsing fails
  return {
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    hsv: { h: 0, s: 0, v: 0 },
    opacity: defaultOpacity,
  };
}

/**
 * Get color luminance (brightness)
 * @param hex - Hex color string
 * @returns Luminance value (0-1)
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  // Relative luminance formula
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

/**
 * Determine if color is light or dark
 * @param hex - Hex color string
 * @returns True if light color
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5;
}

/**
 * Get contrasting text color (black or white) for background
 * @param hex - Background hex color
 * @returns '#000000' or '#FFFFFF'
 */
export function getContrastingColor(hex: string): string {
  return isLightColor(hex) ? '#000000' : '#FFFFFF';
}

/**
 * Lighten a color by a percentage
 * @param hex - Hex color string
 * @param percent - Percentage to lighten (0-100)
 * @returns Lightened hex color
 */
export function lightenColor(hex: string, percent: number): string {
  const hsv = hexToHsv(hex);
  const newV = Math.min(100, hsv.v + percent);
  return hsvToHex({ ...hsv, v: newV });
}

/**
 * Darken a color by a percentage
 * @param hex - Hex color string
 * @param percent - Percentage to darken (0-100)
 * @returns Darkened hex color
 */
export function darkenColor(hex: string, percent: number): string {
  const hsv = hexToHsv(hex);
  const newV = Math.max(0, hsv.v - percent);
  return hsvToHex({ ...hsv, v: newV });
}

