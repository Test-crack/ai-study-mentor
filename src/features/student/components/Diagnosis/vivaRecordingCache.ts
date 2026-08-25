// Client-side cache for viva answer recordings so they survive a refresh (no server
// upload until the student submits). IndexedDB because recordings are Blobs — localStorage
// can't hold them. Keys are namespaced `${examId}:${promptId}`. Best-effort: every call
// resolves even if IndexedDB is unavailable (private mode etc.), so it never blocks recording.
const DB_NAME = "viva-diagnostic";
const STORE = "recordings";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  try {
    const db = await openDb();
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined; // IndexedDB blocked/unavailable — degrade gracefully
  }
}

/** All cached recordings for an exam, keyed by promptId (prefix stripped). */
export async function cacheGetAll(examId: string): Promise<Record<string, Blob>> {
  const prefix = `${examId}:`;
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const out: Record<string, Blob> = {};
      const req = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return resolve(out);
        const k = String(cur.key);
        if (k.startsWith(prefix) && cur.value instanceof Blob) out[k.slice(prefix.length)] = cur.value;
        cur.continue();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
}

export function cacheSet(examId: string, promptId: string, blob: Blob): Promise<unknown> {
  return withStore("readwrite", (s) => s.put(blob, `${examId}:${promptId}`));
}

export function cacheDelete(examId: string, promptId: string): Promise<unknown> {
  return withStore("readwrite", (s) => s.delete(`${examId}:${promptId}`));
}

/** Wipe all cached recordings for an exam (after a successful submit). */
export async function cacheClear(examId: string): Promise<void> {
  const prefix = `${examId}:`;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(STORE, "readwrite").objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return resolve();
        if (String(cur.key).startsWith(prefix)) cur.delete();
        cur.continue();
      };
      req.onerror = () => reject(req.error);
    });
  } catch { /* ignore */ }
}
