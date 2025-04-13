import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasState, Point, Tool } from '@/types';
import { screenToWorld, worldToScreen, drawGrid, drawShape, drawSnapIndicators } from '@/lib/canvasUtils';
import { pointNearLine, getSnapPoint, findNearestSnapPoint, getLineMidpoint } from '@/lib/drawingPrimitives';

interface DrawingCanvasProps {
  canvasState: CanvasState;
  activeTool: Tool;
  onMousePositionChange: (position: Point) => void;
  onPanChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  onCanvasSizeChange: (width: number, height: number) => void;
  onSelectObject?: (object: any) => void;
  onToolChange?: (tool: Tool) => void;
  snapEnabled?: boolean;
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
  snapEnabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fare pozisyonu ve çizim durumunu takip için state'ler
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [drawingLine, setDrawingLine] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState<boolean>(false);
  
  // Dışarıda tutulan referanslar
  const shapesRef = useRef<any[]>([]);
  const nextIdRef = useRef<number>(1);
  const lineFirstPointRef = useRef<Point | null>(null);
  const currentShapeRef = useRef<any | null>(null);
  const draggingLineEndpointRef = useRef<'start' | 'end' | null>(null);
  const originalLineRef = useRef<any | null>(null);
  
  // Snap ile ilgili state ve referans
  const snapPointsRef = useRef<Point[]>([]);
  const nearestSnapRef = useRef<Point | null>(null);
  
  // Canvas içeriğini çizme - useCallback ile sarıyoruz sonsuz döngü olmaması için
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid çiz
    drawGrid(ctx, canvasState);
    
    // Tüm şekilleri çiz
    for (const shape of shapesRef.current) {
      // Seçili şekil ise vurgula
      const isSelected = selectedShapeId === shape.id;
      drawShape(ctx, shape, canvasState, isSelected);
    }
    
    // Şu anda çizilen bir çizgi varsa onu da göster
    if (drawingLine && lineFirstPointRef.current) {
      const line = {
        type: 'line',
        startX: lineFirstPointRef.current.x,
        startY: lineFirstPointRef.current.y,
        endX: mousePosition.x,
        endY: mousePosition.y,
        thickness: 1
      };
      drawShape(ctx, line, canvasState, false);
    }
    
    // Snap etkinse ve snap noktaları varsa göster
    if (snapEnabled && activeTool !== 'selection') {
      drawSnapIndicators(ctx, snapPointsRef.current, nearestSnapRef.current, canvasState);
    }
  }, [canvasState, drawingLine, mousePosition, selectedShapeId, snapEnabled, activeTool]);
  
  // Ekran boyutları değiştiğinde veya ilk açılışta çalışacak
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        // Üst bileşene canvas boyutunu bildir
        onCanvasSizeChange(width, height);
        
        // Boyut değiştiğinde yeniden çiz
        renderCanvas();
      }
    };
    
    // İlk yükleme ve boyut değişiminde
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [onCanvasSizeChange, renderCanvas]);
  
  // ShapeUpdate olayını dinle
  useEffect(() => {
    const handleShapeUpdate = (e: any) => {
      if (e.detail && e.detail.type === 'update' && e.detail.shape) {
        // Şekilleri güncelle
        const shapeToUpdate = shapesRef.current.find(s => s.id === e.detail.shape.id);
        if (shapeToUpdate) {
          // Şeklin özelliklerini güncelle
          Object.assign(shapeToUpdate, e.detail.shape);
          
          // Yeniden çiz
          renderCanvas();
        }
      }
    };
    
    if (containerRef.current) {
      containerRef.current.addEventListener('shapeupdate', handleShapeUpdate);
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('shapeupdate', handleShapeUpdate);
      }
    };
  }, [renderCanvas]);
  
  // Mouse hareketi
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Mouse pozisyonunu dünya koordinatlarına dönüştür
    const worldPos = screenToWorld({ x, y }, canvasState);
    
    // Mouse pozisyonunu güncelle
    setMousePosition(worldPos);
    onMousePositionChange(worldPos);
    
    // Snap noktalarını hesapla (sadece çizim araçları için)
    if ((activeTool !== 'selection' && !isDragging) || (isDraggingEndpoint && snapEnabled)) {
      // Tüm snap noktalarını topla
      const allSnapPoints: Point[] = [];
      
      for (const shape of shapesRef.current) {
        // Çizgi şekillerinin başlangıç ve bitiş noktalarını ekle
        if (shape.type === 'line') {
          allSnapPoints.push({ x: shape.startX, y: shape.startY });
          allSnapPoints.push({ x: shape.endX, y: shape.endY });
          
          // Orta noktayı da ekle
          const midPoint = getLineMidpoint(shape);
          allSnapPoints.push(midPoint);
        }
        
        // Nokta şekillerini ekle
        if (shape.type === 'point') {
          allSnapPoints.push({ x: shape.x, y: shape.y });
        }
      }
      
      // Eğer şu an bir çizgi çiziyorsak, başlangıç noktasını da ekle
      if (drawingLine && lineFirstPointRef.current) {
        allSnapPoints.push(lineFirstPointRef.current);
      }
      
      // Snap noktalarını referansta sakla
      snapPointsRef.current = allSnapPoints;
      
      // En yakın snap noktasını bul (eğer snap özelliği açıksa)
      if (snapEnabled) {
        nearestSnapRef.current = findNearestSnapPoint(worldPos, allSnapPoints, 10 / canvasState.zoom);
      } else {
        nearestSnapRef.current = null;
      }
    } else {
      // Selection modunda snap gösterme
      snapPointsRef.current = [];
      nearestSnapRef.current = null;
    }
    
    // Orta tuş ile kaydırma işlemi
    if (isDragging) {
      // Kaydırma miktarını hesapla
      const dx = (x - dragStart.x) / canvasState.zoom;
      const dy = (y - dragStart.y) / canvasState.zoom;
      
      // Yeni pan değerini üst bileşene bildir
      onPanChange(canvasState.panOffset.x + dx, canvasState.panOffset.y - dy); // Y ekseni ters olduğu için dy negatif
      
      // Sürükleme başlangıç pozisyonunu güncelle
      setDragStart({ x, y });
    }
    
    // Seçili bir şeklin uç noktası sürükleniyorsa
    if (isDraggingEndpoint && selectedShapeId !== null) {
      const shape = shapesRef.current.find(s => s.id === selectedShapeId);
      if (shape && shape.type === 'line' && draggingLineEndpointRef.current) {
        // Sürüklenen uç noktayı güncelle
        const snapPoint = nearestSnapRef.current || worldPos;
        
        if (draggingLineEndpointRef.current === 'start') {
          shape.startX = snapPoint.x;
          shape.startY = snapPoint.y;
        } else {
          shape.endX = snapPoint.x;
          shape.endY = snapPoint.y;
        }
        
        // Değişiklik üst bileşene bildir
        if (onSelectObject) {
          onSelectObject(shape);
        }
      }
    }
    
    // Canvas'ı yeniden çiz
    renderCanvas();
  };
  
  // Mouse tıklama
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    // Orta tuş ile kaydırma
    if (e.button === 1) { // 1: orta tuş (tekerlek)
      setIsDragging(true);
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setDragStart({ x, y });
      
      // İmleci değiştir
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
      
      return;
    }
    
    // Sol tıklama işlemi
    if (e.button === 0) { // 0: sol tıklama
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Ekran koordinatlarını dünya koordinatlarına dönüştür
      const worldPos = screenToWorld({ x, y }, canvasState);
      
      // Snap noktası varsa onu kullan, yoksa normal pozisyonu
      const snapPoint = nearestSnapRef.current || worldPos;
      
      // Seçim aracı
      if (activeTool === 'selection') {
        // Tıklanan pozisyonda bir şekil varsa, onu seç
        let found = false;
        
        // Önce seçili bir çizgi varsa, noktalarına tıklandı mı kontrol et
        if (selectedShapeId !== null) {
          const selectedShape = shapesRef.current.find(shape => shape.id === selectedShapeId);
          if (selectedShape && selectedShape.type === 'line') {
            // Tolerans değerini zoom seviyesine göre ayarla
            const tolerance = 5 / canvasState.zoom;
            
            // Çizgi başlangıç noktasına tıklandı mı kontrol et
            if (Math.abs(selectedShape.startX - worldPos.x) < tolerance && 
                Math.abs(selectedShape.startY - worldPos.y) < tolerance) {
              // Başlangıç noktasını sürükleme işlemi başlat
              setIsDraggingEndpoint(true);
              draggingLineEndpointRef.current = 'start';
              originalLineRef.current = { ...selectedShape };
              found = true;
            }
            // Çizgi bitiş noktasına tıklandı mı kontrol et
            else if (Math.abs(selectedShape.endX - worldPos.x) < tolerance && 
                     Math.abs(selectedShape.endY - worldPos.y) < tolerance) {
              // Bitiş noktasını sürükleme işlemi başlat
              setIsDraggingEndpoint(true);
              draggingLineEndpointRef.current = 'end';
              originalLineRef.current = { ...selectedShape };
              found = true;
            }
          }
        }
        
        // Eğer nokta sürükleme başlamadıysa, normal nesne seçimi kontrol et
        if (!found) {
          // Tıklanan pozisyonda nesne var mı diye kontrol et
          let clickedShape = null;
          
          // Şekilleri sondan başa doğru tara (üstteki şekilleri önce seç)
          for (let i = shapesRef.current.length - 1; i >= 0; i--) {
            const shape = shapesRef.current[i];
            
            // Tolerans değeri (zoom seviyesine göre ayarlanır)
            const tolerance = 5 / canvasState.zoom;
            
            // Çizgi şekli için
            if (shape.type === 'line') {
              if (pointNearLine(worldPos, shape, tolerance)) {
                clickedShape = shape;
                break;
              }
            }
            // Nokta şekli için
            else if (shape.type === 'point') {
              if (Math.abs(worldPos.x - shape.x) < tolerance && 
                  Math.abs(worldPos.y - shape.y) < tolerance) {
                clickedShape = shape;
                break;
              }
            }
          }
          
          // Seçili şekli güncelle
          setSelectedShapeId(clickedShape ? clickedShape.id : null);
          
          // Üst bileşene bildir
          if (onSelectObject) {
            onSelectObject(clickedShape);
          }
        }
      }
      // Nokta çizim aracı
      else if (activeTool === 'point') {
        // Yeni nokta oluştur
        const newPoint = {
          id: nextIdRef.current++,
          type: 'point',
          x: snapPoint.x,
          y: snapPoint.y,
          style: 'default'
        };
        
        // Şekil listesine ekle
        shapesRef.current.push(newPoint);
      }
      // Çizgi çizim aracı
      else if (activeTool === 'line') {
        // Eğer ilk nokta yoksa, onu ayarla
        if (lineFirstPointRef.current === null) {
          lineFirstPointRef.current = { x: snapPoint.x, y: snapPoint.y };
          setDrawingLine(true);
          currentShapeRef.current = {
            type: 'line',
            startX: snapPoint.x,
            startY: snapPoint.y,
            endX: snapPoint.x,
            endY: snapPoint.y,
            thickness: 1
          };
        } 
        // İlk nokta zaten varsa, çizgiyi tamamla
        else {
          const newLine = {
            id: nextIdRef.current++,
            type: 'line',
            startX: lineFirstPointRef.current.x,
            startY: lineFirstPointRef.current.y,
            endX: snapPoint.x,
            endY: snapPoint.y,
            thickness: 1
          };
          
          // Şekil listesine ekle
          shapesRef.current.push(newLine);
          
          // Çizim durumunu sıfırla
          lineFirstPointRef.current = null;
          setDrawingLine(false);
          currentShapeRef.current = null;
        }
      }
      // Metin aracı
      else if (activeTool === 'text') {
        // Burada metin ekleme işlevselliği olabilir
        const text = prompt('Metin girin:', '');
        if (text) {
          const newText = {
            id: nextIdRef.current++,
            type: 'text',
            x: snapPoint.x,
            y: snapPoint.y,
            text,
            fontSize: 14
          };
          
          // Şekil listesine ekle
          shapesRef.current.push(newText);
        }
      }
      
      // Canvas'ı yeniden çiz
      renderCanvas();
    }
  };
  
  // Mouse bırakma
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Orta tuş ile kaydırma bitişi
    if (e.button === 1) {
      setIsDragging(false);
      
      // İmleci düzelt
      if (canvasRef.current) {
        canvasRef.current.style.cursor = activeTool === 'selection' ? 'grab' : 'crosshair';
      }
    }
    
    // Sol tıklama bırakma
    if (e.button === 0) {
      // Çizgi uç noktası sürükleme işlemi bitişi
      if (isDraggingEndpoint) {
        setIsDraggingEndpoint(false);
        draggingLineEndpointRef.current = null;
        originalLineRef.current = null;
      }
    }
  };
  
  // Tekerlek ile zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (!canvasRef.current) return;
    
    // Fare pozisyonunu al (sayfa koordinatları)
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Fare pozisyonunu dünya koordinatlarına dönüştür
    const worldPos = screenToWorld({ x: mouseX, y: mouseY }, canvasState);
    
    // Mevcut zoom seviyesi
    let newZoom = canvasState.zoom;
    
    // Zoom faktörü
    const factor = 0.05;
    
    // Tekerlek hareket yönüne göre zoom in veya out
    if (e.deltaY < 0) {
      // Zoom in
      newZoom *= (1 + factor);
    } else {
      // Zoom out
      newZoom *= (1 - factor);
    }
    
    // Zoom'u sınırla
    newZoom = Math.max(0.1, Math.min(10, newZoom));
    
    // Eğer zoom değişmediyse işlem yapma
    if (newZoom === canvasState.zoom) return;
    
    // Dünya koordinatlarında farenin pozisyonu (zoom öncesi)
    const worldBefore = worldPos;
    
    // Dünya koordinatlarında farenin pozisyonu (zoom sonrası)
    const screenPos = { x: mouseX, y: mouseY };
    const worldAfter = screenToWorld(screenPos, { ...canvasState, zoom: newZoom });
    
    // Pan ofset düzeltmesi (fare pozisyonunu sabit tutmak için)
    const dx = worldBefore.x - worldAfter.x;
    const dy = worldBefore.y - worldAfter.y;
    
    // Yeni zoom ve pan değerlerini üst bileşene bildir
    onZoomChange(newZoom);
    onPanChange(canvasState.panOffset.x + dx, canvasState.panOffset.y + dy);
    
    // Canvas'ı yeniden çiz
    renderCanvas();
  };
  
  // ESC tuşuna basılınca ve araç değişikliklerinde çizim durumlarını sıfırla
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC tuşuna basılınca
      if (e.key === 'Escape') {
        // Seçimi kaldır
        setSelectedShapeId(null);
        
        // Üst bileşene bildir
        if (onSelectObject) {
          onSelectObject(null);
        }
        
        // Çizim durumunu sıfırla
        if (drawingLine) {
          setDrawingLine(false);
          lineFirstPointRef.current = null;
          currentShapeRef.current = null;
        }
        
        // Selection aracına geç
        if (onToolChange) {
          onToolChange('selection');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawingLine, onSelectObject, onToolChange]);
  
  // Araç değiştiğinde seçimi iptal et ve imleci güncelle - sonsuz döngüyü önlemek için bağımlılıkları limitliyoruz
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
  }, [activeTool, onSelectObject]); // Sadece aktiveTool ve onSelectObject değiştiğinde çalıştır
  
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
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
};

export default DrawingCanvas;