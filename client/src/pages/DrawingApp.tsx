import { useState, useRef, useEffect } from "react";
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
  
  const handlePanChange = (x: number, y: number) => {
    setCanvasState(prev => ({
      ...prev,
      panOffset: { x, y }
    }));
  };
  
  // Tüm çizimleri ekrana sığdıran Fit View fonksiyonu
  const handleResetView = () => {
    // Canvas element referansını al
    const drawingContainer = document.getElementById('drawing-container');
    if (!drawingContainer) return;
    
    // Absolute div'i bul
    const absoluteDiv = drawingContainer.querySelector('div.absolute');
    if (!absoluteDiv) return;
    
    // Canvas boyutları
    const canvasWidth = canvasState.canvasSize.width;
    const canvasHeight = canvasState.canvasSize.height;
    
    // Tüm şekilleri al
    absoluteDiv.dispatchEvent(new CustomEvent('getAllShapes', {
      detail: { 
        callback: (shapes: any[]) => {
          // Hiç şekil yoksa, (0,0) noktasına odaklan ve varsayılan zoom
          if (!shapes || shapes.length === 0) {
            console.log("Hiç çizim bulunamadı, varsayılan görünüme dönülüyor");
            setZoom(1);
            setCanvasState(prev => ({
              ...prev,
              zoom: 1,
              panOffset: { x: canvasWidth / 2, y: canvasHeight / 2 }
            }));
            return;
          }
          
          // Tüm şekillerin en uç noktalarını bul
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          
          // Her bir şekli dolaş
          shapes.forEach(shape => {
            try {
              if (shape.type === 'point') {
                // Nokta şekli için
                minX = Math.min(minX, shape.x);
                minY = Math.min(minY, shape.y);
                maxX = Math.max(maxX, shape.x);
                maxY = Math.max(maxY, shape.y);
              } 
              else if (shape.type === 'line') {
                // Çizgi şekli için
                minX = Math.min(minX, shape.startX, shape.endX);
                minY = Math.min(minY, shape.startY, shape.endY);
                maxX = Math.max(maxX, shape.startX, shape.endX);
                maxY = Math.max(maxY, shape.startY, shape.endY);
              }
              else if (shape.type === 'polyline' && Array.isArray(shape.points)) {
                // Polyline şekli için
                shape.points.forEach(point => {
                  if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                  }
                });
              }
            } catch (error) {
              console.error("Şekil işleme hatası:", error);
            }
          });
          
          console.log("Çizim sınırları:", { minX, minY, maxX, maxY });
          
          // Eğer sınırlar geçersizse, varsayılan görünüme dön
          if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
            console.log("Geçerli sınırlar bulunamadı, varsayılan görünüme dönülüyor");
            setZoom(1);
            setCanvasState(prev => ({
              ...prev,
              zoom: 1,
              panOffset: { x: canvasWidth / 2, y: canvasHeight / 2 }
            }));
            return;
          }
          
          // Sadece tek nokta veya çok küçük bir alan varsa marj ekle
          if (Math.abs(maxX - minX) < 0.1) {
            minX -= 20;
            maxX += 20;
          }
          
          if (Math.abs(maxY - minY) < 0.1) {
            minY -= 20;
            maxY += 20;
          }
          
          // Kenarlardan marj bırak
          const margin = 40; // Birim ölçek
          minX -= margin;
          minY -= margin;
          maxX += margin;
          maxY += margin;
          
          // Çizim alanının boyutlarını hesapla
          const drawingWidth = maxX - minX;
          const drawingHeight = maxY - minY;
          
          // Çizim merkezi
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          
          // En uygun zoom seviyesini bul
          // Çizim alanının canvas'a sığması için gereken minimum zoom
          const zoomX = canvasWidth / drawingWidth;
          const zoomY = canvasHeight / drawingHeight;
          
          // En kısıtlayıcı zoom faktörünü seç (her şeyin görünür olduğundan emin ol)
          const newZoom = Math.min(zoomX, zoomY) * 0.9; // %90 ölçek (ekstra marj)
          
          console.log("Zoom faktörleri:", { zoomX, zoomY, seçilen: newZoom });
          
          // Görüşün merkezi çizimin merkezine gelecek şekilde pan hesapla
          const panX = canvasWidth / 2 - centerX * newZoom;
          const panY = canvasHeight / 2 + centerY * newZoom;
          
          console.log("Pan değerleri:", { panX, panY, merkez: {centerX, centerY} });
          
          // Canvas'ı güncelle
          setZoom(newZoom);
          setCanvasState(prev => ({
            ...prev,
            zoom: newZoom,
            panOffset: { x: panX, y: panY }
          }));
        }
      }
    }));
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
      />
    </div>
  );
}
