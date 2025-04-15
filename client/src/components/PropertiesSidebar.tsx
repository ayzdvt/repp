import React, { useState, useEffect } from 'react';
import { calculatePolylineLength } from '@/lib/drawingPrimitives';

interface PropertiesSidebarProps {
  selectedObject: any | null;
  onPropertyChange?: (property: string, value: number | string, objectId: number) => void;
}

const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({ selectedObject, onPropertyChange }) => {
  const hasSelection = selectedObject !== null;
  
  // Format coordinate values to show 2 decimal places
  const formatCoordinate = (value: number): string => {
    return value.toFixed(2);
  };
  
  // Form state - each field gets its own state to avoid component rerender delays
  const [pointX, setPointX] = useState<string>('0.00');
  const [pointY, setPointY] = useState<string>('0.00');
  const [pointStyle, setPointStyle] = useState<string>('default');
  
  const [lineStartX, setLineStartX] = useState<string>('0.00');
  const [lineStartY, setLineStartY] = useState<string>('0.00');
  const [lineEndX, setLineEndX] = useState<string>('0.00');
  const [lineEndY, setLineEndY] = useState<string>('0.00');
  const [lineThickness, setLineThickness] = useState<string>('1');
  
  // Polyline özelliklerini saklamak için state
  const [polylineThickness, setPolylineThickness] = useState<string>('1');
  const [polylineTotalLength, setPolylineTotalLength] = useState<string>('0.00');
  
  // Seçili nesne değiştiğinde form state'ini güncelle
  useEffect(() => {
    if (selectedObject) {
      if (selectedObject.type === 'point') {
        setPointX(formatCoordinate(selectedObject.x));
        setPointY(formatCoordinate(selectedObject.y));
        setPointStyle(selectedObject.style || 'default');
      } else if (selectedObject.type === 'line') {
        setLineStartX(formatCoordinate(selectedObject.startX));
        setLineStartY(formatCoordinate(selectedObject.startY));
        setLineEndX(formatCoordinate(selectedObject.endX));
        setLineEndY(formatCoordinate(selectedObject.endY));
        setLineThickness(selectedObject.thickness.toString());
      } else if (selectedObject.type === 'polyline') {
        // Polyline özellikleri
        setPolylineThickness(selectedObject.thickness?.toString() || '1');
        
        // Toplam uzunluğu hesapla
        const totalLength = calculatePolylineLength(selectedObject);
        setPolylineTotalLength(totalLength.toFixed(2));
      }
    }
  }, [selectedObject]);
  
  return (
    <div className="bg-white w-0 md:w-64 border-l border-gray-300 flex-shrink-0 overflow-y-auto custom-scrollbar hidden md:block">
      <div className="p-4">
        <h2 className="font-semibold text-gray-700 mb-4">Özellikler</h2>
        
        {!hasSelection && (
          <div className="mb-4 opacity-50">
            <p className="text-sm text-gray-500 mb-1">Hiçbir obje seçilmedi</p>
            <p className="text-xs text-gray-400">Özelliklerini düzenlemek için bir obje seçin</p>
          </div>
        )}
        
        {hasSelection && selectedObject.type === 'point' && (
          <div id="point-properties">
            <h3 className="font-medium text-sm mb-2">Nokta Özellikleri</h3>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Y Pozisyonu</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={pointY} 
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                onChange={(e) => {
                  setPointY(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onPropertyChange && selectedObject.id) {
                    const input = e.target as HTMLInputElement;
                    onPropertyChange('y', parseFloat(input.value), selectedObject.id);
                    input.blur();
                  }
                }}
                onBlur={(e) => {
                  if (onPropertyChange && selectedObject.id) {
                    const input = e.target as HTMLInputElement;
                    onPropertyChange('y', parseFloat(input.value), selectedObject.id);
                  }
                }}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">X Pozisyonu</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={pointX}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                onChange={(e) => {
                  setPointX(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onPropertyChange && selectedObject.id) {
                    const input = e.target as HTMLInputElement;
                    onPropertyChange('x', parseFloat(input.value), selectedObject.id);
                    input.blur();
                  }
                }}
                onBlur={(e) => {
                  if (onPropertyChange && selectedObject.id) {
                    const input = e.target as HTMLInputElement;
                    onPropertyChange('x', parseFloat(input.value), selectedObject.id);
                  }
                }}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Stil</label>
              <select 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={pointStyle}
                onChange={(e) => {
                  setPointStyle(e.target.value);
                  if (onPropertyChange && selectedObject.id) {
                    onPropertyChange('style', e.target.value, selectedObject.id);
                  }
                }}
              >
                <option value="default">Varsayılan</option>
                <option value="square">Kare</option>
                <option value="cross">Çarpı</option>
              </select>
            </div>
          </div>
        )}
        
        {hasSelection && selectedObject.type === 'line' && (
          <div id="line-properties">
            <h3 className="font-medium text-sm mb-2">Çizgi Özellikleri</h3>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Başlangıç X</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={lineStartX}
                  onFocus={(e) => (e.target as HTMLInputElement).select()}
                  onChange={(e) => {
                    setLineStartX(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onPropertyChange && selectedObject.id) {
                      const input = e.target as HTMLInputElement;
                      onPropertyChange('startX', parseFloat(input.value), selectedObject.id);
                      input.blur();
                    }
                  }}
                  onBlur={(e) => {
                    if (onPropertyChange && selectedObject.id) {
                      const input = e.target as HTMLInputElement;
                      onPropertyChange('startX', parseFloat(input.value), selectedObject.id);
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Başlangıç Y</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={lineStartY}
                  onFocus={(e) => (e.target as HTMLInputElement).select()}
                  onChange={(e) => {
                    setLineStartY(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onPropertyChange && selectedObject.id) {
                      const input = e.target as HTMLInputElement;
                      onPropertyChange('startY', parseFloat(input.value), selectedObject.id);
                      input.blur();
                    }
                  }}
                  onBlur={(e) => {
                    if (onPropertyChange && selectedObject.id) {
                      const input = e.target as HTMLInputElement;
                      onPropertyChange('startY', parseFloat(input.value), selectedObject.id);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bitiş X</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={lineEndX}
                  onFocus={(e) => (e.target as HTMLInputElement).select()}
                  onChange={(e) => {
                    setLineEndX(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onPropertyChange && selectedObject.id) {
                      const input = e.target as HTMLInputElement;
                      onPropertyChange('endX', parseFloat(input.value), selectedObject.id);
                      input.blur();
                    }
                  }}
                  onBlur={(e) => {
                    if (onPropertyChange && selectedObject.id) {
                      const input = e.target as HTMLInputElement;
                      onPropertyChange('endX', parseFloat(input.value), selectedObject.id);
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bitiş Y</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={lineEndY}
                  onFocus={(e) => (e.target as HTMLInputElement).select()}
                  onChange={(e) => {
                    setLineEndY(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onPropertyChange && selectedObject.id) {
                      const input = e.target as HTMLInputElement;
                      onPropertyChange('endY', parseFloat(input.value), selectedObject.id);
                      input.blur();
                    }
                  }}
                  onBlur={(e) => {
                    if (onPropertyChange && selectedObject.id) {
                      const input = e.target as HTMLInputElement;
                      onPropertyChange('endY', parseFloat(input.value), selectedObject.id);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Kalınlık</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={lineThickness} 
                min="0.1" 
                step="0.1"
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                onChange={(e) => {
                  setLineThickness(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onPropertyChange && selectedObject.id) {
                    const input = e.target as HTMLInputElement;
                    onPropertyChange('thickness', parseFloat(input.value), selectedObject.id);
                    input.blur();
                  }
                }}
                onBlur={(e) => {
                  if (onPropertyChange && selectedObject.id) {
                    const input = e.target as HTMLInputElement;
                    onPropertyChange('thickness', parseFloat(input.value), selectedObject.id);
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {hasSelection && selectedObject.type === 'polyline' && (
          <div id="polyline-properties">
            <h3 className="font-medium text-sm mb-2">Çoklu Çizgi Özellikleri</h3>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Toplam Uzunluk</label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  readOnly
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50" 
                  value={polylineTotalLength}
                />
                <span className="ml-1 text-xs text-gray-500">birim</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Kalınlık</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={polylineThickness} 
                min="0.1" 
                step="0.1"
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                onChange={(e) => {
                  setPolylineThickness(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onPropertyChange && selectedObject.id) {
                    const input = e.target as HTMLInputElement;
                    onPropertyChange('thickness', parseFloat(input.value), selectedObject.id);
                    input.blur();
                  }
                }}
                onBlur={(e) => {
                  if (onPropertyChange && selectedObject.id) {
                    const input = e.target as HTMLInputElement;
                    onPropertyChange('thickness', parseFloat(input.value), selectedObject.id);
                  }
                }}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Noktalar</label>
              <div className="text-xs text-gray-500">
                Bu çoklu çizgide {selectedObject.points?.length || 0} nokta var
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesSidebar;
