import type { Artwork, DrawingItem, Point } from '../types';

function strokePath(ctx: CanvasRenderingContext2D, item: DrawingItem) {
  const points = item.points; if (!points.length) return;
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 1) { ctx.lineTo(points[0].x + 0.01, points[0].y + 0.01); return; }
  for (let i = 1; i < points.length - 1; i++) {
    const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
    ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
  }
  const last = points[points.length - 1]; ctx.lineTo(last.x, last.y);
}

function drawItem(ctx: CanvasRenderingContext2D, item: DrawingItem) {
  const pts = item.points; if (!pts.length) return;
  ctx.save(); ctx.globalAlpha = item.kind === 'marker' ? item.opacity * 0.64 : item.opacity; ctx.strokeStyle = item.color; ctx.fillStyle = item.color;
  ctx.lineWidth = item.kind === 'marker' ? item.size * 1.65 : item.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (item.kind === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 1; }
  if (item.kind === 'text') { ctx.globalCompositeOperation = 'source-over'; ctx.font = `${Math.max(16, item.size * 3)}px ${item.font ?? 'sans-serif'}`; ctx.fillText(item.text ?? '', pts[0].x, pts[0].y); ctx.restore(); return; }
  if (item.kind === 'line' || item.kind === 'arrow') {
    const a = pts[0], b = pts.at(-1)!; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    if (item.kind === 'arrow') { const angle = Math.atan2(b.y - a.y, b.x - a.x); const head = Math.max(12, item.size * 3); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - head * Math.cos(angle - Math.PI / 6), b.y - head * Math.sin(angle - Math.PI / 6)); ctx.lineTo(b.x - head * Math.cos(angle + Math.PI / 6), b.y - head * Math.sin(angle + Math.PI / 6)); ctx.stroke(); }
  } else if (item.kind === 'rectangle' || item.kind === 'ellipse') {
    const a = pts[0], b = pts.at(-1)!; ctx.beginPath();
    if (item.kind === 'rectangle') ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y);
    else ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else { strokePath(ctx, item); ctx.stroke(); }
  ctx.restore();
}

export function renderArtwork(ctx: CanvasRenderingContext2D, items: DrawingItem[], width: number, height: number, symmetry = false) {
  ctx.clearRect(0, 0, width, height);
  for (const item of items) {
    drawItem(ctx, item);
    if (symmetry && item.kind !== 'text') {
      ctx.save(); ctx.translate(width, 0); ctx.scale(-1, 1); drawItem(ctx, item); ctx.restore();
    }
  }
}

export function drawGuides(ctx: CanvasRenderingContext2D, width: number, height: number, kind: 'none' | 'grid' | 'thirds') {
  if (kind === 'none') return; ctx.save(); ctx.strokeStyle = 'rgba(95, 112, 134, .28)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.beginPath();
  if (kind === 'grid') { for (let x = 40; x < width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); } for (let y = 40; y < height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); } }
  else { for (const x of [width / 3, width * 2 / 3]) { ctx.moveTo(x, 0); ctx.lineTo(x, height); } for (const y of [height / 3, height * 2 / 3]) { ctx.moveTo(0, y); ctx.lineTo(width, y); } }
  ctx.stroke(); ctx.restore();
}

export function makeDrawingItem(kind: DrawingItem['kind'], start: Point, color: string, size: number, opacity: number, extra: Partial<DrawingItem> = {}): DrawingItem {
  return { id: crypto.randomUUID(), kind, points: [{ ...start }], color, size, opacity, ...extra };
}

export function exportArtwork(artwork: Artwork, transparent = true): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = artwork.width; canvas.height = artwork.height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas export is unavailable in this browser.');
  if (!transparent && artwork.background !== 'transparent' && artwork.background !== 'camera') {
    ctx.fillStyle = artwork.background === 'black' ? '#000000' : artwork.background === 'white' || artwork.background === 'grid' ? '#ffffff' : artwork.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  renderArtwork(ctx, artwork.items, canvas.width, canvas.height); return canvas;
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed. Try again or use another browser.')), 'image/png'));
}
