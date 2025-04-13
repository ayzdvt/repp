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
  points: Point[];  // bir dizi nokta - (x,y) koordinat çiftleri
  thickness: number;
  closed: boolean;   // kapalı/açık polyline (son noktayı ilk noktaya bağlama)
}

export function createPolyline(points: Point[] = [], thickness: number = 1, closed: boolean = false): PolylineShape {
  return {
    type: 'polyline',
    points: [...points],  // orijinal array'i modifiye etmemek için kopya oluştur
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
// Bir noktanın polyline'a yakın olup olmadığını kontrol et
export function pointNearPolyline(point: Point, polyline: PolylineShape, tolerance: number = 5): boolean {
  const points = polyline.points;
  
  // En az 2 nokta yoksa, polyline oluşturulamaz
  if (points.length < 2) return false;
  
  // Polyline'ın her bir parçasını (çizgi segment'i) kontrol et
  for (let i = 0; i < points.length - 1; i++) {
    // Geçici bir LineShape oluştur ve normal çizgi kontrolünü kullan
    const lineSegment = {
      type: 'line',
      startX: points[i].x,
      startY: points[i].y,
      endX: points[i + 1].x,
      endY: points[i + 1].y,
      thickness: polyline.thickness
    } as LineShape;
    
    if (pointNearLine(point, lineSegment, tolerance)) {
      return true;
    }
  }
  
  // Kapalı polyline ise (son noktayı ilk noktaya bağla), son segment'i de kontrol et
  if (polyline.closed && points.length > 2) {
    const lastSegment = {
      type: 'line',
      startX: points[points.length - 1].x,
      startY: points[points.length - 1].y,
      endX: points[0].x,
      endY: points[0].y,
      thickness: polyline.thickness
    } as LineShape;
    
    if (pointNearLine(point, lastSegment, tolerance)) {
      return true;
    }
  }
  
  return false;
}

// Polyline için snap noktalarını elde et (her köşe noktası snap noktasıdır)
export function getPolylineSnapPoints(polyline: PolylineShape): Point[] {
  // Tüm köşe noktaları snap noktalarıdır
  const snapPoints = [...polyline.points];
  
  // Her segment'in orta noktası da snap noktasıdır
  for (let i = 0; i < polyline.points.length - 1; i++) {
    const p1 = polyline.points[i];
    const p2 = polyline.points[i + 1];
    
    // Orta noktayı ekle
    snapPoints.push({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    });
  }
  
  // Kapalı polyline için, son segment'in orta noktasını da ekle
  if (polyline.closed && polyline.points.length > 2) {
    const p1 = polyline.points[polyline.points.length - 1];
    const p2 = polyline.points[0];
    
    snapPoints.push({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    });
  }
  
  return snapPoints;
}

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
    
    let snapPoints: Point[] = [];
    
    if (shape.type === 'point') {
      // Nokta şekli
      if (distance(point, { x: shape.x, y: shape.y }) <= tolerance) {
        snapPoints.push({ x: shape.x, y: shape.y });
      }
    } else if (shape.type === 'line') {
      // Çizgi şekli - başlangıç, orta ve bitiş noktalarını kontrol et
      const snapPoint = getSnapPoint(point, shape, tolerance);
      if (snapPoint) snapPoints.push(snapPoint);
    } else if (shape.type === 'polyline') {
      // Polyline şekli - tüm snap noktalarını al
      const polylineSnapPoints = getPolylineSnapPoints(shape);
      
      // Her bir snap noktasını kontrol et
      for (const sp of polylineSnapPoints) {
        if (distance(point, sp) <= tolerance) {
          snapPoints.push(sp);
        }
      }
    }
    
    // En yakın yakalama noktasını güncelle
    for (const snapPoint of snapPoints) {
      const dist = distance(point, snapPoint);
      if (dist < minDistance) {
        minDistance = dist;
        nearestSnapPoint = snapPoint;
      }
    }
  }
  
  return nearestSnapPoint;
}
