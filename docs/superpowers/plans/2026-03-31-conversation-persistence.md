# Conversation Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 계좌 대화방 히스토리를 localStorage에 영구 저장해 새로고침·재방문 후에도 이전 대화가 유지되고 AI 인사말이 반복되지 않게 한다.

**Architecture:** 새 `persistence.js` 모듈이 localStorage 읽기/쓰기를 전담한다. App.jsx는 sessionId를 localStorage에서 로드하고, roomMessages 변경 시 동기화한다. 방 입장 시 저장된 메시지가 있으면 greeting을 건너뛰고 `/api/rebuild-context`로 Claude 서버 컨텍스트를 복원한다. 온보딩 화면 맨 아래에 데이터 초기화 버튼을 추가한다.

**Tech Stack:** React 18, localStorage, Vitest (backend tests), Express (새 엔드포인트)

---

## File Structure

| 파일 | 변경 유형 | 역할 |
|---|---|---|
| `frontend/src/store/persistence.js` | **신규** | localStorage 읽기/쓰기 전담 모듈 |
| `frontend/src/App.jsx` | 수정 | sessionId 로드, roomMessages 동기화, enterRoom 수정, 초기화 버튼 |
| `backend/src/server.js` | 수정 | `/api/rebuild-context` 엔드포인트 추가 |
| `backend/src/tests/core.test.js` | 수정 | rebuild-context 로직 테스트 추가 |
| `frontend/src/styles.css` | 수정 | `.onboarding-reset-btn` 스타일 |

---

### Task 1: persistence.js 모듈 생성

**Files:**
- Create: `frontend/src/store/persistence.js`

- [ ] **Step 1: 파일 생성**

`frontend/src/store/persistence.js` 를 아래 내용으로 생성한다:

```js
const SESSION_KEY = 'zb-m-session-id'
const roomKey = (id) => `zb-m-room-${id}`
const MAX_MESSAGES = 50

/** localStorage에서 sessionId 로드. 없으면 신규 생성 후 저장. */
export function loadSessionId() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) return stored
    const id = 'sess_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return 'sess_' + Math.random().toString(36).slice(2, 10)
  }
}

/** 방별 메시지 로드. 파싱 실패 시 [] 반환. */
export function loadRoomMessages(accountId) {
  try {
    const raw = localStorage.getItem(roomKey(accountId))
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/**
 * 방별 메시지 저장.
 * 직렬화 가능한 메시지(텍스트, 스트리밍 완료)만 최근 50개 보존.
 */
export function saveRoomMessages(accountId, msgs) {
  try {
    const serializable = msgs.filter(
      (m) =>
        !m.streaming &&
        ((m.role === 'user' && typeof m.text === 'string') ||
          (m.role === 'assistant' && m.type === 'text' && typeof m.text === 'string'))
    )
    localStorage.setItem(roomKey(accountId), JSON.stringify(serializable.slice(-MAX_MESSAGES)))
  } catch { /* storage full 등 — silent */ }
}

/**
 * zb-m-* 키 전체 삭제 (초기화).
 * sessionId도 삭제되므로 reload 후 신규 생성된다.
 */
export function clearAllData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('zb-m-'))
      .forEach((k) => localStorage.removeItem(k))
  } catch { /* silent */ }
}
```

- [ ] **Step 2: store 디렉토리 확인**

```bash
ls frontend/src/store/
```

Expected: `persistence.js` 파일 존재.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/persistence.js
git commit -m "feat: persistence.js — localStorage 세션/메시지 영속화 모듈"
```

---

### Task 2: 백엔드 /api/rebuild-context 엔드포인트 + 테스트

**Files:**
- Modify: `backend/src/server.js`
- Modify: `backend/src/tests/core.test.js`

- [ ] **Step 1: 테스트 추가 (failing)**

`backend/src/tests/core.test.js` 끝에 아래 블록을 추가한다:

```js
// ── Test 7: rebuild-context 로직 ──────────────────────────────────────────────
describe('rebuild-context 세션 복원 로직', () => {
  it('빈 세션에 메시지를 주입해야 한다', () => {
    const session = { messages: [] }
    const incoming = [
      { role: 'user', content: '잔액 얼마야?' },
      { role: 'assistant', content: '2,847,300원입니다.' },
    ]
    if (session.messages.length === 0) {
      session.messages = incoming.slice(-20)
    }
    expect(session.messages.length).toBe(2)
    expect(session.messages[0].role).toBe('user')
    expect(session.messages[1].content).toBe('2,847,300원입니다.')
  })

  it('이미 메시지가 있는 세션은 덮어쓰지 않아야 한다', () => {
    const session = { messages: [{ role: 'user', content: '기존 메시지' }] }
    const incoming = [{ role: 'user', content: '새 메시지' }]
    if (session.messages.length === 0) {
      session.messages = incoming
    }
    expect(session.messages[0].content).toBe('기존 메시지')
  })

  it('20개 초과 메시지는 최근 20개만 주입해야 한다', () => {
    const session = { messages: [] }
    const incoming = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg ${i}`,
    }))
    if (session.messages.length === 0) {
      session.messages = incoming.slice(-20)
    }
    expect(session.messages.length).toBe(20)
    expect(session.messages[0].content).toBe('msg 5')
  })

  it('role/content 없는 항목은 필터링해야 한다', () => {
    const session = { messages: [] }
    const incoming = [
      { role: 'user', content: '유효' },
      { content: '역할없음' },       // role 없음
      { role: 'assistant' },          // content 없음
    ]
    if (session.messages.length === 0) {
      session.messages = incoming.filter((m) => m.role && m.content).slice(-20)
    }
    expect(session.messages.length).toBe(1)
    expect(session.messages[0].content).toBe('유효')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd backend && npx vitest run src/tests/core.test.js
```

Expected: 새 4개 테스트 PASS (이 테스트는 순수 로직이므로 엔드포인트 없어도 통과함).
총 21개 테스트 PASS.

- [ ] **Step 3: server.js에 엔드포인트 추가**

`backend/src/server.js`에서 `POST /api/reset-mock` 엔드포인트 블록 바로 앞(약 line 458)에 아래 코드를 삽입한다:

```js
// POST /api/rebuild-context — 페이지 리로드 후 서버 세션 컨텍스트 복원
// ──────────────────────────────────────────────
app.post('/api/rebuild-context', (req, res) => {
  const { sessionId, messages } = req.body
  if (!sessionId || !Array.isArray(messages)) return res.json({ ok: false })
  const session = getSession(sessionId)
  if (session.messages.length === 0) {
    session.messages = messages.filter((m) => m.role && m.content).slice(-20)
  }
  res.json({ ok: true, rebuilt: session.messages.length })
})
```

- [ ] **Step 4: 테스트 재실행 (전체 통과 확인)**

```bash
cd backend && npx vitest run src/tests/core.test.js
```

Expected: 21개 테스트 모두 PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/tests/core.test.js backend/src/server.js
git commit -m "feat: /api/rebuild-context 엔드포인트 + 테스트"
```

---

### Task 3: App.jsx — sessionId + roomMessages localStorage 통합

**Files:**
- Modify: `frontend/src/App.jsx`

이 Task는 sessionId 로드와 roomMessages 자동 저장을 담당한다. enterRoom 수정은 Task 4에서 한다.

- [ ] **Step 1: import 추가**

`frontend/src/App.jsx` 상단 import 블록(line 1 근처)에 아래 줄을 추가한다:

```js
import { loadSessionId, loadRoomMessages, saveRoomMessages, clearAllData } from './store/persistence.js'
```

- [ ] **Step 2: sessionId를 localStorage에서 로드하도록 변경**

현재 코드 (line 127):
```js
const [sessionId] = useState(getSessionId)
```

변경 후:
```js
const [sessionId] = useState(loadSessionId)
```

`getSessionId` 함수(line 13-16)는 삭제하지 않아도 되지만, 더 이상 사용되지 않는다. 그대로 둔다.

- [ ] **Step 3: roomMessages 자동 저장 useEffect 추가**

App 컴포넌트 내부, `fetchRoomGreeting` useCallback 정의 바로 위(line ~635)에 아래 useEffect를 추가한다:

```js
// roomMessages 변경 시 localStorage에 자동 저장
useEffect(() => {
  if (screen === 'room' && activeAccountId && roomMessages[activeAccountId]) {
    saveRoomMessages(activeAccountId, roomMessages[activeAccountId])
  }
}, [screen, activeAccountId, roomMessages])
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: sessionId localStorage 영속화 + roomMessages 자동 저장"
```

---

### Task 4: App.jsx — enterRoom 컨텍스트 재건 + 초기화 버튼 동작

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: enterRoom 수정**

현재 코드 (line ~764-767):
```js
// Living Accounts: 첫 입장 시만 AI 프로액티브 인사말 생성
if (!roomMessages[accountId] || roomMessages[accountId].length === 0) {
  fetchRoomGreeting(accountId)
}
```

변경 후:
```js
// Living Accounts: 메시지 없을 때만 처리
if (!roomMessages[accountId] || roomMessages[accountId].length === 0) {
  const stored = loadRoomMessages(accountId)
  if (stored.length > 0) {
    // 이전 대화 복원 + 서버 컨텍스트 재건 (fire-and-forget)
    setRoomMessages((prev) => ({ ...prev, [accountId]: stored }))
    const contextMsgs = stored.slice(-20).map((m) => ({ role: m.role, content: m.text || '' }))
    fetch(`${API_BASE}/api/rebuild-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, messages: contextMsgs }),
    }).catch(() => {})
  } else {
    fetchRoomGreeting(accountId)
  }
}
```

- [ ] **Step 2: handleResetAll 함수 추가 + handleResetMock 교체**

`handleResetMock` 함수(line ~609)를 아래로 교체한다:

```js
// 전체 데이터 초기화 (localStorage + mock + 페이지 리로드)
async function handleResetAll() {
  clearAllData()
  await fetch(`${API_BASE}/api/reset-mock`, { method: 'POST' }).catch(() => {})
  window.location.reload()
}
```

AccountListScreen에 `onReset={handleResetMock}` 으로 전달되던 것을 `onReset={handleResetAll}` 으로 변경한다 (line ~886):

```jsx
onReset={handleResetAll}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: enterRoom localStorage 복원 + rebuild-context + handleResetAll"
```

---

### Task 5: 온보딩 초기화 버튼 + CSS 스타일

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: 온보딩 초기화 버튼 추가**

`frontend/src/App.jsx`의 온보딩 오버레이(line ~961-968)에서 `시작하기` 버튼 바로 아래에 추가한다:

현재:
```jsx
            <button
              className="onboarding-cta"
              onClick={dismissOnboarding}
              autoFocus
            >
              시작하기
            </button>
          </div>
        </div>
```

변경 후:
```jsx
            <button
              className="onboarding-cta"
              onClick={dismissOnboarding}
              autoFocus
            >
              시작하기
            </button>
            <button
              className="onboarding-reset-btn"
              onClick={handleResetAll}
            >
              데이터 초기화
            </button>
          </div>
        </div>
```

- [ ] **Step 2: CSS 스타일 추가**

`frontend/src/styles.css` 파일에서 `.onboarding-cta` 스타일 블록 바로 뒤를 찾아 아래를 추가한다. `.onboarding-cta` 블록은 styles.css에서 `onboarding-cta`로 검색하면 찾을 수 있다.

```css
.onboarding-reset-btn {
  margin-top: 16px;
  background: none;
  border: none;
  color: var(--text-muted, rgba(255,255,255,0.3));
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  letter-spacing: 0.02em;
}

.onboarding-reset-btn:hover {
  color: rgba(255,255,255,0.5);
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

Expected: `✓ built in` 으로 끝나는 성공 메시지. 에러 없음.

- [ ] **Step 4: 백엔드 테스트 재확인**

```bash
cd backend && npx vitest run src/tests/core.test.js
```

Expected: 21개 테스트 모두 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx frontend/src/styles.css
git commit -m "feat: 온보딩 데이터 초기화 버튼 + 스타일"
```

---

### Task 6: zb/backend 동기화 + 배포

**Files:**
- Sync: `zb/backend/src/server.js`
- Sync: `zb/backend/src/tests/core.test.js`

- [ ] **Step 1: 변경된 백엔드 파일 zb에 복사**

```bash
cp backend/src/server.js ../../zb/backend/src/server.js
cp backend/src/tests/core.test.js ../../zb/backend/src/tests/core.test.js
```

- [ ] **Step 2: zb 테스트 통과 확인**

```bash
cd ../../zb/backend && npm test
```

Expected: 21개 테스트 PASS.

- [ ] **Step 3: Railway 배포**

```bash
cd ../../zb/backend
git add -A && git commit -m "feat: /api/rebuild-context 엔드포인트 추가"
railway up --detach
```

- [ ] **Step 4: Vercel 배포**

```bash
cd ../../zb-m/frontend && npx vercel --prod 2>&1 | tail -5
```

Expected: `Aliased: https://imagentbanking-m.vercel.app` 출력.

- [ ] **Step 5: 최종 커밋**

zb-m에서:
```bash
cd ../../zb-m
git add -A
git commit -m "feat: 대화 영속성 — localStorage 히스토리 유지, 컨텍스트 재건, 초기화 버튼"
```

---

## 검증 체크리스트

배포 후 브라우저에서 직접 확인:

1. **최초 방문**: 계좌방 입장 → AI 인사말 표시됨 ✓
2. **새로고침 후 재방문**: 인사말 없이 이전 대화 그대로 표시됨 ✓
3. **대화 후 새로고침**: 입력한 메시지들이 남아있음 ✓
4. **초기화 버튼**: 온보딩 화면 하단에 작은 "데이터 초기화" 버튼 표시됨 ✓
5. **초기화 실행**: 버튼 클릭 → localStorage 삭제 → 페이지 리로드 → 빈 상태로 첫 방문처럼 동작 ✓
6. **sessionId 재사용**: `localStorage.getItem('zb-m-session-id')` 값이 새로고침 후에도 동일 ✓
