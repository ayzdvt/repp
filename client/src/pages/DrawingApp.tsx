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
  
  // Tüm çizimleri ekrana sığdırmak için fit view fonksiyonu
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
            // Hiç çizim yoksa merkeze odaklan ve varsayılan zoom'a dön
            setZoom(1);
            setCanvasState(prev => ({
              ...prev,
              zoom: 1,
              panOffset: { x: canvasState.canvasSize.width / 2, y: canvasState.canvasSize.height / 2 }
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
              panOffset: { x: canvasState.canvasSize.width / 2, y: canvasState.canvasSize.height / 2 }
            }));
            return;
          }
          
          // Canvas boyutları
          const canvasWidth = canvasState.canvasSize.width;
          const canvasHeight = canvasState.canvasSize.height;
          
          // Kenar boşluğu çok küçük olsun - sadece çizimlerin tam kenarında olmasın
          const paddingPercent = 0.05; // %5 ekstra alan
          
          // Genişletilmiş sınırları hesapla (biraz ekstra alan)
          const expandedWidth = width * (1 + paddingPercent * 2);
          const expandedHeight = height * (1 + paddingPercent * 2);
          const expandedMinX = minX - width * paddingPercent;
          const expandedMaxX = maxX + width * paddingPercent;
          const expandedMinY = minY - height * paddingPercent;
          const expandedMaxY = maxY + height * paddingPercent;
          
          // En-boy oranlarını koruyarak, tüm çizimlerin tam sığacağı zoom seviyesini hesapla
          const zoomX = canvasWidth / expandedWidth;
          const zoomY = canvasHeight / expandedHeight;
          
          // En küçük zoom değerini kullan - böylece hem yatay hem dikey olarak tüm nesneler sığacak
          const newZoom = Math.min(zoomX, zoomY);
          
          // Genişletilmiş çizim alanının merkezi
          const centerX = (expandedMinX + expandedMaxX) / 2;
          const centerY = (expandedMinY + expandedMaxY) / 2;
          
          // Pan değerlerini, çizim alanının merkezi ekranın merkezine gelecek şekilde hesapla
          // Y ekseni canvas'ta ters olduğu için - ekranın üstü düşük Y değerleri
          const panX = (canvasWidth / 2) - (centerX * newZoom);
          const panY = (canvasHeight / 2) + (centerY * newZoom); 
          
          // Zoom ve pan değerlerini uygula
          setZoom(newZoom);
          setCanvasState(prev => ({
            ...prev,
            zoom: newZoom,
            panOffset: { x: panX, y: panY }
          }));
          
          console.log("Fit View - Tüm objeler ekrana sığdırıldı", { 
            objeSınırları: bounds, 
            genişletilmiş: { minX: expandedMinX, minY: expandedMinY, maxX: expandedMaxX, maxY: expandedMaxY },
            yeniZoom: newZoom, 
            yeniPan: { x: panX, y: panY } 
          });
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
