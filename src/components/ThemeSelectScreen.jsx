import { getThemesForLayout } from '../themes/themeConfig';
import styles from './ThemeSelectScreen.module.css';

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
            {theme.thumbnail ? (
              <img
                src={theme.thumbnail}
                className={styles.thumbnail}
                alt={theme.name}
              />
            ) : (
              <div className={styles.defaultThumb}>
                <span>NO</span>
                <span>FRAME</span>
              </div>
            )}
            <span className={styles.cardLabel}>{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
