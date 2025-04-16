// EventHandlers.ts
// Mouse ve klavye olaylarını yöneten fonksiyonlar

import { CanvasState, Point, Tool } from '../types/canvas';
import { screenToWorld, worldToScreen, findNearestSnapPoint } from './canvasUtils';
import { distance, pointNearLine, pointNearPolyline } from './drawingPrimitives';

/**
 * Event Handler tip tanımları
 */
export interface EventHandlerParams {
  // Canvas ve durum
  canvasState: CanvasState;
  shapesRef: React.MutableRefObject<any[]>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  
  // Çizim durumları
  activeTool: Tool;
  drawingLine: boolean;
  drawingPolyline: boolean;
  isDraggingEndpoint: boolean;
  selectedShapeId: number | null;
  
  // Referanslar
  lineFirstPointRef: React.MutableRefObject<Point | null>;
  currentShapeRef: React.MutableRefObject<any | null>;
  polylinePointsRef: React.MutableRefObject<Point[]>;
  nextIdRef: React.MutableRefObject<number>;
  draggingLineEndpointRef: React.MutableRefObject<string | null>;
  originalLineRef: React.MutableRefObject<any | null>;
  actionsHistoryRef: React.MutableRefObject<any[]>;
  isPanningRef: React.MutableRefObject<boolean>;
  lastPanPositionRef: React.MutableRefObject<Point | null>;
  
  // State güncelleyicileri
  setDrawingLine: React.Dispatch<React.SetStateAction<boolean>>;
  setDrawingPolyline: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDraggingEndpoint: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedShapeId: React.Dispatch<React.SetStateAction<number | null>>;
  
  // Dışarı aktarılacak fonksiyonlar
  onPanChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  onSelectObject: ((object: any) => void) | undefined;
  onToolChange: ((tool: Tool) => void) | undefined;
  
  // Ayarlar
  snapEnabled: boolean;
  orthoEnabled: boolean;
}

/**
 * Fare hareketi olayını işleyen fonksiyon
 */
export function handleMouseMove(
  e: React.MouseEvent<HTMLCanvasElement>,
  params: EventHandlerParams
) {
  const {
    canvasState,
    shapesRef,
    canvasRef,
    activeTool,
    drawingLine,
    drawingPolyline,
    isDraggingEndpoint,
    selectedShapeId,
    lineFirstPointRef,
    currentShapeRef,
    polylinePointsRef,
    nextIdRef,
    draggingLineEndpointRef,
    originalLineRef,
    actionsHistoryRef,
    isPanningRef,
    lastPanPositionRef,
    setDrawingLine,
    setDrawingPolyline,
    setIsDraggingEndpoint,
    setSelectedShapeId,
    onPanChange,
    onZoomChange,
    onSelectObject,
    onToolChange,
    snapEnabled,
    orthoEnabled
  } = params;

  if (!canvasRef.current) return;
  
  // Canvas üzerindeki pozisyonu al
  const rect = canvasRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Dünya koordinatlarına dönüştür
  const worldPos = screenToWorld(x, y, canvasState);
  
  // Panning (taşıma) işlemi yapılıyorsa
  if (isPanningRef.current && lastPanPositionRef.current) {
    // Fare konumu ile son konum arasındaki farkı hesapla
    const dx = x - lastPanPositionRef.current.x;
    const dy = y - lastPanPositionRef.current.y;
    
    // Pan offset'i güncelle
    onPanChange(
      canvasState.panOffset.x + dx,
      canvasState.panOffset.y + dy
    );
    
    // Son pozisyonu güncelle
    lastPanPositionRef.current = { x, y };
    return;
  }
  
  // Nokta seçme ve sürükleme
  if (isDraggingEndpoint && canvasRef.current && originalLineRef.current) {
    // Yakalama (snap) noktası kontrolü
    const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
    // Snap özelliği kapalıysa null, açıksa en yakın snap noktasını kullan
    const snapPoint = snapEnabled
      ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance)
      : null;
      
    // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
    const endPoint = snapPoint || worldPos;
    
    // Çizim nesnesini bul
    const shapeIndex = shapesRef.current.findIndex(
      s => s.id === originalLineRef.current.id
    );
    
    if (shapeIndex !== -1) {
      // Nesnenin kopyasını oluştur ve güncelle
      const shape = { ...shapesRef.current[shapeIndex] };
      
      if (shape.type === 'line') {
        // Çizgi uç noktası taşıma
        // Hangi uç noktasının taşındığına göre güncelle
        if (draggingLineEndpointRef.current === 'start') {
          shape.startX = endPoint.x;
          shape.startY = endPoint.y;
        } else if (draggingLineEndpointRef.current === 'end') {
          shape.endX = endPoint.x;
          shape.endY = endPoint.y;
        }
      } 
      else if (shape.type === 'polyline' && draggingLineEndpointRef.current === 'vertex') {
        // Polyline noktası taşıma
        const vertexIndex = originalLineRef.current?.vertexIndex;
        if (vertexIndex !== undefined && Array.isArray(shape.points) && vertexIndex < shape.points.length) {
          // Belirli bir vertex'i güncelle
          shape.points[vertexIndex] = { x: endPoint.x, y: endPoint.y };
        }
      }
      
      // UI güncellemesi için seçili nesneyi güncelle
      if (onSelectObject) {
        onSelectObject(shape);
      }
      
      // Canvas'ın yeniden çizilmesini sağlayan düzenleme
      shapesRef.current[shapeIndex] = { ...shape };
      
      // İmleç stilini güncelle
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'move';
      }
    }
  } 
  
  // Şekil çizme
  else if (currentShapeRef.current && activeTool !== 'selection') {
    // Çizgi çizme özel durumu
    if (activeTool === 'line' && drawingLine) {
      // Birinci nokta sabit, ikinci nokta fare ile hareket eder
      if (lineFirstPointRef.current) {
        // Snap (yakalama) noktası kontrolü - en yakın yakalama noktasını bul
        const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
        // Snap özelliği kapalıysa null, açıksa en yakın snap noktasını kullan
        const snapPoint = snapEnabled
          ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance)
          : null;
        
        // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
        let endPoint = snapPoint || worldPos;
        
        // Ortho modu açıksa, çizgiyi yatay veya dikey olarak zorla
        if (orthoEnabled && !snapPoint) { // Snap noktası varsa, snap'e öncelik ver
          // İlk nokta ile fare pozisyonu arasındaki delta değerlerini hesapla
          const dx = Math.abs(endPoint.x - lineFirstPointRef.current.x);
          const dy = Math.abs(endPoint.y - lineFirstPointRef.current.y);
          
          // Hangisi daha büyük - yatay veya dikey çizim
          if (dx > dy) {
            // Yatay çizgi (y değerini sabit tut)
            endPoint = {
              x: endPoint.x,
              y: lineFirstPointRef.current.y
            };
          } else {
            // Dikey çizgi (x değerini sabit tut)
            endPoint = {
              x: lineFirstPointRef.current.x, 
              y: endPoint.y
            };
          }
        }
        
        currentShapeRef.current = {
          ...currentShapeRef.current,
          startX: lineFirstPointRef.current.x,
          startY: lineFirstPointRef.current.y,
          endX: endPoint.x,
          endY: endPoint.y,
          // Yakalama noktası varsa bunu görsel olarak belirt
          isSnapping: !!snapPoint,
          isDashed: true // Kesikli çizgi olarak göster
        };
      }
    } 
    // Polyline çizme özel durumu
    else if (activeTool === 'polyline' && drawingPolyline) {
      if (polylinePointsRef.current.length > 0) {
        // Geçici polyline oluştur - şu ana kadar eklenen noktaları içerir
        const tempPolyline = {
          id: -999, // Geçici ID
          type: 'polyline',
          points: [...polylinePointsRef.current],
          thickness: 1,
          closed: false
        };
        
        // Son noktayı fare pozisyonuna ayarla
        const snapTolerance = 10 / canvasState.zoom;
        const snapPoint = snapEnabled 
          ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance) 
          : null;
        
        // Fare pozisyonu veya snap noktası
        let mousePoint = snapPoint || worldPos;
        
        // Ortho modu
        if (orthoEnabled && polylinePointsRef.current.length > 0 && !snapPoint) {
          const lastPoint = polylinePointsRef.current[polylinePointsRef.current.length - 1];
          const dx = Math.abs(mousePoint.x - lastPoint.x);
          const dy = Math.abs(mousePoint.y - lastPoint.y);
          
          if (dx > dy) {
            // Yatay çizgi
            mousePoint = { x: mousePoint.x, y: lastPoint.y };
          } else {
            // Dikey çizgi
            mousePoint = { x: lastPoint.x, y: mousePoint.y };
          }
        }
        
        // Geçici polyline'a fare pozisyonunu ekle
        tempPolyline.points.push(mousePoint);
        
        // Geçici çizimi güncelle
        currentShapeRef.current = tempPolyline;
      }
    }
  }
  
  // Selection tool aktifse ve diğer modlar pasifse
  else if (activeTool === 'selection' && !isPanningRef.current && !isDraggingEndpoint) {
    // En yakın şekle göre cursor'ı değiştir
    // Örnek: linelarda uç noktada ise resize, üzerinde ise move göster
    // Bu kısım seçim aracı için özelleştirilebilir
    canvasRef.current.style.cursor = 'grab';
  }
}

/**
 * Fare basılma olayını işleyen fonksiyon
 */
export function handleMouseDown(
  e: React.MouseEvent<HTMLCanvasElement>,
  params: EventHandlerParams
) {
  const {
    canvasState,
    shapesRef,
    canvasRef,
    activeTool,
    drawingLine,
    drawingPolyline,
    isDraggingEndpoint,
    selectedShapeId,
    lineFirstPointRef,
    currentShapeRef,
    polylinePointsRef,
    nextIdRef,
    draggingLineEndpointRef,
    originalLineRef,
    actionsHistoryRef,
    isPanningRef,
    lastPanPositionRef,
    setDrawingLine,
    setDrawingPolyline,
    setIsDraggingEndpoint,
    setSelectedShapeId,
    onPanChange,
    onZoomChange,
    onSelectObject,
    onToolChange,
    snapEnabled,
    orthoEnabled
  } = params;
  
  if (!canvasRef.current) return;
  
  // Canvas üzerindeki pozisyonu al
  const rect = canvasRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Dünya koordinatlarına dönüştür
  const worldPos = screenToWorld(x, y, canvasState);
  
  // Orta mouse tuşu ile pan başlatma
  if (e.button === 1) { // Orta tuş (tekerlek)
    isPanningRef.current = true;
    lastPanPositionRef.current = { x, y };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
    return;
  }
  
  // Sol tıklama
  if (e.button === 0) {
    // Seçim aracı aktifse
    if (activeTool === 'selection') {
      // TODO: Şekil seçme fonksiyonu implemente edilecek
      // Bu kısım şekil seçme ve taşıma işlemleri için kullanılacak
    }
    // Line tool aktifse
    else if (activeTool === 'line') {
      // Eğer çizgi çizmeye başlamamışsak, ilk noktayı kaydet
      if (!drawingLine) {
        // Snap noktası kontrolü
        const snapTolerance = 10 / canvasState.zoom;
        const snapPoint = snapEnabled 
          ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance) 
          : null;
        
        // Birinci nokta olarak fare pozisyonu ya da snap noktasını kullan
        lineFirstPointRef.current = snapPoint || worldPos;
        
        // Geçici çizgiyi oluştur
        currentShapeRef.current = {
          id: -1, // Geçici ID
          type: 'line',
          startX: lineFirstPointRef.current.x,
          startY: lineFirstPointRef.current.y,
          endX: lineFirstPointRef.current.x,
          endY: lineFirstPointRef.current.y,
          thickness: 1,
          isDashed: true
        };
        
        // Çizim modunu aktifleştir
        setDrawingLine(true);
      }
      // Eğer zaten çiziyorsak, ikinci noktayı belirle ve çizgiyi tamamla
      else if (lineFirstPointRef.current) {
        // Snap noktası kontrolü
        const snapTolerance = 10 / canvasState.zoom;
        const snapPoint = snapEnabled 
          ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance) 
          : null;
        
        // Ortho modu aktifse ve snap noktası yoksa
        let endPoint = snapPoint || worldPos;
        
        if (orthoEnabled && !snapPoint) {
          // İlk nokta ile fare pozisyonu arasındaki delta değerlerini hesapla
          const dx = Math.abs(endPoint.x - lineFirstPointRef.current.x);
          const dy = Math.abs(endPoint.y - lineFirstPointRef.current.y);
          
          // Hangisi daha büyük - yatay veya dikey çizim
          if (dx > dy) {
            // Yatay çizgi (y değerini sabit tut)
            endPoint = {
              x: endPoint.x,
              y: lineFirstPointRef.current.y
            };
          } else {
            // Dikey çizgi (x değerini sabit tut)
            endPoint = {
              x: lineFirstPointRef.current.x, 
              y: endPoint.y
            };
          }
        }
        
        // Yeni çizgiyi oluştur ve listeye ekle
        const newLine = {
          id: nextIdRef.current++,
          type: 'line',
          startX: lineFirstPointRef.current.x,
          startY: lineFirstPointRef.current.y,
          endX: endPoint.x,
          endY: endPoint.y,
          thickness: 1,
          isDashed: false // Normal çizgi olarak göster
        };
        
        // İşlem tarihçesine ekle
        actionsHistoryRef.current.push({
          action: 'add_shape',
          data: { shapeId: newLine.id }
        });
        
        // Şekli ekle
        shapesRef.current.push(newLine);
        
        // Çizim modunu kapat ve referansları temizle
        lineFirstPointRef.current = null;
        currentShapeRef.current = null;
        setDrawingLine(false);
      }
    }
    // Polyline tool aktifse
    else if (activeTool === 'polyline') {
      // Snap noktası kontrolü
      const snapTolerance = 10 / canvasState.zoom;
      const snapPoint = snapEnabled 
        ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance) 
        : null;
      
      // Fare veya snap noktası
      let clickPoint = snapPoint || worldPos;
      
      // Ortho modu
      if (orthoEnabled && polylinePointsRef.current.length > 0 && !snapPoint) {
        const lastPoint = polylinePointsRef.current[polylinePointsRef.current.length - 1];
        const dx = Math.abs(clickPoint.x - lastPoint.x);
        const dy = Math.abs(clickPoint.y - lastPoint.y);
        
        if (dx > dy) {
          // Yatay çizgi
          clickPoint = { x: clickPoint.x, y: lastPoint.y };
        } else {
          // Dikey çizgi
          clickPoint = { x: lastPoint.x, y: clickPoint.y };
        }
      }
      
      // Noktayı ekle
      polylinePointsRef.current.push(clickPoint);
      
      // Çizim modunu aktifleştir
      setDrawingPolyline(true);
      
      // Geçici polyline'ı güncelle
      currentShapeRef.current = {
        id: -1, // Geçici ID
        type: 'polyline',
        points: [...polylinePointsRef.current],
        thickness: 1,
        closed: false
      };
    }
    // Point tool aktifse
    else if (activeTool === 'point') {
      // Snap noktası kontrolü
      const snapTolerance = 10 / canvasState.zoom;
      const snapPoint = snapEnabled 
        ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance) 
        : null;
      
      // Yeni nokta oluştur
      const newPoint = {
        id: nextIdRef.current++,
        type: 'point',
        x: snapPoint ? snapPoint.x : worldPos.x,
        y: snapPoint ? snapPoint.y : worldPos.y,
        style: 'default'
      };
      
      // İşlem tarihçesine ekle
      actionsHistoryRef.current.push({
        action: 'add_shape',
        data: { shapeId: newPoint.id }
      });
      
      // Şekli ekle
      shapesRef.current.push(newPoint);
    }
  }
}

/**
 * Fare bırakma olayını işleyen fonksiyon
 */
export function handleMouseUp(
  e: React.MouseEvent<HTMLCanvasElement>,
  params: EventHandlerParams
) {
  const {
    canvasState,
    shapesRef,
    canvasRef,
    activeTool,
    drawingLine,
    drawingPolyline,
    isDraggingEndpoint,
    selectedShapeId,
    lineFirstPointRef,
    currentShapeRef,
    polylinePointsRef,
    nextIdRef,
    draggingLineEndpointRef,
    originalLineRef,
    actionsHistoryRef,
    isPanningRef,
    lastPanPositionRef,
    setDrawingLine,
    setDrawingPolyline,
    setIsDraggingEndpoint,
    setSelectedShapeId,
    onPanChange,
    onZoomChange,
    onSelectObject,
    onToolChange,
    snapEnabled,
    orthoEnabled
  } = params;
  
  // Panning işlemini sonlandır
  if (e.button === 1 || (e.button === 0 && isPanningRef.current)) {
    isPanningRef.current = false;
    lastPanPositionRef.current = null;
    
    // Cursor'ı sıfırla
    if (canvasRef.current) {
      if (activeTool === 'selection') {
        canvasRef.current.style.cursor = 'grab';
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
  }
  
  // Seçili nesnenin köşe noktasını taşıma işlemini sonlandır
  if (isDraggingEndpoint && originalLineRef.current) {
    // İşlem yapılan nesnenin indeksini bul
    const shapeIndex = shapesRef.current.findIndex(
      s => s.id === originalLineRef.current.id
    );
    
    if (shapeIndex !== -1) {
      // Değişiklik öncesi durumu işlem tarihçesine ekle
      actionsHistoryRef.current.push({
        action: 'update_shape',
        data: { originalShape: originalLineRef.current }
      });
      
      // Sürükleme durumunu temizle
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
    
    // Polyline aracı için currentShapeRef'i koruyoruz, çünkü şekil mouseDown'da shapesRef'e ekleniyor
    // mouseUp'ta sadece sürükleme durumunu sıfırlıyoruz
    if (activeTool === 'polyline' && drawingPolyline) {
      return; // Polyline aracı için MouseUp işlemini kapat
    }
    
    // Çizgi aracı için handleMouseUp'ta bir şey yapmayalım - tüm işlem mouseDown'da gerçekleşiyor
    if (activeTool === 'line') {
      return; // Çizgi aracı için MouseUp işlemini kapat
    }
    
    // Diğer araçlar için şekli ekle
    if (currentShapeRef.current && activeTool !== 'selection') {
      shapesRef.current.push(currentShapeRef.current);
      currentShapeRef.current = null;
    }
  }
}

/**
 * Fare tekerleği olayını işleyen fonksiyon
 */
export function handleWheel(
  e: React.WheelEvent<HTMLCanvasElement>,
  params: EventHandlerParams
) {
  const {
    canvasState,
    canvasRef,
    onZoomChange,
    onPanChange
  } = params;
  
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
  if (newZoom > 0.000001 && newZoom < 100) {
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
}

/**
 * Klavye bas tuşunu işleyen fonksiyon
 */
export function handleKeyDown(
  e: KeyboardEvent,
  params: EventHandlerParams
) {
  const {
    canvasState,
    shapesRef,
    canvasRef,
    activeTool,
    drawingLine,
    drawingPolyline,
    isDraggingEndpoint,
    selectedShapeId,
    lineFirstPointRef,
    currentShapeRef,
    polylinePointsRef,
    nextIdRef,
    draggingLineEndpointRef,
    originalLineRef,
    actionsHistoryRef,
    isPanningRef,
    lastPanPositionRef,
    setDrawingLine,
    setDrawingPolyline,
    setIsDraggingEndpoint,
    setSelectedShapeId,
    onPanChange,
    onZoomChange,
    onSelectObject,
    onToolChange,
    snapEnabled,
    orthoEnabled
  } = params;
  
  // CTRL+Z geri al (Mac için Command+Z)
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault(); // Tarayıcının varsayılan geri alma davranışını engelle
    handleUndo(params);
    return;
  }
  
  // Escape tuşu - işlemi iptal et
  if (e.key === 'Escape') {
    // Seçili şekli temizle
    setSelectedShapeId(null);
    
    // Üst bileşene bildir
    if (onSelectObject) {
      onSelectObject(null);
    }
    
    // Çizim durumunu sıfırla
    const isDrawing = drawingLine || drawingPolyline || isDraggingEndpoint;
    
    // Çizgi çizme işlemini iptal et
    if (drawingLine) {
      lineFirstPointRef.current = null;
      currentShapeRef.current = null;
      setDrawingLine(false);
    }
    
    // Polyline çizim işlemini iptal et
    if (drawingPolyline) {
      polylinePointsRef.current = [];
      currentShapeRef.current = null;
      setDrawingPolyline(false);
    }
    
    // Çizgi uç noktası sürükleme işlemini iptal et
    if (isDraggingEndpoint) {
      draggingLineEndpointRef.current = null;
      originalLineRef.current = null;
      setIsDraggingEndpoint(false);
    }
    
    // Eğer seçim aracında değilsek seçim aracına geç
    // Çizim yaparken ya da aracımız 'selection' değilse selection aracına geç
    if ((isDrawing || activeTool !== 'selection') && onToolChange) {
      onToolChange('selection');
    }
  }
}

/**
 * Geri alma işlemi (Undo)
 */
export function handleUndo(params: EventHandlerParams) {
  const {
    shapesRef,
    selectedShapeId,
    actionsHistoryRef,
    setSelectedShapeId,
    onSelectObject
  } = params;
  
  // İşlem geçmişinde bir şey var mı kontrol et
  if (actionsHistoryRef.current.length === 0) {
    console.log("Geri alınacak işlem yok");
    return;
  }

  // Son işlemi al
  const lastAction = actionsHistoryRef.current.pop();
  
  if (!lastAction) return;
  
  console.log("İşlem geri alınıyor:", lastAction.action);

  switch (lastAction.action) {
    case 'add_shape':
      // Son eklenen şekli kaldır
      if (lastAction.data && lastAction.data.shapeId) {
        const shapeIndex = shapesRef.current.findIndex(s => s.id === lastAction.data.shapeId);
        
        if (shapeIndex !== -1) {
          // Şekli kaldır
          shapesRef.current.splice(shapeIndex, 1);
          
          // Eğer silinen şekil seçiliyse, seçimi kaldır
          if (selectedShapeId === lastAction.data.shapeId) {
            setSelectedShapeId(null);
            if (onSelectObject) onSelectObject(null);
          }
        }
      }
      break;
      
    case 'update_shape':
      // Değiştirilen şekli önceki duruma getir
      if (lastAction.data && lastAction.data.originalShape) {
        const shapeIndex = shapesRef.current.findIndex(s => s.id === lastAction.data.originalShape.id);
        
        if (shapeIndex !== -1) {
          // Şekli eski haline döndür
          shapesRef.current[shapeIndex] = lastAction.data.originalShape;
          
          // Eğer güncellenen şekil seçiliyse, güncellenmiş bilgileri göster
          if (selectedShapeId === lastAction.data.originalShape.id && onSelectObject) {
            onSelectObject(lastAction.data.originalShape);
          }
        }
      }
      break;
      
    case 'delete_shape':
      // Silinen şekli geri ekle
      if (lastAction.data && lastAction.data.deletedShape) {
        shapesRef.current.push(lastAction.data.deletedShape);
      }
      break;
      
    case 'clear_shapes':
      // Temizlenen tüm şekilleri geri getir
      if (lastAction.data && lastAction.data.oldShapes) {
        shapesRef.current = [...lastAction.data.oldShapes];
      }
      break;
      
    case 'batch_add_shapes':
      // Toplu eklenen şekilleri geri al
      if (lastAction.data && Array.isArray(lastAction.data.shapeIds)) {
        // Silme işlemini her ID için yapalım
        for (const shapeId of lastAction.data.shapeIds) {
          const shapeIndex = shapesRef.current.findIndex(s => s.id === shapeId);
          if (shapeIndex !== -1) {
            // Şekli kaldır
            shapesRef.current.splice(shapeIndex, 1);
            
            // Eğer silinen şekil seçiliyse, seçimi kaldır
            if (selectedShapeId === shapeId) {
              setSelectedShapeId(null);
              if (onSelectObject) onSelectObject(null);
            }
          }
        }
        // Hepsi birlikte tek bir işlem olarak geri alındı, konsola log yazalım
        console.log("Toplu şekil ekleme işlemi geri alındı, silinen şekil sayısı:", lastAction.data.shapeIds.length);
      }
      break;
      
    default:
      console.log("Bilinmeyen işlem tipi:", lastAction.action);
  }
  
  console.log("İşlem geri alındı. Kalan işlem sayısı:", actionsHistoryRef.current.length);
}