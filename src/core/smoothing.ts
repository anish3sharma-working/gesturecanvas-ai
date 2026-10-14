import type { Point, SmoothingLevel } from '../types';

const BASE_RESPONSE: Record<Exclude<SmoothingLevel, 'off'>, number> = { low: 0.78, medium: 0.56, high: 0.38 };

export class AdaptiveStabilizer {
  private previous?: Point;
  private lastTime?: number;
  constructor(public level: SmoothingLevel = 'medium') {}
  reset() { this.previous = undefined; this.lastTime = undefined; }
  push(point: Point, time = performance.now()): Point {
    if (this.level === 'off' || !this.previous || this.lastTime === undefined) {
      this.previous = { ...point }; this.lastTime = time; return { ...point };
    }
    const dt = Math.max(1, time - this.lastTime);
    const speed = Math.hypot(point.x - this.previous.x, point.y - this.previous.y) / dt;
    const base = BASE_RESPONSE[this.level];
    // Fast moves get a more responsive alpha; slower moves receive more jitter filtering.
    const alpha = Math.min(0.96, Math.max(0.18, base + Math.min(0.34, speed * 2.2)));
    const next = { x: this.previous.x + (point.x - this.previous.x) * alpha, y: this.previous.y + (point.y - this.previous.y) * alpha, pressure: point.pressure };
    this.previous = next; this.lastTime = time; return { ...next };
  }
}

export function smoothLandmarks(points: Point[], stabilizers: Map<number, AdaptiveStabilizer>, level: SmoothingLevel, time: number): Point[] {
  return points.map((point, index) => {
    const stabilizer = stabilizers.get(index) ?? new AdaptiveStabilizer(level);
    stabilizer.level = level; stabilizers.set(index, stabilizer); return stabilizer.push(point, time);
  });
}
