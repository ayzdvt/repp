import { useRef, useEffect, useState } from 'react';
import { CanvasState, Point } from '@/types';

interface UseCanvasSetupProps {
  onCanvasSizeChange?: (width: number, height: number) => void;
}

export function useCanvasSetup({ onCanvasSizeChange }: UseCanvasSetupProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    gridSize: 10,
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    canvasSize: { width: 0, height: 0 }
  });
  
  // Initialize canvas and get context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setContext(ctx);
    }
  }, []);
  
  // Handle canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        setCanvasState(prev => ({
          ...prev,
          canvasSize: { width, height }
        }));
        
        if (onCanvasSizeChange) {
          onCanvasSizeChange(width, height);
        }
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [onCanvasSizeChange]);
  
  // Update zoom
  const setZoom = (zoom: number) => {
    setCanvasState(prev => ({
      ...prev,
      zoom
    }));
  };
  
  // Update pan offset
  const setPanOffset = (x: number, y: number) => {
    setCanvasState(prev => ({
      ...prev,
      panOffset: { x, y }
    }));
  };
  
  return {
    canvasRef,
    containerRef,
    context,
    canvasState,
    setZoom,
    setPanOffset
  };
}
