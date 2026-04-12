import { useState, useMemo } from 'react';
import styles from './ResultScreen.module.css';

export default function ResultScreen({ capturedPhotos, layout, onRetake }) {
  const [flipped, setFlipped] = useState(false);

  // canvas → data URL (표시용, 저장 시에는 원본 canvas 사용)
  const photoUrls = useMemo(
    () => capturedPhotos.map((c) => c.toDataURL('image/jpeg', 0.92)),
    [capturedPhotos],
  );

  const handleSave = () => {
    if (!capturedPhotos.length) return;
    const pw  = capturedPhotos[0].width;
    const ph  = capturedPhotos[0].height;
    const gap = Math.round(Math.min(pw, ph) * 0.015);
    const { cols, rows } = layout;
    const W   = pw * cols + gap * (cols - 1);
    const H   = ph * rows + gap * (rows - 1);

    const composite = document.createElement('canvas');
    composite.width  = W;
    composite.height = H;
    const ctx = composite.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    capturedPhotos.forEach((photo, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = col * (pw + gap);
      const y   = row * (ph + gap);

      if (flipped) {
        ctx.save();
        ctx.translate(x + pw, y);
        ctx.scale(-1, 1);
        ctx.drawImage(photo, 0, 0, pw, ph);
        ctx.restore();
      } else {
        ctx.drawImage(photo, x, y, pw, ph);
      }
    });

    const a    = document.createElement('a');
    a.download = `photobooth_${layout.id}_${Date.now()}.png`;
    a.href     = composite.toDataURL('image/png');
    a.click();
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>YOUR PHOTOS — {layout.label}</span>

      {/* 사진 격자: flex:1 로 남은 공간 차지 */}
      <div className={styles.gridWrapper}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            gridTemplateRows:    `repeat(${layout.rows}, 1fr)`,
          }}
        >
          {photoUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`shot ${i + 1}`}
              className={`${styles.photo} ${flipped ? styles.photoFlipped : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 반전 토글 */}
      <label className={styles.flipToggle}>
        <input
          type="checkbox"
          checked={flipped}
          onChange={(e) => setFlipped(e.target.checked)}
          className={styles.flipCheckbox}
        />
        <span className={styles.flipTrack}>
          <span className={styles.flipThumb} />
        </span>
        <span className={styles.flipLabel}>좌우 반전</span>
      </label>

      {/* 액션 버튼 */}
      <div className={styles.actions}>
        <button className={styles.btnSave}   onClick={handleSave}>Save</button>
        <button className={styles.btnRetake} onClick={onRetake}>Retake</button>
      </div>
    </div>
  );
}
