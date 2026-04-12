# Photobooth Project Documentation & Session Handoff

본 문서는 현재 프로젝트의 아키텍처와 주요 기능을 정리하여, 다음 개발 세션에서 즉시 작업을 이어갈 수 있도록 돕기 위해 작성되었습니다.

## 1. 프로젝트 개요 (Overview)
React + Vite 기반의 웹 포토부스 애플리케이션입니다. 레이아웃 선택, 테마 적용, 필터 및 스탬프 커스텀, 영상 녹화 및 합성 기능을 제공합니다.

## 2. 주요 화면 흐름 (Flow)
1.  **StartScreen**: 시작 화면.
2.  **LayoutSelectScreen**: 템플릿(컷 수, 행/열) 선택.
3.  **ThemeSelectScreen**: 프레임 디자인(테마) 선택.
4.  **ShootingScreen**: 실제 촬영 및 5초 내외의 클립 영상 녹화.
5.  **ArrangeScreen**: 촬영된 사진들 중 템플릿의 각 슬롯에 넣을 사진 선택.
6.  **ResultScreen**: 최종 결과물 확인, 좌우 반전, 스탬프 추가, 이미지/영상 저장.

## 3. 주요 업데이트 사항 (Core Updates)
-   **자동 촬영 (Auto-Shooting)**: 한 번의 클릭으로 모든 컷을 연속 촬영하는 기능. (기본 활성)
-   **동적 효과 (Particle System)**: 금붕어, 벚꽃, 눈, 낙엽, 버블 등이 화면을 유영하는 실시간 애니메이션 효과 구현. (사진 캡처 시 함께 저장됨)
-   **전면 플래시 (Screen Flash)**: 흰색, 노란색, 초록색 화면 광원으로 셀피 조명 효과 연출.
-   **반응형 레이아웃 (Constraint UI)**: 사진 선택 및 결과 화면이 기기 높이에 맞춰 유동적으로 조절되도록 최적화.
-   **레이아웃 디버그 모드**: UI 컨테이너 경계를 시각적으로 확인할 수 있는 가이드 모드 추가.
-   **영상 저장 최적화**: 저장되는 영상 클립들을 기본적으로 좌우 반전(Mirror) 처리하여 실제 거울을 보는 듯한 자연스러운 결과물 제공.
-   **영상 저장 로딩 오버레이**: 영상 합치기 진행 시 진행률 바(Progress Bar)와 광고 노출용 공간이 포함된 전면 오버레이 구현.
-   **UI 텍스트 변경**: 최종 결과 화면의 '전체 저장' 버튼 명칭을 '저장하기'로 변경하여 직관성 개선.

## 4. 디버그 모드 사용법 (How to Debug Layout)
UI가 화면 높이에 맞게 잘 유지되는지 확인하려면 다음 파일 상단의 `DEBUG_LAYOUT` 상수를 `true`로 변경하세요.
-   `src/components/ArrangeScreen.jsx`
-   `src/components/ResultScreen.jsx`

## 5. 핵심 파일 및 아키텍처 (Core Architecture)
-   **`src/App.jsx`**: 전체 상태 관리 및 화면 전환 컨트롤러.
-   **`src/utils/particleSystem.js`**: 파티클 엔진 (금붕어 등 애니메이션 로직).
-   **`src/components/ShootingScreen.jsx`**: 촬영, 자동화, 플래시, 효과 통합 제어.
-   **`src/hooks/useVideoRecorder.js`**: 영상 클립 녹화 처리.
-   **`src/utils/videoMerge.js`**: 개별 영상 클립 병합 유틸리티.

## 6. 향후 과제 (Next Steps)
-   **템플릿 프리뷰/메이커 페이지 구축 (내일 예정)**: 사용자가 로컬 사진을 업로드하여 선택한 레이아웃과 테마에 어떻게 조합되는지 미리 확인하고 다운로드할 수 있는 전용 도구 페이지 제작.
-   **에셋 이미지 교체**: 현재 이모지(🐠)나 도형으로 되어 있는 파티클 효과를 실제 PNG 스프라이트로 교체.
-   **프레임 투명도 수정**: `public/themes/template/` 내 격자무늬(체크보드) PNG들을 실제 투명한 에셋으로 교환.
-   **스탬프 확장**: 이모지 외에 사용자 정의 이미지 스탬프 기능 추가.

---

## 7. GitHub Commit Message (권장)

```text
feat: implement auto-shooting, particle effects, and debug layout

- Add auto-shooting mode to complete all takes with a single shutter click
- Implement real-time particle system (Goldfish, Cherry, Snow, Leaf, Bubble)
- Integrate particle effects into final photo capture
- Add DEBUG_LAYOUT mode to visualize UI constraints in Arrange/Result screens
- Improve bottom control bar UI with side-button grouping
- Fix CSS syntax errors and improve mobile responsiveness
```