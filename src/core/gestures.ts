import type { GestureName, HandData } from '../types';

export function normalizedDistance(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }

// Palm span is expressed in camera-frame-height units so the x/y measurements
// are comparable despite the camera's usual 16:9 aspect ratio.
export function estimatePalmScale(hand: HandData): number | null {
  const p = hand.landmarks;
  if (p.length < 21) return null;
  const aspect = 16 / 9;
  const corrected = (i: number) => ({ x: p[i].x * aspect, y: p[i].y });
  return Math.max(normalizedDistance(corrected(5), corrected(17)), normalizedDistance(corrected(0), corrected(9)));
}

export class HandProximityGuard {
  private active = false;
  update(hand: HandData, enabled: boolean, limit: number): boolean {
    if (!enabled) { this.active = false; return false; }
    const scale = estimatePalmScale(hand);
    if (scale === null) { this.active = true; return true; }
    // Four-percent release hysteresis prevents the guard chattering at its edge.
    this.active = this.active ? scale >= limit - 0.04 : scale >= limit;
    return this.active;
  }
  reset() { this.active = false; }
}

export function isPinching(hand: HandData, wasPinching = false): boolean {
  if (hand.landmarks.length < 21) return false;
  const wrist = hand.landmarks[0]; const scale = Math.max(0.001, normalizedDistance(wrist, hand.landmarks[9]));
  const gap = normalizedDistance(hand.landmarks[4], hand.landmarks[8]) / scale;
  return wasPinching ? gap < 0.78 : gap < 0.58;
}

function extended(hand: HandData, tip: number, pip: number) {
  const wrist = hand.landmarks[0];
  return normalizedDistance(hand.landmarks[tip], wrist) > normalizedDistance(hand.landmarks[pip], wrist) * 1.13;
}

export function classifyGesture(hand: HandData, previousPinch = false): GestureName | 'index' | 'two-finger' | 'none' {
  const p = hand.landmarks; if (p.length < 21) return 'none';
  if (isPinching(hand, previousPinch)) return 'pinch';
  const fingers = [extended(hand, 8, 6), extended(hand, 12, 10), extended(hand, 16, 14), extended(hand, 20, 18)];
  if (fingers.every(Boolean)) return 'openPalm';
  if (fingers.every(value => !value)) return 'fist';
  if (fingers[0] && fingers[1] && !fingers[2] && !fingers[3]) return 'two-finger';
  if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3]) return 'index';
  return 'none';
}

export function isImmediatePauseGesture(candidate: string, settings: { openPalm: boolean; fist: boolean }): boolean {
  return (settings.openPalm && candidate === 'openPalm') || (settings.fist && candidate === 'fist');
}

export class GestureDebouncer {
  private candidate = 'none'; private count = 0; private stable = 'none';
  constructor(private readonly requiredFrames = 5) {}
  update(value: string) {
    if (value === this.candidate) this.count += 1; else { this.candidate = value; this.count = 1; }
    if (this.count >= this.requiredFrames) this.stable = value;
    return this.stable;
  }
  reset() { this.candidate = 'none'; this.count = 0; this.stable = 'none'; }
  get current() { return this.stable; }
}
