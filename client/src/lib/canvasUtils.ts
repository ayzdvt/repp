import { CanvasState, Point } from '@/types';

// Transform screen coordinates to world coordinates
// X ekseni dikey, Y ekseni yatay olacak şekilde düzenlendi
export function screenToWorld(
  screenX: number, 
  screenY: number, 
  state: CanvasState
): Point {
  const { width, height } = state.canvasSize;
  
  // Zoom 0 veya NaN ise varsayılan değer kullan
  const safeZoom = isFinite(state.zoom) && state.zoom > 0 ? state.zoom : 0.5;
  
  // Y ve X değerlerini ters çevirdik, Y artık yatay, X artık dikey eksen
  const worldY = (screenX - width / 2 - state.panOffset.x) / safeZoom;
  const worldX = (height / 2 - screenY + state.panOffset.y) / safeZoom;
  
  return { x: worldX, y: worldY };
}

// Transform world coordinates to screen coordinates
// X ekseni dikey, Y ekseni yatay olacak şekilde düzenlendi
export function worldToScreen(
  worldX: number, 
  worldY: number, 
  state: CanvasState
): Point {
  const { width, height } = state.canvasSize;
  
  // Zoom 0 veya NaN ise varsayılan değer kullan
  const safeZoom = isFinite(state.zoom) && state.zoom > 0 ? state.zoom : 0.5;
  
  // Y ve X değerlerini ters çevirdik, Y artık yatay, X artık dikey eksen
  const screenX = worldY * safeZoom + width / 2 + state.panOffset.x;
  const screenY = height / 2 - worldX * safeZoom + state.panOffset.y;
  
  return { x: screenX, y: screenY };
}

// Draw the coordinate grid
export function drawGrid(ctx: CanvasRenderingContext2D, state: CanvasState) {
  const { width, height } = state.canvasSize;
  
  // Zoom değeri için güvenlik kontrolü
  const safeZoom = isFinite(state.zoom) && state.zoom > 0 ? state.zoom : 0.5;
  const safeState = {
    ...state,
    zoom: safeZoom
  };
  
  // Calculate starting point for the grid lines
  const startPoint = screenToWorld(0, height, safeState);
  const endPoint = screenToWorld(width, 0, safeState);
  
  // Zoom seviyesine göre grid aralığını ve birim gösterimini belirle
  let gridStep = 50; // Varsayılan 50cm grid adımı (zoom 1.0)
  let unit = 'cm'; // Varsayılan birim cm
  let divider = 1; // Değer gösterirken bölme faktörü
  
  // Zoom değerine göre farklı ölçek ve birimler - uzaklaştıkça daha büyük birimler
  if (state.zoom < 0.01) {
    gridStep = 50000; // Çok düşük zoom için 500 metre aralık
    unit = 'km';
    divider = 100000; // 100000cm = 1 kilometre
  } else if (state.zoom < 0.05) {
    gridStep = 20000; // Düşük zoom için 200 metre aralık
    unit = 'm';
    divider = 100; // 100cm = 1 metre
  } else if (state.zoom < 0.1) {
    gridStep = 10000; // Zoom < %10 ise 100 metre aralıklarla
    unit = 'm';
    divider = 100; // 100cm = 1 metre
  } else if (state.zoom < 0.3) {
    gridStep = 2500; // Zoom < %30 ise 25 metre aralıklarla
    unit = 'm';
    divider = 100; // 100cm = 1 metre
  } else if (state.zoom < 0.5) {
    gridStep = 500; // Zoom < %50 ise 5 metre aralıklarla
    unit = 'm';
    divider = 100;
  } else if (state.zoom < 1.0) {
    gridStep = 200;  // Zoom < 1.0 ise 200cm aralıklarla
    unit = 'cm';
    divider = 1;
  } else if (state.zoom < 3.0) {
    gridStep = 50;  // Zoom < 3.0 ise 50cm aralıklarla
    unit = 'cm';
    divider = 1;
  } else if (state.zoom < 7.0) {
    gridStep = 10;   // Zoom < 7.0 ise 10cm aralıklarla
    unit = 'cm';
    divider = 1;
  } else if (state.zoom < 15.0) {
    gridStep = 2;   // Zoom < 15.0 ise 2cm aralıklarla
    unit = 'cm';
    divider = 1;
  } else {
    gridStep = 0.5; // Zoom >= 15.0 ise 5mm aralıklarla
    unit = 'mm';
    divider = 0.1;  // 0.1cm = 1mm
  }
  
  // X ekseni dikey, Y ekseni yatay koordinat sistemi için ayarlama
  // Round to nearest grid line
  const startX = Math.floor(startPoint.x / gridStep) * gridStep;
  const startY = Math.floor(startPoint.y / gridStep) * gridStep;
  const endX = Math.ceil(endPoint.x / gridStep) * gridStep;
  const endY = Math.ceil(endPoint.y / gridStep) * gridStep;
  
  ctx.lineWidth = 0.5;
  
  // Draw vertical grid lines (X axis lines)
  for (let x = startX; x <= endX; x += gridStep) {
    // X ekseni dikey olduğu için, sabit X değeri = sabit screenY değeri anlamına gelir
    const { y: screenY } = worldToScreen(x, 0, safeState);
    
    // Ekranın dışına taşan çizgileri çizme
    if (screenY < 0 || screenY > height) continue;
    
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(width, screenY);
    
    ctx.strokeStyle = '#AAAAAA';
    ctx.stroke();
    
    // X ekseni etiketleri (sağ kısımda)
    if (x !== 0) { // 0 noktasında etiket koymuyoruz (origin'de gösteriliyor)
      ctx.fillStyle = '#666666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      
      // Ölçü birimini değiştir (cm, m veya km)
      const displayValue = (x / divider);
      ctx.fillText(displayValue.toString() + ' ' + unit, width - 5, screenY + 4);
    }
  }
  
  // Draw horizontal grid lines (Y axis lines)
  for (let y = startY; y <= endY; y += gridStep) {
    // Y ekseni yatay olduğu için, sabit Y değeri = sabit screenX değeri anlamına gelir
    const { x: screenX } = worldToScreen(0, y, safeState);
    
    // Ekranın dışına taşan çizgileri çizme
    if (screenX < 0 || screenX > width) continue;
    
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    
    ctx.strokeStyle = '#AAAAAA';
    ctx.stroke();
    
    // Y ekseni etiketleri (alt kısımda)
    if (y !== 0) { // 0 noktasında etiket koymuyoruz (origin'de gösteriliyor)
      ctx.fillStyle = '#666666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      
      // Ölçü birimini değiştir (cm, m veya km)
      const displayValue = (y / divider);
      ctx.fillText(displayValue.toString() + ' ' + unit, screenX, height - 5);
    }
  }
  
  // Draw x and y axes
  const origin = worldToScreen(0, 0, safeState);
  
  // X-axis (yatay çizgi)
  ctx.beginPath();
  ctx.moveTo(0, origin.y);
  ctx.lineTo(width, origin.y);
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Y-axis (dikey çizgi)
  ctx.beginPath();
  ctx.moveTo(origin.x, 0);
  ctx.lineTo(origin.x, height);
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw origin label
  ctx.fillStyle = '#444444';
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('0,0', origin.x + 4, origin.y - 4);
}

// Draw a shape based on its type
/**
 * Yakınlaştırma özelliği noktalarını çizer.
 */
export function drawSnapIndicators(
  ctx: CanvasRenderingContext2D,
  shapes: any[],
  currentMousePos: Point | null,
  state: CanvasState,
  snapTolerance: number,
  snapEnabled: boolean = true
): void {
  // Snap özelliği kapalıysa çıkış yap
  if (!snapEnabled) return;
  
  // Fare pozisyonu geçerli değilse çıkış yap
  if (!currentMousePos) return;
  
  // Yakalama noktalarını topla
  const snapPoints: Array<{x: number, y: number}> = [];
  
  // Mevcut tüm şekillerden yakalama noktaları topla
  shapes.forEach(shape => {
    if (shape.type === 'point') {
      snapPoints.push({ x: shape.x, y: shape.y });
    } else if (shape.type === 'line') {
      // Başlangıç noktası
      snapPoints.push({ x: shape.startX, y: shape.startY });
      // Bitiş noktası
      snapPoints.push({ x: shape.endX, y: shape.endY });
      // Orta nokta
      snapPoints.push({ 
        x: (shape.startX + shape.endX) / 2, 
        y: (shape.startY + shape.endY) / 2
      });
    }
  });
  
  // En yakın yakalama noktasını bul
  let minDistance = snapTolerance;
  let nearestPoint: {x: number, y: number} | null = null;
  
  for (const point of snapPoints) {
    const dx = point.x - currentMousePos.x;
    const dy = point.y - currentMousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  }
  
  // En yakın yakalama noktası varsa göster
  if (nearestPoint) {
    try {
      // Dünya koordinatlarını ekran koordinatlarına dönüştür - worldToScreen fonksiyonunu kullan
      const { x: screenX, y: screenY } = worldToScreen(nearestPoint.x, nearestPoint.y, state);
      
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
    } catch (err) {
      console.error('Error drawing snap indicator:', err);
    }
  }
}

export function drawShape(
  ctx: CanvasRenderingContext2D, 
  shape: any, 
  state: CanvasState,
  isSelected: boolean = false
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
  } else if (shape.type === 'rectangle') {
    const topLeft = worldToScreen(shape.x, shape.y, state);
    const width = shape.width * state.zoom;
    const height = -shape.height * state.zoom; // Negative because Y-axis is inverted in canvas
    
    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, width, height);
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (shape.type === 'circle') {
    const center = worldToScreen(shape.x, shape.y, state);
    const radius = shape.radius * state.zoom;
    
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (shape.type === 'polyline') {
    // Polyline'da hiç nokta yoksa çizme
    if (shape.points.length < 1) return;
    
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
        
        // Snap varsa özel görünüm ekle
        if (shape.isSnapping) {
          // Dünya koordinatlarını ekran koordinatlarına dönüştür
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
      ctx.lineWidth = shape.thickness; // Sabit kalınlık
      ctx.stroke();
    }
    
    // Eğer polyline seçiliyse, tüm köşe noktalarını göster
    if (isSelected) {
      for (const point of shape.points) {
        const screenPoint = worldToScreen(point.x, point.y, state);
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FF4500";
        ctx.fill();
      }
    }
  }
}
