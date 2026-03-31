export default function CreditCardPitchCard({ data, onStartEnrollment, promoIds }) {
  const { product } = data
  const isEnrolled = data.productId && promoIds != null && !promoIds.has(data.productId)

  return (
    <div className="cc-pitch-card ui-card">
      {/* 헤더 */}
      <div className="cc-pitch-header">
        <div className="cc-pitch-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <div className="cc-pitch-title-group">
          <div className="cc-pitch-name">{product.name}</div>
          <div className="cc-pitch-fee">
            {product.annualFee === 0
              ? <span className="cc-fee-free">연회비 없음</span>
              : <span className="cc-fee-amount">연회비 {product.annualFee.toLocaleString('ko-KR')}원</span>
            }
          </div>
        </div>
      </div>

      {/* 혜택 그리드 */}
      {product.benefits && product.benefits.length > 0 && (
        <div className="cc-benefits-grid">
          {product.benefits.map((b, i) => (
            <div key={i} className="cc-benefit-row">
              <span className="cc-benefit-category">{b.category}</span>
              <span className="cc-benefit-rate">{b.rate}</span>
            </div>
          ))}
        </div>
      )}

      {/* 주요 특징 */}
      {product.highlights && product.highlights.length > 0 && (
        <ul className="cc-highlights">
          {product.highlights.map((h, i) => (
            <li key={i} className="cc-highlight-item">
              <span className="cc-highlight-dot" />
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* 이용 조건 */}
      {product.conditions && (
        <div className="cc-conditions">{product.conditions}</div>
      )}

      {/* 태그 */}
      {product.tags && product.tags.length > 0 && (
        <div className="cc-tags">
          {product.tags.map((t, i) => (
            <span key={i} className="cc-tag">#{t}</span>
          ))}
        </div>
      )}

      {/* CTA */}
      {data.productId && (
        isEnrolled ? (
          <div className="pitch-enrolled-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            신청 완료 · 심사 중
          </div>
        ) : (
          onStartEnrollment && (
            <button
              className="cc-pitch-apply-btn"
              onClick={() => onStartEnrollment(data.productId)}
            >
              지금 신청하기
            </button>
          )
        )
      )}
    </div>
  )
}
