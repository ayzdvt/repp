// CanvasRenderer.ts
// Canvas çizim işlemlerini içeren yardımcı fonksiyonlar

import { CanvasState, Point, Tool } from '../types/canvas';
import { worldToScreen, screenToWorld } from './canvasUtils';

/**
 * Belirli bir şekli türüne göre çizen fonksiyon
 */
export function drawShape(
  ctx: CanvasRenderingContext2D, 
  shape: any, 
  state: CanvasState,
  isSelected: boolean = false,
  isPreview: boolean = false // Önizleme modu için parametre
) {
  // Seçilen şekiller için farklı renk kullan
  if (isSelected) {
    ctx.strokeStyle = '#FF4500'; // Turuncu-kırmızı renk
    ctx.fillStyle = '#FF4500';
  } else {
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
  }
  
  if (shape.type === 'point') {
    const { x: screenX, y: screenY } = worldToScreen(shape.x, shape.y, state);
    
    ctx.beginPath();
    if (shape.style === 'square') {
      ctx.rect(screenX - 3, screenY - 3, 6, 6);
      ctx.fill();
    } else if (shape.style === 'cross') {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX - 3, screenY - 3);
      ctx.lineTo(screenX + 3, screenY + 3);
      ctx.moveTo(screenX + 3, screenY - 3);
      ctx.lineTo(screenX - 3, screenY + 3);
      ctx.stroke();
    } else {
      // Default style: circle
      ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape.type === 'line') {
    const start = worldToScreen(shape.startX, shape.startY, state);
    const end = worldToScreen(shape.endX, shape.endY, state);
    
    // Çizgiyi çiz
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineWidth = shape.thickness; // Sabit kalınlık - zoom'dan etkilenmesin
    
    // Eğer kesikli çizgi özelliği varsa (önizleme için)
    if (shape.isDashed) {
      ctx.setLineDash([5, 5]); // Kesikli çizgi
    }
    
    ctx.stroke();
    
    // Dash ayarlarını sıfırla
    ctx.setLineDash([]);
    
    // Sadece önizleme durumunda veya shape.isDashed true ise uzunluk ve açı göster
    if (isPreview || shape.isDashed) {
      // Çizginin uzunluğunu hesapla ve göster
      const lengthInWorld = Math.sqrt(
        Math.pow(shape.endX - shape.startX, 2) + 
        Math.pow(shape.endY - shape.startY, 2)
      );
      
      // Uzunluğu formatla (2 ondalık basamağa yuvarla)
      const formattedLength = lengthInWorld.toFixed(2);
      
      // Metin için orta nokta
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      // Çizginin açısını hesapla
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      
      // Metni çizgiye paralel hizalamak için dönüşüm
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      
      // Beyaz arka plan ile metin çiz (okunaklı olması için)
      ctx.font = '10px Arial';
      
      // Uzunluk ve açı bilgisini içeren metin
      const angleInDegrees = (angle * 180 / Math.PI).toFixed(1);
      const displayText = `${formattedLength} (${angleInDegrees}°)`;
      
      // Açıyı hesapla ve metne ekle
      const textWidth = ctx.measureText(displayText).width;
      
      // Beyaz arka plan - çizginin daha üstünde gösterilecek
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(-textWidth/2 - 3, -22, textWidth + 6, 16);
      
      // Metni çiz - çizginin daha üstünde gösterilecek
      ctx.fillStyle = isSelected ? '#FF4500' : '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayText, 0, -14);
      
      // Dönüşümü geri al
      ctx.restore();
    }
    
    // Eğer çizgi seçiliyse uç noktaları göster
    if (isSelected) {
      // Başlangıç noktasını çiz
      ctx.beginPath();
      ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#FF4500";
      ctx.fill();
      
      // Bitiş noktasını çiz
      ctx.beginPath();
      ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#FF4500";
      ctx.fill();
    }
  } else if (shape.type === 'polyline') {
    // Polyline'da hiç nokta yoksa çizme
    if (!shape.points || shape.points.length < 1) return;
    
    // Polyline çizme işlemi
    ctx.beginPath();
    
    // İlk noktayı al ve oradan başla
    const firstPoint = worldToScreen(shape.points[0].x, shape.points[0].y, state);
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    // Tüm noktaları dolaş ve birleştir
    for (let i = 1; i < shape.points.length; i++) {
      const point = worldToScreen(shape.points[i].x, shape.points[i].y, state);
      ctx.lineTo(point.x, point.y);
    }
    
    // Eğer önizleme noktası varsa, son noktadan önizleme noktasına çizgi çiz (fare ile çizim yaparken)
    if (shape.previewPoint) {
      // Son noktaya erişim için points dizisi boş değilse devam et
      if (shape.points && shape.points.length > 0) {
        const lastPoint = shape.points[shape.points.length - 1];
        const lastScreenPoint = worldToScreen(lastPoint.x, lastPoint.y, state);
        const previewScreenPoint = worldToScreen(shape.previewPoint.x, shape.previewPoint.y, state);

        // Önce normal çizgiyi çiz (noktaları birleştiren)
        ctx.lineWidth = shape.thickness || 1;
        ctx.stroke();
        
        // Sonra önizleme çizgisini farklı stilde çiz
        ctx.beginPath();
        ctx.moveTo(lastScreenPoint.x, lastScreenPoint.y);
        ctx.lineTo(previewScreenPoint.x, previewScreenPoint.y);
        ctx.strokeStyle = isSelected ? "#FF4500" : "#000000"; // Line ile aynı renk
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Kesikli çizgi
        ctx.stroke();
        ctx.setLineDash([]); // Kesikli çizgiyi sıfırla
        
        // Ön izleme çizgisinin uzunluğunu hesapla
        const segmentLength = Math.sqrt(
          Math.pow(shape.previewPoint.x - lastPoint.x, 2) + 
          Math.pow(shape.previewPoint.y - lastPoint.y, 2)
        );
        
        // Uzunluğu formatla
        const formattedLength = segmentLength.toFixed(2);
        
        // Metin için orta nokta
        const midX = (lastScreenPoint.x + previewScreenPoint.x) / 2;
        const midY = (lastScreenPoint.y + previewScreenPoint.y) / 2;
        
        // Çizginin açısını hesapla
        const angle = Math.atan2(
          previewScreenPoint.y - lastScreenPoint.y, 
          previewScreenPoint.x - lastScreenPoint.x
        );
        
        // Metni çizgiye paralel hizalamak için dönüşüm
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        
        // Beyaz arka plan ile metin çiz (okunaklı olması için)
        ctx.font = '10px Arial';
        
        // Açıyı hesapla ve metne ekle
        const angleInDegrees = (angle * 180 / Math.PI).toFixed(1);
        const displayText = `${formattedLength} (${angleInDegrees}°)`;
        
        const textWidth = ctx.measureText(displayText).width;
        
        // Beyaz arka plan - çizginin daha üstünde gösterilecek
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(-textWidth/2 - 3, -22, textWidth + 6, 16);
        
        // Metni çiz - çizginin daha üstünde gösterilecek
        ctx.fillStyle = "#000000";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, 0, -14);
        
        // Dönüşümü geri al
        ctx.restore();
        
        // Snap varsa özel görünüm ekle
        if (shape.isSnapping) {
          // Ekran koordinatları zaten dönüştürülmüş durumda
          const screenX = previewScreenPoint.x;
          const screenY = previewScreenPoint.y;
          
          // Dış yeşil daire çiz
          ctx.beginPath();
          ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#00C853';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // İç beyaz daire çiz
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#00C853';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    } else {
      // Eğer kapalı bir polyline ise, ilk noktaya geri dön
      if (shape.closed && shape.points.length > 2) {
        ctx.lineTo(firstPoint.x, firstPoint.y);
      }
      
      // Çizgiyi çiz
      ctx.lineWidth = shape.thickness || 1;
      ctx.stroke();
    }
    
    // Eğer polyline seçiliyse, tüm köşe noktalarını göster
    if (isSelected && shape.points) {
      for (const point of shape.points) {
        const screenPoint = worldToScreen(point.x, point.y, state);
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FF4500";
        ctx.fill();
      }
    }
  } else if (shape.type === 'text') {
    const { x: screenX, y: screenY } = worldToScreen(shape.x, shape.y, state);
    
    ctx.font = `${shape.fontSize}px Arial`;
    ctx.fillStyle = isSelected ? '#FF4500' : '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(shape.text, screenX, screenY);
    
    // Eğer seçiliyse, metin etrafında bir kutu göster
    if (isSelected) {
      const textMetrics = ctx.measureText(shape.text);
      const textWidth = textMetrics.width;
      const textHeight = shape.fontSize * 1.2; // Tahmini yükseklik
      
      ctx.strokeStyle = '#FF4500';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        screenX - 2, 
        screenY - textHeight + 2, 
        textWidth + 4, 
        textHeight + 4
      );
    }
  }
}

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