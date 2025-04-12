// Basic point type
export interface Point {
  x: number;
  y: number;
}

// Canvas size
export interface Size {
  width: number;
  height: number;
}

// Tool types
export type Tool = 'selection' | 'point' | 'line' | 'rectangle' | 'circle' | 'text';

// Canvas state
export interface CanvasState {
  gridSize: number;
  zoom: number;
  panOffset: Point;
  canvasSize: Size;
}

// Shape types
export type ShapeType = 'point' | 'line' | 'rectangle' | 'circle' | 'text';

// Base shape interface
export interface BaseShape {
  type: ShapeType;
}
