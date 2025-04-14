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
  const formattedX = typeof mousePosition.x === 'number' && isFinite(mousePosition.x) 
    ? mousePosition.x.toFixed(2) 
    : 'N/A';
  const formattedY = typeof mousePosition.y === 'number' && isFinite(mousePosition.y) 
    ? mousePosition.y.toFixed(2) 
    : 'N/A';
  
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
    
    // Sonuçların geçerli sayılar olduğundan emin ol
    const minX = isFinite(Math.min(topLeft.x, bottomRight.x)) 
      ? Math.min(topLeft.x, bottomRight.x).toFixed(0) 
      : '0';
    const minY = isFinite(Math.min(topLeft.y, bottomRight.y)) 
      ? Math.min(topLeft.y, bottomRight.y).toFixed(0) 
      : '0';
    const maxX = isFinite(Math.max(topLeft.x, bottomRight.x)) 
      ? Math.max(topLeft.x, bottomRight.x).toFixed(0) 
      : '0';
    const maxY = isFinite(Math.max(topLeft.y, bottomRight.y)) 
      ? Math.max(topLeft.y, bottomRight.y).toFixed(0) 
      : '0';
      
    return { minX, minY, maxX, maxY };
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
          <span id="zoom-level" className="ml-1">{Math.round(zoom * 100)}%</span>
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
