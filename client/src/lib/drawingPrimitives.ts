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

// Rectangle primitive
export interface RectangleShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createRectangle(x: number, y: number, width: number, height: number): RectangleShape {
  return {
    type: 'rectangle',
    x,
    y,
    width,
    height
  };
}

// Circle primitive
export interface CircleShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export function createCircle(x: number, y: number, radius: number): CircleShape {
  return {
    type: 'circle',
    x,
    y,
    radius
  };
}

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

// Check if a point is inside a rectangle
export function pointInRectangle(point: Point, rect: RectangleShape): boolean {
  return (
    point.x >= rect.x && 
    point.x <= rect.x + rect.width && 
    point.y >= rect.y && 
    point.y <= rect.y + rect.height
  );
}

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

// Check if a point is near a circle (for selection)
export function pointNearCircle(point: Point, circle: CircleShape, tolerance: number = 5): boolean {
  const dist = distance(point, { x: circle.x, y: circle.y });
  return Math.abs(dist - circle.radius) <= tolerance;
}
