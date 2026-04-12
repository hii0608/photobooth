import { useState, useMemo } from 'react';
import styles from './ArrangeScreen.module.css';

const DEBUG_LAYOUT = false; // true로 변경 시 레이아웃 가이드 표시 (원복 시 false)

/**
 * 전체 촬영 사진 중 템플릿의 각 슬롯에 배치할 사진을 선택합니다.
 * 중복 선택이 가능하며, 템플릿 슬롯을 클릭하여 개별 삭제가 가능합니다.
 *
 * Props:
 *   capturedBySlot : Array<[canvas, canvas]>  — bySlot[slot][take]
 *   videos         : Array<Blob|null>          — videos[shotIdx]
 *   layout         : { cols, rows, total, label, photoRatio }
 *   onConfirm      : ({ photos, videos }) => void
 *   onRetake       : () => void
 */
export default function ArrangeScreen({ capturedBySlot, videos, layout, onConfirm, onRetake }) {
  // 전체 촬영 사진을 1차원 배열로
  const allPhotos = useMemo(() => capturedBySlot.flat(), [capturedBySlot]);

  const allUrls = useMemo(
    () => allPhotos.map((c) => c.toDataURL('image/jpeg', 0.75)),
    [allPhotos],
  );

  // 고정된 크기의 배열로 상태 관리 (null은 빈 슬롯)
  // 매핑 유지를 위해 삭제 시 뒤의 사진이 당겨지지 않도록 함
  const [selected, setSelected] = useState(() => Array(layout.total).fill(null));

  // 하단 사진 클릭 시: 항상 첫 번째 빈 슬롯에 추가 (중복 허용)
  const handlePhotoClick = (photoIdx) => {
    setSelected((prev) => {
      const emptyIdx = prev.indexOf(null);
      if (emptyIdx !== -1) {
        const next = [...prev];
        next[emptyIdx] = photoIdx;
        return next;
      }
      return prev; // 빈 슬롯이 없으면 무시
    });
  };

  // 상단 템플릿 슬롯 클릭 시: 해당 칸만 비우기 (No-shifting)
  const handleSlotClick = (slotIndex) => {
    setSelected((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.some(s => s === null)) {
      alert('모든 슬롯을 채워주세요!');
      return;
    }
    const photos         = selected.map((i) => allPhotos[i]);
    const selectedVideos = selected.map((i) => videos?.[i] ?? null);
    onConfirm({ photos, videos: selectedVideos });
  };

  // 비율 계산
  const photoAR = layout.photoRatio || 3 / 4;
  const gridAR  = (layout.cols * photoAR) / layout.rows;

  return (
    <div className={`${styles.wrapper} ${DEBUG_LAYOUT ? styles.debugLayout : ''}`}>
      <h2 className={styles.title}>사진 선택</h2>
      <p className={styles.sub}>템플릿 칸을 클릭하면 삭제됩니다 · 중복 선택 가능</p>

      {/* 조립될 템플릿 영역: 화면 높이에 맞춰 Constraint 적용 */}
      <div className={styles.templateSection}>
        <div 
          className={styles.templateGrid}
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
            aspectRatio: `${gridAR}`
          }}
        >
          {selected.map((photoIdx, i) => (
            <div 
              key={i} 
              className={styles.templateSlot} 
              onClick={() => handleSlotClick(i)}
            >
              {photoIdx !== null ? (
                <img src={allUrls[photoIdx]} className={styles.slotImage} alt="" />
              ) : (
                <div className={styles.emptySlot}>{i + 1}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* 전체 촬영된 사진 리스트: 내부 스크롤 적용 */}
      <div className={styles.photoListContainer}>
        <div className={styles.photoList}>
          {allUrls.map((url, photoIdx) => {
            // 해당 사진이 선택된 모든 슬롯 번호 찾기 (1-based)
            const assignedSlots = selected.reduce((acc, val, idx) => 
              (val === photoIdx ? [...acc, idx + 1] : acc), []
            );
            const isSelected = assignedSlots.length > 0;

            return (
              <div
                key={photoIdx}
                className={`${styles.photoItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => handlePhotoClick(photoIdx)}
                style={{ aspectRatio: `${photoAR}` }}
              >
                <img src={url} className={styles.photoThumb} alt="" />
                {isSelected && (
                  <div className={styles.badge}>
                    {assignedSlots.join(',')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnRetake}  onClick={onRetake}>다시 찍기</button>
        <button 
          className={styles.btnConfirm} 
          onClick={handleConfirm}
          disabled={selected.some(s => s === null)}
          style={{ opacity: selected.some(s => s === null) ? 0.5 : 1 }}
        >
          완료
        </button>
      </div>
    </div>
  );
}
