import React from 'react';
import { Tool, Point } from '@/types';

interface StatusBarProps {
  activeTool: Tool;
  gridSize: number;
  zoom: number;
  mousePosition: Point;
}

const StatusBar: React.FC<StatusBarProps> = ({ 
  activeTool, 
  gridSize, 
  zoom, 
  mousePosition 
}) => {
  // Format the mouse position to display exactly 2 decimal places
  const formattedX = mousePosition.x.toFixed(2);
  const formattedY = mousePosition.y.toFixed(2);
  
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
      </div>
      <div className="flex items-center">
        <span className="text-gray-500 mr-2">Position:</span>
        <span id="mouse-position" className="font-mono">({formattedX}, {formattedY})</span>
      </div>
    </div>
  );
};

export default StatusBar;
