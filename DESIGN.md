# Photobooth — Design System

현재 photobooth 앱의 시각 디자인을 화면별·기능별로 정리한 레퍼런스. 새 컴포넌트 추가하거나 디자인 수정할 때 토큰·패턴을 일관되게 유지하기 위함.

기준: 2026-04-21 / 콘셉트: **Y2K Kawaii** (베이비 핑크 + 폴카닷 + ✦ 별 + 핫핑크 액센트)

---

## 1. Design Tokens

### 1.1 Color

| 토큰 | HEX | 용도 |
|---|---|---|
| `--bg-cream` | `#FFF5F9` | 모바일 본문 배경, 인풋 배경, 카메라 컨테이너 |
| `--bg-pink-50` | `#FFE4EE` | hover, 토글 OFF, panel 강조 |
| `--bg-pink-100` | `#FFD6E8` | 카드 보더, 구분선 |
| `--bg-pink-200` | `#FFB6C1` | 폴카닷, 스크롤바, 점선 보더 |
| `--accent-pink` | `#FF6B9D` | **Primary CTA**, 활성 보더, ✦ 강조, 토글 ON |
| `--accent-pink-hover` | `#ff8db8` | Primary 버튼 hover |
| `--accent-pink-active` | `#ff4d85` | Primary 버튼 pressed |
| `--accent-pink-shadow` | `#c94a77` | 3D 버튼 그림자 (offset shadow) |
| `--text-plum` | `#3D1C2E` | 본문 텍스트 |
| `--bg-plum-deep` | `#2A1220` | ShootingScreen 배경 (gradient 시작) |
| `--accent-yellow-bg` | `#FFF9E6` | 영상 합치기 버튼 배경 |
| `--accent-yellow` | `#FFE066` | 영상 버튼 보더 |
| `--accent-yellow-text` | `#7a5c00` | 영상 버튼 텍스트 |
| `--danger` | `#cc2222` ~ `rgba(255,80,80,…)` | 삭제 버튼 |

#### 투명도 변형 (`--text-plum` 기준)
- `rgba(61,28,46,0.65)` — secondary 텍스트
- `rgba(61,28,46,0.55)` — tertiary 텍스트 (sub, label)
- `rgba(61,28,46,0.45)` — disabled
- `rgba(61,28,46,0.35)` — hint
- `rgba(61,28,46,0.25)` — placeholder

> **현재 미흡**: CSS variable로 정의되지 않고 각 module css에 hex/rgba 하드코딩됨. **Phase 2 token 추출 권장**.

### 1.2 Typography

#### 글로벌 폰트 패밀리
```
'Helvetica Neue', 'Apple SD Gothic Neo', Arial, sans-serif
```

#### Root font-size (반응형)
| 뷰포트 | base |
|---|---|
| < 768px | 16px |
| 768-1279px | 17px |
| 1280-1599px | 18px |
| ≥ 1600px | 19px |

#### 타이포 스케일

| 역할 | size | weight | letter-spacing | 사용처 |
|---|---|---|---|---|
| Display | `clamp(2rem, 7vw, 4.5rem)` | 900 | 0.18em | StartScreen 타이틀 |
| H1 (screen title) | `clamp(1.1rem, 4vw, 1.8rem)` | 900 | 0.06–0.1em | 각 스크린 제목 |
| H2 (section) | `0.85rem` | 800 | 0.18em | "세로형/가로형" 레이블 |
| Body | `0.9–0.95rem` | — | 0.06–0.08em | sub 설명 |
| Body strong | `0.95–1rem` | 800 | 0.04–0.06em | 카드 라벨 |
| Caption | `0.78–0.85rem` | 700 | 0.03–0.08em | 서브 텍스트, meta |
| Micro | `0.65–0.7rem` | 700–800 | 0.1–0.2em | 뱃지, tag |
| Button | `0.8–0.95rem` | 800–900 | 0.05–0.1em | CTA |

### 1.3 Spacing

토큰 시스템 없음. 빈도 높은 값:

| 값 | 용도 |
|---|---|
| `4px` | 인접 텍스트 |
| `6–8px` | 인라인 그룹 (chip, badge) |
| `10–12px` | 카드 내부 행간, 버튼 group |
| `14–16px` | 컨테이너 내부 패딩 |
| `20–24px` | 화면 외곽 패딩 |
| `28–36px` | 데스크톱 외곽 패딩 |

> **현재 미흡**: 4의 배수 그리드 미준수 (예: `9px`, `13px` 등 산발). **표준화 권장**.

### 1.4 Border Radius

| 값 | 용도 |
|---|---|
| `4px` | 작은 cell, 작은 인풋 |
| `6–10px` | 슬롯 미리보기, 작은 카드 |
| `12–16px` | 일반 카드, 모달 인풋 |
| `18–22px` | 큰 카드, 미리보기 컨테이너 |
| `24–28px` | App Shell (데스크톱) |
| `36–40px` | App Shell (큰 데스크톱) |
| `100px` | Pill 버튼, 토글, chip, 뱃지 |

### 1.5 Border Width

| 값 | 용도 |
|---|---|
| `1px` | 미세 구분선 |
| `1.5px` | **표준 카드/버튼 보더** (가장 많이 사용) |
| `2px` | 카드 강조, App Shell ring |
| `1.5px dashed` | 업로드 영역, 비어있음 표시 |

### 1.6 Shadow / Elevation

#### Level 1 — Pill button 3D
```css
box-shadow: 0 3px 0 #c94a77;  /* 작은 버튼 */
box-shadow: 0 4px 0 #c94a77;  /* 중간 */
box-shadow: 0 6px 0 #c94a77, 0 10px 30px rgba(255,107,157,0.35);  /* 큰 START */
```

#### Level 2 — Card hover
```css
box-shadow: 0 4px 16px rgba(255,107,157,0.15);
box-shadow: 0 6px 20px rgba(255,107,157,0.22);
```

#### Level 3 — Preview / 큰 컨테이너
```css
box-shadow: 0 6px 0 #FFB6C1, 0 12px 40px rgba(255,107,157,0.18);
```

#### Level 4 — App Shell (데스크톱)
```css
box-shadow:
  0 0 0 1px rgba(255,255,255,0.9),
  0 0 0 3px #FFD6E8,
  0 30px 80px rgba(255,107,157,0.22),
  0 60px 140px rgba(61,28,46,0.14);
```

#### Level 5 — 카메라 컨테이너 (ShootingScreen)
```css
box-shadow:
  0 0 0 2px #FF6B9D,
  0 0 0 6px rgba(255,107,157,0.18),
  0 20px 60px rgba(255,107,157,0.35),
  0 40px 100px rgba(0,0,0,0.3);
```

### 1.7 Background Patterns

#### 폴카닷 (모든 화면 공통)
```css
background-color: #fff;
background-image: radial-gradient(circle, #FFB6C1 1.5px, transparent 1.5px);
background-size: 22px 22px;
```

#### 데스크톱 App Shell 외부 (body)
```css
background:
  radial-gradient(ellipse at 15% 20%, rgba(255,182,193,0.45), transparent 45%),
  radial-gradient(ellipse at 85% 80%, rgba(255,214,232,0.55), transparent 50%),
  radial-gradient(circle, rgba(255,182,193,0.55) 1.2px, transparent 1.2px) 0 0 / 28px 28px,
  linear-gradient(135deg, #FFF0F6 0%, #FFE4EE 100%);
```

#### ShootingScreen 배경 (다크 모드)
```css
background:
  radial-gradient(ellipse at 18% 18%, rgba(255,107,157,0.18), transparent 55%),
  radial-gradient(ellipse at 82% 82%, rgba(255,182,193,0.14), transparent 55%),
  radial-gradient(circle, rgba(255,182,193,0.1) 1px, transparent 1px) 0 0 / 26px 26px,
  linear-gradient(135deg, #2A1220 0%, #3D1C2E 55%, #2A1220 100%);
```

### 1.8 Motion

| 토큰 | duration | easing | 사용처 |
|---|---|---|---|
| micro | `0.1s` | `ease` | 클릭 scale |
| fast | `0.15s` | `ease` | hover 색상 전환 |
| medium | `0.2–0.3s` | `ease`, `cubic-bezier` | 토글 thumb, fadeIn |
| slow | `2–3s` | `ease-in-out infinite` | 트윙클(✦) 애니메이션 |

#### 표준 키프레임
```css
@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
  50%      { opacity: 0.5; transform: scale(1.3) rotate(20deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes popIn {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}
```

---

## 2. Components

### 2.1 Button — Primary (Pink Pill)

CTA에 사용. 3D 그림자로 입체감.

```css
padding: 9–16px / 22–64px;
background: #FF6B9D;
border-radius: 100px;
color: #fff;
font-weight: 800–900;
letter-spacing: 0.05–0.25em;
box-shadow: 0 3–6px 0 #c94a77;

:hover  { background: #ff8db8; }
:active { transform: translateY(1–2px); box-shadow: 0 1–2px 0 #c94a77; }
```

**변형**: `START`(특대), `저장/확인`(중), `+ 추가`(소)

### 2.2 Button — Secondary / Ghost

```css
padding: 7–13px / 14–22px;
background: rgba(255,255,255,0.7–0.85) | transparent;
border: 1.5px solid #FFD6E8;
border-radius: 100px;
color: rgba(61,28,46,0.5–0.65);
font-weight: 700;

:hover { border-color: #FF6B9D; color: #FF6B9D; background: #fff; }
```

**변형**: 뒤로가기(`backBtn`), 취소(`btnCancel`), 다시찍기(`btnRetake`)

### 2.3 Button — Tertiary / Yellow (영상)

```css
background: #FFF9E6;
color: #7a5c00;
border: 1.5px solid #FFE066;
:hover { background: #FFF0B3; }
```

### 2.4 Card

화면 내 선택 가능 항목.

```css
background: rgba(255,255,255,0.85);
border: 2px solid #FFD6E8;
border-radius: 14–22px;
padding: 12–26px;
backdrop-filter: blur(4px);
transition: border-color 0.15s, background 0.15s, transform 0.1s;

:hover  { border-color: #FF6B9D; background: #fff; box-shadow: 0 4–6px 16–20px rgba(255,107,157,0.15–0.22); }
:active { transform: scale(0.96); }
:focus-visible { border-color: #FF6B9D; }
```

**상태 — selected (Arrange photoItem)**:
```css
border-color: #FF6B9D;
box-shadow: 0 0 0 2px rgba(255,107,157,0.3);
.thumb { opacity: 0.45; filter: saturate(0.5); }
```

### 2.5 Input

```css
background: #FFF5F9;
border: 1.5px solid #FFD6E8;
border-radius: 10px;
padding: 9–10px / 12–14px;
color: #3D1C2E;

:focus { border-color: #FF6B9D; outline: none; }
::placeholder { color: rgba(61,28,46,0.25–0.3); }

[error] { border-color: #ff4d4d; }
```

### 2.6 Toggle (Pill Switch)

```css
/* track */
width: 36–40px; height: 20–22px;
background: #FFE4EE;  /* OFF */
background: #FF6B9D;  /* ON  */
border-radius: 100px;

/* thumb */
width: 16–18px; height: 16–18px;
background: #fff;
box-shadow: 0 1–2px 3–4px rgba(255,107,157,0.3);
transition: transform 0.2s;

[ON] thumb { transform: translateX(16–18px); }
```

### 2.7 Chip / Tag (Effect, Filter)

```css
padding: 6–7px / 13–14px;
background: rgba(255,255,255,0.08–0.12);  /* 다크 컨텍스트 */
border: 1.5px solid rgba(255,255,255,0.12);
border-radius: 100px;
font-size: 0.72–0.75rem;
font-weight: 700;

[active] {
  background: rgba(255,107,157,0.3);
  border-color: rgba(255,107,157,0.6);
  color: #ff9ec8;
}
```

### 2.8 Badge

작은 정보 표시 (촬영 카운트, 라벨).

```css
padding: 3–4px / 10–12px;
border: 1px solid rgba(...,0.25–0.6);
border-radius: 100px;
font-size: 0.7–0.75rem;
font-weight: 800;
letter-spacing: 0.1–0.12em;
```

**변형**:
- 슬롯 카운트: 핫핑크 배경
- 레이아웃 표시: 핑크 outline
- 영상 뱃지: 노랑 톤

### 2.9 Slider (Range)

```css
accent-color: #FF6B9D;
cursor: pointer;
```

값 표시는 `<span class="val">` 으로 핫핑크 (`color: #FF6B9D; font-weight: 900;`)

### 2.10 Modal

```css
/* backdrop */
position: fixed; inset: 0;
background: rgba(61,28,46,0.35);
backdrop-filter: blur(6–8px);
z-index: 100;

/* card */
background: #fff;
border: 2px solid #FFB6C1;
border-radius: 20–24px;
padding: 28px;
width: min(320–340px, 90vw);
box-shadow: 0 8px 40px rgba(255,107,157,0.2);
```

### 2.11 ✦ Twinkle Decoration

타이틀이나 코너에 사용하는 별 장식.

```css
::before { content: '✦'; color: #FF6B9D; font-size: 0.5–0.7em; animation: twinkle 2s ease-in-out infinite; }
::after  { content: '✦'; color: #FFB6C1; font-size: 0.4–0.5em; animation: twinkle 2.5s ease-in-out infinite 0.8s; }
```

### 2.12 Section Divider (구분선 + 라벨)

LayoutSelectScreen "세로형/가로형" 표기.
```css
text-align: center;
::before, ::after { content: ''; display: inline-block; width: 28px; height: 1px; background: #FFD6E8; margin: 0 10px; }
```

---

## 3. Layout System

### 3.1 App Shell (모바일 vs 데스크톱)

| 뷰포트 | 동작 |
|---|---|
| `< 768px` | 풀스크린 (모바일/iOS/Android WebView 호환) |
| `≥ 768px` | 중앙 랜드스케이프 윈도우 (1080×820) |
| `≥ 1280px` | 1280×920 |
| `≥ 1600px` | 1440×1020 |

데스크톱은 body에 폴카닷+그라디언트 배경 + 워드마크/태그라인을 띄우고, `#root`에 ring 보더 + 다층 그림자로 "데스크톱 앱 윈도우" 느낌.

### 3.2 Screen Wrapper (공통)

```css
position: absolute; inset: 0;
display: flex; flex-direction: column;
background: 폴카닷 패턴 (또는 ShootingScreen 다크 그라디언트);
overflow: hidden;
```

### 3.3 그리드 패턴

| 패턴 | 사용처 |
|---|---|
| `flex-wrap + justify-content: center` (고정폭 카드) | LayoutSelect |
| `grid auto-fill minmax(N, 1fr)` | ThemeSelect, Arrange photoList |
| `grid 2cols` | ParticleEditor animType |

---

## 4. 화면별 구성요소

### 4.1 StartScreen
```
┌─────────────────────┐
│                     │
│  ✦ PHOTO BOOTH ✦   │  ← Display title (핫핑크 그림자)
│                     │
│  ┌──────────────┐  │
│  │  START  ★   │  │  ← Primary pill (특대)
│  └──────────────┘  │
│                     │
│                  ⚙  │  ← Admin button (우하단)
└─────────────────────┘
```
- 폰트: 가장 큰 display, 별 트윙클 장식
- 비밀번호 모달 트리거 → 흰 카드 + 핑크 보더

### 4.2 LayoutSelectScreen
```
┌─────────────────────┐
│      레이아웃 선택      │  ← H1 + ✦
│   원하는 사진 배치를…   │
│                     │
│  ─── 세로형 ───      │  ← Section divider (centered)
│  [card][card][...]  │  ← flex wrap center
│                     │
│  ─── 가로형 ───      │
│  [card][card]       │
└─────────────────────┘
```
- 카드: 108–150px wide, 프리뷰 그리드 + label("1 × 4") + sub("4컷")

### 4.3 ThemeSelectScreen
```
[← 뒤로]
   ✦ 테마 선택 ✦
원하는 테마를 선택하세요

[card] [card] [card]   ← grid auto-fill 160–180px
[card] [card] [card]
```
- 카드: 썸네일(90–120px) + 라벨

### 4.4 ShootingScreen ⚠ (다크 톤)
```
┌──────────[다크 플럼 + 폴카닷 + 글로우]──────────┐
│  ✦                                            │
│      슬롯 1/6  [2×3]  [1번째 촬영]              │
│                                                │
│      ┌─[핑크 ring + glow]─┐                   │
│      │   카메라 + 프레임    │  ← 컨테이너 핑크 ring │
│      │   (overlay canvas)  │                   │
│      └─────────────────────┘                   │
│                                                │
│   [필터]  [●]  [자동][OFF][효과]                │
│           shutter                              │
│                                            ✦   │
└────────────────────────────────────────────────┘
```
- **유일한 다크 화면**. 카메라 포커스 위해 플럼 배경, 컨테이너만 핑크 링
- 효과 패널: 다크 chip 형태 (브랜드 톤과 의도적 대비)
- 셔터: 흰 원 + AUTO 배지

### 4.5 ArrangeScreen
```
   ✦ 사진 배치
사진을 클릭해 배치하세요

[─── 템플릿 그리드 ───]   ← 핑크 보더 박스
[ slot ] [ slot ]
[ slot ] [ slot ]

──────────────────       ← divider
[썸네일][썸네일][썸네일]    ← grid 100–130px
[썸네일][썸네일][썸네일]

[다시찍기] [확인]
```
- 선택된 썸네일: 핑크 보더 + dim/saturate

### 4.6 ResultScreen
```
   ✦ COMPLETED
┌──────────────────┐
│   합쳐진 결과 사진   │  ← preview (rounded + 핑크 그림자)
└──────────────────┘
[저장] [영상저장] [영상합치기] [다시찍기]
```
- 영상 합치기 로딩 모달: 광고 placeholder + progress bar

### 4.7 AdminScreen
```
[← 뒤로]  ✦ 파티클 관리

[설명 카드: 회색 톤 안내]

[+ 새 에셋 만들기]

[─ 카드: 이름 / meta + 토글 + 수정 + 삭제 ─]
[─ 카드: ... ─]
```
- 우측 액션 영역: 노출 토글, 수정 버튼, 삭제 버튼(붉은 톤)

### 4.8 ParticleEditor (모달성)
```
✦ 새 파티클 에셋

[ 폼 (왼쪽) ]              [ 미리보기 (오른쪽) ]
이름 [______]              ┌────────┐
이미지 (3개)                │ canvas │
[+ 이미지 추가]              │ live   │
[stamp][stamp][stamp]      └────────┘
애니메이션 [grid 2col]
속도 ──◯──── 1.0×
개수 ──◯──── 20개
크기 ──◯──── 1.0×
[표시 ON]

           [취소] [저장]
```
- **스탬프 인터랙션**: 클릭 → 선택(3초) → 큰 "삭제" 버튼 오버레이

### 4.9 FilterBar ⚠ (다크 톤)
```
┌─[다크 패널]──────[×]┐
│ [Pre1][Pre2][...]   │  ← 가로 스크롤 chips
│ Brt ──◯── 50        │  ← 슬라이더
│ Sat ──◯── 50        │
└─────────────────────┘
```
- ShootingScreen 위에 떠 있는 다크 패널 (`rgba(10,10,10,0.96)`)

### 4.10 StampLayer (드래그 가능 스탬프) ⚠
```
[stamp] ← 드래그
   [×]  ← hover 시
[+ 스탬프] ← 좌하단 트리거
```
- 현재 다크 톤 (`rgba(0,0,0,0.65)`), **브랜드 톤과 불일치**

---

## 5. 일관성 감사 (Audit)

### 5.1 Naming
| 이슈 | 위치 | 권장 |
|---|---|---|
| `wrapper` vs `container` 혼용 | 각 module | `wrapper` 통일 (대부분 이미 wrapper) |
| `btnSave` / `btnConfirm` / `submit` 혼용 | Result, Arrange, ParticleEditor | 컴포넌트별 의미는 다름 — 유지 OK |
| `imgRemove` (작은 ×) vs `imgRemoveBig` (탭 후) | ParticleEditor | OK |

### 5.2 Token 이탈
| 카테고리 | 발견된 이탈 |
|---|---|
| 색상 hex 하드코딩 | 모든 module css. CSS variable 미사용 |
| Spacing 비표준 | `9px`, `13px`, `7px` 등 산발 |
| Font-size rem 외 px | StampLayer `font-size: 52px`, FilterBar 대체로 rem OK |

### 5.3 톤 일관성
| 컴포넌트 | 톤 | 의도 | 평가 |
|---|---|---|---|
| Start/Layout/Theme/Arrange/Result/Admin/ParticleEditor | 라이트 (브랜드) | 핑크 폴카닷 | ✅ 일관 |
| ShootingScreen | 다크 (플럼+핑크 글로우) | 카메라 포커스 | ✅ 의도적 |
| **FilterBar** | 다크 (순검정) | ShootingScreen 위 | ⚠ 브랜드 글로우 톤으로 통일 권장 |
| **StampLayer** | 다크 (순검정) | 미상 | 🔴 라이트 톤으로 이전 필요 |

### 5.4 접근성
| 이슈 | 영향 |
|---|---|
| 토글이 `<span>` 으로 구현 | 키보드 접근 불가 (Tab 이동 X) |
| `:focus-visible` 일부 카드만 적용 | 키보드 사용자 위치 추적 어려움 |
| 색상 대비 — `rgba(61,28,46,0.25–0.35)` placeholder | WCAG AA 미달 가능 (0.45 이상 권장) |
| 터치 타겟 — 16×16 × 버튼 (개선 완료) | 개선 후 OK |

---

## 6. 컴포넌트 완성도 점수

| 컴포넌트 | 변형 | 상태(hover/active/disabled) | 접근성 | 점수 |
|---|---|---|---|---|
| Primary Button | ✅ | ✅ | ⚠ focus-visible | 8/10 |
| Secondary Button | ✅ | ✅ | ⚠ focus-visible | 7/10 |
| Card | ✅ | ✅ | ⚠ focus-visible | 7/10 |
| Input | ⚠ (사이즈 1종) | ✅ | ✅ | 8/10 |
| Toggle | ❌ (1종) | ✅ | ❌ (`<span>`) | 5/10 |
| Chip | ✅ | ✅ | ❌ | 6/10 |
| Modal | ❌ (1종) | ✅ | ⚠ (focus trap 없음) | 6/10 |
| Slider | ❌ | ✅ | ✅ (native) | 7/10 |
| Badge | ✅ | — | — | 8/10 |

---

## 7. 우선 정리 액션

다음 디자인 작업 시 추천 순서:

1. **🔴 CSS Variable 추출** — 위 토큰을 `:root`에 변수화. 향후 다크모드/테마 분기 가능
2. **🔴 StampLayer / FilterBar 톤 통일** — 다크 → 핑크-틴티드 다크 (#2A1220 베이스)
3. **🟡 Toggle 컴포넌트화** — `<button role="switch">` 으로 재구현, 키보드 접근
4. **🟡 Spacing 4px 그리드 표준화** — 9/13/7px 등 비표준값 정리
5. **🟡 Modal 공통 컴포넌트** — focus trap + esc 닫기 + 동일 visual
6. **🟢 Skeleton 패턴 정의** — 로딩 placeholder 시각 토큰
7. **🟢 Empty state 패턴 정의** — `✦` + 안내 문구 표준 레이아웃

---

## 8. 참고

- `ROADMAP.md` — 출시 전 TODO (디자인 외 기능/접근성 포함)
- 디자인 콘셉트: Y2K Kawaii — 베이비 핑크, 폴카닷, 별, 핫핑크 액센트
- 모바일 우선: `<768px` CSS는 iOS/Android WebView에서 그대로 동작
