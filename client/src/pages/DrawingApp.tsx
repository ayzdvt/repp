import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import ToolSidebar from "@/components/ToolSidebar";
import PropertiesSidebar from "@/components/PropertiesSidebar";
import StatusBar from "@/components/StatusBar";
import DrawingCanvas from "@/components/DrawingCanvas";
import { CanvasState, Tool, Point } from "@/types";

export default function DrawingApp() {
  const [activeTool, setActiveTool] = useState<Tool>("selection");
  const [zoom, setZoom] = useState<number>(1);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [gridSize, setGridSize] = useState<number>(10);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    gridSize: 10,
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    canvasSize: { width: 0, height: 0 }
  });
  const [selectedObject, setSelectedObject] = useState<any>(null);
  
  // Canvas içindeki referans
  // Removed canvasRef
  
  // LocalStorage'dan koordinatları al ve çizim alanına ekle
  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan koordinatları kontrol et
    const coordsString = localStorage.getItem('parselCoordinates');
    if (!coordsString) return;
    
    try {
      const coordinates = JSON.parse(coordsString);
      
      if (Array.isArray(coordinates) && coordinates.length > 0) {
        console.log("Parsel koordinatları bulundu:", coordinates);
        
        // Koordinatları çizim için hazırla
        setTimeout(() => {
          // Canvas'a erişim
          const canvasContainer = document.getElementById('drawing-container') as HTMLElement;
          if (!canvasContainer) return;
          
          const canvasElement = canvasContainer.querySelector('div.absolute') as HTMLElement;
          if (!canvasElement) return;
          
          // Koordinat aralığını bulalım
          const xValues = coordinates.map(c => c.x);
          const yValues = coordinates.map(c => c.y);
          
          const minX = Math.min(...xValues);
          const maxX = Math.max(...xValues);
          const minY = Math.min(...yValues);
          const maxY = Math.max(...yValues);
          
          // Çok büyük değerlerin olup olmadığını kontrol edelim (milyon veya milyar gibi)
          const isVeryLargeValues = Math.abs(maxX) > 10000 || Math.abs(minX) > 10000 || 
                                   Math.abs(maxY) > 10000 || Math.abs(minY) > 10000;
          
          // Koordinatları oluştur - HAM DEĞERLERİ KULLAN, NORMALİZE ETME
          coordinates.forEach((coord, index) => {
            // Her bir koordinat için bir nokta oluştur
            const createPointEvent = new CustomEvent('createshape', { 
              detail: { 
                type: 'point',
                x: coord.x, // Orijinal ham X değeri
                y: coord.y, // Orijinal ham Y değeri
                style: 'default',
                id: Date.now() + index // Benzersiz ID oluştur
              } 
            });
            
            // Event'i div.absolute üzerinden yayınla
            canvasElement.dispatchEvent(createPointEvent);
          });
          
          // LocalStorage'ı temizle (tekrar yüklenince aynı noktaları oluşturmamak için)
          localStorage.removeItem('parselCoordinates');
          
          // Çok büyük değerler için özel zoom ayarlaması
          if (isVeryLargeValues) {
            // Çok küçük bir zoom değeri ile başla
            setZoom(0.00001);
            setCanvasState(prev => ({
              ...prev,
              zoom: 0.00001
            }));
          }
          
          // Görünümü tam ekrana uyarla
          handleResetView();
        }, 1000); // Canvas tamamen yüklendikten sonra işlem yapabilmek için 1 saniye bekle
      }
    } catch (error) {
      console.error("Parsel koordinatları yüklenirken hata:", error);
    }
  }, []);
  
  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
    
    // Araç değiştiğinde seçimi temizle
    if (selectedObject) {
      setSelectedObject(null);
    }
  };
  
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom
    }));
  };
  
  // Pan değişikliği işleme
  const handlePanChange = (x: number, y: number) => {
    setCanvasState(prev => ({
      ...prev,
      panOffset: { x, y }
    }));
  };
  
  // Tüm çizimleri ekrana sığdıran Fit View fonksiyonu
  const handleResetView = () => {
    // Canvas'ı al
    const drawingContainer = document.getElementById('drawing-container');
    if (!drawingContainer) return;
    
    // Absolute div'i bul
    const absoluteDiv = drawingContainer.querySelector('div.absolute');
    if (!absoluteDiv) return;
    
    // Canvas boyutları
    const canvasWidth = canvasState.canvasSize.width;
    const canvasHeight = canvasState.canvasSize.height;
    
    // Şekilleri almak için bir dummy referans oluştur
    let shapeList: any[] = [];
    
    try {
      // Event oluştur ve gönder
      const customEvent = new CustomEvent('getAllShapes', {
        detail: { 
          callback: (shapes: any[]) => {
            // Callback çağrıldığında şekilleri listeye atayacak
            shapeList = shapes || [];
          }
        }
      });
      absoluteDiv.dispatchEvent(customEvent);
    } catch (error) {
      console.error('Shapes retrieval error:', error);
    }
    
    // Şekilleri al (callback tarafından doldurulacak)
    const shapes = shapeList;
    
    console.log("Fit View - Tüm şekiller:", shapes);
    
    // Çizim yoksa, varsayılan görünüme geri dön
    if (!shapes || shapes.length === 0) {
      console.log("Fit View - Çizim bulunamadı, varsayılan görünüme dönülüyor");
      setZoom(1);
      setCanvasState({
        gridSize: 10,
        zoom: 1,
        panOffset: { x: 0, y: 0 },
        canvasSize: canvasState.canvasSize
      });
      return;
    }
    
    // Tüm şekillerin sınırlarını bul
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    shapes.forEach(shape => {
      if (shape.type === 'point') {
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x);
        maxY = Math.max(maxY, shape.y);
      } 
      else if (shape.type === 'line') {
        minX = Math.min(minX, shape.startX, shape.endX);
        minY = Math.min(minY, shape.startY, shape.endY);
        maxX = Math.max(maxX, shape.startX, shape.endX);
        maxY = Math.max(maxY, shape.startY, shape.endY);
      }
      else if (shape.type === 'polyline' && Array.isArray(shape.points)) {
        shape.points.forEach((point: {x: number, y: number}) => {
          if (point && typeof point.x === 'number' && typeof point.y === 'number') {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          }
        });
      }
      else if (shape.type === 'text') {
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x + 20); 
        maxY = Math.max(maxY, shape.y + 20); 
      }
    });
    
    console.log("Fit View - Bulunan ham sınırlar:", { minX, minY, maxX, maxY });
    
    // Geçerli sınırlar yoksa, varsayılan görünüme dön
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      setZoom(1);
      setCanvasState({
        gridSize: 10,
        zoom: 1,
        panOffset: { x: 0, y: 0 },
        canvasSize: canvasState.canvasSize
      });
      return;
    }
    
    // BÜYÜK SAYILAR İÇİN ÖZEL İŞLEM
    const isBigCoordinates = Math.abs(minX) > 10000 || Math.abs(minY) > 10000 || 
                            Math.abs(maxX) > 10000 || Math.abs(maxY) > 10000;
    
    if (isBigCoordinates) {
      // Çok büyük değerler (milyon gibi) için özel işlem
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Merkez noktayı hesapla
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Büyük koordinatlar için özel zoom seviyesi hesaplama
      // Önce koordinat aralığının büyüklüğüne göre uygun bir zoom hesaplayalım
      // Ekran boyutları düşünülerek skala belirle
      const scaleX = canvasWidth / width;
      const scaleY = canvasHeight / height;
      
      // Koordinat sisteminin ortasına odaklanacak uygun zoom
      const appropriateZoom = Math.min(scaleX, scaleY) * 0.9; // %90 güvenlik faktörü
      
      // Çok küçük zoom değerlerini limitle
      const safeZoom = Math.max(0.0000001, appropriateZoom);
      
      // Pan offset'i merkez koordinatına göre ayarla
      const panX = -(centerX * safeZoom);
      const panY = (centerY * safeZoom);
      
      // Apply the new zoom and pan
      setZoom(safeZoom);
      setCanvasState({
        gridSize: 10, 
        zoom: safeZoom,
        panOffset: { x: panX, y: panY },
        canvasSize: canvasState.canvasSize
      });
      
      console.log("Büyük koordinatlar için ayarlanan değerler:", {
        zoom: safeZoom,
        panX,
        panY,
        width,
        height,
        centerX,
        centerY
      });
      
      return;
    }
    
    // NORMAL DEĞERLER İÇİN STANDART İŞLEM
    // Nesnelerin çevresine marj ekle (daha geniş görünüm için)
    const margin = 50;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;
    
    // Çok küçük nesneler veya tek nokta için ekstra marj
    if (maxX - minX < 20) {
      const center = (minX + maxX) / 2;
      minX = center - 50;
      maxX = center + 50;
    }
    
    if (maxY - minY < 20) {
      const center = (minY + maxY) / 2;
      minY = center - 50;
      maxY = center + 50;
    }
    
    // Objelerin boyutları
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Zoom faktörlerini hesapla
    const zoomX = canvasWidth / width;
    const zoomY = canvasHeight / height;
    
    // Daha kısıtlayıcı olanı seç
    let newZoom = Math.min(zoomX, zoomY) * 0.9; // %90 faktör (kenar marjları için)
    
    // Zoom değeri için güvenlik kontrolü
    if (!isFinite(newZoom) || newZoom <= 0) {
      console.log("Uyarı: Geçersiz zoom değeri, varsayılana ayarlanıyor");
      newZoom = 0.5; // Varsayılan zoom değeri
    }
    
    console.log("Fit View - Hesaplanan zoom faktörleri:", { zoomX, zoomY, newZoom });
    
    // Merkez noktayı hesapla
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    console.log("Fit View - Merkez noktası:", { centerX, centerY });
    
    // canvasUtils.ts'deki worldToScreen fonksiyonu mantığıyla pan offset hesaplama
    const panOffsetX = -centerX * newZoom;
    const panOffsetY = centerY * newZoom;
    
    console.log("Fit View - Hesaplanan panOffset:", { panOffsetX, panOffsetY });
    
    // Yeni değerleri ayarla
    setZoom(newZoom);
    setCanvasState({
      gridSize: 10, 
      zoom: newZoom,
      panOffset: { x: panOffsetX, y: panOffsetY },
      canvasSize: canvasState.canvasSize
    });
  };
  
  const handleMousePositionChange = (position: Point) => {
    setMousePosition(position);
  };
  
  const toggleSnap = () => {
    setSnapEnabled(prevState => !prevState);
  };
  
  const handleCanvasSizeChange = (width: number, height: number) => {
    setCanvasState(prev => ({
      ...prev, 
      canvasSize: { width, height }
    }));
  };
  
  // Nesne özelliklerinde değişiklik yapıldığında bu fonksiyon çağrılacak
  const handlePropertyChange = (
    property: string, 
    value: number | string, 
    objectId: number
  ) => {
    // Mevcut seçili nesnenin bir kopyasını oluştur
    if (selectedObject && selectedObject.id === objectId) {
      // Özelliği doğrudan güncelleme
      const updatedObject = { ...selectedObject };
      
      // Hangi özelliği güncellediğimize bağlı olarak değeri ayarla
      if (property in updatedObject) {
        // @ts-ignore - Dinamik özellik ataması
        updatedObject[property] = value;
      }
      
      // Önce DrawingCanvas bileşenine referans iletmek için güncellenmiş nesneyi state'e kaydet
      setSelectedObject(updatedObject);

      // DrawingCanvas'a yapılan değişikliği çağırarak ileteceğiz
      // Bu, DrawingCanvas'ın içindeki shapesRef'i de günceller
      const canvasContainer = document.getElementById('drawing-container') as HTMLElement;
      if (canvasContainer) {
        // İçindeki canvas containerına erişelim
        const canvasElement = canvasContainer.querySelector('div.absolute') as HTMLElement;
        if (canvasElement) {
          // Özel olay oluştur - canvas.tsx dosyasında dinleyeceğiz
          const updateEvent = new CustomEvent('shapeupdate', { 
            detail: { 
              type: 'update',
              shape: updatedObject
            } 
          });
          
          // Event'i div.absolute üzerinden yayınla çünkü containerRef'i dinliyoruz canvas'ta
          canvasElement.dispatchEvent(updateEvent);
        }
      }
    }
  };
  
  return (
    <div className="bg-[#F5F5F5] font-sans text-gray-800 flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <ToolSidebar 
          activeTool={activeTool} 
          onToolChange={handleToolChange}
          onZoomIn={() => handleZoomChange(zoom * 1.2)}
          onZoomOut={() => handleZoomChange(zoom / 1.2)}
          onFitView={handleResetView}
        />
        
        <div className="flex-1 relative overflow-hidden" id="drawing-container">
          <div id="drawing-canvas">
            <DrawingCanvas 
              canvasState={canvasState}
              activeTool={activeTool}
              onMousePositionChange={handleMousePositionChange}
              onPanChange={handlePanChange}
              onZoomChange={handleZoomChange}
              onSelectObject={setSelectedObject}
              onCanvasSizeChange={handleCanvasSizeChange}
              onToolChange={handleToolChange}
              snapEnabled={snapEnabled}
            />
          </div>
        </div>
        
        <PropertiesSidebar 
          selectedObject={selectedObject} 
          onPropertyChange={handlePropertyChange}
        />
      </div>
      
      <StatusBar 
        activeTool={activeTool}
        gridSize={gridSize}
        zoom={zoom}
        mousePosition={mousePosition}
        snapEnabled={snapEnabled}
        onToggleSnap={toggleSnap}
        canvasState={canvasState}
      />
    </div>
  );
}
