# 계좌방 입장 경험 재설계

**날짜:** 2026-03-31
**대상:** iM뱅크 임원 데모 + 일반 사용자
**범위:** `AccountRoom.jsx`, `server.js` (room-greeting 프롬프트)

---

## 문제

계좌방에 입장하면 AI 인사말이 로딩되는 2~4초 동안 화면이 거의 비어 있다. 인사말도 계좌 타입에 따른 일반적인 문구 수준이고, 대화가 끝난 후 사용자가 다음에 무엇을 해야 할지 유도가 없다.

---

## 목표

- 방 입장 즉시(0ms) 의미 있는 정보가 보여야 한다.
- AI 인사말이 실제 계좌 데이터를 언급해야 한다.
- 인사말 완료 후 다음 행동이 명확해야 한다.

---

## 진입 흐름

```
방 입장 (탭)
  ├─ 즉시 (0ms)
  │   ├─ AccountLifeCard 렌더링 (기존, 계좌 props 기반)
  │   └─ InsightSnapshot 카드 렌더링 (신규, 클라이언트 계산)
  │
  ├─ 500ms 후
  │   └─ /api/room-greeting SSE 스트리밍 시작 (AI 인사말)
  │
  └─ 인사말 완료 후
      └─ QuickReply 버튼 3개 등장 (계좌 타입별)
```

API 호출 없이 즉시 렌더링 가능한 컴포넌트를 먼저 보여주고, AI 응답은 그 아래에 붙는다.

---

## 컴포넌트: InsightSnapshot

`AccountRoom.jsx` 내부에 정의. `account`와 `transactions` props만 사용하며 추가 API 호출 없음.

### 계좌 타입별 표시 내용

| 타입 | 표시 내용 |
|---|---|
| `checking` | 이번 달 지출 합계 + 전월 대비 증감(%) + 최대 지출 항목 1개 |
| `savings` (비상금통장 포함) | 잔액 + 이번 달 입금 합계 |
| `installment_savings` | 납입 진행률(N/M회) + 목표까지 남은 횟수 + 예상 만기 수령액 |
| `term_deposit` | 만기 D-day + 예상 이자 수령액 + 중도해지 손실액 (30일 이내 시 강조) |
| `cma` | 오늘 발생 이자 + 개설 이후 누적 이자 총액 |
| `debit_card` | 이번 달 사용액 + 전월 대비 증감(%) + 최다 지출 카테고리 |
| `credit_card` (isPromo) | 프로모 혜택 요약 (정적 텍스트) |

### 계산 로직

- **이번 달 지출**: `transactions`에서 현재 월 + `amount < 0` 필터 후 합산
- **전월 대비**: 전월 동일 조건으로 계산 후 % 차이
- **최대 지출 항목**: 이번 달 지출 중 절댓값 최대 1건의 `counterpart`
- **적금 예상 수령액**: `account.finalAmount` (API에서 이미 계산해서 전달)
- **예금 D-day**: `account.daysRemaining` (API에서 이미 전달)

### 디자인 원칙

- 카드 배경: `--bg-card (#1E2138)`, 액센트 컬러로 핵심 수치 강조
- 높이 고정 (약 80px) — 라이프 카드 아래, AI 인사말 위
- 수치가 없으면 (거래 없음 등) 렌더링 생략

---

## AI 인사말 개인화 (server.js)

`/api/room-greeting`의 `ROOM_GREETING_PROMPTS`에 계좌 데이터 스냅샷을 주입한다.

### 변경 전
```
checking: '입출금 계좌 담당 AI로서... 1-2문장.'
```

### 변경 후
`buildRoomGreetingPrompt(account, transactions)` 함수를 추가해 프롬프트를 동적으로 생성한다.

```js
function buildRoomGreetingPrompt(account, transactions) {
  // 계좌 타입별 데이터 스냅샷 계산
  // 프롬프트에 수치 삽입 후 반환
}
```

주입되는 데이터 예시 (checking):
- 이번 달 지출 합계
- 전월 대비 증감
- 최근 거래 1건 (counterpart + amount)
- 잔액

AI는 이 데이터를 자연스럽게 언급하되, 수치를 그대로 나열하지 않도록 프롬프트에서 지시한다.

---

## QuickReply 버튼

인사말 메시지 버블 아래에 붙는 버튼 3개. 탭 시 해당 텍스트를 자동 전송(`onSendMessage` 호출).

| 계좌 타입 | 버튼 1 | 버튼 2 | 버튼 3 |
|---|---|---|---|
| `checking` | 지출 분석해줘 | 이체하기 | 이번 달 요약 |
| `installment_savings` | 만기 수령액 계산해줘 | 중도해지하면 얼마야? | 비슷한 상품 있어? |
| `term_deposit` | 만기 후 재예치 추천해줘 | 지금 해지하면? | 금리 비교해줘 |
| `cma` | 수익률 분석해줘 | 더 좋은 상품 있어? | 주계좌로 일부 이체 |
| `debit_card` | 카드 사용 분석해줘 | 많이 쓴 카테고리 | 신용카드 비교 |
| `savings` | 잔액 현황 보여줘 | 이번 달 입출금 | 이체하기 |
| `credit_card` | 발급 조건 알려줘 | 혜택 자세히 | 다른 카드 비교 |

버튼은 인사말이 완료된 직후 fade-in으로 등장. 버튼 탭 후에는 사라진다 (재표시 없음).

---

## 변경 파일 범위

| 파일 | 변경 내용 |
|---|---|
| `frontend/src/components/AccountRoom.jsx` | InsightSnapshot 컴포넌트 추가, QuickReply 버튼 추가, 인사말 시작 500ms 지연 |
| `backend/src/server.js` | `buildRoomGreetingPrompt()` 함수 추가, `/api/room-greeting`에서 호출 |

---

## 성공 기준

- 방 입장 즉시 (0ms) 라이프 카드 + InsightSnapshot이 보인다.
- AI 인사말이 실제 수치를 1개 이상 언급한다.
- 인사말 완료 후 QuickReply 버튼이 표시된다.
- 빈 화면 노출 시간 0초.
