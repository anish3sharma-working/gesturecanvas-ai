import type { DrawingItem, Point } from '../types';

export interface Bounds { left: number; top: number; right: number; bottom: number; }

export function drawingBounds(item: DrawingItem, padding = Math.max(7, item.size / 2 + 4)): Bounds | null {
  if (!item.points.length) return null;
  if (item.kind === 'text') {
    const p = item.points[0];
    const fontSize = Math.max(16, item.size * 3);
    const width = Math.max(fontSize * 0.6, (item.text ?? '').length * fontSize * 0.62);
    return { left: p.x - padding, top: p.y - fontSize - padding, right: p.x + width + padding, bottom: p.y + padding };
  }
  const xs = item.points.map(p => p.x), ys = item.points.map(p => p.y);
  return { left: Math.min(...xs) - padding, top: Math.min(...ys) - padding, right: Math.max(...xs) + padding, bottom: Math.max(...ys) + padding };
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function hitTestDrawingItem(item: DrawingItem, point: Point, tolerance = 10): boolean {
  if (item.kind === 'eraser' || !item.points.length) return false;
  const threshold = tolerance + item.size * (item.kind === 'marker' ? 0.825 : 0.5);
  const bounds = drawingBounds(item, threshold);
  if (!bounds || point.x < bounds.left || point.x > bounds.right || point.y < bounds.top || point.y > bounds.bottom) return false;
  if (item.kind === 'text') return true;
  if (item.kind === 'rectangle' || item.kind === 'ellipse') {
    const a = item.points[0], b = item.points.at(-1)!;
    const left = Math.min(a.x, b.x), right = Math.max(a.x, b.x), top = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y);
    if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) return true;
  }
  if (item.kind === 'ellipse') {
    const a = item.points[0], b = item.points.at(-1)!;
    const rx = Math.abs(b.x - a.x) / 2, ry = Math.abs(b.y - a.y) / 2;
    if (!rx || !ry) return false;
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    return Math.abs(((point.x - cx) / rx) ** 2 + ((point.y - cy) / ry) ** 2 - 1) <= threshold / Math.max(1, Math.min(rx, ry));
  }
  const points = item.kind === 'line' || item.kind === 'arrow' ? [item.points[0], item.points.at(-1)!] : item.points;
  if (points.length === 1) return Math.hypot(point.x - points[0].x, point.y - points[0].y) <= threshold;
  return points.slice(1).some((p, i) => distanceToSegment(point, points[i], p) <= threshold);
}

export function findTopmostDrawingItem(items: DrawingItem[], point: Point, tolerance = 10): DrawingItem | null {
  for (let i = items.length - 1; i >= 0; i--) if (hitTestDrawingItem(items[i], point, tolerance)) return items[i];
  return null;
}

export function translateDrawingItem(item: DrawingItem, dx: number, dy: number): DrawingItem {
  return { ...item, points: item.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy })) };
}
