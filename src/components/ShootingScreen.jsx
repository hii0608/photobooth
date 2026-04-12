import { useRef, useEffect, useCallback, useState } from 'react';
import { COUNTDOWN_FROM } from '../config';
import { drawMirroredVideo } from '../utils/chromaKey';
import { useTheme } from '../hooks/useTheme';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import FilterBar from './FilterBar';
import styles from './ShootingScreen.module.css';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RECORD_AFTER_CAPTURE_MS = 2_200;

/**
 * 슬롯당 2번 촬영. 각 촬영마다 ~5초 클립 녹화.
 *
 * onComplete({ bySlot, videos }) 호출:
 *   bySlot : Array<[canvas, canvas]>
 *   videos : Array<Blob|null>  — videos[slot * 2 + take]
 */
export default function ShootingScreen({
  layout,
  theme,
  filterCss,
  presetId,
  custom,
  setPreset,
  setCustom,
  onComplete,
  videoRef,
}) {
  const { frameCanvases, loading: framesLoading } = useTheme(
    theme.id,
    layout.folder,
    layout.total,
  );
  const { startClip, stopClip } = useVideoRecorder(videoRef);

  const overlayCanvasRef = useRef(null);
  const containerRef     = useRef(null);
  const rafRef           = useRef(null);
  const shootingRef      = useRef(false);

  const totalShots = layout.total * 2;

  const [currentShot, setCurrentShot] = useState(0);
  const [countdown, setCountdown]     = useState(null);
  const [thumbs, setThumbs]           = useState([]);
  const [flash, setFlash]             = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [showFilter, setShowFilter]   = useState(false);

  const currentShotRef = useRef(0);
  const capturedBySlot = useRef(Array.from({ length: layout.total }, () => []));
  const videosByShot   = useRef(Array(totalShots).fill(null));

  const slotOf = (s) => Math.floor(s / 2);
  const takeOf = (s) => s % 2;

  // ── 컨테이너 비율 조정 ────────────────────────────────────
  const fitContainer = useCallback(() => {
    if (!containerRef.current) return;
    const slot  = slotOf(currentShotRef.current);
    const frame = frameCanvases[slot] ?? frameCanvases[0];
    // 프레임 이미지가 있으면 그 비율, 없으면 layout.photoRatio (가로/세로 구분)
    const ar    = frame
      ? frame.width / frame.height
      : (layout.photoRatio ?? 3 / 4);
    const parent = containerRef.current.parentElement;
    const maxW   = parent.clientWidth;
    const maxH   = parent.clientHeight;
    let w, h;
    if (maxW / maxH > ar) { h = maxH; w = h * ar; }
    else                  { w = maxW; h = w / ar; }
    containerRef.current.style.width  = `${Math.floor(w)}px`;
    containerRef.current.style.height = `${Math.floor(h)}px`;
  }, [frameCanvases, layout.photoRatio]);

  // ── 렌더 루프 ─────────────────────────────────────────────
  const renderLoop = useCallback(() => {
    const slot    = slotOf(currentShotRef.current);
    const frame   = frameCanvases[slot];
    const canvas  = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) { rafRef.current = requestAnimationFrame(renderLoop); return; }
    const dw = container.clientWidth;
    const dh = container.clientHeight;
    if (canvas.width !== dw || canvas.height !== dh) { canvas.width = dw; canvas.height = dh; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dw, dh);
    if (frame) ctx.drawImage(frame, 0, 0, dw, dh);
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [frameCanvases]);

  useEffect(() => {
    if (framesLoading) return;
    fitContainer();
    renderLoop();
    window.addEventListener('resize', fitContainer);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', fitContainer); };
  }, [framesLoading, fitContainer, renderLoop]);

  // ── 캡처 ─────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const slot  = slotOf(currentShotRef.current);
    const frame = frameCanvases[slot];
    const video = videoRef.current;
    if (!video) return null;

    let w, h;
    if (frame) {
      w = frame.width;
      h = frame.height;
    } else {
      // 프레임 없을 때: layout.photoRatio 기준으로 캔버스 크기 결정
      // 가로형(ratio≥1)이면 landscape, 세로형이면 portrait 크기
      const ratio = layout.photoRatio ?? 3 / 4;
      const vw    = video.videoWidth  || 1280;
      const vh    = video.videoHeight || 960;
      if (ratio >= 1) {
        // 가로형: 더 긴 쪽을 가로로
        const base = Math.max(vw, vh);
        w = base;
        h = Math.round(base / ratio);
      } else {
        // 세로형: 더 긴 쪽을 세로로
        const base = Math.max(vw, vh);
        h = base;
        w = Math.round(base * ratio);
      }
    }

    const c   = document.createElement('canvas');
    c.width   = w; c.height = h;
    const ctx = c.getContext('2d');
    if (filterCss) ctx.filter = filterCss;
    drawMirroredVideo(ctx, video, w, h);
    ctx.filter = 'none';
    if (frame) ctx.drawImage(frame, 0, 0, w, h);
    return c;
  }, [frameCanvases, videoRef, filterCss, layout.photoRatio]);

  // ── 셔터 ─────────────────────────────────────────────────
  const handleShutter = useCallback(async () => {
    if (shootingRef.current) return;
    shootingRef.current = true;
    setShowFilter(false);
    setBtnDisabled(true);

    startClip();

    for (let n = COUNTDOWN_FROM; n >= 1; n--) {
      setCountdown(n); await sleep(900);
    }
    setCountdown(null);

    setFlash(true); await sleep(60); setFlash(false);
    const photo = capturePhoto();

    await sleep(RECORD_AFTER_CAPTURE_MS);
    const videoBlob = await stopClip();

    const shotIdx = currentShotRef.current;
    const slot    = slotOf(shotIdx);
    const take    = takeOf(shotIdx);

    if (photo) {
      capturedBySlot.current[slot][take] = photo;
      videosByShot.current[shotIdx] = videoBlob;

      const tw = 60;
      const th = Math.round(tw * photo.height / photo.width);
      const tc = document.createElement('canvas');
      tc.width = tw; tc.height = th;
      tc.getContext('2d').drawImage(photo, 0, 0, tw, th);
      setThumbs((prev) => [...prev, { src: tc.toDataURL(), slot, take }]);
    }

    const nextShot = shotIdx + 1;
    currentShotRef.current = nextShot;
    setCurrentShot(nextShot);

    if (nextShot >= totalShots) {
      cancelAnimationFrame(rafRef.current);
      onComplete({ bySlot: capturedBySlot.current, videos: videosByShot.current });
    } else {
      fitContainer();
      setBtnDisabled(false);
    }
    shootingRef.current = false;
  }, [capturePhoto, fitContainer, onComplete, startClip, stopClip, totalShots]);

  if (framesLoading) {
    return <div className={styles.wrapper}><p className={styles.loadingText}>테마 로딩 중…</p></div>;
  }

  const currentSlot = slotOf(currentShot);
  const currentTake = takeOf(currentShot) + 1;
  const prevThumb   = thumbs.find((t) => t.slot === currentSlot && t.take === 0);

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.flash} ${flash ? styles.flashOn : ''}`} />

      <div className={styles.topBar}>
        <span className={styles.counter}>
          슬롯&nbsp;{Math.min(currentSlot + 1, layout.total)}&nbsp;/&nbsp;{layout.total}
        </span>
        <span className={styles.layoutBadge}>{layout.label}</span>
        <span className={styles.takeBadge}>{currentTake}번째 촬영</span>
      </div>

      <div className={styles.middle}>
        <div ref={containerRef} className={styles.cameraContainer}>
          <video
            ref={videoRef}
            className={styles.video}
            style={filterCss ? { filter: filterCss } : undefined}
            autoPlay playsInline muted
          />
          <canvas ref={overlayCanvasRef} className={styles.overlay} />
          {countdown !== null && (
            <div className={styles.countdownOverlay}>{countdown}</div>
          )}
          {prevThumb && currentTake === 2 && (
            <div className={styles.prevThumbWrapper}>
              <img src={prevThumb.src} className={styles.thumb} alt="1번째 촬영" />
              <span className={styles.thumbLabel}>1번째</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottom}>
        {/* 필터 토글 버튼 */}
        <button
          className={`${styles.filterToggle} ${showFilter ? styles.filterToggleActive : ''}`}
          onClick={() => setShowFilter((v) => !v)}
          disabled={btnDisabled}
          aria-label="필터"
        >
          필터
        </button>

        <button
          className={styles.shutter}
          onClick={handleShutter}
          disabled={btnDisabled}
          aria-label="촬영"
        />

        {/* 자리 맞춤 (좌우 균형) */}
        <div style={{ width: 52 }} />
      </div>

      {/* 필터 패널 */}
      {showFilter && (
        <FilterBar
          presetId={presetId}
          custom={custom}
          setPreset={setPreset}
          setCustom={setCustom}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
