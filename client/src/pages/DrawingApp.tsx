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
    
    // Tüm şekillerin sınırlarını bulma
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    // Çizim yoksa, varsayılan görünüme geri dön
    if (!shapes || shapes.length === 0) {
      setZoom(1);
      setCanvasState(prev => ({
        ...prev,
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      }));
      return;
    }
    
    // Tüm şekillerin sınırlarını bul
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
        maxX = Math.max(maxX, shape.x + 20); // Yaklaşık metin genişliği
        maxY = Math.max(maxY, shape.y + 20); // Yaklaşık metin yüksekliği
      }
    });
    
    // Geçerli sınırlar yoksa, varsayılan görünüme dön
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      setZoom(1);
      setCanvasState(prev => ({
        ...prev,
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      }));
      return;
    }
    
    // Çizimlerin çevresine kenar boşluğu ekle
    const padding = 50; // Çizimlerin etrafındaki boşluk miktarı
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Tek nokta veya çok küçük çizimler için daha fazla boşluk ekle
    if (Math.abs(maxX - minX) < 10) {
      minX -= 50;
      maxX += 50;
    }
    
    if (Math.abs(maxY - minY) < 10) {
      minY -= 50;
      maxY += 50;
    }
    
    // Tüm şekillerin boyutlarını hesapla
    const objectsWidth = maxX - minX;
    const objectsHeight = maxY - minY;
    
    // X ve Y eksenleri için zoom oranlarını hesapla
    const zoomX = canvasWidth / objectsWidth;
    const zoomY = canvasHeight / objectsHeight;
    
    // Her iki eksendeki sınırlamalara göre daha küçük zoom değerini seç
    const newZoom = Math.min(zoomX, zoomY) * 0.95; // %95 ölçek (ekstra marj için)
    
    // Orta noktayı hesapla
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Zoom'u ayarla
    setZoom(newZoom);
    
    // Canvas'ı ortala
    // Dünya koordinatlarındaki merkezi ekranın ortasına getirmeliyiz
    // worldToScreen mantığına göre dönüşüm yapıyoruz
    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom,
      panOffset: {
        x: canvasWidth / 2 - centerX * newZoom,
        y: canvasHeight / 2 + centerY * newZoom // Y ekseni yukarı pozitif olduğu için işaretler bu şekilde olmalı
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
        canvasState={canvasState}
      />
    </div>
  );
}
