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
  
  // Çizimlerin bulunduğu alana odaklanmak için fit view fonksiyonu
  const handleResetView = () => {
    // Canvas element referansını al
    const canvasContainer = document.getElementById('drawing-container') as HTMLElement;
    if (!canvasContainer) return;
    
    const canvasElement = canvasContainer.querySelector('div.absolute') as HTMLElement;
    if (!canvasElement) return;
    
    // Özel olay ile çizimlerin sınırlarını almak için istek gönder
    const event = new CustomEvent('getShapesBounds', {
      detail: { 
        callback: (bounds: { minX: number, minY: number, maxX: number, maxY: number } | null) => {
          if (!bounds) {
            // Hiç çizim yoksa merkeze odaklan
            setZoom(1);
            setCanvasState(prev => ({
              ...prev,
              zoom: 1,
              panOffset: { x: 0, y: 0 }
            }));
            return;
          }
          
          // Eğer çizimler varsa, sınırlara göre hesapla
          const { minX, minY, maxX, maxY } = bounds;
          const width = maxX - minX;
          const height = maxY - minY;
          
          // Boş çizim alanı kontrolü
          if (width === 0 && height === 0) {
            setZoom(1);
            setCanvasState(prev => ({
              ...prev,
              zoom: 1,
              panOffset: { x: 0, y: 0 }
            }));
            return;
          }
          
          // Canvas boyutları
          const canvasWidth = canvasState.canvasSize.width;
          const canvasHeight = canvasState.canvasSize.height;
          
          // Zoom hesaplama (tüm çizimleri görebilmek için)
          // Padding eklemek için 0.9 ile çarp
          const zoomX = (canvasWidth / width) * 0.8;
          const zoomY = (canvasHeight / height) * 0.8;
          const newZoom = Math.min(zoomX, zoomY);
          
          // Merkez hesaplama
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          
          // Pan hesaplama (çizimlerin merkezi canvasın merkezine gelecek şekilde)
          const panX = (canvasWidth / 2) - (centerX * newZoom);
          const panY = (canvasHeight / 2) + (centerY * newZoom);
          
          // Zoom ve pan güncelleme
          setZoom(newZoom);
          setCanvasState(prev => ({
            ...prev,
            zoom: newZoom,
            panOffset: { x: panX, y: panY }
          }));
        }
      } 
    });
    
    canvasElement.dispatchEvent(event);
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
