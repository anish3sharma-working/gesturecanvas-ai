export function releaseMediaTracks(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try { if (track.readyState !== 'ended') track.stop(); } catch { /* Keep shutting down other tracks. */ }
  }
}

export function cameraErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'Camera permission was denied. Allow camera access in browser settings, then try again—or use the simulated demo.';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No camera was found. Connect a webcam or use the simulated demo.';
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'The camera is busy in another application. Close it there and retry.';
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') return 'This camera cannot provide the requested video format. Try another camera or browser.';
  if (name === 'SecurityError') return 'Camera access requires localhost or a secure HTTPS page. Use the simulated demo on this origin.';
  if (error instanceof Error && error.message) return error.message;
  return 'Could not start the camera. Check browser camera permissions and try again.';
}
