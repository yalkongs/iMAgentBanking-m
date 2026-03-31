# 주계좌 빠른 송금 패널 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 주계좌 대화방 입력창 위에 수신자·금액 선택형 빠른 송금 패널을 추가하고, 실행은 AI 채팅 스트림을 통과시켜 대화 히스토리로 기록한다.

**Architecture:** 입력창 위에 고정된 collapsible 패널(자주/최근/연락처 탭). 수신자 탭 → 금액 chip 인라인 확장 → "보내기" → 패널 접힘 + 사용자·AI 말풍선 주입 + TransferCard 렌더링. 백엔드는 `POST /api/quick-transfer`로 pendingTransfer 세션 등록 후 응답에 TransferCard 데이터를 포함 (WebSocket 미사용 — 말풍선 순서 보장을 위해).

**Tech Stack:** React 18, Express, 기존 TransferCard/confirm-transfer 플로우 재사용.

---

## 파일 구조

| 파일 | 변경 | 역할 |
|---|---|---|
| `backend/src/server.js` | 수정 | GET /api/contacts, POST /api/quick-transfer 추가 |
| `backend/src/tests/core.test.js` | 수정 | quick-transfer 테스트 추가 |
| `frontend/src/components/QuickTransferPanel.jsx` | 신규 | 패널 전체 (탭, 목록, collapse 상태, calcStats 유틸) |
| `frontend/src/components/QuickTransferRecipientRow.jsx` | 신규 | 수신자 1행 + 인라인 확장 (금액 chip, 직접입력, 보내기) |
| `frontend/src/components/AccountRoom.jsx` | 수정 | contacts prop 추가, 패널 렌더링 |
| `frontend/src/App.jsx` | 수정 | contacts state, onTransferReady 핸들러, AccountRoom prop 전달 |
| `frontend/src/styles.css` | 수정 | qtp-* CSS 클래스 추가 |

---

### Task 1: 백엔드 — GET /api/contacts + POST /api/quick-transfer

**Files:**
- Modify: `backend/src/server.js`
- Modify: `backend/src/tests/core.test.js`

**배경 지식:**
- `contacts` 배열은 `backend/src/mockData.js`에서 export됨. 이미 `import { ..., contacts } from './mockData.js'` 상단에 있음.
- `session.pendingTransfer`는 `POST /api/confirm-transfer`에서 읽힘. 여기서 설정하면 기존 swipe-confirm 플로우가 그대로 작동.
- `availableAccounts` 필터: 기존 코드에 `a.type === '입출금'` 버그가 있음. 여기서는 `a.type === 'checking'`을 사용.
- WebSocket `PENDING_TRANSFER` **미발송** — 프론트엔드가 응답 데이터로 직접 TransferCard 메시지를 주입해 말풍선 순서를 보장.

- [ ] **Step 1: 테스트 작성**

`backend/src/tests/core.test.js` 마지막 테스트 블록 뒤에 추가:

```js
describe('POST /api/quick-transfer', () => {
  test('존재하는 contactId + 유효한 amount → pendingTransfer 세션 등록 + 응답 반환', async () => {
    const res = await request(app)
      .post('/api/quick-transfer')
      .send({ sessionId: 'test-qt', contactId: 'c001', amount: 50000 })
    expect(res.status).toBe(200)
    expect(res.body.userText).toMatch('김영희')
    expect(res.body.aiText).toMatch('50,000원')
    expect(res.body.pendingTransfer.to_contact).toBe('김영희')
    expect(res.body.pendingTransfer.amount).toBe(50000)
    expect(Array.isArray(res.body.pendingTransfer.availableAccounts)).toBe(true)
  })

  test('존재하지 않는 contactId → 404', async () => {
    const res = await request(app)
      .post('/api/quick-transfer')
      .send({ sessionId: 'test-qt', contactId: 'c999', amount: 50000 })
    expect(res.status).toBe(404)
  })

  test('amount 미전달 → 400', async () => {
    const res = await request(app)
      .post('/api/quick-transfer')
      .send({ sessionId: 'test-qt', contactId: 'c001' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/contacts', () => {
  test('contacts 배열 반환', async () => {
    const res = await request(app).get('/api/contacts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toHaveProperty('realName')
    expect(res.body[0]).toHaveProperty('bank')
    expect(res.body[0]).toHaveProperty('accountNo')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd backend && npx vitest run src/tests/core.test.js 2>&1 | tail -20
```
Expected: FAIL (엔드포인트 미존재)

- [ ] **Step 3: 엔드포인트 구현**

`backend/src/server.js`에서 `// ──────────────────────────────────────────────` `// 서버 시작` 블록 바로 위에 추가:

```js
// ──────────────────────────────────────────────
// GET /api/contacts — 연락처 목록 반환
// ──────────────────────────────────────────────
app.get('/api/contacts', (req, res) => {
  res.json(contacts)
})

// ──────────────────────────────────────────────
// POST /api/quick-transfer — 패널 즉시 이체 개시
// WebSocket 미발송: 프론트가 응답 데이터로 직접 말풍선+TransferCard 주입
// ──────────────────────────────────────────────
app.post('/api/quick-transfer', (req, res) => {
  const { sessionId = 'default', contactId, amount } = req.body

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'amount는 0보다 커야 합니다.' })
  }

  const contact = contacts.find((c) => c.id === contactId)
  if (!contact) {
    return res.status(404).json({ error: '연락처를 찾을 수 없습니다.' })
  }

  const session = getSession(sessionId)
  const checkingAcc = session.accounts.find((a) => a.type === 'checking')
  if (!checkingAcc) {
    return res.status(400).json({ error: '입출금 계좌가 없습니다.' })
  }

  const pendingData = {
    toolUseId: 'quick_' + Date.now(),
    to_contact: contact.realName,
    amount,
    from_account_id: checkingAcc.id,
    memo: '',
    contactInfo: contact,
  }
  session.pendingTransfer = pendingData

  const amountFmt = amount.toLocaleString('ko-KR') + '원'

  res.json({
    userText: `${contact.realName}에게 ${amountFmt} 보내줘`,
    aiText: `${contact.realName}님께 ${amountFmt} 이체하겠습니다.`,
    pendingTransfer: {
      to_contact: contact.realName,
      amount,
      amountFormatted: amountFmt,
      from_account_id: checkingAcc.id,
      memo: '',
      contactInfo: contact,
      availableAccounts: session.accounts
        .filter((a) => a.type === 'checking' || a.type === 'cma')
        .map((a) => ({
          id: a.id,
          name: a.name,
          balance: a.balance,
          balanceFormatted: a.balance.toLocaleString('ko-KR') + '원',
        })),
      balance: checkingAcc.balance,
    },
  })
})
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd backend && npx vitest run src/tests/core.test.js 2>&1 | tail -10
```
Expected: all tests pass (기존 24개 + 신규 5개 = 29개)

- [ ] **Step 5: 커밋**

```bash
git add backend/src/server.js backend/src/tests/core.test.js
git commit -m "feat: GET /api/contacts + POST /api/quick-transfer 엔드포인트 추가"
```

---

### Task 2: QuickTransferRecipientRow 컴포넌트

**Files:**
- Create: `frontend/src/components/QuickTransferRecipientRow.jsx`

**배경 지식:**
- `contact.accountNo` 형식: `'110-234-567890'` → 마지막 4자리만 표시: `****7890`
- chip이 1개만 있을 수도 있음 (recentAmount === frequentAmount인 경우 중복 제거)
- 직접 입력 시 숫자 외 문자 제거, disabled 조건: amount > 0

- [ ] **Step 1: 파일 생성**

`frontend/src/components/QuickTransferRecipientRow.jsx` 생성:

```jsx
import { useState } from 'react'

export default function QuickTransferRecipientRow({
  contact,
  recentAmount,
  frequentAmount,
  isExpanded,
  onExpand,
  onTransfer,
}) {
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [directInput, setDirectInput] = useState('')
  const [showDirect, setShowDirect] = useState(false)

  // 마지막 4자리 마스킹
  const parts = contact.accountNo.split('-')
  const last = parts[parts.length - 1]
  const masked = '****' + last.slice(-4)

  // chip 중복 제거: recentAmount === frequentAmount면 하나만
  const chips = []
  if (frequentAmount) {
    chips.push({ label: frequentAmount.toLocaleString('ko-KR'), sub: '자주', value: frequentAmount })
  }
  if (recentAmount && recentAmount !== frequentAmount) {
    chips.push({ label: recentAmount.toLocaleString('ko-KR'), sub: '최근', value: recentAmount })
  }

  const activeAmount = showDirect
    ? (Number(directInput) || 0)
    : (selectedAmount || 0)

  function handleRowClick() {
    // 확장 시 상태 초기화
    if (!isExpanded) {
      setSelectedAmount(frequentAmount || recentAmount || null)
      setDirectInput('')
      setShowDirect(false)
    }
    onExpand()
  }

  return (
    <div className={`qtp-row${isExpanded ? ' qtp-row--expanded' : ''}`}>
      {/* 행 헤더 (항상 표시) */}
      <div className="qtp-row-main" onClick={handleRowClick} role="button" tabIndex={0}>
        <div className="qtp-row-info">
          <span className="qtp-row-name">{contact.realName}</span>
          <span className="qtp-row-bank">{contact.bank}</span>
        </div>
        {!isExpanded && frequentAmount && (
          <span className="qtp-chip-preview">
            {frequentAmount.toLocaleString('ko-KR')}원
          </span>
        )}
        <svg
          className={`qtp-row-chevron${isExpanded ? ' qtp-row-chevron--open' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* 인라인 확장 영역 */}
      {isExpanded && (
        <div className="qtp-expand">
          <div className="qtp-expand-account">
            {contact.bank} &nbsp;{masked}
          </div>

          <div className="qtp-chips">
            {chips.map((c) => (
              <button
                key={c.value}
                className={`qtp-chip${selectedAmount === c.value && !showDirect ? ' qtp-chip--active' : ''}`}
                onClick={() => { setSelectedAmount(c.value); setShowDirect(false) }}
              >
                {c.label}
                <span className="qtp-chip-sub">{c.sub}</span>
              </button>
            ))}
            <button
              className={`qtp-chip${showDirect ? ' qtp-chip--active' : ''}`}
              onClick={() => { setShowDirect(true); setSelectedAmount(null) }}
            >
              직접 입력
            </button>
          </div>

          {showDirect && (
            <input
              className="qtp-direct-input"
              type="tel"
              inputMode="numeric"
              placeholder="금액 입력"
              value={directInput}
              onChange={(e) => setDirectInput(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          )}

          <button
            className="qtp-send-btn"
            disabled={activeAmount <= 0}
            onClick={() => onTransfer(activeAmount)}
          >
            보내기
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 수동 확인 (스토리북 없음 — 다음 Task에서 패널과 함께 확인)**

파일이 정상 생성됐는지 확인:
```bash
ls frontend/src/components/QuickTransferRecipientRow.jsx
```
Expected: 파일 존재

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/QuickTransferRecipientRow.jsx
git commit -m "feat: QuickTransferRecipientRow — 수신자 행 + 인라인 확장 컴포넌트"
```

---

### Task 3: QuickTransferPanel 컴포넌트

**Files:**
- Create: `frontend/src/components/QuickTransferPanel.jsx`

**배경 지식:**
- `calcStats(transactions, contacts)` — 서버 호출 없이 prop에서 직접 계산
- `localStorage['zb-m-qtp-collapsed']` — collapsed 상태 영속화
- `listForTab` 인덱스: 0=자주, 1=최근, 2=연락처
- 연락처 탭에서만 검색 input 표시

- [ ] **Step 1: 파일 생성**

`frontend/src/components/QuickTransferPanel.jsx` 생성:

```jsx
import { useState, useMemo } from 'react'
import QuickTransferRecipientRow from './QuickTransferRecipientRow.jsx'

const TABS = ['자주', '최근', '연락처']
const LS_KEY = 'zb-m-qtp-collapsed'

function calcStats(transactions, contacts) {
  const contactNames = new Set(contacts.map((c) => c.realName))
  const outbound = transactions.filter(
    (t) => t.amount < 0 && contactNames.has(t.counterpart)
  )

  // 수신자별 빈도
  const freqMap = {}
  outbound.forEach((t) => {
    freqMap[t.counterpart] = (freqMap[t.counterpart] || 0) + 1
  })

  // 수신자별 최근/최다 금액
  const amountStats = {}
  contacts.forEach((c) => {
    const txs = outbound
      .filter((t) => t.counterpart === c.realName)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    const recentAmount = txs[0] ? Math.abs(txs[0].amount) : null

    const amtFreq = {}
    txs.forEach((t) => {
      const amt = Math.abs(t.amount)
      amtFreq[amt] = (amtFreq[amt] || 0) + 1
    })
    const top = Object.entries(amtFreq).sort((a, b) => b[1] - a[1])[0]
    const frequentAmount = top ? Number(top[0]) : null

    amountStats[c.realName] = { recentAmount, frequentAmount }
  })

  return { freqMap, amountStats }
}

export default function QuickTransferPanel({ contacts, transactions, onTransferReady }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true' } catch { return false }
  })
  const [activeTab, setActiveTab] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch] = useState('')

  const { freqMap, amountStats } = useMemo(
    () => calcStats(transactions, contacts),
    [transactions, contacts]
  )

  // 자주 탭: 빈도 있는 contacts를 내림차순 정렬, 최대 8명
  const frequentList = useMemo(
    () =>
      contacts
        .filter((c) => (freqMap[c.realName] || 0) > 0)
        .sort((a, b) => (freqMap[b.realName] || 0) - (freqMap[a.realName] || 0))
        .slice(0, 8),
    [contacts, freqMap]
  )

  // 최근 탭: 최근 이체 기준, 수신자 중복 제거, 최대 10명
  const recentList = useMemo(() => {
    const contactNames = new Set(contacts.map((c) => c.realName))
    const seen = new Set()
    return transactions
      .filter((t) => t.amount < 0 && contactNames.has(t.counterpart))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((t) => {
        if (seen.has(t.counterpart)) return false
        seen.add(t.counterpart)
        return true
      })
      .slice(0, 10)
      .map((t) => contacts.find((c) => c.realName === t.counterpart))
      .filter(Boolean)
  }, [transactions, contacts])

  // 연락처 탭: 검색 필터 + 가나다 정렬
  const filteredContacts = useMemo(() => {
    const q = search.trim()
    return contacts
      .filter((c) => !q || c.realName.includes(q))
      .sort((a, b) => a.realName.localeCompare(b.realName, 'ko'))
  }, [contacts, search])

  const listForTab = [frequentList, recentList, filteredContacts][activeTab]

  // Collapsed 미리보기 (상위 3명 이름)
  const previewNames = frequentList.slice(0, 3).map((c) => c.realName)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(LS_KEY, String(next)) } catch {}
  }

  function handleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function renderRow(contact) {
    const stats = amountStats[contact.realName] || {}
    return (
      <QuickTransferRecipientRow
        key={contact.id}
        contact={contact}
        recentAmount={stats.recentAmount ?? null}
        frequentAmount={stats.frequentAmount ?? null}
        isExpanded={expandedId === contact.id}
        onExpand={() => handleExpand(contact.id)}
        onTransfer={(amount) => {
          setExpandedId(null)
          onTransferReady(contact.id, amount)
        }}
      />
    )
  }

  return (
    <div className="qtp-panel">
      {/* 헤더 (항상 표시) */}
      <div className="qtp-header" onClick={toggle} role="button" tabIndex={0}>
        <div className="qtp-header-left">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <polyline points="19 12 12 19 5 12"/>
            <polyline points="19 5 12 12 5 5"/>
          </svg>
          <span className="qtp-header-title">빠른 송금</span>
        </div>
        {collapsed && previewNames.length > 0 && (
          <span className="qtp-preview">
            {previewNames.join(' · ')}
            {frequentList.length > 3 && ` +${frequentList.length - 3}명`}
          </span>
        )}
        <svg
          className={`qtp-chevron${collapsed ? '' : ' qtp-chevron--up'}`}
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Expanded 바디 */}
      {!collapsed && (
        <div className="qtp-body">
          {/* 탭 */}
          <div className="qtp-tabs" role="tablist">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === i}
                className={`qtp-tab${activeTab === i ? ' qtp-tab--active' : ''}`}
                onClick={() => { setActiveTab(i); setExpandedId(null); setSearch('') }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 연락처 탭 검색 */}
          {activeTab === 2 && (
            <div className="qtp-search-wrap">
              <input
                className="qtp-search"
                type="text"
                placeholder="이름으로 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* 수신자 목록 */}
          <div className="qtp-list">
            {listForTab.length === 0 ? (
              <div className="qtp-empty">
                {activeTab === 0
                  ? '아직 이체 내역이 없어요'
                  : activeTab === 1
                  ? '최근 이체 내역이 없어요'
                  : search ? '검색 결과가 없어요' : '연락처가 없어요'}
              </div>
            ) : (
              listForTab.map(renderRow)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/components/QuickTransferPanel.jsx
git commit -m "feat: QuickTransferPanel — 탭/목록/collapse/calcStats 포함"
```

---

### Task 4: AccountRoom — contacts prop + 패널 렌더링

**Files:**
- Modify: `frontend/src/components/AccountRoom.jsx`

**배경 지식:**
- `AccountRoom` props 추가: `contacts` (배열)
- 패널은 `activeTab === 'chat' && account.type === 'checking'`일 때만 렌더링
- 패널은 `room-input-bar` 바로 위 — 채팅 스크롤 영역 밖에 있음
- `onTransferReady` prop을 AccountRoom이 받아 패널에 전달

- [ ] **Step 1: import 추가**

`frontend/src/components/AccountRoom.jsx` 상단 import 블록에 추가:

```js
import QuickTransferPanel from './QuickTransferPanel.jsx'
```

- [ ] **Step 2: props 시그니처에 contacts, onTransferReady 추가**

현재:
```js
export default function AccountRoom({
  account,
  transactions,
  messages,
  isLoading,
  isLoadingTxs,
  sessionId,
  voiceMode,
  onBack,
  onSendMessage,
  onTransferDone,
  onMarkRead,
  onStartEnrollment,
  promoIds,
  txMeta,
  onLoadMoreTxs,
}) {
```

변경 후:
```js
export default function AccountRoom({
  account,
  contacts,
  transactions,
  messages,
  isLoading,
  isLoadingTxs,
  sessionId,
  voiceMode,
  onBack,
  onSendMessage,
  onTransferDone,
  onMarkRead,
  onStartEnrollment,
  promoIds,
  txMeta,
  onLoadMoreTxs,
  onTransferReady,
}) {
```

- [ ] **Step 3: 패널 렌더링 삽입**

`{/* 채팅 입력창 (대화 탭에서만 표시) */}` 블록 바로 위에 추가:

```jsx
      {/* 빠른 송금 패널 — 주계좌 + 대화 탭에서만 표시 */}
      {activeTab === 'chat' && account?.type === 'checking' && (
        <QuickTransferPanel
          contacts={contacts || []}
          transactions={transactions || []}
          onTransferReady={onTransferReady}
        />
      )}
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/AccountRoom.jsx
git commit -m "feat: AccountRoom — QuickTransferPanel 렌더링 (checking 계좌 + 대화 탭)"
```

---

### Task 5: App.jsx — contacts state + onTransferReady 핸들러

**Files:**
- Modify: `frontend/src/App.jsx`

**배경 지식:**
- `contacts` state: 앱 마운트 시 1회 fetch, `[]` 초기값
- `handleTransferReady(contactId, amount)`:
  1. `POST /api/quick-transfer` 호출
  2. 응답: `{ userText, aiText, pendingTransfer }`
  3. 사용자 말풍선 즉시 주입 (role: 'user')
  4. 300ms 후 AI 말풍선 주입 (role: 'assistant')
  5. 300ms 후 TransferCard 메시지 주입 (type: 'transfer_pending')
- 기존 `injectAiMessage` 패턴 참고: `setRoomMessages((prev) => ({ ...prev, [accountId]: [...(prev[accountId] || []), msg] }))`

- [ ] **Step 1: contacts state 추가**

`App.jsx` 내 state 선언부 (`const [accountList, setAccountList] = useState([])` 근처)에 추가:

```js
const [contacts, setContacts] = useState([])
```

- [ ] **Step 2: contacts fetch useEffect 추가**

기존 `fetch('/api/proactive')` useEffect 아래에 추가:

```js
useEffect(() => {
  fetch(`${API_BASE}/api/contacts`)
    .then((r) => r.json())
    .then((data) => setContacts(Array.isArray(data) ? data : []))
    .catch(() => {})
}, [])
```

- [ ] **Step 3: handleTransferReady 핸들러 추가**

`injectAiMessage` 함수 선언 바로 아래에 추가:

```js
async function handleTransferReady(contactId, amount) {
  const accountId = activeAccountId
  if (!accountId) return
  try {
    const res = await fetch(`${API_BASE}/api/quick-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, contactId, amount }),
    })
    if (!res.ok) return
    const { userText, aiText, pendingTransfer } = await res.json()

    // 1. 사용자 말풍선
    setRoomMessages((prev) => ({
      ...prev,
      [accountId]: [
        ...(prev[accountId] || []),
        { id: 'qt_user_' + Date.now(), role: 'user', text: userText },
      ],
    }))

    // 2. AI 말풍선 (300ms 후)
    await new Promise((r) => setTimeout(r, 300))
    setRoomMessages((prev) => ({
      ...prev,
      [accountId]: [
        ...(prev[accountId] || []),
        { id: 'qt_ai_' + Date.now(), role: 'assistant', text: aiText },
      ],
    }))

    // 3. TransferCard (300ms 후)
    await new Promise((r) => setTimeout(r, 300))
    setRoomMessages((prev) => ({
      ...prev,
      [accountId]: [
        ...(prev[accountId] || []),
        { id: 'qt_card_' + Date.now(), type: 'transfer_pending', data: pendingTransfer },
      ],
    }))
  } catch (err) {
    console.error('quick-transfer failed:', err)
  }
}
```

- [ ] **Step 4: AccountRoom에 props 전달**

`<AccountRoom` JSX에 두 prop 추가:

```jsx
<AccountRoom
  account={accountList.find((a) => a.id === activeAccountId)}
  contacts={contacts}                          {/* 추가 */}
  transactions={roomTransactions[activeAccountId] || []}
  messages={roomMessages[activeAccountId] || []}
  isLoading={isLoading}
  isLoadingTxs={roomTxMeta[activeAccountId]?.isLoadingMore || false}
  sessionId={sessionId}
  voiceMode={voiceMode}
  onBack={() => setScreen('list')}
  onSendMessage={handleSendMessage}
  onTransferDone={handleTransferDone}
  onMarkRead={() => setUnreadCounts((prev) => ({ ...prev, [activeAccountId]: 0 }))}
  txMeta={roomTxMeta[activeAccountId]}
  onLoadMoreTxs={handleLoadMoreTxs}
  onStartEnrollment={startEnrollment}
  promoIds={new Set(accountList.filter((a) => a.isPromo).map((a) => a.id))}
  onTransferReady={handleTransferReady}         {/* 추가 */}
/>
```

- [ ] **Step 5: 빌드 확인**

```bash
cd frontend && npm run build 2>&1 | tail -10
```
Expected: `✓ built in` (에러 없음)

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/App.jsx
git commit -m "feat: App.jsx — contacts fetch + handleTransferReady 핸들러 + AccountRoom prop 연결"
```

---

### Task 6: CSS — qtp-* 스타일

**Files:**
- Modify: `frontend/src/styles.css`

**배경 지식:**
- 디자인 토큰: `--accent: #00C9A7`, `--bg-secondary: #1E2138`, `--border: rgba(255,255,255,0.08)`, `--text-primary: #E8EAFF`, `--text-secondary: rgba(232,234,255,0.5)`
- 패널 최대 높이: `40vh` (화면의 40%)
- 모바일 우선 (phone-width 약 390px)

- [ ] **Step 1: CSS 추가**

`frontend/src/styles.css` 맨 끝에 추가:

```css
/* ──────────────────────────────────────────────
   QuickTransferPanel (qtp-*)
   ────────────────────────────────────────────── */

.qtp-panel {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

/* 헤더 */
.qtp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  cursor: pointer;
  user-select: none;
}

.qtp-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
  flex-shrink: 0;
}

.qtp-header-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.02em;
}

.qtp-preview {
  flex: 1;
  font-size: 12px;
  color: rgba(232,234,255,0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qtp-chevron {
  color: rgba(232,234,255,0.35);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.qtp-chevron--up {
  transform: rotate(180deg);
}

/* 바디 */
.qtp-body {
  max-height: 40vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 탭 */
.qtp-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.qtp-tab {
  flex: 1;
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(232,234,255,0.4);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  position: relative;
}

.qtp-tab--active {
  color: var(--accent);
  font-weight: 600;
}

.qtp-tab--active::after {
  content: '';
  position: absolute;
  bottom: 0; left: 20%; right: 20%;
  height: 2px;
  background: var(--accent);
  border-radius: 2px 2px 0 0;
}

/* 연락처 검색 */
.qtp-search-wrap {
  padding: 8px 12px 4px;
  flex-shrink: 0;
}

.qtp-search {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  box-sizing: border-box;
}

.qtp-search::placeholder {
  color: rgba(232,234,255,0.3);
}

/* 목록 */
.qtp-list {
  overflow-y: auto;
  flex: 1;
}

.qtp-empty {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: rgba(232,234,255,0.3);
}

/* 수신자 행 */
.qtp-row {
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.qtp-row:last-child {
  border-bottom: none;
}

.qtp-row-main {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.1s;
}

.qtp-row-main:active {
  background: rgba(255,255,255,0.03);
}

.qtp-row-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.qtp-row-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.qtp-row-bank {
  font-size: 11px;
  color: rgba(232,234,255,0.4);
  white-space: nowrap;
}

.qtp-chip-preview {
  font-size: 12px;
  color: var(--accent);
  background: rgba(0,201,167,0.1);
  border-radius: 20px;
  padding: 2px 8px;
  flex-shrink: 0;
}

.qtp-row-chevron {
  color: rgba(232,234,255,0.25);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.qtp-row-chevron--open {
  transform: rotate(180deg);
}

/* 인라인 확장 */
.qtp-expand {
  padding: 0 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qtp-expand-account {
  font-size: 11px;
  color: rgba(232,234,255,0.35);
  letter-spacing: 0.03em;
}

.qtp-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.qtp-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 6px 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.qtp-chip-sub {
  font-size: 10px;
  color: rgba(232,234,255,0.35);
  font-weight: 400;
}

.qtp-chip--active {
  background: rgba(0,201,167,0.15);
  border-color: rgba(0,201,167,0.4);
  color: var(--accent);
}

.qtp-chip--active .qtp-chip-sub {
  color: rgba(0,201,167,0.6);
}

.qtp-direct-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(0,201,167,0.4);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.qtp-direct-input::placeholder {
  color: rgba(232,234,255,0.25);
}

.qtp-send-btn {
  display: block;
  width: 100%;
  padding: 11px;
  background: var(--accent);
  color: #0D0F1A;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.qtp-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qtp-send-btn:not(:disabled):active {
  opacity: 0.85;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd frontend && npm run build 2>&1 | tail -5
```
Expected: `✓ built in`

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/styles.css
git commit -m "feat: QuickTransferPanel CSS (qtp-* 클래스)"
```

---

### Task 7: 통합 확인 + 배포

**Files:**
- `backend/src/server.js` (Railway sync)
- `frontend/` (Vercel deploy)

- [ ] **Step 1: 백엔드 테스트 최종 확인**

```bash
cd backend && npm test 2>&1 | tail -10
```
Expected: 29 tests pass

- [ ] **Step 2: 프론트엔드 빌드 최종 확인**

```bash
cd frontend && npm run build 2>&1 | tail -5
```
Expected: `✓ built in`

- [ ] **Step 3: 동작 시나리오 확인 (로컬 dev 서버)**

```bash
# 터미널 1
cd backend && npm run dev

# 터미널 2
cd frontend && npm run dev
```

브라우저에서:
1. 주계좌 방 입장 → 입력창 위에 패널 표시, 기본 expanded
2. "자주" 탭 → 김순자(엄마) 포함 6-8명 표시
3. 수신자 탭 → 금액 chip 표시, "보내기" 활성화
4. 보내기 탭 → 패널 접힘 → 사용자/AI 말풍선 → TransferCard 표시
5. Swipe 확인 → 이체 완료
6. 다른 계좌방(적금 등) 입장 → 패널 미표시

- [ ] **Step 4: Vercel 배포**

```bash
cd frontend && npx vercel --prod 2>&1 | tail -5
```

- [ ] **Step 5: Railway 배포**

```bash
cp backend/src/server.js ../zb/backend/src/server.js
cd ../zb/backend && railway up 2>&1 | tail -5
```

- [ ] **Step 6: 최종 커밋**

```bash
cd "/Users/yalkongs/Library/Mobile Documents/com~apple~CloudDocs/CodePrj/zb-m"
git add .
git commit -m "feat: 주계좌 빠른 송금 패널 완성 (QuickTransferPanel, /api/quick-transfer, CSS)"
```
