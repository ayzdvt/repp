import React, { useState, useEffect } from 'react';

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
      }
    }
  }, [selectedObject]);
  
  return (
    <div className="bg-white w-0 md:w-64 border-l border-gray-300 flex-shrink-0 overflow-y-auto custom-scrollbar hidden md:block">
      <div className="p-4">
        <h2 className="font-semibold text-gray-700 mb-4">Properties</h2>
        
        {!hasSelection && (
          <div className="mb-4 opacity-50">
            <p className="text-sm text-gray-500 mb-1">No object selected</p>
            <p className="text-xs text-gray-400">Select an object to edit its properties</p>
          </div>
        )}
        
        {hasSelection && selectedObject.type === 'point' && (
          <div id="point-properties">
            <h3 className="font-medium text-sm mb-2">Point Properties</h3>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Position X</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={pointX} 
                onChange={(e) => {
                  setPointX(e.target.value);
                  if (onPropertyChange && selectedObject.id) {
                    onPropertyChange('x', parseFloat(e.target.value), selectedObject.id);
                  }
                }}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Position Y</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={pointY}
                onChange={(e) => {
                  setPointY(e.target.value);
                  if (onPropertyChange && selectedObject.id) {
                    onPropertyChange('y', parseFloat(e.target.value), selectedObject.id);
                  }
                }}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Style</label>
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
                <option value="default">Default</option>
                <option value="square">Square</option>
                <option value="cross">Cross</option>
              </select>
            </div>
          </div>
        )}
        
        {hasSelection && selectedObject.type === 'line' && (
          <div id="line-properties">
            <h3 className="font-medium text-sm mb-2">Line Properties</h3>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start X</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={lineStartX}
                  onChange={(e) => {
                    setLineStartX(e.target.value);
                    if (onPropertyChange && selectedObject.id) {
                      onPropertyChange('startX', parseFloat(e.target.value), selectedObject.id);
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Y</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={lineStartY}
                  onChange={(e) => {
                    setLineStartY(e.target.value);
                    if (onPropertyChange && selectedObject.id) {
                      onPropertyChange('startY', parseFloat(e.target.value), selectedObject.id);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">End X</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={lineEndX}
                  onChange={(e) => {
                    setLineEndX(e.target.value);
                    if (onPropertyChange && selectedObject.id) {
                      onPropertyChange('endX', parseFloat(e.target.value), selectedObject.id);
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Y</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={lineEndY}
                  onChange={(e) => {
                    setLineEndY(e.target.value);
                    if (onPropertyChange && selectedObject.id) {
                      onPropertyChange('endY', parseFloat(e.target.value), selectedObject.id);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Thickness</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={lineThickness} 
                min="0.1" 
                step="0.1"
                onChange={(e) => {
                  setLineThickness(e.target.value);
                  if (onPropertyChange && selectedObject.id) {
                    onPropertyChange('thickness', parseFloat(e.target.value), selectedObject.id);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesSidebar;
