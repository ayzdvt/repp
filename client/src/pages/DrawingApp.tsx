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
  
  // Daha basit ve etkili fit view fonksiyonu
  const handleResetView = () => {
    // Canvas'taki nesne sayısını al
    const drawingContainer = document.getElementById('drawing-container');
    if (!drawingContainer) return;
    
    const canvasElement = drawingContainer.querySelector('canvas');
    if (!canvasElement) return;
    
    // Özel bir event ile tüm şekilleri al
    const getAllShapes = () => {
      return new Promise<any[]>((resolve) => {
        const event = new CustomEvent('getAllShapes', {
          detail: { callback: (shapes: any[]) => resolve(shapes) }
        });
        
        const absoluteDiv = drawingContainer.querySelector('div.absolute');
        if (absoluteDiv) {
          absoluteDiv.dispatchEvent(event);
        } else {
          resolve([]);
        }
      });
    };
    
    getAllShapes().then(shapes => {
      // Eğer hiç şekil yoksa varsayılan görünüme dön
      if (!shapes || shapes.length === 0) {
        setZoom(1);
        setCanvasState(prev => ({
          ...prev,
          zoom: 1,
          panOffset: { x: 0, y: 0 }
        }));
        return;
      }
      
      // Tüm şekillerin sınırlarını hesapla
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
        else if (shape.type === 'polyline' && shape.points && shape.points.length > 0) {
          shape.points.forEach((p: any) => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
        }
      });
      
      // Sınırların geçerli olup olmadığını kontrol et
      if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
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
      
      // Sınırlara ekstra boşluk ekle
      const padding = 50; // Piksel olarak padding
      minX -= padding / zoom;
      minY -= padding / zoom;
      maxX += padding / zoom;
      maxY += padding / zoom;
      
      // Şekillerin genişlik ve yüksekliği
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Zoom faktörü hesapla (en iyi uyumu sağlamak için)
      const zoomX = canvasWidth / width;
      const zoomY = canvasHeight / height;
      let newZoom = Math.min(zoomX, zoomY) * 0.85; // Biraz daha küçült ki her şey rahat görünsün
      
      // Zoom sınırlarını kontrol et
      newZoom = Math.max(0.1, Math.min(newZoom, 5));
      
      // Merkez koordinatları
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Pan (kaydırma) değerlerini hesapla - çizimleri merkeze getir
      const panX = (canvasWidth / 2) - (centerX * newZoom);
      const panY = (canvasHeight / 2) + (centerY * newZoom);
      
      // Değerleri güncelle
      setZoom(newZoom);
      setCanvasState(prev => ({
        ...prev,
        zoom: newZoom,
        panOffset: { x: panX, y: panY }
      }));
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
      />
    </div>
  );
}
