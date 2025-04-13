import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasState, Tool, Point } from '@/types';
import { screenToWorld, worldToScreen, drawGrid, drawShape, drawSnapIndicators } from '@/lib/canvasUtils';
import { pointNearLine, pointNearPolyline, distance, findNearestSnapPoint } from '@/lib/drawingPrimitives';

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
  const draggingLineEndpointRef = useRef<'start' | 'end' | 'vertex' | null>(null); // Hangi uç veya noktanın sürüklendiği
  const originalLineRef = useRef<any | null>(null); // Sürükleme başladığında çizginin orijinal hali
  const currentMousePosRef = useRef<Point>({ x: 0, y: 0 }); // Mevcut fare pozisyonu
  const polylinePointsRef = useRef<Point[]>([]); // Polyline'ın noktaları
  
  // UI State (Cursor değişimi vb. için state kullanıyoruz)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [drawingLine, setDrawingLine] = useState<boolean>(false); // Çizgi çizim durumu
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null); // Seçilen şeklin ID'si
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState<boolean>(false); // Çizgi uç noktası sürükleme durumu
  const [drawingPolyline, setDrawingPolyline] = useState<boolean>(false); // Polyline çizim durumu
  
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
    
    // Eğer snap özelliği açıksa veya line uçları çekilirken yakalama noktalarını göster
    if ((snapEnabled && currentMousePosRef.current) && (activeTool !== 'selection' || isDraggingEndpoint)) {
      // Yakalama noktaları için şekilleri tara
      const snapPoints: Array<{x: number, y: number}> = [];
      
      // Tüm şekillerden yakalama noktalarını topla
      shapesRef.current.forEach(shape => {
        // Çizgi uçlarını sürüklerken, sürüklenen çizginin snap noktalarını gösterme
        if (isDraggingEndpoint && shape.id === selectedId) {
          return; // Bu çizgiyi atla
        }
        
        if (shape.type === 'point') {
          // Nokta şekilleri için kendisi bir yakalama noktasıdır
          snapPoints.push({ x: shape.x, y: shape.y });
        } else if (shape.type === 'line') {
          // Çizgiler için başlangıç ve bitiş noktaları yakalanabilir
          snapPoints.push({ x: shape.startX, y: shape.startY }); // Başlangıç
          snapPoints.push({ x: shape.endX, y: shape.endY });     // Bitiş
          
          // Orta nokta
          snapPoints.push({
            x: (shape.startX + shape.endX) / 2,
            y: (shape.startY + shape.endY) / 2
          });
        } else if (shape.type === 'polyline') {
          // Polyline için tüm noktalar yakalanabilir
          for (const point of shape.points) {
            snapPoints.push({ x: point.x, y: point.y });
          }
          
          // Segment orta noktaları da ekleyelim
          if (shape.points.length >= 2) {
            for (let i = 0; i < shape.points.length - 1; i++) {
              const p1 = shape.points[i];
              const p2 = shape.points[i + 1];
              snapPoints.push({
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
              });
            }
            
            // Eğer kapalı polyline ise, son nokta ile ilk nokta arasındaki orta nokta
            if (shape.closed && shape.points.length > 2) {
              const p1 = shape.points[shape.points.length - 1];
              const p2 = shape.points[0];
              snapPoints.push({
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
              });
            }
          }
        }
      });
      
      // En yakın yakalama noktasını bul
      const snapTolerance = 10 / canvasState.zoom;
      let closestPoint = null;
      let minDistance = snapTolerance;
      
      for (const point of snapPoints) {
        const dx = point.x - currentMousePosRef.current.x;
        const dy = point.y - currentMousePosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }
      
      // En yakın yakalama noktası varsa görsel olarak göster
      if (closestPoint) {
        // Dünya koordinatlarını ekran koordinatlarına çevir
        const screenPos = worldToScreen(closestPoint.x, closestPoint.y, canvasState);
        
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
  }, [canvasState, selectedId, activeTool, isDragging, snapEnabled, isDraggingEndpoint]); // Araç değiştiğinde, sürükleme durumu veya snap durumu değiştiğinde de yeniden çiz
  
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
    
    // Polyline çizimi sırasında önizleme çizgisini göster
    if (activeTool === 'polyline' && drawingPolyline && polylinePointsRef.current.length > 0) {
      // Mevcut çizilen polyline noktalarını geçici şekil olarak oluştur
      // Böylece bunlar da snap noktaları olarak kullanılabilir
      const temporaryPolylinePoints = [...polylinePointsRef.current];
      const temporaryPolyline = {
        id: -999, // Geçici bir ID
        type: 'polyline',
        points: temporaryPolylinePoints,
        thickness: 1,
        closed: false
      };
      
      // Geçici şekli snap kontrolleri için ekle, ama asıl şekiller listesini değiştirme
      const shapesWithTempPolyline = [...shapesRef.current, temporaryPolyline];
      
      // Snap kontrolü (şimdi geçici polyline da dahil)
      const snapTolerance = 10 / canvasState.zoom;
      const snapPoint = snapEnabled
        ? findNearestSnapPoint(worldPos, shapesWithTempPolyline, snapTolerance)
        : null;
      
      // Fare pozisyonu veya snap noktası
      const currentPoint = snapPoint || worldPos;
      
      // Önizleme çizgisini güncelle - sadece fare pozisyonunu değiştiriyoruz, gerçek noktaları değil
      if (currentShapeRef.current && currentPoint) {
        // Mevcut noktaları kopyala, değiştirmeyelim
        const currentPoints = [...polylinePointsRef.current];
        
        // Önizleme noktasını güncelle - bu sadece çizim için
        currentShapeRef.current = {
          id: currentShapeRef.current.id || -1,
          type: 'polyline',
          points: currentPoints,  // Orijinal noktaları kullan
          thickness: 1,
          closed: false,
          previewPoint: currentPoint, // Önizleme noktası ekle
          isSnapping: !!snapPoint
        };
      }
    }
    
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
    
    // Çizgi veya polyline noktası sürükleme işlemi
    else if (isDraggingEndpoint && draggingLineEndpointRef.current && selectedShapeId !== null && (e.buttons === 1)) {
      // Hangi şeklin düzenleneceğini bul
      const shapeIndex = shapesRef.current.findIndex(shape => shape.id === selectedShapeId);
      if (shapeIndex !== -1) {
        // Şekli bul
        const shape = shapesRef.current[shapeIndex];
        
        // Snap özelliği için kontrol yap
        const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
        // Snap özelliği kapalıysa null, açıksa en yakın snap noktasını kullan
        // Seçili olan şeklin kendi snap noktalarını hariç tut (kendisine yapışmasın)
        const snapPoint = snapEnabled
          ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance, selectedShapeId)
          : null;
          
        // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
        const endPoint = snapPoint || worldPos;
        
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
    
    // Handle shape drawing (sol fare tuşu çizim)
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
          const endPoint = snapPoint || worldPos;
          
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
          
          // Geçici şekli snap kontrolleri için ekle, ama orijinal listeyi değiştirme
          const shapesWithTempPolyline = [...shapesRef.current, tempPolyline];
          
          // Snap (yakalama) noktası kontrolü - güncel şekil listesi ile
          const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
          // Snap özelliği kapalıysa null, açıksa en yakın snap noktasını kullan
          const snapPoint = snapEnabled
            ? findNearestSnapPoint(worldPos, shapesWithTempPolyline, snapTolerance)
            : null;
          
          // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
          const currentPoint = snapPoint || worldPos;
          
          // Tüm noktaları koruyarak son noktayı fare pozisyonuyla güncelle (çizim önizlemesi için)
          if (currentShapeRef.current) {
            // Mevcut noktaları al
            const points = [...polylinePointsRef.current];
            
            // Şu anki fare pozisyonunu geçici olarak ekle (taslak gösterim için)
            const tempPoints = [...points, { x: currentPoint.x, y: currentPoint.y }];
            
            // Güncel şekli güncelle
            currentShapeRef.current = {
              ...currentShapeRef.current,
              points: points, // Önizleme noktasını dahil etme, bunu previewPoint ile yapıyoruz
              previewPoint: currentPoint, // Önizleme noktası olarak kullan
              // Yakalama noktası varsa bunu görsel olarak belirt
              isSnapping: !!snapPoint
            };
          }
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
  // Polyline noktalarını kontrol edip taşınabilecek noktayı bulur
  const getPolylineVertexAtPoint = (polyline: any, point: Point, tolerance: number): number | null => {
    if (!polyline.points || !Array.isArray(polyline.points)) return null;
    
    // Tüm noktaları kontrol et
    for (let i = 0; i < polyline.points.length; i++) {
      const vertex = polyline.points[i];
      
      // Nokta ile vertex arasındaki mesafeyi hesapla
      const dist = distance(point, vertex);
      
      // Eğer mesafe toleransın içindeyse, bu noktanın indeksini döndür
      if (dist <= tolerance) {
        return i; // Taşınacak noktanın indeksi
      }
    }
    
    return null; // Hiçbir nokta tolerans içinde değil
  };

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
    
    // Eğer zaten bir şekil seçiliyse, özel durumları kontrol et
    if (selectedShapeId !== null && activeTool === 'selection') {
      const selectedShape = shapesRef.current.find(s => s.id === selectedShapeId);
      
      // Çizgi seçiliyse uç noktalarına tıklandığını kontrol et
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
      // Polyline seçiliyse noktalarına tıklandığını kontrol et
      else if (selectedShape && selectedShape.type === 'polyline') {
        // Polyline noktalarından birine tıklandı mı?
        const vertexIndex = getPolylineVertexAtPoint(selectedShape, point, tolerance * 1.5);
        
        if (vertexIndex !== null) {
          // Polyline vertex düzenleme modu
          draggingLineEndpointRef.current = 'vertex';  // İmleç durumunu değiştirmek için
          originalLineRef.current = { 
            ...selectedShape,
            vertexIndex: vertexIndex // Düzenlenen vertex'in indeksini sakla
          };
          setIsDraggingEndpoint(true);
          
          // Aynı polyline'ı döndür - zaten seçiliydi
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
          
        case 'polyline':
          // For a polyline, check if the click is near any segment
          if (pointNearPolyline(point, shape, tolerance)) {
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
          // Snap özelliği için kontrol yap
          const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
          // Snap özelliği kapalıysa null, açıksa en yakın snap noktasını kullan
          const snapPoint = snapEnabled
            ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance)
            : null;
          
          // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
          const pointPosition = snapPoint || worldPos;
          
          // Create a point and add it directly to shapes
          const newPoint = {
            id: nextIdRef.current++,
            type: 'point',
            x: pointPosition.x,
            y: pointPosition.y,
            style: 'default'
          };
          shapesRef.current.push(newPoint);
          // Otomatik seçim özelliğini kaldırdık
        } else if (activeTool === 'line') {
          // Eğer daha önce ilk nokta seçilmemişse (çizgi çizme işleminin başlangıcı)
          if (!drawingLine) {
            // Snap (yakalama) noktası kontrolü - en yakın yakalama noktasını bul
            const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
            // Snap özelliği kapalıysa null, açıksa en yakın snap noktasını kullan
            const snapPoint = snapEnabled
              ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance)
              : null;
            
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
              // Snap özelliği kapalıysa null, açıksa en yakın snap noktasını kullan
              const snapPoint = snapEnabled
                ? findNearestSnapPoint(worldPos, shapesRef.current, snapTolerance)
                : null;
              
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
        } else if (activeTool === 'polyline') {
          // Sürükleme durumunu kaldır - polyline çizerken sürükleme kullanmıyoruz
          isDraggingRef.current = false;
          setIsDragging(false);
          
          // Eğer devam eden bir polyline çizimi varsa, mevcut noktaları dikkate al
          let shapesWithTempPolyline = [...shapesRef.current];
          if (drawingPolyline && polylinePointsRef.current.length > 0) {
            // Şu anda çizilmekte olan polyline noktalarını da dikkate al
            const tempPolyline = {
              id: -999, // Geçici ID
              type: 'polyline',
              points: [...polylinePointsRef.current],
              thickness: 1,
              closed: false
            };
            shapesWithTempPolyline.push(tempPolyline);
          }
          
          // Snap (yakalama) noktası kontrolü - güncellenmiş şekil listemizi kullanalım
          const snapTolerance = 10 / canvasState.zoom; // Zoom'a göre ayarlanmış tolerans
          // Snap özelliği kapalıysa null, açıksa en yakın snap noktasını kullan
          const snapPoint = snapEnabled
            ? findNearestSnapPoint(worldPos, shapesWithTempPolyline, snapTolerance)
            : null;
          
          // Eğer yakalama noktası varsa onu kullan, yoksa normal fare pozisyonunu kullan
          const clickPoint = snapPoint || worldPos;
          
          // Eğer polyline çizimi başlamadıysa, başlat
          if (!drawingPolyline) {
            // Yeni polyline başlat
            polylinePointsRef.current = [{ x: clickPoint.x, y: clickPoint.y }];
            setDrawingPolyline(true);
            
            // Geçici gösterim için polyline oluştur (ilk nokta)
            currentShapeRef.current = {
              id: -1, // Geçici ID
              type: 'polyline',
              points: [...polylinePointsRef.current],
              thickness: 1,
              closed: false,
              previewPoint: clickPoint // İlk nokta için önizleme ekle
            };
          } else {
            // Polyline'a yeni nokta ekle
            polylinePointsRef.current.push({ x: clickPoint.x, y: clickPoint.y });
            
            // Geçici gösterimi güncelle - noktalar ve mevcut fare konumu
            if (currentShapeRef.current) {
              currentShapeRef.current = {
                ...currentShapeRef.current,
                points: [...polylinePointsRef.current],
                previewPoint: clickPoint // Mevcut tıklama noktasına önizleme güncelle
              };
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
  
  // Özel event'ler için Ref'ler
  const updateEventRef = useRef<(e: any) => void>();
  const getAllShapesRef = useRef<(e: any) => void>();
  
  useEffect(() => {
    // Şekil güncelleme
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
    
    // Tüm şekilleri döndürme - Fit View için
    const handleGetAllShapes = (e: any) => {
      const { detail } = e;
      if (detail?.callback && typeof detail.callback === 'function') {
        // Mevcut tüm şekilleri döndür
        detail.callback([...shapesRef.current]);
      }
    };
    
    // Referansları sakla
    updateEventRef.current = handleShapeUpdate;
    getAllShapesRef.current = handleGetAllShapes;
  }, []);
  
  // Container DOM düğümü bağlandığında olayları dinlemeye başla
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;
    
    // Event fonksiyonlarını referanstan al
    const updateHandler = (e: any) => {
      if (updateEventRef.current) {
        updateEventRef.current(e);
      }
    };
    
    const getAllShapesHandler = (e: any) => {
      if (getAllShapesRef.current) {
        getAllShapesRef.current(e);
      }
    };
    
    // Olay dinleyicileri container'a ekle
    containerElement.addEventListener('shapeupdate', updateHandler);
    containerElement.addEventListener('getAllShapes', getAllShapesHandler);
    
    // Cleanup
    return () => {
      containerElement.removeEventListener('shapeupdate', updateHandler);
      containerElement.removeEventListener('getAllShapes', getAllShapesHandler);
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
    };
    
    // Event listener ekle
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTool, onSelectObject, onToolChange, drawingLine, drawingPolyline, isDraggingEndpoint]);
  
  // Araç değiştiğinde seçimi iptal et ve imleci güncelle
  // activeTool değiştikçe çalışacak
  const prevToolRef = useRef(activeTool);
  useEffect(() => {
    // Eğer aktiveTool değişmediyse hiçbir şey yapma
    if (prevToolRef.current === activeTool) {
      return;
    }
    
    // Araç değiştiğinde referansı güncelle
    prevToolRef.current = activeTool;
    
    // Seçili şekli temizle
    setSelectedShapeId(null);
    
    // Üst bileşene bildir
    if (onSelectObject) {
      onSelectObject(null);
    }
    
    // Çizim durumlarını sıfırla
    const resetDrawingStates = () => {
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
    };
    
    // Çizim durumlarını sıfırla
    resetDrawingStates();
    
    // İmleç stilini güncelle
    if (canvasRef.current) {
      if (activeTool === 'selection') {
        canvasRef.current.style.cursor = 'grab';
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
  }, [activeTool, onSelectObject]);  // Sadece activeTool değiştiğinde çalışacak
  
  // Sağ tıklama işlemleri
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Sağ tık menüsünü engelle
    
    // Line aracı aktifken ve ilk nokta seçilmişse
    if (activeTool === 'line' && drawingLine && lineFirstPointRef.current) {
      // Çizim modunu kapat ve referansları temizle (ama line aracından çıkma)
      lineFirstPointRef.current = null;
      currentShapeRef.current = null;
      setDrawingLine(false);
      console.log("Çizgi çizimi iptal edildi, line aracı hala aktif");
    }
    // Polyline çizimi sırasında sağ tıklama ile polyline'ı tamamla
    else if (activeTool === 'polyline' && drawingPolyline && polylinePointsRef.current.length >= 2) {
      // Polyline'ı tamamla ve shapesRef'e ekle
      const newPolyline = {
        id: nextIdRef.current++,
        type: 'polyline',
        points: [...polylinePointsRef.current],
        thickness: 1,
        closed: false
      };
      
      shapesRef.current.push(newPolyline);
      
      // Temizle
      polylinePointsRef.current = [];
      currentShapeRef.current = null;
      setDrawingPolyline(false);
    }
    
    return false; // Event'i engelle
  };

  // Çift tıklama ile polyline'ı tamamlamak için
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'polyline' && drawingPolyline && polylinePointsRef.current.length >= 2) {
      // Son tıklama noktasını eklemeye gerek yok, zaten ekledik

      // Polyline'ı tamamla ve shapesRef'e ekle
      const newPolyline = {
        id: nextIdRef.current++,
        type: 'polyline',
        points: [...polylinePointsRef.current],
        thickness: 1,
        closed: false
      };
      
      shapesRef.current.push(newPolyline);
      
      // Temizle
      polylinePointsRef.current = [];
      currentShapeRef.current = null;
      setDrawingPolyline(false);
    }
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
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
};

export default DrawingCanvas;
