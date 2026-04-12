import { LAYOUTS } from '../config';
import { getThemesForLayout } from '../themes/themeConfig';
import styles from './LayoutSelectScreen.module.css';

/**
 * 레이아웃 미리보기 셀 격자
 * orientation에 따라 컨테이너 비율이 세로/가로로 달라집니다.
 */
function LayoutPreview({ cols, rows, orientation }) {
  const cells = Array.from({ length: cols * rows });
  return (
    <div
      className={`${styles.previewFrame} ${orientation === 'landscape' ? styles.previewLandscape : styles.previewPortrait}`}
    >
      <div
        className={styles.preview}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows   : `repeat(${rows}, 1fr)`,
        }}
      >
        {cells.map((_, i) => (
          <div key={i} className={styles.cell} />
        ))}
      </div>
    </div>
  );
}

export default function LayoutSelectScreen({ onSelect }) {
  const portrait  = LAYOUTS.filter((l) => l.orientation === 'portrait');
  const landscape = LAYOUTS.filter((l) => l.orientation === 'landscape');

  const renderCard = (layout) => {
    const themeCount = getThemesForLayout(layout.folder)
      .filter((t) => t.id !== 'default').length;

    return (
      <button
        key={layout.id}
        className={styles.card}
        onClick={() => onSelect(layout)}
      >
        <LayoutPreview
          cols={layout.cols}
          rows={layout.rows}
          orientation={layout.orientation}
        />
        <span className={styles.cardLabel}>{layout.label}</span>
        <span className={styles.cardSub}>
          {layout.total}컷{themeCount > 0 ? ` · 테마 ${themeCount}개` : ''}
        </span>
      </button>
    );
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>레이아웃 선택</h2>
      <p className={styles.sub}>원하는 사진 배치를 선택하세요</p>

      {/* 세로형 */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>세로형</span>
        <div className={styles.grid}>
          {portrait.map(renderCard)}
        </div>
      </div>

      {/* 가로형 */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>가로형</span>
        <div className={styles.grid}>
          {landscape.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
