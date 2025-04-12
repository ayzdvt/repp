import React, { useRef, useEffect, useState } from 'react';
import { CanvasState, Tool, Point } from '@/types';
import { screenToWorld, worldToScreen, drawGrid, drawShape } from '@/lib/canvasUtils';

interface DrawingCanvasProps {
  canvasState: CanvasState;
  activeTool: Tool;
  onMousePositionChange: (position: Point) => void;
  onPanChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  onCanvasSizeChange: (width: number, height: number) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canvasState,
  activeTool,
  onMousePositionChange,
  onPanChange,
  onZoomChange,
  onCanvasSizeChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<any[]>([]);
  const [currentShape, setCurrentShape] = useState<any | null>(null);
  
  // Handle canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        onCanvasSizeChange(width, height);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [onCanvasSizeChange]);
  
  // Main rendering function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the grid
    drawGrid(ctx, canvasState);
    
    // Draw all shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape, canvasState);
    });
    
    // Draw current shape being created
    if (currentShape) {
      drawShape(ctx, currentShape, canvasState);
    }
  }, [canvasState, shapes, currentShape]);
  
  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert screen coordinates to world coordinates
    const worldPos = screenToWorld(x, y, canvasState);
    
    // Update mouse position in parent component
    onMousePositionChange(worldPos);
    
    // Handle panning if selection tool is active and dragging
    if (activeTool === 'selection' && isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      onPanChange(
        canvasState.panOffset.x + dx,
        canvasState.panOffset.y + dy
      );
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
    
    // Handle shape drawing
    if (currentShape && activeTool !== 'selection' && isDragging) {
      if (activeTool === 'point') {
        // Nothing to update for point
      } else if (activeTool === 'line') {
        setCurrentShape({
          ...currentShape,
          endX: worldPos.x,
          endY: worldPos.y
        });
      } else if (activeTool === 'rectangle') {
        setCurrentShape({
          ...currentShape,
          width: worldPos.x - currentShape.x,
          height: worldPos.y - currentShape.y
        });
      } else if (activeTool === 'circle') {
        const dx = worldPos.x - currentShape.x;
        const dy = worldPos.y - currentShape.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        setCurrentShape({
          ...currentShape,
          radius
        });
      }
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to world coordinates
    const worldPos = screenToWorld(x, y, canvasState);
    
    // Handle starting to draw a shape
    if (activeTool !== 'selection') {
      if (activeTool === 'point') {
        // Create a point and add it directly to shapes
        const newPoint = {
          type: 'point',
          x: worldPos.x,
          y: worldPos.y,
          style: 'default'
        };
        setShapes([...shapes, newPoint]);
      } else if (activeTool === 'line') {
        setCurrentShape({
          type: 'line',
          startX: worldPos.x,
          startY: worldPos.y,
          endX: worldPos.x,
          endY: worldPos.y,
          thickness: 1
        });
      } else if (activeTool === 'rectangle') {
        setCurrentShape({
          type: 'rectangle',
          x: worldPos.x,
          y: worldPos.y,
          width: 0,
          height: 0
        });
      } else if (activeTool === 'circle') {
        setCurrentShape({
          type: 'circle',
          x: worldPos.x,
          y: worldPos.y,
          radius: 0
        });
      }
    }
    
    // Set cursor style based on the selected tool
    if (activeTool === 'selection') {
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Reset cursor
    if (canvasRef.current) {
      if (activeTool === 'selection') {
        canvasRef.current.style.cursor = 'grab';
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
    
    // Add current shape to shapes array if it exists
    if (currentShape && activeTool !== 'selection') {
      setShapes([...shapes, currentShape]);
      setCurrentShape(null);
    }
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Get mouse position before zoom
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Get the world coordinates of the mouse pointer
    const mouseWorldX = (mouseX - rect.width / 2 - canvasState.panOffset.x) / canvasState.zoom;
    const mouseWorldY = (rect.height / 2 - mouseY + canvasState.panOffset.y) / canvasState.zoom;
    
    // Calculate new zoom
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = canvasState.zoom * zoomDelta;
    
    // Limit zoom range
    if (newZoom > 0.1 && newZoom < 10) {
      // Calculate new pan offset to keep the point under the mouse in the same position
      const newPanX = mouseX - mouseWorldX * newZoom - rect.width / 2;
      const newPanY = rect.height / 2 - mouseY + mouseWorldY * newZoom;
      
      // Update zoom and pan
      onZoomChange(newZoom);
      onPanChange(newPanX, newPanY);
    }
  };
  
  // Update cursor based on the selected tool
  useEffect(() => {
    if (canvasRef.current) {
      if (activeTool === 'selection') {
        canvasRef.current.style.cursor = isDragging ? 'grabbing' : 'grab';
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
  }, [activeTool, isDragging]);
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0"
    >
      <canvas
        ref={canvasRef}
        className="absolute bg-white"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default DrawingCanvas;
