# Product Enrollment Design

> **Status:** Approved
> **Date:** 2026-03-31
> **Scope:** zb-m 사용성 테스트 단계 — 프로모 계좌방에서 실제 상품 가입 절차 구현

---

## Goal

프로모 계좌방(CMA, 정기예금, 비상금통장)에서 AI 소개 후 실제 상품 가입 절차를 대화방 UI 안에서 완료할 수 있게 한다. 전통적인 GUI 폼 대신 모달+채팅 하이브리드 방식으로, 금융감독원 비대면 계좌 개설 절차를 시뮬레이션한다.

---

## UX 철학

**넛지(nudge) 설계** — 강요하지 않고 자연스럽게 다음 단계로 유도한다.
- 가입은 사용자가 원할 때 시작 (ProductPitchCard의 "가입하기" 버튼)
- 모달 이탈 시 강요 없음 — 10분 후 AI가 한 번만 재유도
- 모든 AI 메시지는 감정(기대, 안심, 보람)을 설계에 반영
- D+1 이자 알림으로 가입 후에도 engagement 유지

---

## Architecture

### 접근 방식: 프론트 상태 머신 + 스크립트 AI 메시지

- 프론트엔드 `enrollmentState`가 단계 전체 관리
- AI 메시지는 단계 전환 시 미리 작성된 문구를 채팅에 주입
- 백엔드는 최종 가입 확정(`POST /api/enroll`) 하나만 처리
- Claude 응답 속도에 UX가 종속되지 않아 안정적

### enrollmentState 구조

```js
enrollmentState = {
  productId: 'promo_cma' | 'promo_term_deposit' | 'promo_savings',
  step: 0,
  data: {
    phone,           // 마스킹 표시용
    amount,          // 입금 금액
    fromAccountId,   // 출금 계좌
    term,            // 정기예금 기간 (개월)
    maturityAction   // 재예치 | 해지
  },
  isOpen: false,
  status: 'idle' | 'in_progress' | 'completed' | 'abandoned'
}
```

### 플로우

```
[ProductPitchCard "가입하기" 버튼 탭]
        ↓
enrollmentState.step = 1, isOpen = true
        ↓
[EnrollmentModal — 현재 step에 맞는 UI]
        ↓
사용자 입력 완료 → [다음]
        ↓
isOpen = false → 500ms 딜레이
        ↓
채팅에 AI 스크립트 메시지 주입 (typing indicator → 텍스트)
        ↓
step++ → isOpen = true → 다음 모달
        ↓ (반복)
마지막 단계 완료 → POST /api/enroll
        ↓
백엔드: 세션에 실계좌 생성, 프로모 제거
        ↓
프론트: 방 변신 + 완료 AI 메시지 + AccountLifeCard 등장
```

### 모달 이탈 처리

모달 dismiss 시 `status: 'abandoned'` 전환. 10분 후 해당 방에 AI 재유도 메시지 1회 표시. 재유도는 세션당 1회 한정.

---

## 상품별 단계 상세

### CMA — iM CMA MMF (3 모달, ~45초)

| 단계 | 유형 | 내용 |
|---|---|---|
| 0 | 채팅 | AI 소개 카드 + [가입하기] 버튼 |
| 1 | 모달 | 등록 전화번호 확인 `010-****-1234` + [확인] |
| — | 채팅 | "인증번호를 보냈어요. 문자 확인해주세요" |
| 2 | 모달 | SMS 6자리 입력 (고정값 `123456`, 힌트 표시) |
| — | 채팅 | "확인됐어요! 첫 입금액을 정해볼게요" |
| 3 | 모달 | 출금 계좌 선택 + 금액 입력 (0원 = "나중에" 가능) |
| — | 채팅 | "iM CMA 계좌가 열렸어요 — 오늘 밤 첫 이자가 붙을 거예요" + AccountLifeCard |

### 정기예금 (4 모달, ~90초)

| 단계 | 유형 | 내용 |
|---|---|---|
| 0 | 채팅 | AI 소개 카드 + [가입하기] 버튼 |
| 1 | 모달 | 전화번호 확인 |
| — | 채팅 | "인증번호를 보냈어요" |
| 2 | 모달 | SMS 6자리 입력 |
| — | 채팅 | "확인됐어요! 예치 조건을 설정해볼게요" |
| 3 | 모달 | 기간 칩 `6개월` `12개월` `24개월` + 금액 + 만기처리 `재예치` `해지` |
| — | 채팅 | "마지막으로 공인인증서 확인이 필요해요" |
| 4 | 모달 | 공인인증서 시뮬레이션 — [인증하기] → 2초 스피너 → 완료 |
| — | 채팅 | "예금 가입 완료! 12개월 후 X,XXX,XXX원을 받으실 거예요" + AccountLifeCard |

만기일 계산: `new Date()` 기준 `term` 개월 후. 만기 30일 전 `FINANCIAL_MOMENT` 알림 트리거.

### 비상금통장 (3 모달, ~45초)

| 단계 | 유형 | 내용 |
|---|---|---|
| 0 | 채팅 | AI 소개 카드 + [가입하기] 버튼 |
| 1 | 모달 | 전화번호 확인 |
| — | 채팅 | "인증번호를 보냈어요" |
| 2 | 모달 | SMS 6자리 입력 |
| — | 채팅 | "확인됐어요! 첫 비상금으로 얼마를 넣어둘까요?" |
| 3 | 모달 | 출금 계좌 + 금액 (0원 가능, "지금 없어도 괜찮아요" 서브텍스트) |
| — | 채팅 | "비상금통장이 만들어졌어요. 있다는 것만으로도 든든하죠" + AccountLifeCard |

---

## 넛지 메시지 스크립트

### 설계 원칙

| 시점 | 심리 목표 | 어조 |
|---|---|---|
| 가입 전 소개 | 호기심 자극, 부담 제거 | 가볍고 구체적 |
| 인증 중간 | 안심, 속도감 | 짧고 확신 있게 |
| 조건 설정 전 | 자율성 강조 | 제안하는 톤 |
| 완료 순간 | 기대감 생성 | 따뜻하고 미래 지향 |
| 이탈 후 재유도 | 압박 없이 문 열어두기 | 한 발 물러선 태도 |

### CMA

- **소개 서브텍스트:** "지금 입출금 계좌에 있는 돈, 오늘 밤에도 그냥 자고 있어요."
- **SMS 발송 후:** "인증번호를 보냈어요. 문자 확인해주세요."
- **인증 완료:** "확인됐어요! 입금할 금액만 정하면 바로 개설돼요."
- **완료:** "iM CMA 계좌가 열렸어요. 오늘 밤부터 이자가 붙기 시작해요."
- **이탈 재유도:** "가입 중간에 나가셨더라고요. 아직 자리 있어요, 이어서 할까요?"

### 정기예금

- **소개 서브텍스트:** "적금보다 금리가 높은데, 12개월만 맡겨두면 돼요."
- **SMS 발송 후:** "인증번호 보냈어요."
- **인증 완료:** "확인됐어요! 기간이랑 금액만 정해볼게요."
- **공인인증서 직전:** "마지막 단계예요. 공인인증서로 확인해 드릴게요."
- **완료:** "12개월 예금 가입됐어요. 만기일에 X,XXX,XXX원을 받으실 거예요."
- **이탈 재유도:** "예금 설정 중간에 나가셨어요. 언제든 이어서 하셔도 돼요."

### 비상금통장

- **소개 서브텍스트:** "갑자기 돈이 필요할 때, 어디서 꺼낼지 정해두는 거예요."
- **SMS 발송 후:** "인증번호 보냈어요."
- **인증 완료:** "확인됐어요! 지금 넣어둘 금액이 있으면 정해볼게요. 없어도 괜찮아요."
- **완료:** "비상금통장이 생겼어요. 쓸 일이 없는 게 제일 좋지만, 있다는 게 중요해요."
- **이탈 재유도:** "비상금통장 개설 중이었어요. 3분이면 돼요, 이어서 할까요?"

### D+1 알림 (WebSocket FINANCIAL_MOMENT)

- **CMA/비상금 D+1:** "어젯밤 첫 이자가 붙었어요 — +18원. 작아 보여도 매일이에요."
- **정기예금 만기 D-30:** "예금 만기가 한 달 남았어요. 재예치할지 미리 생각해두면 좋아요."

---

## 백엔드 변경사항

### `POST /api/enroll`

**Request:**
```json
{
  "sessionId": "sess_abc",
  "productId": "promo_cma",
  "enrollData": {
    "amount": 500000,
    "fromAccountId": "acc001",
    "term": null,
    "maturityAction": null
  }
}
```

**Logic:**
1. 세션에서 프로모 계좌 제거 (`productId` 기준)
2. `createAccount(productId, enrollData)`로 실계좌 생성
3. `amount > 0`이면 출금 계좌 차감 + 신규 계좌 입금 + 거래내역 기록
4. `res.json({ ok: true, account: newAccount })`

### `createAccount(productId, enrollData)` — mockData.js

| productId | 생성 계좌 | 특이사항 |
|---|---|---|
| `promo_cma` | `id: 'cma_001'`, type: `cma` | 연 4.75% 이자율 |
| `promo_term_deposit` | `id: 'term_001'`, type: `term_deposit` | maturityDate, term, maturityAction 저장 |
| `promo_savings` | `id: 'savings_emg_001'`, type: `savings` | 비상금 태그 |

---

## 프론트엔드 변경사항

### 신규: `EnrollmentModal.jsx`

```
EnrollmentModal
  ├── PhoneConfirmStep   — 마스킹 번호 + [확인]
  ├── SmsVerifyStep      — 6자리 입력 + 힌트 "123456"
  ├── FundStep           — 계좌 선택 드롭다운 + 금액 입력 (CMA/비상금)
  ├── TermStep           — 기간 칩 + 금액 + 만기처리 선택 (정기예금)
  └── CertStep           — [인증하기] → 로딩 2초 → 완료 (정기예금만)
```

공통 구조: 상단 dot indicator + 중간 step UI + 하단 [다음]/[취소]

### `App.jsx` 수정

- `enrollmentState` useState 추가
- `startEnrollment(productId)` — 모달 시작
- `handleEnrollStep(stepData)` — 단계 전환 (500ms 딜레이 + AI 메시지 주입)
- `handleEnrollComplete()` — POST /api/enroll 호출 + 계좌 상태 업데이트

### `AccountRoom.jsx` 수정

- ProductPitchCard 렌더링 시 `onStartEnrollment` prop 연결
- "가입하기" 버튼 탭 → `startEnrollment(productId)` 호출

---

## 변경 파일 목록

| 파일 | 유형 |
|---|---|
| `frontend/src/components/EnrollmentModal.jsx` | 신규 |
| `frontend/src/App.jsx` | 수정 |
| `frontend/src/components/AccountRoom.jsx` | 수정 |
| `frontend/src/styles.css` | 수정 |
| `backend/src/server.js` | 수정 |
| `backend/src/mockData.js` | 수정 |
| `backend/src/tests/core.test.js` | 수정 |

---

## 엣지 케이스

| 케이스 | 처리 |
|---|---|
| 모달 도중 dismiss | `status: 'abandoned'`, 10분 후 재유도 1회 |
| amount = 0 | 이체 없이 계좌만 개설, 유효한 플로우 |
| 잔액 부족 | FundStep에서 선택 가능한 금액 초과 시 즉시 에러 메시지 |
| 이미 실계좌 존재 | 서버에서 중복 가입 방지 (productId 기준) |
| /api/enroll 실패 | AI 메시지: "일시적 오류가 있어요. 잠시 후 다시 시도해 주세요" |
