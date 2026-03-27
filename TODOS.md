# TODOS

## TODO-1: 데모 당일 체크리스트 작성

**What:** 데모 전 준비 사항을 1-페이지 체크리스트로 정리.
**Why:** InsightCard 로딩 타임아웃, Railway cold start, 세션 초기화 등을 놓치면 임원 앞에서 빈 화면이나 스피너만 보인다.
**Pros:** 데모 실패 리스크를 제로에 가깝게 줄임.
**Cons:** 작성 시간 5분.
**Context:**
- InsightCard: /api/insights는 Claude 3번 호출 (~5초). 앱을 30초 전 미리 열어두어야 로딩 완료.
- Railway cold start: 무료 플랜은 15분 이상 미접속 시 sleep. 데모 직전 한 번 대화해두기.
- git init + 초기 커밋 완료 여부 확인.
- 환경변수 확인: ANTHROPIC_API_KEY, OPENAI_API_KEY (Whisper용).
**Effort:** S (human: ~5min / CC: N/A)
**Priority:** P1 (데모 전 필수)
**Depends on:** 구현 완료 후

---

## TODO-2: Railway 워밍업 cron 설정

**What:** cron-job.org (또는 유사 서비스)에서 20분마다 Railway 백엔드의 `/api/proactive`를 GET 요청.
**Why:** Railway 무료 플랜은 15분 이상 트래픽이 없으면 서버가 sleep 상태로 전환되어 WebSocket 연결이 완전히 실패함. 데모에서 TRANSACTION_ALERT가 동작하지 않을 수 있다.
**Pros:** Cold start 없이 항상 응답 준비 상태. 무료.
**Cons:** cron-job.org 계정 필요.
**Context:**
- 대상 URL: `https://{railway-backend-url}/api/proactive`
- 간격: 20분 (Railway sleep 기준 15분보다 짧게)
- CEO 리뷰에서 결정됨 (2026-03-24).
**Effort:** S (human: ~10min / CC: N/A, 외부 서비스 설정)
**Priority:** P1 (데모 전 필수)
**Depends on:** Railway 배포 완료

---

## TODO-3: 음성 인식/TTS 실패 이벤트 로깅

**What:** `useVoiceConfirm.js`와 `speakKorean()` 함수에 `console.error` 최소 로깅 추가.
**Why:** 데모 시연 중 음성 인식이나 TTS가 조용히 실패해도 원인 파악 불가. DevTools 없이 현장 디버깅 불가능.
**Pros:** 데모 안정성 향상, 이슈 발생 시 빠른 원인 파악.
**Cons:** 거의 없음 — S급 추가 작업.
**Context:**
- `useVoiceConfirm`: `SpeechRecognitionError` 발생 시 error.error 코드 로깅
- `speakKorean()`: try-catch 미적용 시 TTS 실패가 무음으로 넘어감
- CEO 리뷰 2026-03-25 결정.
**Effort:** S (human: ~15min / CC+gstack: ~5min)
**Priority:** P2
**Depends on:** Feature A 구현 완료

---

## TODO-5: Living Accounts — 계좌가 먼저 말을 거는 프로액티브 디자인 (Phase 2)

**What:** 각 계좌 채팅방에서 AI가 먼저 메시지를 보내는 프로액티브 UX. 예: 주계좌가 "이번달 카페 지출이 목표를 넘었어요", 적금이 "오늘 자동이체 완료! 6개월째 개근이에요" 등.
**Why:** 현재 사용자가 항상 먼저 물어야 함. 메신저 은유를 완성하려면 계좌가 먼저 말을 걸어야 함 — 10x 비전의 핵심.
**Pros:** 데모 임팩트 극대화. "AI 뱅킹"의 차별점을 가장 직관적으로 전달.
**Cons:** 각 계좌 타입별 개성 정의 필요, System Prompt 복잡도 증가.
**Context:**
- zb-m CEO 리뷰 2026-03-26 결정.
- 구현 방향: 채팅방 진입 시 계좌 타입에 따라 AI가 proactive 첫 메시지 생성 (SSE 스트리밍)
- 계좌 개성 예시: checking(실용적), installment_savings(격려), term_deposit(신중), savings(안전), cma(분석적)
- 기반: 기존 TRANSACTION_ALERT AI 코멘트 패턴 확장
- 10x 비전 전체: ~/.gstack/projects/yalkongs-iMAgentBanking/ceo-plans/2026-03-26-zb-m-messenger.md
**Effort:** M (human: ~3일 / CC+gstack: ~45min)
**Priority:** P2
**Depends on:** zb-m 기본 메신저 UI 완성 후

---

## TODO-6: AccountRoom 탭 분리 (대화 / 거래내역) ✅ DONE 2026-03-27

**What:** AccountRoom에 `[대화] [거래내역]` 탭 추가. 기본 탭은 대화. 거래내역 탭은 기존 타임라인을 분리.
**Why:** 거래 건수가 늘면 AI 대화가 거래 버블 아래 묻힌다. 두 콘텐츠 타입(기록 vs 대화)의 성격이 다르다 — 분리가 맞다.
**Pros:** 거래 100건이 쌓여도 AI 대화 접근성 유지. 구조적 확장성 확보.
**Cons:** 탭 추가로 UI 복잡도 소폭 증가.
**Context:**
- plan-design-review 결정 (2026-03-27, 1B).
- 탭 스타일 스펙: DESIGN.md "탭 바" 섹션 참조.
- ARIA: `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"` 필요.
- AccountListScreen preview: 마지막 거래 → 마지막 AI 대화 발언으로 교체.
**Effort:** M (human: ~반나절 / CC+gstack: ~25min)
**Priority:** P1
**Depends on:** 없음

---

## TODO-7: 첫 방문 온보딩 오버레이 ✅ DONE 2026-03-27

**What:** 앱 최초 실행 시 풀스크린 오버레이. "계좌가 먼저 말을 걸어요" + 기능 3줄 + "시작하기" CTA.
**Why:** 메신저 뱅킹 메타포를 처음 보는 임원/사용자가 "왜 카톡처럼 생겼지?"라고 혼란스러워한다. 힌트 없이는 무엇을 탭해야 하는지 모른다.
**Pros:** 데모 발표자가 설명하지 않아도 앱이 스스로 설명한다. 임원 데모 첫인상 개선.
**Cons:** 구현 30분.
**Context:**
- plan-design-review 결정 (2026-03-27, 3A).
- 상세 스펙: DESIGN.md "온보딩 오버레이" 섹션.
- 트리거: `localStorage['zb-m-onboarded']` 없을 때.
- handleReset() 시 localStorage 초기화 → 온보딩 재표시.
**Effort:** S (human: ~30min / CC+gstack: ~10min)
**Priority:** P1
**Depends on:** 없음

---

## TODO-8: 계좌 아바타 이모지 → SVG 아이콘 교체 ✅ DONE 2026-03-27

**What:** TYPE_CONFIG의 이모지 아이콘(💳 🏦 📈 🐷 📊)을 인라인 SVG로 교체.
**Why:** 이모지는 "빠르게 만든 프로토타입" 인상을 준다. iM뱅크 임원 데모에서 신뢰감을 낮춘다.
**Pros:** 즉각적인 시각적 프로페셔널함 향상. 외부 라이브러리 불필요.
**Cons:** SVG path 5개 작성 필요.
**Context:**
- plan-design-review 결정 (2026-03-27, 4B).
- 상세 스펙: DESIGN.md "계좌 아바타 SVG" 섹션.
- 수정 위치: AccountListScreen.jsx + AccountRoom.jsx TYPE_CONFIG.icon 필드.
**Effort:** S (human: ~1시간 / CC+gstack: ~15min)
**Priority:** P1
**Depends on:** 없음

---

## TODO-9: 거래내역 탭 무한 스크롤 페이지네이션 ✅ DONE 2026-03-27

**What:** 거래내역 탭 하단 도달 시 다음 페이지 자동 로드. 백엔드 page 파라미터 추가.
**Why:** 현재 5건 고정 제한. 실제 사용자는 월 50건 이상. 탭 분리 후 거래내역 탭이 의미 있으려면 스크롤 가능해야 한다.
**Pros:** 거래 건수 제한 없이 확장 가능. 데모에서도 "더 많은 거래 내역"을 보여줄 수 있음.
**Cons:** 백엔드 API 변경 필요 (`/api/account/:id?page=N&limit=20`).
**Context:**
- plan-design-review 결정 (2026-03-27, 6B).
- IntersectionObserver 사용 (scroll event 금지 — iOS 성능 이슈).
- 로딩: TxSkeleton 2개. 종료: "모든 거래 내역을 확인했습니다" 문구.
**Effort:** M (human: ~반나절 / CC+gstack: ~20min)
**Priority:** P2
**Depends on:** TODO-6 (탭 분리 완료 후)

---

## TODO-4: Railway 워밍업 cron 재확인 (Feature A 완료 후)

**What:** Feature A+B 배포 후 Railway 워밍업 cron이 새 엔드포인트와 함께 정상 동작하는지 확인. 기존 TODO-2의 후속.
**Why:** Feature B의 `/api/chat` 새 툴 핸들러가 cold start 시 처음 호출에 초기화 지연이 생길 수 있음.
**Pros:** 데모 당일 Feature B 첫 호출 지연 없음.
**Cons:** 외부 cron 설정 변경 필요 없음 — 기존 `/api/proactive` ping으로 충분.
**Context:**
- 기존 TODO-2와 동일 cron 사용 가능 (경로 변경 없음)
- Feature A+B 배포 완료 후 확인 체크만 필요
- CEO 리뷰 2026-03-25 결정.
**Effort:** S (human: ~5min)
**Priority:** P2
**Depends on:** Feature A+B 배포 완료
