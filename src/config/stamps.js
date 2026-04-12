// ============================================================
//  STAMP CONFIGURATION
//  스탬프(스티커) 목록을 정의합니다.
//
//  type: 'emoji' — 이모지 텍스트를 canvas에 직접 렌더링
//  type: 'image' — public/stamps/ 폴더의 PNG 이미지 사용
// ============================================================

export const STAMPS = [
  // 이모지 스탬프 (외부 파일 불필요)
  { id: 's1',  type: 'emoji', value: '⭐', label: '별' },
  { id: 's2',  type: 'emoji', value: '🌸', label: '꽃' },
  { id: 's3',  type: 'emoji', value: '💖', label: '하트' },
  { id: 's4',  type: 'emoji', value: '✨', label: '반짝' },
  { id: 's5',  type: 'emoji', value: '🎀', label: '리본' },
  { id: 's6',  type: 'emoji', value: '🦋', label: '나비' },
  { id: 's7',  type: 'emoji', value: '🌈', label: '무지개' },
  { id: 's8',  type: 'emoji', value: '🍀', label: '클로버' },
  { id: 's9',  type: 'emoji', value: '🎵', label: '음표' },
  { id: 's10', type: 'emoji', value: '🔥', label: '불꽃' },
  { id: 's11', type: 'emoji', value: '💫', label: '별빛' },
  { id: 's12', type: 'emoji', value: '🎉', label: '파티' },

  // PNG 스탬프 예시 (public/stamps/ 에 파일 추가 시 활성화)
  // { id: 'img1', type: 'image', src: '/stamps/frame1.png', label: '프레임1' },
];
