import { describe, expect, it, vi } from 'vitest';
import { DrawingHistory } from '../src/core/history';
import { exportArtwork, makeDrawingItem } from '../src/core/renderer';
import { drawingBounds, findTopmostDrawingItem, hitTestDrawingItem, translateDrawingItem } from '../src/core/selection';
import type { Artwork, DrawingItem, Point } from '../src/types';

function item(kind: DrawingItem['kind'], points: Point[] = [{ x: 10, y: 10 }, { x: 50, y: 40 }], extra: Partial<DrawingItem> = {}) {
  return { ...makeDrawingItem(kind, points[0], '#f00', 4, 1, extra), points };
}

describe('select, move, and delete drawing objects', () => {
  it.each(['pen', 'marker', 'line', 'rectangle', 'ellipse', 'arrow', 'text'] as const)('hit-tests %s artwork', kind => {
    const drawing = item(kind, undefined, kind === 'text' ? { text: 'Hello' } : {});
    expect(hitTestDrawingItem(drawing, kind === 'text' ? { x: 12, y: 8 } : { x: 30, y: 25 })).toBe(true);
    expect(drawingBounds(drawing)).not.toBeNull();
  });

  it('selects the topmost hit item and ignores eraser marks', () => {
    const bottom = item('pen');
    const top = item('rectangle');
    expect(findTopmostDrawingItem([bottom, top], { x: 30, y: 25 })).toBe(top);
    expect(hitTestDrawingItem(item('eraser'), { x: 30, y: 25 })).toBe(false);
  });

  it('translates every point without mutating the original object', () => {
    const original = item('pen', [{ x: 1, y: 2, pressure: 0.4 }, { x: 4, y: 8 }]);
    const moved = translateDrawingItem(original, 12, -3);
    expect(moved.points).toEqual([{ x: 13, y: -1, pressure: 0.4 }, { x: 16, y: 5 }]);
    expect(original.points).toEqual([{ x: 1, y: 2, pressure: 0.4 }, { x: 4, y: 8 }]);
  });

  it('records one undoable movement and direct deletion with reliable redo', () => {
    const history = new DrawingHistory();
    const drawing = item('rectangle');
    history.add(drawing);
    const moved = translateDrawingItem(drawing, 20, 15);
    history.updateItem(drawing.id, moved);
    expect(history.current[0].points[0]).toEqual({ x: 30, y: 25 });
    expect(history.undo()[0].points[0]).toEqual({ x: 10, y: 10 });
    expect(history.redo()[0].points[0]).toEqual({ x: 30, y: 25 });
    expect(history.deleteItem(drawing.id)).toHaveLength(0);
    expect(history.undo()[0].id).toBe(drawing.id);
    expect(history.redo()).toHaveLength(0);
  });

  it('keeps the camera-feed preview out of PNG background pixels', () => {
    const artwork: Artwork = { id: 'camera', name: 'Camera preview', updatedAt: 1, width: 64, height: 64, items: [], background: 'camera', backgroundColor: '#fff' };
    const ctx = { clearRect: vi.fn(), fillRect: vi.fn(), save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), setLineDash: vi.fn() } as unknown as CanvasRenderingContext2D;
    const create = vi.spyOn(document, 'createElement').mockReturnValue({ width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement);
    exportArtwork(artwork, false);
    expect(ctx.fillRect).not.toHaveBeenCalled();
    create.mockRestore();
  });
});
