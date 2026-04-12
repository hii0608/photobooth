import { useState, useMemo } from 'react';
import styles from './ArrangeScreen.module.css';

/**
 * 전체 촬영 사진 중 각 슬롯에 배치할 사진을 자유롭게 선택합니다.
 * 중복 선택 가능. 기본값: 슬롯 i → 해당 슬롯의 1번째 촬영.
 *
 * Props:
 *   capturedBySlot : Array<[canvas, canvas]>  — bySlot[slot][take]
 *   videos         : Array<Blob|null>          — videos[slot*2+take]
 *   layout         : { cols, rows, total, label }
 *   onConfirm      : ({ photos, videos }) => void
 *   onRetake       : () => void
 */
export default function ArrangeScreen({ capturedBySlot, videos, layout, onConfirm, onRetake }) {
  // 전체 촬영 사진을 flat 배열로 — allPhotos[slot*2+take]
  const allPhotos = useMemo(() => capturedBySlot.flat(), [capturedBySlot]);

  const allUrls = useMemo(
    () => allPhotos.map((c) => c.toDataURL('image/jpeg', 0.75)),
    [allPhotos],
  );

  // 각 슬롯의 기본 선택: 해당 슬롯의 1번째 촬영 인덱스
  const [selected, setSelected] = useState(
    () => Array.from({ length: capturedBySlot.length }, (_, i) => i * 2),
  );

  const handleSelect = (slotIdx, photoIdx) => {
    setSelected((prev) => {
      const next = [...prev];
      next[slotIdx] = photoIdx;
      return next;
    });
  };

  const handleConfirm = () => {
    const photos         = selected.map((i) => allPhotos[i]);
    const selectedVideos = selected.map((i) => videos?.[i] ?? null);
    onConfirm({ photos, videos: selectedVideos });
  };

  // 슬롯 번호 라벨: "1-1", "1-2", "2-1", "2-2" ...
  const photoLabel = (photoIdx) => {
    const slot = Math.floor(photoIdx / 2) + 1;
    const take = (photoIdx % 2) + 1;
    return `${slot}-${take}`;
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>사진 선택</h2>
      <p className={styles.sub}>슬롯마다 원하는 사진을 고르세요 · 중복 선택 가능</p>

      <div className={styles.slotList}>
        {selected.map((selectedPhotoIdx, slotIdx) => (
          <div key={slotIdx} className={styles.slotRow}>
            {/* 슬롯 번호 + 현재 선택 미리보기 */}
            <div className={styles.slotInfo}>
              <span className={styles.slotNum}>{slotIdx + 1}</span>
              <img
                src={allUrls[selectedPhotoIdx]}
                className={styles.slotPreview}
                alt="선택된 사진"
              />
            </div>

            {/* 전체 사진 가로 스크롤 선택지 */}
            <div className={styles.strip}>
              {allUrls.map((url, photoIdx) => (
                <button
                  key={photoIdx}
                  className={`${styles.photoBtn} ${selectedPhotoIdx === photoIdx ? styles.photoBtnSelected : ''}`}
                  onClick={() => handleSelect(slotIdx, photoIdx)}
                >
                  <img src={url} className={styles.photoThumb} alt="" />
                  <span className={styles.photoLabel}>{photoLabel(photoIdx)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.btnRetake}  onClick={onRetake}>다시 찍기</button>
        <button className={styles.btnConfirm} onClick={handleConfirm}>완료</button>
      </div>
    </div>
  );
}
