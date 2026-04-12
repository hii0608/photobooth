import { useState, useMemo, useRef, useEffect } from 'react';
import { mergeVideoClips } from '../utils/videoMerge';
import StampLayer from './StampLayer';
import styles from './ResultScreen.module.css';

const DEBUG_LAYOUT = false; // true로 변경 시 레이아웃 가이드 표시 (원복 시 false)

export default function ResultScreen({ capturedPhotos, selectedVideos, layout, onRetake }) {
  const [flipped, setFlipped]               = useState(false);
  const [mergingVideo, setMergingVideo]     = useState(false);
  const [mergeProgress, setMergeProgress]   = useState(0);
  const [compositeUrl, setCompositeUrl]     = useState(null);

  const gridWrapperRef = useRef(null);
  const stampLayerRef  = useRef(null);

  // ── 전체 합치기 (Canvas) ──────────────────────────────────
  const generateFullComposite = (withStamps = true) => {
    if (!capturedPhotos.length) return null;

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

    if (withStamps) {
      const wrapper = gridWrapperRef.current;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const placed = stampLayerRef.current?.getPlaced() ?? [];
        
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;

        placed.forEach((stamp) => {
          const x    = stamp.x * scaleX;
          const y    = stamp.y * scaleY;
          const size = stamp.size * Math.min(scaleX, scaleY);

          if (stamp.type === 'emoji') {
            ctx.fillStyle = '#fff';
            ctx.font      = `${size * 0.85}px serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(stamp.value, x, y);
          }
        });
      }
    }

    return composite;
  };

  // 실시간 미리보기 갱신 (반전 토글 시 등)
  useEffect(() => {
    const comp = generateFullComposite(false); // 스탬프는 오버레이로 보여줄 것이므로 여기선 제외
    if (comp) setCompositeUrl(comp.toDataURL('image/jpeg', 0.9));
  }, [capturedPhotos, flipped, layout]);

  // ── 사진 저장 (전체) ──────────────────────────────────────
  const handleSave = () => {
    const comp = generateFullComposite(true);
    if (!comp) return;

    const a    = document.createElement('a');
    a.download = `photobooth_full_${Date.now()}.png`;
    a.href     = comp.toDataURL('image/png');
    a.click();
  };

  // ── 개별 사진 저장 ──────────────────────────────────────
  const handleSaveIndividual = () => {
    capturedPhotos.forEach((photo, i) => {
      const c = document.createElement('canvas');
      c.width = photo.width;
      c.height = photo.height;
      const ctx = c.getContext('2d');

      if (flipped) {
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(photo, 0, 0);

      const a = document.createElement('a');
      a.download = `photo_${i + 1}_${Date.now()}.png`;
      a.href = c.toDataURL('image/png');
      a.click();
    });
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
    <div className={`${styles.wrapper} ${DEBUG_LAYOUT ? styles.debugLayout : ''}`}>
      <span className={styles.label}>YOUR RESULT — {layout.label}</span>

      {/* 미리보기 영역 (전체 합쳐진 모습) */}
      <div ref={gridWrapperRef} className={styles.previewContainer}>
        {compositeUrl && (
          <img 
            src={compositeUrl} 
            className={styles.fullPreview} 
            alt="Result Preview" 
          />
        )}
        
        {/* 스탬프 레이어 (실시간 오버레이) */}
        <StampLayer ref={stampLayerRef} containerRef={gridWrapperRef} />
      </div>

      <div className={styles.controls}>
        {/* 좌우 반전 토글 */}
        <label className={styles.flipToggle}>
          <input
            type="checkbox"
            checked={flipped}
            onChange={(e) => setFlipped(e.target.checked)}
            className={styles.flipCheckbox}
          />
          <span className={styles.flipTrack}><span className={styles.flipThumb} /></span>
          <span className={styles.flipLabel}>좌우 반전</span>
        </label>
      </div>

      {/* 액션 버튼 */}
      <div className={styles.actions}>
        <button className={styles.btnSave} onClick={handleSave}>
          저장하기
        </button>
        <button className={styles.btnSaveSub} onClick={handleSaveIndividual}>
          개별 저장
        </button>
        {hasVideos && (
          <button
            className={styles.btnVideo}
            onClick={handleVideoSave}
            disabled={mergingVideo}
          >
            영상
          </button>
        )}
        <button className={styles.btnRetake} onClick={onRetake}>
          다시 찍기
        </button>
      </div>

      {/* 영상 합치기 로딩 오버레이 */}
      {mergingVideo && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.adPlaceholder}>
              <p>ADVERTISEMENT</p>
              <span>광고가 들어갈 자리입니다.</span>
            </div>
            
            <p className={styles.loadingText}>영상을 만드는 중입니다...</p>
            
            <div className={styles.progressBarWrapper}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${mergeProgress}%` }}
              />
            </div>
            <span className={styles.progressPercent}>{mergeProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
