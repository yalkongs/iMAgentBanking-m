# Product Discovery & Upsell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 계좌 목록에서 미가입 상품의 가치를 맥락 기반으로 간접 소구하고, 상품 대화방 진입 시 AI가 개인화 설득 대화와 ProductPitchCard를 자동 제공한다.

**Architecture:** 프론트엔드 `computeProductHints(accounts)`가 잔액·만기 데이터로 힌트를 계산(최대 1개, 콜드스타트 방지). isPromo 프로모 계좌를 accounts 배열에 포함시켜 상품 방으로 진입. 서버 `/api/room-greeting`에서 isPromo 계좌 진입 시 개인화된 인사말 SSE 스트리밍 완료 후 `product_pitch` UI 카드 이벤트를 추가 발송. 프론트엔드 `fetchRoomGreeting`이 `ui_card` 이벤트를 처리해 ProductPitchCard를 렌더링.

**Tech Stack:** React, Express/Node (ESM), Anthropic Claude (haiku)

**Cold Start 가드:** `computeProductHints`는 항상 최대 1개 힌트만 반환. 상품 프로모 방(isPromo 계좌)은 저축·투자 계좌(installment_savings, term_deposit, savings, cma) 1개 이상 보유 시에만 목록에 표시.

---

## File Map

| 파일 | 역할 |
|------|------|
| `backend/src/mockData.js` | 계좌 3개로 재편 + 프로모 계좌 3개 추가, 거래내역 보강 |
| `backend/src/products.js` | CMA 상품 항목 추가 |
| `backend/src/server.js` | `buildProductPitchData` 추가, `/api/room-greeting` 확장 |
| `backend/src/tests/core.test.js` | 프로모 계좌 구조 + buildProductPitchData 검증 |
| `frontend/src/components/AccountListScreen.jsx` | `computeProductHints`, 힌트 카드, 콜드스타트 가드 |
| `frontend/src/components/ProductPitchCard.jsx` | 신규: 상품 상세 + 개인화 수익 + 비교 카드 |
| `frontend/src/components/Message.jsx` | `product_pitch` 카드타입 라우팅 추가 |
| `frontend/src/App.jsx` | `fetchRoomGreeting`에 guiContext 전달 + ui_card 이벤트 처리 |
| `frontend/src/styles.css` | `.product-hint-card` + ProductPitchCard 스타일 추가 |

---

## Task 1: Mock Data 재편

**Files:**
- Modify: `backend/src/mockData.js`

- [ ] **Step 1: 계좌 배열 교체**

`accounts` 배열을 다음으로 완전 교체한다. 기존 acc003(term_deposit), acc004(savings), acc005(cma) 제거. 프로모 계좌 3개 추가.

```js
export const accounts = [
  // ── 실제 보유 계좌 ──
  {
    id: 'acc001',
    name: '주계좌',
    balance: 2847300,
    type: 'checking',
    bank: 'iM뱅크',
    accountNo: '503-12-3456789',
  },
  {
    id: 'acc002',
    name: 'iM 정기적금',
    balance: 2100000,
    type: 'installment_savings',
    bank: 'iM뱅크',
    accountNo: '503-34-5678901',
    monthlyDeposit: 300000,
    openDate: '2025-09-01',
    maturityDate: '2026-09-01',
    interestRate: 4.2,
  },
  {
    id: 'acc006',
    name: 'iM 체크카드 ****3847',
    balance: 0,
    type: 'debit_card',
    bank: 'iM뱅크',
    accountNo: null,
    cardNo: '**** **** **** 3847',
    linkedAccountId: 'acc001',
    last4: '3847',
  },
  {
    id: 'acc007',
    name: 'iM 신용카드',
    balance: 0,
    type: 'credit_card',
    bank: 'iM뱅크',
    accountNo: null,
    isPromo: true,
  },
  // ── 미가입 상품 방 (isPromo) ──
  {
    id: 'promo_cma',
    name: 'iM CMA',
    balance: 0,
    type: 'cma',
    bank: 'iM뱅크증권',
    accountNo: null,
    isPromo: true,
    promoProductId: 'cma_mmf_01',
  },
  {
    id: 'promo_term_deposit',
    name: 'iM 정기예금',
    balance: 0,
    type: 'term_deposit',
    bank: 'iM뱅크',
    accountNo: null,
    isPromo: true,
    promoProductId: 'dep_001',
  },
  {
    id: 'promo_savings',
    name: 'iM 비상금통장',
    balance: 0,
    type: 'savings',
    bank: 'iM뱅크',
    accountNo: null,
    isPromo: true,
    promoProductId: 'dep_003',
  },
]
```

- [ ] **Step 2: 거래내역에서 CMA 자동이체 제거**

`transactions` 배열에서 `counterpart: 'iM CMA 자동이체'`인 항목(t004, t033, t063)을 삭제한다.

- [ ] **Step 3: 체크카드 거래내역 추가**

`transactions` 배열 끝에 체크카드 거래 추가. `source: 'card'`, `accountId: 'acc006'`.

```js
  // ── 체크카드 (acc006) ──────────────────────────
  { id: 'c001', date: d(1),  amount: -8500,   category: '카페',  counterpart: '스타벅스 강남점',    accountId: 'acc006', source: 'card' },
  { id: 'c002', date: d(2),  amount: -32000,  category: '식비',  counterpart: '한식당 점심',        accountId: 'acc006', source: 'card' },
  { id: 'c003', date: d(3),  amount: -1450,   category: '교통',  counterpart: '서울 지하철',        accountId: 'acc006', source: 'card' },
  { id: 'c004', date: d(4),  amount: -14900,  category: '쇼핑',  counterpart: '올리브영 강남점',    accountId: 'acc006', source: 'card' },
  { id: 'c005', date: d(5),  amount: -24500,  category: '식비',  counterpart: '이마트24',           accountId: 'acc006', source: 'card' },
  { id: 'c006', date: d(6),  amount: -6800,   category: '카페',  counterpart: '투썸플레이스',       accountId: 'acc006', source: 'card' },
  { id: 'c007', date: d(8),  amount: -48000,  category: '식비',  counterpart: '배달의민족',         accountId: 'acc006', source: 'card' },
  { id: 'c008', date: d(9),  amount: -1450,   category: '교통',  counterpart: '서울 지하철',        accountId: 'acc006', source: 'card' },
  { id: 'c009', date: d(11), amount: -67000,  category: '쇼핑',  counterpart: '무신사 스토어',      accountId: 'acc006', source: 'card' },
  { id: 'c010', date: d(12), amount: -12000,  category: '식비',  counterpart: '편의점 GS25',        accountId: 'acc006', source: 'card' },
  { id: 'c011', date: d(14), amount: -9500,   category: '카페',  counterpart: '블루보틀 삼성점',    accountId: 'acc006', source: 'card' },
  { id: 'c012', date: d(15), amount: -38000,  category: '식비',  counterpart: '일식 저녁',          accountId: 'acc006', source: 'card' },
  { id: 'c013', date: d(18), amount: -89000,  category: '쇼핑',  counterpart: '쿠팡',               accountId: 'acc006', source: 'card' },
  { id: 'c014', date: d(20), amount: -4800,   category: '교통',  counterpart: '택시 카카오T',       accountId: 'acc006', source: 'card' },
  { id: 'c015', date: d(22), amount: -17000,  category: '식비',  counterpart: '분식집 저녁',        accountId: 'acc006', source: 'card' },
```

- [ ] **Step 4: 빌드 확인**

```bash
cd backend && npm test
```

Expected: 모든 테스트 PASS. `getInitialAccounts()`에서 acc001, acc002, acc006, acc007, promo_cma, promo_term_deposit, promo_savings 7개 반환 확인.

- [ ] **Step 5: 커밋**

```bash
git add backend/src/mockData.js
git commit -m "feat: mock data 재편 - 보유 3개 + 프로모 3개, 카드 거래내역 추가"
```

---

## Task 2: products.js — CMA 상품 추가

**Files:**
- Modify: `backend/src/products.js`

- [ ] **Step 1: investment 카테고리에 CMA 항목 추가**

`products.js`의 `PRODUCTS` 객체에 `investment` 키가 없으면 추가하고, CMA 상품을 넣는다. 파일 끝 `}` 닫기 전에 삽입.

```js
  // ── CMA ──
  investment: [
    {
      id: 'cma_mmf_01',
      name: 'iM CMA MMF형',
      category: 'CMA',
      baseRate: 4.75,
      maxRate: 4.75,
      period: '수시 입출금',
      minAmount: 0,
      maxAmount: null,
      highlights: [
        '연 4.75% (MMF 운용 기준, 변동 가능)',
        '하루만 맡겨도 이자 발생 (매일 정산)',
        '자유로운 입출금 · 이체 가능',
        '증권 계좌 연계로 주식·펀드 투자 가능',
      ],
      conditions: '만 14세 이상 개인 고객',
      earlyWithdrawal: '해당 없음 (수시 입출금)',
      tags: ['CMA', '단기', '고금리', '자유입출금'],
    },
  ],
```

- [ ] **Step 2: searchProducts에서 investment 타입 조회 가능한지 확인**

`products.js`의 `searchProducts` 함수가 `type: 'investment'`를 받을 때 위 항목을 반환하는지 확인. 함수가 `PRODUCTS[type]`으로 조회하면 자동 동작.

- [ ] **Step 3: 커밋**

```bash
git add backend/src/products.js
git commit -m "feat: products.js에 CMA MMF 상품 추가"
```

---

## Task 3: server.js — buildProductPitchData + room-greeting 확장

**Files:**
- Modify: `backend/src/server.js`

- [ ] **Step 1: PRODUCTS import 확인**

`server.js` 상단에 `import { PRODUCTS, searchProducts, getProductById } from './products.js'` 라인이 있는지 확인. 없으면 추가. (기존에 있으면 skip)

- [ ] **Step 2: buildProductPitchData 함수 추가**

`ROOM_GREETING_PROMPTS` 상수 바로 위에 삽입.

```js
// ──────────────────────────────────────────────
// 상품 방 — 개인화 피치 데이터 빌더
// ──────────────────────────────────────────────
function buildProductPitchData(acc, ctx) {
  // 상품 조회
  const allProducts = [
    ...(PRODUCTS.deposit || []),
    ...(PRODUCTS.savings || []),
    ...(PRODUCTS.investment || []),
  ]
  const product = allProducts.find((p) => p.id === acc.promoProductId) || null

  const checkingAcc = ctx.accounts.find((a) => a.type === 'checking' && !a.isPromo)
  const installAcc  = ctx.accounts.find((a) => a.type === 'installment_savings' && !a.isPromo)

  let personal = { baseAmount: 0, annualGain: 0, dailyGain: null, label: '' }
  let compareCurrentRate = 0.1
  let compareCurrentLabel = '현재 입출금'

  if (acc.type === 'cma') {
    const base = checkingAcc?.balance || 1000000
    personal = {
      baseAmount: base,
      dailyGain: Math.round(base * 0.0475 / 365),
      annualGain: Math.round(base * 0.0475),
      label: '주계좌 잔액 기준',
    }
    compareCurrentRate = 0.1
    compareCurrentLabel = '현재 입출금 (0.1%)'
  } else if (acc.type === 'term_deposit') {
    if (installAcc) {
      const daysLeft = Math.max(0, Math.ceil((new Date(installAcc.maturityDate) - new Date()) / 86400000))
      const projected = installAcc.balance + (installAcc.monthlyDeposit || 0) * Math.ceil(daysLeft / 30)
      personal = {
        baseAmount: projected,
        annualGain: Math.round(projected * (product?.baseRate || 3.2) / 100),
        dailyGain: null,
        label: '적금 만기 수령 예상액 기준',
      }
    } else {
      personal = { baseAmount: 10000000, annualGain: Math.round(10000000 * (product?.baseRate || 3.2) / 100), dailyGain: null, label: '1,000만원 기준' }
    }
    compareCurrentRate = 0.1
    compareCurrentLabel = '입출금 보관 (0.1%)'
  } else if (acc.type === 'savings') {
    personal = {
      baseAmount: 3000000,
      annualGain: Math.round(3000000 * (product?.baseRate || 2.5) / 100),
      dailyGain: null,
      label: '3개월 생활비 기준 권장액',
    }
    compareCurrentRate = 0.1
    compareCurrentLabel = '입출금 보관 (0.1%)'
  }

  const productRate = product?.baseRate || 3.0
  return {
    product: {
      id: product?.id,
      name: product?.name || acc.name,
      type: acc.type,
      interestRate: productRate,
      highlights: (product?.highlights || []).slice(0, 3),
      earlyWithdrawal: product?.earlyWithdrawal || '',
    },
    personal,
    compare: {
      current: {
        label: compareCurrentLabel,
        rate: compareCurrentRate,
        annualGain: Math.round(personal.baseAmount * compareCurrentRate / 100),
      },
      withProduct: {
        label: product?.name || acc.name,
        rate: productRate,
        annualGain: personal.annualGain,
      },
    },
  }
}
```

- [ ] **Step 3: ROOM_GREETING_PROMPTS에 프로모 전용 프롬프트 추가**

기존 `ROOM_GREETING_PROMPTS` 객체에 아래 키를 추가한다. 기존 `term_deposit`, `savings`, `cma` 키는 **보유 계좌** 대화방용이므로 건드리지 않는다. 신규 키는 `promo_` 접두사로 구분.

```js
// ROOM_GREETING_PROMPTS 객체 안에 추가
  promo_cma:          (bal) => `고객 주계좌 잔액이 ${bal}원입니다. CMA 안내 AI로서, 이 금액이 입출금에 방치될 때의 기회비용을 먼저 언급하고 CMA의 매일 이자 장점을 2문장 이내로 설명하라. 이모지 금지. 격식체.`,
  promo_term_deposit: (days, amt) => `고객 적금이 ${days}일 후 만기 예정이며 수령 예상액은 ${amt}원입니다. 정기예금 AI로서, 이 목돈을 정기예금에 넣으면 얼마나 더 불릴 수 있는지 2문장 이내로 안내하라. 이모지 금지. 격식체.`,
  promo_savings:      () => `비상금 통장 안내 AI로서, 예기치 못한 지출에 대비하는 비상금의 심리적 안도감을 먼저 공감하며 2문장 이내로 말을 걸어라. 이모지 금지. 격식체.`,
```

- [ ] **Step 4: /api/room-greeting 핸들러 수정**

`app.post('/api/room-greeting', ...)` 핸들러에서 `prompt`/`context` 결정 로직 앞에 isPromo 분기를 추가한다. 텍스트 스트리밍 완료 후 `product_pitch` UI 카드를 emit한다.

기존 `res.write(\`data: ${JSON.stringify({ type: 'done' })}\n\n\`)` 바로 **위에** 삽입:

```js
    // isPromo 계좌이면 product_pitch 카드 발송
    if (acc.isPromo) {
      const pitchData = buildProductPitchData(acc, ctx)
      res.write(`data: ${JSON.stringify({ type: 'ui_card', cardType: 'product_pitch', data: pitchData })}\n\n`)
    }
```

또한 프로모 계좌 진입 시 프롬프트/컨텍스트를 교체한다. `let prompt = ...` 줄 **이전**에:

```js
  // ── 프로모 계좌 (미가입 상품 방) 전용 프롬프트 ──
  if (acc.isPromo) {
    const checkingAcc = ctx.accounts.find((a) => a.type === 'checking' && !a.isPromo)
    const installAcc  = ctx.accounts.find((a) => a.type === 'installment_savings' && !a.isPromo)

    if (acc.type === 'cma') {
      const bal = (checkingAcc?.balance || 0).toLocaleString('ko-KR')
      prompt = ROOM_GREETING_PROMPTS.promo_cma(bal)
      context = `CMA 상품 안내`
    } else if (acc.type === 'term_deposit') {
      const daysLeft = installAcc?.maturityDate
        ? Math.max(0, Math.ceil((new Date(installAcc.maturityDate) - new Date()) / 86400000))
        : 0
      const projected = installAcc
        ? (installAcc.balance + (installAcc.monthlyDeposit || 0) * Math.ceil(daysLeft / 30)).toLocaleString('ko-KR')
        : '0'
      prompt = ROOM_GREETING_PROMPTS.promo_term_deposit(daysLeft, projected)
      context = `정기예금 상품 안내`
    } else if (acc.type === 'savings') {
      prompt = ROOM_GREETING_PROMPTS.promo_savings()
      context = `비상금통장 상품 안내`
    } else {
      prompt = ROOM_GREETING_PROMPTS.credit_card
      context = `신용카드 상품 안내`
    }
  }
```

이 블록은 기존 `let prompt = ROOM_GREETING_PROMPTS[acc.type]...` 줄 **이전**에 위치해야 한다. isPromo가 true면 아래 기존 로직이 override되지 않도록 `if (!acc.isPromo)` 조건으로 기존 로직을 감싼다.

전체 흐름:

```js
app.post('/api/room-greeting', async (req, res) => {
  const { sessionId = 'default', accountId } = req.body
  const session = getSession(sessionId)
  const ctx = getSessionCtx(session)

  const acc = ctx.accounts.find((a) => a.id === accountId)
  if (!acc) return res.status(404).json({ error: '계좌를 찾을 수 없습니다.' })

  let prompt
  let context

  if (acc.isPromo) {
    // 프로모 계좌: 상품 안내 전용 프롬프트
    const checkingAcc = ctx.accounts.find((a) => a.type === 'checking' && !a.isPromo)
    const installAcc  = ctx.accounts.find((a) => a.type === 'installment_savings' && !a.isPromo)

    if (acc.type === 'cma') {
      const bal = (checkingAcc?.balance || 0).toLocaleString('ko-KR')
      prompt = ROOM_GREETING_PROMPTS.promo_cma(bal)
      context = 'CMA 상품 안내'
    } else if (acc.type === 'term_deposit') {
      const daysLeft = installAcc?.maturityDate
        ? Math.max(0, Math.ceil((new Date(installAcc.maturityDate) - new Date()) / 86400000))
        : 0
      const projected = installAcc
        ? (installAcc.balance + (installAcc.monthlyDeposit || 0) * Math.ceil(daysLeft / 30)).toLocaleString('ko-KR')
        : '0'
      prompt = ROOM_GREETING_PROMPTS.promo_term_deposit(daysLeft, projected)
      context = '정기예금 상품 안내'
    } else if (acc.type === 'savings') {
      prompt = ROOM_GREETING_PROMPTS.promo_savings()
      context = '비상금통장 상품 안내'
    } else {
      // credit_card 등 기존 isPromo
      prompt = ROOM_GREETING_PROMPTS.credit_card
      context = `계좌명: ${acc.name}`
    }
  } else {
    // 기존 보유 계좌 로직 (변경 없음)
    const recentTxs = ctx.transactions
      .filter((t) => t.accountId === acc.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map((t) => `${t.counterpart} ${(t.amount > 0 ? '+' : '') + t.amount.toLocaleString('ko-KR')}원`)
      .join(', ')

    prompt = ROOM_GREETING_PROMPTS[acc.type] || ROOM_GREETING_PROMPTS.checking
    context = `계좌명: ${acc.name}, 잔액: ${acc.balance.toLocaleString('ko-KR')}원${recentTxs ? `, 최근 거래: ${recentTxs}` : ''}`

    // 만기 임박 (기존 로직 유지)
    if (acc.maturityDate && (acc.type === 'installment_savings' || acc.type === 'term_deposit')) {
      const greetNow = new Date()
      const daysLeft = Math.max(0, Math.ceil((new Date(acc.maturityDate) - greetNow) / 86400000))
      if (daysLeft <= 30 && daysLeft > 0) {
        const typeLabel = acc.type === 'installment_savings' ? '정기적금' : '정기예금'
        prompt = `${typeLabel}이 ${daysLeft}일 후 만기됩니다. 만기 수령금 활용 방안(재예치·운용·목돈 계획)에 대해 AI 매니저로서 먼저 물어보며 조언을 제안하라. 2문장 이내. 이모지 금지. 격식체.`
        context += `, 만기까지: ${daysLeft}일`
      }
    }

    // 입출금 계좌 월간 리포트 (기존 로직 유지)
    if (acc.type === 'checking') {
      const dayOfMonth = new Date().getDate()
      const txNow = ctx.transactions.filter((t) => t.accountId === acc.id)
      if (dayOfMonth <= 5) {
        const prev = new Date(); prev.setMonth(prev.getMonth() - 1)
        const prevStart = new Date(prev.getFullYear(), prev.getMonth(), 1).toISOString().slice(0, 10)
        const prevEnd = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).toISOString().slice(0, 10)
        const prevTxs = txNow.filter((t) => t.date >= prevStart && t.date <= prevEnd)
        const income = prevTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
        const expense = Math.abs(prevTxs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0))
        const net = income - expense
        context += `, 지난달 입금 ${income.toLocaleString('ko-KR')}원, 지출 ${expense.toLocaleString('ko-KR')}원, 순저축 ${net.toLocaleString('ko-KR')}원`
        prompt = '새 달이 시작됐습니다. 지난 달 재정 요약(입금·지출·순저축)을 바탕으로 이번 달을 응원하며 간결하게 리포트하라. 2문장. 이모지 금지. 격식체.'
      } else if (dayOfMonth >= 25) {
        const thisStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
        const thisTxs = txNow.filter((t) => t.date >= thisStart)
        const thisExpense = Math.abs(thisTxs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0))
        context += `, 이번달 지출 ${thisExpense.toLocaleString('ko-KR')}원`
        prompt = '월말이 다가옵니다. 이번 달 지출 현황과 잔액을 언급하며 월말 재정 정리를 돕겠다고 먼저 말을 걸어라. 2문장. 이모지 금지. 격식체.'
      }
    }
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: `${context}\n\n${prompt}` }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ type: 'text', delta: event.delta.text })}\n\n`)
      }
    }

    // 프로모 계좌이면 product_pitch 카드 추가 발송
    if (acc.isPromo) {
      const pitchData = buildProductPitchData(acc, ctx)
      res.write(`data: ${JSON.stringify({ type: 'ui_card', cardType: 'product_pitch', data: pitchData })}\n\n`)
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  } catch {
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  } finally {
    res.end()
  }
})
```

- [ ] **Step 5: 커밋**

```bash
git add backend/src/server.js
git commit -m "feat: server room-greeting 확장 - 프로모 계좌 개인화 인사 + product_pitch 카드"
```

---

## Task 4: AccountListScreen — computeProductHints + 콜드스타트 가드 + 힌트 카드

**Files:**
- Modify: `frontend/src/components/AccountListScreen.jsx`

- [ ] **Step 1: computeProductHints 함수 추가**

파일 상단의 `PRODUCT_SUGGESTIONS` 상수 아래(또는 제거 후 대체)에 추가.

```js
// 기존 PRODUCT_SUGGESTIONS 상수는 삭제한다 (이 함수가 대체)

function computeProductHints(accounts) {
  const ownedTypes = new Set(accounts.filter((a) => !a.isPromo).map((a) => a.type))
  const hints = []

  // CMA: 입출금 잔액 1,000,000원 이상이고 CMA 미보유
  if (!ownedTypes.has('cma')) {
    const checking = accounts.find((a) => a.type === 'checking' && !a.isPromo)
    const promoAcc = accounts.find((a) => a.type === 'cma' && a.isPromo)
    if (checking && promoAcc && checking.balance >= 1000000) {
      const dailyInterest = Math.round(checking.balance * 0.0475 / 365)
      hints.push({
        productType: 'cma',
        promoAccountId: promoAcc.id,
        hint: `주계좌에 ${checking.balance.toLocaleString('ko-KR')}원이 쉬고 있어요. CMA에 두면 오늘부터 +${dailyInterest.toLocaleString('ko-KR')}원/일.`,
        accentColor: '#EF4444',
        score: checking.balance,
      })
    }
  }

  // 정기예금: 적금 만기 180일 이하이고 예금 미보유
  if (!ownedTypes.has('term_deposit')) {
    const installment = accounts.find((a) => a.type === 'installment_savings' && !a.isPromo)
    const promoAcc = accounts.find((a) => a.type === 'term_deposit' && a.isPromo)
    if (installment && promoAcc && installment.maturityDate) {
      const daysToMaturity = Math.ceil((new Date(installment.maturityDate) - new Date()) / 86400000)
      if (daysToMaturity > 0 && daysToMaturity <= 180) {
        const projected = installment.balance + (installment.monthlyDeposit || 0) * Math.ceil(daysToMaturity / 30)
        const annualInterest = Math.round(projected * 0.042)
        hints.push({
          productType: 'term_deposit',
          promoAccountId: promoAcc.id,
          hint: `적금 만기 ${daysToMaturity}일 후 수령 예정 ${projected.toLocaleString('ko-KR')}원. 정기예금 넣으면 연 +${annualInterest.toLocaleString('ko-KR')}원.`,
          accentColor: '#8B5CF6',
          score: projected,
        })
      }
    }
  }

  // 비상금: savings 미보유 (무조건, 단 입출금 계좌 보유 전제)
  if (!ownedTypes.has('savings') && ownedTypes.has('checking')) {
    const promoAcc = accounts.find((a) => a.type === 'savings' && a.isPromo)
    if (promoAcc) {
      hints.push({
        productType: 'savings',
        promoAccountId: promoAcc.id,
        hint: '비상금 전용 통장이 없어요. 3개월치 생활비를 따로 모아두면 든든합니다.',
        accentColor: '#F59E0B',
        score: 500000,
      })
    }
  }

  // 콜드스타트 방지: 스코어 높은 것 1개만 반환
  return hints.sort((a, b) => b.score - a.score).slice(0, 1)
}
```

- [ ] **Step 2: 콜드스타트 가드 — 프로모 계좌 표시 조건 추가**

컴포넌트 본문 상단 `showSuggestions` 계산 코드를 제거하고 아래로 교체:

```js
// 콜드스타트 가드: 저축·투자 계좌 1개 이상 보유 시에만 프로모 방 표시
const SAVINGS_TYPES = new Set(['installment_savings', 'term_deposit', 'savings', 'cma'])
const ownedSavingsCount = accounts.filter((a) => !a.isPromo && SAVINGS_TYPES.has(a.type)).length
const showPromoRooms = ownedSavingsCount >= 1

const productHints = computeProductHints(accounts)
```

- [ ] **Step 3: 계좌 목록 렌더링 수정**

기존 `accounts.forEach((acc, idx) => {...})` 루프 내부에서 프로모 계좌 필터링을 추가하고, 저축·투자 섹션 뒤에 힌트 카드를 삽입한다.

```js
accounts.forEach((acc, idx) => {
  // showPromoRooms가 false이면 프로모 계좌는 목록에서 숨김 (콜드스타트)
  if (acc.isPromo && !showPromoRooms) return

  const section = BANKING_TYPES.has(acc.type) ? 'banking' : 'savings'
  if (section !== lastSection) {
    lastSection = section
    items.push(
      <div key={`section-${section}`} className="account-section-label">
        {section === 'banking' ? '입출금 · 카드' : '저축 · 투자'}
      </div>
    )
  }
  // ... 기존 버튼 렌더링 코드 유지 ...

  // 저축·투자 섹션 마지막 비-프로모 계좌 뒤에 힌트 카드 삽입
  const isLastOwnedSavings =
    section === 'savings' &&
    !acc.isPromo &&
    (() => {
      const remaining = accounts.slice(idx + 1)
      return !remaining.some((a) => !a.isPromo && SAVINGS_TYPES.has(a.type))
    })()

  if (isLastOwnedSavings && productHints.length > 0) {
    const hint = productHints[0]
    items.push(
      <button
        key="product-hint"
        className="product-hint-card"
        style={{ borderColor: hint.accentColor + '26', backgroundColor: hint.accentColor + '0D' }}
        onClick={() => onEnterRoom(hint.promoAccountId)}
      >
        <span className="product-hint-dot" style={{ background: hint.accentColor, boxShadow: `0 0 5px ${hint.accentColor}` }} />
        <span className="product-hint-text">{hint.hint}</span>
        <span className="product-hint-arrow" style={{ color: hint.accentColor }}>›</span>
      </button>
    )
  }
})
```

- [ ] **Step 4: 기존 product-suggestion-section 렌더링 제거**

파일 하단의 `{showSuggestions && (<div className="product-suggestion-section">...</div>)}` 블록 전체를 삭제한다.

- [ ] **Step 5: 브라우저 확인**

`npm run dev` 실행 후 브라우저에서 확인:
- 계좌 목록에 힌트 카드 1개 표시 (CMA 또는 정기예금)
- 프로모 계좌(iM CMA, iM 정기예금, iM 비상금통장)가 저축·투자 섹션에 표시됨
- 힌트 카드 탭 시 해당 프로모 방으로 이동

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/components/AccountListScreen.jsx
git commit -m "feat: AccountListScreen - 맥락 기반 힌트 카드 + 콜드스타트 가드"
```

---

## Task 5: styles.css — 힌트 카드 스타일 추가

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: product-hint-card 스타일 추가**

파일에서 `.product-suggestion-section` 관련 스타일을 찾아 **대체**한다. 없으면 `.account-list-items` 스타일 블록 아래에 추가.

```css
/* ──────────────────────────────────────────────
   Product Hint Card (맥락 기반 상품 가치 소구)
   ────────────────────────────────────────────── */
.product-hint-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  background: transparent;       /* inline style로 동적 배경 */
  border: 1px solid transparent; /* inline style로 동적 테두리 */
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.15s ease;
}
.product-hint-card:active { opacity: 0.7; }

.product-hint-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.product-hint-text {
  flex: 1;
  font-size: 11px;
  color: #94A3B8;
  line-height: 1.5;
}

.product-hint-arrow {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.7;
  margin-top: -1px;
}
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/styles.css
git commit -m "style: product-hint-card 스타일 추가"
```

---

## Task 6: ProductPitchCard 컴포넌트

**Files:**
- Create: `frontend/src/components/ProductPitchCard.jsx`
- Modify: `frontend/src/styles.css` (ProductPitchCard 스타일 추가)

- [ ] **Step 1: ProductPitchCard.jsx 생성**

```jsx
// frontend/src/components/ProductPitchCard.jsx
const TYPE_ICONS = {
  cma: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 8.5 11 13 14.5 20 7"/>
      <polyline points="15 7 20 7 20 12"/>
    </svg>
  ),
  term_deposit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  ),
  savings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
}

const TYPE_COLORS = {
  cma: '#EF4444',
  term_deposit: '#8B5CF6',
  savings: '#F59E0B',
}

export default function ProductPitchCard({ data }) {
  const { product, personal, compare } = data
  const color = TYPE_COLORS[product.type] || '#00C9A7'
  const Icon = TYPE_ICONS[product.type]

  return (
    <div className="pitch-card ui-card">
      {/* 헤더 */}
      <div className="pitch-header">
        <div className="pitch-icon" style={{ background: color + '1A', color }}>
          {Icon}
        </div>
        <div>
          <div className="pitch-name">{product.name}</div>
          <div className="pitch-rate" style={{ color }}>연 {product.interestRate.toFixed(2)}%</div>
        </div>
      </div>

      {/* 주요 특징 */}
      {product.highlights.length > 0 && (
        <ul className="pitch-highlights">
          {product.highlights.map((h, i) => (
            <li key={i} className="pitch-highlight-item">{h}</li>
          ))}
        </ul>
      )}

      <div className="pitch-divider" />

      {/* 개인화 수익 하이라이트 */}
      <div className="pitch-personal" style={{ borderColor: color + '33', background: color + '0D' }}>
        <span className="pitch-personal-label">{personal.label}</span>
        <div className="pitch-personal-numbers">
          {personal.dailyGain !== null && (
            <span className="pitch-personal-daily" style={{ color }}>
              +{personal.dailyGain.toLocaleString('ko-KR')}원/일
            </span>
          )}
          <span className="pitch-personal-annual" style={{ color }}>
            연 +{personal.annualGain.toLocaleString('ko-KR')}원
          </span>
        </div>
      </div>

      {/* 비교 */}
      <div className="pitch-compare">
        <div className="pitch-compare-item pitch-compare-current">
          <div className="pitch-compare-label">{compare.current.label}</div>
          <div className="pitch-compare-rate">{compare.current.rate.toFixed(1)}%</div>
          <div className="pitch-compare-gain">연 +{compare.current.annualGain.toLocaleString('ko-KR')}원</div>
        </div>
        <div className="pitch-compare-arrow">vs</div>
        <div className="pitch-compare-item pitch-compare-winner" style={{ borderColor: color + '4D' }}>
          <div className="pitch-compare-label">{compare.withProduct.label}</div>
          <div className="pitch-compare-rate" style={{ color }}>{compare.withProduct.rate.toFixed(2)}%</div>
          <div className="pitch-compare-gain" style={{ color }}>연 +{compare.withProduct.annualGain.toLocaleString('ko-KR')}원</div>
        </div>
      </div>

      {product.earlyWithdrawal && (
        <div className="pitch-footnote">{product.earlyWithdrawal}</div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: styles.css에 ProductPitchCard 스타일 추가**

파일 끝 또는 `.pitch-` 스타일이 없는 곳에 추가:

```css
/* ──────────────────────────────────────────────
   ProductPitchCard
   ────────────────────────────────────────────── */
.pitch-card { padding: 16px; }

.pitch-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.pitch-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pitch-name { font-size: 13px; font-weight: 700; color: #F1F5F9; }
.pitch-rate { font-size: 12px; font-weight: 700; margin-top: 1px; }

.pitch-highlights {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pitch-highlight-item {
  font-size: 11px;
  color: #94A3B8;
  padding-left: 12px;
  position: relative;
  line-height: 1.4;
}
.pitch-highlight-item::before {
  content: '·';
  position: absolute;
  left: 2px;
  color: #475569;
}

.pitch-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0 0 12px; }

.pitch-personal {
  border: 1px solid;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.pitch-personal-label { font-size: 10px; color: #64748B; }
.pitch-personal-numbers { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.pitch-personal-daily { font-size: 13px; font-weight: 800; }
.pitch-personal-annual { font-size: 11px; font-weight: 600; }

.pitch-compare {
  display: flex;
  gap: 6px;
  align-items: stretch;
  margin-bottom: 10px;
}
.pitch-compare-item {
  flex: 1;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pitch-compare-current {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
}
.pitch-compare-winner {
  background: rgba(255,255,255,0.03);
  border: 1px solid;
}
.pitch-compare-arrow {
  display: flex;
  align-items: center;
  font-size: 10px;
  color: #475569;
  flex-shrink: 0;
}
.pitch-compare-label { font-size: 9px; color: #64748B; }
.pitch-compare-rate { font-size: 14px; font-weight: 800; color: #94A3B8; }
.pitch-compare-gain { font-size: 10px; font-weight: 600; color: #64748B; }

.pitch-footnote {
  font-size: 10px;
  color: #475569;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/ProductPitchCard.jsx frontend/src/styles.css
git commit -m "feat: ProductPitchCard 컴포넌트 + 스타일"
```

---

## Task 7: Message.jsx — product_pitch 라우팅

**Files:**
- Modify: `frontend/src/components/Message.jsx`

- [ ] **Step 1: import 추가**

파일 상단 import 목록에 추가:

```js
import ProductPitchCard from './ProductPitchCard.jsx'
```

- [ ] **Step 2: ui_card 분기에 product_pitch 추가**

`if (msg.type === 'ui_card')` 블록 내부, 기존 cardType 분기들 다음에 추가:

```js
    if (cardType === 'product_pitch') return <ProductPitchCard data={data} />
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/Message.jsx
git commit -m "feat: Message.jsx에 product_pitch 카드 라우팅 추가"
```

---

## Task 8: App.jsx — fetchRoomGreeting ui_card 처리

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: fetchRoomGreeting SSE에서 ui_card 이벤트 처리 추가**

`fetchRoomGreeting` 함수 내부 SSE 파싱 루프에서 `data.type === 'done'` 분기 아래에 추가:

```js
            } else if (data.type === 'ui_card') {
              // 상품 방 room-greeting에서 발송한 ProductPitchCard 등
              setRoomMessages((prev) => ({
                ...prev,
                [accountId]: [
                  ...(prev[accountId] || []).map((m) =>
                    m.id === greetingId ? { ...m, streaming: false } : m
                  ),
                  {
                    id: 'greeting_card_' + Date.now(),
                    type: 'ui_card',
                    cardType: data.cardType,
                    data: data.data,
                  },
                ],
              }))
            }
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/App.jsx
git commit -m "feat: fetchRoomGreeting에서 ui_card 이벤트 처리 추가"
```

---

## Task 9: 테스트

**Files:**
- Modify: `backend/src/tests/core.test.js`

- [ ] **Step 1: 프로모 계좌 구조 테스트 추가**

기존 테스트 파일 끝에 추가:

```js
// ── Test 4: 프로모 계좌 구조 검증 ─────────────────────────────────────────────
describe('promo accounts', () => {
  it('getInitialAccounts에 프로모 계좌 3개가 있어야 한다', () => {
    const accounts = getInitialAccounts()
    const promos = accounts.filter((a) => a.isPromo === true)
    expect(promos.length).toBeGreaterThanOrEqual(3)
  })

  it('프로모 계좌는 type별로 cma, term_deposit, savings를 포함해야 한다', () => {
    const accounts = getInitialAccounts()
    const promoTypes = new Set(accounts.filter((a) => a.isPromo).map((a) => a.type))
    expect(promoTypes.has('cma')).toBe(true)
    expect(promoTypes.has('term_deposit')).toBe(true)
    expect(promoTypes.has('savings')).toBe(true)
  })

  it('프로모 계좌는 promoProductId 또는 isPromo: true를 가져야 한다', () => {
    const accounts = getInitialAccounts()
    const promos = accounts.filter((a) => a.isPromo === true)
    promos.forEach((a) => {
      expect(a.isPromo).toBe(true)
    })
  })

  it('acc001 주계좌 잔액이 CMA 힌트 임계값(1,000,000원) 이상이어야 한다', () => {
    const accounts = getInitialAccounts()
    const checking = accounts.find((a) => a.id === 'acc001')
    expect(checking.balance).toBeGreaterThanOrEqual(1000000)
  })

  it('acc002 적금 maturityDate가 180일 이내여야 한다 (정기예금 힌트 조건)', () => {
    const accounts = getInitialAccounts()
    const installment = accounts.find((a) => a.id === 'acc002')
    const daysToMaturity = Math.ceil((new Date(installment.maturityDate) - new Date()) / 86400000)
    expect(daysToMaturity).toBeGreaterThan(0)
    expect(daysToMaturity).toBeLessThanOrEqual(180)
  })
})
```

- [ ] **Step 2: 테스트 실행**

```bash
cd backend && npm test
```

Expected: 모든 테스트 PASS (기존 + 신규 4개).

- [ ] **Step 3: 커밋**

```bash
git add backend/src/tests/core.test.js
git commit -m "test: 프로모 계좌 구조 검증 테스트 추가"
```

---

## 최종 확인

- [ ] 프론트엔드 개발 서버 실행 (`npm run dev`)
- [ ] 계좌 목록에서 힌트 카드 1개 확인 (CMA 또는 정기예금)
- [ ] 힌트 카드 탭 → CMA 방 진입 → AI 인사말 스트리밍 → ProductPitchCard 자동 렌더 확인
- [ ] iM 정기예금 방 직접 탭 → 동일 흐름 확인
- [ ] 입출금 계좌만 있는 경우 프로모 방 미표시 확인 (콜드스타트 가드)
- [ ] 기존 정기적금 방, 주계좌 방 기능 이상 없음 확인
