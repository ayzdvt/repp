// Basic point type
export interface Point {
  x: number;
  y: number;
  isExtension?: boolean;
  lineStart?: Point;
  lineEnd?: Point;
}

// Canvas size
export interface Size {
  width: number;
  height: number;
}

// Tool types
export type Tool = 'selection' | 'point' | 'line' | 'polyline' | 'text';

// Canvas state
export interface CanvasState {
  gridSize: number;
  zoom: number;
  panOffset: Point;
  canvasSize: Size;
}

// Shape types
export type ShapeType = 'point' | 'line' | 'polyline' | 'text';

// Base shape interface
export interface BaseShape {
  type: ShapeType;
}
