import { describe, expect, it } from 'vitest';
import { fitCanvas, mapLandmark } from '../src/core/coordinates';
describe('landmark-to-canvas mapping',()=>{
 it('mirrors fingertip x to match the mirrored webcam preview',()=>{expect(mapLandmark({x:.25,y:.5},1280,720,1280,720,true).x).toBe(960);expect(mapLandmark({x:.25,y:.5},1280,720,1280,720,false).x).toBe(320);});
 it('centers a cover-cropped source while mapping y',()=>{const p=mapLandmark({x:.5,y:.5},1920,1080,1280,720,true);expect(p.x).toBeCloseTo(640);expect(p.y).toBeCloseTo(360);});
 it('clamps coordinates for landmarks beyond the visible region',()=>expect(mapLandmark({x:2,y:-1},1280,720,1280,720,true)).toEqual({x:0,y:0}));
 it('uses actual device pixel ratio for backing dimensions',()=>expect(fitCanvas(640,360,2)).toEqual({width:1280,height:720,scaleX:2,scaleY:2}));
 it('safely handles invalid canvas dimensions',()=>expect(mapLandmark({x:.4,y:.5},0,720,1280,720)).toEqual({x:0,y:0}));
});
