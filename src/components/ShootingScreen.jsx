import { useRef, useEffect, useCallback, useState } from 'react';
import { COUNTDOWN_FROM } from '../config';
import { drawMirroredVideo } from '../utils/chromaKey';
import styles from './ShootingScreen.module.css';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ShootingScreen({
  frameCanvases,
  layout,           // { id, cols, rows, total }
  onComplete,       // (capturedCanvases: HTMLCanvasElement[]) => void
  videoRef,
}) {
  const overlayCanvasRef = useRef(null);
  const containerRef     = useRef(null);
  const rafRef           = useRef(null);
  const shootingRef      = useRef(false);

  const [currentShot, setCurrentShot] = useState(0);
  const [countdown, setCountdown]     = useState(null);
  const [thumbs, setThumbs]           = useState([]);
  const [flash, setFlash]             = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);

  const currentShotRef = useRef(0);
  const capturedRef    = useRef([]);

  const total = layout.total;

  // ── Fit container to current frame's aspect ratio ────────
  const fitContainer = useCallback(() => {
    const frame = frameCanvases[currentShotRef.current] || frameCanvases[0];
    if (!frame || !containerRef.current) return;
    const ar     = frame.width / frame.height;
    const parent = containerRef.current.parentElement;
    const maxW   = parent.clientWidth;
    const maxH   = parent.clientHeight;
    let w, h;
    if (maxW / maxH > ar) { h = maxH; w = h * ar; }
    else                  { w = maxW; h = w / ar; }
    containerRef.current.style.width  = `${Math.floor(w)}px`;
    containerRef.current.style.height = `${Math.floor(h)}px`;
  }, [frameCanvases]);

  // ── Render loop ───────────────────────────────────────────
  const renderLoop = useCallback(() => {
    const frame     = frameCanvases[currentShotRef.current];
    const canvas    = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!frame || !canvas || !container) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }
    const dw = container.clientWidth;
    const dh = container.clientHeight;
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw; canvas.height = dh;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dw, dh);
    ctx.drawImage(frame, 0, 0, dw, dh);
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [frameCanvases]);

  useEffect(() => {
    fitContainer();
    renderLoop();
    window.addEventListener('resize', fitContainer);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', fitContainer);
    };
  }, [fitContainer, renderLoop]);

  // ── Capture ───────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const frame = frameCanvases[currentShotRef.current];
    const video = videoRef.current;
    if (!frame || !video) return null;
    const c   = document.createElement('canvas');
    c.width   = frame.width;
    c.height  = frame.height;
    const ctx = c.getContext('2d');
    drawMirroredVideo(ctx, video, c.width, c.height);
    ctx.drawImage(frame, 0, 0, c.width, c.height);
    return c;
  }, [frameCanvases, videoRef]);

  // ── Shutter ───────────────────────────────────────────────
  const handleShutter = useCallback(async () => {
    if (shootingRef.current) return;
    shootingRef.current = true;
    setBtnDisabled(true);

    for (let n = COUNTDOWN_FROM; n >= 1; n--) {
      setCountdown(n);
      await sleep(900);
    }
    setCountdown(null);

    setFlash(true);
    await sleep(60);
    setFlash(false);

    const photo = capturePhoto();
    if (photo) {
      capturedRef.current.push(photo);
      const tw = 60;
      const th = Math.round(tw * photo.height / photo.width);
      const tc = document.createElement('canvas');
      tc.width = tw; tc.height = th;
      tc.getContext('2d').drawImage(photo, 0, 0, tw, th);
      setThumbs((prev) => [...prev, tc.toDataURL()]);
    }

    const nextShot = currentShotRef.current + 1;
    currentShotRef.current = nextShot;
    setCurrentShot(nextShot);

    // layout.total에 도달하면 완료
    if (nextShot >= total) {
      cancelAnimationFrame(rafRef.current);
      onComplete(capturedRef.current);
    } else {
      fitContainer();
      setBtnDisabled(false);
    }
    shootingRef.current = false;
  }, [capturePhoto, fitContainer, onComplete, total]);

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.flash} ${flash ? styles.flashOn : ''}`} />

      <div className={styles.topBar}>
        <span className={styles.counter}>
          {Math.min(currentShot + 1, total)}&nbsp;/&nbsp;{total}
        </span>
        <span className={styles.layoutBadge}>{layout.label}</span>
      </div>

      <div className={styles.middle}>
        <div ref={containerRef} className={styles.cameraContainer}>
          <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
          <canvas ref={overlayCanvasRef} className={styles.overlay} />
          {countdown !== null && (
            <div className={styles.countdownOverlay}>{countdown}</div>
          )}
          {thumbs.length > 0 && (
            <div className={styles.thumbStrip}>
              {thumbs.map((src, i) => (
                <img key={i} src={src} className={styles.thumb} alt={`shot ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottom}>
        <button
          className={styles.shutter}
          onClick={handleShutter}
          disabled={btnDisabled}
          aria-label="촬영"
        />
      </div>
    </div>
  );
}
