# 주계좌 빠른 송금 패널 설계

## 목표

주계좌 대화방에서 매번 자연어를 입력하지 않고도 수신자·금액을 빠르게 선택해 이체를 실행할 수 있는 UI. 단, 실행은 반드시 AI 채팅 스트림을 통과시켜 대화 히스토리로 기록한다.

---

## 1. 패널 구조

### 위치
입력창(`input-bar`) 바로 위에 고정 렌더링. 채팅 스크롤 영역과 독립.
`account.type === 'checking'`인 계좌방에서만 표시.

### 상태 (2-state)

**Collapsed:**
```
┌─────────────────────────────────────────────┐
│  ↕  빠른 송금   김영희 · 엄마 · +4명        │
└─────────────────────────────────────────────┘
```
- 빈도 상위 3명 이름을 미리보기로 노출 (탭 유도)
- 탭하면 expanded로 전환

**Expanded:**
```
┌─────────────────────────────────────────────┐
│  빠른 송금                               ↓  │
│ ┌────────┬────────┬─────────────────────┐  │
│ │  자주  │  최근  │       연락처        │  │
│ └────────┴────────┴─────────────────────┘  │
│  [수신자 목록 — 최대 높이 화면의 40%]       │
└─────────────────────────────────────────────┘
```
- 최대 높이: 화면의 40%
- 스크롤 가능

### 기본 상태
- 방 입장 시 expanded
- 사용자가 접으면 `localStorage['zb-m-qtp-collapsed']`에 저장, 다음 입장 시 유지

---

## 2. 탭 상세

### 자주 탭
- `transactions` prop에서 `amount < 0`인 출금 내역만 필터
- 수신자(`counterpart`)별 횟수 집계 → 내림차순 정렬
- `contacts` 배열과 매핑 (contacts에 있는 수신자만 표시)
- 최대 8명
- 각 행에 `suggestedAmount` (최다 이체 금액) chip 미리 노출

```
김영희   iM뱅크    [50,000원]   >
엄  마   농협은행  [30,000원]   >
아  빠   iM뱅크    [100,000원]  >
```

### 최근 탭
- 출금 내역 최근 일시 기준 정렬
- 동일 수신자 중복 제거 (가장 최근 1건만)
- 최대 10명
- contacts 매핑 필수

### 연락처 탭
- `contacts` 배열 전체, 가나다 정렬
- 상단 검색 입력창 (이름 실시간 필터)
- 검색 입력창 placeholder: "이름으로 검색"

---

## 3. 수신자 선택 → 인라인 확장

수신자 행 탭 시 해당 행 아래로 확장:

```
┌─────────────────────────────────────────────┐
│ ✓ 김영희   iM뱅크  ****7890               │
│                                             │
│  [30,000]    [50,000]   [100,000]  [직접입력] │
│   최근 이체   자주 이체    —           —   │
│                                             │
│           ────[ 보내기 ]────                │
└─────────────────────────────────────────────┘
```

### 금액 chip 구성
| chip | 데이터 출처 |
|---|---|
| chip 1 | 해당 수신자의 최근 이체 금액 (`transactions`에서 계산) |
| chip 2 | 해당 수신자의 최다 이체 금액 (`transactions`에서 계산) |
| chip 3 | chip 1 = chip 2인 경우 생략, 아니면 둘 다 표시 |
| 직접 입력 | 탭 시 숫자 키패드 인라인 노출, 만원 단위 입력 |

chip 1과 chip 2가 동일한 경우 chip 하나만 표시.

### 보내기 버튼 활성화 조건
- 수신자 선택됨 AND 금액 > 0

---

## 4. AI-Hybrid 확인 플로우

"보내기" 탭 후 순서:

1. 패널 collapsed 상태로 애니메이션 전환
2. 채팅창에 **사용자 말풍선 주입**: `"[수신자]에게 [금액]원 보내줘"`
3. 300ms 후 AI 타이핑 indicator
4. AI 말풍선 주입: `"[수신자]님께 [금액]원 이체하겠습니다."`
5. `TransferCard` 렌더링 (기존 swipe-to-confirm)
6. 이체 완료 → AI 말풍선: `"✓ 완료됐습니다."`

### 핵심 원칙
- 패널에서 결정된 수신자·금액이므로 `resolve_contact` / `get_transfer_suggestion` AI 툴 호출 없음
- 대화 히스토리에 "누구에게, 얼마" 기록 → 이후 AI 조회 컨텍스트로 활용 가능
- 기존 `POST /api/confirm-transfer` + WebSocket `PENDING_TRANSFER` 플로우를 그대로 재사용

---

## 5. 새 API 엔드포인트

### `POST /api/quick-transfer`

**Request:**
```json
{
  "sessionId": "string",
  "contactId": "string",
  "amount": 50000
}
```

**처리 흐름:**
1. `contactId`로 contacts 조회
2. 주계좌(`type: 'checking'`) 잔액 확인
3. TransferCard용 `pendingTransfer` 데이터 구성
4. `session.pendingTransfer`에 저장
5. WebSocket `PENDING_TRANSFER` 이벤트 발송
6. 사용자·AI 말풍선 텍스트를 SSE 또는 Response body로 반환

**Response:**
```json
{
  "userText": "김영희에게 50,000원 보내줘",
  "aiText": "김영희님께 50,000원 이체하겠습니다."
}
```

---

## 6. 컴포넌트 아키텍처

### 신규 파일
| 파일 | 역할 |
|---|---|
| `frontend/src/components/QuickTransferPanel.jsx` | 패널 전체 (탭, 목록, 상태 관리) |
| `frontend/src/components/QuickTransferRecipientRow.jsx` | 수신자 1행 + 인라인 확장 |

### `QuickTransferPanel` props
```js
{
  account,          // 주계좌 객체
  contacts,         // contacts 배열
  transactions,     // 이체 내역 배열 (빈도 계산용)
  sessionId,
  onTransferReady,  // (contactId, amount) → App.jsx 핸들러 호출
}
```

### `QuickTransferRecipientRow` props
```js
{
  contact,           // { id, realName, bank, accountNo }
  recentAmount,      // 최근 이체 금액 (없으면 null)
  frequentAmount,    // 최다 이체 금액 (없으면 null)
  isExpanded,
  onExpand,          // () => void
  onTransfer,        // (amount) => void
}
```

### 기존 파일 수정 범위
| 파일 | 변경 내용 |
|---|---|
| `AccountRoom.jsx` | `account.type === 'checking'`일 때 입력창 위 `<QuickTransferPanel>` 렌더링. `contacts` prop 추가 수신. |
| `App.jsx` | `onTransferReady(contactId, amount)` 핸들러: `/api/quick-transfer` 호출 → 사용자·AI 말풍선 주입 → TransferCard 표시 |
| `backend/src/server.js` | `POST /api/quick-transfer` 엔드포인트 추가 |
| `frontend/src/styles.css` | 패널, 탭, 수신자 행, chip, 키패드 CSS |

### contacts prop 전달 경로
`App.jsx` → `AccountRoom` (new prop `contacts`) → `QuickTransferPanel`

contacts 데이터는 `backend/src/mockData.js`의 `CONTACTS` 배열을 `/api/contacts` (신규) 또는 기존 `/api/reset-mock` 응답에 포함하여 프론트에 전달.

가장 단순한 방법: `GET /api/contacts` 엔드포인트 추가. App.jsx에서 최초 1회 fetch, `contacts` state 저장.

---

## 7. 빈도 계산 로직 (프론트엔드)

서버 호출 없이 `transactions` prop에서 직접 계산:

```js
// 수신자별 이체 빈도
function calcFrequency(transactions) {
  return transactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => {
      acc[t.counterpart] = (acc[t.counterpart] || 0) + 1
      return acc
    }, {})
}

// 수신자별 최근/최다 이체 금액
function calcAmounts(transactions, contactName) {
  const txs = transactions
    .filter(t => t.amount < 0 && t.counterpart === contactName)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const recentAmount = txs[0] ? Math.abs(txs[0].amount) : null

  const freqMap = txs.reduce((acc, t) => {
    const amt = Math.abs(t.amount)
    acc[amt] = (acc[amt] || 0) + 1
    return acc
  }, {})
  const frequentAmount = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return { recentAmount, frequentAmount: Number(frequentAmount) }
}
```

---

## 범위 밖 (이번 구현 제외)

- 즐겨찾기(★) 고정 기능
- 컨텍스트 기반 정렬 ("이번 달 아직 안 보낸 분" 등)
- 이체 예약
- 금액 직접 입력 시 만원 단위 자동 변환 UI
