// ──────────────────────────────────────────────
// 계좌 — iM뱅크 (입출금 + 예적금)
// ──────────────────────────────────────────────
export const accounts = [
  // ── 입출금 · 카드 ──
  {
    id: 'acc001',
    name: '주계좌',
    balance: 2847300,
    type: 'checking',
    bank: 'iM뱅크',
    accountNo: '503-12-3456789',
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
    cardNo: null,
    last4: null,
    linkedAccountId: 'acc001',
    isPromo: true,
    promoHook: '국내외 최대 1.5% 캐시백 · 첫 해 연회비 무료',
    creditLimit: 3000000,
    billingDate: 15,
  },
  {
    id: 'acc008',
    name: '급여계좌',
    balance: 8140000,
    type: 'checking',
    bank: 'iM뱅크',
    accountNo: '503-98-7654321',
  },
  // ── 저축 · 투자 ──
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
    promoHook: '잔액이 쉬는 동안 매일 이자 — 연 4.75%',
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
    promoHook: '목돈을 안전하게, 연 4.20% 확정금리',
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
    promoHook: '언제든 출금 가능, 금리는 챙기고',
  },
]

// ──────────────────────────────────────────────
// 연락처 — 실명+계좌 기반 (닉네임 없음)
// ──────────────────────────────────────────────
export const contacts = [
  { id: 'c001', realName: '김영희',       bank: '국민은행',    accountNo: '110-234-567890' },
  { id: 'c002', realName: '김철호',       bank: '신한은행',    accountNo: '110-345-678901' },
  { id: 'c003', realName: '김철수',       bank: '하나은행',    accountNo: '130-456-789012' },
  { id: 'c004', realName: '이민지',       bank: '카카오뱅크',  accountNo: '333-78-9012345' },
  { id: 'c005', realName: '(주)ABC테크',  bank: '기업은행',    accountNo: '110-567-890123' },
  { id: 'c006', realName: '김민준',       bank: '토스뱅크',    accountNo: '100-10-123456'  },
  { id: 'c007', realName: '박지수',       bank: '신한은행',    accountNo: '110-678-901234' },
  { id: 'c008', realName: '최현우',       bank: '우리은행',    accountNo: '1002-345-678901'},
  { id: 'c009', realName: '이순자',       bank: '농협은행',    accountNo: '301-1234-5678-01'},
  { id: 'c010', realName: '파워짐 강남점',bank: '국민은행',    accountNo: '110-789-012345' },
  { id: 'c011', realName: '박상철',       bank: '신한은행',    accountNo: '110-890-123456' },
  { id: 'c012', realName: '정세영',       bank: '카카오뱅크',  accountNo: '333-90-1234567' },
  { id: 'c013', realName: '오승훈',       bank: '토스뱅크',    accountNo: '100-20-234567'  },
  { id: 'c014', realName: '김수진',       bank: '하나은행',    accountNo: '130-567-890123' },
  { id: 'c015', realName: '강남영어학원', bank: '기업은행',    accountNo: '110-901-234567' },
  { id: 'c016', realName: '김순자',       bank: '농협은행',    accountNo: '301-5678-9012-01' }, // 엄마
  { id: 'c017', realName: '김기준',       bank: '하나은행',    accountNo: '130-789-012345'  }, // 아빠
  { id: 'c018', realName: '이정훈',       bank: '신한은행',    accountNo: '110-234-901234'  },
  { id: 'c019', realName: '박민서',       bank: '카카오뱅크',  accountNo: '333-12-3456789'  },
  { id: 'c020', realName: '최동욱',       bank: '국민은행',    accountNo: '110-345-012345'  },
]

// ──────────────────────────────────────────────
// 카드 (마이데이터 연동 포함)
// ──────────────────────────────────────────────
export const cards = [
  {
    id: 'card001',
    name: 'iM 체크카드',
    type: 'debit',
    issuer: 'iM뱅크',
    last4: '3847',
    linkedAccountId: 'acc001',
    source: 'own',
  },
  {
    id: 'card002',
    name: 'iM 신용카드',
    type: 'credit',
    issuer: 'iM뱅크',
    last4: '5219',
    linkedAccountId: 'acc001',
    source: 'own',
  },
]

// ──────────────────────────────────────────────
// 날짜+시간 헬퍼
// d(offsetDays, hour, min) → { date, time }
// 기준: 오늘(실행 시점) 기준 offsetDays 전
// ──────────────────────────────────────────────
function d(offsetDays, hour = 9, min = 0) {
  const dt = new Date()
  dt.setDate(dt.getDate() - offsetDays)
  return {
    date: dt.toISOString().slice(0, 10),
    time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
  }
}

// ──────────────────────────────────────────────
// 은행 계좌 거래내역
// — 카드 개별 구매는 포함하지 않음
// — 급여·자동이체·송금·이자 등 계좌 직접 거래만 기록
// — 기준일: 2026-04-03 (금)
//   d(1) = 04-02 (목) 어제
//   d(7) = 03-27 (금) 지난 금요일
//   d(9) = 03-25 (수) 이번 달 급여일
//   d(37)= 02-25 (수) 지난 달 급여일
// ──────────────────────────────────────────────
export let transactions = [

  // ══════════════════════════════════════════
  // 주계좌(acc001) — 4월 초 (이번 주)
  // ══════════════════════════════════════════
  // 어제(d1=04-02) 이민지가 식비 정산 입금
  { id: 't001a', ...d(1,11,32), amount:  150000, category: '입금',    counterpart: '이민지',            counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  // 어제 체크카드 자동결제 출금
  { id: 't001b', ...d(1, 0, 5), amount:  -45000, category: '자동이체', counterpart: '쿠팡 로켓와우',     counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },

  // ══════════════════════════════════════════
  // 주계좌(acc001) — 3월
  // ══════════════════════════════════════════
  // 3월 25일 급여
  { id: 't001', ...d(9, 9,30), amount: 3000000, category: '급여',    counterpart: '(주)ABC테크',           counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  // 3월 27일 지난 금요일 - 박지수 더치페이 정산 입금
  { id: 't007y', ...d(7,16,45), amount:   60000, category: '입금',   counterpart: '박지수',               counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  // 3월 27일 이정훈 저녁 식비 정산 입금
  { id: 't007z', ...d(7,17,10), amount:   35000, category: '입금',   counterpart: '이정훈',               counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  // 3월 25일 자동이체
  { id: 't002', ...d(9, 0,10), amount:  -300000, category: '자동이체', counterpart: 'iM 정기적금',          counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't003', ...d(9, 0,20), amount:  -485000, category: '카드대금', counterpart: 'iM 체크카드 결제 합계', counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  // 3월 22일 아파트 관리비
  { id: 't005', ...d(12, 6,0), amount:  -320000, category: '자동이체', counterpart: '아파트 관리비',         counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  // 3월 24일 헬스장
  { id: 't006', ...d(10, 6,5), amount:   -80000, category: '자동이체', counterpart: '파워짐 강남점',         counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  // 3월 20일 전기요금
  { id: 't007', ...d(14, 6,1), amount:   -52400, category: '자동이체', counterpart: '한국전력 전기요금',     counterpartBank: '한국전력',   accountId: 'acc001', source: 'account' },
  // 3월 19일 도시가스
  { id: 't008', ...d(15, 6,2), amount:   -18700, category: '자동이체', counterpart: '서울도시가스',          counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  // 3월 15일 통신·보험·학원·건보
  { id: 't009', ...d(19, 6,3), amount:   -19800, category: '자동이체', counterpart: 'SKT 통신요금',          counterpartBank: 'SK텔레콤',   accountId: 'acc001', source: 'account' },
  { id: 't010', ...d(19, 6,5), amount:   -25000, category: '자동이체', counterpart: '삼성생명 보험료',       counterpartBank: '삼성생명',   accountId: 'acc001', source: 'account' },
  { id: 't011', ...d(19, 6,7), amount:   -65000, category: '자동이체', counterpart: '강남영어학원',          counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't012', ...d(19, 6,9), amount:  -139230, category: '자동이체', counterpart: '국민건강보험공단',      counterpartBank: '국민건강보험공단', accountId: 'acc001', source: 'account' },
  // 3월 25일 → 3월 26일 김영희 송금
  { id: 't013', ...d(8,14,22), amount:  -100000, category: '송금',    counterpart: '김영희',               counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  // 3월 23일 박지수 송금
  { id: 't014', ...d(11,18,5), amount:   -50000, category: '송금',    counterpart: '박지수',               counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  // 3월 18일 김민준 송금
  { id: 't015', ...d(16,12,0), amount:   -30000, category: '송금',    counterpart: '김민준',               counterpartBank: '토스뱅크',   accountId: 'acc001', source: 'account' },
  // 3월 26일 ATM
  { id: 't016', ...d(8,15,30), amount:  -200000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  // 3월 20일 ATM
  { id: 't017', ...d(14,11,0), amount:  -200000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  // 4월 1일 이자
  { id: 't018', ...d(2, 0,30), amount:     9200, category: '이자',    counterpart: 'iM뱅크 이자',          counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  // 3월 28일 수도요금
  { id: 't019', ...d(6, 6,4), amount:    -8900, category: '자동이체', counterpart: '수도요금 (상수도)',     counterpartBank: '서울시',     accountId: 'acc001', source: 'account' },
  // 3월 30일 이민지 입금
  { id: 't020', ...d(4,13,45), amount:   150000, category: '입금',    counterpart: '이민지 (식비 정산)',   counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  // 3월 2일 LG유플러스
  { id: 't021', ...d(32, 6,6), amount:   -55000, category: '자동이체', counterpart: 'LG유플러스 (홈인터넷)', counterpartBank: 'LG유플러스', accountId: 'acc001', source: 'account' },
  // 3월 29일 최동욱 정산 입금
  { id: 't022x', ...d(5,19,30), amount:   80000, category: '입금',    counterpart: '최동욱',               counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  // 3월 29일 박민서 정산 입금
  { id: 't022y', ...d(5,20,10), amount:   45000, category: '입금',    counterpart: '박민서',               counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  // 3월 25일 엄마(김순자) 생활비 송금
  { id: 't170m', ...d(9,10,30), amount: -300000, category: '송금',    counterpart: '김순자',               counterpartBank: '농협은행',   accountId: 'acc001', source: 'account' },

  // ══════════════════════════════════════════
  // 주계좌(acc001) — 2월
  // ══════════════════════════════════════════
  { id: 't030', ...d(37, 9,30), amount: 3000000, category: '급여',    counterpart: '(주)ABC테크',           counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't031', ...d(37, 0,10), amount: -300000, category: '자동이체', counterpart: 'iM 정기적금',           counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't032', ...d(37, 0,20), amount: -462000, category: '카드대금', counterpart: 'iM 체크카드 결제 합계', counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't034', ...d(39, 6, 0), amount: -320000, category: '자동이체', counterpart: '아파트 관리비',         counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't035', ...d(42, 6, 5), amount:  -80000, category: '자동이체', counterpart: '파워짐 강남점',         counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't036', ...d(44, 6, 1), amount:  -48600, category: '자동이체', counterpart: '한국전력 전기요금',     counterpartBank: '한국전력',   accountId: 'acc001', source: 'account' },
  { id: 't037', ...d(45, 6, 2), amount:  -22400, category: '자동이체', counterpart: '서울도시가스',          counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't038', ...d(47, 6, 3), amount:  -19800, category: '자동이체', counterpart: 'SKT 통신요금',          counterpartBank: 'SK텔레콤',   accountId: 'acc001', source: 'account' },
  { id: 't039', ...d(47, 6, 5), amount:  -25000, category: '자동이체', counterpart: '삼성생명 보험료',       counterpartBank: '삼성생명',   accountId: 'acc001', source: 'account' },
  { id: 't040', ...d(47, 6, 7), amount:  -65000, category: '자동이체', counterpart: '강남영어학원',          counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't041', ...d(47, 6, 9), amount: -139230, category: '자동이체', counterpart: '국민건강보험공단',      counterpartBank: '국민건강보험공단', accountId: 'acc001', source: 'account' },
  { id: 't042', ...d(41,14,10), amount:  -50000, category: '송금',    counterpart: '김영희',               counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't043', ...d(43,16,30), amount:  -80000, category: '송금',    counterpart: '최현우',               counterpartBank: '우리은행',   accountId: 'acc001', source: 'account' },
  { id: 't044', ...d(48,11,15), amount:  -50000, category: '송금',    counterpart: '김철수',               counterpartBank: '하나은행',   accountId: 'acc001', source: 'account' },
  { id: 't045', ...d(40,10, 0), amount: -300000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't046', ...d(50,14, 0), amount: -200000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't047', ...d(35, 0,30), amount:    8900, category: '이자',    counterpart: 'iM뱅크 이자',          counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't048', ...d(38, 6, 4), amount:   -8900, category: '자동이체', counterpart: '수도요금 (상수도)',     counterpartBank: '서울시',     accountId: 'acc001', source: 'account' },
  { id: 't049', ...d(61, 6, 6), amount:  -55000, category: '자동이체', counterpart: 'LG유플러스 (홈인터넷)', counterpartBank: 'LG유플러스', accountId: 'acc001', source: 'account' },
  { id: 't050', ...d(46, 6, 8), amount:  -45000, category: '자동이체', counterpart: '쿠팡 로켓와우',        counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't051', ...d(51, 6,10), amount: -120000, category: '자동이체', counterpart: '현대캐피탈 스마트폰 할부', counterpartBank: '현대캐피탈', accountId: 'acc001', source: 'account' },
  { id: 't052', ...d(36,19,20), amount:  200000, category: '입금',    counterpart: '정세영 (더치페이)',     counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  { id: 't052b',...d(38,15,40), amount:  120000, category: '입금',    counterpart: '오승훈 (식비 정산)',    counterpartBank: '토스뱅크',   accountId: 'acc001', source: 'account' },
  { id: 't052c',...d(42,20, 5), amount:   50000, category: '입금',    counterpart: '이정훈 (더치페이)',     counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  // 2월 엄마 생활비
  { id: 't171', ...d(37,10,30), amount: -300000, category: '송금',    counterpart: '김순자',               counterpartBank: '농협은행',   accountId: 'acc001', source: 'account' },

  // ══════════════════════════════════════════
  // 주계좌(acc001) — 1월
  // ══════════════════════════════════════════
  { id: 't060', ...d(68, 9,30), amount: 3000000, category: '급여',    counterpart: '(주)ABC테크',           counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't061', ...d(68, 0,10), amount: -300000, category: '자동이체', counterpart: 'iM 정기적금',           counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't062', ...d(68, 0,20), amount: -511000, category: '카드대금', counterpart: 'iM 체크카드 결제 합계', counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't064', ...d(68, 9,45), amount:  500000, category: '입금',    counterpart: '(주)ABC테크 성과급',    counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't065', ...d(70, 6, 0), amount: -320000, category: '자동이체', counterpart: '아파트 관리비',         counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't066', ...d(73, 6, 5), amount:  -80000, category: '자동이체', counterpart: '파워짐 강남점',         counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't067', ...d(75, 6, 1), amount:  -61200, category: '자동이체', counterpart: '한국전력 전기요금',     counterpartBank: '한국전력',   accountId: 'acc001', source: 'account' },
  { id: 't068', ...d(76, 6, 2), amount:  -24500, category: '자동이체', counterpart: '서울도시가스',          counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't069', ...d(78, 6, 3), amount:  -19800, category: '자동이체', counterpart: 'SKT 통신요금',          counterpartBank: 'SK텔레콤',   accountId: 'acc001', source: 'account' },
  { id: 't070', ...d(78, 6, 5), amount:  -25000, category: '자동이체', counterpart: '삼성생명 보험료',       counterpartBank: '삼성생명',   accountId: 'acc001', source: 'account' },
  { id: 't071', ...d(78, 6, 7), amount:  -65000, category: '자동이체', counterpart: '강남영어학원',          counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't072', ...d(78, 6, 9), amount: -139230, category: '자동이체', counterpart: '국민건강보험공단',      counterpartBank: '국민건강보험공단', accountId: 'acc001', source: 'account' },
  { id: 't073', ...d(72,13,30), amount: -100000, category: '송금',    counterpart: '김영희',               counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't074', ...d(74,17, 0), amount:  -70000, category: '송금',    counterpart: '이민지',               counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  { id: 't075', ...d(79,12,10), amount:  -30000, category: '송금',    counterpart: '김민준',               counterpartBank: '토스뱅크',   accountId: 'acc001', source: 'account' },
  { id: 't076', ...d(71,10, 0), amount: -200000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't077', ...d(82,15, 0), amount: -300000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't078', ...d(66, 0,30), amount:    8600, category: '이자',    counterpart: 'iM뱅크 이자',          counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't079', ...d(69, 6, 4), amount:   -8900, category: '자동이체', counterpart: '수도요금 (상수도)',     counterpartBank: '서울시',     accountId: 'acc001', source: 'account' },
  { id: 't080', ...d(80, 6, 6), amount:  -55000, category: '자동이체', counterpart: 'LG유플러스 (홈인터넷)', counterpartBank: 'LG유플러스', accountId: 'acc001', source: 'account' },
  { id: 't081', ...d(77, 6,10), amount: -120000, category: '자동이체', counterpart: '현대캐피탈 스마트폰 할부', counterpartBank: '현대캐피탈', accountId: 'acc001', source: 'account' },
  { id: 't082', ...d(67, 6, 8), amount:  -45000, category: '자동이체', counterpart: '쿠팡 로켓와우',        counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't082b',...d(70,18,20), amount:   80000, category: '입금',    counterpart: '박민서 (영화티켓 정산)',counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  { id: 't082c',...d(75,21,30), amount:   30000, category: '입금',    counterpart: '최동욱 (택시비 정산)', counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  // 1월 엄마 생활비
  { id: 't172', ...d(68,10,30), amount: -300000, category: '송금',    counterpart: '김순자',               counterpartBank: '농협은행',   accountId: 'acc001', source: 'account' },

  // ══════════════════════════════════════════
  // 주계좌(acc001) — 12월
  // ══════════════════════════════════════════
  { id: 't090', ...d(99, 9,30), amount: 3200000, category: '급여',    counterpart: '(주)ABC테크',           counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't091', ...d(99, 0,10), amount: -300000, category: '자동이체', counterpart: 'iM 정기적금',           counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't092', ...d(99, 0,20), amount: -538000, category: '카드대금', counterpart: 'iM 체크카드 결제 합계', counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't094', ...d(101, 6, 0), amount: -320000, category: '자동이체', counterpart: '아파트 관리비',         counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't095', ...d(103, 6, 5), amount:  -80000, category: '자동이체', counterpart: '파워짐 강남점',         counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't096', ...d(105, 6, 1), amount:  -68500, category: '자동이체', counterpart: '한국전력 전기요금',     counterpartBank: '한국전력',   accountId: 'acc001', source: 'account' },
  { id: 't097', ...d(106, 6, 2), amount:  -28000, category: '자동이체', counterpart: '서울도시가스',          counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't098', ...d(108, 6, 3), amount:  -19800, category: '자동이체', counterpart: 'SKT 통신요금',          counterpartBank: 'SK텔레콤',   accountId: 'acc001', source: 'account' },
  { id: 't099', ...d(108, 6, 5), amount:  -25000, category: '자동이체', counterpart: '삼성생명 보험료',       counterpartBank: '삼성생명',   accountId: 'acc001', source: 'account' },
  { id: 't100', ...d(108, 6, 7), amount:  -65000, category: '자동이체', counterpart: '강남영어학원',          counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't101', ...d(108, 6, 9), amount: -139230, category: '자동이체', counterpart: '국민건강보험공단',      counterpartBank: '국민건강보험공단', accountId: 'acc001', source: 'account' },
  { id: 't102', ...d(102,14, 0), amount: -100000, category: '송금',    counterpart: '김영희',               counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't103', ...d(102,15,20), amount:  -50000, category: '송금',    counterpart: '김철호',               counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't104', ...d(110,11, 0), amount:  -30000, category: '송금',    counterpart: '박지수',               counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't105', ...d(101,10, 0), amount: -300000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't106', ...d(96, 0,30), amount:    8300,  category: '이자',    counterpart: 'iM뱅크 이자',          counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't107', ...d(99, 6, 4), amount:   -8900,  category: '자동이체', counterpart: '수도요금 (상수도)',     counterpartBank: '서울시',     accountId: 'acc001', source: 'account' },
  { id: 't108', ...d(109, 6, 6), amount:  -55000, category: '자동이체', counterpart: 'LG유플러스 (홈인터넷)', counterpartBank: 'LG유플러스', accountId: 'acc001', source: 'account' },
  { id: 't109', ...d(107, 6,10), amount: -120000, category: '자동이체', counterpart: '현대캐피탈 스마트폰 할부', counterpartBank: '현대캐피탈', accountId: 'acc001', source: 'account' },
  { id: 't110', ...d(97, 6, 8), amount:   -45000, category: '자동이체', counterpart: '쿠팡 로켓와우',        counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't111', ...d(111,20, 0), amount:  500000, category: '입금',    counterpart: '오승훈 (연말 정산 공동 환급)', counterpartBank: '토스뱅크', accountId: 'acc001', source: 'account' },
  // 12월 엄마 생활비
  { id: 't173', ...d(99,10,30), amount: -300000, category: '송금',    counterpart: '김순자',               counterpartBank: '농협은행',   accountId: 'acc001', source: 'account' },

  // ══════════════════════════════════════════
  // 주계좌(acc001) — 11월
  // ══════════════════════════════════════════
  { id: 't120', ...d(129, 9,30), amount: 3000000, category: '급여',    counterpart: '(주)ABC테크',           counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't121', ...d(129, 0,10), amount: -300000, category: '자동이체', counterpart: 'iM 정기적금',           counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't122', ...d(129, 0,20), amount: -492000, category: '카드대금', counterpart: 'iM 체크카드 결제 합계', counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't123', ...d(131, 6, 0), amount: -320000, category: '자동이체', counterpart: '아파트 관리비',         counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't124', ...d(133, 6, 5), amount:  -80000, category: '자동이체', counterpart: '파워짐 강남점',         counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't125', ...d(135, 6, 1), amount:  -51200, category: '자동이체', counterpart: '한국전력 전기요금',     counterpartBank: '한국전력',   accountId: 'acc001', source: 'account' },
  { id: 't126', ...d(136, 6, 2), amount:  -21000, category: '자동이체', counterpart: '서울도시가스',          counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't127', ...d(138, 6, 3), amount:  -19800, category: '자동이체', counterpart: 'SKT 통신요금',          counterpartBank: 'SK텔레콤',   accountId: 'acc001', source: 'account' },
  { id: 't128', ...d(138, 6, 5), amount:  -25000, category: '자동이체', counterpart: '삼성생명 보험료',       counterpartBank: '삼성생명',   accountId: 'acc001', source: 'account' },
  { id: 't129', ...d(138, 6, 7), amount:  -65000, category: '자동이체', counterpart: '강남영어학원',          counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't130', ...d(138, 6, 9), amount: -139230, category: '자동이체', counterpart: '국민건강보험공단',      counterpartBank: '국민건강보험공단', accountId: 'acc001', source: 'account' },
  { id: 't131', ...d(132,15,10), amount:  -50000, category: '송금',    counterpart: '김영희',               counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't132', ...d(134,18,30), amount: -100000, category: '송금',    counterpart: '이순자',               counterpartBank: '농협은행',   accountId: 'acc001', source: 'account' },
  { id: 't133', ...d(131,10, 0), amount: -200000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't134', ...d(126, 0,30), amount:    8000, category: '이자',    counterpart: 'iM뱅크 이자',          counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't135', ...d(129, 6, 4), amount:   -8900, category: '자동이체', counterpart: '수도요금 (상수도)',     counterpartBank: '서울시',     accountId: 'acc001', source: 'account' },
  { id: 't136', ...d(139, 6, 6), amount:  -55000, category: '자동이체', counterpart: 'LG유플러스 (홈인터넷)', counterpartBank: 'LG유플러스', accountId: 'acc001', source: 'account' },
  { id: 't137', ...d(137, 6,10), amount: -120000, category: '자동이체', counterpart: '현대캐피탈 스마트폰 할부', counterpartBank: '현대캐피탈', accountId: 'acc001', source: 'account' },
  { id: 't138', ...d(127, 6, 8), amount:  -45000, category: '자동이체', counterpart: '쿠팡 로켓와우',        counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },

  // ══════════════════════════════════════════
  // 주계좌(acc001) — 10월
  // ══════════════════════════════════════════
  { id: 't150', ...d(160, 9,30), amount: 3000000, category: '급여',    counterpart: '(주)ABC테크',           counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't151', ...d(160, 0,10), amount: -300000, category: '자동이체', counterpart: 'iM 정기적금',           counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't152', ...d(160, 0,20), amount: -445000, category: '카드대금', counterpart: 'iM 체크카드 결제 합계', counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't153', ...d(162, 6, 0), amount: -320000, category: '자동이체', counterpart: '아파트 관리비',         counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't154', ...d(164, 6, 5), amount:  -80000, category: '자동이체', counterpart: '파워짐 강남점',         counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't155', ...d(166, 6, 1), amount:  -44800, category: '자동이체', counterpart: '한국전력 전기요금',     counterpartBank: '한국전력',   accountId: 'acc001', source: 'account' },
  { id: 't156', ...d(167, 6, 2), amount:  -15200, category: '자동이체', counterpart: '서울도시가스',          counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't157', ...d(169, 6, 3), amount:  -19800, category: '자동이체', counterpart: 'SKT 통신요금',          counterpartBank: 'SK텔레콤',   accountId: 'acc001', source: 'account' },
  { id: 't158', ...d(169, 6, 5), amount:  -25000, category: '자동이체', counterpart: '삼성생명 보험료',       counterpartBank: '삼성생명',   accountId: 'acc001', source: 'account' },
  { id: 't159', ...d(169, 6, 7), amount:  -65000, category: '자동이체', counterpart: '강남영어학원',          counterpartBank: '기업은행',   accountId: 'acc001', source: 'account' },
  { id: 't160', ...d(169, 6, 9), amount: -139230, category: '자동이체', counterpart: '국민건강보험공단',      counterpartBank: '국민건강보험공단', accountId: 'acc001', source: 'account' },
  { id: 't161', ...d(163,14, 0), amount: -100000, category: '송금',    counterpart: '김영희',               counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },
  { id: 't162', ...d(165,17,30), amount:  -30000, category: '송금',    counterpart: '김민준',               counterpartBank: '토스뱅크',   accountId: 'acc001', source: 'account' },
  { id: 't163', ...d(170,12, 0), amount:  -50000, category: '송금',    counterpart: '박상철',               counterpartBank: '신한은행',   accountId: 'acc001', source: 'account' },
  { id: 't164', ...d(162,11, 0), amount: -200000, category: '이체',    counterpart: 'ATM 출금',             counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't165', ...d(157, 0,30), amount:    7800, category: '이자',    counterpart: 'iM뱅크 이자',          counterpartBank: 'iM뱅크',     accountId: 'acc001', source: 'account' },
  { id: 't166', ...d(160, 6, 4), amount:   -8900, category: '자동이체', counterpart: '수도요금 (상수도)',     counterpartBank: '서울시',     accountId: 'acc001', source: 'account' },
  { id: 't167', ...d(170, 6, 6), amount:  -55000, category: '자동이체', counterpart: 'LG유플러스 (홈인터넷)', counterpartBank: 'LG유플러스', accountId: 'acc001', source: 'account' },
  { id: 't168', ...d(168, 6,10), amount: -120000, category: '자동이체', counterpart: '현대캐피탈 스마트폰 할부', counterpartBank: '현대캐피탈', accountId: 'acc001', source: 'account' },
  { id: 't169', ...d(158, 6, 8), amount:  -45000, category: '자동이체', counterpart: '쿠팡 로켓와우',        counterpartBank: '국민은행',   accountId: 'acc001', source: 'account' },

  // ══════════════════════════════════════════
  // 급여계좌(acc008) — 4월
  // ══════════════════════════════════════════
  // 어제(d1=04-02) 급여 입금 — "어제 나한테 입금한 사람" 데모 쿼리 대응
  { id: 'ts001', ...d(1, 9, 5), amount:  4200000, category: '급여',    counterpart: '(주)미래솔루션',        counterpartBank: '우리은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts002', ...d(1, 9,30), amount: -2500000, category: '이체',    counterpart: '주계좌',               counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },

  // ══════════════════════════════════════════
  // 급여계좌(acc008) — 3월
  // ══════════════════════════════════════════
  { id: 'ts003', ...d(3, 6, 5), amount: -1200000, category: '자동이체', counterpart: '전세보증금 대출 이자', counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts004', ...d(5, 6, 3), amount:  -350000, category: '자동이체', counterpart: 'KB국민 신용카드 결제', counterpartBank: 'KB국민은행', accountId: 'acc008', source: 'account' },
  { id: 'ts005', ...d(6, 6, 7), amount:  -300000, category: '자동이체', counterpart: 'iM 정기적금',          counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts006', ...d(8, 6, 2), amount:   -65000, category: '자동이체', counterpart: 'SK텔레콤',             counterpartBank: 'SK텔레콤',   accountId: 'acc008', source: 'account' },
  { id: 'ts007', ...d(9, 6, 4), amount:  -148900, category: '자동이체', counterpart: '국민건강보험',         counterpartBank: '국민건강보험공단', accountId: 'acc008', source: 'account' },
  { id: 'ts008', ...d(11, 6, 6), amount:  -45000, category: '자동이체', counterpart: '삼성생명 실손보험',    counterpartBank: '삼성생명',   accountId: 'acc008', source: 'account' },
  { id: 'ts009', ...d(13, 6, 8), amount: -180000, category: '자동이체', counterpart: '아파트 관리비',        counterpartBank: '신한은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts00a', ...d(15,19,30), amount: -300000, category: '송금',    counterpart: '김순자',               counterpartBank: '농협은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts00b', ...d(17,12,10), amount:  -50000, category: '송금',    counterpart: '이민지',               counterpartBank: '카카오뱅크', accountId: 'acc008', source: 'account' },
  { id: 'ts00c', ...d(20,18, 0), amount:  -50000, category: '송금',    counterpart: '박지수',               counterpartBank: '신한은행',   accountId: 'acc008', source: 'account' },

  // ══════════════════════════════════════════
  // 급여계좌(acc008) — 2월
  // ══════════════════════════════════════════
  { id: 'ts010', ...d(37, 9, 5), amount:  4200000, category: '급여',    counterpart: '(주)미래솔루션',        counterpartBank: '우리은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts011', ...d(37, 9,30), amount: -2500000, category: '이체',    counterpart: '주계좌',               counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts012', ...d(39, 6, 5), amount: -1200000, category: '자동이체', counterpart: '전세보증금 대출 이자', counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts013', ...d(41, 6, 3), amount:  -328000, category: '자동이체', counterpart: 'KB국민 신용카드 결제', counterpartBank: 'KB국민은행', accountId: 'acc008', source: 'account' },
  { id: 'ts015', ...d(42, 6, 7), amount:  -300000, category: '자동이체', counterpart: 'iM 정기적금',          counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts016', ...d(44, 6, 2), amount:   -65000, category: '자동이체', counterpart: 'SK텔레콤',             counterpartBank: 'SK텔레콤',   accountId: 'acc008', source: 'account' },
  { id: 'ts017', ...d(45, 6, 4), amount:  -148900, category: '자동이체', counterpart: '국민건강보험',         counterpartBank: '국민건강보험공단', accountId: 'acc008', source: 'account' },
  { id: 'ts018', ...d(47, 6, 6), amount:   -45000, category: '자동이체', counterpart: '삼성생명 실손보험',    counterpartBank: '삼성생명',   accountId: 'acc008', source: 'account' },
  { id: 'ts019', ...d(49, 6, 8), amount:  -180000, category: '자동이체', counterpart: '아파트 관리비',        counterpartBank: '신한은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts01a', ...d(51,19,30), amount:  -300000, category: '송금',    counterpart: '김순자',               counterpartBank: '농협은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts01b', ...d(52,13, 0), amount:   -20000, category: '송금',    counterpart: '정세영',               counterpartBank: '카카오뱅크', accountId: 'acc008', source: 'account' },
  { id: 'ts01c', ...d(53,15,40), amount:    50000, category: '입금',    counterpart: '오승훈',               counterpartBank: '토스뱅크',   accountId: 'acc008', source: 'account' },

  // ══════════════════════════════════════════
  // 급여계좌(acc008) — 1월
  // ══════════════════════════════════════════
  { id: 'ts020', ...d(68, 9, 5), amount:  4200000, category: '급여',    counterpart: '(주)미래솔루션',        counterpartBank: '우리은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts021', ...d(68, 9,30), amount: -2500000, category: '이체',    counterpart: '주계좌',               counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts024', ...d(68, 9,45), amount:   500000, category: '입금',    counterpart: '(주)미래솔루션 성과급', counterpartBank: '우리은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts022', ...d(70, 6, 5), amount: -1200000, category: '자동이체', counterpart: '전세보증금 대출 이자', counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts023', ...d(72, 6, 3), amount:  -412000, category: '자동이체', counterpart: 'KB국민 신용카드 결제', counterpartBank: 'KB국민은행', accountId: 'acc008', source: 'account' },
  { id: 'ts025', ...d(73, 6, 7), amount:  -300000, category: '자동이체', counterpart: 'iM 정기적금',          counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts026', ...d(75, 6, 2), amount:   -65000, category: '자동이체', counterpart: 'SK텔레콤',             counterpartBank: 'SK텔레콤',   accountId: 'acc008', source: 'account' },
  { id: 'ts027', ...d(76, 6, 4), amount:  -148900, category: '자동이체', counterpart: '국민건강보험',         counterpartBank: '국민건강보험공단', accountId: 'acc008', source: 'account' },
  { id: 'ts028', ...d(78, 6, 6), amount:   -45000, category: '자동이체', counterpart: '삼성생명 실손보험',    counterpartBank: '삼성생명',   accountId: 'acc008', source: 'account' },
  { id: 'ts029', ...d(80, 6, 8), amount:  -180000, category: '자동이체', counterpart: '아파트 관리비',        counterpartBank: '신한은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts02a', ...d(82,19,30), amount:  -300000, category: '송금',    counterpart: '김순자',               counterpartBank: '농협은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts02b', ...d(85,14, 0), amount:  -100000, category: '송금',    counterpart: '김기준',               counterpartBank: '하나은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts02c', ...d(87,17,30), amount:   -50000, category: '송금',    counterpart: '이민지',               counterpartBank: '카카오뱅크', accountId: 'acc008', source: 'account' },

  // ══════════════════════════════════════════
  // 급여계좌(acc008) — 12월
  // ══════════════════════════════════════════
  { id: 'ts030', ...d(99, 9, 5), amount:  4200000, category: '급여',    counterpart: '(주)미래솔루션',        counterpartBank: '우리은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts031', ...d(99, 9,30), amount: -2500000, category: '이체',    counterpart: '주계좌',               counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts032', ...d(101, 6, 5), amount: -1200000, category: '자동이체', counterpart: '전세보증금 대출 이자', counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts033', ...d(103, 6, 3), amount:  -380000, category: '자동이체', counterpart: 'KB국민 신용카드 결제', counterpartBank: 'KB국민은행', accountId: 'acc008', source: 'account' },
  { id: 'ts034', ...d(104, 6, 7), amount:  -300000, category: '자동이체', counterpart: 'iM 정기적금',          counterpartBank: 'iM뱅크',     accountId: 'acc008', source: 'account' },
  { id: 'ts035', ...d(106, 6, 2), amount:   -65000, category: '자동이체', counterpart: 'SK텔레콤',             counterpartBank: 'SK텔레콤',   accountId: 'acc008', source: 'account' },
  { id: 'ts036', ...d(107, 6, 4), amount:  -148900, category: '자동이체', counterpart: '국민건강보험',         counterpartBank: '국민건강보험공단', accountId: 'acc008', source: 'account' },
  { id: 'ts037', ...d(109, 6, 6), amount:   -45000, category: '자동이체', counterpart: '삼성생명 실손보험',    counterpartBank: '삼성생명',   accountId: 'acc008', source: 'account' },
  { id: 'ts038', ...d(111, 6, 8), amount:  -180000, category: '자동이체', counterpart: '아파트 관리비',        counterpartBank: '신한은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts039', ...d(113,19,30), amount:  -300000, category: '송금',    counterpart: '김순자',               counterpartBank: '농협은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts03a', ...d(117,14, 0), amount:  -100000, category: '송금',    counterpart: '김기준',               counterpartBank: '하나은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts03b', ...d(119,16,20), amount:   200000, category: '입금',    counterpart: '박지수 (경조사비)',    counterpartBank: '신한은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts03c', ...d(121,11, 0), amount:   -50000, category: '송금',    counterpart: '박지수',               counterpartBank: '신한은행',   accountId: 'acc008', source: 'account' },
  { id: 'ts03d', ...d(123,20,30), amount:   -50000, category: '송금',    counterpart: '오승훈',               counterpartBank: '토스뱅크',   accountId: 'acc008', source: 'account' },

  // ══════════════════════════════════════════
  // 추가 송금 이력 (빠른 송금 패널 데모용)
  // ══════════════════════════════════════════
  // 아빠(김기준)
  { id: 't174', ...d(49,11,30), amount: -100000, category: '송금', counterpart: '김기준', counterpartBank: '하나은행',  accountId: 'acc001', source: 'account' },
  { id: 't175', ...d(116,11,0), amount: -100000, category: '송금', counterpart: '김기준', counterpartBank: '하나은행',  accountId: 'acc001', source: 'account' },
  // 박지수
  { id: 't176', ...d(54,18,30), amount:  -50000, category: '송금', counterpart: '박지수', counterpartBank: '신한은행',  accountId: 'acc001', source: 'account' },
  { id: 't177', ...d(85,12,10), amount:  -50000, category: '송금', counterpart: '박지수', counterpartBank: '신한은행',  accountId: 'acc001', source: 'account' },
  // 이민지
  { id: 't178', ...d(46,21, 0), amount:  -50000, category: '송금', counterpart: '이민지', counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  { id: 't179', ...d(104,17,20), amount: -50000, category: '송금', counterpart: '이민지', counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  { id: 't180', ...d(144,13,10), amount: -50000, category: '송금', counterpart: '이민지', counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  // 정세영
  { id: 't181', ...d(24,22,10), amount:  -20000, category: '송금', counterpart: '정세영', counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  { id: 't182', ...d(59,20,30), amount:  -20000, category: '송금', counterpart: '정세영', counterpartBank: '카카오뱅크', accountId: 'acc001', source: 'account' },
  // 오승훈
  { id: 't183', ...d(92,19, 0), amount:  -50000, category: '송금', counterpart: '오승훈', counterpartBank: '토스뱅크',  accountId: 'acc001', source: 'account' },
  // 김수진
  { id: 't184', ...d(64,14,30), amount:  -30000, category: '송금', counterpart: '김수진', counterpartBank: '하나은행',  accountId: 'acc001', source: 'account' },

  // ══════════════════════════════════════════
  // 정기적금 납입·이자 (acc002)
  // ══════════════════════════════════════════
  { id: 't200', ...d(3,  1, 0), amount:    1050, category: '이자',    counterpart: 'iM 정기적금 이자',   counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't201', ...d(33, 1, 0), amount:    1050, category: '이자',    counterpart: 'iM 정기적금 이자',   counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't202', ...d(64, 1, 0), amount:    1050, category: '이자',    counterpart: 'iM 정기적금 이자',   counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't203', ...d(9,  0,10), amount:  300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't204', ...d(37, 0,10), amount:  300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't205', ...d(68, 0,10), amount:  300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't206', ...d(99, 0,10), amount:  300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't207', ...d(129, 0,10), amount: 300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't208', ...d(160, 0,10), amount: 300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't209', ...d(189, 0,10), amount: 300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't215', ...d(220, 0,10), amount: 300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't216', ...d(251, 0,10), amount: 300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't217', ...d(281, 0,10), amount: 300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't218', ...d(312, 0,10), amount: 300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't219', ...d(342, 0,10), amount: 300000, category: '납입',    counterpart: '주계좌 자동이체',    counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },
  { id: 't230', ...d(342, 0, 5), amount: 300000, category: '개설입금', counterpart: '적금 개설 첫 납입', counterpartBank: 'iM뱅크', accountId: 'acc002', source: 'account' },

  // ── 정기예금 개설 (acc003) ──
  { id: 't240', ...d(196, 9, 0), amount: 10000000, category: '예금개설', counterpart: 'iM 정기예금 개설 입금', counterpartBank: 'iM뱅크', accountId: 'acc003', source: 'account' },

  // ── 비상금통장 이자 (acc004) ──
  { id: 't210', ...d(3,  1, 0), amount:  5000, category: '이자', counterpart: 'iM뱅크 이자', counterpartBank: 'iM뱅크', accountId: 'acc004', source: 'account' },
  { id: 't211', ...d(33, 1, 0), amount:  5000, category: '이자', counterpart: 'iM뱅크 이자', counterpartBank: 'iM뱅크', accountId: 'acc004', source: 'account' },
  { id: 't212', ...d(64, 1, 0), amount:  5000, category: '이자', counterpart: 'iM뱅크 이자', counterpartBank: 'iM뱅크', accountId: 'acc004', source: 'account' },
  { id: 't213', ...d(99, 1, 0), amount:  5000, category: '이자', counterpart: 'iM뱅크 이자', counterpartBank: 'iM뱅크', accountId: 'acc004', source: 'account' },
  { id: 't214', ...d(2, 10, 0), amount: -500000, category: '이체', counterpart: '주계좌 인출', counterpartBank: 'iM뱅크', accountId: 'acc004', source: 'account' },

  // ── CMA 입출 (acc005) ──
  { id: 't220', ...d(3,  1, 0), amount:  15100, category: '이자', counterpart: 'iM CMA 이자', counterpartBank: 'iM뱅크증권', accountId: 'acc005', source: 'account' },
  { id: 't221', ...d(33, 1, 0), amount:  14800, category: '이자', counterpart: 'iM CMA 이자', counterpartBank: 'iM뱅크증권', accountId: 'acc005', source: 'account' },
  { id: 't222', ...d(9, 10, 0), amount: 150000, category: '이체', counterpart: '주계좌 입금',  counterpartBank: 'iM뱅크',   accountId: 'acc005', source: 'account' },
  { id: 't223', ...d(37,10, 0), amount: 150000, category: '이체', counterpart: '주계좌 입금',  counterpartBank: 'iM뱅크',   accountId: 'acc005', source: 'account' },
  { id: 't224', ...d(68,10, 0), amount: 150000, category: '이체', counterpart: '주계좌 입금',  counterpartBank: 'iM뱅크',   accountId: 'acc005', source: 'account' },
]

// ──────────────────────────────────────────────
// 카드 거래내역 (마이데이터 포함)
// — merchant: 가맹점명만 (품목 상세 불명)
// — inferredCategory: 가맹점 기반 추정 (부정확 가능)
// — categoryNote: 분류 불확실 시 명시
// ──────────────────────────────────────────────
function cd(offsetDays, hour = 12, min = 0) {
  const dt = new Date()
  dt.setDate(dt.getDate() - offsetDays)
  return {
    date: dt.toISOString().slice(0, 10),
    time: `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
  }
}

export let cardTransactions = [

  // ════════════════════════════════════════════
  // 3월 — iM 체크카드 (card001)
  // ════════════════════════════════════════════
  { id: 'ct001', ...cd(0,8,32),   cardId: 'card001', merchant: '스타벅스 강남점',    inferredCategory: '카페',  categoryNote: null,                         amount: -8500  },
  { id: 'ct002', ...cd(0,12,15),  cardId: 'card001', merchant: '이마트24',            inferredCategory: '편의점', categoryNote: null,                        amount: -4200  },
  { id: 'ct003', ...cd(1,13,20),  cardId: 'card001', merchant: '김밥천국',            inferredCategory: '식비',  categoryNote: null,                         amount: -6000  },
  { id: 'ct004', ...cd(1,19,45),  cardId: 'card001', merchant: '카카오택시',          inferredCategory: '교통',  categoryNote: null,                         amount: -4800  },
  { id: 'ct005', ...cd(2,8,55),   cardId: 'card001', merchant: '이디야커피 역삼점',   inferredCategory: '카페',  categoryNote: null,                         amount: -4500  },
  { id: 'ct006', ...cd(2,20,10),  cardId: 'card001', merchant: '쿠팡',                inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 종합몰)',   amount: -45000 },
  { id: 'ct007', ...cd(3,7,30),   cardId: 'card001', merchant: '메가MGC커피',         inferredCategory: '카페',  categoryNote: null,                         amount: -2500  },
  { id: 'ct008', ...cd(3,12,40),  cardId: 'card001', merchant: '롯데리아',             inferredCategory: '식비',  categoryNote: null,                        amount: -9500  },
  { id: 'ct009', ...cd(4,8,20),   cardId: 'card001', merchant: '스타벅스 선릉점',     inferredCategory: '카페',  categoryNote: null,                         amount: -7000  },
  { id: 'ct010', ...cd(4,18,30),  cardId: 'card001', merchant: '올리브영 강남점',     inferredCategory: '쇼핑',  categoryNote: '화장품·생활용품 혼재',       amount: -38000 },
  { id: 'ct011', ...cd(5,12,0),   cardId: 'card001', merchant: '맥도날드 역삼점',     inferredCategory: '식비',  categoryNote: null,                         amount: -11500 },
  { id: 'ct012', ...cd(6,9,10),   cardId: 'card001', merchant: '투썸플레이스',        inferredCategory: '카페',  categoryNote: null,                         amount: -8500  },
  { id: 'ct013', ...cd(6,14,20),  cardId: 'card001', merchant: 'GS25 역삼점',         inferredCategory: '편의점', categoryNote: null,                        amount: -5600  },
  { id: 'ct014', ...cd(7,8,45),   cardId: 'card001', merchant: '할리스커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -5500  },
  { id: 'ct015', ...cd(7,19,0),   cardId: 'card001', merchant: 'CGV 강남',            inferredCategory: '문화',  categoryNote: null,                         amount: -15000 },
  { id: 'ct016', ...cd(8,12,30),  cardId: 'card001', merchant: '이자카야 료칸',       inferredCategory: '식비',  categoryNote: null,                         amount: -28000 },
  { id: 'ct017', ...cd(9,8,15),   cardId: 'card001', merchant: '스타벅스 강남점',     inferredCategory: '카페',  categoryNote: null,                         amount: -9000  },
  { id: 'ct018', ...cd(9,14,0),   cardId: 'card001', merchant: '쿠팡',                inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 종합몰)',   amount: -78000 },
  { id: 'ct019', ...cd(10,12,40), cardId: 'card001', merchant: '한식뷔페 대성',       inferredCategory: '식비',  categoryNote: null,                         amount: -14000 },
  { id: 'ct020', ...cd(11,8,20),  cardId: 'card001', merchant: 'T-money 충전',        inferredCategory: '교통',  categoryNote: null,                         amount: -20000 },
  { id: 'ct021', ...cd(12,9,0),   cardId: 'card001', merchant: '메가MGC커피',         inferredCategory: '카페',  categoryNote: null,                         amount: -2500  },
  { id: 'ct022', ...cd(12,20,30), cardId: 'card001', merchant: '배달의민족',          inferredCategory: '식비',  categoryNote: '음식 배달 (메뉴 불명)',       amount: -22000 },
  { id: 'ct023', ...cd(13,13,15), cardId: 'card001', merchant: '무신사',              inferredCategory: '쇼핑',  categoryNote: null,                         amount: -65000 },
  { id: 'ct024', ...cd(14,8,30),  cardId: 'card001', merchant: '이디야커피 강남점',   inferredCategory: '카페',  categoryNote: null,                         amount: -4500  },
  { id: 'ct025', ...cd(14,18,0),  cardId: 'card001', merchant: '서울내과의원',        inferredCategory: '의료',  categoryNote: null,                         amount: -15000 },
  { id: 'ct026', ...cd(15,12,20), cardId: 'card001', merchant: '고기집 삼겹살',       inferredCategory: '식비',  categoryNote: null,                         amount: -35000 },
  { id: 'ct027', ...cd(16,9,10),  cardId: 'card001', merchant: '스타벅스 삼성점',     inferredCategory: '카페',  categoryNote: null,                         amount: -7500  },
  { id: 'ct028', ...cd(17,14,30), cardId: 'card001', merchant: '네이버페이 온라인',   inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 결제)',     amount: -32000 },
  { id: 'ct029', ...cd(18,8,0),   cardId: 'card001', merchant: '할리스커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -5500  },
  { id: 'ct030', ...cd(19,12,45), cardId: 'card001', merchant: '중식당 신용루',       inferredCategory: '식비',  categoryNote: null,                         amount: -18000 },
  { id: 'ct031', ...cd(20,8,30),  cardId: 'card001', merchant: '메가MGC커피',         inferredCategory: '카페',  categoryNote: null,                         amount: -2500  },
  { id: 'ct032', ...cd(21,19,0),  cardId: 'card001', merchant: '다이소 강남점',       inferredCategory: '쇼핑',  categoryNote: null,                         amount: -12000 },
  { id: 'ct033', ...cd(22,12,30), cardId: 'card001', merchant: '피자헛',              inferredCategory: '식비',  categoryNote: null,                         amount: -28000 },

  // 3월 — 구독 (신한카드 마이데이터)
  { id: 'ct034', ...cd(1,10,30),  cardId: 'card001', merchant: '애플 앱스토어',       inferredCategory: '구독',  categoryNote: '앱·구독 혼재',               amount: -9900  },
  { id: 'ct035', ...cd(2,14,0),   cardId: 'card001', merchant: '넷플릭스',            inferredCategory: '구독',  categoryNote: null,                         amount: -13900 },
  { id: 'ct036', ...cd(5,10,0),   cardId: 'card001', merchant: '유튜브 프리미엄',     inferredCategory: '구독',  categoryNote: null,                         amount: -14900 },
  { id: 'ct037', ...cd(8,18,30),  cardId: 'card001', merchant: '쿠팡이츠',            inferredCategory: '식비',  categoryNote: '음식 배달 (메뉴 불명)',       amount: -19500 },
  { id: 'ct038', ...cd(11,20,0),  cardId: 'card001', merchant: '지그재그',            inferredCategory: '쇼핑',  categoryNote: null,                         amount: -85000 },
  { id: 'ct039', ...cd(14,12,0),  cardId: 'card001', merchant: '마켓컬리',            inferredCategory: '식비',  categoryNote: '식품·생활용품 혼재',         amount: -67000 },
  { id: 'ct040', ...cd(17,9,30),  cardId: 'card001', merchant: 'GS주유소',            inferredCategory: '교통',  categoryNote: null,                         amount: -60000 },
  { id: 'ct041', ...cd(19,14,0),  cardId: 'card001', merchant: '스포티파이',          inferredCategory: '구독',  categoryNote: null,                         amount: -10900 },
  { id: 'ct042', ...cd(22,11,0),  cardId: 'card001', merchant: '쿠팡',                inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 종합몰)',   amount: -125000},

  // ════════════════════════════════════════════
  // 2월 — iM 체크카드
  // ════════════════════════════════════════════
  { id: 'ct050', ...cd(24,8,30),  cardId: 'card001', merchant: '스타벅스 강남점',     inferredCategory: '카페',  categoryNote: null,                         amount: -8500  },
  { id: 'ct051', ...cd(24,13,0),  cardId: 'card001', merchant: '편의점CU',            inferredCategory: '편의점', categoryNote: null,                        amount: -3200  },
  { id: 'ct052', ...cd(25,12,20), cardId: 'card001', merchant: '서브웨이',            inferredCategory: '식비',  categoryNote: null,                         amount: -8500  },
  { id: 'ct053', ...cd(26,8,45),  cardId: 'card001', merchant: '이디야커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -4500  },
  { id: 'ct054', ...cd(27,14,30), cardId: 'card001', merchant: '쿠팡',                inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 종합몰)',   amount: -52000 },
  { id: 'ct055', ...cd(28,12,0),  cardId: 'card001', merchant: '맥도날드',            inferredCategory: '식비',  categoryNote: null,                         amount: -10500 },
  { id: 'ct056', ...cd(29,9,0),   cardId: 'card001', merchant: '할리스커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -5500  },
  { id: 'ct057', ...cd(30,18,30), cardId: 'card001', merchant: 'CGV 강남',            inferredCategory: '문화',  categoryNote: null,                         amount: -30000 },
  { id: 'ct058', ...cd(31,8,15),  cardId: 'card001', merchant: '스타벅스 역삼점',     inferredCategory: '카페',  categoryNote: null,                         amount: -7000  },
  { id: 'ct059', ...cd(32,12,0),  cardId: 'card001', merchant: '한식당 향',           inferredCategory: '식비',  categoryNote: null,                         amount: -22000 },
  { id: 'ct060', ...cd(33,8,30),  cardId: 'card001', merchant: '메가MGC커피',         inferredCategory: '카페',  categoryNote: null,                         amount: -2500  },
  { id: 'ct061', ...cd(34,11,0),  cardId: 'card001', merchant: '강남치과',            inferredCategory: '의료',  categoryNote: null,                         amount: -62000 },
  { id: 'ct062', ...cd(35,14,0),  cardId: 'card001', merchant: '유니클로 강남점',     inferredCategory: '쇼핑',  categoryNote: null,                         amount: -95000 },
  { id: 'ct063', ...cd(36,8,45),  cardId: 'card001', merchant: '투썸플레이스',        inferredCategory: '카페',  categoryNote: null,                         amount: -8500  },
  { id: 'ct064', ...cd(37,12,30), cardId: 'card001', merchant: '떡볶이집 두끼',       inferredCategory: '식비',  categoryNote: null,                         amount: -14000 },
  { id: 'ct065', ...cd(38,8,0),   cardId: 'card001', merchant: 'T-money 충전',        inferredCategory: '교통',  categoryNote: null,                         amount: -20000 },
  { id: 'ct066', ...cd(39,12,0),  cardId: 'card001', merchant: '배달의민족',          inferredCategory: '식비',  categoryNote: '음식 배달 (메뉴 불명)',       amount: -18500 },
  { id: 'ct067', ...cd(40,9,15),  cardId: 'card001', merchant: '스타벅스 삼성점',     inferredCategory: '카페',  categoryNote: null,                         amount: -9000  },
  { id: 'ct068', ...cd(41,20,0),  cardId: 'card001', merchant: '인터파크 공연티켓',   inferredCategory: '문화',  categoryNote: null,                         amount: -40000 },
  { id: 'ct069', ...cd(42,12,30), cardId: 'card001', merchant: '일식집 하마',         inferredCategory: '식비',  categoryNote: null,                         amount: -35000 },
  { id: 'ct070', ...cd(43,8,30),  cardId: 'card001', merchant: '이디야커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -4500  },
  { id: 'ct071', ...cd(44,14,0),  cardId: 'card001', merchant: 'H&M 명동점',          inferredCategory: '쇼핑',  categoryNote: null,                         amount: -68000 },
  { id: 'ct072', ...cd(45,19,0),  cardId: 'card001', merchant: '고기집 삼겹살',       inferredCategory: '식비',  categoryNote: null,                         amount: -42000 },
  { id: 'ct073', ...cd(46,8,0),   cardId: 'card001', merchant: '메가MGC커피',         inferredCategory: '카페',  categoryNote: null,                         amount: -2500  },

  // 2월 — 구독
  { id: 'ct080', ...cd(25,10,0),  cardId: 'card001', merchant: '넷플릭스',            inferredCategory: '구독',  categoryNote: null,                         amount: -13900 },
  { id: 'ct081', ...cd(26,10,0),  cardId: 'card001', merchant: '유튜브 프리미엄',     inferredCategory: '구독',  categoryNote: null,                         amount: -14900 },
  { id: 'ct082', ...cd(28,18,30), cardId: 'card001', merchant: '쿠팡이츠',            inferredCategory: '식비',  categoryNote: '음식 배달 (메뉴 불명)',       amount: -24000 },
  { id: 'ct083', ...cd(31,14,0),  cardId: 'card001', merchant: '마켓컬리',            inferredCategory: '식비',  categoryNote: '식품·생활용품 혼재',         amount: -55000 },
  { id: 'ct084', ...cd(34,9,30),  cardId: 'card001', merchant: 'GS주유소',            inferredCategory: '교통',  categoryNote: null,                         amount: -60000 },
  { id: 'ct085', ...cd(37,14,0),  cardId: 'card001', merchant: '아이허브',            inferredCategory: '쇼핑',  categoryNote: '건강식품·생활용품 혼재',     amount: -88000 },
  { id: 'ct086', ...cd(40,11,0),  cardId: 'card001', merchant: '스포티파이',          inferredCategory: '구독',  categoryNote: null,                         amount: -10900 },
  { id: 'ct087', ...cd(43,19,0),  cardId: 'card001', merchant: '쿠팡',                inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 종합몰)',   amount: -95000 },

  // ════════════════════════════════════════════
  // 1월 — iM 체크카드
  // ════════════════════════════════════════════
  { id: 'ct090', ...cd(52,8,30),  cardId: 'card001', merchant: '스타벅스 강남점',     inferredCategory: '카페',  categoryNote: null,                         amount: -8500  },
  { id: 'ct091', ...cd(53,12,0),  cardId: 'card001', merchant: '치킨집 교촌',         inferredCategory: '식비',  categoryNote: null,                         amount: -21000 },
  { id: 'ct092', ...cd(54,8,45),  cardId: 'card001', merchant: '이디야커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -4500  },
  { id: 'ct093', ...cd(55,14,0),  cardId: 'card001', merchant: '지그재그',            inferredCategory: '쇼핑',  categoryNote: null,                         amount: -75000 },
  { id: 'ct094', ...cd(56,12,30), cardId: 'card001', merchant: '김밥천국',            inferredCategory: '식비',  categoryNote: null,                         amount: -6000  },
  { id: 'ct095', ...cd(57,9,0),   cardId: 'card001', merchant: '할리스커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -5500  },
  { id: 'ct096', ...cd(58,20,0),  cardId: 'card001', merchant: 'CGV 강남',            inferredCategory: '문화',  categoryNote: null,                         amount: -15000 },
  { id: 'ct097', ...cd(59,8,15),  cardId: 'card001', merchant: '스타벅스 삼성점',     inferredCategory: '카페',  categoryNote: null,                         amount: -9000  },
  { id: 'ct098', ...cd(60,12,30), cardId: 'card001', merchant: '삼성전자 디지털프라자', inferredCategory: '쇼핑', categoryNote: null,                         amount: -250000},
  { id: 'ct099', ...cd(61,8,0),   cardId: 'card001', merchant: '메가MGC커피',         inferredCategory: '카페',  categoryNote: null,                         amount: -2500  },
  { id: 'ct100', ...cd(62,12,0),  cardId: 'card001', merchant: '피부과의원',          inferredCategory: '의료',  categoryNote: null,                         amount: -75000 },
  { id: 'ct101', ...cd(63,18,0),  cardId: 'card001', merchant: '한정식집',            inferredCategory: '식비',  categoryNote: null,                         amount: -55000 },
  { id: 'ct102', ...cd(64,8,30),  cardId: 'card001', merchant: 'T-money 충전',        inferredCategory: '교통',  categoryNote: null,                         amount: -20000 },
  { id: 'ct103', ...cd(65,14,0),  cardId: 'card001', merchant: '무신사',              inferredCategory: '쇼핑',  categoryNote: null,                         amount: -82000 },
  { id: 'ct104', ...cd(66,9,0),   cardId: 'card001', merchant: '투썸플레이스',        inferredCategory: '카페',  categoryNote: null,                         amount: -8500  },
  { id: 'ct105', ...cd(67,12,0),  cardId: 'card001', merchant: '배달의민족',          inferredCategory: '식비',  categoryNote: '음식 배달 (메뉴 불명)',       amount: -16000 },
  { id: 'ct106', ...cd(68,8,45),  cardId: 'card001', merchant: '정형외과',            inferredCategory: '의료',  categoryNote: null,                         amount: -22000 },
  { id: 'ct107', ...cd(69,20,0),  cardId: 'card001', merchant: '뮤지컬 티켓',         inferredCategory: '문화',  categoryNote: null,                         amount: -88000 },
  { id: 'ct108', ...cd(70,8,0),   cardId: 'card001', merchant: '메가MGC커피',         inferredCategory: '카페',  categoryNote: null,                         amount: -2500  },
  { id: 'ct109', ...cd(71,14,30), cardId: 'card001', merchant: '아이허브',            inferredCategory: '쇼핑',  categoryNote: '건강식품·생활용품 혼재',     amount: -65000 },

  // 1월 — 구독
  { id: 'ct115', ...cd(53,10,0),  cardId: 'card001', merchant: '넷플릭스',            inferredCategory: '구독',  categoryNote: null,                         amount: -13900 },
  { id: 'ct116', ...cd(54,10,0),  cardId: 'card001', merchant: '유튜브 프리미엄',     inferredCategory: '구독',  categoryNote: null,                         amount: -14900 },
  { id: 'ct117', ...cd(57,18,0),  cardId: 'card001', merchant: '쿠팡이츠',            inferredCategory: '식비',  categoryNote: '음식 배달 (메뉴 불명)',       amount: -28000 },
  { id: 'ct118', ...cd(60,9,30),  cardId: 'card001', merchant: 'GS주유소',            inferredCategory: '교통',  categoryNote: null,                         amount: -60000 },
  { id: 'ct119', ...cd(63,14,0),  cardId: 'card001', merchant: '마켓컬리',            inferredCategory: '식품', categoryNote: '식품·생활용품 혼재',          amount: -72000 },
  { id: 'ct120', ...cd(66,11,0),  cardId: 'card001', merchant: '스포티파이',          inferredCategory: '구독',  categoryNote: null,                         amount: -10900 },
  { id: 'ct121', ...cd(69,19,30), cardId: 'card001', merchant: '쿠팡',                inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 종합몰)',   amount: -145000},

  // ════════════════════════════════════════════
  // 12월 — iM 체크카드
  // ════════════════════════════════════════════
  { id: 'ct130', ...cd(82,9,0),   cardId: 'card001', merchant: '스타벅스 강남점',     inferredCategory: '카페',  categoryNote: null,                         amount: -8500  },
  { id: 'ct131', ...cd(83,14,0),  cardId: 'card001', merchant: '크리스마스 레스토랑', inferredCategory: '식비',  categoryNote: null,                         amount: -95000 },
  { id: 'ct132', ...cd(84,10,0),  cardId: 'card001', merchant: '롯데백화점',          inferredCategory: '쇼핑',  categoryNote: '품목 불명 (백화점)',          amount: -280000},
  { id: 'ct133', ...cd(85,8,30),  cardId: 'card001', merchant: '이디야커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -4500  },
  { id: 'ct134', ...cd(86,19,0),  cardId: 'card001', merchant: 'CGV 강남',            inferredCategory: '문화',  categoryNote: null,                         amount: -15000 },
  { id: 'ct135', ...cd(87,12,0),  cardId: 'card001', merchant: '연말 회식집',         inferredCategory: '식비',  categoryNote: null,                         amount: -65000 },
  { id: 'ct136', ...cd(88,8,45),  cardId: 'card001', merchant: '할리스커피',          inferredCategory: '카페',  categoryNote: null,                         amount: -5500  },
  { id: 'ct137', ...cd(89,14,0),  cardId: 'card001', merchant: 'KTX 귀성',            inferredCategory: '교통',  categoryNote: null,                         amount: -55000 },
  { id: 'ct138', ...cd(90,12,30), cardId: 'card001', merchant: '배달의민족',          inferredCategory: '식비',  categoryNote: '음식 배달 (메뉴 불명)',       amount: -22000 },
  { id: 'ct139', ...cd(91,9,0),   cardId: 'card001', merchant: '스타벅스 역삼점',     inferredCategory: '카페',  categoryNote: null,                         amount: -7500  },
  { id: 'ct140', ...cd(92,14,0),  cardId: 'card001', merchant: '쿠팡',                inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 종합몰)',   amount: -58000 },

  // 12월 — 구독
  { id: 'ct145', ...cd(83,10,0),  cardId: 'card001', merchant: '넷플릭스',            inferredCategory: '구독',  categoryNote: null,                         amount: -13900 },
  { id: 'ct146', ...cd(84,10,0),  cardId: 'card001', merchant: '유튜브 프리미엄',     inferredCategory: '구독',  categoryNote: null,                         amount: -14900 },
  { id: 'ct147', ...cd(86,18,0),  cardId: 'card001', merchant: '아마존 해외직구',     inferredCategory: '쇼핑',  categoryNote: '품목 불명 (해외 직구)',       amount: -135000},
  { id: 'ct148', ...cd(89,9,30),  cardId: 'card001', merchant: 'GS주유소',            inferredCategory: '교통',  categoryNote: null,                         amount: -60000 },
  { id: 'ct149', ...cd(92,14,0),  cardId: 'card001', merchant: '스포티파이',          inferredCategory: '구독',  categoryNote: null,                         amount: -10900 },
  { id: 'ct150', ...cd(94,19,0),  cardId: 'card001', merchant: '쿠팡 연말대전',       inferredCategory: '쇼핑',  categoryNote: '품목 불명 (온라인 종합몰)',   amount: -198000},

  // ── 신용카드(card002 · iM 신용카드) 승인내역 ──────
  { id: 'cc001', ...cd(1,11,20),  cardId: 'card002', merchant: '쿠팡',           inferredCategory: '쇼핑',  amount: -38900,  categoryNote: '생활용품' },
  { id: 'cc002', ...cd(2,9,30),   cardId: 'card002', merchant: '스타벅스 역삼점', inferredCategory: '카페',  amount: -7500,   categoryNote: '아메리카노' },
  { id: 'cc003', ...cd(3,13,10),  cardId: 'card002', merchant: '마켓컬리',        inferredCategory: '식비',  amount: -52800,  categoryNote: '신선식품' },
  { id: 'cc004', ...cd(5,16,40),  cardId: 'card002', merchant: 'GS25 역삼역점',   inferredCategory: '편의점', amount: -8400,  categoryNote: '간식·음료' },
  { id: 'cc005', ...cd(6,18,20),  cardId: 'card002', merchant: '올리브영 강남점', inferredCategory: '뷰티',  amount: -34200,  categoryNote: '스킨케어' },
  { id: 'cc006', ...cd(8,14,50),  cardId: 'card002', merchant: '교보문고 강남점', inferredCategory: '도서',  amount: -18600,  categoryNote: '신간 도서' },
  { id: 'cc007', ...cd(9,19,30),  cardId: 'card002', merchant: '배달의민족',      inferredCategory: '식비',  amount: -24500,  categoryNote: '치킨' },
  { id: 'cc008', ...cd(10,15,10), cardId: 'card002', merchant: '무신사',          inferredCategory: '쇼핑',  amount: -89000,  categoryNote: '의류' },
  { id: 'cc009', ...cd(12,11,30), cardId: 'card002', merchant: '이마트 역삼점',   inferredCategory: '식비',  amount: -67300,  categoryNote: '장보기' },
  { id: 'cc010', ...cd(14,17,0),  cardId: 'card002', merchant: '스타벅스 강남점', inferredCategory: '카페',  amount: -12500,  categoryNote: '케이크 포함' },
  { id: 'cc011', ...cd(30,10,20), cardId: 'card002', merchant: '쿠팡',           inferredCategory: '쇼핑',  amount: -45600,  categoryNote: '전자용품' },
  { id: 'cc012', ...cd(32,20,10), cardId: 'card002', merchant: '배달의민족',      inferredCategory: '식비',  amount: -19800,  categoryNote: '피자' },
  { id: 'cc013', ...cd(35,14,30), cardId: 'card002', merchant: '올리브영 온라인',  inferredCategory: '뷰티',  amount: -28700,  categoryNote: '헤어케어' },
]

// ──────────────────────────────────────────────
// 프로액티브 알림 조건 체크 (카드 거래 기반)
// ──────────────────────────────────────────────
export function getProactiveAlert() {
  const mainAccount = accounts.find((a) => a.id === 'acc001')
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  const alerts = []

  // 잔액 낮음
  if (mainAccount.balance < 1500000) {
    alerts.push({
      type: 'low_balance',
      message: `주계좌 잔액이 ${mainAccount.balance.toLocaleString()}원입니다. 이번 달 지출 패턴을 고려하면 빠듯할 수 있습니다.`,
    })
  }

  // 이번 달 카드 카페 지출 (카드 기반)
  const cafeSpend = cardTransactions
    .filter((t) => t.inferredCategory === '카페' && t.date >= thisMonthStart && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  if (cafeSpend > 40000) {
    alerts.push({
      type: 'spending_insight',
      message: `이번 달 카페 지출이 ${cafeSpend.toLocaleString()}원입니다. 추정 카테고리 기반 집계로, 실제 금액과 다를 수 있습니다.`,
    })
  }

  // 구독 서비스 알림 (카드 기반)
  const subSpend = cardTransactions
    .filter((t) => t.inferredCategory === '구독' && t.date >= thisMonthStart && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  if (subSpend > 0) {
    alerts.push({
      type: 'subscription',
      message: `이번 달 구독 서비스 추정 지출: ${subSpend.toLocaleString()}원. 미사용 구독을 점검해 보세요.`,
    })
  }

  return alerts[0] || null
}

// ──────────────────────────────────────────────
// 리셋용 초기 스냅샷 (모듈 로드 시 1회 캡처)
// ──────────────────────────────────────────────
const _initialAccounts = structuredClone(accounts)
const _initialTransactions = structuredClone(transactions)

export function getInitialAccounts() {
  return structuredClone(_initialAccounts)
}

export function getInitialTransactions() {
  return structuredClone(_initialTransactions)
}

// ──────────────────────────────────────────────
// 절약 목표 기준 (카테고리별 권장 비율 + 이유)
// ──────────────────────────────────────────────
export const SAVINGS_TARGETS = {
  '카페':   { ratio: 0.6, reason: '주 3회 이하로 줄이면 절약 가능' },
  '구독':   { ratio: 0.5, reason: 'Netflix+Wavve 중복 구독 감지' },
  '쇼핑':   { ratio: 0.7, reason: '월 평균 대비 초과 지출' },
  '식비':   { ratio: 0.8, reason: '외식 비중 높음' },
  '문화':   { ratio: 0.75, reason: '월 2회 이하 문화생활 권장' },
}

// ──────────────────────────────────────────────
// 금융상품 비교 데이터
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// 프로모 상품 가입 시 실계좌 생성
// ──────────────────────────────────────────────
export function createAccount(productId, enrollData = {}) {
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

export const savingsProducts = [
  {
    id: 'imbank-001',
    bank: 'iM뱅크',
    name: '정기적금',
    rate: 4.2,
    term: 6,
    min: 10000,
    max: 500000,
    cta_url: 'imbank://savings/apply',
    features: ['높은 금리', '6개월 단기', '모바일 가입'],
    recommended: true,
  },
  {
    id: 'kakao-001',
    bank: '카카오뱅크',
    name: '자유적금',
    rate: 3.8,
    term: 6,
    min: 1000,
    max: 300000,
    cta_url: null,
    features: ['자유 납입', '소액 가입 가능'],
    recommended: false,
  },
  {
    id: 'toss-001',
    bank: '토스뱅크',
    name: '목돈굴리기',
    rate: 3.5,
    term: 6,
    min: 10000,
    max: 1000000,
    cta_url: null,
    features: ['대용량 한도', '자동 이체'],
    recommended: false,
  },
]
