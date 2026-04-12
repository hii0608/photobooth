import { useEffect, useRef, useState } from 'react';
import { getThemesForLayout, getFramePath } from '../themes/themeConfig';
import styles from './ThemeSelectScreen.module.css';

// ── 슬롯 이미지들을 조립해서 캔버스로 보여주는 미리보기 ────────────
function CompositePreview({ theme, layout }) {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (theme.id === 'default') return;
    setLoaded(false);
    let cancelled = false;

    const paths = Array.from({ length: layout.total }, (_, i) =>
      getFramePath(theme.id, layout.folder, i),
    );

    Promise.all(
      paths.map(
        (p) =>
          new Promise((res) => {
            const img = new Image();
            img.onload  = () => res(img);
            img.onerror = () => res(null);
            img.src = p;
          }),
      ),
    ).then((imgs) => {
      if (cancelled) return;
      const valid = imgs.filter(Boolean);
      if (!valid.length) return;

      const slotW = valid[0].naturalWidth;
      const slotH = valid[0].naturalHeight;
      const { cols, rows } = layout;
      const gap = Math.round(Math.min(slotW, slotH) * 0.015);

      // 썸네일 스케일: 최대 높이/너비 180px
      const fullW  = cols * slotW + gap * (cols - 1);
      const fullH  = rows * slotH + gap * (rows - 1);
      const scale  = 180 / Math.max(fullW, fullH);
      const thumbW = Math.round(fullW * scale);
      const thumbH = Math.round(fullH * scale);

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = thumbW;
      canvas.height = thumbH;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, thumbW, thumbH);

      imgs.forEach((img, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = Math.round((col * (slotW + gap)) * scale);
        const y = Math.round((row * (slotH + gap)) * scale);
        const sw = Math.round(slotW * scale);
        const sh = Math.round(slotH * scale);

        // 사진 영역 자리 (회색)
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(x, y, sw, sh);

        if (img) ctx.drawImage(img, x, y, sw, sh);
      });

      if (!cancelled) setLoaded(true);
    });

    return () => { cancelled = true; };
  }, [theme.id, layout.folder, layout.total, layout.cols, layout.rows]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.compositeCanvas}
      style={{ opacity: loaded ? 1 : 0.3 }}
    />
  );
}

// ────────────────────────────────────────────────────────────────
export default function ThemeSelectScreen({ layout, onSelect, onBack }) {
  const themes = getThemesForLayout(layout.folder);

  return (
    <div className={styles.wrapper}>
      <button className={styles.back} onClick={onBack}>← 뒤로</button>

      <h2 className={styles.title}>테마 선택</h2>
      <p className={styles.sub}>{layout.label} · {layout.total}컷</p>

      <div className={styles.grid}>
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={styles.card}
            onClick={() => onSelect(theme)}
          >
            {theme.id === 'default' ? (
              <div className={styles.defaultThumb}>
                <span>NO</span>
                <span>FRAME</span>
              </div>
            ) : (
              <CompositePreview theme={theme} layout={layout} />
            )}
            <span className={styles.cardLabel}>{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
