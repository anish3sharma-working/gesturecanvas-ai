import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const url = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const target = resolve('public/models/hand_landmarker.task');
await mkdir(dirname(target), { recursive: true });
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength < 100_000) throw new Error('Downloaded model file is unexpectedly small.');
  await writeFile(target, buffer);
  console.log(`Saved official model (${(await stat(target)).size.toLocaleString()} bytes) to ${target}`);
} catch (error) {
  console.error('Could not download the official MediaPipe model. Check internet access or local network authentication, then retry: npm run model:download');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
