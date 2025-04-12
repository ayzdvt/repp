import { CanvasState, Point } from '@/types';

// Transform screen coordinates to world coordinates
export function screenToWorld(
  screenX: number, 
  screenY: number, 
  state: CanvasState
): Point {
  const { width, height } = state.canvasSize;
  const worldX = (screenX - width / 2 - state.panOffset.x) / state.zoom;
  const worldY = (height / 2 - screenY + state.panOffset.y) / state.zoom;
  return { x: worldX, y: worldY };
}

// Transform world coordinates to screen coordinates
export function worldToScreen(
  worldX: number, 
  worldY: number, 
  state: CanvasState
): Point {
  const { width, height } = state.canvasSize;
  const screenX = worldX * state.zoom + width / 2 + state.panOffset.x;
  const screenY = height / 2 - worldY * state.zoom + state.panOffset.y;
  return { x: screenX, y: screenY };
}

// Draw the coordinate grid
export function drawGrid(ctx: CanvasRenderingContext2D, state: CanvasState) {
  const { width, height } = state.canvasSize;
  
  // Calculate grid spacing based on zoom level
  const gridSpacing = state.gridSize * state.zoom;
  
  // Calculate starting point for the grid lines
  const startPoint = screenToWorld(0, height, state);
  const endPoint = screenToWorld(width, 0, state);
  
  // Round to nearest grid line
  const startX = Math.floor(startPoint.x / state.gridSize) * state.gridSize;
  const startY = Math.floor(startPoint.y / state.gridSize) * state.gridSize;
  const endX = Math.ceil(endPoint.x / state.gridSize) * state.gridSize;
  const endY = Math.ceil(endPoint.y / state.gridSize) * state.gridSize;
  
  ctx.lineWidth = 0.5;
  
  // Draw vertical grid lines
  for (let x = startX; x <= endX; x += state.gridSize) {
    const { x: screenX } = worldToScreen(x, 0, state);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    
    // Main grid lines (every 10 units) are darker
    if (x % (state.gridSize * 10) === 0) {
      ctx.strokeStyle = '#AAAAAA';
    } else {
      ctx.strokeStyle = '#DDDDDD';
    }
    
    ctx.stroke();
    
    // Add labels for the main grid lines
    if (x % (state.gridSize * 10) === 0 && x !== 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(x.toString(), screenX, height - 2);
    }
  }
  
  // Draw horizontal grid lines
  for (let y = startY; y <= endY; y += state.gridSize) {
    const { y: screenY } = worldToScreen(0, y, state);
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(width, screenY);
    
    // Main grid lines (every 10 units) are darker
    if (y % (state.gridSize * 10) === 0) {
      ctx.strokeStyle = '#AAAAAA';
    } else {
      ctx.strokeStyle = '#DDDDDD';
    }
    
    ctx.stroke();
    
    // Add labels for the main grid lines
    if (y % (state.gridSize * 10) === 0 && y !== 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(y.toString(), 10, screenY + 3);
    }
  }
  
  // Draw x and y axes
  const origin = worldToScreen(0, 0, state);
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(0, origin.y);
  ctx.lineTo(width, origin.y);
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Y-axis
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
// Yakalama noktalarını göster
export function drawSnapIndicators(
  ctx: CanvasRenderingContext2D,
  shapes: any[],
  currentMousePos: Point,
  state: CanvasState,
  snapTolerance: number
) {
  // Şekilden yakalama noktalarını al
  const snapPoints: Point[] = [];
  
  shapes.forEach(shape => {
    if (shape.type === 'point') {
      snapPoints.push({ x: shape.x, y: shape.y });
    } else if (shape.type === 'line') {
      // Çizgi başlangıç noktası
      snapPoints.push({ x: shape.startX, y: shape.startY });
      
      // Çizgi bitiş noktası
      snapPoints.push({ x: shape.endX, y: shape.endY });
      
      // Çizgi orta noktası
      snapPoints.push({ 
        x: (shape.startX + shape.endX) / 2, 
        y: (shape.startY + shape.endY) / 2 
      });
    }
  });
  
  // En yakın yakalama noktasını bul
  let closestPoint: Point | null = null;
  let minDistance = snapTolerance;
  
  snapPoints.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(point.x - currentMousePos.x, 2) + 
      Math.pow(point.y - currentMousePos.y, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  });
  
  // En yakın yakalama noktasını vurgula
  if (closestPoint) {
    const screenPos = worldToScreen(closestPoint.x, closestPoint.y, state);
    
    // Yeşil daire çiz
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#00C853';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // İçi beyaz daire
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#00C853';
    ctx.lineWidth = 1;
    ctx.stroke();
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
    ctx.stroke();
    
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
  }
}
