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
  
  // Çok daha basit Fit View fonksiyonu
  const handleResetView = () => {
    // Doğrudan canvas'ı kullanalım
    const drawingContainer = document.getElementById('drawing-container');
    if (!drawingContainer) return;
    
    // Canvas element'ini al
    const absoluteDiv = drawingContainer.querySelector('div.absolute');
    
    if (!absoluteDiv) return;
    
    // Shapeleri alma işlevini çağır
    absoluteDiv.dispatchEvent(new CustomEvent('getAllShapes', {
      detail: { 
        callback: (shapes: any[]) => {
          if (!shapes || shapes.length === 0) {
            // Hiç şekil yoksa - merkeze git, zoom 1 olsun
            setZoom(1);
            setCanvasState(prev => ({
              ...prev,
              zoom: 1,
              panOffset: { x: 0, y: 0 }
            }));
            return;
          }
          
          // Y ekseni tersine olduğu için (0,0) alttan başlar, ancak normal koordinat sisteminde yukarıdan başlar
          let bounds = { 
            minX: Infinity, 
            minY: Infinity, 
            maxX: -Infinity, 
            maxY: -Infinity 
          };
          
          // Tüm şekilleri dolaş ve sınırları hesapla
          shapes.forEach(shape => {
            if (shape.type === 'point') {
              bounds.minX = Math.min(bounds.minX, shape.x);
              bounds.minY = Math.min(bounds.minY, shape.y);
              bounds.maxX = Math.max(bounds.maxX, shape.x);
              bounds.maxY = Math.max(bounds.maxY, shape.y);
            } 
            else if (shape.type === 'line') {
              bounds.minX = Math.min(bounds.minX, shape.startX, shape.endX);
              bounds.minY = Math.min(bounds.minY, shape.startY, shape.endY);
              bounds.maxX = Math.max(bounds.maxX, shape.startX, shape.endX);
              bounds.maxY = Math.max(bounds.maxY, shape.startY, shape.endY);
            }
            else if (shape.type === 'polyline' && shape.points && shape.points.length > 0) {
              shape.points.forEach((point: {x: number, y: number}) => {
                bounds.minX = Math.min(bounds.minX, point.x);
                bounds.minY = Math.min(bounds.minY, point.y);
                bounds.maxX = Math.max(bounds.maxX, point.x);
                bounds.maxY = Math.max(bounds.maxY, point.y);
              });
            }
          });
          
          // Sınırlar geçerli değilse (hiç şekil yoksa) - varsayılan görünüme dön
          if (bounds.minX === Infinity) {
            setZoom(1);
            setCanvasState(prev => ({
              ...prev,
              zoom: 1,
              panOffset: { x: 0, y: 0 }
            }));
            return;
          }
          
          // Görünür alan hesapla
          const width = bounds.maxX - bounds.minX;
          const height = bounds.maxY - bounds.minY;
          
          // Canvas boyutları
          const canvasWidth = canvasState.canvasSize.width;
          const canvasHeight = canvasState.canvasSize.height;
          
          // Marj ekle
          const margin = 20; // Dünya koordinatlarında marj
          bounds.minX -= margin;
          bounds.minY -= margin;
          bounds.maxX += margin;
          bounds.maxY += margin;
          
          // Güncellenen boyutlar
          const totalWidth = bounds.maxX - bounds.minX;
          const totalHeight = bounds.maxY - bounds.minY;
          
          // En iyi zoom faktörünü hesapla
          // Y ekseni ters olduğu için, yükseklik ölçeklendirmesi negatif olmalı
          const zoomFactorX = canvasWidth / totalWidth;
          const zoomFactorY = canvasHeight / totalHeight;
          
          // En kısıtlayıcı faktörü al, her şeyin görünür olduğundan emin ol
          const zoomFactor = Math.min(zoomFactorX, zoomFactorY) * 0.9; // %90 ölçeklendirme (kenarlar için marj)
          
          // Merkez hesapla
          const centerX = (bounds.minX + bounds.maxX) / 2;
          const centerY = (bounds.minY + bounds.maxY) / 2;
          
          // Yeni panOffset hesapla - merkez noktasını canvasın ortasına getir
          // Y ekseni tersine olduğu için negatif olmalı
          const panX = canvasWidth / 2 - centerX * zoomFactor;
          const panY = canvasHeight / 2 + centerY * zoomFactor; 
          
          // Canvas'ı güncelle
          setZoom(zoomFactor);
          setCanvasState(prev => ({
            ...prev,
            zoom: zoomFactor,
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
