import type { Point } from '../types';

export function mapLandmark(point: Point, videoWidth: number, videoHeight: number, canvasWidth: number, canvasHeight: number, mirrored = true): Point {
  if (![videoWidth, videoHeight, canvasWidth, canvasHeight].every(Number.isFinite) || Math.min(videoWidth, videoHeight, canvasWidth, canvasHeight) <= 0) return { x: 0, y: 0 };
  const scale = Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  let x = point.x * renderedWidth - (renderedWidth - canvasWidth) / 2;
  const y = point.y * renderedHeight - (renderedHeight - canvasHeight) / 2;
  if (mirrored) x = canvasWidth - x;
  return { x: Math.max(0, Math.min(canvasWidth, x)), y: Math.max(0, Math.min(canvasHeight, y)) };
}

export function fitCanvas(width: number, height: number, dpr = window.devicePixelRatio || 1) {
  const safeWidth = Math.max(1, Math.round(width * dpr));
  const safeHeight = Math.max(1, Math.round(height * dpr));
  return { width: safeWidth, height: safeHeight, scaleX: safeWidth / width, scaleY: safeHeight / height };
}
