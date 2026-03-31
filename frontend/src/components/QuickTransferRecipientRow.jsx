export default function QuickTransferRecipientRow({
  contact,
  recentAmount,
  frequentAmount,
  onTransfer,
  disabled,
}) {
  // 마지막 4자리 마스킹
  const parts = (contact.accountNo || '').split('-')
  const last = parts[parts.length - 1] || ''
  const masked = last.length >= 4 ? '****' + last.slice(-4) : last

  const defaultAmount = frequentAmount || recentAmount || 0

  return (
    <button
      className={`qtp-row-main${disabled ? ' qtp-row-main--disabled' : ''}`}
      type="button"
      disabled={disabled}
      onClick={() => onTransfer(defaultAmount)}
    >
      <div className="qtp-row-info">
        <span className="qtp-row-name">{contact.realName}</span>
        <span className="qtp-row-bank">{contact.bank} {masked}</span>
      </div>
      {defaultAmount > 0 && (
        <span className="qtp-chip-preview">
          {defaultAmount.toLocaleString('ko-KR')}원
        </span>
      )}
      <svg
        className="qtp-row-arrow"
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  )
}
