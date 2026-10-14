import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import App from '../src/App';
const detector = vi.fn(() => ({ landmarks: [], handednesses: [] }));
const closeModel = vi.fn();
vi.mock('@mediapipe/tasks-vision', () => ({ FilesetResolver: { forVisionTasks: vi.fn(async () => ({})) }, HandLandmarker: { createFromOptions: vi.fn(async () => ({ detectForVideo: detector, close: closeModel })) } }));
class RO { observe() {} disconnect() {} }
class TestPointerEvent extends MouseEvent { pointerId: number; pointerType: string; constructor(type: string, init: any = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? 'mouse'; } }
function liveStream() { const track = { readyState: 'live', stop: vi.fn() }; return { track, stream: { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream }; }
let getUserMedia: ReturnType<typeof vi.fn>;
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('ResizeObserver', RO); vi.stubGlobal('PointerEvent', TestPointerEvent); vi.stubGlobal('requestAnimationFrame', vi.fn(() => 17)); vi.stubGlobal('cancelAnimationFrame', vi.fn()); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null); HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined); getUserMedia = vi.fn(); Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('camera and demo runtime', () => {
  it('does not request camera permission until the user presses Start camera', () => { getUserMedia.mockResolvedValue(liveStream().stream); render(<App/>); expect(getUserMedia).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Start camera' })); expect(getUserMedia).toHaveBeenCalledOnce(); });
  it('starts, stops and starts tracking again while releasing every camera stream and model', async () => { const first = liveStream(), second = liveStream(); getUserMedia.mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream); render(<App/>); fireEvent.click(screen.getByRole('button', { name: 'Start camera' })); await screen.findByText('Tracking ready'); fireEvent.click(screen.getByRole('button', { name: 'Stop camera' })); expect(first.track.stop).toHaveBeenCalledOnce(); expect(closeModel).toHaveBeenCalledOnce(); fireEvent.click(screen.getByRole('button', { name: 'Start camera' })); await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2)); await screen.findByText('Tracking ready'); fireEvent.click(screen.getByRole('button', { name: 'Stop camera' })); expect(second.track.stop).toHaveBeenCalledOnce(); expect(closeModel).toHaveBeenCalledTimes(2); });
  it('shows the live camera layer behind the canvas only when Camera feed is selected', async () => { const live = liveStream(); getUserMedia.mockResolvedValue(live.stream); const { container } = render(<App/>); const video = screen.getByLabelText('Live mirrored webcam feed'); expect(video).not.toHaveClass('video-on'); fireEvent.click(screen.getByRole('button', { name: 'Start camera' })); await screen.findByText('Tracking ready'); fireEvent.change(screen.getByLabelText('Canvas background'), { target: { value: 'camera' } }); expect(container.querySelector('.workspace')).toHaveAttribute('data-background', 'camera'); expect(video).toHaveClass('video-on', 'camera-background'); fireEvent.click(screen.getByRole('button', { name: 'Stop camera' })); });
  it('shows an actionable permission-denied error', async () => { vi.spyOn(console, 'error').mockImplementation(() => {}); const err = Object.assign(new Error('blocked'), { name: 'NotAllowedError' }); getUserMedia.mockRejectedValue(err); render(<App/>); fireEvent.click(screen.getByRole('button', { name: 'Start camera' })); const alerts = await screen.findAllByRole('alert'); expect(alerts.some(alert => alert.textContent?.includes('Camera permission was denied.'))).toBe(true); });
  it('runs a visibly labeled simulated demo without requesting the webcam', () => { render(<App/>); fireEvent.click(screen.getByRole('button', { name: /try demo/i })); expect(screen.getByText(/SIMULATED TRACKING/)).toBeInTheDocument(); expect(screen.getByText('Simulated tracking')).toBeInTheDocument(); expect(getUserMedia).not.toHaveBeenCalled(); });
  it('selects and drags a drawn object, deletes it directly, and restores it with Undo', () => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'setPointerCapture', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720, toJSON: () => ({}) } as DOMRect);
    render(<App/>);
    const canvas = screen.getByLabelText('Artwork canvas; use mouse, touch, or hand tracking');
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 100, clientY: 100, buttons: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(screen.getByText(/1 stroke/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select tool' }));
    fireEvent.pointerDown(canvas, { pointerId: 2, clientX: 100, clientY: 100, buttons: 1 });
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 160, clientY: 150, buttons: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 2, clientX: 160, clientY: 150 });
    expect(screen.getByText('1 SELECTED')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected object' }));
    expect(screen.getByText(/0 strokes/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText(/1 stroke/)).toBeInTheDocument();
  });
});
