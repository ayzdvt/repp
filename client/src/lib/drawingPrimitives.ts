import { Point } from '@/types';

// Point primitive
export interface PointShape {
  type: 'point';
  x: number;
  y: number;
  style: 'default' | 'square' | 'cross';
}

export function createPoint(x: number, y: number, style: 'default' | 'square' | 'cross' = 'default'): PointShape {
  return {
    type: 'point',
    x,
    y,
    style
  };
}

// Line primitive
export interface LineShape {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
}

export function createLine(startX: number, startY: number, endX: number, endY: number, thickness: number = 1): LineShape {
  return {
    type: 'line',
    startX,
    startY,
    endX,
    endY,
    thickness
  };
}

// Rectangle ve circle primitives kaldırıldı

// Text primitive
export interface TextShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export function createText(x: number, y: number, text: string, fontSize: number = 12): TextShape {
  return {
    type: 'text',
    x,
    y,
    text,
    fontSize
  };
}

// Calculate distance between two points
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Rectangle fonksiyonu kaldırıldı

// Check if a point is near a line (for selection)
export function pointNearLine(point: Point, line: LineShape, tolerance: number = 5): boolean {
  const lineLength = distance(
    { x: line.startX, y: line.startY }, 
    { x: line.endX, y: line.endY }
  );
  
  if (lineLength === 0) return distance(point, { x: line.startX, y: line.startY }) <= tolerance;
  
  // Calculate the distance from point to line
  const t = (
    (point.x - line.startX) * (line.endX - line.startX) + 
    (point.y - line.startY) * (line.endY - line.startY)
  ) / (lineLength * lineLength);
  
  const clampedT = Math.max(0, Math.min(1, t));
  
  const closestX = line.startX + clampedT * (line.endX - line.startX);
  const closestY = line.startY + clampedT * (line.endY - line.startY);
  
  return distance(point, { x: closestX, y: closestY }) <= tolerance;
}

// Circle fonksiyonu kaldırıldı
