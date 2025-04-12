import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  // DOM References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mutable References (State'in sonsuz döngü yapmaması için ref kullanıyoruz)
  const shapesRef = useRef<any[]>([]); 
  const currentShapeRef = useRef<any | null>(null);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const lineFirstPointRef = useRef<Point | null>(null); // Çizgi ilk noktası referansı
  const requestRef = useRef<number | null>(null); // AnimationFrame request ID
  
  // UI State (Cursor değişimi vb. için state kullanıyoruz)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [drawingLine, setDrawingLine] = useState<boolean>(false); // Çizgi çizim durumu
  
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
  
  // Render işlevi - render frame içinde kullanılacak
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Izgarayı çiz
    drawGrid(ctx, canvasState);
    
    // Tüm şekilleri çiz
    shapesRef.current.forEach(shape => {
      drawShape(ctx, shape, canvasState);
    });
    
    // Oluşturulmakta olan şekli çiz
    if (currentShapeRef.current) {
      drawShape(ctx, currentShapeRef.current, canvasState);
    }
  }, [canvasState]); // Sadece canvas state değiştiğinde fonksiyonu yeniden oluştur
  
  // Bileşen takılı olduğunda animasyon loop'unu çalıştır, söküldüğünde temizle
  useEffect(() => {
    // Animasyon frame'i yönet
    const animate = () => {
      renderCanvas();
      requestRef.current = requestAnimationFrame(animate);
    };
    
    // İlk frame'i başlat
    requestRef.current = requestAnimationFrame(animate);
    
    // Cleanup işlevi
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [renderCanvas]); // Sadece renderCanvas fonksiyonu değişirse yeniden başlat
  
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
    
    // SADECE orta fare tuşu (wheel button) ile pan yapmaya izin ver (buttons=4)
    if (e.buttons === 4) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      onPanChange(
        canvasState.panOffset.x + dx,
        canvasState.panOffset.y + dy
      );
      
      // Güncelleme sonrası başlangıç noktasını güncelle
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
    
    // Handle shape drawing (sol fare tuşu çizim)
    if (currentShapeRef.current && activeTool !== 'selection') {
      // Çizgi çizme özel durumu
      if (activeTool === 'line' && drawingLine) {
        // Birinci nokta sabit, ikinci nokta fare ile hareket eder
        if (lineFirstPointRef.current) {
          currentShapeRef.current = {
            ...currentShapeRef.current,
            startX: lineFirstPointRef.current.x,
            startY: lineFirstPointRef.current.y,
            endX: worldPos.x,
            endY: worldPos.y
          };
        }
      } 
      // Diğer şekil çizimleri için sürükle-bırak davranışı (fare basılı tutulduğunda)
      else if (isDraggingRef.current) {
        if (activeTool === 'point') {
          // Nothing to update for point
        } else if (activeTool === 'rectangle') {
          currentShapeRef.current = {
            ...currentShapeRef.current,
            width: worldPos.x - currentShapeRef.current.x,
            height: worldPos.y - currentShapeRef.current.y
          };
        } else if (activeTool === 'circle') {
          const dx = worldPos.x - currentShapeRef.current.x;
          const dy = worldPos.y - currentShapeRef.current.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          currentShapeRef.current = {
            ...currentShapeRef.current,
            radius
          };
        }
      }
    }
  };
  
  // Helper function to find the shape under a given point
  const findShapeAtPoint = (point: Point): any | null => {
    // Check shapes in reverse order (last drawn on top)
    const shapes = shapesRef.current;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      
      switch (shape.type) {
        case 'point':
          // For a point, check if the click is within a small radius
          if (distance(point, { x: shape.x, y: shape.y }) <= 10) { // Daha kolay seçilebilmesi için toleransı artırdık
            return shape;
          }
          break;
          
        case 'line':
          // For a line, check if the click is near the line
          // Tolerance'ı artırarak daha kolay seçme
          if (pointNearLine(point, shape, 10)) { // Daha geniş seçim alanı için tolerance'ı artırdım
            return shape;
          }
          break;
          
        case 'rectangle':
          // For a rectangle, check if the click is inside
          // Eğer genişlik veya yükseklik negatifse, koordinatları düzeltmeliyiz
          const rect = { ...shape };
          
          if (rect.width < 0) {
            rect.x += rect.width;
            rect.width = Math.abs(rect.width);
          }
          
          if (rect.height < 0) {
            rect.y += rect.height;
            rect.height = Math.abs(rect.height);
          }
          
          if (pointInRectangle(point, rect)) {
            return shape;
          }
          break;
          
        case 'circle':
          // For a circle, check if the click is inside the circle or near its perimeter
          const distToCenter = distance(point, { x: shape.x, y: shape.y });
          if (distToCenter <= shape.radius + 5) { // İçinde veya kenara yakın olma durumu
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
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to world coordinates
    const worldPos = screenToWorld(x, y, canvasState);
    
    // Orta fare tuşu için kaydırma (pan) işlemini başlat
    if (e.button === 1) { // 1 = orta fare tuşu (tekerlek)
      isDraggingRef.current = true;
      setIsDragging(true); // UI için
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
      return;
    }
    
    // Sol fare tuşu için araçlara göre farklı davranışlar
    if (e.button === 0) { // 0 = sol fare tuşu
      if (activeTool === 'selection') {
        // Selection tool için nesne seçme
        const selectedShape = findShapeAtPoint(worldPos);
        
        if (selectedShape && onSelectObject) {
          onSelectObject(selectedShape);
        }
      } else {
        // Diğer çizim araçları için
        isDraggingRef.current = true;
        setIsDragging(true); // UI için
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        
        if (activeTool === 'point') {
          // Create a point and add it directly to shapes
          const newPoint = {
            type: 'point',
            x: worldPos.x,
            y: worldPos.y,
            style: 'default'
          };
          shapesRef.current.push(newPoint);
        } else if (activeTool === 'line') {
          // Eğer daha önce ilk nokta seçilmemişse (çizgi çizme işleminin başlangıcı)
          if (!drawingLine) {
            // İlk noktayı kaydet
            lineFirstPointRef.current = { x: worldPos.x, y: worldPos.y };
            setDrawingLine(true);
            
            // Geçici gösterim için çizgi oluştur
            currentShapeRef.current = {
              type: 'line',
              startX: worldPos.x,
              startY: worldPos.y,
              endX: worldPos.x,
              endY: worldPos.y,
              thickness: 1
            };
          } else {
            // İkinci tıklama - çizgiyi tamamla
            if (lineFirstPointRef.current) {
              // Tamamlanmış çizgiyi shapesRef'e ekle
              shapesRef.current.push({
                type: 'line',
                startX: lineFirstPointRef.current.x,
                startY: lineFirstPointRef.current.y,
                endX: worldPos.x,
                endY: worldPos.y,
                thickness: 1
              });
              
              // Çizim modunu kapat ve referansları temizle
              lineFirstPointRef.current = null;
              currentShapeRef.current = null;
              setDrawingLine(false);
            }
          }
        } else if (activeTool === 'rectangle') {
          currentShapeRef.current = {
            type: 'rectangle',
            x: worldPos.x,
            y: worldPos.y,
            width: 0,
            height: 0
          };
        } else if (activeTool === 'circle') {
          currentShapeRef.current = {
            type: 'circle',
            x: worldPos.x,
            y: worldPos.y,
            radius: 0
          };
        }
      }
    }
  };
  
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false); // UI için
    
    // Reset cursor
    if (canvasRef.current) {
      if (activeTool === 'selection') {
        canvasRef.current.style.cursor = 'grab';
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
    
    // Çizgi aracı dışındaki araçlar için şekli ekle
    if (currentShapeRef.current && activeTool !== 'selection' && activeTool !== 'line') {
      shapesRef.current.push(currentShapeRef.current);
      currentShapeRef.current = null;
    }
    
    // Çizgi aracı için handleMouseUp'ta bir şey yapmayalım - tüm işlem mouseDown'da gerçekleşiyor
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
  
  // Sağ tıklamayı engelle
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    return false;
  };

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
        onContextMenu={handleContextMenu}
      />
    </div>
  );
};

export default DrawingCanvas;
