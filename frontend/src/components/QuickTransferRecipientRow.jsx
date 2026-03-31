import { useState } from 'react'

export default function QuickTransferRecipientRow({
  contact,
  recentAmount,
  frequentAmount,
  isExpanded,
  onExpand,
  onTransfer,
}) {
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [directInput, setDirectInput] = useState('')
  const [showDirect, setShowDirect] = useState(false)

  // 마지막 4자리 마스킹
  const parts = contact.accountNo.split('-')
  const last = parts[parts.length - 1]
  const masked = '****' + last.slice(-4)

  // chip 중복 제거: recentAmount === frequentAmount면 하나만
  const chips = []
  if (frequentAmount) {
    chips.push({ label: frequentAmount.toLocaleString('ko-KR'), sub: '자주', value: frequentAmount })
  }
  if (recentAmount && recentAmount !== frequentAmount) {
    chips.push({ label: recentAmount.toLocaleString('ko-KR'), sub: '최근', value: recentAmount })
  }

  const activeAmount = showDirect
    ? (Number(directInput) || 0)
    : (selectedAmount || 0)

  function handleRowClick() {
    setSelectedAmount(frequentAmount || recentAmount || null)
    setDirectInput('')
    setShowDirect(false)
    onExpand()
  }

  return (
    <div className={`qtp-row${isExpanded ? ' qtp-row--expanded' : ''}`}>
      {/* 행 헤더 (항상 표시) */}
      <div className="qtp-row-main" onClick={handleRowClick} role="button" tabIndex={0}>
        <div className="qtp-row-info">
          <span className="qtp-row-name">{contact.realName}</span>
          <span className="qtp-row-bank">{contact.bank}</span>
        </div>
        {!isExpanded && frequentAmount && (
          <span className="qtp-chip-preview">
            {frequentAmount.toLocaleString('ko-KR')}원
          </span>
        )}
        <svg
          className={`qtp-row-chevron${isExpanded ? ' qtp-row-chevron--open' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* 인라인 확장 영역 */}
      {isExpanded && (
        <div className="qtp-expand">
          <div className="qtp-expand-account">
            {contact.bank} &nbsp;{masked}
          </div>

          <div className="qtp-chips">
            {chips.map((c) => (
              <button
                key={c.value}
                className={`qtp-chip${selectedAmount === c.value && !showDirect ? ' qtp-chip--active' : ''}`}
                onClick={() => { setSelectedAmount(c.value); setShowDirect(false) }}
              >
                {c.label}
                <span className="qtp-chip-sub">{c.sub}</span>
              </button>
            ))}
            <button
              className={`qtp-chip${showDirect ? ' qtp-chip--active' : ''}`}
              onClick={() => { setShowDirect(true); setSelectedAmount(null) }}
            >
              직접 입력
            </button>
          </div>

          {showDirect && (
            <input
              className="qtp-direct-input"
              type="tel"
              inputMode="numeric"
              placeholder="금액 입력"
              value={directInput}
              onChange={(e) => setDirectInput(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          )}

          <button
            className="qtp-send-btn"
            disabled={activeAmount <= 0}
            onClick={() => onTransfer(activeAmount)}
          >
            보내기
          </button>
        </div>
      )}
    </div>
  )
}
