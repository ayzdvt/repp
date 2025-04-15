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

// Polyline primitive
export interface PolylineShape {
  type: 'polyline';
  points: Point[];
  thickness: number;
  closed: boolean; // Kapalı mı (son nokta ilk noktaya bağlanacak mı)
}

export function createPolyline(points: Point[] = [], thickness: number = 1, closed: boolean = false): PolylineShape {
  return {
    type: 'polyline',
    points,
    thickness,
    closed
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

// Rectangle fonksiyonu kaldırıldı

// Check if a point is near a line (for selection)
export function pointNearLine(point: Point, line: LineShape, tolerance: number = 10): boolean {
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

// Bir noktanın polyline'a yakın olup olmadığını kontrol eder
export function pointNearPolyline(point: Point, polyline: PolylineShape, tolerance: number = 10): boolean {
  // Polyline'da yeterli nokta yoksa false döndür
  if (polyline.points.length < 2) return false;
  
  // Her bir çizgi segmenti için kontrol et
  for (let i = 0; i < polyline.points.length - 1; i++) {
    const start = polyline.points[i];
    const end = polyline.points[i + 1];
    
    // Geçici bir çizgi nesnesi oluştur
    const lineSegment: LineShape = {
      type: 'line',
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      thickness: polyline.thickness
    };
    
    // Bu segmente yakın mı diye kontrol et
    if (pointNearLine(point, lineSegment, tolerance)) {
      return true;
    }
  }
  
  // Kapalı polyline ise, son nokta ile ilk nokta arasındaki segmenti de kontrol et
  if (polyline.closed && polyline.points.length > 2) {
    const start = polyline.points[polyline.points.length - 1];
    const end = polyline.points[0];
    
    const lineSegment: LineShape = {
      type: 'line',
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      thickness: polyline.thickness
    };
    
    if (pointNearLine(point, lineSegment, tolerance)) {
      return true;
    }
  }
  
  return false;
}

// Çizginin orta noktasını hesaplar
export function getLineMidpoint(line: LineShape): Point {
  return {
    x: (line.startX + line.endX) / 2,
    y: (line.startY + line.endY) / 2
  };
}

// Polyline şeklinin toplam uzunluğunu hesaplar
export function calculatePolylineLength(polyline: PolylineShape): number {
  if (!polyline.points || polyline.points.length < 2) return 0;
  
  let totalLength = 0;
  
  // Tüm segmentleri dolaş ve uzunluklarını topla
  for (let i = 0; i < polyline.points.length - 1; i++) {
    const p1 = polyline.points[i];
    const p2 = polyline.points[i + 1];
    
    // Euclidean mesafeyi hesapla ve toplama ekle
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  
  // Kapalı polyline ise son nokta ile ilk nokta arasındaki mesafeyi de ekle
  if (polyline.closed && polyline.points.length > 2) {
    const first = polyline.points[0];
    const last = polyline.points[polyline.points.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  
  return totalLength;
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
    } else if (shape.type === 'polyline') {
      // Polyline için tüm noktaları kontrol et
      for (let i = 0; i < shape.points.length; i++) {
        const polyPoint = shape.points[i];
        if (distance(point, polyPoint) <= tolerance) {
          snapPoint = { x: polyPoint.x, y: polyPoint.y };
          break;
        }
        
        // Ardışık noktalar arasındaki orta nokta da yakalanabilir
        if (i < shape.points.length - 1) {
          const nextPoint = shape.points[i + 1];
          const midpoint = {
            x: (polyPoint.x + nextPoint.x) / 2,
            y: (polyPoint.y + nextPoint.y) / 2
          };
          
          if (distance(point, midpoint) <= tolerance) {
            snapPoint = midpoint;
            break;
          }
        }
      }
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
