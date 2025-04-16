// canvas.ts
// Canvas ve çizim ile ilgili tip tanımlamaları

// Temel nokta tanımı
export interface Point {
  x: number;
  y: number;
}

// Canvas durumu
export interface CanvasState {
  zoom: number;
  panOffset: Point;
  canvasSize: {
    width: number;
    height: number;
  };
  gridSize?: number; // Izgara boyutu - isteğe bağlı
}

// Aktif araç tipleri
export type Tool = 'selection' | 'line' | 'point' | 'polyline' | 'text' | 'parallel';

// Şekil tipleri

// Nokta şekli
export interface PointShape {
  id: number;
  type: 'point';
  x: number;
  y: number;
  style: 'default' | 'square' | 'cross';
}

// Çizgi şekli
export interface LineShape {
  id: number;
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  isDashed?: boolean;
  isPreview?: boolean;
  isSnapping?: boolean;
}

// Polyline şekli
export interface PolylineShape {
  id: number;
  type: 'polyline';
  points: Point[];
  thickness: number;
  closed: boolean;
  isDashed?: boolean;
  isPreview?: boolean;
}

// Metin şekli
export interface TextShape {
  id: number;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

// Tüm şekil tipleri
export type Shape = PointShape | LineShape | PolylineShape | TextShape;

// İşlem tarihçesi action tipleri
export type ActionType = 
  | 'add_shape'
  | 'update_shape' 
  | 'delete_shape' 
  | 'clear_shapes'
  | 'batch_add_shapes';

// İşlem tarihçesi kaydı
export interface HistoryAction {
  action: ActionType;
  data: any;
}