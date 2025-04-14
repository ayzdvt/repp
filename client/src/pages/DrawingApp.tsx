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
  
  // Şekilleri depolamak için referans
  const shapesRef = useRef<any[]>([]);
  
  // Test için koordinatları doğrudan ekleyen fonksiyon
  const addTestCoordinates = () => {
    console.log("Test koordinatları ekleniyor...");
    const testCoordinates = [
      { No: 8, x: 4540345.97, y: 438538.46 },
      { No: 9, x: 4540358.64, y: 438539.69 },
      { No: 10, x: 4540362.61, y: 438544.59 },
      { No: 11, x: 4540359.53, y: 438561.74 },
      { No: 31, x: 4540343.54, y: 438560.07 }
    ];
    
    // Canvas'a erişim
    const canvasContainer = document.getElementById('drawing-container') as HTMLElement;
    if (!canvasContainer) return;
    
    const canvasElement = canvasContainer.querySelector('div.absolute') as HTMLElement;
    if (!canvasElement) return;
    
    // Ortak başlangıç ID'si
    const startId = Date.now();
    
    // Her bir koordinat için bir nokta oluştur ve event ile ekle
    testCoordinates.forEach((coord, index) => {
      // Test noktası oluştur
      const pointShape = {
        id: startId + index,
        type: 'point',
        x: coord.x,
        y: coord.y,
        style: 'default'
      };
      
      // Event oluştur ve gönder
      const updateEvent = new CustomEvent('shapeupdate', { 
        detail: { 
          type: 'update',
          shape: pointShape
        } 
      });
      
      // Event'i div.absolute üzerinden yayınla
      canvasElement.dispatchEvent(updateEvent);
      console.log(`Test noktası ${index + 1} eklendi:`, pointShape);
    });
    
    // Canvas'ı yenile için küçük bir gecikme
    setTimeout(() => {
      handleResetView();
      console.log("Test koordinatları eklendi, görünüm ayarlandı");
    }, 100);
  };

  // LocalStorage'dan koordinatları al ve çizim alanına ekle
  useEffect(() => {
    // Test için koordinatları ekle
    setTimeout(() => {
      addTestCoordinates();
    }, 1000);
    
    // Sayfa yüklendiğinde localStorage'dan koordinatları kontrol et
    const coordsString = localStorage.getItem('parselCoordinates');
    if (!coordsString) return;
    
    try {
      const coordinates = JSON.parse(coordsString);
      
      if (Array.isArray(coordinates) && coordinates.length > 2) {
        console.log("LocalStorage'dan parsel koordinatları bulundu:", coordinates);
        
        // Koordinatları çizim için hazırla
        setTimeout(() => {
          // Canvas'a erişim
          const canvasContainer = document.getElementById('drawing-container') as HTMLElement;
          if (!canvasContainer) return;
          
          const canvasElement = canvasContainer.querySelector('div.absolute') as HTMLElement;
          if (!canvasElement) return;
          
          // Koordinatlardan No alanını çıkarıp sadece x ve y değerlerini kullan
          const cleanedCoordinates = coordinates.map(coord => ({
            x: coord.x,
            y: coord.y
          }));
          
          // Polyline oluşturmak için event gönder
          const createEvent = new CustomEvent('createshape', { 
            detail: { 
              type: 'polyline',
              points: cleanedCoordinates,
              thickness: 2,
              closed: true
            } 
          });
          
          // Event'i div.absolute üzerinden yayınla
          canvasElement.dispatchEvent(createEvent);
          
          // LocalStorage'ı temizle (tekrar yüklenince aynı polyline'ı oluşturmamak için)
          localStorage.removeItem('parselCoordinates');
          
          // Görünümü tam ekrana uyarla
          handleResetView();
        }, 1500); // Canvas tamamen yüklendikten sonra işlem yapabilmek için 1.5 saniye bekle
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
    console.log("Fit View başlatılıyor...");
    
    // Canvas'ı al
    const drawingContainer = document.getElementById('drawing-container');
    if (!drawingContainer) {
      console.error("drawing-container elementine erişilemiyor");
      return;
    }
    
    // Absolute div'i bul
    const absoluteDiv = drawingContainer.querySelector('div.absolute');
    if (!absoluteDiv) {
      console.error("div.absolute elementine erişilemiyor");
      return;
    }
    
    // Canvas boyutları
    const canvasWidth = canvasState.canvasSize.width;
    const canvasHeight = canvasState.canvasSize.height;
    console.log("Canvas boyutları:", canvasWidth, canvasHeight);
    
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
    
    // Çok büyük koordinatlar için
    if (minX > 1000000 || maxX > 1000000 || minY > 1000000 || maxY > 1000000) {
      console.log("Büyük koordinatlar tespit edildi, özel zoom hesaplanıyor");
      
      // Tek bir koordinat mı, yoksa bir koordinat grubu mu olduğunu kontrol et
      const width = maxX - minX;
      const height = maxY - minY;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Eğer bir alan varsa (birden fazla nokta), çok düşük bir zoom faktörüyle yap
      if (width > 0 && height > 0) {
        console.log("Koordinat alanı:", width, height);
        
        // Çok düşük bir zoom değeri hesapla
        const fixedZoom = 0.0000005;
        
        // panOffset değerleri
        const panOffsetX = -centerX * fixedZoom;
        const panOffsetY = centerY * fixedZoom;
        
        console.log("Büyük koordinatlar için hesaplanan değerler:", {
          zoom: fixedZoom,
          panOffsetX,
          panOffsetY,
          centerX,
          centerY
        });
        
        // Ayarla
        setZoom(fixedZoom);
        setCanvasState({
          gridSize: 10,
          zoom: fixedZoom,
          panOffset: { x: panOffsetX, y: panOffsetY },
          canvasSize: canvasState.canvasSize
        });
      }
      else {
        // Tek bir nokta ise
        console.log("Tek büyük koordinat noktası:", centerX, centerY);
        
        // Daha yüksek bir zoom değeri kullan
        const fixedZoom = 0.0000005;
        
        // panOffset değerleri
        const panOffsetX = -centerX * fixedZoom;
        const panOffsetY = centerY * fixedZoom;
        
        // Ayarla
        setZoom(fixedZoom);
        setCanvasState({
          gridSize: 10,
          zoom: fixedZoom,
          panOffset: { x: panOffsetX, y: panOffsetY },
          canvasSize: canvasState.canvasSize
        });
      }
      
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
    
    // Merkez noktayı hesapla
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Zoom faktörlerini hesapla
    const zoomX = canvasWidth / width;
    const zoomY = canvasHeight / height;
    
    // Daha kısıtlayıcı olanı seç
    const newZoom = Math.min(zoomX, zoomY) * 0.9; // %90 faktör (kenar marjları için)
    
    console.log("Fit View - Hesaplanan zoom faktörleri:", { zoomX, zoomY, newZoom });
    
    console.log("Fit View - Merkez noktası:", { centerX, centerY });
    
    // canvasUtils.ts'deki worldToScreen formülleri
    // screenX = worldX * zoom + width / 2 + panOffset.x;
    // screenY = height / 2 - worldY * zoom + panOffset.y;
    
    // centerX ve centerY dünya koordinatlarını ekranın ortasına getirmek için
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
      
      <div className="flex items-center bg-gray-200 px-4 py-2">
        <button 
          className="mr-4 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            // Buraya tıklandığında manuel olarak bir nokta ekleyelim
            // Canvas'a erişim
            const canvasContainer = document.getElementById('drawing-container') as HTMLElement;
            if (!canvasContainer) return;
            
            const canvasElement = canvasContainer.querySelector('div.absolute') as HTMLElement;
            if (!canvasElement) return;
            
            // Test noktası oluştur
            const testPoint = {
              id: Date.now(),
              type: 'point',
              x: 4540345.97,
              y: 438538.46,
              style: 'default'
            };
            
            // Event oluştur ve gönder
            const updateEvent = new CustomEvent('shapeupdate', { 
              detail: { 
                type: 'update',
                shape: testPoint
              } 
            });
            
            // Event'i div.absolute üzerinden yayınla
            canvasElement.dispatchEvent(updateEvent);
            console.log("Manuel test noktası eklendi:", testPoint);
            
            // Canvas'ı yenile için küçük bir gecikme
            setTimeout(() => {
              handleResetView();
            }, 100);
          }}
        >
          Büyük Koordinat Test
        </button>
      
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
    </div>
  );
}
