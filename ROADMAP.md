# Photobooth — Roadmap & TODO

퍼블리시 전 완료해야 하는 작업과 추가 개발 제안 정리. 우선순위·난이도·담당 파일을 함께 표기해 혼자/다른 환경에서도 이어 작업하기 쉽도록 구성.

최근 상태 기준: 2026-04-21

---

## Legend

- 🔴 **Must** — 퍼블리시 블로커. 이거 없으면 출시 금지
- 🟡 **Should** — 퍼블리시 전 강력 권장. 사용자 경험에 직접 영향
- 🟢 **Nice** — 있으면 좋은 기능/개선
- ⏱ **Effort** — S(수 시간) / M(1-2일) / L(3일+)

---

## 1. 출시 블로커 (Must)

### 1.1 🔴 ADMIN_PASSWORD 하드코딩 제거 — ⏱ S
- **문제**: `src/config.js`의 `ADMIN_PASSWORD = '1234'`가 번들에 평문 노출됨. DevTools Sources에서 그대로 보임.
- **방향**:
  - `.env`의 `VITE_ADMIN_PASSWORD` 사용 (여전히 번들에 포함되므로 근본 해결은 아님)
  - 근본 해결: 비밀번호 해시만 프런트에 두고 비교 (SHA-256), 또는 서버측 검증 엔드포인트
  - 단기: env + 해시, 장기: 서버 인증
- **파일**: `src/config.js`, `src/components/StartScreen.jsx`, `.env.example` 신규

### 1.2 🔴 iOS Safari 카메라 권한 거부 UX — ⏱ S
- **문제**: `useCamera.js`에서 권한 실패 시 `alert()` 후 테마 화면 복귀. iOS는 권한 차단 뒤 안내 없으면 사용자가 설정 앱을 직접 열어야 함을 모름.
- **방향**: 차단 감지 시 "설정 → Safari → 카메라 허용" 가이드 모달 + iOS/Android 분기
- **파일**: `src/hooks/useCamera.js`, `src/components/CameraPermissionModal.jsx` 신규

### 1.3 🔴 iOS 저장/공유 분기 — ⏱ M
- **문제**: 현재 저장은 `<a download>` 트릭에 의존. iOS Safari는 download 속성 무시 → 사용자는 이미지를 길게 눌러 저장해야 함.
- **방향**:
  - Web Share API Level 2 (`navigator.canShare({files})`) 지원 시 share sheet 사용
  - 미지원 시 "길게 눌러 저장" 안내 모달
  - 비디오는 MP4 포맷 보장(MediaRecorder `video/mp4; codecs=h264` 우선) — iOS는 webm 저장 불가
- **파일**: `src/components/ResultScreen.jsx`, `src/hooks/useVideoRecorder.js`, `src/utils/save.js` 신규

### 1.4 🔴 IndexedDB 쿼터 초과 핸들링 — ⏱ S
- **문제**: 이미지 다수 업로드 시 quota exceeded 에러 가능. 현재 단순 `reject` 후 UX 없음.
- **방향**: `storeImage` try/catch → "저장 공간 부족" 모달 + 기존 에셋 삭제 유도
- **파일**: `src/utils/particleDB.js`, `src/components/ParticleEditor.jsx`

---

## 2. 퍼블리시 전 강력 권장 (Should)

### 2.1 🟡 React ErrorBoundary — ⏱ S
- 카메라/파티클 에러 시 앱 전체 블랙아웃 방지. 각 스크린 단위로 감싸 fallback UI 노출
- **파일**: `src/components/ErrorBoundary.jsx` 신규, `src/App.jsx`

### 2.2 🟡 키보드 접근성 — ⏱ M
- 현재 `<span onClick>` 으로 구현된 토글 → `<button>` 으로 변경, tab 이동 + Enter/Space 활성화 보장
- focus-visible 스타일 통일
- **파일**: 대부분 컴포넌트 일괄 수정 (토글, 카드)

### 2.3 🟡 저해상도 검증 (iPhone SE 375×667) — ⏱ S
- ArrangeScreen: 템플릿 + photoList + 액션 버튼이 동시 노출될 때 스크롤/오버플로 재점검
- Chrome DevTools 디바이스 모드로 전 플로우 워크스루
- **파일**: 검증만, 필요 시 스크린별 미디어쿼리 보정

### 2.4 🟡 로딩 스켈레톤 — ⏱ S
- 테마 썸네일, IndexedDB 파티클 이미지 로드 중 빈 화면/깜빡임 제거
- `<ThumbSkeleton />` 같은 공통 컴포넌트
- **파일**: `src/components/ThemeSelectScreen.jsx`, `src/components/ParticleEditor.jsx`

### 2.5 🟡 카메라 비디오 orientation — ⏱ M
- 가로 레이아웃(3×1, 2×2) 선택 시 촬영 미리보기 비율이 어색할 수 있음
- 모바일 세로 촬영 시 `getUserMedia` 제약으로 강제 orientation 검증
- **파일**: `src/hooks/useCamera.js`

### 2.6 🟡 Manual/Auto 모드 안내 — ⏱ S
- 커밋 `f2b894c`에서 언급된 "자동 모드 도중 버튼 눌러도 전환 안내" 추가
- Bug1 fix로 동작은 되지만 "지금 수동으로 바뀌었어요" 토스트로 피드백
- **파일**: `src/components/ShootingScreen.jsx`

---

## 3. Nice to have

### 3.1 🟢 i18n 준비 — ⏱ M
- 한국어 문자열 하드코딩 → `src/i18n/ko.json`, `en.json` 분리
- `useTranslation` 훅 또는 `react-i18next`
- 영어 버전 만들기 훨씬 쉬워짐

### 3.2 🟢 PWA + Service Worker — ⏱ M
- `vite-plugin-pwa`로 오프라인 캐시 + 홈스크린 설치
- 파티클/테마 이미지 캐싱 → 반복 방문 시 즉시 로드
- **파일**: `vite.config.js`, `public/manifest.json`

### 3.3 🟢 Analytics — ⏱ S
- 완료율 (촬영 시작 → 저장 완료), 레이아웃 선호도, 인기 파티클
- Plausible / Umami (프라이버시 친화) 권장
- **파일**: `src/utils/analytics.js`

### 3.4 🟢 에셋 Pre-warming — ⏱ S
- StartScreen에서 이미 테마 썸네일/파티클 이미지 프리로드 → LayoutSelect 전환 시 즉시 렌더
- **파일**: `src/App.jsx` 또는 루트 `useEffect`

---

## 4. 퍼블리시 이후 확장

### 4.1 Capacitor 래핑 — iOS/Android 네이티브 — ⏱ L
- 현 React 코드 그대로 네이티브 앱 빌드
- `#root` 내부만 webview에 렌더 (쉘/폴카닷 배경은 CSS 미디어쿼리로 자동 분기됨 — 모바일은 풀스크린)
- 카메라/저장은 Capacitor 플러그인으로 네이티브 API 호출
- **단계**:
  1. `npm i @capacitor/core @capacitor/cli && npx cap init`
  2. `npx cap add ios && npx cap add android`
  3. 카메라 플러그인 설치 + `useCamera` 훅 분기
  4. 파일 저장 플러그인 + iOS/Android share sheet 연동
- **필요 환경**: iOS는 Mac + Xcode, Android는 Android Studio. **웹 개발만 하는 환경에선 이 작업 생략 가능**

### 4.2 QR 코드 공유 — ⏱ S
- 결과 이미지를 서버 업로드 → URL → QR 코드 표시
- 이벤트 부스에서 참가자 핸드폰으로 쉽게 다운로드
- 서버: Cloudflare R2 / Supabase Storage / Firebase 등
- **파일**: `src/components/ResultScreen.jsx`, 백엔드 신규 필요

### 4.3 이벤트 모드 (상업용) — ⏱ L
- 관리자 페이지에 **이벤트 코드** 개념
- 특정 기간·특정 테마만 노출
- 촬영 수 카운터, 간단 통계 대시보드
- 행사장 키오스크 풀스크린 모드 (뒤로가기 차단, 자동 리셋)
- **파일**: `src/components/AdminScreen.jsx`, `src/hooks/useEventMode.js` 신규

### 4.4 파티클 시스템 고도화 — ⏱ M
- **멀티 레이어**: 한 번에 여러 파티클 동시 적용 (예: "나비 + 꽃잎")
- **프리셋 셋트**: 파티클 조합을 하나의 프리셋으로 저장
- 관리자에서 경로(베지어 곡선) 커스터마이징
- **파일**: `src/utils/particleSystem.js`, `src/components/ParticleEditor.jsx`

### 4.5 품질 / 테스트 — ⏱ L
- **Vitest**: 유닛 테스트 (훅, 유틸)
- **Playwright**: 핵심 플로우 E2E (카메라 모킹 필요)
- **Lighthouse CI**: 성능/접근성 회귀 방지
- **Sentry**: 런타임 에러 수집

---

## 5. 기술 부채 / 리팩토링

### 5.1 `default` 테마 네이밍 혼란
- 현재 `'default'`는 "이벤트용 별도 프레임"을 의미하지만, 영단어로는 "기본값"
- 한국어 UI에선 "이벤트 프레임" 또는 "공식 프레임"으로 별도 표기 고려

### 5.2 `src/utils/customParticle.js` 와 `particleSystem.js` 중복
- 두 파일에 각자 `Particle` 클래스. 공통 베이스 추출 가능
- 우선순위 낮음 (동작 OK)

### 5.3 상태 관리
- `App.jsx`에 촬영 상태 7개 useState. 플로우 복잡해지면 `useReducer` 또는 Zustand 고려

---

## 6. 작업 환경별 가능 여부

| 환경 | 웹 개발 | iOS 빌드 | Android 빌드 |
|---|---|---|---|
| Windows + Node + Git | ✅ | ❌ | ⚠ Android Studio 필요 |
| Mac + Node + Xcode | ✅ | ✅ | ⚠ Android Studio 필요 |
| Mac + Node + Xcode + Android Studio | ✅ | ✅ | ✅ |

→ **웹 전용 작업만 하는 환경에선 섹션 4.1 제외 모든 항목 가능**.
→ `npm install && npm run dev` 만 있으면 전 기능 개발/테스트 가능 (카메라는 `localhost` 또는 HTTPS 터널에서만 작동).

---

## 7. 우선순위 추천 순서

내일/이어서 작업 시 추천 순서:

1. **1.1 ADMIN_PASSWORD** — 30분, 빠른 보안 개선
2. **2.1 ErrorBoundary** — 1시간, 앱 안정성 크게 상승
3. **1.2 카메라 권한 가이드** — 반나절, iOS 사용자에게 치명적 이슈 해소
4. **2.4 로딩 스켈레톤** — 1시간, 체감 속도 개선
5. **1.3 iOS 저장/공유** — 1-2일, 출시 전 반드시
6. **1.4 IDB 쿼터 핸들링** — 30분
7. **2.2 키보드 접근성** — 반나절
8. **2.6 Manual/Auto 안내 토스트** — 30분

1–6 까지만 해도 퍼블리시 가능 수준. 7–8은 품질 향상.
