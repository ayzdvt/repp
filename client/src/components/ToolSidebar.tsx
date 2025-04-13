import React from 'react';
import { Tool } from '@/types';

interface ToolSidebarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

const ToolSidebar: React.FC<ToolSidebarProps> = ({ 
  activeTool, 
  onToolChange,
  onZoomIn,
  onZoomOut,
  onFitView
}) => {
  return (
    <div className="bg-[#ECECEC] w-14 flex-shrink-0 border-r border-gray-300 flex flex-col">
      <div className="flex flex-col items-center p-2 gap-4">
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-[#E0E0E0] active:bg-[#D0D0D0] transition-colors ${activeTool === 'selection' ? 'bg-[#D0D0D0]' : ''}`}
          title="Selection Tool" 
          onClick={() => onToolChange('selection')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-5-5m0 0l5-5m-5 5h12" transform="rotate(45 12 12)" />
          </svg>
        </button>
        
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-[#E0E0E0] active:bg-[#D0D0D0] transition-colors ${activeTool === 'point' ? 'bg-[#D0D0D0]' : ''}`}
          title="Point Tool" 
          onClick={() => onToolChange('point')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
          </svg>
        </button>
        
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-[#E0E0E0] active:bg-[#D0D0D0] transition-colors ${activeTool === 'line' ? 'bg-[#D0D0D0]' : ''}`}
          title="Line Tool" 
          onClick={() => onToolChange('line')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <line x1="5" y1="19" x2="19" y2="5" strokeWidth="2" />
          </svg>
        </button>
        
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-[#E0E0E0] active:bg-[#D0D0D0] transition-colors ${activeTool === 'polyline' ? 'bg-[#D0D0D0]' : ''}`}
          title="Polyline Tool" 
          onClick={() => onToolChange('polyline')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <polyline points="5,19 10,12 15,17 19,5" strokeWidth="2" />
          </svg>
        </button>
        
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-[#E0E0E0] active:bg-[#D0D0D0] transition-colors ${activeTool === 'text' ? 'bg-[#D0D0D0]' : ''}`}
          title="Text Tool" 
          onClick={() => onToolChange('text')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        
        <div className="border-t border-gray-300 w-full my-2"></div>
        
        <button 
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-[#E0E0E0] active:bg-[#D0D0D0] transition-colors"
          title="Zoom In" 
          onClick={onZoomIn}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
            <line x1="11" y1="8" x2="11" y2="14" strokeWidth="2" />
            <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2" />
          </svg>
        </button>
        
        <button 
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-[#E0E0E0] active:bg-[#D0D0D0] transition-colors"
          title="Zoom Out" 
          onClick={onZoomOut}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
            <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2" />
          </svg>
        </button>
        
        <button 
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-[#E0E0E0] active:bg-[#D0D0D0] transition-colors"
          title="Fit View" 
          onClick={onFitView}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ToolSidebar;
