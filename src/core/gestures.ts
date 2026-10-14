import type { GestureName, HandData } from '../types';

export function normalizedDistance(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }

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
