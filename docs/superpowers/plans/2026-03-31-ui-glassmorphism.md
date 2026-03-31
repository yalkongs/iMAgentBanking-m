# UI Glassmorphism 전면 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전체 앱에 Bold Glassmorphism 스타일을 적용해 시각적 품질을 높인다.

**Architecture:** (1) styles.css에 `--glass-*` 토큰 추가 → (2) `.ui-card` 공통 클래스 업그레이드 → (3) AccountListScreen D-A 패턴 아이템 → (4) AccountRoom 헤더 컬러 블록 + 라이프카드 glow → (5) 카드별 금액 우측 정렬. 기능 변경 없이 CSS/JSX만 수정.

**Tech Stack:** React + Vite (JSX), CSS variables, `color-mix()`, `backdrop-filter`

---

## Task 1: CSS 토큰 추가 + 앱 배경 강화

**Files:**
- Modify: `frontend/src/styles.css:1-36` (`:root` 블록)
- Modify: `frontend/src/styles.css:89-105` (`.app` 블록)

- [ ] **Step 1: `:root`에 `--glass-*` 토큰 추가**

`styles.css` `:root { }` 블록 (현재 line 4–36) 끝, `--font-mono` 아래에 추가:

```css
  /* ── Glass Layer Tokens ── */
  --glass-bg:     linear-gradient(135deg, rgba(28,31,53,0.88) 0%, rgba(14,16,34,0.92) 100%);
  --glass-border: rgba(255, 255, 255, 0.09);
  --glass-inset:  inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --glass-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  --glass-blur:   blur(16px);
  --glass-line:   linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
```

- [ ] **Step 2: `.app` 배경을 radial gradient 오버레이로 교체**

`styles.css`의 `.app { background: var(--bg-primary); }` (line 101)를 교체:

```css
  background:
    radial-gradient(ellipse 60% 50% at 20% 20%, rgba(0,201,167,0.12) 0%, transparent 60%),
    radial-gradient(ellipse 50% 60% at 80% 70%, rgba(59,130,246,0.10) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 60% 10%, rgba(139,92,246,0.08) 0%, transparent 50%),
    #060810;
```

- [ ] **Step 3: 로컬 서버 실행 후 배경 확인**

```bash
cd frontend && npm run dev
```

브라우저에서 `http://localhost:5173` 열어 앱 배경에 teal·blue·purple 미묘한 그라디언트가 보이는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/styles.css
git commit -m "feat: glass 토큰 추가 + 앱 배경 radial gradient"
```

---

## Task 2: `.ui-card` 공통 클래스 업그레이드

**Files:**
- Modify: `frontend/src/styles.css:1040-1051` (`.ui-card` 블록)

- [ ] **Step 1: `.ui-card` 스타일을 glass base로 교체**

`styles.css` line 1040–1051의 `.ui-card { }` 전체를 교체:

```css
.ui-card {
  margin-top: 4px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--glass-shadow), var(--glass-inset);
  position: relative;
}

.ui-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: var(--glass-line);
  pointer-events: none;
  z-index: 1;
}
```

- [ ] **Step 2: 앱 실행 후 카드 확인**

대화방에서 AI와 대화해 잔액 카드가 표시되는지 확인. 카드 상단에 미묘한 1px 하이라이트 라인이 보여야 한다.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/styles.css
git commit -m "feat: ui-card glass base 업그레이드 + top gradient line"
```

---

## Task 3: AccountListScreen — D-A 패턴 아이템 (JSX)

**Files:**
- Modify: `frontend/src/components/AccountListScreen.jsx`

기존 `.account-avatar` (원형 아이콘)를 `.account-list-item-block` (좌측 전체 높이 컬러 블록)으로 교체.

- [ ] **Step 1: `BLOCK_COLORS` 상수 추가**

`AccountListScreen.jsx` 파일 상단 `const ICONS = { ... }` 위에 추가:

```js
const BLOCK_COLORS = {
  checking:            ['#3B82F6', '#1D4ED8'],
  installment_savings: ['#10B981', '#059669'],
  term_deposit:        ['#8B5CF6', '#6D28D9'],
  savings:             ['#F59E0B', '#D97706'],
  cma:                 ['#EF4444', '#B91C1C'],
  debit_card:          ['#0EA5E9', '#0369A1'],
  credit_card:         ['rgba(107,114,128,0.35)', 'rgba(107,114,128,0.2)'],
}
```

- [ ] **Step 2: 계좌 아이템 JSX 재구성**

`accounts.map()` 안의 `<button>` 내부를 교체. 기존 `.account-avatar` div를 제거하고 `.account-list-item-block`으로 교체:

```jsx
return (
  <button
    key={acc.id}
    className={`account-list-item${isPromo ? ' account-list-item--promo' : ''}`}
    onClick={() => onEnterRoom(acc.id)}
  >
    <div
      className="account-list-item-block"
      style={{
        background: isPromo
          ? 'rgba(107,114,128,0.25)'
          : `linear-gradient(180deg, ${(BLOCK_COLORS[acc.type] || BLOCK_COLORS.checking)[0]} 0%, ${(BLOCK_COLORS[acc.type] || BLOCK_COLORS.checking)[1]} 100%)`,
        ...(isPromo ? { border: '1px dashed rgba(255,255,255,0.1)' } : {}),
      }}
    >
      {ICONS[acc.type] || ICONS.checking}
    </div>

    <div className="account-list-item-body">
      <div className="account-list-item-top">
        <span className="account-list-name">{acc.name}</span>
        <span className="account-list-balance">
          {acc.isPromo ? (
            <span className="balance-promo-badge">발급 가능</span>
          ) : acc.type === 'debit_card' ? (
            <BalanceDisplay value={acc.balance} animate={shouldAnimate} prefix="이번달 " suffix="원 사용" />
          ) : (
            <BalanceDisplay value={acc.balance} animate={shouldAnimate} />
          )}
        </span>
      </div>
      <div className="account-list-item-bottom">
        <span className="account-list-preview">
          {isPromo
            ? '혜택을 가져가세요 →'
            : last
            ? `${last.counterpart} ${last.amountFormatted}`
            : cfg.label}
        </span>
        <span className="account-list-time">
          {last ? formatDateShort(last.date) : ''}
        </span>
      </div>
    </div>

    <div className="unread-badge-slot">
      {unread > 0 && <div className="unread-badge">{unread}</div>}
    </div>
  </button>
)
```

- [ ] **Step 3: 섹션 레이블 삽입**

`accounts.map()` 전체를 아래 코드로 교체 (섹션 그루핑 포함):

```jsx
{(() => {
  const BANKING_TYPES = new Set(['checking', 'debit_card', 'credit_card'])
  const items = []
  let lastSection = null

  accounts.forEach((acc, idx) => {
    const section = BANKING_TYPES.has(acc.type) ? 'banking' : 'savings'
    if (section !== lastSection) {
      lastSection = section
      items.push(
        <div key={`section-${section}`} className="account-section-label">
          {section === 'banking' ? '입출금 · 카드' : '저축 · 투자'}
        </div>
      )
    }
    const cfg = TYPE_CONFIG[acc.type] || { color: '#6B7280', label: acc.type }
    const unread = unreadCounts?.[acc.id] || 0
    const last = acc.lastTransaction
    const isPromo = acc.isPromo === true

    items.push(
      <button
        key={acc.id}
        className={`account-list-item${isPromo ? ' account-list-item--promo' : ''}`}
        onClick={() => onEnterRoom(acc.id)}
      >
        <div
          className="account-list-item-block"
          style={{
            background: isPromo
              ? 'rgba(107,114,128,0.25)'
              : `linear-gradient(180deg, ${(BLOCK_COLORS[acc.type] || BLOCK_COLORS.checking)[0]} 0%, ${(BLOCK_COLORS[acc.type] || BLOCK_COLORS.checking)[1]} 100%)`,
          }}
        >
          {ICONS[acc.type] || ICONS.checking}
        </div>

        <div className="account-list-item-body">
          <div className="account-list-item-top">
            <span className="account-list-name">{acc.name}</span>
            <span className="account-list-balance">
              {acc.isPromo ? (
                <span className="balance-promo-badge">발급 가능</span>
              ) : acc.type === 'debit_card' ? (
                <BalanceDisplay value={acc.balance} animate={shouldAnimate} prefix="이번달 " suffix="원 사용" />
              ) : (
                <BalanceDisplay value={acc.balance} animate={shouldAnimate} />
              )}
            </span>
          </div>
          <div className="account-list-item-bottom">
            <span className="account-list-preview">
              {isPromo
                ? '혜택을 가져가세요 →'
                : last
                ? `${last.counterpart} ${last.amountFormatted}`
                : cfg.label}
            </span>
            <span className="account-list-time">
              {last ? formatDateShort(last.date) : ''}
            </span>
          </div>
        </div>

        <div className="unread-badge-slot">
          {unread > 0 && <div className="unread-badge">{unread}</div>}
        </div>
      </button>
    )
  })
  return items
})()}
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/AccountListScreen.jsx
git commit -m "feat: AccountListScreen D-A 패턴 + 섹션 레이블"
```

---

## Task 4: AccountListScreen CSS

**Files:**
- Modify: `frontend/src/styles.css` (`.account-list-header`, `.account-list-item`, `.account-avatar` 영역)

- [ ] **Step 1: `.account-list-header` 업그레이드**

`styles.css`의 `.account-list-header { }` (line ~3507)를 교체:

```css
.account-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 14px;
  background: linear-gradient(180deg, rgba(6,8,16,0.85) 0%, rgba(6,8,16,0.5) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
```

- [ ] **Step 2: `.account-list-item` 재정의**

`styles.css`의 `.account-list-item { }` (line ~3538) 블록을 교체:

```css
.account-list-item {
  display: flex;
  align-items: stretch;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 18px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-inset);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  overflow: hidden;
  position: relative;
  transition: transform 0.12s, box-shadow 0.12s;
  gap: 0;
  padding: 0;
}

.account-list-item::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 1px;
  background: var(--glass-line);
  pointer-events: none;
  z-index: 1;
}

.account-list-item:active {
  transform: scale(0.985);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), var(--glass-inset);
}
```

- [ ] **Step 3: `.account-list-item-block` 추가**

`.account-list-item` 아래에 새 클래스 추가:

```css
.account-list-item-block {
  width: 54px;
  align-self: stretch;
  border-radius: 16px 0 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.account-list-item-block::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05), rgba(255,255,255,0.18));
}
```

- [ ] **Step 4: `.account-list-item-body` 패딩 추가**

`.account-list-item-body { }` (line ~3569)에 `padding: 13px 14px;` 추가:

```css
.account-list-item-body {
  flex: 1;
  min-width: 0;
  padding: 13px 14px;
}
```

- [ ] **Step 5: 섹션 레이블 스타일 추가**

`.account-list-items` 블록 아래에 추가:

```css
.account-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 8px 4px 4px;
}

.account-section-label:first-child {
  padding-top: 4px;
}
```

- [ ] **Step 6: 기존 `.account-avatar` 스타일 삭제 또는 주석 처리**

`styles.css`에서 `.account-avatar { }` 블록을 찾아 삭제 (AccountListScreen에서 더 이상 사용 안 함).

- [ ] **Step 7: 화면 확인**

계좌 목록 화면에서:
- 각 아이템 좌측에 타입 컬러 블록이 표시된다.
- "입출금·카드" / "저축·투자" 섹션 레이블이 보인다.
- 아이템에 glass 효과가 적용된다.

- [ ] **Step 8: 커밋**

```bash
git add frontend/src/styles.css
git commit -m "feat: AccountListScreen glass 아이템 + D-A 패턴 CSS"
```

---

## Task 5: AccountRoom — 헤더 컬러 블록 (JSX)

**Files:**
- Modify: `frontend/src/components/AccountRoom.jsx`

- [ ] **Step 1: `BLOCK_COLORS` 상수 추가**

`AccountRoom.jsx` 파일 상단 `const ICONS = { ... }` 위에 추가 (AccountListScreen과 동일):

```js
const BLOCK_COLORS = {
  checking:            ['#3B82F6', '#1D4ED8'],
  installment_savings: ['#10B981', '#059669'],
  term_deposit:        ['#8B5CF6', '#6D28D9'],
  savings:             ['#F59E0B', '#D97706'],
  cma:                 ['#EF4444', '#B91C1C'],
  debit_card:          ['#0EA5E9', '#0369A1'],
  credit_card:         ['rgba(107,114,128,0.35)', 'rgba(107,114,128,0.2)'],
}
```

- [ ] **Step 2: 헤더 JSX 재구성 — avatar → block**

`AccountRoom.jsx`의 `{/* 헤더 */}` 블록 (line ~477)을 교체.

기존:
```jsx
<div className="room-header" onClick={() => setContactCardOpen(o => !o)}>
  <button className="room-back-btn" onClick={(e) => { e.stopPropagation(); onBack() }} aria-label="뒤로가기">‹</button>
  <div className="room-header-avatar" style={{ background: cfg.color }}>
    {ICONS[account?.type] || ICONS.checking}
  </div>
  <div className="room-header-info">
    <div className="room-header-name">{account.name}</div>
    <div className="room-header-sub">{account.bank} · {cfg.label}</div>
  </div>
  <div className="room-header-chevron">{contactCardOpen ? '▲' : '▼'}</div>
</div>
```

교체:
```jsx
<div className="room-header" onClick={() => setContactCardOpen(o => !o)}>
  <button
    className="room-back-btn"
    onClick={(e) => { e.stopPropagation(); onBack() }}
    aria-label="뒤로가기"
  >‹</button>
  <div
    className="room-header-block"
    style={{
      background: `linear-gradient(180deg, ${(BLOCK_COLORS[account?.type] || BLOCK_COLORS.checking)[0]} 0%, ${(BLOCK_COLORS[account?.type] || BLOCK_COLORS.checking)[1]} 100%)`,
    }}
  >
    {ICONS[account?.type] || ICONS.checking}
  </div>
  <div className="room-header-info">
    <div className="room-header-name">{account.name}</div>
    <div className="room-header-sub">{account.bank} · {cfg.label}</div>
  </div>
  <div className="room-header-chevron">{contactCardOpen ? '▲' : '▼'}</div>
</div>
```

- [ ] **Step 3: 탭 바에 타입 컬러 CSS 변수 주입**

`{/* 탭 바 */}` 블록 (line ~540)에 `style` prop 추가:

```jsx
<div
  className="room-tab-bar"
  role="tablist"
  aria-label="계좌 탭"
  style={{ '--tab-active-color': (BLOCK_COLORS[account?.type] || BLOCK_COLORS.checking)[0] }}
>
```

- [ ] **Step 4: LifeRing SVG에 glow 추가**

`AccountRoom.jsx`의 `LifeRing` 컴포넌트 (line ~86)에서 progress circle에 filter 추가:

```jsx
<circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="6"
  strokeDasharray={`${C * ratio} ${C}`} strokeLinecap="round"
  transform="rotate(-90 50 50)"
  style={{
    transition: 'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)',
    filter: `drop-shadow(0 0 6px ${color}99)`,
  }}
/>
```

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/AccountRoom.jsx
git commit -m "feat: AccountRoom 헤더 컬러 블록 + 탭 타입컬러 + ring glow"
```

---

## Task 6: AccountRoom CSS

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: `.room-header` 업그레이드**

`styles.css`의 `.room-header { }` (line ~3656) 블록 교체:

```css
.room-header {
  display: flex;
  align-items: stretch;
  background: linear-gradient(180deg, rgba(6,8,16,0.9) 0%, rgba(6,8,16,0.55) 100%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
  z-index: 2;
}
```

- [ ] **Step 2: `.room-header-block` 추가 + `.room-header-avatar` 삭제**

`.room-header` 아래에 새 클래스 추가:

```css
.room-header-block {
  width: 52px;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.room-header-block::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05), rgba(255,255,255,0.18));
}
```

그리고 `.room-header-avatar { }` 블록 삭제 (JSX에서 더 이상 사용 안 함).

- [ ] **Step 3: 탭 활성 컬러를 CSS 변수로**

`styles.css`의 `.room-tab.active` 및 `.room-tab.active::after` 를 교체:

```css
.room-tab.active {
  color: var(--tab-active-color, var(--accent));
  font-weight: 600;
}

.room-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%; right: 20%;
  height: 2px;
  background: var(--tab-active-color, var(--accent));
  border-radius: 1px 1px 0 0;
}
```

- [ ] **Step 4: `.slc-card` glow + glass 업그레이드**

`styles.css`의 `.slc-card { }` (line ~4840) 블록 교체:

```css
.slc-card {
  margin: 12px 12px 8px;
  padding: 16px 16px 14px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--slcc, #10B981) 12%, transparent),
    color-mix(in srgb, var(--slcc, #10B981) 6%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--slcc, #10B981) 25%, transparent);
  border-radius: 18px;
  box-shadow:
    0 8px 28px rgba(0,0,0,0.4),
    0 0 0 1px color-mix(in srgb, var(--slcc, #10B981) 10%, transparent),
    inset 0 1px 0 rgba(255,255,255,0.06);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  position: relative;
  overflow: hidden;
}

.slc-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--slcc, #10B981) 40%, transparent), transparent);
  pointer-events: none;
}
```

- [ ] **Step 5: 입력창 pill + 전송버튼 glow 업그레이드**

`styles.css`의 `.room-input { }` (line ~3947) 교체:

```css
.room-input {
  flex: 1;
  background: rgba(37,40,70,0.8);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 9px 14px;
  font-size: 14px;
  color: var(--text-primary);
  resize: none;
  max-height: 120px;
  min-height: 38px;
  line-height: 1.5;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.room-input:focus {
  border-color: var(--accent-border);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 3px rgba(0,201,167,0.08);
  outline: none;
}
```

그리고 `.room-send-btn { }` (line ~3971) 교체:

```css
.room-send-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00C9A7, #00A88A);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 14px rgba(0,201,167,0.45), 0 4px 8px rgba(0,0,0,0.3);
  transition: transform 0.1s, box-shadow 0.1s;
}

.room-send-btn:active {
  transform: scale(0.92);
  box-shadow: 0 0 8px rgba(0,201,167,0.3);
}
```

- [ ] **Step 6: 화면 확인**

계좌 대화방에서:
- 헤더 좌측에 타입 컬러 블록이 표시된다.
- 탭 활성 인디케이터가 계좌 타입 컬러를 따른다 (적금 = 그린, 예금 = 퍼플 등).
- 라이프카드 ring에 glow가 적용된다.
- 전송 버튼에 accent glow가 생긴다.

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/styles.css
git commit -m "feat: AccountRoom CSS — 헤더 블록, 탭 컬러, slc-card glow, 입력창"
```

---

## Task 7: SpendingCard — 금액 우측 정렬

**Files:**
- Modify: `frontend/src/components/SpendingCard.jsx`
- Modify: `frontend/src/styles.css` (`.spending-*` 클래스)

- [ ] **Step 1: SpendingCard.jsx 헤더 행 재구성**

`SpendingCard.jsx`의 `return (` 안 `.spending-header` 블록을 교체.

기존:
```jsx
<div className="spending-header">
  <span className="spending-title">지출 분석</span>
  {data.period && (
    <span className="spending-period">
      {data.period.start?.slice(5)} ~ {data.period.end?.slice(5)}
    </span>
  )}
</div>
<div className="spending-hero">
  <div className="spending-hero-label">총 지출</div>
  ...
```

교체:
```jsx
<div className="spending-header">
  <div className="spending-header-left">
    <span className="spending-title">지출 분석</span>
    {data.period && (
      <span className="spending-period">
        {data.period.start?.slice(5)} ~ {data.period.end?.slice(5)}
      </span>
    )}
  </div>
  <div className="spending-header-right">
    <div className="spending-total-amount">{data.totalFormatted || `${(data.total || 0).toLocaleString('ko-KR')}원`}</div>
    {data.vsLastMonth !== undefined && (
      <div className={`spending-vs ${data.vsLastMonth >= 0 ? 'up' : 'down'}`}>
        전월 대비 {data.vsLastMonth >= 0 ? '+' : ''}{data.vsLastMonth}%
      </div>
    )}
  </div>
</div>
```

그리고 기존 `.spending-hero` div 전체를 삭제.

- [ ] **Step 2: styles.css의 `.spending-header` 수정**

```css
.spending-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 14px 10px;
  gap: 8px;
}

.spending-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spending-header-right {
  text-align: right;
  flex-shrink: 0;
}

.spending-total-amount {
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(135deg, #F87171 0%, #FCA5A5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.6px;
}

.spending-vs {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}
.spending-vs.up { color: #F87171; }
.spending-vs.down { color: #34D399; }
```

- [ ] **Step 3: 카테고리 바 금액 우측 정렬 확인**

`SpendingCard.jsx`의 카테고리 바 행 (`.spending-item-amount`)이 이미 오른쪽에 있는지 확인. 없으면 flex row로 재구성:

```jsx
<div className="spending-item-row">
  <span className="spending-item-label">{item.category || item.counterpart}</span>
  <div className="spending-item-bar-wrap">
    <div className="spending-item-bar" style={{ width: `${(item.total / max) * 100}%`, background: CATEGORY_COLOR[item.category] || '#94A3B8' }} />
  </div>
  <span className="spending-item-amount">{item.total.toLocaleString('ko-KR')}원</span>
</div>
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/SpendingCard.jsx frontend/src/styles.css
git commit -m "feat: SpendingCard 금액 우측 정렬 + 총액 헤더 이동"
```

---

## Task 8: TransferCard — 금액 우측 정렬

**Files:**
- Modify: `frontend/src/components/TransferCard.jsx`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: TransferCard.jsx 현재 구조 확인 후 금액 행 재구성**

`frontend/src/components/TransferCard.jsx`를 읽어 금액 표시 부분을 찾는다.

금액 행을 레이블 좌 / 금액 우 구조로 변경:

```jsx
<div className="transfer-amount-row">
  <span className="transfer-amount-label">이체 금액</span>
  <span className="transfer-amount-value">{data.amountFormatted || `${(data.amount || 0).toLocaleString('ko-KR')}원`}</span>
</div>
```

- [ ] **Step 2: styles.css에 `.transfer-amount-row` 추가**

```css
.transfer-amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0,201,167,0.08);
  border: 1px solid rgba(0,201,167,0.2);
  border-radius: 10px;
  padding: 10px 14px;
  margin: 10px 14px;
}

.transfer-amount-label {
  font-size: 12px;
  color: var(--text-muted);
}

.transfer-amount-value {
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #00C9A7, #34D399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.6px;
}
```

- [ ] **Step 3: 이체 후 잔액 행 추가 (있을 경우)**

`data.balanceAfter`가 있으면 금액 행 아래에 보조 정보 추가:

```jsx
{data.balanceAfter !== undefined && (
  <div className="transfer-detail-row">
    <span className="transfer-detail-key">이체 후 잔액</span>
    <span className="transfer-detail-val">{data.balanceAfter.toLocaleString('ko-KR')}원</span>
  </div>
)}
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/TransferCard.jsx frontend/src/styles.css
git commit -m "feat: TransferCard 금액 우측 정렬 + accent 박스"
```

---

## Task 9: BalanceCard + InsightCard accent 처리

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: `.balance-hero-amount` 우측 정렬**

`styles.css`에서 `.balance-hero { }` 블록을 찾아 flex row로 변경:

```css
.balance-hero {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--border);
}

.balance-hero-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.balance-hero-amount {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.8px;
}
```

- [ ] **Step 2: `.acct-obj-balance` 강조**

`styles.css`에서 `.acct-obj-balance { }` 찾아 gradient 텍스트 적용:

```css
.acct-obj-balance {
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.4px;
  margin-top: 4px;
}
```

- [ ] **Step 3: InsightCard.jsx에 highlight span 추가**

`frontend/src/components/InsightCard.jsx`를 열어 수치가 포함된 텍스트를 렌더링하는 부분에 아래 패턴 적용:

숫자 수치(예: `87,400원`, `12%` 등)가 포함된 텍스트 렌더링 시 인라인 강조 CSS:

```css
/* styles.css에 추가 */
.insight-highlight {
  display: inline;
  background: rgba(251,191,36,0.12);
  border: 1px solid rgba(251,191,36,0.2);
  border-radius: 4px;
  padding: 0 4px;
  color: #FBBF24;
  font-weight: 600;
}
```

InsightCard에서 수치 강조가 필요한 경우 `<span className="insight-highlight">`로 감싼다. 단, InsightCard 내부 텍스트가 동적으로 생성될 경우 markdown 렌더링을 그대로 유지하고 이 단계를 건너뛴다.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/styles.css
git commit -m "feat: BalanceCard 금액 gradient + InsightCard highlight 스타일"
```

---

## Task 10: 최종 확인 + 빌드 + 배포

**Files:**
- `frontend/` (빌드)

- [ ] **Step 1: 로컬 전체 확인**

```bash
cd frontend && npm run dev
```

체크리스트:
- [ ] 계좌 목록: 배경 gradient 보임
- [ ] 계좌 목록: 아이템 좌측 컬러 블록 표시
- [ ] 계좌 목록: "입출금·카드" / "저축·투자" 섹션 레이블 표시
- [ ] 계좌 대화방: 헤더 컬러 블록 표시
- [ ] 계좌 대화방: 탭 인디케이터가 계좌 타입 컬러 따름
- [ ] 계좌 대화방: 라이프카드 ring glow 적용
- [ ] AI 카드: glass base 적용 (카드 상단에 1px line 보임)
- [ ] 지출 카드: 총액이 헤더 우측에 표시
- [ ] 이체 카드: 금액이 우측에 표시
- [ ] 기존 기능 정상: 이체, Tool Use, WebSocket 알림

- [ ] **Step 2: 프로덕션 빌드**

```bash
cd frontend && npm run build
```

오류 없이 완료되는지 확인. `dist/` 생성 확인.

- [ ] **Step 3: Vercel 배포**

```bash
cd frontend && vercel --prod --yes
```

- [ ] **Step 4: 라이브 확인**

`https://imagentbanking-m.vercel.app` 에서 동일하게 확인.

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "feat: UI Glassmorphism 전면 개편 완료"
```
