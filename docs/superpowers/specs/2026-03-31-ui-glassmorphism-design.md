# UI Glassmorphism 전면 개편

**날짜:** 2026-03-31
**대상:** iM뱅크 임원 데모 + 일반 사용자
**범위:** 전체 앱 (AccountListScreen, AccountRoom, 모든 카드 컴포넌트, styles.css)

---

## 문제

현재 UI의 카드와 배경이 단색 계열(#1E2138)로만 처리되어 시각적 깊이감과 품질이 낮다. 아이콘과 enclosure의 크기·반경 관계가 고려되지 않아 레이아웃이 답답해 보인다.

---

## 목표

- 전체 앱에 Bold Glassmorphism 스타일을 적용한다.
- 각 컴포넌트의 레이어 깊이감을 명확히 분리한다.
- 계좌 타입 정체성(컬러)을 화면 전체에 일관되게 전달한다.

---

## 접근법: 하이브리드

1. **공통 레이어**: `styles.css`에 `--glass-*` 토큰 추가, 앱 배경 강화
2. **고임팩트 컴포넌트**: AccountListScreen 아이템, AccountRoom 헤더·라이프카드를 Bold로 재설계
3. **나머지 카드**: 공통 토큰으로 자동 업그레이드

---

## CSS 토큰 추가 (styles.css)

```css
/* ── Glass Layer Tokens ── */
--glass-bg:      linear-gradient(135deg, rgba(28,31,53,0.88) 0%, rgba(14,16,34,0.92) 100%);
--glass-border:  rgba(255, 255, 255, 0.09);
--glass-inset:   inset 0 1px 0 rgba(255, 255, 255, 0.06);
--glass-shadow:  0 8px 24px rgba(0, 0, 0, 0.4);
--glass-blur:    blur(16px);
--glass-line:    linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
```

앱 배경 (`body` / `.app`):
```css
background:
  radial-gradient(ellipse 60% 50% at 20% 20%, rgba(0,201,167,0.12) 0%, transparent 60%),
  radial-gradient(ellipse 50% 60% at 80% 70%, rgba(59,130,246,0.10) 0%, transparent 60%),
  radial-gradient(ellipse 40% 40% at 60% 10%, rgba(139,92,246,0.08) 0%, transparent 50%),
  #060810;
```

---

## AccountListScreen

### 아이템 레이아웃: D-A 패턴

좌측 컬러 블록 + 외곽 곡률 일치 + 내측 직각.

```
카드 구조:
  .account-list-item
    border-radius: 18px
    background: var(--glass-bg)
    border: 1px solid var(--glass-border)
    box-shadow: var(--glass-shadow), var(--glass-inset)
    backdrop-filter: var(--glass-blur)
    overflow: hidden
    display: flex
    align-items: stretch

  .account-list-item-block   ← 좌측 컬러 블록
    width: 54px
    align-self: stretch
    border-radius: 16px 0 0 16px
    background: linear-gradient(180deg, {typeColor} 0%, {typeColorDark} 100%)
    display: flex; align-items: center; justify-content: center

  .account-list-item-body
    flex: 1
    padding: 13px 14px
```

`::before` pseudo-element로 상단 1px gradient line 추가:
```css
.account-list-item::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: var(--glass-line);
}
```

### 타입별 블록 컬러 (그라디언트)

| 타입 | from | to |
|---|---|---|
| checking | #3B82F6 | #1D4ED8 |
| installment_savings | #10B981 | #059669 |
| term_deposit | #8B5CF6 | #6D28D9 |
| savings | #F59E0B | #D97706 |
| cma | #EF4444 | #B91C1C |
| debit_card | #0EA5E9 | #0369A1 |
| credit_card | rgba(107,114,128,0.3) — 점선 border |

### 기타 처리

- **섹션 레이블** 추가: "입출금·카드" / "저축·투자" (font-size 10px, color var(--text-muted))
- **진행률 바** (적금·예금·비상금): height 3px, 타입 컬러 → 페이드 그라디언트
- **CMA**: 실시간 ticker dot 점멸 애니메이션 유지
- **신용카드 promo**: opacity 0.6 + border-style dashed

### 헤더

```css
.account-list-header {
  background: linear-gradient(180deg, rgba(6,8,16,0.85) 0%, rgba(6,8,16,0.5) 100%);
  backdrop-filter: blur(20px);
}
```

---

## AccountRoom

### 헤더

목록 아이템과 동일한 컬러 블록을 헤더 좌측에 연속 적용.

```
.room-header
  display: flex; align-items: stretch
  background: linear-gradient(180deg, rgba(6,8,16,0.9), rgba(6,8,16,0.55))
  backdrop-filter: blur(24px)

  .room-header-block
    width: 52px; align-self: stretch
    border-radius: 0   ← 헤더는 최상단, 외곽 radius 없음
    background: linear-gradient(180deg, {typeColor}, {typeColorDark})

  .room-header-body
    flex: 1; padding: 14px
```

### 탭 바

```css
.room-tabs {
  background: rgba(14,16,34,0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.room-tab.active::after {
  background: {typeColor};  /* 타입 컬러 인디케이터 */
}
```

### 라이프카드 (AccountLifeCard)

```css
.life-card {
  border-radius: 18px;
  background: linear-gradient(135deg, rgba({r},{g},{b},0.12), rgba({r},{g},{b},0.06));
  border: 1px solid rgba({r},{g},{b},0.25);
  box-shadow: 0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px rgba({r},{g},{b},0.1), var(--glass-inset);
  backdrop-filter: var(--glass-blur);
}
.life-card::before {
  /* 상단 컬러 glow line */
  background: linear-gradient(90deg, transparent, rgba({r},{g},{b},0.4), transparent);
}
```

Ring SVG glow:
```css
.life-ring-progress {
  filter: drop-shadow(0 0 6px rgba({r},{g},{b},0.7));
}
```

### AI 버블

```css
.ai-bubble-msg {
  background: linear-gradient(135deg, rgba(28,31,53,0.85), rgba(18,20,38,0.9));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px 16px 16px 16px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.3), var(--glass-inset);
}
```

### 입력창

```css
.room-input-wrap {
  background: rgba(37,40,70,0.8);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3), var(--glass-inset);
}
.room-send-btn {
  background: linear-gradient(135deg, #00C9A7, #00A88A);
  box-shadow: 0 0 12px rgba(0,201,167,0.4);
}
```

---

## AI 응답 카드 (공통 glass base)

모든 카드(`BalanceCard`, `SpendingCard`, `TransferCard`, `InsightCard`, `TransactionAlertCard`, `FinancialMomentCard`, `SavingsInsightCard`, `ProductListCard`, `ProductDetailCard`, `ProductCompareCard`, `TransferReceiptCard`)에 공통 적용:

```css
.card-base {
  border-radius: 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-inset);
  backdrop-filter: var(--glass-blur);
  position: relative; overflow: hidden;
}
.card-base::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: var(--glass-line);
}
```

### 금액 정렬 원칙

카드 내 **금액 수치는 항상 우측 정렬**. 레이블(항목명)은 좌측, 금액은 우측으로 배치해 스캔 속도를 높인다.

```
[항목명 / 설명]          [금액]
카테고리 바   ────────   82,000원
```

SpendingCard의 총액, TransferCard의 이체 금액, BalanceCard의 입출금 통계 모두 동일하게 적용.

### 카드별 accent 처리

| 카드 | Accent |
|---|---|
| BalanceCard | 계좌 타입 컬러 dot + 금액 gradient 텍스트 (우측 정렬) |
| SpendingCard | 지출 총액 우측 정렬 + 카테고리 컬러 바 (금액 우측) |
| TransferCard | 이체 금액 우측 정렬 + accent green 박스 + confirm 버튼 glow |
| InsightCard | amber 아이콘 배지 + 수치 highlight span |
| TransactionAlertCard | 거래 타입별 컬러 (입금 green / 출금 default) |
| FinancialMomentCard | momentType별 컬러 (급여 green / 카드대금 red / 적금 teal) |

---

## 변경 파일 범위

| 파일 | 변경 내용 |
|---|---|
| `frontend/src/styles.css` | `--glass-*` 토큰 추가, 앱 배경 radial gradient, 공통 card-base 클래스 |
| `frontend/src/components/AccountListScreen.jsx` | 아이템 D-A 패턴 재구성, 섹션 레이블, 진행률 바 |
| `frontend/src/components/AccountRoom.jsx` | 헤더 컬러 블록, 탭 타입 컬러, 라이프카드 glow, AI 버블, 입력창 |
| `frontend/src/components/BalanceCard.jsx` | glass base, gradient 금액 |
| `frontend/src/components/SpendingCard.jsx` | glass base, 컬러 바 |
| `frontend/src/components/TransferCard.jsx` | glass base, accent 금액 박스 |
| `frontend/src/components/InsightCard.jsx` | glass base, highlight span |
| `frontend/src/components/TransactionAlertCard.jsx` | glass base |
| `frontend/src/components/FinancialMomentCard.jsx` | glass base |
| `frontend/src/components/SavingsInsightCard.jsx` | glass base |
| `frontend/src/components/ProductListCard.jsx` | glass base |
| `frontend/src/components/ProductDetailCard.jsx` | glass base |
| `frontend/src/components/ProductCompareCard.jsx` | glass base |
| `frontend/src/components/TransferReceiptCard.jsx` | glass base |

---

## 성공 기준

- 앱 배경에 3색 radial gradient가 보인다.
- 계좌 목록 각 아이템 좌측에 타입 컬러 블록이 표시된다.
- 계좌방 헤더의 컬러 블록이 목록 아이템과 시각적으로 연속된다.
- 라이프카드 ring에 glow 효과가 적용된다.
- 모든 AI 응답 카드가 동일한 glass base를 공유한다.
- 기존 기능(이체, Tool Use, WebSocket 알림)은 변경 없이 동작한다.
