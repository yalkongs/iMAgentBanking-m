# DESIGN.md — zb-m Design System

> 이 파일은 zb-m의 디자인 시스템 소스입니다. 새 컴포넌트 구현 전에 반드시 참조하세요.

## 철학

**APP UI 분류** (마케팅/랜딩 아님). 원칙:
- 차분한 다크 배경, 강한 타이포, 최소 크롬
- 카드는 인터랙션이 카드일 때만 사용
- 이모지 디자인 요소 금지 (SVG 아이콘 사용)
- 각 섹션/화면은 한 가지 일만 함

---

## 색상 토큰

```css
/* 배경 레이어 (깊이 순서) */
--bg-primary:   #0D0F1A   /* 앱 전체 배경 */
--bg-secondary: #141627   /* 헤더, 사이드바 */
--bg-tertiary:  #1C1F35   /* 호버 상태, 구분 영역 */
--bg-card:      #1E2138   /* 카드, 드롭다운 */
--bg-input:     #252846   /* 입력창 */

/* 액센트 (iM뱅크 그린) */
--accent:        #00C9A7
--accent-hover:  #00A88A
--accent-dim:    rgba(0, 201, 167, 0.15)
--accent-border: rgba(0, 201, 167, 0.3)

/* 텍스트 */
--text-primary:   #F1F5F9   /* 본문 */
--text-secondary: #94A3B8   /* 서브텍스트, 레이블 */
--text-muted:     #64748B   /* 힌트, placeholder */

/* 시맨틱 */
--success: #34D399   --success-dim: rgba(52, 211, 153, 0.15)
--error:   #F87171   --error-dim:   rgba(248, 113, 113, 0.15)
--warning: #FBBF24   --warning-dim: rgba(251, 191, 36, 0.15)

/* 구분선 */
--border: rgba(255, 255, 255, 0.07)
```

### 계좌 타입 컬러
```js
checking:            #3B82F6  // 입출금 — 블루
installment_savings: #10B981  // 정기적금 — 그린
term_deposit:        #8B5CF6  // 정기예금 — 퍼플
savings:             #F59E0B  // 비상금 — 앰버
cma:                 #EF4444  // CMA — 레드
```

---

## 타이포그래피

**폰트**: `Pretendard` (한국어 최적화) → `-apple-system` → `sans-serif` 폴백

| 용도 | 크기 | 굵기 | 색상 |
|------|------|------|------|
| 화면 제목 | 17px | 600 | text-primary |
| 계좌명 / 항목명 | 14–15px | 600 | text-primary |
| 본문 / 메시지 | 14px | 400 | text-primary |
| 서브텍스트 | 12–13px | 400 | text-secondary |
| 힌트 / 뮤트 | 11–12px | 400 | text-muted |
| 금액 (강조) | 14–16px | 600 | text-primary |
| 모노 (계좌번호) | 13px | 400 | font-mono |

Letter-spacing: 제목 `-0.3px`, 본문 기본값.

---

## 간격 & 반경

```css
/* Border Radius */
--radius-sm: 8px    /* 버튼, 작은 UI 요소 */
--radius-md: 12px   /* 거래 버블, 입력창 */
--radius-lg: 16px   /* AI 버블, 카드 */
--radius-xl: 24px   /* 모달, 온보딩 오버레이 버튼 */

/* 패딩 기준 */
화면 좌우 패딩: 16px (+ env(safe-area-inset))
헤더 패딩: 16px 20px
카드 패딩: 12–16px
```

---

## 계좌 아바타 SVG 아이콘

이모지 금지. 타입별 SVG 인라인 아이콘 사용.

```
배경: 타입 컬러 원 (width/height: 44px, border-radius: 50%)
아이콘: 흰색 SVG, 24×24px, 중앙 정렬
```

| 타입 | SVG 아이콘 | path 요약 |
|------|-----------|----------|
| checking | 카드 (credit-card) | rect + 2 lines |
| installment_savings | 저금통 (piggy-bank) | 돼지 실루엣 또는 코인 |
| term_deposit | 상승 화살표 (trending-up) | polyline |
| savings | 방패 (shield) | path |
| cma | 파이차트 (pie-chart) | circle + path |

구현 위치: `AccountListScreen.jsx`, `AccountRoom.jsx`의 `TYPE_CONFIG.icon` 필드를 SVG JSX로 교체.

---

## 컴포넌트 스펙

### 탭 바 (AccountRoom — Pass 1B 결정)

```
높이: 40px
배경: var(--bg-secondary)
border-bottom: 1px solid var(--border)

탭 아이템:
  - 비활성: color var(--text-muted), font-size 13px, font-weight 500
  - 활성: color var(--accent), font-weight 600
  - 활성 인디케이터: 하단 2px solid var(--accent), border-radius 1px
  - 터치 타겟: min-height 44px (탭 바 전체 높이 포함)

탭 전환: CSS display toggle (애니메이션 없음 — 데이터 캐시됨)
```

### 온보딩 오버레이 (Pass 3A 결정)

```
레이아웃: 풀스크린 fixed, z-index 1000
배경: rgba(0, 0, 0, 0.88)
backdrop-filter: blur(8px)

콘텐츠 컨테이너:
  - 중앙 정렬 (flex column, justify-content: center)
  - 패딩: 32px 24px
  - max-width: 360px

요소:
  - 로고: /imbank-mark.png, height 48px, margin-bottom 24px
  - 헤드라인: 22px, font-weight 700, text-primary, margin-bottom 8px
  - 서브: 14px, text-secondary, margin-bottom 32px
  - 기능 목록: 각 항목 16px 패딩, gap 12px (SVG 아이콘 + 텍스트)
  - CTA 버튼: 전체 너비, height 52px, border-radius var(--radius-xl),
              background var(--accent), color #000, font-weight 700, font-size 16px
              margin-top 32px

트리거: localStorage 'zb-m-onboarded' 키 없을 때
닫힘: CTA 탭 → localStorage.setItem('zb-m-onboarded', '1') → fade out (opacity 0, 0.3s)
리셋 연동: handleReset() 시 localStorage.removeItem('zb-m-onboarded')
```

### 거래 버블

```
모두 오른쪽 정렬 (입금/출금 방향 동일)
border-radius: var(--radius-md) = 12px
입금: background var(--success-dim), border 1px solid var(--success)
출금: background var(--bg-card), border 1px solid var(--border)
패딩: 8px 12px
```

### AI 버블

```
왼쪽 정렬, 전체 너비
border-radius: var(--radius-lg) = 16px
background: var(--bg-tertiary)
아이콘: /imbank-mark.png, 24×24px 원형
```

### 터치 타겟

모든 인터랙티브 요소 최소 `min-height: 44px`, `min-width: 44px` (iOS HIG).
해당 요소: `.room-back-btn`, `.room-send-btn`, `.copy-btn`, `.room-header`, 탭 아이템.

---

## 반응형

앱 최대 너비: `min(100%, 480px)` — 모바일 전용.
데스크탑에서는 중앙 정렬된 모바일 뷰 표시.
별도 데스크탑 레이아웃 없음 (의도적).

---

## 헤더 패턴

```
background: rgba(20, 22, 39, 0.72)
backdrop-filter: blur(16px)
border-bottom: 1px solid var(--border)
```

모든 화면 헤더 동일 패턴 적용 (AccountListScreen, AccountRoom 포함).

---

*마지막 업데이트: 2026-03-27 (plan-design-review 기반 추출)*
