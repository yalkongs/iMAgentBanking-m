# Product Enrollment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로모 계좌방(CMA, 정기예금, 비상금통장)에서 AI 소개 후 모달+채팅 하이브리드 플로우로 실제 상품 가입 절차를 완료하고, 프로모 방이 실계좌 방으로 변신한다.

**Architecture:** 프론트엔드 `enrollmentState` 상태 머신이 단계를 관리한다. 모달은 한 번에 하나의 입력만 받고, 모달 전환 사이에 스크립트 AI 메시지가 채팅에 주입된다. 백엔드는 `POST /api/enroll` 하나로 계좌 생성·입금·프로모 제거를 처리한다. Claude 응답 지연이 없어 UX가 안정적이다.

**Tech Stack:** React 18 (useState, useRef, useEffect), Express ESM, Vitest

---

## File Structure

| 파일 | 역할 |
|---|---|
| `backend/src/mockData.js` | `createAccount(productId, enrollData)` 함수 추가 |
| `backend/src/server.js` | `POST /api/enroll` 엔드포인트 추가, `buildProductPitchData`에 `productId` 추가 |
| `backend/src/tests/core.test.js` | `createAccount` 테스트 3건 추가 |
| `frontend/src/components/EnrollmentModal.jsx` | 신규 — 5단계 모달 렌더러 |
| `frontend/src/App.jsx` | `enrollmentState` + 4개 핸들러 추가, EnrollmentModal 렌더 |
| `frontend/src/components/AccountRoom.jsx` | `onStartEnrollment` prop 수신 → Message에 전달 |
| `frontend/src/components/Message.jsx` | `onStartEnrollment` prop → ProductPitchCard 전달 |
| `frontend/src/components/ProductPitchCard.jsx` | "가입하기" 버튼 추가 |
| `frontend/src/styles.css` | EnrollmentModal 스타일 추가 |

---

## Task 1: Backend — createAccount() 함수

**Files:**
- Modify: `backend/src/mockData.js` (끝 부분에 함수 추가)
- Test: `backend/src/tests/core.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/src/tests/core.test.js` 끝에 추가:

```js
// ── Test 8: createAccount ─────────────────────────────────────────────────────
import { createAccount } from '../mockData.js'

describe('createAccount', () => {
  it('promo_cma → id:cma_001, type:cma, interestRate:4.75', () => {
    const acc = createAccount('promo_cma', { amount: 500000, fromAccountId: 'acc001' })
    expect(acc.id).toBe('cma_001')
    expect(acc.type).toBe('cma')
    expect(acc.isPromo).toBeUndefined()
    expect(acc.interestRate).toBe(4.75)
    expect(acc.accountNo).toBeTruthy()
  })

  it('promo_term_deposit → type:term_deposit, maturityDate가 term개월 후', () => {
    const acc = createAccount('promo_term_deposit', {
      amount: 1000000, fromAccountId: 'acc001', term: 12, maturityAction: 'reinvest',
    })
    expect(acc.type).toBe('term_deposit')
    expect(acc.term).toBe(12)
    expect(acc.maturityAction).toBe('reinvest')
    const diffMonths =
      (new Date(acc.maturityDate).getFullYear() - new Date().getFullYear()) * 12 +
      (new Date(acc.maturityDate).getMonth() - new Date().getMonth())
    expect(diffMonths).toBe(12)
  })

  it('promo_savings → id:savings_emg_001, type:savings', () => {
    const acc = createAccount('promo_savings', { amount: 0 })
    expect(acc.id).toBe('savings_emg_001')
    expect(acc.type).toBe('savings')
    expect(acc.isPromo).toBeUndefined()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/backend"
npx vitest run src/tests/core.test.js 2>&1 | tail -20
```
Expected: FAIL — "createAccount is not a function" 또는 import 오류

- [ ] **Step 3: createAccount() 함수 구현**

`backend/src/mockData.js` 끝에 추가 (`savingsProducts` 이후):

```js
// ──────────────────────────────────────────────
// 신규 계좌 생성 (상품 가입)
// ──────────────────────────────────────────────
export function createAccount(productId, enrollData) {
  const now = new Date()
  const accountNo = () =>
    '503-' + String(Math.floor(Math.random() * 90) + 10) + '-' + String(Math.floor(Math.random() * 9000000) + 1000000)

  if (productId === 'promo_cma') {
    return {
      id: 'cma_001',
      name: 'iM CMA',
      balance: 0,
      type: 'cma',
      bank: 'iM뱅크증권',
      accountNo: accountNo(),
      interestRate: 4.75,
      openDate: now.toISOString().slice(0, 10),
    }
  }

  if (productId === 'promo_term_deposit') {
    const maturityDate = new Date(now)
    maturityDate.setMonth(maturityDate.getMonth() + (enrollData.term || 12))
    return {
      id: 'term_001',
      name: 'iM 정기예금',
      balance: 0,
      type: 'term_deposit',
      bank: 'iM뱅크',
      accountNo: accountNo(),
      interestRate: 4.20,
      openDate: now.toISOString().slice(0, 10),
      maturityDate: maturityDate.toISOString().slice(0, 10),
      term: enrollData.term || 12,
      maturityAction: enrollData.maturityAction || 'withdraw',
    }
  }

  if (productId === 'promo_savings') {
    return {
      id: 'savings_emg_001',
      name: 'iM 비상금통장',
      balance: 0,
      type: 'savings',
      bank: 'iM뱅크',
      accountNo: accountNo(),
      interestRate: 2.10,
      openDate: now.toISOString().slice(0, 10),
      tag: 'emergency',
    }
  }

  return null
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/backend"
npx vitest run src/tests/core.test.js 2>&1 | tail -10
```
Expected: PASS — 모든 테스트 통과 (기존 + 신규 3건)

- [ ] **Step 5: 커밋**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m"
git add backend/src/mockData.js backend/src/tests/core.test.js
git commit -m "feat: createAccount() 함수 추가 (CMA/정기예금/비상금)"
```

---

## Task 2: Backend — POST /api/enroll 엔드포인트

**Files:**
- Modify: `backend/src/server.js`

- [ ] **Step 1: import 추가**

`backend/src/server.js` 상단 import 줄에 `createAccount` 추가. 현재:
```js
import { getInitialAccounts, getInitialTransactions } from './mockData.js'
```
변경:
```js
import { getInitialAccounts, getInitialTransactions, createAccount } from './mockData.js'
```

- [ ] **Step 2: buildProductPitchData에 productId 추가**

`buildProductPitchData` 함수의 return 문 (server.js:989 근처) 수정.

현재:
```js
  return {
    product: {
      id: product?.id,
      name: product?.name || acc.name,
      type: acc.type,
```
변경:
```js
  return {
    productId: acc.id,
    product: {
      id: product?.id,
      name: product?.name || acc.name,
      type: acc.type,
```

- [ ] **Step 3: POST /api/enroll 엔드포인트 추가**

`backend/src/server.js`에서 `POST /api/rebuild-context` 엔드포인트 바로 뒤 (약 line 470)에 추가:

```js
// ──────────────────────────────────────────────
// POST /api/enroll — 상품 가입 확정
// ──────────────────────────────────────────────
app.post('/api/enroll', (req, res) => {
  const { sessionId = 'default', productId, enrollData = {} } = req.body
  if (!productId) return res.status(400).json({ ok: false, error: 'productId required' })

  const session = getSession(sessionId)

  // 이미 가입된 경우 (중복 방지)
  if (!session.accounts.some((a) => a.id === productId)) {
    return res.status(409).json({ ok: false, error: '이미 가입되었거나 존재하지 않는 상품입니다.' })
  }

  // 신규 계좌 생성
  const newAccount = createAccount(productId, enrollData)
  if (!newAccount) return res.status(400).json({ ok: false, error: '지원하지 않는 상품입니다.' })

  // 입금 처리 (amount > 0인 경우)
  const amount = Number(enrollData.amount) || 0
  if (amount > 0 && enrollData.fromAccountId) {
    const fromAcc = session.accounts.find((a) => a.id === enrollData.fromAccountId)
    if (fromAcc) {
      if (fromAcc.balance < amount) {
        return res.status(400).json({ ok: false, error: '잔액이 부족합니다.' })
      }
      fromAcc.balance -= amount
      newAccount.balance = amount

      // 거래내역 기록
      const txId = 'tx_enroll_' + Date.now()
      session.transactions.unshift({
        id: txId,
        date: new Date().toISOString().slice(0, 10),
        amount: -amount,
        category: '이체',
        counterpart: newAccount.name,
        accountId: enrollData.fromAccountId,
        source: 'account',
      })
      session.transactions.unshift({
        id: txId + '_in',
        date: new Date().toISOString().slice(0, 10),
        amount: amount,
        category: '입금',
        counterpart: fromAcc.name,
        accountId: newAccount.id,
        source: 'account',
      })
    }
  }

  // 프로모 계좌 제거 + 신규 계좌 추가
  session.accounts = session.accounts.filter((a) => a.id !== productId)
  session.accounts.push(newAccount)

  res.json({ ok: true, account: newAccount })
})
```

- [ ] **Step 4: 백엔드 서버 재시작 + 수동 확인**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/backend"
npm run dev &
sleep 2
curl -s -X POST http://localhost:3001/api/enroll \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"test_plan","productId":"promo_cma","enrollData":{"amount":500000,"fromAccountId":"acc001"}}' | python3 -m json.tool
```
Expected: `{"ok": true, "account": {"id": "cma_001", "type": "cma", ...}}`

```bash
# 중복 가입 방지 확인
curl -s -X POST http://localhost:3001/api/enroll \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"test_plan","productId":"promo_cma","enrollData":{}}' | python3 -m json.tool
```
Expected: `{"ok": false, "error": "이미 가입되었거나 존재하지 않는 상품입니다."}`

```bash
# 테스트 서버 종료
kill %1 2>/dev/null || true
```

- [ ] **Step 5: 커밋**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m"
git add backend/src/server.js
git commit -m "feat: POST /api/enroll 엔드포인트 + buildProductPitchData에 productId 추가"
```

---

## Task 3: Frontend — EnrollmentModal 컴포넌트

**Files:**
- Create: `frontend/src/components/EnrollmentModal.jsx`

이 컴포넌트는 `enrollmentState`의 `step`에 따라 올바른 입력 UI를 렌더링한다.

- [ ] **Step 1: EnrollmentModal.jsx 파일 생성**

`frontend/src/components/EnrollmentModal.jsx` 신규 생성:

```jsx
import { useState } from 'react'

// ── 단계 표시 dot indicator ──────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="enroll-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`enroll-dot${i < current ? ' enroll-dot--done' : i === current - 1 ? ' enroll-dot--active' : ''}`} />
      ))}
    </div>
  )
}

// ── Step 1: 전화번호 확인 ────────────────────────────────
function PhoneConfirmStep({ onComplete }) {
  return (
    <div className="enroll-step">
      <p className="enroll-step-desc">등록된 전화번호로 본인을 확인합니다.</p>
      <div className="enroll-phone-display">010-****-1234</div>
      <p className="enroll-step-hint">위 번호로 인증번호를 발송합니다.</p>
      <button className="enroll-btn-primary" onClick={() => onComplete({})}>
        확인
      </button>
    </div>
  )
}

// ── Step 2: SMS 인증번호 입력 ────────────────────────────
function SmsVerifyStep({ onComplete }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit() {
    if (code === '123456') {
      onComplete({})
    } else {
      setError(true)
      setCode('')
    }
  }

  return (
    <div className="enroll-step">
      <p className="enroll-step-desc">문자로 받은 인증번호를 입력해주세요.</p>
      <input
        className={`enroll-code-input${error ? ' enroll-code-input--error' : ''}`}
        type="tel"
        inputMode="numeric"
        maxLength={6}
        placeholder="6자리 입력"
        value={code}
        autoFocus
        onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(false) }}
        onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleSubmit()}
      />
      {error && <p className="enroll-step-error">인증번호가 올바르지 않아요. 다시 확인해주세요.</p>}
      <p className="enroll-step-hint">테스트용 인증번호: 123456</p>
      <button
        className="enroll-btn-primary"
        disabled={code.length !== 6}
        onClick={handleSubmit}
      >
        확인
      </button>
    </div>
  )
}

// ── Step 3a: 입금 설정 (CMA / 비상금) ───────────────────
function FundStep({ accounts, onComplete }) {
  const checkingAccounts = accounts.filter((a) => !a.isPromo && a.balance > 0 && a.type !== 'debit_card' && a.type !== 'credit_card')
  const [fromAccountId, setFromAccountId] = useState(checkingAccounts[0]?.id || '')
  const [amountStr, setAmountStr] = useState('')

  const fromAcc = accounts.find((a) => a.id === fromAccountId)
  const maxAmount = fromAcc?.balance || 0
  const amount = Number(amountStr.replace(/,/g, '')) || 0
  const insufficient = amount > maxAmount

  function handleSkip() {
    onComplete({ amount: 0, fromAccountId: null })
  }

  function handleSubmit() {
    onComplete({ amount, fromAccountId })
  }

  return (
    <div className="enroll-step">
      <p className="enroll-step-desc">첫 입금 계좌와 금액을 설정해주세요.</p>
      <label className="enroll-field-label">출금 계좌</label>
      <select
        className="enroll-select"
        value={fromAccountId}
        onChange={(e) => setFromAccountId(e.target.value)}
      >
        {checkingAccounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.balance.toLocaleString('ko-KR')}원)
          </option>
        ))}
      </select>
      <label className="enroll-field-label">입금 금액</label>
      <input
        className={`enroll-amount-input${insufficient ? ' enroll-code-input--error' : ''}`}
        type="tel"
        inputMode="numeric"
        placeholder="0"
        value={amountStr}
        onChange={(e) => setAmountStr(e.target.value.replace(/[^\d]/g, ''))}
      />
      {insufficient && <p className="enroll-step-error">잔액이 부족해요. ({maxAmount.toLocaleString('ko-KR')}원 이하)</p>}
      <button
        className="enroll-btn-primary"
        disabled={insufficient || !fromAccountId}
        onClick={handleSubmit}
      >
        개설하기
      </button>
      <button className="enroll-btn-skip" onClick={handleSkip}>
        나중에 입금할게요
      </button>
    </div>
  )
}

// ── Step 3b: 예치 조건 설정 (정기예금) ──────────────────
function TermStep({ accounts, onComplete }) {
  const TERMS = [6, 12, 24]
  const checkingAccounts = accounts.filter((a) => !a.isPromo && a.balance > 0 && a.type !== 'debit_card' && a.type !== 'credit_card')
  const [term, setTerm] = useState(12)
  const [amountStr, setAmountStr] = useState('')
  const [maturityAction, setMaturityAction] = useState('reinvest')
  const [fromAccountId, setFromAccountId] = useState(checkingAccounts[0]?.id || '')

  const fromAcc = accounts.find((a) => a.id === fromAccountId)
  const maxAmount = fromAcc?.balance || 0
  const amount = Number(amountStr.replace(/,/g, '')) || 0
  const insufficient = amount > maxAmount

  // 만기 수령 예상액 계산
  const maturityAmt = amount > 0 ? Math.floor(amount * (1 + 0.042 * term / 12)) : 0

  function handleSubmit() {
    if (amount === 0 || !fromAccountId) return
    onComplete({ term, amount, maturityAction, fromAccountId })
  }

  return (
    <div className="enroll-step">
      <p className="enroll-step-desc">예치 기간과 금액을 설정해주세요.</p>

      <label className="enroll-field-label">예치 기간</label>
      <div className="enroll-chip-group">
        {TERMS.map((t) => (
          <button
            key={t}
            className={`enroll-chip${term === t ? ' enroll-chip--active' : ''}`}
            onClick={() => setTerm(t)}
          >
            {t}개월
          </button>
        ))}
      </div>

      <label className="enroll-field-label">출금 계좌</label>
      <select className="enroll-select" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
        {checkingAccounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.balance.toLocaleString('ko-KR')}원)
          </option>
        ))}
      </select>

      <label className="enroll-field-label">예치 금액</label>
      <input
        className={`enroll-amount-input${insufficient ? ' enroll-code-input--error' : ''}`}
        type="tel"
        inputMode="numeric"
        placeholder="0"
        value={amountStr}
        onChange={(e) => setAmountStr(e.target.value.replace(/[^\d]/g, ''))}
      />
      {insufficient && <p className="enroll-step-error">잔액이 부족해요. ({maxAmount.toLocaleString('ko-KR')}원 이하)</p>}
      {maturityAmt > 0 && (
        <p className="enroll-maturity-preview">
          만기 수령 예상: <strong>{maturityAmt.toLocaleString('ko-KR')}원</strong>
        </p>
      )}

      <label className="enroll-field-label">만기 처리</label>
      <div className="enroll-chip-group">
        <button
          className={`enroll-chip${maturityAction === 'reinvest' ? ' enroll-chip--active' : ''}`}
          onClick={() => setMaturityAction('reinvest')}
        >
          재예치
        </button>
        <button
          className={`enroll-chip${maturityAction === 'withdraw' ? ' enroll-chip--active' : ''}`}
          onClick={() => setMaturityAction('withdraw')}
        >
          해지 입금
        </button>
      </div>

      <button
        className="enroll-btn-primary"
        disabled={amount === 0 || !fromAccountId || insufficient}
        onClick={handleSubmit}
      >
        다음
      </button>
    </div>
  )
}

// ── Step 4: 공인인증서 시뮬레이션 (정기예금만) ──────────
function CertStep({ onComplete }) {
  const [status, setStatus] = useState('idle') // idle | loading | done

  function handleCert() {
    setStatus('loading')
    setTimeout(() => {
      setStatus('done')
      setTimeout(() => onComplete({}), 500)
    }, 2000)
  }

  return (
    <div className="enroll-step enroll-step--cert">
      <p className="enroll-step-desc">공인인증서로 최종 확인이 필요합니다.</p>
      {status === 'idle' && (
        <button className="enroll-btn-primary" onClick={handleCert}>
          인증하기
        </button>
      )}
      {status === 'loading' && (
        <div className="enroll-cert-loading">
          <div className="enroll-cert-spinner" />
          <p>인증 중...</p>
        </div>
      )}
      {status === 'done' && (
        <div className="enroll-cert-done">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00C9A7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <p>인증 완료</p>
        </div>
      )}
    </div>
  )
}

// ── 메인 EnrollmentModal ─────────────────────────────────
const TOTAL_STEPS = {
  promo_cma: 3,
  promo_term_deposit: 4,
  promo_savings: 3,
}

export default function EnrollmentModal({ state, accounts, onStepComplete, onDismiss }) {
  const { productId, step } = state
  const total = TOTAL_STEPS[productId] || 3

  // 현재 step에 맞는 컴포넌트 반환
  function renderStep() {
    // Step 1: 모든 상품 공통 — 전화번호 확인
    if (step === 1) return <PhoneConfirmStep onComplete={onStepComplete} />

    // Step 2: 모든 상품 공통 — SMS 인증
    if (step === 2) return <SmsVerifyStep onComplete={onStepComplete} />

    // Step 3: 상품별 분기
    if (step === 3 && productId === 'promo_term_deposit') {
      return <TermStep accounts={accounts} onComplete={onStepComplete} />
    }
    if (step === 3) {
      return <FundStep accounts={accounts} onComplete={onStepComplete} />
    }

    // Step 4: 정기예금만 — 공인인증서
    if (step === 4) return <CertStep onComplete={onStepComplete} />

    return null
  }

  return (
    <div className="enroll-overlay" onClick={(e) => { if (e.target === e.currentTarget) onDismiss() }}>
      <div className="enroll-modal">
        <div className="enroll-modal-header">
          <StepDots current={step} total={total} />
          <button className="enroll-close-btn" onClick={onDismiss} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {renderStep()}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m"
git add frontend/src/components/EnrollmentModal.jsx
git commit -m "feat: EnrollmentModal 컴포넌트 (5단계 — 전화확인/SMS/입금/기간/공인인증서)"
```

---

## Task 4: Frontend — App.jsx 상태 머신

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: import + 상수 추가**

`frontend/src/App.jsx` 상단 import 섹션에 추가:

```js
import EnrollmentModal from './components/EnrollmentModal.jsx'
```

`QUICK_CATEGORIES` 상수 선언 바로 위에 추가:

```js
// ── 가입 단계별 사이 메시지 (단계 완료 후 → 다음 모달 전) ──
const ENROLL_MESSAGES = {
  promo_cma: {
    1: '인증번호를 보냈어요. 문자 확인해주세요.',
    2: '확인됐어요! 첫 입금액을 정해볼게요.',
  },
  promo_term_deposit: {
    1: '인증번호를 보냈어요.',
    2: '확인됐어요! 예치 조건을 설정해볼게요.',
    3: '마지막으로 공인인증서 확인이 필요해요.',
  },
  promo_savings: {
    1: '인증번호를 보냈어요.',
    2: '확인됐어요! 첫 비상금으로 얼마를 넣어둘까요?',
  },
}

const ENROLL_TOTAL_STEPS = { promo_cma: 3, promo_term_deposit: 4, promo_savings: 3 }

const ENROLL_NUDGE_MESSAGES = {
  promo_cma: '가입 중간에 나가셨더라고요. 아직 자리 있어요, 이어서 할까요?',
  promo_term_deposit: '예금 설정 중간에 나가셨어요. 언제든 이어서 하셔도 돼요.',
  promo_savings: '비상금통장 개설 중이었어요. 3분이면 돼요, 이어서 할까요?',
}

function getEnrollCompletionMsg(productId, enrollData) {
  if (productId === 'promo_cma') return 'iM CMA 계좌가 열렸어요. 오늘 밤부터 이자가 붙기 시작해요.'
  if (productId === 'promo_term_deposit') {
    const amt = Number(enrollData.amount) || 0
    if (amt > 0) {
      const maturityAmt = Math.floor(amt * (1 + 0.042 * enrollData.term / 12))
      return `${enrollData.term}개월 예금 가입됐어요. 만기일에 ${maturityAmt.toLocaleString('ko-KR')}원을 받으실 거예요.`
    }
    return `${enrollData.term}개월 예금 가입됐어요.`
  }
  if (productId === 'promo_savings') return '비상금통장이 만들어졌어요. 쓸 일이 없는 게 제일 좋지만, 있다는 게 중요해요.'
  return '가입이 완료됐어요.'
}
```

- [ ] **Step 2: enrollmentState + ref 추가**

`App()` 함수 내부, `const [unreadCounts, ...]` 선언 바로 뒤에 추가:

```js
// ── 상품 가입 상태 머신 ──
const [enrollmentState, setEnrollmentState] = useState({
  productId: null, step: 0, data: {}, isOpen: false, status: 'idle',
})
const enrollNudgeTimeoutRef = useRef(null)
```

- [ ] **Step 3: startEnrollment 핸들러 추가**

`exitRoom` 함수 바로 뒤에 추가:

```js
// ── 상품 가입 시작 ──
function startEnrollment(productId) {
  if (enrollNudgeTimeoutRef.current) clearTimeout(enrollNudgeTimeoutRef.current)
  setEnrollmentState({ productId, step: 1, data: {}, isOpen: true, status: 'in_progress' })
}

// ── 가입 단계 전환 ──
function handleEnrollStep(stepData) {
  setEnrollmentState((prev) => {
    const mergedData = { ...prev.data, ...stepData }
    const total = ENROLL_TOTAL_STEPS[prev.productId] || 3
    const isLastStep = prev.step >= total

    if (isLastStep) {
      // 마지막 단계 → 가입 확정 (비동기 실행)
      setTimeout(() => handleEnrollComplete(prev.productId, mergedData), 0)
      return { ...prev, isOpen: false, data: mergedData }
    }

    const nextStep = prev.step + 1
    const msg = ENROLL_MESSAGES[prev.productId]?.[prev.step]
    const accountId = activeAccountIdRef.current

    if (msg) {
      // 타이핑 indicator → 메시지 → 다음 모달
      setTimeout(() => {
        const typingId = 'enroll-typing-' + Date.now()
        setRoomMessages((p) => ({
          ...p,
          [accountId]: [...(p[accountId] || []),
            { id: typingId, role: 'assistant', type: 'text', text: '', streaming: true },
          ],
        }))
        setTimeout(() => {
          setRoomMessages((p) => ({
            ...p,
            [accountId]: (p[accountId] || [])
              .filter((m) => m.id !== typingId)
              .concat([{ id: 'em-' + Date.now(), role: 'assistant', type: 'text', text: msg }]),
          }))
          setTimeout(() => {
            setEnrollmentState((s) => ({ ...s, step: nextStep, isOpen: true }))
          }, 400)
        }, 800)
      }, 400)
    } else {
      setTimeout(() => {
        setEnrollmentState((s) => ({ ...s, step: nextStep, isOpen: true }))
      }, 400)
    }

    return { ...prev, isOpen: false, data: mergedData }
  })
}

// ── 가입 완료 ──
async function handleEnrollComplete(productId, enrollData) {
  const accountId = activeAccountIdRef.current
  const typingId = 'enroll-final-typing-' + Date.now()

  setRoomMessages((p) => ({
    ...p,
    [accountId]: [...(p[accountId] || []),
      { id: typingId, role: 'assistant', type: 'text', text: '', streaming: true },
    ],
  }))

  try {
    const res = await fetch(`${API_BASE}/api/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, productId, enrollData }),
    })
    const result = await res.json()

    if (result.ok) {
      const completionMsg = getEnrollCompletionMsg(productId, enrollData)
      const newAccountId = result.account.id

      // 메시지 이전 + 완료 메시지
      setRoomMessages((p) => {
        const prevMsgs = (p[accountId] || []).filter((m) => m.id !== typingId)
        const doneMsgs = prevMsgs.concat([
          { id: 'enroll-done-' + Date.now(), role: 'assistant', type: 'text', text: completionMsg },
        ])
        return { ...p, [newAccountId]: doneMsgs }
      })

      // 계좌 목록 업데이트 (프로모 제거 + 실계좌 추가)
      setAccountList((prev) => [
        ...prev.filter((a) => a.id !== productId),
        result.account,
      ])

      setEnrollmentState((prev) => ({ ...prev, status: 'completed', isOpen: false }))

      // 신규 계좌 방으로 전환
      setActiveAccountId(newAccountId)
      currentGuiContextRef.current = {
        view: 'account_room',
        accountId: newAccountId,
        accountName: result.account.name,
        accountType: result.account.type,
        balance: result.account.balance,
        totalBalance: 0,
      }
    }
  } catch {
    setRoomMessages((p) => ({
      ...p,
      [accountId]: (p[accountId] || [])
        .filter((m) => m.id !== typingId)
        .concat([{ id: 'enroll-err-' + Date.now(), role: 'assistant', type: 'text', text: '일시적인 오류가 있어요. 잠시 후 다시 시도해 주세요.' }]),
    }))
  }
}

// ── 가입 이탈 ──
function handleEnrollDismiss() {
  const { productId } = enrollmentState
  setEnrollmentState((prev) => ({ ...prev, isOpen: false, status: 'abandoned' }))

  if (enrollNudgeTimeoutRef.current) clearTimeout(enrollNudgeTimeoutRef.current)
  enrollNudgeTimeoutRef.current = setTimeout(() => {
    const accountId = activeAccountIdRef.current
    if (screenRef.current === 'room' && accountId === productId) {
      const nudgeMsg = ENROLL_NUDGE_MESSAGES[productId]
      if (nudgeMsg) {
        setRoomMessages((p) => ({
          ...p,
          [accountId]: [...(p[accountId] || []),
            { id: 'enroll-nudge-' + Date.now(), role: 'assistant', type: 'text', text: nudgeMsg },
          ],
        }))
      }
    }
    enrollNudgeTimeoutRef.current = null
  }, 10 * 60 * 1000)
}
```

- [ ] **Step 4: EnrollmentModal 렌더 추가**

App.jsx의 AccountRoom 렌더 부분 (`screen === 'room'` 블록)을 수정한다.

현재:
```jsx
{screen === 'room' ? (
  <AccountRoom
    account={accountList.find((a) => a.id === activeAccountId)}
    ...
  />
) : (
```
변경:
```jsx
{screen === 'room' ? (
  <>
    <AccountRoom
      account={accountList.find((a) => a.id === activeAccountId)}
      transactions={roomTransactions[activeAccountId] || []}
      messages={roomMessages[activeAccountId] || []}
      isLoading={isLoading}
      isLoadingTxs={roomTransactions[activeAccountId] === undefined}
      sessionId={sessionId}
      voiceMode={voiceMode}
      onBack={exitRoom}
      onSendMessage={(text) => sendMessage(text)}
      onTransferDone={() => {}}
      onMarkRead={() => setUnreadCounts((prev) => ({ ...prev, [activeAccountId]: 0 }))}
      txMeta={roomTxMeta[activeAccountId]}
      onLoadMoreTxs={handleLoadMoreTxs}
      onStartEnrollment={startEnrollment}
    />
    {enrollmentState.isOpen && (
      <EnrollmentModal
        state={enrollmentState}
        accounts={accountList}
        onStepComplete={handleEnrollStep}
        onDismiss={handleEnrollDismiss}
      />
    )}
  </>
) : (
```

- [ ] **Step 5: 커밋**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m"
git add frontend/src/App.jsx
git commit -m "feat: App.jsx 가입 상태 머신 (enrollmentState, startEnrollment, handleEnrollStep, handleEnrollComplete, handleEnrollDismiss)"
```

---

## Task 5: Frontend — 버튼 prop 체인 연결

**Files:**
- Modify: `frontend/src/components/AccountRoom.jsx`
- Modify: `frontend/src/components/Message.jsx`
- Modify: `frontend/src/components/ProductPitchCard.jsx`

- [ ] **Step 1: AccountRoom.jsx — prop 수신 + Message 전달**

`frontend/src/components/AccountRoom.jsx`에서 함수 파라미터 destructuring을 찾는다 (약 line 384).

현재:
```js
  voiceMode,
  onBack,
  onSendMessage,
  onTransferDone,
  onMarkRead,
```
변경 (onMarkRead 뒤에 추가):
```js
  voiceMode,
  onBack,
  onSendMessage,
  onTransferDone,
  onMarkRead,
  onStartEnrollment,
```

같은 파일의 Message 컴포넌트 렌더 부분 (약 line 627):

현재:
```jsx
              <Message
                msg={msg}
                sessionId={sessionId}
                voiceMode={voiceMode}
                onTransferDone={onTransferDone}
                onQuickAction={onSendMessage}
                onClearScope={() => {}}
                onGuiContextChange={() => {}}
              />
```
변경:
```jsx
              <Message
                msg={msg}
                sessionId={sessionId}
                voiceMode={voiceMode}
                onTransferDone={onTransferDone}
                onQuickAction={onSendMessage}
                onClearScope={() => {}}
                onGuiContextChange={() => {}}
                onStartEnrollment={onStartEnrollment}
              />
```

- [ ] **Step 2: Message.jsx — onStartEnrollment prop → ProductPitchCard 전달**

`frontend/src/components/Message.jsx` line 19:

현재:
```js
export default function Message({ msg, sessionId, onTransferDone, onQuickAction, onClearScope, onGuiContextChange, voiceMode }) {
```
변경:
```js
export default function Message({ msg, sessionId, onTransferDone, onQuickAction, onClearScope, onGuiContextChange, voiceMode, onStartEnrollment }) {
```

line 87:

현재:
```js
    if (cardType === 'product_pitch') return <ProductPitchCard data={data} />
```
변경:
```js
    if (cardType === 'product_pitch') return <ProductPitchCard data={data} onStartEnrollment={onStartEnrollment} />
```

- [ ] **Step 3: ProductPitchCard.jsx — "가입하기" 버튼 추가**

`frontend/src/components/ProductPitchCard.jsx` line 30:

현재:
```js
export default function ProductPitchCard({ data }) {
  const { product, personal, compare } = data
```
변경:
```js
export default function ProductPitchCard({ data, onStartEnrollment }) {
  const { productId, product, personal, compare } = data
```

같은 파일 끝, `{product.earlyWithdrawal && ...}` 블록 바로 뒤, `</div>` 닫기 전:

현재:
```jsx
      {product.earlyWithdrawal && (
        <div className="pitch-footnote">{product.earlyWithdrawal}</div>
      )}
    </div>
  )
}
```
변경:
```jsx
      {product.earlyWithdrawal && (
        <div className="pitch-footnote">{product.earlyWithdrawal}</div>
      )}

      {productId && onStartEnrollment && (
        <button
          className="pitch-enroll-btn"
          style={{ '--pitch-color': color }}
          onClick={() => onStartEnrollment(productId)}
        >
          지금 가입하기
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m"
git add frontend/src/components/AccountRoom.jsx frontend/src/components/Message.jsx frontend/src/components/ProductPitchCard.jsx
git commit -m "feat: 가입하기 버튼 prop 체인 연결 (ProductPitchCard → Message → AccountRoom → App)"
```

---

## Task 6: Frontend — CSS 스타일

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: EnrollmentModal + ProductPitchCard 버튼 스타일 추가**

`frontend/src/styles.css` 파일 끝에 추가:

```css
/* ──────────────────────────────────────────────
   EnrollmentModal
   ────────────────────────────────────────────── */
.enroll-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.enroll-modal {
  background: var(--bg-card, #1E2138);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  padding: 20px 20px 40px;
  animation: slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.enroll-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.enroll-dots {
  display: flex;
  gap: 6px;
}

.enroll-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.2s;
}

.enroll-dot--active { background: var(--accent, #00C9A7); }
.enroll-dot--done   { background: rgba(0, 201, 167, 0.5); }

.enroll-close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 4px;
  line-height: 0;
}
.enroll-close-btn:hover { color: rgba(255, 255, 255, 0.8); }

.enroll-step {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.enroll-step-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.enroll-step-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

.enroll-step-error {
  font-size: 12px;
  color: #F87171;
  margin: 0;
}

.enroll-phone-display {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 2px;
  padding: 12px 0;
}

.enroll-field-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: -4px;
}

.enroll-code-input,
.enroll-amount-input {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #fff;
  font-size: 18px;
  padding: 12px 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  letter-spacing: 4px;
}

.enroll-code-input:focus,
.enroll-amount-input:focus {
  border-color: var(--accent, #00C9A7);
}

.enroll-code-input--error { border-color: #F87171 !important; }

.enroll-amount-input { letter-spacing: normal; font-size: 16px; }

.enroll-select {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  padding: 11px 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  appearance: none;
}

.enroll-chip-group { display: flex; gap: 8px; flex-wrap: wrap; }

.enroll-chip {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  padding: 7px 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.enroll-chip--active {
  background: rgba(0, 201, 167, 0.15);
  border-color: var(--accent, #00C9A7);
  color: var(--accent, #00C9A7);
}

.enroll-maturity-preview {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.enroll-maturity-preview strong { color: var(--accent, #00C9A7); }

.enroll-btn-primary {
  background: var(--accent, #00C9A7);
  border: none;
  border-radius: 12px;
  color: #000;
  font-size: 15px;
  font-weight: 600;
  padding: 14px;
  cursor: pointer;
  width: 100%;
  margin-top: 4px;
  transition: opacity 0.15s;
}

.enroll-btn-primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.enroll-btn-skip {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
  cursor: pointer;
  padding: 4px;
  text-align: center;
}

.enroll-step--cert { align-items: center; padding: 16px 0; }

.enroll-cert-loading,
.enroll-cert-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.enroll-cert-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--accent, #00C9A7);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ──────────────────────────────────────────────
   ProductPitchCard — 가입하기 버튼
   ────────────────────────────────────────────── */
.pitch-enroll-btn {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  background: color-mix(in srgb, var(--pitch-color, #00C9A7) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--pitch-color, #00C9A7) 40%, transparent);
  border-radius: 10px;
  color: var(--pitch-color, #00C9A7);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.pitch-enroll-btn:hover {
  background: color-mix(in srgb, var(--pitch-color, #00C9A7) 25%, transparent);
}
```

- [ ] **Step 2: 커밋**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m"
git add frontend/src/styles.css
git commit -m "feat: EnrollmentModal + pitch-enroll-btn CSS 스타일"
```

---

## Task 7: 통합 검증 + zb/backend 동기화

**Files:**
- `zb/backend/src/server.js` (동기화)
- `zb/backend/src/mockData.js` (동기화)
- `zb/backend/src/tests/core.test.js` (동기화)

- [ ] **Step 1: 로컬 통합 테스트**

```bash
# 백엔드 실행
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/backend"
npm run dev &
sleep 2

# 프론트엔드 실행
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/frontend"
npm run dev &
```

브라우저에서 http://localhost:5173 접속 후 확인:
1. CMA 프로모 방 진입 → AI 소개 + ProductPitchCard + "지금 가입하기" 버튼 표시
2. 버튼 탭 → 모달 등장 (dot indicator 1/3)
3. 전화번호 확인 → AI 메시지 "인증번호를 보냈어요..." → SMS 모달
4. `123456` 입력 → AI 메시지 "확인됐어요!" → 입금 모달
5. 계좌 선택 + 금액 입력 → "개설하기" → 완료 메시지 + 계좌 목록 갱신
6. 정기예금: 공인인증서 단계 (4단계) 확인
7. 모달 중간 dismiss → 10분 후 재유도 메시지 (개발 테스트: 타임아웃 10000ms로 임시 수정 후 복원)

```bash
kill %1 %2 2>/dev/null || true
```

- [ ] **Step 2: backend vitest 전체 통과 확인**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/backend"
npx vitest run src/tests/core.test.js
```
Expected: 모든 테스트 통과 (기존 + 신규 3건)

- [ ] **Step 3: zb/backend 동기화**

```bash
cp "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/backend/src/server.js" \
   "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb/backend/src/server.js"

cp "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/backend/src/mockData.js" \
   "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb/backend/src/mockData.js"

cp "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/backend/src/tests/core.test.js" \
   "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb/backend/src/tests/core.test.js"
```

- [ ] **Step 4: zb/backend 테스트 통과 확인**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb/backend"
npm test
```
Expected: 모든 테스트 통과

- [ ] **Step 5: Railway 배포**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb/backend"
git add -A
git commit -m "feat: POST /api/enroll + createAccount() 상품 가입 기능"
railway up --detach
```

- [ ] **Step 6: Vercel 배포**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m/frontend"
npm run build
```
Expected: `dist/` 빌드 성공 (오류 없음). Vercel은 main 브랜치 push 시 자동 배포.

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m"
git add -A
git commit -m "feat: 상품 가입 프로세스 전체 구현 완료"
git push origin main
```
