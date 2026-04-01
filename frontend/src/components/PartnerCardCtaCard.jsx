export default function PartnerCardCtaCard({ data, onStartEnrollment }) {
  return (
    <div className="partner-cta-card ui-card">
      <div className="partner-cta-header">
        <div className="partner-cta-logo-row">
          <span className="partner-cta-logo-pill">iM뱅크</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"><path d="M18 8L22 12L18 16"/><path d="M6 8L2 12L6 16"/></svg>
          <span className="partner-cta-logo-pill partner-cta-logo-pill--hyundai">현대카드</span>
        </div>
        <div className="partner-cta-badge">제휴 특별 혜택</div>
      </div>
      <div className="partner-cta-title">{data?.title || 'iM뱅크 고객 전용 현대카드'}</div>
      <ul className="partner-cta-benefits">
        <li>
          <span className="partner-cta-benefit-icon">💳</span>
          <div>
            <div className="partner-cta-benefit-main">국내외 가맹점 최대 1.5% 캐시백</div>
            <div className="partner-cta-benefit-sub">iM뱅크 결제 시 추가 0.5%</div>
          </div>
        </li>
        <li>
          <span className="partner-cta-benefit-icon">☕</span>
          <div>
            <div className="partner-cta-benefit-main">스타벅스 · 편의점 10% 즉시 할인</div>
            <div className="partner-cta-benefit-sub">월 최대 5,000원</div>
          </div>
        </li>
        <li>
          <span className="partner-cta-benefit-icon">🎁</span>
          <div>
            <div className="partner-cta-benefit-main">첫 해 연회비 무료</div>
            <div className="partner-cta-benefit-sub">이후 연 1만 5천원</div>
          </div>
        </li>
      </ul>
      <button
        className="partner-cta-btn"
        onClick={() => onStartEnrollment?.('partner_hyundai')}
      >
        카드 신청하기
      </button>
    </div>
  )
}
