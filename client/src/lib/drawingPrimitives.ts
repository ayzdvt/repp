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

// Çizginin orta noktasını hesaplar
export function getLineMidpoint(line: LineShape): Point {
  return {
    x: (line.startX + line.endX) / 2,
    y: (line.startY + line.endY) / 2
  };
}

// Bir nokta çizginin başlangıç, orta veya bitiş noktasına yakın mı kontrol eder
export function getSnapPoint(point: Point, line: LineShape, tolerance: number = 10): Point | null {
  // Başlangıç noktasını kontrol et
  if (distance(point, { x: line.startX, y: line.startY }) <= tolerance) {
    return { x: line.startX, y: line.startY };
  }
  
  // Bitiş noktasını kontrol et
  if (distance(point, { x: line.endX, y: line.endY }) <= tolerance) {
    return { x: line.endX, y: line.endY };
  }
  
  // Orta noktayı kontrol et
  const midpoint = getLineMidpoint(line);
  if (distance(point, midpoint) <= tolerance) {
    return midpoint;
  }
  
  return null;
}

// Verilen noktaya en yakın yakalama noktasını bulur (tüm şekilleri kontrol eder)
export function findNearestSnapPoint(
  point: Point, 
  shapes: any[], 
  tolerance: number = 10,
  excludeShapeId?: number // Dışlanacak şeklin ID'si (kendisine snap yapmaması için)
): Point | null {
  let nearestSnapPoint: Point | null = null;
  let minDistance = tolerance;
  
  for (const shape of shapes) {
    // Eğer bu şekil dışlanacaksa, atla
    if (excludeShapeId !== undefined && shape.id === excludeShapeId) {
      continue;
    }
    
    let snapPoint: Point | null = null;
    
    if (shape.type === 'point') {
      // Nokta şekli
      if (distance(point, { x: shape.x, y: shape.y }) <= tolerance) {
        snapPoint = { x: shape.x, y: shape.y };
      }
    } else if (shape.type === 'line') {
      // Çizgi şekli - başlangıç, orta ve bitiş noktalarını kontrol et
      snapPoint = getSnapPoint(point, shape, tolerance);
    }
    
    // En yakın yakalama noktasını güncelle
    if (snapPoint) {
      const dist = distance(point, snapPoint);
      if (dist < minDistance) {
        minDistance = dist;
        nearestSnapPoint = snapPoint;
      }
    }
  }
  
  return nearestSnapPoint;
}
