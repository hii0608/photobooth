// ============================================================
//  PHOTOBOOTH CONFIGURATION
//  프레임 이미지 경로 및 크로마키 설정을 여기서 관리합니다.
//  - src 값을 Base64 data-URI 문자열로 교체하면 외부 파일 없이 동작합니다.
//  - 운영자가 배포 시 이 파일만 수정하면 됩니다.
// ============================================================

export const FRAMES = [
  { id: 1, src: '/frames/그린스크린_1.png', label: 'Shot 1' },
  { id: 2, src: '/frames/그린스크린_2.png', label: 'Shot 2' },
  { id: 3, src: '/frames/그린스크린_3.png', label: 'Shot 3' },
  { id: 4, src: '/frames/그린스크린_4.png', label: 'Shot 4' },
];

// 크로마키 타겟 색상 (#00C500)
export const CHROMA_COLOR = { r: 0, g: 197, b: 0 };

// 색상 거리 허용 범위 (0 ~ 441). 값이 클수록 넓은 범위의 초록을 제거
export const CHROMA_THRESHOLD = 55;

// 카운트다운 시작 숫자
export const COUNTDOWN_FROM = 3;

// ============================================================
//  LAYOUTS — 운영자가 원하는 레이아웃만 남기거나 추가할 수 있습니다.
//
//  cols  : 결과 이미지의 가로 칸 수
//  rows  : 결과 이미지의 세로 칸 수
//  total : 촬영 횟수 (= cols × rows, 또는 커스텀 값)
//
//  total ≤ FRAMES 배열 길이여야 합니다.
// ============================================================
export const LAYOUTS = [
  { id: '2x2', label: '2 × 2', cols: 2, rows: 2, total: 4 },
  { id: '1x4', label: '1 × 4', cols: 1, rows: 4, total: 4 },
  { id: '4x1', label: '4 × 1', cols: 4, rows: 1, total: 4 },
  { id: '3x1', label: '3 × 1', cols: 3, rows: 1, total: 3 },
];
