import { describe, expect, it } from 'vitest';
import { GestureDebouncer, HandProximityGuard, estimatePalmScale, isImmediatePauseGesture, isPinching, normalizedDistance } from '../src/core/gestures';
import type { HandData, Landmark } from '../src/types';
function hand(gap:number):HandData{const lm:Landmark[]=Array.from({length:21},(_,i)=>({x:.5+(i%3)*.005,y:.5+Math.floor(i/3)*.005,z:0}));lm[0]={x:.5,y:.8};lm[9]={x:.5,y:.5};lm[4]={x:.48,y:.5};lm[8]={x:.48+gap,y:.5};return{landmarks:lm};}
describe('gesture geometry and safety',()=>{
 it('measures normalized coordinate distance',()=>expect(normalizedDistance({x:0,y:0},{x:3,y:4})).toBe(5));
 it('uses separate pinch engage and release thresholds',()=>{expect(isPinching(hand(.08),false)).toBe(true);expect(isPinching(hand(.20),true)).toBe(true);expect(isPinching(hand(.25),true)).toBe(false);});
 it('requires repeated stable frames before committing a discrete gesture',()=>{const d=new GestureDebouncer(5);for(let i=0;i<4;i++)expect(d.update('openPalm')).toBe('none');expect(d.update('openPalm')).toBe('openPalm');});
 it('restarts the debounce window on a transition',()=>{const d=new GestureDebouncer(3);d.update('fist');d.update('fist');d.update('openPalm');expect(d.current).toBe('none');d.update('openPalm');expect(d.current).toBe('none');expect(d.update('openPalm')).toBe('openPalm');});
 it('rejects incomplete landmark sets for pinch detection',()=>expect(isPinching({landmarks:[] })).toBe(false));
 it('pauses immediately for enabled raw open-palm or fist candidates',()=>{expect(isImmediatePauseGesture('openPalm',{openPalm:true,fist:true})).toBe(true);expect(isImmediatePauseGesture('fist',{openPalm:true,fist:true})).toBe(true);expect(isImmediatePauseGesture('openPalm',{openPalm:false,fist:true})).toBe(false);expect(isImmediatePauseGesture('index',{openPalm:true,fist:true})).toBe(false);});
 it('estimates palm scale from wrist and MCP landmarks in frame-height units',()=>{const h=hand(.2);h.landmarks[5]={x:.42,y:.4};h.landmarks[17]={x:.58,y:.4};h.landmarks[0]={x:.5,y:.3};h.landmarks[9]={x:.5,y:.38};expect(estimatePalmScale(h)).toBeCloseTo(.16*16/9);});
 it('pauses at the configured close-hand limit and uses release hysteresis',()=>{const h=hand(.2);const guard=new HandProximityGuard();const setScale=(scale:number)=>{h.landmarks[5]={x:.5-scale/(2*16/9),y:.4};h.landmarks[17]={x:.5+scale/(2*16/9),y:.4};h.landmarks[0]={x:.5,y:.2};h.landmarks[9]={x:.5,y:.2+scale/2};};setScale(.41);expect(guard.update(h,true,.42)).toBe(false);setScale(.43);expect(guard.update(h,true,.42)).toBe(true);setScale(.40);expect(guard.update(h,true,.42)).toBe(true);setScale(.37);expect(guard.update(h,true,.42)).toBe(false);});
 it('disables and resets the proximity pause when tracking is turned off',()=>{const h=hand(.2);h.landmarks[5]={x:.2,y:.4};h.landmarks[17]={x:.8,y:.4};const guard=new HandProximityGuard();expect(guard.update(h,true,.42)).toBe(true);expect(guard.update(h,false,.42)).toBe(false);});

});
