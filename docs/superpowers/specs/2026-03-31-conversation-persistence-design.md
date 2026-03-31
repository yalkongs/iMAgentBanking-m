# Conversation Persistence Design

> **Status:** Approved
> **Date:** 2026-03-31
> **Scope:** zb-m 사용성 테스트 단계 — 새로고침/재방문 시 대화 유지 + 온보딩 초기화 버튼

---

## Goal

계좌 대화방에 재입장할 때마다 AI 인사말이 반복되는 문제를 해결한다. 이전 대화 기록을 localStorage에 영구 저장하고, Claude의 서버사이드 컨텍스트도 방 입장 시 복원한다. 초기화는 온보딩 화면의 작은 버튼으로만 수행한다.

---

## Architecture

### 저장 구조 (localStorage)

| 키 | 값 | 설명 |
|---|---|---|
| `zb-m-session-id` | `"sess_abc123"` | sessionId 영구 재사용 |
| `zb-m-room-{accountId}` | `Message[]` (최근 50개) | 방별 채팅 히스토리 |

### 저장 대상 메시지 규칙

저장 **O:**
- `role: 'user'` — 텍스트 메시지
- `role: 'assistant'`, `type: 'text'` — 텍스트 응답 (streaming 완료 후)

저장 **X:**
- 카드 UI 메시지 (`type: 'transaction_alert'`, `'balance'`, `'ui_card'` 등) — 재현 불가
- `streaming: true` 상태인 메시지

### sessionId 생명주기

```
앱 시작
  └─ localStorage['zb-m-session-id'] 존재?
       ├─ YES → 재사용 (서버 살아있으면 session.messages 유지)
       └─ NO  → 신규 생성 후 localStorage 저장

초기화
  └─ localStorage 'zb-m-*' 전체 삭제
     → 새 sessionId 생성 + 저장
     → /api/reset-mock 호출
     → window.location.reload()
```

### 컨텍스트 재건 흐름

```
enterRoom(accountId)
  └─ localStorage에 이 방 메시지 있음?
       ├─ YES → 화면 표시 + 인사말 생략
       │        → POST /api/rebuild-context (fire-and-forget)
       │            { sessionId, messages: 최근 20개 텍스트 전용 }
       │        서버: session.messages 비어있으면 채워넣음, 있으면 no-op
       └─ NO  → 기존대로 fetchRoomGreeting()
```

rebuild는 비동기 fire-and-forget — UI 블로킹 없음.

---

## Backend: 새 엔드포인트

### `POST /api/rebuild-context`

**Request body:**
```json
{
  "sessionId": "sess_abc123",
  "messages": [
    { "role": "user", "content": "이번 달 얼마 썼어?" },
    { "role": "assistant", "content": "이번 달 총 지출은 194,030원입니다." }
  ]
}
```

**Server logic:**
```js
const session = getSession(sessionId)
if (session.messages.length === 0) {
  session.messages = messages  // 복원
}
res.json({ ok: true })
```

**No-op 조건:** `session.messages.length > 0` → Railway 살아있는 경우, 이미 컨텍스트 있으므로 덮어쓰지 않음.

---

## Frontend 변경사항

### 1. `src/store/persistence.js` (새 파일)

```js
const SESSION_KEY = 'zb-m-session-id'
const roomKey = (id) => `zb-m-room-${id}`
const MAX_MESSAGES = 50

export function loadSessionId() { ... }
export function saveSessionId(id) { ... }
export function loadRoomMessages(accountId) { ... }   // 없으면 []
export function saveRoomMessages(accountId, msgs) { } // 텍스트 메시지만 필터, 최근 50개
export function clearAllData() { ... }                // zb-m-* 키 전체 삭제
```

### 2. `App.jsx`

- `useState(getSessionId)` → `useState(loadSessionId)` (localStorage에서 로드)
- sessionId 생성 시 `saveSessionId(id)` 호출
- `roomMessages` 초기 state: `{}` (기존 유지)
- `enterRoom`: localStorage 메시지 있으면 `setRoomMessages`에 주입 + rebuild 호출
- `roomMessages` 변경 useEffect → `saveRoomMessages(activeAccountId, msgs)` 동기화
- `handleResetMock`: `clearAllData()` 호출 후 `window.location.reload()`

### 3. 온보딩 화면 초기화 버튼

`App.jsx` 또는 온보딩 컴포넌트 내 맨 하단:

```jsx
<button className="onboarding-reset-btn" onClick={handleResetAll}>
  데이터 초기화
</button>
```

**스타일:** 작은 텍스트, muted 색상 (`var(--text-muted)`), 하단 여백.

**`handleResetAll`:**
1. `clearAllData()` — localStorage 삭제
2. `POST /api/reset-mock` — 서버 계좌 초기화
3. `window.location.reload()` — 새 sessionId로 재시작

---

## 기존 초기화 버튼 (메뉴 드롭다운)

헤더 `⋯` 메뉴의 "초기화" 버튼도 동일하게 `handleResetAll`로 교체.

---

## 엣지 케이스

| 케이스 | 처리 |
|---|---|
| localStorage 용량 초과 | try/catch로 silent fail, 기존 동작 유지 |
| 메시지 직렬화 오류 | JSON.parse 실패 시 `[]` 반환 |
| rebuild-context 실패 | fire-and-forget, 무시 (Claude가 컨텍스트 없이 응답) |
| Railway 살아있고 messages 있음 | no-op, 기존 컨텍스트 유지 |
| 방 첫 방문 (localStorage 없음) | 기존 greeting 흐름 유지 |

---

## 변경 파일 목록

| 파일 | 변경 유형 |
|---|---|
| `frontend/src/store/persistence.js` | 신규 |
| `frontend/src/App.jsx` | 수정 |
| `backend/src/server.js` | 수정 (엔드포인트 추가) |
| `backend/src/tests/core.test.js` | 수정 (rebuild-context 테스트) |
| `frontend/src/styles.css` | 수정 (버튼 스타일) |
