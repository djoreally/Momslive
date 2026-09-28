import { StudioSetting } from '../types';

const DB_NAME = 'momslive-backgrounds';
const STORE_NAME = 'presets';
const DB_VERSION = 1;

interface StoredBackgroundPreset {
  id: string;
  name: string;
  blob: Blob;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBackgroundPreset(file: File): Promise<StudioSetting> {
  const db = await openDb();
  const id = `custom_${Date.now()}`;
  const record: StoredBackgroundPreset = {
    id,
    name: file.name.replace(/\.[^.]+$/, '').slice(0, 32) || 'Custom Background',
    blob: file,
    createdAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  const url = URL.createObjectURL(file);
  return {
    id,
    name: record.name,
    thumbnailUrl: url,
    bgImageUrl: url,
    category: 'custom',
    blur: 0,
    brightness: 1,
  };
}

export async function loadBackgroundPresets(): Promise<StudioSetting[]> {
  const db = await openDb();
  const records = await new Promise<StoredBackgroundPreset[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as StoredBackgroundPreset[]);
    req.onerror = () => reject(req.error);
  });
  db.close();

  return records
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((record) => {
      const url = URL.createObjectURL(record.blob);
      return {
        id: record.id,
        name: record.name,
        thumbnailUrl: url,
        bgImageUrl: url,
        category: 'custom' as const,
        blur: 0,
        brightness: 1,
      };
    });
}
