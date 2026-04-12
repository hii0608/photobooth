import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { STAMPS } from '../config/stamps';
import styles from './StampLayer.module.css';

const DEFAULT_SIZE = 64; // px (화면 기준)

/**
 * 결과 사진 위에 드래그 가능한 스탬프 레이어
 *
 * ref.getPlaced() → 배치된 스탬프 배열 반환 (canvas 합성용)
 *
 * Props:
 *   containerRef — 사진 컨테이너 ref (좌표 기준)
 */
const StampLayer = forwardRef(function StampLayer({ containerRef }, ref) {
  const [placed, setPlaced]     = useState([]);  // { id, uid, type, value/src, x, y, size }
  const [showPicker, setShowPicker] = useState(false);
  const draggingRef = useRef(null); // { uid, startX, startY, origX, origY }

  // 부모 컴포넌트에서 getPlaced() 호출 가능
  useImperativeHandle(ref, () => ({
    getPlaced: () => placed,
  }));

  // 스탬프 추가
  const addStamp = useCallback((stamp) => {
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const cx = rect ? rect.width  / 2 : 100;
    const cy = rect ? rect.height / 2 : 100;
    setPlaced((prev) => [
      ...prev,
      {
        uid   : `${stamp.id}_${Date.now()}`,
        type  : stamp.type,
        value : stamp.value,
        src   : stamp.src,
        label : stamp.label,
        x     : cx - DEFAULT_SIZE / 2,
        y     : cy - DEFAULT_SIZE / 2,
        size  : DEFAULT_SIZE,
      },
    ]);
    setShowPicker(false);
  }, [containerRef]);

  // 스탬프 삭제
  const removeStamp = (uid) =>
    setPlaced((prev) => prev.filter((s) => s.uid !== uid));

  // 포인터 드래그
  const onPointerDown = useCallback((e, uid) => {
    e.preventDefault();
    const stamp = placed.find((s) => s.uid === uid);
    if (!stamp) return;
    draggingRef.current = {
      uid,
      startX: e.clientX,
      startY: e.clientY,
      origX : stamp.x,
      origY : stamp.y,
    };

    const onMove = (ev) => {
      const d = draggingRef.current;
      if (!d) return;
      setPlaced((prev) =>
        prev.map((s) =>
          s.uid === d.uid
            ? { ...s, x: d.origX + ev.clientX - d.startX, y: d.origY + ev.clientY - d.startY }
            : s,
        ),
      );
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  }, [placed]);

  return (
    <>
      {/* 배치된 스탬프들 */}
      {placed.map((stamp) => (
        <div
          key={stamp.uid}
          className={styles.stamp}
          style={{ left: stamp.x, top: stamp.y, width: stamp.size, height: stamp.size }}
          onPointerDown={(e) => onPointerDown(e, stamp.uid)}
        >
          {stamp.type === 'emoji'
            ? <span className={styles.stampEmoji}>{stamp.value}</span>
            : <img src={stamp.src} className={styles.stampImg} alt={stamp.label} />
          }
          <button
            className={styles.removeBtn}
            onClick={(e) => { e.stopPropagation(); removeStamp(stamp.uid); }}
            aria-label="삭제"
          >✕</button>
        </div>
      ))}

      {/* 스탬프 추가 버튼 */}
      <button
        className={styles.addBtn}
        onClick={() => setShowPicker((v) => !v)}
        aria-label="스탬프 추가"
      >
        {showPicker ? '✕' : '+ 스탬프'}
      </button>

      {/* 스탬프 피커 */}
      {showPicker && (
        <div className={styles.picker}>
          {STAMPS.map((stamp) => (
            <button
              key={stamp.id}
              className={styles.pickerItem}
              onClick={() => addStamp(stamp)}
              title={stamp.label}
            >
              {stamp.type === 'emoji'
                ? stamp.value
                : <img src={stamp.src} style={{ width: 28, height: 28 }} alt={stamp.label} />
              }
            </button>
          ))}
        </div>
      )}
    </>
  );
});

export default StampLayer;
