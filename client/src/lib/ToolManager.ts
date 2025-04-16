// ToolManager.ts
// Çizim araçlarını yöneten sınıf ve fonksiyonlar

import { CanvasState, Point, Tool } from '../types/canvas';
import { screenToWorld, worldToScreen, findNearestSnapPoint } from './canvasUtils';
import { distance, pointNearLine, pointNearPolyline } from './drawingPrimitives';

/**
 * Seçim fonksiyonları
 */

// Çizgi uç noktasına yakınlık kontrolü
export function isNearLineStart(line: any, point: Point, tolerance: number): boolean {
  const dist = distance(point, { x: line.startX, y: line.startY });
  return dist <= tolerance;
}

// Çizgi bitiş noktasına yakınlık kontrolü
export function isNearLineEnd(line: any, point: Point, tolerance: number): boolean {
  const dist = distance(point, { x: line.endX, y: line.endY });
  return dist <= tolerance;
}

// Çizginin hangi uç noktasına yakın olduğunu belirle
export function getLineEndpoint(line: any, point: Point, tolerance: number): 'start' | 'end' | null {
  if (isNearLineStart(line, point, tolerance)) {
    return 'start';
  } else if (isNearLineEnd(line, point, tolerance)) {
    return 'end';
  }
  return null;
}

// Polyline'ın vertex noktalarından birine yakınlık kontrolü
export function getPolylineVertexAtPoint(polyline: any, point: Point, tolerance: number): number | null {
  if (!polyline.points || !Array.isArray(polyline.points) || polyline.points.length === 0) {
    return null;
  }
  
  for (let i = 0; i < polyline.points.length; i++) {
    const vertex = polyline.points[i];
    
    // Nokta ile vertex arasındaki mesafeyi hesapla
    const dist = distance(point, vertex);
    
    // Eğer mesafe toleransın içindeyse, bu noktanın indeksini döndür
    if (dist <= tolerance) {
      return i; // Taşınacak noktanın indeksi
    }
  }
  
  return null; // Hiçbir nokta tolerans içinde değil
}

/**
 * Bir nokta etrafında şekil arayan fonksiyon
 */
export function findShapeAtPoint(
  point: Point, 
  shapes: any[], 
  canvasState: CanvasState, 
  selectedShapeId: number | null,
  activeTool: Tool
): { shape: any, endpoint: string | null, vertexIndex: number | null } | null {
  // Zoom seviyesine göre seçim toleransını hesapla
  // Zoom büyükse tolerans düşük, zoom küçükse tolerans yüksek olmalı
  const baseTolerance = 20; // Baz tolerans değeri artırıldı - daha kolay seçim için
  const zoomAdjustedTolerance = baseTolerance / canvasState.zoom;
  
  // En düşük ve en yüksek tolerans sınırları
  const minTolerance = 5;  // Min değer artırıldı - düşük zoomlarda bile seçilebilir
  const maxTolerance = 25; // Max değer artırıldı - yüksek zoomlarda bile seçilebilir
  
  // Toleransı sınırlar içinde tut
  const tolerance = Math.min(Math.max(zoomAdjustedTolerance, minTolerance), maxTolerance);
  
  // Eğer zaten bir şekil seçiliyse, özel durumları kontrol et
  if (selectedShapeId !== null && activeTool === 'selection') {
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    
    // Çizgi seçiliyse uç noktalarına tıklandığını kontrol et
    if (selectedShape && selectedShape.type === 'line') {
      // Eğer çizginin uç noktalarından birine tıklandıysa
      const endpoint = getLineEndpoint(selectedShape, point, tolerance * 1.5); // Biraz daha geniş tolerans
      
      if (endpoint) {
        // Uç noktası belirlendi
        return { 
          shape: selectedShape, 
          endpoint: endpoint, 
          vertexIndex: null 
        };
      }
    } 
    // Polyline seçiliyse noktalarına tıklandığını kontrol et
    else if (selectedShape && selectedShape.type === 'polyline') {
      // Polyline noktalarından birine tıklandı mı?
      const vertexIndex = getPolylineVertexAtPoint(selectedShape, point, tolerance * 1.5);
      
      if (vertexIndex !== null) {
        // Polyline vertex noktası belirlendi
        return { 
          shape: selectedShape, 
          endpoint: 'vertex', 
          vertexIndex: vertexIndex 
        };
      }
    }
  }
  
  // Normal şekil arama devam ediyor
  // Check shapes in reverse order (last drawn on top)
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    
    switch (shape.type) {
      case 'point':
        // For a point, check if the click is within a small radius
        if (distance(point, { x: shape.x, y: shape.y }) <= tolerance) {
          return { shape, endpoint: null, vertexIndex: null };
        }
        break;
        
      case 'line':
        // Önce uç noktaları kontrol et
        const endpoint = getLineEndpoint(shape, point, tolerance);
        if (endpoint) {
          return { shape, endpoint, vertexIndex: null };
        }
        
        // Sonra çizginin üzerini kontrol et
        if (pointNearLine(point, shape, tolerance)) {
          return { shape, endpoint: null, vertexIndex: null };
        }
        break;
        
      case 'polyline':
        // Önce vertex noktalarını kontrol et
        const vertexIndex = getPolylineVertexAtPoint(shape, point, tolerance);
        if (vertexIndex !== null) {
          return { shape, endpoint: 'vertex', vertexIndex };
        }
        
        // Sonra çizgi üzerini kontrol et
        if (pointNearPolyline(point, shape, tolerance)) {
          return { shape, endpoint: null, vertexIndex: null };
        }
        break;
        
      case 'text':
        // For text, simplified check using a rectangular area
        // Would need more sophisticated checking for actual text bounds
        // Create a bounding box for the text
        const textBounds = {
          x: shape.x,
          y: shape.y - shape.fontSize, // Estimated top of text
          width: (shape.text.length * shape.fontSize) / 1.5, // Rough estimate
          height: shape.fontSize * 1.2 // Rough estimate
        };
        
        // Check if the point is inside the bounding box
        if (
          point.x >= textBounds.x && 
          point.x <= textBounds.x + textBounds.width &&
          point.y >= textBounds.y && 
          point.y <= textBounds.y + textBounds.height
        ) {
          return { shape, endpoint: null, vertexIndex: null };
        }
        break;
    }
  }
  
  // Hiçbir şekil bulunamadı
  return null;
}

/**
 * Paralel çizgi oluşturma fonksiyonu
 */
export function createParallelLine(
  sourceLine: any, 
  distance: number
): { positiveLine: any, negativeLine: any } {
  // İlk çizginin noktaları
  const { startX, startY, endX, endY, thickness } = sourceLine;
  
  // Çizginin vektör bilgilerini hesapla
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Birim vektörü
  const unitX = dx / length;
  const unitY = dy / length;
  
  // Dik birim vektör (90 derece saat yönünün tersine)
  const perpX = -unitY;
  const perpY = unitX;
  
  // Pozitif yöndeki çizgi (seçilen çizginin bir tarafı)
  const positiveLineId = Date.now();
  const positiveLine = {
    id: positiveLineId,
    type: 'line',
    startX: startX + perpX * distance,
    startY: startY + perpY * distance,
    endX: endX + perpX * distance,
    endY: endY + perpY * distance,
    thickness: thickness,
    isPreview: false
  };
  
  // Negatif yöndeki çizgi (seçilen çizginin diğer tarafı)
  const negativeLineId = positiveLineId + 1;
  const negativeLine = {
    id: negativeLineId,
    type: 'line',
    startX: startX - perpX * distance,
    startY: startY - perpY * distance,
    endX: endX - perpX * distance,
    endY: endY - perpY * distance,
    thickness: thickness,
    isPreview: false
  };
  
  return { positiveLine, negativeLine };
}