/**
 * IndexedDB 래퍼 — 커스텀 파티클 이미지 Blob 저장/로드/삭제
 */

const DB_NAME    = 'photobooth_particle_db';
const STORE_NAME = 'images';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/** Blob을 지정 id로 저장합니다. */
export async function storeImage(id, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror    = (e) => reject(e.target.error);
  });
}

/** id로 Blob을 불러옵니다. 없으면 null 반환. */
export async function fetchImage(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/** 여러 id의 이미지를 삭제합니다. */
export async function removeImages(ids) {
  if (!ids?.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    ids.forEach((id) => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror    = (e) => reject(e.target.error);
  });
}

/**
 * imageIds 배열로 HTMLImageElement 배열을 반환합니다.
 * 로드에 실패한 항목은 제외됩니다.
 */
export async function loadParticleImages(imageIds) {
  if (!imageIds?.length) return [];
  const results = await Promise.all(
    imageIds.map(async (id) => {
      const blob = await fetchImage(id).catch(() => null);
      if (!blob) return null;
      return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }),
  );
  return results.filter(Boolean);
}
