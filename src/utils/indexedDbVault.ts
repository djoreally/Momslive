import { CloudinaryAsset, ResolutionPreset, TargetFrameRate } from '../types';

export interface LocalIndexedDbRecording {
  id: string;
  workspaceId: string;
  title: string;
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  resolution: ResolutionPreset;
  frameRate: TargetFrameRate;
  sizeBytes: number;
  createdAt: number;
  cloudinaryAsset?: CloudinaryAsset;
  tags: string[];
}

const DB_NAME = 'MomsStudioVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('workspaceId', 'workspaceId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Save master video recording directly to browser IndexedDB storage (instant zero-lag, no network cost)
 */
export async function saveLocalRecording(recording: LocalIndexedDbRecording): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(recording);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to save to IndexedDB'));
  });
}

/**
 * Get all local recordings scoped to a specific workspace ID
 */
export async function getWorkspaceLocalRecordings(workspaceId: string): Promise<LocalIndexedDbRecording[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('workspaceId');
    const request = index.getAll(IDBKeyRange.only(workspaceId));

    request.onsuccess = () => {
      const list = (request.result as LocalIndexedDbRecording[]) || [];
      // Sort newest first
      list.sort((a, b) => b.createdAt - a.createdAt);
      resolve(list);
    };
    request.onerror = () => reject(request.error || new Error('Failed to read from IndexedDB'));
  });
}

/**
 * Delete a local recording by ID
 */
export async function deleteLocalRecording(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to delete from IndexedDB'));
  });
}

/**
 * Associate a Cloudinary upload result with an IndexedDB recording
 */
export async function updateLocalRecordingCloudAsset(
  id: string,
  cloudAsset: CloudinaryAsset
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result as LocalIndexedDbRecording | undefined;
      if (record) {
        record.cloudinaryAsset = cloudAsset;
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}
