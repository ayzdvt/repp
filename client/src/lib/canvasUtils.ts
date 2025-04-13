import { CanvasState, Point } from '@/types';

// Transform screen coordinates to world coordinates
export function screenToWorld(
  screenPos: Point, 
  state: CanvasState
): Point {
  if (!state.canvasSize) {
    return { x: 0, y: 0 }; // Koruyucu kod - canvasSize henüz yok
  }
  
  const { width, height } = state.canvasSize;
  const worldX = (screenPos.x - width / 2 - state.panOffset.x) / state.zoom;
  const worldY = (height / 2 - screenPos.y + state.panOffset.y) / state.zoom;
  
  return { x: worldX, y: worldY };
}

// Transform world coordinates to screen coordinates
export function worldToScreen(
  worldPos: Point, 
  state: CanvasState
): Point {
  if (!state.canvasSize) {
    return { x: 0, y: 0 }; // Koruyucu kod - canvasSize henüz yok
  }
  
  const { width, height } = state.canvasSize;
  const screenX = worldPos.x * state.zoom + width / 2 + state.panOffset.x;
  const screenY = height / 2 - worldPos.y * state.zoom + state.panOffset.y;
  
  return { x: screenX, y: screenY };
}

// Draw the coordinate grid
export function drawGrid(ctx: CanvasRenderingContext2D, state: CanvasState) {
  if (!state.canvasSize) return;
  
  const { width, height } = state.canvasSize;
  
  // Calculate grid spacing based on zoom level
  const gridSpacing = state.gridSize * state.zoom;
  
  // Calculate starting point for the grid lines
  const startPoint = screenToWorld({ x: 0, y: height }, state);
  const endPoint = screenToWorld({ x: width, y: 0 }, state);
  
  // Round to nearest grid line
  const startX = Math.floor(startPoint.x / state.gridSize) * state.gridSize;
  const startY = Math.floor(startPoint.y / state.gridSize) * state.gridSize;
  const endX = Math.ceil(endPoint.x / state.gridSize) * state.gridSize;
  const endY = Math.ceil(endPoint.y / state.gridSize) * state.gridSize;
  
  ctx.lineWidth = 0.5;
  
  // Draw vertical grid lines
  for (let x = startX; x <= endX; x += state.gridSize) {
    const screenX = worldToScreen({ x, y: 0 }, state).x;
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
    const screenY = worldToScreen({ x: 0, y }, state).y;
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
  const origin = worldToScreen({ x: 0, y: 0 }, state);
  
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

// Draw snap indicators on the canvas
export function drawSnapIndicators(
  ctx: CanvasRenderingContext2D,
  snapPoints: Point[],
  nearestSnapPoint: Point | null,
  state: CanvasState
) {
  if (!nearestSnapPoint || !state.canvasSize) return;
  
  // Convert world snap point to screen coordinates
  const screenPoint = worldToScreen(nearestSnapPoint, state);
  
  // Draw outer green circle
  ctx.beginPath();
  ctx.arc(screenPoint.x, screenPoint.y, 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#00C853';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Draw inner white circle
  ctx.beginPath();
  ctx.arc(screenPoint.x, screenPoint.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#00C853';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Draw a shape based on its type
export function drawShape(
  ctx: CanvasRenderingContext2D, 
  shape: any, 
  state: CanvasState,
  isSelected: boolean = false
) {
  if (!state.canvasSize) return;
  
  // Set colors based on selection state
  if (isSelected) {
    ctx.strokeStyle = '#FF4500'; // Turuncu-kırmızı renk
    ctx.fillStyle = '#FF4500';
  } else {
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
  }
  
  if (shape.type === 'point') {
    const screenPoint = worldToScreen({ x: shape.x, y: shape.y }, state);
    
    ctx.beginPath();
    if (shape.style === 'square') {
      ctx.rect(screenPoint.x - 3, screenPoint.y - 3, 6, 6);
      ctx.fill();
    } else if (shape.style === 'cross') {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenPoint.x - 3, screenPoint.y - 3);
      ctx.lineTo(screenPoint.x + 3, screenPoint.y + 3);
      ctx.moveTo(screenPoint.x + 3, screenPoint.y - 3);
      ctx.lineTo(screenPoint.x - 3, screenPoint.y + 3);
      ctx.stroke();
    } else {
      // Default style: circle
      ctx.arc(screenPoint.x, screenPoint.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape.type === 'line') {
    const start = worldToScreen({ x: shape.startX, y: shape.startY }, state);
    const end = worldToScreen({ x: shape.endX, y: shape.endY }, state);
    
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineWidth = shape.thickness || 1; // Constant thickness regardless of zoom
    ctx.stroke();
    
    // Show endpoints if selected
    if (isSelected) {
      // Start point
      ctx.beginPath();
      ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#FF4500";
      ctx.fill();
      
      // End point
      ctx.beginPath();
      ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#FF4500";
      ctx.fill();
    }
  } else if (shape.type === 'text') {
    const screenPoint = worldToScreen({ x: shape.x, y: shape.y }, state);
    ctx.font = `${shape.fontSize}px Arial`;
    ctx.fillText(shape.text, screenPoint.x, screenPoint.y);
  }
}