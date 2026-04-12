import { FILTER_PRESETS } from '../config/filters';
import styles from './FilterBar.module.css';

const SLIDERS = [
  { key: 'brightness', label: '밝기',  min: 50,  max: 180, step: 1 },
  { key: 'contrast',   label: '대비',  min: 50,  max: 200, step: 1 },
  { key: 'saturation', label: '채도',  min: 0,   max: 200, step: 1 },
  { key: 'warmth',     label: '색온도', min: -50, max: 50,  step: 1 },
];

/**
 * 촬영 화면 하단에 표시되는 필터 선택 바
 *
 * Props:
 *   presetId  — 현재 프리셋 ID
 *   custom    — 커스텀 값 객체
 *   setPreset — (id) => void
 *   setCustom — (key, value) => void
 *   onClose   — 패널 닫기
 */
export default function FilterBar({ presetId, custom, setPreset, setCustom, onClose }) {
  return (
    <div className={styles.panel}>
      {/* 닫기 */}
      <button className={styles.closeBtn} onClick={onClose}>✕</button>

      {/* 프리셋 버튼 목록 */}
      <div className={styles.presets}>
        {FILTER_PRESETS.map((p) => (
          <button
            key={p.id}
            className={`${styles.presetBtn} ${presetId === p.id ? styles.presetActive : ''} ${p.beauty ? styles.beautyBtn : ''}`}
            onClick={() => setPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 커스텀 슬라이더 */}
      <div className={styles.sliders}>
        {SLIDERS.map(({ key, label, min, max, step }) => (
          <label key={key} className={styles.sliderRow}>
            <span className={styles.sliderLabel}>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={custom[key]}
              onChange={(e) => setCustom(key, Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{custom[key]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
