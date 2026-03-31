// frontend/src/components/ProductPitchCard.jsx
const TYPE_ICONS = {
  cma: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 8.5 11 13 14.5 20 7"/>
      <polyline points="15 7 20 7 20 12"/>
    </svg>
  ),
  term_deposit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  ),
  savings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
}

const TYPE_COLORS = {
  cma: '#EF4444',
  term_deposit: '#8B5CF6',
  savings: '#F59E0B',
}

export default function ProductPitchCard({ data }) {
  const { product, personal, compare } = data
  const color = TYPE_COLORS[product.type] || '#00C9A7'
  const Icon = TYPE_ICONS[product.type]

  return (
    <div className="pitch-card ui-card">
      {/* 헤더 */}
      <div className="pitch-header">
        <div className="pitch-icon" style={{ background: color + '1A', color }}>
          {Icon}
        </div>
        <div>
          <div className="pitch-name">{product.name}</div>
          <div className="pitch-rate" style={{ color }}>연 {product.interestRate.toFixed(2)}%</div>
        </div>
      </div>

      {/* 주요 특징 */}
      {product.highlights.length > 0 && (
        <ul className="pitch-highlights">
          {product.highlights.map((h, i) => (
            <li key={i} className="pitch-highlight-item">{h}</li>
          ))}
        </ul>
      )}

      <div className="pitch-divider" />

      {/* 개인화 수익 하이라이트 */}
      <div className="pitch-personal" style={{ borderColor: color + '33', background: color + '0D' }}>
        <span className="pitch-personal-label">{personal.label}</span>
        <div className="pitch-personal-numbers">
          {personal.dailyGain !== null && (
            <span className="pitch-personal-daily" style={{ color }}>
              +{personal.dailyGain.toLocaleString('ko-KR')}원/일
            </span>
          )}
          <span className="pitch-personal-annual" style={{ color }}>
            연 +{personal.annualGain.toLocaleString('ko-KR')}원
          </span>
        </div>
      </div>

      {/* 비교 */}
      <div className="pitch-compare">
        <div className="pitch-compare-item pitch-compare-current">
          <div className="pitch-compare-label">{compare.current.label}</div>
          <div className="pitch-compare-rate">{compare.current.rate.toFixed(1)}%</div>
          <div className="pitch-compare-gain">연 +{compare.current.annualGain.toLocaleString('ko-KR')}원</div>
        </div>
        <div className="pitch-compare-arrow">vs</div>
        <div className="pitch-compare-item pitch-compare-winner" style={{ borderColor: color + '4D' }}>
          <div className="pitch-compare-label">{compare.withProduct.label}</div>
          <div className="pitch-compare-rate" style={{ color }}>{compare.withProduct.rate.toFixed(2)}%</div>
          <div className="pitch-compare-gain" style={{ color }}>연 +{compare.withProduct.annualGain.toLocaleString('ko-KR')}원</div>
        </div>
      </div>

      {product.earlyWithdrawal && (
        <div className="pitch-footnote">{product.earlyWithdrawal}</div>
      )}
    </div>
  )
}
