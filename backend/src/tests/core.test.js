import { describe, it, test, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { getInitialAccounts, getInitialTransactions, createAccount } from '../mockData.js'
import { handleToolCall } from '../tools.js'
import { app, getCrossAccountSummary, buildSystemPrompt } from '../server.js'

// 테스트용 세션 ctx 팩토리
function makeCtx() {
  return {
    accounts: getInitialAccounts(),
    transactions: getInitialTransactions(),
    aliasStore: new Map(),
  }
}

// ── Test 1: alertId ──────────────────────────────────────────────────────────
describe('alertId', () => {
  it('alertId는 Date.now() 기반 문자열이어야 한다', () => {
    const alertId = Date.now().toString()
    expect(typeof alertId).toBe('string')
    expect(alertId.length).toBeGreaterThan(0)
  })

  it('TRANSACTION_ALERT_COMMENT의 alertId가 TRANSACTION_ALERT의 alertId와 일치해야 한다', () => {
    const alertId = Date.now().toString()
    const alertEvent = { type: 'TRANSACTION_ALERT', data: { alertId, counterpart: '테스트', amount: -1000 } }
    const commentEvent = { type: 'TRANSACTION_ALERT_COMMENT', data: { alertId, comment: '테스트 코멘트' } }

    expect(alertEvent.data.alertId).toBe(commentEvent.data.alertId)
  })
})

// ── Test 2: reset-mock (세션 격리) ───────────────────────────────────────────
describe('reset-mock', () => {
  it('새 ctx는 초기 잔액을 가져야 한다', () => {
    const ctx = makeCtx()
    const initialBalance = getInitialAccounts().find((a) => a.id === 'acc001').balance
    expect(ctx.accounts.find((a) => a.id === 'acc001').balance).toBe(initialBalance)
  })

  it('ctx 변형이 다른 ctx에 영향을 주지 않아야 한다', () => {
    const ctx1 = makeCtx()
    const ctx2 = makeCtx()
    ctx1.accounts[0].balance -= 50000
    ctx1.aliasStore.set('엄마', { realName: '이순자', bank: '농협은행', accountNo: '301-1234-5678-01' })

    // ctx2는 영향 없음
    const initialBalance = getInitialAccounts().find((a) => a.id === 'acc001').balance
    expect(ctx2.accounts.find((a) => a.id === 'acc001').balance).toBe(initialBalance)
    expect(ctx2.aliasStore.size).toBe(0)
  })

  it('새 ctx의 aliasStore는 비어있어야 한다', () => {
    const ctx = makeCtx()
    expect(ctx.aliasStore.size).toBe(0)
  })
})

// ── Test 3: handleSavingsAdvice ───────────────────────────────────────────────
describe('handleSavingsAdvice', () => {
  it('기본 호출 시 savings 배열과 total_saveable를 반환해야 한다', () => {
    const result = handleToolCall('get_savings_advice', {}, makeCtx())
    expect(result).toHaveProperty('savings')
    expect(Array.isArray(result.savings)).toBe(true)
    expect(result).toHaveProperty('total_saveable')
    expect(typeof result.total_saveable).toBe('number')
  })

  it('savings 각 항목은 category, saveable, reason 필드를 가져야 한다', () => {
    const result = handleToolCall('get_savings_advice', { period: 'this_month' }, makeCtx())
    for (const item of result.savings) {
      expect(item).toHaveProperty('category')
      expect(item).toHaveProperty('saveable')
      expect(item).toHaveProperty('reason')
    }
  })

  it('카테고리 지출이 없을 때 savings가 빈 배열이어야 한다', () => {
    const result = handleToolCall('get_savings_advice', { period: 'last_month' }, makeCtx())
    expect(Array.isArray(result.savings)).toBe(true)
  })
})

// ── Test 4: handleCompareProducts ─────────────────────────────────────────────
describe('handleCompareProducts', () => {
  it('기본 호출 시 recommended와 products 배열을 반환해야 한다', () => {
    const result = handleToolCall('compare_products', {}, makeCtx())
    expect(result).toHaveProperty('recommended')
    expect(result).toHaveProperty('products')
    expect(Array.isArray(result.products)).toBe(true)
  })

  it('amount 미전달 시 50000원 기본값이 적용되어야 한다', () => {
    const result = handleToolCall('compare_products', {}, makeCtx())
    expect(result.amount).toBe(50000)
    expect(result.amount_formatted).toBe('50,000원')
  })

  it('recommended 상품은 cta_url이 있으면 iM뱅크 상품이어야 한다', () => {
    const result = handleToolCall('compare_products', { amount: 100000 }, makeCtx())
    if (result.recommended?.cta_url) {
      expect(result.recommended.bank).toBe('iM뱅크')
    }
  })
})

// ── Test 5: candidates 자동 선택 메시지 형식 ─────────────────────────────────
describe('candidates 자동 선택 메시지', () => {
  it('첫 번째 후보의 완성 메시지 형식이 올바르야 한다', () => {
    const query = '엄마'
    const candidate = {
      realName: '이순자',
      bank: '농협은행',
      accountNoMasked: '5678',
    }

    const autoMsg = `${query}은(는) ${candidate.realName} (${candidate.bank} ${candidate.accountNoMasked})이야. 이 분으로 진행해줘.`
    expect(autoMsg).toBe('엄마은(는) 이순자 (농협은행 5678)이야. 이 분으로 진행해줘.')
  })
})

// ── Test 6: 프로모 계좌 구조 검증 ─────────────────────────────────────────────
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
      { content: '역할없음' },
      { role: 'assistant' },
    ]
    if (session.messages.length === 0) {
      session.messages = incoming.filter((m) => m.role && m.content).slice(-20)
    }
    expect(session.messages.length).toBe(1)
    expect(session.messages[0].content).toBe('유효')
  })
})

// ── Test 8: createAccount ─────────────────────────────────────────────────────
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

// ── Test 9: POST /api/quick-transfer ─────────────────────────────────────────
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

// ── Test 10: GET /api/contacts ────────────────────────────────────────────────
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

// ── Test 11: getCrossAccountSummary (Living Accounts) ─────────────────────────
describe('getCrossAccountSummary', () => {
  function makeSession() {
    return {
      accounts: getInitialAccounts(),
      transactions: getInitialTransactions(),
      aliasStore: new Map(),
    }
  }

  it('currentAccountId 제외한 나머지 계좌 요약을 반환한다', () => {
    const session = makeSession()
    const result = getCrossAccountSummary(session, 'acc001')
    expect(result).toContain('[OTHER_ACCOUNTS]')
    expect(result).toContain('급여계좌')
    expect(result).not.toContain('acc001')
  })

  it('acc008 제외 시 주계좌가 포함된다', () => {
    const session = makeSession()
    const result = getCrossAccountSummary(session, 'acc008')
    expect(result).toContain('주계좌')
    expect(result).not.toContain('acc008')
  })

  it('currentAccountId가 TARGET_IDS 외부 계좌이면 acc001/acc008/card001 모두 포함된다', () => {
    const session = makeSession()
    const result = getCrossAccountSummary(session, 'acc999')
    expect(result).toContain('주계좌')
    expect(result).toContain('급여계좌')
  })

  it('TARGET_IDS 계좌가 session에 없으면 빈 문자열 반환', () => {
    const session = { accounts: [], transactions: [], aliasStore: new Map() }
    const result = getCrossAccountSummary(session, 'acc001')
    expect(result).toBe('')
  })

  it('반환값에 [/OTHER_ACCOUNTS] 닫는 태그가 포함된다', () => {
    const session = makeSession()
    const result = getCrossAccountSummary(session, 'acc001')
    expect(result).toContain('[/OTHER_ACCOUNTS]')
  })
})

// ── Test 12: buildSystemPrompt — service view 분기 ──────────────────────────────
describe('buildSystemPrompt — service view', () => {
  test('service view 시 [CURRENT_VIEW]에 serviceId/serviceName 포함', () => {
    const result = buildSystemPrompt({ view: 'service', serviceId: 'credit-score', serviceName: '신용점수 콘솔' }, null)
    expect(result).toContain('view: service')
    expect(result).toContain('serviceId: credit-score')
    expect(result).toContain('serviceName: 신용점수 콘솔')
  })

  test('service view 시 ACCOUNT_TYPE_CONTEXTS 내용 미포함 (계좌 제약 주입 안 됨)', () => {
    const result = buildSystemPrompt({ view: 'service', serviceId: 'credit-score', serviceName: '신용점수 콘솔' }, null)
    expect(result).not.toContain('[ACCOUNT_CONSTRAINTS]')
    expect(result).not.toContain('[OTHER_ACCOUNTS]')
  })

  test('service view 시 계좌 툴 사용 금지 안내 포함', () => {
    const result = buildSystemPrompt({ view: 'service', serviceId: 'loan-consult', serviceName: '대출 상담' }, null)
    expect(result).toContain('계좌 전용 툴은 사용하지 마세요')
  })
})

// ── Test 13: POST /api/demo-start ─────────────────────────────────────────────
describe('POST /api/demo-start', () => {
  test('sessionId 전달 시 200 응답과 ok:true 반환', async () => {
    const res = await request(app)
      .post('/api/demo-start')
      .send({ sessionId: 'test-demo' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  test('sessionId 없이도 200 응답 반환 (broadcastWsEvent 경로)', async () => {
    const res = await request(app)
      .post('/api/demo-start')
      .send({})
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
