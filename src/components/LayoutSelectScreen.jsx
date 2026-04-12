import { LAYOUTS } from '../config';
import styles from './LayoutSelectScreen.module.css';

/**
 * 고정 크기(72×72px) 박스 안에 cols×rows 격자를 꽉 채워 시각화합니다.
 * grid-template-rows도 함께 지정해 어떤 레이아웃이든 동일 면적을 차지합니다.
 */
function LayoutPreview({ cols, rows }) {
  const cells = Array.from({ length: cols * rows });
  return (
    <div
      className={styles.preview}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows:    `repeat(${rows}, 1fr)`,
      }}
    >
      {cells.map((_, i) => (
        <div key={i} className={styles.cell} />
      ))}
    </div>
  );
}

export default function LayoutSelectScreen({ onSelect }) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>레이아웃 선택</h2>
      <p className={styles.sub}>원하는 사진 배치를 선택하세요</p>

      <div className={styles.grid}>
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            className={styles.card}
            onClick={() => onSelect(layout)}
          >
            {/* 고정 크기 미리보기 영역 */}
            <div className={styles.previewWrapper}>
              <LayoutPreview cols={layout.cols} rows={layout.rows} />
            </div>
            <span className={styles.cardLabel}>{layout.label}</span>
            <span className={styles.cardSub}>{layout.total}컷</span>
          </button>
        ))}
      </div>
    </div>
  );
}
