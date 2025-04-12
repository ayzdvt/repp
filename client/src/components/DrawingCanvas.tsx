import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasState, Tool, Point } from '@/types';
import { screenToWorld, worldToScreen, drawGrid, drawShape } from '@/lib/canvasUtils';
import { pointNearLine, distance, findNearestSnapPoint } from '@/lib/drawingPrimitives';

interface DrawingCanvasProps {
  canvasState: CanvasState;
  activeTool: Tool;
  onMousePositionChange: (position: Point) => void;
  onPanChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  onCanvasSizeChange: (width: number, height: number) => void;
  onSelectObject?: (object: any) => void;
  onToolChange?: (tool: Tool) => void; // Aracı değiştirmek için prop ekledik
  snapEnabled?: boolean; // Snap özelliğinin açık/kapalı durumu
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canvasState,
  activeTool,
  onMousePositionChange,
  onPanChange,
  onZoomChange,
  onCanvasSizeChange,
  onSelectObject,
  onToolChange,
  snapEnabled = true // Default olarak snap aktif
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
  const nextIdRef = useRef<number>(1); // Şekiller için benzersiz ID'ler
  const draggingLineEndpointRef = useRef<'start' | 'end' | null>(null); // Hangi çizgi ucunun sürüklendiği
  const originalLineRef = useRef<any | null>(null); // Sürükleme başladığında çizginin orijinal hali
  const currentMousePosRef = useRef<Point>({ x: 0, y: 0 }); // Mevcut fare pozisyonu
  
  // UI State (Cursor değişimi vb. için state kullanıyoruz)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [drawingLine, setDrawingLine] = useState<boolean>(false); // Çizgi çizim durumu
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null); // Seçilen şeklin ID'si
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState<boolean>(false); // Çizgi uç noktası sürükleme durumu
  
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
  
  // Seçilen şekil ID'sini sabitlemek için useMemo kullanıyoruz
  // Bu şekilde her render'da aynı referans olacak ve sonsuz döngü olmayacak
  const selectedId = React.useMemo(() => selectedShapeId, [selectedShapeId]);

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
      // Seçilen şekil ise farklı renkte çiz
      drawShape(ctx, shape, canvasState, shape.id === selectedId);
    });
    
    // Oluşturulmakta olan şekli çiz
    if (currentShapeRef.current) {
      drawShape(ctx, currentShapeRef.current, canvasState);
    }
    
    // Çizgi çizim modunda sadece fare canvas üzerindeyse yakalama noktalarını göstermek isterdik
    // Ancak bu özellik performans problemlerine neden olduğu için şimdilik devre dışı bırakıldı
    // Yakalama özelliği hâlâ çalışıyor, sadece görsel göstergeler devre dışı
  }, [canvasState, selectedId, activeTool, isDragging]); // Araç değiştiğinde veya sürükleme durumu değiştiğinde de yeniden çiz
  
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
    
    // Yakalama özelliği için fare pozisyonunu güncelle
    currentMousePosRef.current = worldPos;
    
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
    
    // Çizgi uç noktası sürükleme işlemi
    else if (isDraggingEndpoint && draggingLineEndpointRef.current && selectedShapeId !== null && (e.buttons === 1)) {
      // Hangi çizginin düzenleneceğini bul
      const lineIndex = shapesRef.current.findIndex(shape => shape.id === selectedShapeId);
      if (lineIndex !== -1) {
        // Çizgiyi bul
        const lineShape = shapesRef.current[lineIndex];
        
        // Hangi uç noktasının taşındığına göre güncelle
        if (draggingLineEndpointRef.current === 'start') {
          lineShape.startX = worldPos.x;
          lineShape.startY = worldPos.y;
        } else if (draggingLineEndpointRef.current === 'end') {
          lineShape.endX = worldPos.x;
          lineShape.endY = worldPos.y;
        }
        
        // UI güncellemesi için seçili nesneyi güncelle
        if (onSelectObject) {
          onSelectObject(lineShape);
        }
        
        // Canvas'ın yeniden çizilmesini sağlayan düzenleme
        shapesRef.current[lineIndex] = { ...lineShape };
        
        // İmleç stilini güncelle
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'move';
        }
      }
    } 
    
    // Handle shape drawing (sol fare tuşu çizim)
    else if (currentShapeRef.current && activeTool !== 'selection') {
      // Çizgi çizme özel durumu
      if (activeTool === 'line' && drawingLine) {
        // Birinci nokta sabit, ikinci nokta fare ile hareket eder
        if (lineFirstPointRef.current) {
          // Snap (yakalama) noktası kontrolü - en yakın yakalama noktasını bul
          const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
          const snapPoint = findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance);
          
          // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
          const endPoint = snapPoint || worldPos;
          
          currentShapeRef.current = {
            ...currentShapeRef.current,
            startX: lineFirstPointRef.current.x,
            startY: lineFirstPointRef.current.y,
            endX: endPoint.x,
            endY: endPoint.y,
            // Yakalama noktası varsa bunu görsel olarak belirt
            isSnapping: !!snapPoint
          };
        }
      } 
      // Diğer şekil çizimleri için sürükle-bırak davranışı (fare basılı tutulduğunda)
      else if (isDraggingRef.current) {
        if (activeTool === 'point') {
          // Nothing to update for point
        }
        // Rectangle ve circle araçları kaldırıldı
      }
    }
  };
  
  // Çizginin başlangıç noktasında mı tıklandı kontrolü
  const isNearLineStart = (line: any, point: Point, tolerance: number): boolean => {
    return distance(point, { x: line.startX, y: line.startY }) <= tolerance;
  };
  
  // Çizginin bitiş noktasında mı tıklandı kontrolü
  const isNearLineEnd = (line: any, point: Point, tolerance: number): boolean => {
    return distance(point, { x: line.endX, y: line.endY }) <= tolerance;
  };
  
  // Çizgi uç noktalarından birinde mi tıklandı kontrolü
  const getLineEndpoint = (line: any, point: Point, tolerance: number): 'start' | 'end' | null => {
    // Bitiş noktası (daha önce çizileni kolay seçmek için)
    if (isNearLineEnd(line, point, tolerance)) {
      return 'end';
    }
    // Başlangıç noktası
    if (isNearLineStart(line, point, tolerance)) {
      return 'start';
    }
    return null;
  };
  
  // Helper function to find the shape under a given point
  const findShapeAtPoint = (point: Point): any | null => {
    // Zoom seviyesine göre seçim toleransını hesapla
    // Zoom büyükse tolerans düşük, zoom küçükse tolerans yüksek olmalı
    const baseTolerance = 10; // Baz tolerans değeri
    const zoomAdjustedTolerance = baseTolerance / canvasState.zoom;
    
    // En düşük ve en yüksek tolerans sınırları
    const minTolerance = 2;  // Çok yakından bile en az bu kadar tolerans olsun
    const maxTolerance = 15; // Çok uzaktan bile en fazla bu kadar tolerans olsun
    
    // Toleransı sınırlar içinde tut
    const tolerance = Math.min(Math.max(zoomAdjustedTolerance, minTolerance), maxTolerance);
    
    // Eğer zaten bir çizgi seçiliyse, uç noktalarına tıklandığını kontrol et
    if (selectedShapeId !== null && activeTool === 'selection') {
      const selectedShape = shapesRef.current.find(s => s.id === selectedShapeId);
      if (selectedShape && selectedShape.type === 'line') {
        // Eğer çizginin uç noktalarından birine tıklandıysa
        const endpoint = getLineEndpoint(selectedShape, point, tolerance * 1.5); // Biraz daha geniş tolerans
        
        if (endpoint) {
          // Uç noktası sürükleme modu için çizgiyi ve hangi ucunu seçtiğimizi kaydet
          draggingLineEndpointRef.current = endpoint;
          originalLineRef.current = { ...selectedShape };
          setIsDraggingEndpoint(true);
          
          // Aynı çizgiyi döndür - zaten seçiliydi
          return selectedShape;
        }
      }
    }
    
    // Normal şekil arama devam ediyor
    // Check shapes in reverse order (last drawn on top)
    const shapes = shapesRef.current;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      
      switch (shape.type) {
        case 'point':
          // For a point, check if the click is within a small radius
          if (distance(point, { x: shape.x, y: shape.y }) <= tolerance) {
            return shape;
          }
          break;
          
        case 'line':
          // For a line, check if the click is near the line
          if (pointNearLine(point, shape, tolerance)) {
            return shape;
          }
          break;
          
        // Rectangle ve circle case'leri kaldırıldı
          
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
          
          // Text için de biraz tolerans ekle
          const expandedTextBounds = {
            x: textBounds.x - tolerance,
            y: textBounds.y - tolerance,
            width: textBounds.width + 2 * tolerance,
            height: textBounds.height + 2 * tolerance
          };
          
          if (point.x >= expandedTextBounds.x && 
              point.x <= expandedTextBounds.x + expandedTextBounds.width && 
              point.y >= expandedTextBounds.y && 
              point.y <= expandedTextBounds.y + expandedTextBounds.height) {
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
      
      // Cursor doğrudan burada ayarlanıyor
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
          // Seçili şeklin ID'sini ayarla
          setSelectedShapeId(selectedShape.id);
          onSelectObject(selectedShape);
        } else {
          // Hiçbir şekil seçilmediyse seçimi temizle
          setSelectedShapeId(null);
          if (onSelectObject) onSelectObject(null);
        }
      } else {
        // Diğer çizim araçları için
        isDraggingRef.current = true;
        setIsDragging(true); // UI için
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        
        if (activeTool === 'point') {
          // Create a point and add it directly to shapes
          const newPoint = {
            id: nextIdRef.current++,
            type: 'point',
            x: worldPos.x,
            y: worldPos.y,
            style: 'default'
          };
          shapesRef.current.push(newPoint);
          // Otomatik seçim özelliğini kaldırdık
        } else if (activeTool === 'line') {
          // Eğer daha önce ilk nokta seçilmemişse (çizgi çizme işleminin başlangıcı)
          if (!drawingLine) {
            // Snap (yakalama) noktası kontrolü - en yakın yakalama noktasını bul
            const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
            const snapPoint = findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance);
            
            // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
            const startPoint = snapPoint || worldPos;
            
            // İlk noktayı kaydet
            lineFirstPointRef.current = { x: startPoint.x, y: startPoint.y };
            setDrawingLine(true);
            
            // Geçici gösterim için çizgi oluştur
            currentShapeRef.current = {
              type: 'line',
              startX: startPoint.x,
              startY: startPoint.y,
              endX: startPoint.x,
              endY: startPoint.y,
              thickness: 1
            };
          } else {
            // İkinci tıklama - çizgiyi tamamla
            if (lineFirstPointRef.current) {
              // Snap (yakalama) noktası kontrolü - en yakın yakalama noktasını bul
              const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
              const snapPoint = findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance);
              
              // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
              const endPoint = snapPoint || worldPos;
              
              // Tamamlanmış çizgiyi shapesRef'e ekle
              const newLine = {
                id: nextIdRef.current++,
                type: 'line',
                startX: lineFirstPointRef.current.x,
                startY: lineFirstPointRef.current.y,
                endX: endPoint.x,
                endY: endPoint.y,
                thickness: 1
              };
              shapesRef.current.push(newLine);
              
              // Otomatik seçim özelliğini kaldırdık
              
              // Çizim modunu kapat ve referansları temizle
              lineFirstPointRef.current = null;
              currentShapeRef.current = null;
              setDrawingLine(false);
            }
          }
        // Rectangle ve circle araçları kaldırıldı
        }
      }
    }
  };
  
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false); // UI için
    
    // Çizgi uç noktası sürükleme işlemini sonlandır
    if (isDraggingEndpoint) {
      setIsDraggingEndpoint(false);
      draggingLineEndpointRef.current = null;
      originalLineRef.current = null;
    }
    
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
  
  // İlk render için olan useEffect kaldırıldı çünkü artık activeTool değişim efekti bunu kapsıyor
  
  // Özel şekil güncelleme olayını dinleme
  const updateEventRef = useRef<(e: any) => void>();
  
  useEffect(() => {
    // Özel olayları işleme fonksiyonu
    const handleShapeUpdate = (e: any) => {
      const { detail } = e;
      if (detail?.type === 'update' && detail?.shape) {
        // Güncellenen şekli bul ve güncelle
        const shapeIndex = shapesRef.current.findIndex(s => s.id === detail.shape.id);
        if (shapeIndex !== -1) {
          shapesRef.current[shapeIndex] = detail.shape;
        }
      }
    };
    
    // Referansı sakla
    updateEventRef.current = handleShapeUpdate;
  }, []);
  
  // Container DOM düğümü bağlandığında olayları dinlemeye başla
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;
    
    // Event fonksiyonunu referanstan al
    const handler = (e: any) => {
      if (updateEventRef.current) {
        updateEventRef.current(e);
      }
    };
    
    // Olay dinleyiciyi container'a ekle
    containerElement.addEventListener('shapeupdate', handler);
    
    // Cleanup
    return () => {
      containerElement.removeEventListener('shapeupdate', handler);
    };
  }, []);
  
  // ESC tuşuna basıldığında seçimi iptal et ve seçim aracına geç
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Seçili şekli temizle
        setSelectedShapeId(null);
        
        // Üst bileşene bildir
        if (onSelectObject) {
          onSelectObject(null);
        }
        
        // Çizgi çizme işlemini de iptal et
        if (drawingLine) {
          setDrawingLine(false);
          lineFirstPointRef.current = null;
          currentShapeRef.current = null;
        }
        
        // Çizgi uç noktası sürükleme işlemini de iptal et
        if (isDraggingEndpoint) {
          setIsDraggingEndpoint(false);
          draggingLineEndpointRef.current = null;
          originalLineRef.current = null;
        }
        
        // Eğer seçim aracında değilsek seçim aracına geç
        if (activeTool !== 'selection' && onToolChange) {
          onToolChange('selection');
        }
      }
    };
    
    // Event listener ekle
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTool, drawingLine, onSelectObject, onToolChange]);
  
  // Araç değiştiğinde seçimi iptal et ve imleci güncelle
  // activeTool değiştikçe çalışacak
  const prevToolRef = useRef(activeTool);
  useEffect(() => {
    // İlk render'da çalıştırma
    if (prevToolRef.current === activeTool) {
      prevToolRef.current = activeTool;
      return;
    }
    
    // Araç değiştiğinde
    prevToolRef.current = activeTool;
    
    // Seçili şekli temizle
    setSelectedShapeId(null);
    
    // Üst bileşene bildir
    if (onSelectObject) {
      onSelectObject(null);
    }
    
    // Çizgi çizme işlemini de iptal et
    if (drawingLine) {
      setDrawingLine(false);
      lineFirstPointRef.current = null;
      currentShapeRef.current = null;
    }
    
    // Çizgi uç noktası sürükleme işlemini de iptal et
    if (isDraggingEndpoint) {
      setIsDraggingEndpoint(false);
      draggingLineEndpointRef.current = null;
      originalLineRef.current = null;
    }
    
    // İmleç stilini güncelle
    if (canvasRef.current) {
      if (activeTool === 'selection') {
        canvasRef.current.style.cursor = 'grab';
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
  }, [activeTool, onSelectObject]);  // drawingLine'ı izlemiyor, sadece activeTool değişimini izliyor
  
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
