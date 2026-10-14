import { describe, expect, it, vi } from 'vitest';
import { cameraErrorMessage, releaseMediaTracks } from '../src/core/camera';

describe('camera failure and cleanup behavior',()=>{
 it('maps denied, unavailable, busy and insecure camera conditions to recovery guidance',()=>{
  expect(cameraErrorMessage(Object.assign(new Error('denied'),{name:'NotAllowedError'}))).toContain('permission was denied');
  expect(cameraErrorMessage(Object.assign(new Error('missing'),{name:'NotFoundError'}))).toContain('No camera was found');
  expect(cameraErrorMessage(Object.assign(new Error('busy'),{name:'NotReadableError'}))).toContain('busy in another application');
  expect(cameraErrorMessage(Object.assign(new Error('http'),{name:'SecurityError'}))).toContain('secure HTTPS');
 });
 it('stops every live media track and leaves already-ended tracks alone',()=>{
  const video={readyState:'live',stop:vi.fn()};const ended={readyState:'ended',stop:vi.fn()};const stream={getTracks:()=>[video,ended]} as unknown as MediaStream;
  releaseMediaTracks(stream);expect(video.stop).toHaveBeenCalledOnce();expect(ended.stop).not.toHaveBeenCalled();
 });
 it('safely handles a missing stream during repeated startup or shutdown',()=>expect(()=>releaseMediaTracks(null)).not.toThrow());
});
