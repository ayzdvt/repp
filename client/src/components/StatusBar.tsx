import React from 'react';
import { Tool, Point, CanvasState } from '@/types';

interface StatusBarProps {
  activeTool: Tool;
  gridSize: number;
  zoom: number;
  mousePosition: Point;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  canvasState: CanvasState; // Görülebilir koordinat aralığını hesaplamak için canvasState'i alıyoruz
}

const StatusBar: React.FC<StatusBarProps> = ({ 
  activeTool, 
  gridSize, 
  zoom, 
  mousePosition,
  snapEnabled,
  onToggleSnap,
  canvasState
}) => {
  // Format the mouse position to display exactly 2 decimal places
  const formattedX = mousePosition.x.toFixed(2);
  const formattedY = mousePosition.y.toFixed(2);
  
  // Görülebilir koordinat aralığını hesapla
  const calculateVisibleBounds = () => {
    if (!canvasState.canvasSize.width || !canvasState.canvasSize.height) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    // Ekran koordinatlarını dünya koordinatlarına doğru dönüştür
    const screenToWorld = (screenX: number, screenY: number) => {
      // X ekseni dikey, Y ekseni yatay - yeni koordinat sistemine uygun
      const { width, height } = canvasState.canvasSize;
      const worldY = (screenX - width / 2 - canvasState.panOffset.x) / canvasState.zoom;
      const worldX = (height / 2 - screenY + canvasState.panOffset.y) / canvasState.zoom;
      return { x: worldX, y: worldY };
    };
    
    // Sol üst köşe
    const topLeft = screenToWorld(0, 0);
    // Sağ alt köşe
    const bottomRight = screenToWorld(
      canvasState.canvasSize.width,
      canvasState.canvasSize.height
    );
    
    // Çok küçük veya 0 zoom değerini yakala ve düzelt (özellikle büyük koordinatlar için)
    if (canvasState.zoom <= 0.0000001) {
      console.log("StatusBar: Çok düşük zoom değeri algılandı, görünür alan hesaplanıyor");
      // Büyük koordinatlarla çalışılıyorsa, ortalama koordinat değerlerinden ve canvas boyutundan hesapla
      const centerX = mousePosition.x; // Mevcut fare pozisyonundan yaklaşık merkez koordinatları kullan
      const centerY = mousePosition.y;
      
      // Canvas boyutuna ve zoom seviyesine göre görünür alan genişlik/yüksekliğini hesapla
      const visibleWidth = canvasState.canvasSize.width / (canvasState.zoom || 0.000001);
      const visibleHeight = canvasState.canvasSize.height / (canvasState.zoom || 0.000001);
      
      // Büyük koordinat sistemlerinde (milyon-bin) formatını kullan örn: 4,540K
      const formatBigNumber = (num: number) => {
        if (num >= 1000000) {
          return (num / 1000000).toFixed(3) + 'M';
        } else if (num >= 1000) {
          return (num / 1000).toFixed(3) + 'K';
        }
        return num.toFixed(0);
      };
      
      return {
        minX: formatBigNumber(centerX - visibleWidth/2),
        minY: formatBigNumber(centerY - visibleHeight/2),
        maxX: formatBigNumber(centerX + visibleWidth/2),
        maxY: formatBigNumber(centerY + visibleHeight/2)
      };
    }
    
    // Normal hesaplama
    return {
      minX: Math.min(topLeft.x, bottomRight.x).toFixed(0),
      minY: Math.min(topLeft.y, bottomRight.y).toFixed(0),
      maxX: Math.max(topLeft.x, bottomRight.x).toFixed(0),
      maxY: Math.max(topLeft.y, bottomRight.y).toFixed(0)
    };
  };
  
  const bounds = calculateVisibleBounds();
  
  return (
    <div className="h-8 bg-[#EEEEEE] border-t border-gray-300 flex items-center justify-between px-4 text-sm">
      <div className="flex items-center space-x-4">
        <div>
          <span className="text-gray-500">Tool:</span>
          <span id="active-tool" className="ml-1">{activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}</span>
        </div>
        <div>
          <span className="text-gray-500">Grid:</span>
          <span id="grid-size" className="ml-1">{gridSize}</span>
        </div>
        <div>
          <span className="text-gray-500">Zoom:</span>
          <span id="zoom-level" className="ml-1">
            {zoom < 0.01 ? (zoom * 100).toFixed(6) : Math.round(zoom * 100)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Visible:</span>
          <span id="visible-bounds" className="ml-1 font-mono">X: {bounds.minX} to {bounds.maxX}, Y: {bounds.minY} to {bounds.maxY}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div>
          <span className="text-gray-500 mr-2">Position:</span>
          <span id="mouse-position" className="font-mono">({formattedX}, {formattedY})</span>
        </div>
        <button
          onClick={onToggleSnap}
          className={`px-2 py-1 rounded text-xs ${
            snapEnabled 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-300 text-gray-700'
          }`}
        >
          Snap: {snapEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
