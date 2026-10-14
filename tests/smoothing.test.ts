import { describe, expect, it } from 'vitest';
import { AdaptiveStabilizer } from '../src/core/smoothing';

describe('adaptive fingertip stabilization',()=>{
 it('returns raw coordinates when smoothing is disabled',()=>{const s=new AdaptiveStabilizer('off');expect(s.push({x:10,y:20},0)).toEqual({x:10,y:20});expect(s.push({x:14,y:25},20)).toEqual({x:14,y:25});});
 it.each(['low','medium','high'] as const)('filters jitter with %s smoothing',level=>{const s=new AdaptiveStabilizer(level);s.push({x:.5,y:.5},0);const next=s.push({x:.52,y:.51},30);expect(next.x).toBeGreaterThan(.5);expect(next.x).toBeLessThan(.52);});
 it('responds more quickly to simulated fast movement than slow movement',()=>{const slow=new AdaptiveStabilizer('high'),fast=new AdaptiveStabilizer('high');slow.push({x:0,y:0},0);fast.push({x:0,y:0},0);const slowPoint=slow.push({x:.2,y:0},100);const fastPoint=fast.push({x:.2,y:0},1);expect(fastPoint.x).toBeGreaterThan(slowPoint.x);});
 it('is stable across a deterministic simulated landmark trace',()=>{const s=new AdaptiveStabilizer('medium');const coords=[.501,.499,.502,.498,.53];const output=coords.map((x,i)=>s.push({x,y:.5},i*33));expect(output.every(p=>Number.isFinite(p.x))).toBe(true);expect(output[1].x).toBeGreaterThan(.499);expect(output[1].x).toBeLessThan(.501);expect(output.at(-1)!.x).toBeGreaterThan(.51);});
 it('resets temporal state when stabilization configuration changes',()=>{const s=new AdaptiveStabilizer('high');s.push({x:.1,y:.1},0);s.reset();expect(s.push({x:.9,y:.9},100)).toEqual({x:.9,y:.9});});
});
