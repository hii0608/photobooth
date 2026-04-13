/**
 * 커스텀 파티클 에셋 CRUD 훅
 *
 * 메타데이터 (이름, 애니메이션 설정, 노출 여부 등) — localStorage
 * 이미지 Blob — IndexedDB (particleDB.js)
 */

import { useState, useCallback } from 'react';
import { storeImage, removeImages } from '../utils/particleDB';

const STORAGE_KEY = 'photobooth_particle_assets';

function loadMeta() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function persistMeta(assets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

function uid() {
  return `pa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 에셋 구조:
 * {
 *   id        : string,
 *   name      : string,
 *   imageIds  : string[],   // IndexedDB key 목록
 *   animType  : string,     // 'bubble'|'cherry'|'wind'|'fish'|'sway'|'fall'|'float'
 *   speed     : number,     // 0.5 ~ 3.0
 *   count     : number,     // 5 ~ 50
 *   sizeScale : number,     // 0.5 ~ 3.0
 *   visible   : boolean,    // 사용자 화면 노출 여부
 *   createdAt : number,
 * }
 */
export function useParticleAssets() {
  const [assets, setAssets] = useState(loadMeta);

  /**
   * 새 에셋 저장 또는 기존 에셋 수정.
   * @param {object}  draft      - 에셋 메타데이터 (id 있으면 수정, 없으면 신규)
   * @param {File[]}  newFiles   - 새로 업로드할 이미지 File 목록
   * @param {string[]} keepIds   - 수정 시 유지할 기존 imageId 목록
   */
  const saveAsset = useCallback(async (draft, newFiles = [], keepIds = []) => {
    const isNew = !draft.id;
    const id    = draft.id || uid();

    // 기존 에셋이면 삭제될 이미지 ID 제거
    if (!isNew) {
      const old        = assets.find((a) => a.id === id);
      const removedIds = (old?.imageIds ?? []).filter((i) => !keepIds.includes(i));
      if (removedIds.length) await removeImages(removedIds);
    }

    // 새 이미지 저장
    const newImageIds = [];
    for (const file of newFiles) {
      const imgId = `${id}_img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await storeImage(imgId, file);
      newImageIds.push(imgId);
    }

    const asset = {
      animType : 'float',
      speed    : 1,
      count    : 20,
      sizeScale: 1,
      visible  : true,
      ...draft,
      id,
      imageIds : [...keepIds, ...newImageIds],
      createdAt: draft.createdAt ?? Date.now(),
    };

    setAssets((prev) => {
      const next = isNew
        ? [...prev, asset]
        : prev.map((a) => (a.id === id ? asset : a));
      persistMeta(next);
      return next;
    });
    return asset;
  }, [assets]);

  /** 노출 여부만 토글 */
  const toggleVisible = useCallback((id) => {
    setAssets((prev) => {
      const next = prev.map((a) =>
        a.id === id ? { ...a, visible: !a.visible } : a,
      );
      persistMeta(next);
      return next;
    });
  }, []);

  /** 에셋 삭제 (이미지도 함께 삭제) */
  const deleteAsset = useCallback(async (id) => {
    const asset = assets.find((a) => a.id === id);
    if (asset?.imageIds?.length) await removeImages(asset.imageIds);
    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      persistMeta(next);
      return next;
    });
  }, [assets]);

  /** 노출 중인 에셋만 반환 */
  const visibleAssets = assets.filter((a) => a.visible);

  return { assets, visibleAssets, saveAsset, toggleVisible, deleteAsset };
}
