import { useRef, useEffect, useCallback, useState } from 'react';
import { COUNTDOWN_FROM } from '../config';
import { drawMirroredVideo } from '../utils/chromaKey';
import { useTheme } from '../hooks/useTheme';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { ParticleEffect } from '../utils/particleSystem';
import FilterBar from './FilterBar';
import styles from './ShootingScreen.module.css';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RECORD_AFTER_CAPTURE_MS = 1500; // 원래: 2_200 -> 1_500

const FLASH_OPTIONS = [
  { id: 'none',   label: 'OFF', color: 'transparent' },
  { id: 'white',  label: '흰색', color: '#ffffff' },
  { id: 'yellow', label: '노란색', color: '#fff9e6' },
  { id: 'green',  label: '초록색', color: '#e6ffeb' },
];

const EFFECT_OPTIONS = [
  { id: 'none',     label: '효과 없음' },
  { id: 'goldfish', label: '금붕어' },
  { id: 'cherry',   label: '벚꽃' },
  { id: 'snow',     label: '눈' },
  { id: 'leaf',     label: '낙엽' },
  { id: 'bubble',    label: '버블' },
];

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
  const particleSystem   = useRef(new ParticleEffect(25, 'none'));

  const totalShots = layout.total * 2; // 원래: layout.total * 2

  const [currentShot, setCurrentShot] = useState(0);
  const [countdown, setCountdown]     = useState(null);
  const [thumbs, setThumbs]           = useState([]);
  const [flash, setFlash]             = useState(false);
  const [flashColorIdx, setFlashColorIdx] = useState(0); // 0: none, 1: white, 2: yellow, 3: green
  const [effectIdx, setEffectIdx]         = useState(0);
  const [isAuto, setIsAuto]               = useState(true); 
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [showFilter, setShowFilter]   = useState(false);

  const currentShotRef = useRef(0);
  const capturedBySlot = useRef(Array.from({ length: layout.total }, () => []));
  const videosByShot   = useRef(Array(totalShots).fill(null));

  const slotOf = (s) => Math.floor(s / 2);
  const takeOf = (s) => s % 2;

  const currentFlash = FLASH_OPTIONS[flashColorIdx];
  const currentEffect = EFFECT_OPTIONS[effectIdx];

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

    // 파티클 시스템 초기화/업데이트
    particleSystem.current.init(Math.floor(w), Math.floor(h));
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
    if (canvas.width !== dw || canvas.height !== dh) { 
      canvas.width = dw; 
      canvas.height = dh; 
      particleSystem.current.init(dw, dh);
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dw, dh);
    
    // 파티클 업데이트 및 그리기
    if (currentEffect.id !== 'none') {
      particleSystem.current.update();
      particleSystem.current.draw(ctx);
    }

    if (frame) ctx.drawImage(frame, 0, 0, dw, dh);
    
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [frameCanvases, currentEffect]);

  useEffect(() => {
    if (framesLoading) return;
    fitContainer();
    renderLoop();
    window.addEventListener('resize', fitContainer);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', fitContainer); };
  }, [framesLoading, fitContainer, renderLoop]);

  useEffect(() => {
    particleSystem.current.setType(currentEffect.id);
  }, [currentEffect]);

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
      const ratio = layout.photoRatio ?? 3 / 4;
      const vw    = video.videoWidth  || 1280;
      const vh    = video.videoHeight || 960;
      if (ratio >= 1) {
        const base = Math.max(vw, vh);
        w = base; h = Math.round(base / ratio);
      } else {
        const base = Math.max(vw, vh);
        h = base; w = Math.round(base * ratio);
      }
    }

    const c   = document.createElement('canvas');
    c.width   = w; c.height = h;
    const ctx = c.getContext('2d');
    
    if (filterCss) ctx.filter = filterCss;
    drawMirroredVideo(ctx, video, w, h);
    ctx.filter = 'none';

    // 캡처 시 파티클도 함께 그림
    if (currentEffect.id !== 'none') {
      // 캡처용 캔버스 크기에 맞춰 파티클을 다시 그리거나 비율 조정 필요
      // 여기서는 현재 파티클 시스템의 상태를 그대로 캡처 캔버스에 투영
      const tempParticleSystem = new ParticleEffect(particleSystem.current.count, currentEffect.id);
      tempParticleSystem.init(w, h);
      // 현재 메인 캔버스의 파티클 위치 비례해서 복사 (단순화를 위해 현재 상태 복사)
      particleSystem.current.particles.forEach((p, i) => {
        const tp = tempParticleSystem.particles[i];
        if (tp) {
          tp.x = (p.x / particleSystem.current.width) * w;
          tp.y = (p.y / particleSystem.current.height) * h;
          tp.size = (p.size / particleSystem.current.width) * w;
          tp.angle = p.angle;
          tp.opacity = p.opacity;
          tp.speedX = p.speedX; // 방향 유지를 위해
          tp.draw(ctx);
        }
      });
    }

    if (frame) ctx.drawImage(frame, 0, 0, w, h);
    return c;
  }, [frameCanvases, videoRef, filterCss, layout.photoRatio, currentEffect]);

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

    // 플래시 효과 (총 0.5초: 0.3초 노출 후 캡처, 0.2초 잔상)
    if (currentFlash.id !== 'none') {
      setFlash(true);
      await sleep(300); // 얼굴에 빛이 비칠 시간
    } else {
      setFlash(true); await sleep(60); setFlash(false); // 기본 셔터 느낌
    }

    const photo = capturePhoto();

    if (currentFlash.id !== 'none') {
      await sleep(200); // 캡처 후 잠깐 더 보여주기
      setFlash(false);
    }

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

      if (isAuto) {
        setTimeout(() => {
          handleShutter();
        }, 600);
      }
    }
    shootingRef.current = false;
  }, [capturePhoto, fitContainer, onComplete, startClip, stopClip, totalShots, currentFlash, isAuto]);

  const toggleFlash = useCallback(() => {
    setFlashColorIdx((prev) => (prev + 1) % FLASH_OPTIONS.length);
  }, []);

  const toggleEffect = useCallback(() => {
    setEffectIdx((prev) => (prev + 1) % EFFECT_OPTIONS.length);
  }, []);

  const toggleAuto = useCallback(() => {
    setIsAuto((v) => !v);
  }, []);

  if (framesLoading) {
    return <div className={styles.wrapper}><p className={styles.loadingText}>테마 로딩 중…</p></div>;
  }

  const currentSlot = slotOf(currentShot);
  const currentTake = takeOf(currentShot) + 1;
  const prevThumb   = thumbs.find((t) => t.slot === currentSlot && t.take === 0);

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.flash} ${flash ? styles.flashOn : ''}`}
        style={{ backgroundColor: currentFlash.color }}
      />

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
        >
          {isAuto && <span className={styles.autoShutterBadge}>AUTO</span>}
        </button>

        <div className={styles.sideButtons}>
          {/* 자동/수동 토글 */}
          <button
            className={`${styles.autoToggle} ${isAuto ? styles.autoToggleActive : ''}`}
            onClick={toggleAuto}
            disabled={btnDisabled}
            aria-label="자동촬영"
          >
            {isAuto ? '자동' : '수동'}
          </button>

          {/* 플래시 토글 버튼 */}
          <button
            className={`${styles.flashToggle} ${currentFlash.id !== 'none' ? styles.flashToggleActive : ''}`}
            onClick={toggleFlash}
            disabled={btnDisabled}
            aria-label="플래시"
          >
            {currentFlash.label}
          </button>

          {/* 효과 토글 버튼 */}
          <button
            className={`${styles.effectToggle} ${currentEffect.id !== 'none' ? styles.effectToggleActive : ''}`}
            onClick={toggleEffect}
            disabled={btnDisabled}
            aria-label="효과"
          >
            {currentEffect.label}
          </button>
        </div>
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
