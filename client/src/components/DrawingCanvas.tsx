import React, { useRef, useEffect, useState } from 'react';
import { CanvasState, Tool, Point } from '@/types';
import { screenToWorld, worldToScreen, drawGrid, drawShape } from '@/lib/canvasUtils';
import { 
  pointNearLine, 
  pointNearCircle, 
  pointInRectangle, 
  distance
} from '@/lib/drawingPrimitives';

interface DrawingCanvasProps {
  canvasState: CanvasState;
  activeTool: Tool;
  onMousePositionChange: (position: Point) => void;
  onPanChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  onCanvasSizeChange: (width: number, height: number) => void;
  onSelectObject?: (object: any) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canvasState,
  activeTool,
  onMousePositionChange,
  onPanChange,
  onZoomChange,
  onCanvasSizeChange,
  onSelectObject
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
  
  // Helper function to find the shape under a given point
  const findShapeAtPoint = (point: Point): any | null => {
    // Check shapes in reverse order (last drawn on top)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      
      switch (shape.type) {
        case 'point':
          // For a point, check if the click is within a small radius
          if (distance(point, { x: shape.x, y: shape.y }) <= 5) {
            return shape;
          }
          break;
          
        case 'line':
          // For a line, check if the click is near the line
          if (pointNearLine(point, shape)) {
            return shape;
          }
          break;
          
        case 'rectangle':
          // For a rectangle, check if the click is inside
          if (pointInRectangle(point, shape)) {
            return shape;
          }
          break;
          
        case 'circle':
          // For a circle, check if the click is near the circle perimeter or inside
          const distToCenter = distance(point, { x: shape.x, y: shape.y });
          if (distToCenter <= shape.radius + 5 && distToCenter >= shape.radius - 5) {
            return shape;
          }
          break;
          
        case 'text':
          // For text, simplified check using a rectangular area
          // Would need more sophisticated checking for actual text bounds
          // Create a bounding box for the text
          const textBounds = {
            x: shape.x,
            y: shape.y - shape.fontSize,
            width: shape.text.length * shape.fontSize * 0.6, // Rough estimate
            height: shape.fontSize * 1.2
          };
          if (point.x >= textBounds.x && 
              point.x <= textBounds.x + textBounds.width && 
              point.y >= textBounds.y && 
              point.y <= textBounds.y + textBounds.height) {
            return shape;
          }
          break;
      }
    }
    
    return null;
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
    
    if (activeTool === 'selection') {
      // Try to select a shape under the click point
      const selectedShape = findShapeAtPoint(worldPos);
      
      if (selectedShape && onSelectObject) {
        onSelectObject(selectedShape);
      } else if (canvasRef.current) {
        // If no shape was clicked, prepare for canvas panning
        canvasRef.current.style.cursor = 'grabbing';
      }
    } else {
      // Handle starting to draw a shape
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
    
    // Get mouse position
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate world coordinates of the mouse position
    const worldPos = screenToWorld(mouseX, mouseY, canvasState);
    
    // Calculate new zoom level
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1; // Reduce zoom on scroll down, increase on scroll up
    const newZoom = canvasState.zoom * zoomDelta;
    
    // Limit zoom range
    if (newZoom > 0.1 && newZoom < 10) {
      // Update zoom first
      onZoomChange(newZoom);
      
      // Calculate the screen position after the zoom change
      const screenPos = worldToScreen(worldPos.x, worldPos.y, {
        ...canvasState,
        zoom: newZoom
      });
      
      // Calculate the difference between where the point is now drawn and where the mouse is
      const dx = screenPos.x - mouseX;
      const dy = screenPos.y - mouseY;
      
      // Adjust the pan offset to compensate for this difference
      onPanChange(
        canvasState.panOffset.x - dx,
        canvasState.panOffset.y - dy
      );
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
