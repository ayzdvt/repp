import React from 'react';

interface PropertiesSidebarProps {
  selectedObject: any | null;
}

const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({ selectedObject }) => {
  const hasSelection = selectedObject !== null;
  
  // Format coordinate values to show 2 decimal places
  const formatCoordinate = (value: number): string => {
    return value.toFixed(2);
  };
  
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
                value={formatCoordinate(selectedObject.x)} 
                onChange={() => {}} // Will be implemented when object selection is added
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Position Y</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={formatCoordinate(selectedObject.y)}
                onChange={() => {}} // Will be implemented when object selection is added
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Style</label>
              <select 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={selectedObject.style}
                onChange={() => {}} // Will be implemented when object selection is added
              >
                <option>Default</option>
                <option>Square</option>
                <option>Cross</option>
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
                  value={formatCoordinate(selectedObject.startX)}
                  onChange={() => {}} // Will be implemented when object selection is added
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Y</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={formatCoordinate(selectedObject.startY)}
                  onChange={() => {}} // Will be implemented when object selection is added
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">End X</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={formatCoordinate(selectedObject.endX)}
                  onChange={() => {}} // Will be implemented when object selection is added
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Y</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                  value={formatCoordinate(selectedObject.endY)}
                  onChange={() => {}} // Will be implemented when object selection is added
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Thickness</label>
              <input 
                type="number" 
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                value={selectedObject.thickness} 
                min="0.1" 
                step="0.1"
                onChange={() => {}} // Will be implemented when object selection is added
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesSidebar;
