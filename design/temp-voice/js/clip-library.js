// Persistent local library of generated clips (IndexedDB — localStorage is
// too small to hold audio blobs at any real scale). Every successful
// generation or recording gets saved here automatically, giving the app a
// real history/dashboard instead of each clip vanishing once played.
const DB_NAME = 'speakscape';
const DB_VERSION = 1;
const STORE = 'clips';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function createClipLibrary() {
  const dbPromise = typeof indexedDB !== 'undefined' ? openDb().catch(() => null) : Promise.resolve(null);

  return {
    isSupported: typeof indexedDB !== 'undefined',

    async addClip({ engine, voiceLabel, text, blob, ext, durationSec }) {
      const db = await dbPromise;
      if (!db) return null;
      const clip = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        engine,
        voiceLabel,
        text,
        blob,
        ext,
        durationSec: durationSec || null,
      };
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).add(clip);
        tx.oncomplete = () => resolve(clip);
        tx.onerror = () => reject(tx.error);
      });
    },

    async listClips() {
      const db = await dbPromise;
      if (!db) return [];
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
        req.onerror = () => reject(req.error);
      });
    },

    async deleteClip(id) {
      const db = await dbPromise;
      if (!db) return;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },

    async updateClip(id, patch) {
      const db = await dbPromise;
      if (!db) return null;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const req = store.get(id);
        req.onsuccess = () => {
          const clip = req.result;
          if (!clip) { resolve(null); return; }
          Object.assign(clip, patch);
          store.put(clip);
        };
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    },

    async clearAll() {
      const db = await dbPromise;
      if (!db) return;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },

    async getStats() {
      const clips = await this.listClips();
      const totalDuration = clips.reduce((sum, c) => sum + (c.durationSec || 0), 0);
      const engineCounts = {};
      const voiceCounts = {};
      for (const c of clips) {
        engineCounts[c.engine] = (engineCounts[c.engine] || 0) + 1;
        if (c.voiceLabel) voiceCounts[c.voiceLabel] = (voiceCounts[c.voiceLabel] || 0) + 1;
      }
      const topOf = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return {
        totalClips: clips.length,
        totalDuration,
        topEngine: topOf(engineCounts),
        topVoice: topOf(voiceCounts),
      };
    },
  };
}
