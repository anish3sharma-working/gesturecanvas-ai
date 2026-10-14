export type DrawingTool = 'pen' | 'marker' | 'eraser' | 'line' | 'rectangle' | 'ellipse' | 'arrow' | 'text';
export type Tool = DrawingTool | 'select';
export type SmoothingLevel = 'off' | 'low' | 'medium' | 'high';
export type CanvasBackground = 'transparent' | 'white' | 'black' | 'grid' | 'custom' | 'camera';
export type GestureName = 'pinch' | 'openPalm' | 'fist';

export interface Point { x: number; y: number; pressure?: number; }
export interface DrawingItem {
  id: string;
  kind: DrawingTool;
  points: Point[];
  color: string;
  size: number;
  opacity: number;
  text?: string;
  font?: string;
  mirrored?: boolean;
}
export interface Artwork {
  id: string;
  name: string;
  updatedAt: number;
  width: number;
  height: number;
  items: DrawingItem[];
  background: CanvasBackground;
  backgroundColor: string;
}
export interface GestureSettings {
  pinch: boolean;
  openPalm: boolean;
  fist: boolean;
  proximityGuard: boolean;
  proximityLimit: number;
}
export interface Landmark { x: number; y: number; z?: number; }
export interface HandData { landmarks: Landmark[]; handedness?: string; score?: number; }
export interface TrackingState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  message: string;
  hands: HandData[];
  simulated: boolean;
  frames: number;
  fps: number;
  gesture: string;
}
export const PALETTE = ['#17191f', '#ffffff', '#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];
export const DEFAULT_ARTWORK: Artwork = { id: 'current', name: 'Untitled study', updatedAt: Date.now(), width: 1280, height: 720, items: [], background: 'transparent', backgroundColor: '#ffffff' };
