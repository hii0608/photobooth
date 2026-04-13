import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { COUNTDOWN_FROM } from '../config';
import { drawMirroredVideo } from '../utils/chromaKey';
import { useTheme } from '../hooks/useTheme';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { useParticleAssets } from '../hooks/useParticleAssets';
import { ParticleEffect } from '../utils/particleSystem';
import { CustomParticleEffect } from '../utils/customParticle';
import { loadParticleImages } from '../utils/particleDB';
import FilterBar from './FilterBar';
import styles from './ShootingScreen.module.css';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RECORD_AFTER_CAPTURE_MS = 2200;

const FLASH_OPTIONS = [
  { id: 'none',   label: 'OFF',   color: 'transparent' },
  { id: 'white',  label: '흰색',  color: '#ffffff' },
  { id: 'yellow', label: '노란색', color: '#fff9e6' },
  { id: 'green',  label: '초록색', color: '#e6ffeb' },
];

const BUILTIN_EFFECTS = [
  { id: 'none',     label: '없음' },
  { id: 'goldfish', label: '금붕어' },
  { id: 'cherry',   label: '벚꽃' },
  { id: 'snow',     label: '눈' },
  { id: 'leaf',     label: '낙엽' },
  { id: 'bubble',   label: '버블' },
];

const BUILTIN_IDS = new Set(BUILTIN_EFFECTS.map((e) => e.id));

export default function ShootingScreen({
  layout, theme, filterCss, presetId, custom, setPreset, setCustom, onComplete, videoRef,
}) {
  const { frameCanvases, loading: framesLoading } = useTheme(theme.id, layout.folder, layout.total);
  const { startClip, stopClip }  = useVideoRecorder(videoRef);
  const { visibleAssets }        = useParticleAssets();

  const overlayCanvasRef = useRef(null);
  const containerRef     = useRef(null);
  const rafRef           = useRef(null);
  const shootingRef      = useRef(false);

  // 파티클 시스템 — RAF 루프와 함께 계속 살아있음
  const builtinParticles = useRef(new ParticleEffect(25, 'none'));
  const customParticles  = useRef(null);
  const customImgCache   = useRef(new Map()); // assetId → HTMLImageElement[]

  // RAF 루프가 ref로 최신 값을 읽기 위한 shadow refs
  const effectIdRef      = useRef('none');
  const frameCanvasesRef = useRef([]);

  const totalShots = layout.total * 2;

  const [currentShot, setCurrentShot]       = useState(0);
  const [countdown, setCountdown]           = useState(null);
  const [thumbs, setThumbs]                 = useState([]);
  const [flash, setFlash]                   = useState(false);
  const [flashColorIdx, setFlashColorIdx]   = useState(0);
  const [effectId, setEffectId]             = useState('none');
  const [isAuto, setIsAuto]                 = useState(true);
  const [btnDisabled, setBtnDisabled]       = useState(false);
  const [showFilter, setShowFilter]         = useState(false);
  const [showEffects, setShowEffects]       = useState(false);

  const currentShotRef = useRef(0);
  const capturedBySlot = useRef(Array.from({ length: layout.total }, () => []));
  const videosByShot   = useRef(Array(totalShots).fill(null));

  const slotOf = (s) => Math.floor(s / 2);
  const takeOf = (s) => s % 2;

  const currentFlash = FLASH_OPTIONS[flashColorIdx];

  // ── effectId·frameCanvases를 ref에 동기화 (render loop용) ──
  useEffect(() => { effectIdRef.current = effectId; }, [effectId]);
  useEffect(() => { frameCanvasesRef.current = frameCanvases; }, [frameCanvases]);

  // ── 효과 옵션 (내장 + 노출 중인 커스텀) ──────────────────
  const effectOptions = useMemo(() => [
    ...BUILTIN_EFFECTS,
    ...visibleAssets.map((a) => ({ id: `custom:${a.id}`, label: a.name })),
  ], [visibleAssets]);

  const currentEffect = effectOptions.find((e) => e.id === effectId) ?? effectOptions[0];

  // ── 커스텀 에셋 이미지 사전 로드 ─────────────────────────
  useEffect(() => {
    visibleAssets.forEach((asset) => {
      if (customImgCache.current.has(asset.id)) return;
      loadParticleImages(asset.imageIds ?? []).then((imgs) => {
        customImgCache.current.set(asset.id, imgs);
      });
    });
  }, [visibleAssets]);

  // ── 효과 전환 — 파티클 시스템 교체 (loop는 계속 돌아감) ──
  useEffect(() => {
    if (effectId.startsWith('custom:')) {
      const assetId = effectId.replace('custom:', '');
      const asset   = visibleAssets.find((a) => a.id === assetId);
      builtinParticles.current.setType('none');
      if (asset) {
        const imgs = customImgCache.current.get(assetId) ?? [];
        const eff  = new CustomParticleEffect(asset, imgs);
        const c    = containerRef.current;
        if (c?.clientWidth) eff.init(c.clientWidth, c.clientHeight);
        customParticles.current = eff;
      }
    } else {
      customParticles.current = null;
      builtinParticles.current.setType(effectId);
    }
  }, [effectId, visibleAssets]);

  // ── 컨테이너 비율 조정 (파티클 init 없음 — loop가 담당) ──
  const fitContainer = useCallback(() => {
    if (!containerRef.current) return;
    const slot  = slotOf(currentShotRef.current);
    const fcs   = frameCanvasesRef.current;
    const frame = fcs[slot] ?? fcs[0];
    const ar    = frame ? frame.width / frame.height : (layout.photoRatio ?? 3 / 4);
    const parent = containerRef.current.parentElement;
    const maxW = parent.clientWidth;
    const maxH = parent.clientHeight;
    let w, h;
    if (maxW / maxH > ar) { h = maxH; w = h * ar; }
    else                  { w = maxW; h = w / ar; }
    containerRef.current.style.width  = `${Math.floor(w)}px`;
    containerRef.current.style.height = `${Math.floor(h)}px`;
  }, [layout.photoRatio]);

  // ── 안정적인 RAF 루프 — 의존성 없음, ref로 최신값 읽음 ──
  const renderLoop = useCallback(() => {
    const eid     = effectIdRef.current;
    const fcs     = frameCanvasesRef.current;
    const slot    = slotOf(currentShotRef.current);
    const frame   = fcs[slot];
    const canvas  = overlayCanvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const dw = container.clientWidth;
    const dh = container.clientHeight;

    // 캔버스 크기 변경 처리
    if (canvas.width !== dw || canvas.height !== dh) {
      if (canvas.width > 0 && canvas.height > 0) {
        // 기존 파티클 위치를 비율에 맞게 스케일링 (초기화 X)
        const sx = dw / canvas.width;
        const sy = dh / canvas.height;
        [builtinParticles.current, customParticles.current]
          .filter(Boolean)
          .forEach((sys) => {
            (sys.particles ?? []).forEach((p) => {
              p.x *= sx;
              p.y *= sy;
              p.canvasWidth  = dw;
              p.canvasHeight = dh;
            });
            sys.width  = dw;
            sys.height = dh;
          });
      } else {
        // 최초 1회 init
        builtinParticles.current.init(dw, dh);
        if (customParticles.current) customParticles.current.init(dw, dh);
      }
      canvas.width  = dw;
      canvas.height = dh;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dw, dh);

    if (eid !== 'none' && BUILTIN_IDS.has(eid)) {
      builtinParticles.current.update();
      builtinParticles.current.draw(ctx);
    }
    if (eid.startsWith('custom:') && customParticles.current) {
      customParticles.current.update();
      customParticles.current.draw(ctx);
    }

    if (frame) ctx.drawImage(frame, 0, 0, dw, dh);

    rafRef.current = requestAnimationFrame(renderLoop);
  }, []); // 의존성 없음 — 절대 재시작되지 않음

  // ── 루프 시작 (로딩 완료 후 한 번만) ─────────────────────
  useEffect(() => {
    if (framesLoading) return;
    fitContainer();
    renderLoop();
    window.addEventListener('resize', fitContainer);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', fitContainer);
    };
  }, [framesLoading, fitContainer, renderLoop]);

  // ── 캡처 ─────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const slot  = slotOf(currentShotRef.current);
    const frame = frameCanvasesRef.current[slot];
    const video = videoRef.current;
    if (!video) return null;

    let w, h;
    if (frame) {
      w = frame.width; h = frame.height;
    } else {
      const ratio = layout.photoRatio ?? 3 / 4;
      const vw = video.videoWidth  || 1280;
      const vh = video.videoHeight || 960;
      if (ratio >= 1) { const base = Math.max(vw, vh); w = base; h = Math.round(base / ratio); }
      else            { const base = Math.max(vw, vh); h = base; w = Math.round(base * ratio); }
    }

    const c   = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    if (filterCss) ctx.filter = filterCss;
    drawMirroredVideo(ctx, video, w, h);
    ctx.filter = 'none';

    // 내장 파티클 캡처 (현재 위치 비율 변환)
    const eid = effectIdRef.current;
    if (eid !== 'none' && BUILTIN_IDS.has(eid)) {
      const pw = builtinParticles.current.width  || 1;
      const ph = builtinParticles.current.height || 1;
      builtinParticles.current.particles.forEach((p) => {
        const sx = p.x; const sy = p.y; const ss = p.size;
        p.x = (p.x / pw) * w; p.y = (p.y / ph) * h; p.size = (p.size / pw) * w;
        p.draw(ctx);
        p.x = sx; p.y = sy; p.size = ss;
      });
    }

    // 커스텀 파티클 캡처
    if (eid.startsWith('custom:') && customParticles.current) {
      const cw = customParticles.current.width  || 1;
      const ch = customParticles.current.height || 1;
      customParticles.current.particles.forEach((p) => {
        const sx = p.x; const sy = p.y; const ss = p.size;
        const scw = p.canvasWidth; const sch = p.canvasHeight;
        p.x = (p.x / cw) * w; p.y = (p.y / ch) * h;
        p.size = (p.size / cw) * w;
        p.canvasWidth = w; p.canvasHeight = h;
        p.draw(ctx);
        p.x = sx; p.y = sy; p.size = ss;
        p.canvasWidth = scw; p.canvasHeight = sch;
      });
    }

    if (frame) ctx.drawImage(frame, 0, 0, w, h);
    return c;
  }, [filterCss, layout.photoRatio, videoRef]);

  // ── 셔터 ─────────────────────────────────────────────────
  const handleShutter = useCallback(async () => {
    if (shootingRef.current) return;
    shootingRef.current = true;
    setShowFilter(false);
    setShowEffects(false);
    setBtnDisabled(true);

    startClip();

    for (let n = COUNTDOWN_FROM; n >= 1; n--) {
      setCountdown(n); await sleep(900);
    }
    setCountdown(null);

    if (currentFlash.id !== 'none') {
      setFlash(true); await sleep(300);
    } else {
      setFlash(true); await sleep(60); setFlash(false);
    }

    const photo = capturePhoto();

    if (currentFlash.id !== 'none') {
      await sleep(200); setFlash(false);
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
      if (isAuto) setTimeout(() => { handleShutter(); }, 600);
    }
    shootingRef.current = false;
  }, [capturePhoto, fitContainer, onComplete, startClip, stopClip, totalShots, currentFlash, isAuto]);

  const toggleFlash = useCallback(() => {
    setFlashColorIdx((prev) => (prev + 1) % FLASH_OPTIONS.length);
  }, []);

  const selectEffect = useCallback((id) => {
    setEffectId(id);
    setShowEffects(false);
  }, []);

  const toggleAuto = useCallback(() => setIsAuto((v) => !v), []);

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

      {/* 효과 선택 패널 */}
      {showEffects && (
        <div className={styles.effectPanel}>
          <div className={styles.effectPanelInner}>
            {effectOptions.map((opt) => (
              <button
                key={opt.id}
                className={`${styles.effectChip} ${effectId === opt.id ? styles.effectChipActive : ''}`}
                onClick={() => selectEffect(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.bottom}>
        <button
          className={`${styles.filterToggle} ${showFilter ? styles.filterToggleActive : ''}`}
          onClick={() => { setShowFilter((v) => !v); setShowEffects(false); }}
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
          <button
            className={`${styles.autoToggle} ${isAuto ? styles.autoToggleActive : ''}`}
            onClick={toggleAuto}
            disabled={btnDisabled}
          >
            {isAuto ? '자동' : '수동'}
          </button>

          <button
            className={`${styles.flashToggle} ${currentFlash.id !== 'none' ? styles.flashToggleActive : ''}`}
            onClick={toggleFlash}
            disabled={btnDisabled}
          >
            {currentFlash.label}
          </button>

          <button
            className={`${styles.effectToggle} ${effectId !== 'none' ? styles.effectToggleActive : ''} ${showEffects ? styles.effectToggleOpen : ''}`}
            onClick={() => { setShowEffects((v) => !v); setShowFilter(false); }}
            disabled={btnDisabled}
            title={currentEffect.label}
          >
            {effectId === 'none' ? '효과' : (currentEffect.label.length > 3 ? currentEffect.label.slice(0, 3) : currentEffect.label)}
          </button>
        </div>
      </div>

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
