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
        
        // Koordinat değerleri çok büyükse (1000'den fazla) normalizasyon yapalım
        let shouldNormalize = false;
        // Herhangi bir koordinat 1000'den büyükse normalize etmeye karar verelim
        coordinates.forEach(coord => {
          if (Math.abs(coord.x) > 1000 || Math.abs(coord.y) > 1000) {
            shouldNormalize = true;
          }
        });
        
        // Koordinatları çizim için hazırla
        setTimeout(() => {
          // Canvas'a erişim
          const canvasContainer = document.getElementById('drawing-container') as HTMLElement;
          if (!canvasContainer) return;
          
          const canvasElement = canvasContainer.querySelector('div.absolute') as HTMLElement;
          if (!canvasElement) return;
          
          let coordsToUse = [...coordinates];
          
          // Eğer normalizasyon gerekiyorsa uygula
          if (shouldNormalize) {
            // Koordinatları normalize et
            const xValues = coordinates.map(c => c.x);
            const yValues = coordinates.map(c => c.y);
            
            const minX = Math.min(...xValues);
            const maxX = Math.max(...xValues);
            const minY = Math.min(...yValues);
            const maxY = Math.max(...yValues);
            
            // Büyük değerleri normalize edelim - her koordinattan en küçük değeri çıkaralım
            // Böylece koordinatlar 0'dan başlar ve en büyük X/Y değerine göre ölçeklendirme yapalım
            
            // X ve Y aralıklarını hesapla
            const xRange = maxX - minX;
            const yRange = maxY - minY;
            
            // X veya Y'nin çok büyük olduğu durumlar için (milyon gibi) ek ölçeklendirme 
            // Standart çizim alanı için ideal max değer ~100 birim olsun
            const idealRange = 100;
            const scaleFactorX = xRange > idealRange ? idealRange / xRange : 1;
            const scaleFactorY = yRange > idealRange ? idealRange / yRange : 1;
            
            // İki eksendeki ölçeklendirme faktörlerinden daha kısıtlayıcı olanı seçelim
            // Böylece oranlar korunur
            const scaleFactor = Math.min(scaleFactorX, scaleFactorY);
            
            coordsToUse = coordinates.map(coord => ({
              // X değerini normalize et ve ölçeklendir
              x: (coord.x - minX) * scaleFactor,
              // Y değerini normalize et ve ölçeklendir
              y: (coord.y - minY) * scaleFactor,
              No: coord.No
            }));
            
            console.log("Normalize edilmiş koordinatlar:", coordsToUse);
          }
          
          // Koordinatları nokta olarak ekle
          coordsToUse.forEach((coord, index) => {
            // Her bir koordinat için bir nokta oluştur
            const createPointEvent = new CustomEvent('createshape', { 
              detail: { 
                type: 'point',
                x: coord.x,
                y: coord.y,
                style: 'default',
                id: Date.now() + index // Benzersiz ID oluştur
              } 
            });
            
            // Event'i div.absolute üzerinden yayınla
            canvasElement.dispatchEvent(createPointEvent);
          });
          
          // LocalStorage'ı temizle (tekrar yüklenince aynı noktaları oluşturmamak için)
          localStorage.removeItem('parselCoordinates');
          
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
    
    // Bu hesaplamalar artık gereksiz, doğrudan worldToScreen dönüşüm mantığını kullanacağız
    
    // canvasUtils.ts'deki worldToScreen fonksiyonunu kullanarak panOffset değerlerini hesaplayalım
    // Orijinal worldToScreen formülünden:
    // screenX = worldX * zoom + width / 2 + panOffset.x;
    // screenY = height / 2 - worldY * zoom + panOffset.y;
    
    // Yani, centerX ve centerY dünya koordinatlarını ekranın ortasına getirmek için:
    // canvasWidth / 2 = centerX * zoom + canvasWidth / 2 + panOffset.x
    // canvasHeight / 2 = canvasHeight / 2 - centerY * zoom + panOffset.y
    
    // Bu denklemleri çözersek:
    // panOffset.x = -centerX * zoom
    // panOffset.y = centerY * zoom
    
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
