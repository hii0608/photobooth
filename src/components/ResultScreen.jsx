import { useState, useMemo, useRef } from 'react';
import { mergeVideoClips } from '../utils/videoMerge';
import StampLayer from './StampLayer';
import styles from './ResultScreen.module.css';

export default function ResultScreen({ capturedPhotos, selectedVideos, layout, onRetake }) {
  const [flipped, setFlipped]               = useState(false);
  const [mergingVideo, setMergingVideo]     = useState(false);
  const [mergeProgress, setMergeProgress]   = useState(0);

  const gridWrapperRef = useRef(null);
  const stampLayerRef  = useRef(null);

  const photoUrls = useMemo(
    () => capturedPhotos.map((c) => c.toDataURL('image/jpeg', 0.92)),
    [capturedPhotos],
  );

  // ── 스탬프를 canvas에 합성하는 헬퍼 ─────────────────────
  const drawStampsOnCanvas = (ctx, canvasW, canvasH, displayW, displayH) => {
    const placed = stampLayerRef.current?.getPlaced() ?? [];
    if (!placed.length) return;

    const scaleX = canvasW / displayW;
    const scaleY = canvasH / displayH;

    placed.forEach((stamp) => {
      const x    = stamp.x * scaleX;
      const y    = stamp.y * scaleY;
      const size = stamp.size * Math.min(scaleX, scaleY);

      if (stamp.type === 'emoji') {
        ctx.font         = `${size * 0.85}px serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(stamp.value, x, y);
      }
      // 이미지 스탬프는 추후 확장
    });
  };

  // ── 사진 저장 ─────────────────────────────────────────────
  const handleSave = () => {
    if (!capturedPhotos.length) return;
    const pw  = capturedPhotos[0].width;
    const ph  = capturedPhotos[0].height;
    const gap = Math.round(Math.min(pw, ph) * 0.015);
    const { cols, rows } = layout;
    const W = pw * cols + gap * (cols - 1);
    const H = ph * rows + gap * (rows - 1);

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

    // 스탬프 합성
    const wrapper = gridWrapperRef.current;
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      drawStampsOnCanvas(ctx, W, H, rect.width, rect.height);
    }

    const a    = document.createElement('a');
    a.download = `photobooth_${layout.id}_${Date.now()}.png`;
    a.href     = composite.toDataURL('image/png');
    a.click();
  };

  // ── 영상 저장 ─────────────────────────────────────────────
  const handleVideoSave = async () => {
    if (mergingVideo) return;
    const validClips = selectedVideos?.filter(Boolean);
    if (!validClips?.length) { alert('저장할 영상 클립이 없습니다.'); return; }

    setMergingVideo(true);
    setMergeProgress(0);

    try {
      const w = capturedPhotos[0]?.width  || 1280;
      const h = capturedPhotos[0]?.height || 960;
      const merged = await mergeVideoClips(
        validClips, w, h,
        (p) => setMergeProgress(Math.round(p * 100)),
      );
      if (merged) {
        const a    = document.createElement('a');
        a.download = `photobooth_video_${Date.now()}.webm`;
        a.href     = URL.createObjectURL(merged);
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      } else {
        alert('영상 합치기에 실패했습니다.');
      }
    } catch (err) {
      console.error('영상 저장 오류:', err);
      alert('영상 저장 중 오류가 발생했습니다.');
    } finally {
      setMergingVideo(false);
      setMergeProgress(0);
    }
  };

  const hasVideos = selectedVideos?.some(Boolean);

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>YOUR PHOTOS — {layout.label}</span>

      {/* 사진 + 스탬프 레이어 */}
      <div ref={gridWrapperRef} className={styles.gridWrapper}>
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

        {/* 스탬프 오버레이 */}
        <StampLayer ref={stampLayerRef} containerRef={gridWrapperRef} />
      </div>

      {/* 좌우 반전 토글 */}
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
        <button className={styles.btnSave} onClick={handleSave}>
          사진 저장
        </button>
        {hasVideos && (
          <button
            className={styles.btnVideo}
            onClick={handleVideoSave}
            disabled={mergingVideo}
          >
            {mergingVideo ? `합치는 중… ${mergeProgress}%` : '영상 저장'}
          </button>
        )}
        <button className={styles.btnRetake} onClick={onRetake}>
          Retake
        </button>
      </div>
    </div>
  );
}
