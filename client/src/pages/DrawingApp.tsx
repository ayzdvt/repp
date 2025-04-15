import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import ToolSidebar from "@/components/ToolSidebar";
import PropertiesSidebar from "@/components/PropertiesSidebar";
import StatusBar from "@/components/StatusBar";
import DrawingCanvas from "@/components/DrawingCanvas";
import PointCoordinateDialog from "@/components/PointCoordinateDialog";
import ParallelDistanceDialog from "@/components/ParallelDistanceDialog";
import { CanvasState, Tool, Point } from "@/types";

export default function DrawingApp() {
  const [activeTool, setActiveTool] = useState<Tool>("selection");
  const [zoom, setZoom] = useState<number>(1);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [gridSize, setGridSize] = useState<number>(10);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [orthoEnabled, setOrthoEnabled] = useState<boolean>(false); // Ortho mod durumu
  const [paralelModu, setParalelModu] = useState<boolean>(false); // Paralel mod durumu
  const [canvasState, setCanvasState] = useState<CanvasState>({
    gridSize: 10,
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    canvasSize: { width: 0, height: 0 }
  });
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [isPointDialogOpen, setIsPointDialogOpen] = useState<boolean>(false);
  
  // Canvas içindeki referans
  // Removed canvasRef
  
  // Artık LocalStorage'dan nokta bilgisi kontrolüne gerek yok
  
  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
    
    // Araç değiştiğinde seçimi temizle
    if (selectedObject) {
      setSelectedObject(null);
    }
    
    // Paralel modu aktifse ve başka araca geçilirse iptal et
    if (paralelModu) {
      // Paralel modunu kapat
      setParalelModu(false);
      
      // Açık dialog varsa kapat
      if (isParallelDialogOpen) {
        setIsParallelDialogOpen(false);
      }
      
      // Önizleme çizgilerini temizle
      setParallelPreviewLines([]);
      setParallelLineSource(null);
      
      // Canvas'a önizlemeleri temizle olayını gönder
      const canvasContainer = document.getElementById('drawing-container');
      if (canvasContainer) {
        const canvasElement = canvasContainer.querySelector('div.absolute');
        if (canvasElement) {
          const clearEvent = new CustomEvent('clearParallelPreviews', {});
          canvasElement.dispatchEvent(clearEvent);
        }
      }
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
    const newZoom = Math.min(zoomX, zoomY) * 0.9; // %90 faktör (kenar marjları için)
    
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
    
    // X ve Y eksenlerinin yerlerini değiştirdik, yeni koordinat sistemi için hesaplama yapılmalı
    // Yeni koordinat sisteminde X ekseni dikey, Y ekseni yatay
    // Yeni worldToScreen formülümüz:
    // screenX = worldY * zoom + width / 2 + panOffset.x;
    // screenY = height / 2 - worldX * zoom + panOffset.y;
    
    // Çözersek:
    // panOffset.x = -centerY * zoom
    // panOffset.y = centerX * zoom
    
    const panOffsetX = -centerY * newZoom;
    const panOffsetY = centerX * newZoom;
    
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
  
  // Ortho modu için toggle fonksiyonu
  const toggleOrtho = () => {
    setOrthoEnabled(prevState => !prevState);
  };
  
  const handleCanvasSizeChange = (width: number, height: number) => {
    setCanvasState(prev => ({
      ...prev, 
      canvasSize: { width, height }
    }));
  };
  
  // Nesne seçimini ele alan fonksiyon
  const handleObjectSelection = (object: any) => {
    // Paralel modunda ise
    if (paralelModu) {
      // Herhangi bir obje seçildiğinde ve obje bir çizgi ise
      if (object && object.type === 'line') {
        // Seçilen çizgiyi kaydet
        setParallelLineSource(object);
        
        // Paralel mesafe girişi dialogunu aç
        setIsParallelDialogOpen(true);
        
        // Paralel modunu kapatmıyoruz artık
        // setParalelModu(false); - Bu kod çift çizgi sorununa neden oluyordu, bu yüzden kaldırıldı
      } else if (object) {
        // Çizgi olmayan bir obje seçildiğinde uyarı ver
        alert('Paralel çizgi oluşturmak için sadece çizgiler seçilebilir.');
      }
    } else {
      // Normal nesne seçimi
      setSelectedObject(object);
    }
  };
  
  // Nesne özelliklerinde değişiklik yapıldığında bu fonksiyon çağrılacak
  const handlePropertyChange = (
    property: string, 
    value: number | string, 
    objectId: number
  ) => {
    // Mevcut seçili nesnenin bir kopyasını oluştur
    if (selectedObject && selectedObject.id === objectId) {
      // Çizimi işlem kaydına eklemeden önce mevcut durumu kaydedelim
      const originalObject = { ...selectedObject };
      
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
          // İşlem tarihçesine ekleme için gerekli bilgileri içeren özel detaylarla olayı oluştur
          const updateEvent = new CustomEvent('shapeupdate', { 
            detail: { 
              type: 'update',
              shape: updatedObject,
              // İşlem tarihçesi için ek detaylar
              operation: {
                type: 'update_shape',
                originalShape: originalObject,
                updatedShape: updatedObject,
                propertyName: property
              }
            } 
          });
          
          // Event'i div.absolute üzerinden yayınla çünkü containerRef'i dinliyoruz canvas'ta
          canvasElement.dispatchEvent(updateEvent);
        }
      }
    }
  };
  
  // Test noktaları ekleme fonksiyonu kaldırıldı

  // Paralel oluşturma için state'ler
  const [isParallelDialogOpen, setIsParallelDialogOpen] = useState<boolean>(false);
  const [parallelLineSource, setParallelLineSource] = useState<any>(null);
  const [parallelPreviewLines, setParallelPreviewLines] = useState<any[]>([]);
  
  // Koordinat giriş diyalogu açıldığında çağrılacak fonksiyon
  const handleOpenPointDialog = () => {
    setIsPointDialogOpen(true);
  };
  
  // Koordinat giriş diyalogu kapatıldığında çağrılacak fonksiyon
  const handleClosePointDialog = () => {
    setIsPointDialogOpen(false);
  };
  
  // Paralel oluşturma işlemini başlatan fonksiyon
  const handleStartParallel = () => {
    // Paralel modunu aktifleştir
    setParalelModu(true);
    
    // Mevcut seçimi sıfırla
    setSelectedObject(null);
    
    // Görsel olarak selection aracını seçili hale getir
    // böylece kullanıcı paralel modu ile selection aracının birlikte çalıştığını görecek
    setActiveTool('selection');
  };
  
  // Paralel diyalogunu kapatan fonksiyon
  const handleCloseParallelDialog = () => {
    setIsParallelDialogOpen(false);
    // Önizleme çizgilerini temizle
    setParallelPreviewLines([]);
    setParallelLineSource(null);
  };
  
  // Paralel mesafesi ayarlandığında çağrılan fonksiyon
  const handleApplyParallelDistance = (distance: number) => {
    if (!parallelLineSource) return;
    
    // İlk çizginin noktaları
    const { startX, startY, endX, endY } = parallelLineSource;
    
    // Çizginin vektör bilgilerini hesapla
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Birim vektörü
    const unitX = dx / length;
    const unitY = dy / length;
    
    // Dik birim vektör (90 derece saat yönünün tersine)
    const perpX = -unitY;
    const perpY = unitX;
    
    // Her iki yöne çizgi oluştur (hem pozitif hem negatif)
    
    // Pozitif yöndeki çizgi (seçilen çizginin bir tarafı)
    const positiveLineId = Date.now();
    const positiveLine = {
      id: positiveLineId,
      type: 'line',
      startX: startX + perpX * distance,
      startY: startY + perpY * distance,
      endX: endX + perpX * distance,
      endY: endY + perpY * distance,
      thickness: parallelLineSource.thickness,
      isPreview: false
    };
    
    // Negatif yöndeki çizgi (seçilen çizginin diğer tarafı)
    const negativeLineId = positiveLineId + 1;
    const negativeLine = {
      id: negativeLineId,
      type: 'line',
      startX: startX - perpX * distance,
      startY: startY - perpY * distance,
      endX: endX - perpX * distance,
      endY: endY - perpY * distance,
      thickness: parallelLineSource.thickness,
      isPreview: false
    };
    
    // Canvas'a çizgileri ekle
    const canvasContainer = document.getElementById('drawing-container');
    if (canvasContainer) {
      const canvasElement = canvasContainer.querySelector('div.absolute');
      if (canvasElement) {
        // Diyalogu kapat ve paralel modu hariç state'leri temizle
        setIsParallelDialogOpen(false);
        setParallelPreviewLines([]);
        setParallelLineSource(null);
        
        // Seçili nesneyi temizle
        setSelectedObject(null);
        
        // Test: Önce bir konsol log ekleyelim ve her şeyi temizleyelim
        console.log("TEST PARALEL: Dialog kapatıldı, çizgiler oluşturuluyor");
        
        // Pozitif ve negatif çizgileri birleştirip tek bir event olarak göndereceğiz
        // Tek seferde işlem yapmak için 'batch' tipinde yeni bir event oluşturuyoruz
        const parallelLinesEvent = new CustomEvent('shapeupdate', {
          detail: {
            type: 'batch', // Yeni tip: 'batch'
            shapes: [positiveLine, negativeLine] // Her iki çizgiyi de tek bir işlemde ekleyelim
          }
        });
        
        console.log("TEST PARALEL: Çizgiler event'e eklendi:", positiveLine, negativeLine);
        
        // Event'i sadece bir kez gönderelim
        canvasElement.dispatchEvent(parallelLinesEvent);
        
        // ÖNEMLİ: Paralel modunu açık tut
        // setParalelModu(false); - Bu satırı kaldırdık
        // setActiveTool('line'); - Bu satırı kaldırdık
      }
    }
  };
  
  // Paralel çizgi seçildiğinde çağrılan fonksiyon - Artık bu fonksiyon kullanılmıyor
  // Bu fonksiyon tamamen kaldırıldı ve yerine yeni sistem kullanılıyor.
  // Event listener'ları da tamamen kaldırıldı, bu fonksiyon artık kullanılmıyor.
  const handleSelectParallelLine = (direction: 'positive' | 'negative') => {
    console.log("Eski paralel önizleme temizleme işlevi çağrıldı, ancak artık kullanılmıyor");
    return; // Hiçbir işlem yapmadan çık
  };
  
  // Koordinat girişinden nokta eklemek için fonksiyon
  const handleAddPointFromCoordinates = (x: number, y: number) => {
    console.log(`Koordinat girişinden nokta ekleniyor: (${x}, ${y})`);
    
    // Canvas element'ini bul
    const canvasContainer = document.getElementById('drawing-container');
    if (canvasContainer) {
      const canvasElement = canvasContainer.querySelector('div.absolute');
      if (canvasElement) {
        // Yeni nokta oluştur
        const newPoint = {
          id: Date.now(),
          type: 'point',
          x,
          y,
          style: 'default'
        };
        
        // CustomEvent oluştur
        const addEvent = new CustomEvent('shapeupdate', {
          detail: {
            type: 'add',
            shape: newPoint
          }
        });
        
        // Olayı gönder
        canvasElement.dispatchEvent(addEvent);
        
        // Nokta ekledikten sonra dialog'u kapat
        setIsPointDialogOpen(false);
      }
    }
  };
  
  // NOT: Eski paralel çizgi yöntemi kaldırıldı ve kullanım dışı bırakıldı
  // Bu event listener'ları artık kullanılmıyor, kaldırıldı.

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
          onOpenPointDialog={handleOpenPointDialog}
          onStartParallel={handleStartParallel}
        />
        
        <div className="flex-1 relative overflow-hidden" id="drawing-container">
          <div id="drawing-canvas">
            <DrawingCanvas 
              canvasState={canvasState}
              activeTool={activeTool}
              onMousePositionChange={handleMousePositionChange}
              onPanChange={handlePanChange}
              onZoomChange={handleZoomChange}
              onSelectObject={handleObjectSelection}
              onCanvasSizeChange={handleCanvasSizeChange}
              onToolChange={handleToolChange}
              snapEnabled={snapEnabled}
              orthoEnabled={orthoEnabled}
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
        orthoEnabled={orthoEnabled}
        onToggleOrtho={toggleOrtho}
        canvasState={canvasState}
        parallelMode={paralelModu}
      />
      
      {/* Koordinat Girişi Dialog'u */}
      <PointCoordinateDialog 
        isOpen={isPointDialogOpen} 
        onClose={handleClosePointDialog} 
        onAddPoint={handleAddPointFromCoordinates}
      />
      
      {/* Paralel Mesafe Dialog'u */}
      <ParallelDistanceDialog
        isOpen={isParallelDialogOpen}
        onClose={handleCloseParallelDialog}
        onApplyDistance={handleApplyParallelDistance}
      />
    </div>
  );
}
