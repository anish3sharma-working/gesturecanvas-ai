import { useCallback, useEffect, useRef } from 'react';
import type { Artwork, DrawingItem, Point, Tool, TrackingState } from '../types';
import { drawGuides, renderArtwork } from '../core/renderer';
import { drawingBounds } from '../core/selection';

const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>; tracking: TrackingState; artwork: Artwork; preview: DrawingItem | null;
  drawing: boolean; landmarks: boolean; cursor: Point | null; guide: 'none'|'grid'|'thirds'; symmetry: boolean; tool: Tool;
  selectedItem: DrawingItem | null; onPointerStart: (p:Point)=>void; onPointerMove:(p:Point)=>void; onPointerEnd:()=>void;
}
export default function Workspace(props: Props) {
  const { videoRef, tracking, artwork, preview, drawing, landmarks, cursor, guide, symmetry, tool, selectedItem } = props;
  const artRef = useRef<HTMLCanvasElement>(null); const overlayRef = useRef<HTMLCanvasElement>(null); const boxRef = useRef<HTMLDivElement>(null);
  const repaint = useCallback(() => {
    const canvas = artRef.current; const box = boxRef.current; if (!canvas || !box) return;
    const rect = box.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) { canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); }
    const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.setTransform(dpr,0,0,dpr,0,0);
    const scaleX=w/artwork.width, scaleY=h/artwork.height; ctx.save(); ctx.scale(scaleX,scaleY);
    if (artwork.background !== 'transparent' && artwork.background !== 'camera') {
      ctx.fillStyle = artwork.background === 'black' ? '#0a0a0a' : artwork.background === 'custom' ? artwork.backgroundColor : '#fff';
      ctx.fillRect(0,0,artwork.width,artwork.height);
    }
    renderArtwork(ctx, preview ? [...artwork.items,preview] : artwork.items, artwork.width, artwork.height, symmetry);
    drawGuides(ctx, artwork.width, artwork.height, guide); ctx.restore();
  },[artwork,preview,guide,symmetry]);
  useEffect(()=>{repaint(); const ro=new ResizeObserver(repaint); if(boxRef.current)ro.observe(boxRef.current); return()=>ro.disconnect();},[repaint]);
  useEffect(()=>{
    const canvas=overlayRef.current, box=boxRef.current; if(!canvas||!box)return;
    const rect=box.getBoundingClientRect(), dpr=window.devicePixelRatio||1; canvas.width=Math.max(1,Math.round(rect.width*dpr)); canvas.height=Math.max(1,Math.round(rect.height*dpr));
    const ctx=canvas.getContext('2d'); if(!ctx)return; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,rect.width,rect.height);
    for(const hand of tracking.hands){ const pts=hand.landmarks.map(p=>({x:(1-p.x)*rect.width,y:p.y*rect.height})); if(landmarks){ ctx.lineWidth=2; ctx.strokeStyle='#6ce3c0'; ctx.lineCap='round'; for(const [a,b] of CONNECTIONS){ctx.beginPath();ctx.moveTo(pts[a].x,pts[a].y);ctx.lineTo(pts[b].x,pts[b].y);ctx.stroke();} for(const [i,p] of pts.entries()){ctx.beginPath();ctx.fillStyle=i===8?'#ffb454':'#f7fffd';ctx.arc(p.x,p.y,i===8?5:3,0,Math.PI*2);ctx.fill();} } }
    if(selectedItem){const b=drawingBounds(selectedItem,5);if(b){ctx.save();ctx.strokeStyle='#81e1c4';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.strokeRect(b.left/artwork.width*rect.width,b.top/artwork.height*rect.height,(b.right-b.left)/artwork.width*rect.width,(b.bottom-b.top)/artwork.height*rect.height);ctx.restore();}}
    if(cursor){ const x=cursor.x/artwork.width*rect.width,y=cursor.y/artwork.height*rect.height; ctx.beginPath();ctx.strokeStyle=drawing?'#f8c06a':'rgba(255,255,255,.85)';ctx.lineWidth=2;ctx.arc(x,y,7,0,Math.PI*2);ctx.stroke(); }
  },[tracking,landmarks,cursor,drawing,artwork.width,artwork.height,selectedItem]);
  const coords=(event:React.PointerEvent<HTMLCanvasElement>)=>{const r=event.currentTarget.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width*artwork.width,y:(event.clientY-r.top)/r.height*artwork.height};};
  const videoActive=Boolean(videoRef.current?.srcObject)&&!tracking.simulated;
  const cameraBackdrop=artwork.background==='camera';
  const cameraEmpty=!tracking.simulated&&!videoRef.current?.srcObject;
  return <div className="workspace" ref={boxRef} data-background={artwork.background}>
    {artwork.background==='custom'&&<div className="custom-bg" style={{backgroundColor:artwork.backgroundColor}}/>}
    <video ref={videoRef} className={`camera-video ${videoActive?'video-on':''} ${cameraBackdrop?'camera-background':''} ${tracking.simulated?'is-simulated':''}`} playsInline muted aria-label={tracking.simulated?'Simulated hand-tracking preview':'Live mirrored webcam feed'} />
    {cameraEmpty&&<div className="camera-empty"><div className="camera-empty-icon">✳</div><strong>{cameraBackdrop?'Camera background is ready':'Your canvas is ready'}</strong><span>{cameraBackdrop?'Start the camera to see its live feed behind your artwork.':'Start the camera or explore with a simulated hand.'}</span></div>}
    {tracking.simulated&&<div className="demo-watermark">SIMULATED TRACKING · CAMERA OFF</div>}
    <canvas ref={artRef} className={`art-layer ${tool==='text'?'text-tool':''} ${tool==='select'?'select-tool':''}`} aria-label="Artwork canvas; use mouse, touch, or hand tracking" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);props.onPointerStart(coords(e));}} onPointerMove={e=>{if(e.buttons||e.pointerType==='touch')props.onPointerMove(coords(e));}} onPointerUp={props.onPointerEnd} onPointerCancel={props.onPointerEnd}/>
    <canvas ref={overlayRef} className="tracking-layer" aria-hidden="true" />
    <div className="workspace-corner top-left"><span className={`live-indicator ${tracking.status==='ready'?'active':''}`}/>{tracking.simulated?'Demo mode':tracking.status==='ready'?'Camera connected':'Camera off'}</div>
    <div className="workspace-corner top-right">{selectedItem?'Object selected':tracking.hands.length?`${tracking.hands.length} hand${tracking.hands.length>1?'s':''} detected`:'No hand detected'}</div>
    <div className="workspace-corner bottom-right">{tool==='select'?'Click an object to select · drag to move':tool==='line'||tool==='rectangle'||tool==='ellipse'||tool==='arrow'?'Drag to shape · release to finish':tool==='text'?'Click or tap to place text':'Mouse and touch drawing enabled'}</div>
  </div>;
}
