import { useState } from 'react'

const COMMON_BANKS = [
  'KB국민은행', '신한은행', '하나은행', '우리은행', '농협은행',
  'IBK기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고',
  'SC제일은행', '씨티은행', 'iM뱅크',
]

export default function ContactCandidatesCard({ data, onQuickAction }) {
  const { query, candidates = [], status } = data
  const [showDirectInput, setShowDirectInput] = useState(status === 'no_history')
  const [directName, setDirectName] = useState('')
  const [directBank, setDirectBank] = useState('')
  const [directAccountNo, setDirectAccountNo] = useState('')
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false)

  function handleCandidateSelect(c) {
    onQuickAction(
      `${query}은(는) ${c.realName} (${c.bank} ${c.accountNoMasked})이야. 이 분으로 진행해줘.`
    )
  }

  function handleDirectSubmit() {
    const name = directName.trim()
    const bank = directBank.trim()
    const accountNo = directAccountNo.replace(/\s/g, '')
    if (!name || !bank || !accountNo) return
    onQuickAction(
      `${query}은(는) ${name} (${bank} ${accountNo})이야. 이 분으로 등록하고 진행해줘.`
    )
  }

  function selectBank(bank) {
    setDirectBank(bank)
    setBankDropdownOpen(false)
  }

  const canSubmit = directName.trim() && directBank.trim() && directAccountNo.trim()

  return (
    <div className="ui-card candidates-card">
      <div className="candidates-header">
        <span className="candidates-title">'{query}' 수신자 설정</span>
        {candidates.length > 0 && (
          <span className="candidates-hint">탭하여 선택</span>
        )}
      </div>

      {/* 기존 거래 내역 후보 */}
      {candidates.length > 0 && (
        <div className="candidates-list">
          {candidates.map((c, i) => (
            <button
              key={c.accountNo}
              className="candidate-item"
              onClick={() => handleCandidateSelect(c)}
            >
              <div className="candidate-index">{i + 1}</div>
              <div className="candidate-info">
                <div className="candidate-name">{c.realName}</div>
                <div className="candidate-bank">{c.bank} · {c.accountNoMasked}</div>
              </div>
              <div className="candidate-meta">
                <div className="candidate-count">{c.transferCount}회</div>
                {c.lastTransferDate && (
                  <div className="candidate-date">{c.lastTransferDate.slice(5)}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 직접 입력 토글 */}
      {candidates.length > 0 && !showDirectInput && (
        <button
          className="direct-input-toggle"
          onClick={() => setShowDirectInput(true)}
        >
          다른 계좌 직접 입력
        </button>
      )}

      {/* 직접 입력 폼 */}
      {showDirectInput && (
        <div className="direct-input-form">
          {candidates.length === 0 && (
            <p className="direct-input-hint">거래 내역이 없습니다. 계좌를 직접 입력해 주세요.</p>
          )}
          <input
            className="direct-input-field"
            type="text"
            placeholder="받는 분 이름"
            value={directName}
            onChange={(e) => setDirectName(e.target.value)}
            autoComplete="off"
          />
          <div className="direct-bank-wrap">
            <input
              className="direct-input-field"
              type="text"
              placeholder="은행명 (예: 신한은행)"
              value={directBank}
              onChange={(e) => { setDirectBank(e.target.value); setBankDropdownOpen(true) }}
              onFocus={() => setBankDropdownOpen(true)}
              onBlur={() => setTimeout(() => setBankDropdownOpen(false), 150)}
              autoComplete="off"
            />
            {bankDropdownOpen && (
              <div className="bank-dropdown">
                {COMMON_BANKS
                  .filter((b) => b.includes(directBank) || directBank === '')
                  .map((b) => (
                    <button
                      key={b}
                      className="bank-dropdown-item"
                      onMouseDown={() => selectBank(b)}
                    >
                      {b}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <input
            className="direct-input-field"
            type="text"
            placeholder="계좌번호 (- 포함 또는 숫자만)"
            value={directAccountNo}
            onChange={(e) => setDirectAccountNo(e.target.value)}
            autoComplete="off"
            inputMode="numeric"
          />
          <div className="direct-input-actions">
            {candidates.length > 0 && (
              <button
                className="direct-input-cancel"
                onClick={() => setShowDirectInput(false)}
              >
                취소
              </button>
            )}
            <button
              className="direct-input-submit"
              onClick={handleDirectSubmit}
              disabled={!canSubmit}
            >
              등록 후 이체
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
