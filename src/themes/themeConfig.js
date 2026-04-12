// ============================================================
//  THEME CONFIGURATION
//
//  테마를 추가하려면:
//  1. public/themes/{id}/{layout_folder}/ 에 1.png ~ N.png 배치
//  2. public/themes/{id}/thumbnail.png 배치 (썸네일)
//  3. 아래 THEMES 배열에 항목 추가
//
//  layouts 배열: 해당 테마가 지원하는 레이아웃 폴더명 목록
//  (config.js LAYOUTS 의 folder 값과 일치해야 합니다)
// ============================================================

export const THEMES = [
  {
    id: 'default',
    name: '기본',
    thumbnail: null,
    layouts: ['1_4', '2_3', '2_2_v', '1_3', '4_1', '3_1', '2_2_h'],
  },

  // ── 테마 추가 예시 ──────────────────────────────────────
  // {
  //   id: 'spring',
  //   name: '봄',
  //   thumbnail: '/themes/spring/thumbnail.png',
  //   layouts: ['1_4', '2_2'],
  // },
];

/**
 * 테마 + 레이아웃 + 슬롯 인덱스로 프레임 이미지 경로를 반환합니다.
 * 슬롯은 왼쪽 위부터 행 우선으로 1번 시작합니다.
 * 예) /themes/spring/1_4/1.png
 */
export function getFramePath(themeId, layoutFolder, slotIndex) {
  return `/themes/${themeId}/${layoutFolder}/${slotIndex + 1}.png`;
}

/**
 * 특정 레이아웃 폴더와 호환되는 테마 목록을 반환합니다.
 */
export function getThemesForLayout(layoutFolder) {
  return THEMES.filter((t) => t.layouts.includes(layoutFolder));
}
