// 서비스 아이콘 SVG
const ReportIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <path d="M7 8h10M7 12h6M7 16h4"/>
  </svg>
)

const CreditIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
    <path d="M12 8v4l3 3"/>
  </svg>
)

const LoanIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="13" rx="2"/>
    <path d="M3 10h18"/>
    <path d="M7 14h2M11 14h2"/>
  </svg>
)

const InvestIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 17 9 11 13 15 21 7"/>
    <polyline points="15 7 21 7 21 13"/>
  </svg>
)

const AssetIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 8v4M12 16h.01"/>
  </svg>
)

const MortgageIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 4l9 8"/>
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-9"/>
  </svg>
)

const InsuranceIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3L4 7v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V7l-8-4z"/>
  </svg>
)

const CardLimitIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="13" rx="2"/>
    <line x1="2" y1="11" x2="22" y2="11"/>
    <circle cx="17" cy="15" r="2.5"/>
    <line x1="14.5" y1="15" x2="12" y2="15"/>
  </svg>
)

const PointIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const EventIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
)

const CATEGORIES = [
  {
    label: '자산 관리',
    items: [
      { id: 'monthly-report', label: '월간\n리포트', type: 'ai_room', color: '#3B82F6', Icon: ReportIcon },
      { id: 'credit-score', label: '신용점수\n콘솔', type: 'ai_room', color: '#8B5CF6', Icon: CreditIcon },
      { id: 'invest', label: '투자상품\n가입', type: 'web_flow', color: '#10B981', Icon: InvestIcon },
      { id: 'asset-analysis', label: '자산 분석', type: 'coming_soon', color: '#4B5275', Icon: AssetIcon },
    ],
  },
  {
    label: '대출 · 보험',
    items: [
      { id: 'loan-consult', label: '대출 상담', type: 'ai_room', color: '#F59E0B', Icon: LoanIcon },
      { id: 'mortgage', label: '전세대출\n안내', type: 'coming_soon', color: '#4B5275', Icon: MortgageIcon },
      { id: 'insurance', label: '보험 조회', type: 'coming_soon', color: '#4B5275', Icon: InsuranceIcon },
      { id: 'card-limit', label: '카드한도\n조회', type: 'coming_soon', color: '#4B5275', Icon: CardLimitIcon },
    ],
  },
  {
    label: '혜택 · 이벤트',
    items: [
      { id: 'points', label: '포인트\n조회', type: 'coming_soon', color: '#4B5275', Icon: PointIcon },
      { id: 'events', label: '이벤트', type: 'coming_soon', color: '#4B5275', Icon: EventIcon },
    ],
  },
]

// 서비스 이름 맵
const SERVICE_NAMES = {
  'monthly-report': '월간 금융 리포트',
  'credit-score': '신용점수 콘솔',
  'invest': '투자상품 가입',
  'loan-consult': '대출 상담',
}

export { SERVICE_NAMES }

export default function ServiceScreen({ onEnterServiceRoom, onToast }) {
  function handleTap(item) {
    if (item.type === 'coming_soon') {
      onToast?.('곧 출시됩니다')
      return
    }
    if (item.type === 'web_flow') {
      onToast?.('투자상품 가입은 iM뱅크 앱에서 진행됩니다')
      return
    }
    if (item.type === 'ai_room') {
      onEnterServiceRoom?.(item.id)
    }
  }

  return (
    <div className="service-screen">
      <div className="service-screen-header">서비스</div>
      <div className="service-screen-scroll">
        {CATEGORIES.map((cat) => {
          // 4열 기준 마지막 행이 4개 미만이면 빈 슬롯으로 채움
          const padded = [...cat.items]
          while (padded.length % 4 !== 0) padded.push(null)

          return (
            <div key={cat.label}>
              <div className="service-category-label">{cat.label}</div>
              <div className="service-grid">
                {padded.map((item, i) => {
                  if (!item) {
                    return <div key={`empty-${i}`} className="service-item-btn service-item-btn--empty" aria-hidden="true" />
                  }
                  const isComingSoon = item.type === 'coming_soon'
                  return (
                    <button
                      key={item.id}
                      className={`service-item-btn${isComingSoon ? ' service-item-btn--coming-soon' : ''}`}
                      onClick={() => handleTap(item)}
                      aria-label={isComingSoon ? `${item.label} (준비 중)` : item.label}
                    >
                      <div
                        className={`service-item-icon${isComingSoon ? ' service-item-icon--coming-soon' : ''}`}
                        style={{ background: `linear-gradient(135deg, ${item.color}33, ${item.color}1a)`, border: `1px solid ${item.color}40` }}
                      >
                        <item.Icon />
                      </div>
                      <span className="service-item-label" style={{ whiteSpace: 'pre-line' }}>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
