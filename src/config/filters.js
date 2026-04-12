// ============================================================
//  FILTER CONFIGURATION
//  프리셋 필터 목록 및 CSS filter 변환 유틸리티
// ============================================================

/** 슬라이더로 조절할 수 있는 커스텀 필터 기본값 */
export const DEFAULT_CUSTOM = {
  brightness : 100, // %  (100 = 원본)
  contrast   : 100, // %
  saturation : 100, // %
  warmth     : 0,   // -50 ~ 50 (sepia 근사)
};

/** 프리셋 목록 */
export const FILTER_PRESETS = [
  {
    id     : 'none',
    label  : '기본',
    custom : { brightness: 100, contrast: 100, saturation: 100, warmth: 0 },
  },
  {
    id     : 'bright',
    label  : '밝게',
    custom : { brightness: 130, contrast: 105, saturation: 100, warmth: 0 },
  },
  {
    id     : 'warm',
    label  : '따뜻',
    custom : { brightness: 108, contrast: 100, saturation: 115, warmth: 20 },
  },
  {
    id     : 'cool',
    label  : '쿨톤',
    custom : { brightness: 105, contrast: 100, saturation: 85,  warmth: -15 },
  },
  {
    id     : 'vivid',
    label  : '선명',
    custom : { brightness: 105, contrast: 115, saturation: 150, warmth: 5 },
  },
  {
    id     : 'vintage',
    label  : '빈티지',
    custom : { brightness: 110, contrast: 90,  saturation: 70,  warmth: 30 },
  },
  {
    id     : 'mono',
    label  : '흑백',
    custom : { brightness: 105, contrast: 110, saturation: 0,   warmth: 0 },
  },
  // ── 뷰티 프리셋 (Phase 6) ────────────────���─────────────
  {
    id     : 'beauty_soft',
    label  : '피부 보정',
    custom : { brightness: 115, contrast: 92,  saturation: 105, warmth: 8 },
    beauty : true,
    blur   : 0.6,   // px
  },
  {
    id     : 'beauty_glow',
    label  : '빛나는',
    custom : { brightness: 125, contrast: 88,  saturation: 110, warmth: 12 },
    beauty : true,
    blur   : 0.8,
  },
];

/**
 * custom 값 + blur → CSS filter 문자열로 변환합니다.
 */
export function customToCss({ brightness, contrast, saturation, warmth }, blur = 0) {
  const sepia  = Math.abs(warmth) / 100;           // 0 ~ 0.5
  const hueRot = warmth > 0 ? 0 : -10;             // 차가운 색감: hue-rotate
  const parts  = [
    `brightness(${brightness / 100})`,
    `contrast(${contrast / 100})`,
    `saturate(${saturation / 100})`,
  ];
  if (warmth > 0)  parts.push(`sepia(${sepia.toFixed(2)})`);
  if (warmth < 0)  parts.push(`hue-rotate(${hueRot}deg)`, `saturate(${(saturation * 0.85 / 100).toFixed(2)})`);
  if (blur  > 0)   parts.push(`blur(${blur}px)`);
  return parts.join(' ');
}
