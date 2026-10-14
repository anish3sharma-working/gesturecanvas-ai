import { cp, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const source = resolve('node_modules/@mediapipe/tasks-vision/wasm');
const target = resolve('public/wasm');
try {
  const entries = await readdir(source);
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true, force: true });
  console.log(`Copied ${entries.length} MediaPipe runtime assets to public/wasm.`);
} catch (error) {
  console.warn('MediaPipe runtime assets were not copied. Install dependencies before starting the app.', error instanceof Error ? error.message : error);
}
