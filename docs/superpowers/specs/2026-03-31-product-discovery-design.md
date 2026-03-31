# Product Discovery & Upsell Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 계좌 목록 화면에서 미가입 상품의 가치를 맥락 기반으로 간접 소구하고, 상품 대화방 진입 시 AI가 개인화된 설득 대화와 카드형 정보를 자동 제공한다.

**Architecture:** 프론트엔드에서 보유 계좌 데이터로 힌트를 계산해 목록에 삽입하고, 미가입 상품 방(isPromo 패턴 확장)에 진입하면 서버가 개인화된 SSE 인사말과 `product_pitch` UI 카드를 자동 발송한다.

**Tech Stack:** React (AccountListScreen, AccountRoom, Message, new ProductPitchCard), Node/Express (server.js room-greeting endpoint 확장), mockData.js

---

## 1. Mock Data 재편

**파일:** `backend/src/mockData.js`

### 보유 계좌 (3개 + 카드)
현재 5개 → 3개로 축소해 미가입 상품 공간을 확보한다.

| id | type | name | balance | 비고 |
|----|------|------|---------|------|
| acc001 | checking | 주계좌 | 2,847,300원 | 잔액 증가, 풍부한 거래내역 |
| acc002 | installment_savings | iM 정기적금 | 2,100,000원 | 7/12회, maturityDate 2026-10-01 |
| acc006 | debit_card | iM 체크카드 | 0 | 카드 거래내역 보강 |
| acc007 | credit_card | iM 신용카드 | 0 | isPromo: true (기존 유지) |

**제거:** term_deposit(acc003), savings(acc004), cma(acc005)

### 상품 방 계좌 (3개 신규, isPromo 확장)
미가입 상품을 `accounts` 배열에 포함시키되 `isPromo: true`로 표시한다.

```js
{
  id: 'promo_cma',
  name: 'iM CMA',
  type: 'cma',
  isPromo: true,
  promoProductId: 'cma_mmf_01',   // products.js에서 조회
}
{
  id: 'promo_term_deposit',
  name: 'iM 정기예금',
  type: 'term_deposit',
  isPromo: true,
  promoProductId: 'term_deposit_01',
}
{
  id: 'promo_savings',
  name: 'iM 비상금통장',
  type: 'savings',
  isPromo: true,
  promoProductId: 'savings_flex_01',
}
```

### 거래내역 보강
- 주계좌: 월 급여 입금(3,000,000원), 카드대금 자동이체, 마트·카페·배달·쇼핑·교통 지출 15건 이상
- 체크카드: 식비·카페·교통·쇼핑 카드 거래 12건 이상
- 적금: 월납입 거래 7건

---

## 2. 계좌 목록 맥락 힌트 (AccountListScreen)

**파일:** `frontend/src/components/AccountListScreen.jsx`

### `computeProductHints(accounts)` 함수
보유 계좌 배열을 받아 미가입 상품에 대한 힌트 배열을 반환한다.

```js
// 반환 타입:
[{ productType, promoAccountId, hint, accentColor }]
```

#### 계산 규칙

**CMA 힌트** — checking 잔액 ≥ 500,000원이고 promo_cma가 있을 때
```
hint: "주계좌에 {balance}이 쉬고 있어요. CMA에 두면 오늘부터 +{dailyInterest}원/일."
dailyInterest = Math.round(balance * 0.0475 / 365)
accentColor: '#EF4444'
```

**정기예금 힌트** — installment_savings가 있고 daysToMaturity ≤ 180일이고 promo_term_deposit가 있을 때
```
hint: "적금 만기 {daysToMaturity}일 후 수령 예정 {projectedAmount}. 정기예금 넣으면 연 +{annualInterest}."
projectedAmount = balance + (monthlyDeposit * daysToMaturity / 30)
annualInterest = Math.round(projectedAmount * 0.042).toLocaleString('ko-KR') + '원'
accentColor: '#8B5CF6'
```

**비상금 힌트** — savings 보유 계좌가 없고 promo_savings가 있을 때 (항상 표시)
```
hint: "비상금 전용 통장이 없어요. 3개월치 생활비를 따로 모아두면 든든합니다."
accentColor: '#F59E0B'
```

### 힌트 카드 렌더링
힌트는 저축·투자 섹션 내 마지막 보유 계좌 아래에 삽입한다. 탭하면 해당 `promoAccountId`의 방으로 진입(`onEnterRoom(promoAccountId)`).

```jsx
<button className="product-hint-card" onClick={() => onEnterRoom(hint.promoAccountId)}
  style={{ '--hint-color': hint.accentColor }}>
  <span className="product-hint-dot" />
  <span className="product-hint-text">{hint.hint}</span>
  <span className="product-hint-arrow">›</span>
</button>
```

### 미가입 상품 방 목록 아이템
promo 계좌 아이템은 기존 `isPromo` 렌더링을 유지하되, 현재 "혜택을 가져가세요 →" 미리보기 텍스트를 제거하고 빈 상태로 둔다 (힌트 카드가 그 역할을 대신).

---

## 3. 상품 대화방 진입 경험

### 3-a. 서버: room-greeting 확장

**파일:** `backend/src/server.js`

`ROOM_GREETING_PROMPTS`에 상품 방 전용 프롬프트를 추가한다. 프롬프트에 `guiContext`(보유 계좌 잔액·거래 데이터)를 주입해 개인화한다.

```js
// ROOM_GREETING_PROMPTS 에 추가
cma: (ctx) => `고객 주계좌 잔액이 ${ctx.checkingBalance}원입니다. CMA 안내 AI로서, 이 잔액이 입출금에 방치될 때의 기회비용을 먼저 언급하고 CMA의 매일 이자 장점을 2문장 이내로 설명하라. 이모지 금지. 격식체.`,
term_deposit: (ctx) => `고객 정기적금이 ${ctx.daysToMaturity}일 후 만기입니다. 만기 수령 예정액을 언급하며 정기예금으로 자금을 불릴 수 있음을 2문장 이내로 안내하라. 이모지 금지. 격식체.`,
savings: () => `비상금 통장 안내 AI로서, 예기치 못한 지출에 대비하는 비상금의 중요성을 공감하며 2문장 이내로 먼저 말을 걸어라. 이모지 금지. 격식체.`,
```

**`/api/room-greeting` 수정 사항:**
1. 요청 body에서 `guiContext` 추가 수신 (`checkingBalance`, `daysToMaturity` 등)
2. `acc.isPromo === true`이면 위 함수형 프롬프트에 context 적용
3. 인사말 스트리밍 완료 후 `product_pitch` UI 카드 이벤트 추가 전송:

```js
// 텍스트 스트리밍 완료 후
res.write(`data: ${JSON.stringify({
  type: 'ui_card',
  cardType: 'product_pitch',
  data: buildProductPitchData(acc, session, guiContext)
})}\n\n`)
```

### `buildProductPitchData(acc, session, guiContext)` 함수
`products.js`에서 상품 정보를 가져오고 context로 개인화 계산을 합산해 반환한다.

```js
{
  product: { id, name, type, interestRate, description, minAmount },
  personal: {
    baseAmount,           // 이동 또는 가입 예상 금액 (맥락 기반)
    dailyOrMonthlyGain,   // 일 이자(CMA) 또는 연 이자(예금)
    annualGain,           // 연간 수익
  },
  compare: {
    current:  { label, rate, annualGain },   // 현재 (입출금 0.1% 등)
    withProduct: { label, rate, annualGain } // 상품 이용 시
  }
}
```

### 3-b. 프론트엔드: ProductPitchCard

**파일:** `frontend/src/components/ProductPitchCard.jsx` (신규)

인사말 직후 자동으로 렌더링되는 카드. 3개 섹션:

1. **상품 헤더**: 아이콘(타입별 컬러), 이름, 이율
2. **상세 정보 행**: 운용방식, 이자지급, 최소금액, 해지제한
3. **개인화 하이라이트**: "내 {X}원 기준 → 연 {Y}원 / 일 {Z}원"
4. **비교 행**: 현재 vs 상품 이용 시 (2열, 추천 상품쪽 accent border)

**파일:** `frontend/src/components/Message.jsx`
`cardType === 'product_pitch'`일 때 `<ProductPitchCard>` 렌더링 추가.

### 3-c. AccountRoom: 상품 방 UI
`isPromo` 계좌의 room-header 배경 및 탭 색상이 해당 상품 타입 컬러를 사용한다 (기존 `BLOCK_COLORS` 활용, 이미 구현됨).

---

## 4. CSS 추가 (`styles.css`)

```css
/* 맥락 힌트 카드 */
.product-hint-card {
  display: flex; align-items: flex-start; gap: 10px;
  width: calc(100% - 20px); margin: 4px 10px;
  background: rgba(var(--hint-color-rgb, 255,255,255), 0.05);
  border: 1px solid rgba(var(--hint-color-rgb, 255,255,255), 0.12);
  border-radius: 12px; padding: 10px 12px;
  cursor: pointer; text-align: left;
}
/* 점, 텍스트, 화살표 서브 클래스 */
.product-hint-dot { ... }
.product-hint-text { ... }
.product-hint-arrow { ... }
```

CSS 변수로 `--hint-color`를 받아 accent 적용. `rgba()` 분해는 JS에서 hex → RGB 변환으로 처리한다.

---

## 5. 데이터 흐름 요약

```
[AccountListScreen]
  computeProductHints(accounts)
    → 힌트 카드 렌더
    → 탭 → onEnterRoom(promo_cma)

[App.jsx → AccountRoom]
  POST /api/room-greeting { accountId: 'promo_cma', guiContext: { checkingBalance: 2847300 } }
    → SSE text (개인화 인사)
    → SSE ui_card { cardType: 'product_pitch', data: { product, personal, compare } }

[Message.jsx]
  cardType 'product_pitch' → <ProductPitchCard>
```

---

## 6. 구현 범위 (YAGNI)

- 실제 가입 연동 없음 — AI 대화 + 카드 안내까지
- 힌트는 클라이언트 계산 (서버 API 추가 없음)
- ProductPitchCard는 정적 데이터 렌더링 (AI 스트리밍 없음)
- `product_pitch` 카드는 room-greeting 엔드포인트에서만 발송
