// CanvasRenderer.ts
// Canvas çizim işlemlerini içeren yardımcı fonksiyonlar

import { CanvasState, Point, Tool } from '../types/canvas';
import { worldToScreen, screenToWorld } from './canvasUtils';

/**
 * Canvas'ı temizleyen fonksiyon
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
}

/**
 * Noktayı çizen fonksiyon
 */
export function drawPoint(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number = 5, 
  style: string = 'default',
  selected: boolean = false
) {
  // Seçili stil
  if (selected) {
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'red';
  } else {
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
  }
  
  // Stil tipine göre çizim
  switch (style) {
    case 'square':
      ctx.fillRect(x - size/2, y - size/2, size, size);
      break;
    case 'cross':
      ctx.beginPath();
      ctx.moveTo(x - size/2, y - size/2);
      ctx.lineTo(x + size/2, y + size/2);
      ctx.moveTo(x + size/2, y - size/2);
      ctx.lineTo(x - size/2, y + size/2);
      ctx.stroke();
      break;
    case 'default':
    default:
      ctx.beginPath();
      ctx.arc(x, y, size/2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

/**
 * Çizgiyi çizen fonksiyon
 */
export function drawLine(
  ctx: CanvasRenderingContext2D, 
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number, 
  thickness: number = 1,
  selected: boolean = false,
  isDashed: boolean = false
) {
  // Çizgi kalınlığını ayarla
  ctx.lineWidth = thickness;
  
  // Seçili stil
  if (selected) {
    ctx.strokeStyle = 'red';
  } else {
    ctx.strokeStyle = 'black';
  }
  
  // Çizgiyi çiz
  ctx.beginPath();
  
  // Kesikli stil
  if (isDashed) {
    ctx.setLineDash([5, 5]);
  } else {
    ctx.setLineDash([]);
  }
  
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]); // Resetle
}

/**
 * Polyline çizen fonksiyon
 */
export function drawPolyline(
  ctx: CanvasRenderingContext2D, 
  points: Point[], 
  thickness: number = 1,
  closed: boolean = false,
  selected: boolean = false,
  isDashed: boolean = false
) {
  if (points.length < 2) return;
  
  // Çizgi kalınlığını ayarla
  ctx.lineWidth = thickness;
  
  // Seçili stil
  if (selected) {
    ctx.strokeStyle = 'red';
  } else {
    ctx.strokeStyle = 'black';
  }
  
  // Kesikli stil
  if (isDashed) {
    ctx.setLineDash([5, 5]);
  } else {
    ctx.setLineDash([]);
  }
  
  // Polyline çizimi
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  
  // Kapalıysa ilk noktaya bağla
  if (closed) {
    ctx.closePath();
  }
  
  ctx.stroke();
  ctx.setLineDash([]); // Resetle
}

/**
 * Metni çizen fonksiyon
 */
export function drawText(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  text: string, 
  fontSize: number = 12,
  selected: boolean = false
) {
  // Font ayarı
  ctx.font = `${fontSize}px Arial`;
  
  // Seçili stil
  if (selected) {
    ctx.fillStyle = 'red';
  } else {
    ctx.fillStyle = 'black';
  }
  
  // Metni çiz
  ctx.fillText(text, x, y);
}

/**
 * Çizim uzunluğu ve açı bilgisini gösteren yardımcı fonksiyon
 */
export function drawLengthAndAngle(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  zoom: number
) {
  // Çizgi uzunluğunu hesapla
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Çizgi açısını hesapla (derece cinsinden)
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Açıyı 0-360 arasında normalize et
  if (angle < 0) {
    angle += 360;
  }
  
  // Çizgi orta noktasını hesapla (metinleri çizgi üzerinde göstermek için)
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 10 / zoom; // Çizginin biraz yukarısında
  
  // Metni ayarla
  ctx.font = `${12 / zoom}px Arial`;
  ctx.fillStyle = 'blue';
  
  // Uzunluk ve açı bilgisini göster
  const text = `${length.toFixed(2)} birim, ${angle.toFixed(1)}°`;
  ctx.fillText(text, midX, midY);
}

/**
 * Tüm şekilleri çizen ana fonksiyon
 */
export function drawAllShapes(
  ctx: CanvasRenderingContext2D,
  shapes: any[],
  selectedShapeId: number | null,
  canvasState: CanvasState,
  currentShape: any | null = null,
  showPreview: boolean = true
) {
  // Canvas'ı temizle
  clearCanvas(ctx, canvasState.canvasSize.width, canvasState.canvasSize.height);
  
  // Kalıcı şekilleri çiz
  for (const shape of shapes) {
    const isSelected = shape.id === selectedShapeId;
    
    // Dünya koordinatlarından ekran koordinatlarına dönüştür
    switch (shape.type) {
      case 'point':
        const screenPoint = worldToScreen(shape.x, shape.y, canvasState);
        drawPoint(
          ctx, 
          screenPoint.x, 
          screenPoint.y, 
          5 / canvasState.zoom, // Zoom'a göre ayarla
          shape.style,
          isSelected
        );
        break;
        
      case 'line':
        const startScreen = worldToScreen(shape.startX, shape.startY, canvasState);
        const endScreen = worldToScreen(shape.endX, shape.endY, canvasState);
        drawLine(
          ctx, 
          startScreen.x, 
          startScreen.y,
          endScreen.x,
          endScreen.y,
          shape.thickness,
          isSelected,
          shape.isDashed
        );
        break;
        
      case 'polyline':
        if (shape.points && shape.points.length > 0) {
          // Tüm noktaları dönüştür
          const screenPoints = shape.points.map((p: Point) => 
            worldToScreen(p.x, p.y, canvasState)
          );
          
          drawPolyline(
            ctx, 
            screenPoints, 
            shape.thickness,
            shape.closed,
            isSelected,
            shape.isDashed
          );
        }
        break;
        
      case 'text':
        const textScreen = worldToScreen(shape.x, shape.y, canvasState);
        drawText(
          ctx, 
          textScreen.x,
          textScreen.y,
          shape.text,
          shape.fontSize / canvasState.zoom, // Zoom'a göre ayarla
          isSelected
        );
        break;
    }
  }
  
  // Geçici çizim şeklini göster (önizleme)
  if (currentShape && showPreview) {
    switch (currentShape.type) {
      case 'line':
        const lineStartScreen = worldToScreen(currentShape.startX, currentShape.startY, canvasState);
        const lineEndScreen = worldToScreen(currentShape.endX, currentShape.endY, canvasState);
        
        // Asıl çizgiyi çiz
        drawLine(
          ctx,
          lineStartScreen.x,
          lineStartScreen.y,
          lineEndScreen.x,
          lineEndScreen.y,
          currentShape.thickness,
          false, // Seçili değil
          currentShape.isDashed
        );
        
        // Çizim yaparken uzunluk ve açı bilgisini göster
        drawLengthAndAngle(
          ctx,
          lineStartScreen.x,
          lineStartScreen.y,
          lineEndScreen.x,
          lineEndScreen.y,
          canvasState.zoom
        );
        break;
        
      case 'polyline':
        if (currentShape.points && currentShape.points.length > 0) {
          // Tüm noktaları dönüştür
          const polyScreenPoints = currentShape.points.map((p: Point) => 
            worldToScreen(p.x, p.y, canvasState)
          );
          
          drawPolyline(
            ctx,
            polyScreenPoints,
            currentShape.thickness,
            currentShape.closed,
            false, // Seçili değil
            currentShape.isDashed
          );
        }
        break;
    }
  }
}