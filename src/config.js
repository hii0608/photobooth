// ============================================================
//  PHOTOBOOTH CONFIGURATION
// ============================================================

export const CHROMA_COLOR     = { r: 0, g: 197, b: 0 };
export const CHROMA_THRESHOLD = 55;
export const COUNTDOWN_FROM   = 3; // 원래: 3

// ============================================================
//  LAYOUTS
//
//  label       : 화면에 표시되는 이름 — 한국 포토부스 표준 행×열 표기
//                예) "1 × 4" = 1행 4열 = 가로로 4칸 한 줄 (landscape)
//                    "4 × 1" = 4행 1열 = 세로로 4칸 한 줄 (portrait)
//  cols / rows : 실제 그리드 구조 (내부 렌더링용)
//  folder      : public/themes/{테마}/{folder}/ 경로
//  orientation : 'portrait' | 'landscape'
//  photoRatio  : 개별 슬롯 비율 (width/height)
// ============================================================
export const LAYOUTS = [

  // ── 세로형 (portrait) — 가로개수 × 세로개수 표기 ───────────
  {
    id         : '1x4',
    label      : '1 × 4',      // 가로 1칸 × 세로 4칸 (개별 슬롯은 와이드형)
    cols       : 1,
    rows       : 4,
    total      : 4,
    folder     : '1_4',
    orientation: 'portrait',
    photoRatio : 4 / 3,
  },
  {
    id         : '2x3',
    label      : '2 × 3',      // 가로 2칸 × 세로 3칸
    cols       : 2,
    rows       : 3,
    total      : 6,
    folder     : '2_3',
    orientation: 'portrait',
    photoRatio : 4 / 3,
  },
  {
    id         : '2x2_v',
    label      : '2 × 2 세로',
    cols       : 2,
    rows       : 2,
    total      : 4,
    folder     : '2_2_v',
    orientation: 'portrait',
    photoRatio : 3 / 4,
  },
  {
    id         : '1x3',
    label      : '1 × 3',      // 가로 1칸 × 세로 3칸
    cols       : 1,
    rows       : 3,
    total      : 3,
    folder     : '1_3',
    orientation: 'portrait',
    photoRatio : 4 / 3,
  },

  // ── 가로형 (landscape) — 가로개수 × 세로개수 표기 ──────────
{
    id         : '3x1',
    label      : '3 × 1',      // 가로 3칸 × 세로 1칸
    cols       : 3,
    rows       : 1,
    total      : 3,
    folder     : '3_1',
    orientation: 'landscape',
    photoRatio : 3 / 4,
  },
  {
    id         : '2x2_h',
    label      : '2 × 2 가로',
    cols       : 2,
    rows       : 2,
    total      : 4,
    folder     : '2_2_h',
    orientation: 'landscape',
    photoRatio : 4 / 3,
  },
];
