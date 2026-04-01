import { useState, useRef, useEffect } from 'react'

// ── 단계 표시 dot indicator ──────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="enroll-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`enroll-dot${i < current - 1 ? ' enroll-dot--done' : i === current - 1 ? ' enroll-dot--active' : ''}`} />
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
      <label htmlFor="fund-from-account" className="enroll-field-label">출금 계좌</label>
      <select
        id="fund-from-account"
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
      <label htmlFor="fund-amount" className="enroll-field-label">입금 금액</label>
      <input
        id="fund-amount"
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
        disabled={insufficient || !fromAccountId || amount === 0}
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

      <label htmlFor="term-from-account" className="enroll-field-label">출금 계좌</label>
      <select id="term-from-account" className="enroll-select" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
        {checkingAccounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.balance.toLocaleString('ko-KR')}원)
          </option>
        ))}
      </select>

      <label htmlFor="term-amount" className="enroll-field-label">예치 금액</label>
      <input
        id="term-amount"
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
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  function handleCert() {
    setStatus('loading')
    setTimeout(() => {
      if (!mountedRef.current) return
      setStatus('done')
      setTimeout(() => {
        if (!mountedRef.current) return
        onComplete({})
      }, 500)
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

// ── Step 3c: 소득 확인 (신용카드) ──────────────────
function IncomeStep({ onComplete }) {
  const EMPLOYMENT_TYPES = ['직장인', '자영업자', '프리랜서', '학생·무직']
  const [employment, setEmployment] = useState('직장인')
  const [annualStr, setAnnualStr] = useState('')

  const annual = Number(annualStr.replace(/[^\d]/g, ''))

  return (
    <div className="enroll-step">
      <p className="enroll-step-desc">간단한 소득 정보를 입력해주세요.</p>
      <label className="enroll-field-label">직업 유형</label>
      <div className="enroll-chip-group">
        {EMPLOYMENT_TYPES.map((t) => (
          <button
            key={t}
            className={`enroll-chip${employment === t ? ' enroll-chip--active' : ''}`}
            onClick={() => setEmployment(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <label htmlFor="income-annual" className="enroll-field-label">연소득 (만원)</label>
      <input
        id="income-annual"
        className="enroll-amount-input"
        type="tel"
        inputMode="numeric"
        placeholder="예: 4000"
        value={annualStr}
        onChange={(e) => setAnnualStr(e.target.value.replace(/[^\d]/g, ''))}
      />
      <p className="enroll-step-hint">심사에 활용되며 외부에 공유되지 않습니다.</p>
      <button
        className="enroll-btn-primary"
        disabled={annual === 0}
        onClick={() => onComplete({ employment, annualIncome: annual })}
      >
        신청하기
      </button>
    </div>
  )
}

// ── 메인 EnrollmentModal ─────────────────────────────────
const TOTAL_STEPS = {
  promo_cma: 3,
  promo_term_deposit: 4,
  promo_savings: 3,
  acc007: 3,
}

export default function EnrollmentModal({ state, accounts, onStepComplete, onDismiss, isClosing }) {
  const { productId, step } = state
  const total = TOTAL_STEPS[productId] || 3

  // 현재 step에 맞는 컴포넌트 반환
  function renderStep() {
    // Step 1: 모든 상품 공통 — 전화번호 확인
    if (step === 1) return <PhoneConfirmStep onComplete={onStepComplete} />

    // Step 2: 모든 상품 공통 — SMS 인증
    if (step === 2) return <SmsVerifyStep onComplete={onStepComplete} />

    // Step 3: 상품별 분기
    if (step === 3 && productId === 'acc007') {
      return <IncomeStep onComplete={onStepComplete} />
    }
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
    <div className={`enroll-overlay${isClosing ? ' closing' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onDismiss() }}>
      <div className={`enroll-modal${isClosing ? ' closing' : ''}`}>
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
