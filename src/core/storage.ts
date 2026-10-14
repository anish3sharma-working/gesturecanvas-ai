import type { Artwork, DrawingItem } from '../types';
const DB_NAME = 'gesturecanvas-artworks'; const STORE = 'artworks'; const FALLBACK_KEY = 'gesturecanvas-artworks-v1';

function validArtwork(value: unknown): value is Artwork {
  if (!value || typeof value !== 'object') return false; const a = value as Partial<Artwork>;
  return typeof a.id === 'string' && typeof a.name === 'string' && Number.isFinite(a.width) && Number.isFinite(a.height) && Array.isArray(a.items) && a.items.every((item: DrawingItem) => item && typeof item.kind === 'string' && Array.isArray(item.points));
}
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => { if (!('indexedDB' in window)) return reject(new Error('IndexedDB is unavailable.')); const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error ?? new Error('Local artwork storage could not be opened.')); });
}
function fallbackRead(): Artwork[] { try { const value = JSON.parse(localStorage.getItem(FALLBACK_KEY) ?? '[]'); return Array.isArray(value) ? value.filter(validArtwork) : []; } catch { return []; } }
function fallbackWrite(items: Artwork[]) { try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(items)); } catch { throw new Error('Browser storage is full or blocked. Export a PNG and remove older saved artwork before trying again.'); } }

export async function listArtworks(): Promise<Artwork[]> {
  try { const db = await openDB(); return await new Promise((resolve, reject) => { const req = db.transaction(STORE).objectStore(STORE).getAll(); req.onsuccess = () => { const values = (req.result as unknown[]).filter(validArtwork); resolve(values.sort((a, b) => b.updatedAt - a.updatedAt)); }; req.onerror = () => reject(req.error); }); }
  catch { return fallbackRead().sort((a, b) => b.updatedAt - a.updatedAt); }
}
export async function saveArtwork(artwork: Artwork): Promise<void> {
  const value = structuredClone({ ...artwork, updatedAt: Date.now() });
  try { const db = await openDB(); await new Promise<void>((resolve, reject) => { const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); }
  catch { const items = fallbackRead(); const idx = items.findIndex(x => x.id === value.id); if (idx >= 0) items[idx] = value; else items.push(value); fallbackWrite(items); }
}
export async function deleteArtwork(id: string): Promise<void> {
  try { const db = await openDB(); await new Promise<void>((resolve, reject) => { const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); }
  catch { fallbackWrite(fallbackRead().filter(item => item.id !== id)); }
}
