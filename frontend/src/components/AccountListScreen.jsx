import { useState, useRef, useEffect } from 'react'

const ICONS = {
  checking: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  installment_savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="11" r="6"/>
      <path d="M12 17v2M9 20h6"/>
      <path d="M15 11a3 3 0 0 0-6 0"/>
      <line x1="16" y1="9" x2="18" y2="9"/>
    </svg>
  ),
  term_deposit: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  cma: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2v10l6 3"/>
    </svg>
  ),
  debit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
      <line x1="5" y1="15" x2="9" y2="15"/>
      <line x1="12" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  credit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
      <circle cx="18" cy="15" r="2"/>
    </svg>
  ),
}

const TYPE_CONFIG = {
  checking:            { color: '#3B82F6', label: '입출금' },
  installment_savings: { color: '#10B981', label: '정기적금' },
  term_deposit:        { color: '#8B5CF6', label: '정기예금' },
  savings:             { color: '#F59E0B', label: '비상금' },
  cma:                 { color: '#EF4444', label: 'CMA' },
  debit_card:          { color: '#0EA5E9', label: '체크카드' },
  credit_card:         { color: '#6B7280', label: '신용카드' },
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function SkeletonItem() {
  return (
    <div className="account-list-item skeleton-item" aria-hidden="true">
      <div className="account-avatar skeleton-avatar" />
      <div className="account-list-item-body">
        <div className="account-list-item-top">
          <div className="skeleton-line" style={{ width: '100px', height: '14px' }} />
          <div className="skeleton-line" style={{ width: '70px', height: '13px' }} />
        </div>
        <div className="account-list-item-bottom">
          <div className="skeleton-line" style={{ width: '140px', height: '12px', marginTop: '4px' }} />
        </div>
      </div>
    </div>
  )
}

const PRODUCT_SUGGESTIONS = {
  installment_savings: {
    label: '정기적금',
    color: '#10B981',
    desc: '매달 꾸준히 모아서 목돈 만들기',
    query: '정기적금 상품 추천해줘',
  },
  term_deposit: {
    label: '정기예금',
    color: '#8B5CF6',
    desc: '목돈을 안전하게 불려보세요',
    query: '정기예금 상품 알려줘',
  },
  savings: {
    label: '비상금 통장',
    color: '#F59E0B',
    desc: '언제든 꺼내 쓸 수 있는 안전망',
    query: '비상금 통장 추천해줘',
  },
  cma: {
    label: 'CMA',
    color: '#EF4444',
    desc: '하루만 맡겨도 이자가 붙는 통장',
    query: 'CMA 계좌에 대해 알려줘',
  },
}

function BalanceDisplay({ value, animate, prefix, suffix }) {
  const [current, setCurrent] = useState(0)
  const startedRef = useRef(false)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!animate || startedRef.current) {
      setCurrent(value)
      return
    }
    startedRef.current = true
    const start = performance.now()
    const DURATION = 750

    const tick = (now) => {
      const t = Math.min((now - start) / DURATION, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setCurrent(Math.round(value * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [animate, value])

  const pref = prefix || ''
  const suf = suffix || '원'
  return <span className={`balance-counter${animate && !startedRef.current ? ' counting' : ''}`}>{pref}{current.toLocaleString('ko-KR')}{suf}</span>
}

export default function AccountListScreen({
  accounts,
  unreadCounts,
  isLoading,
  ttsEnabled,
  onEnterRoom,
  onTtsToggle,
  onReset,
  onShowOnboarding,
  onProductSuggest,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (!isLoading && accounts.length > 0 && !shouldAnimate) {
      setShouldAnimate(true)
    }
  }, [isLoading, accounts.length])

  // 미보유 상품 타입 (계좌가 4개 미만일 때 표시)
  const ownedTypes = new Set(accounts.map((a) => a.type))
  const suggestedTypes = Object.keys(PRODUCT_SUGGESTIONS).filter((t) => !ownedTypes.has(t))
  const showSuggestions = !isLoading && accounts.length > 0 && suggestedTypes.length > 0 && accounts.length < 4

  return (
    <div className="account-list-screen" onClick={() => menuOpen && setMenuOpen(false)}>
      <div className="account-list-header">
        <button
          className="account-list-title-btn"
          onClick={() => onShowOnboarding?.()}
          aria-label="앱 소개 보기"
        >
          iM뱅크
        </button>
        <div className="account-list-menu-wrap">
          <button
            className="account-list-menu-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            aria-label="메뉴"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="account-list-dropdown" onClick={(e) => e.stopPropagation()}>
              <button
                className="dropdown-item"
                onClick={() => { onTtsToggle?.(); setMenuOpen(false) }}
              >
                {ttsEnabled ? '음성 끄기' : '음성 켜기'}
              </button>
              <button
                className="dropdown-item"
                onClick={() => { onReset?.(); setMenuOpen(false) }}
              >
                초기화
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="account-list-items">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => <SkeletonItem key={i} />)
          : accounts.length === 0
          ? (
            <div className="account-list-empty">
              <p>연결된 계좌가 없어요.</p>
            </div>
          )
          : accounts.map((acc) => {
              const cfg = TYPE_CONFIG[acc.type] || { color: '#6B7280', label: acc.type }
              const unread = unreadCounts?.[acc.id] || 0
              const last = acc.lastTransaction
              const isPromo = acc.isPromo === true

              return (
                <button
                  key={acc.id}
                  className={`account-list-item${isPromo ? ' account-list-item--promo' : ''}`}
                  onClick={() => onEnterRoom(acc.id)}
                >
                  <div
                    className="account-avatar"
                    style={{ background: cfg.color, opacity: isPromo ? 0.5 : 1 }}
                  >
                    {ICONS[acc.type] || ICONS.checking}
                  </div>

                  <div className="account-list-item-body">
                    <div className="account-list-item-top">
                      <span className="account-list-name">{acc.name}</span>
                      <span className="account-list-balance">
                        {acc.isPromo ? (
                          <span className="balance-promo-badge">미발급</span>
                        ) : acc.type === 'debit_card' ? (
                          <BalanceDisplay value={acc.balance} animate={shouldAnimate} prefix="이번달 " suffix="원 사용" />
                        ) : (
                          <BalanceDisplay value={acc.balance} animate={shouldAnimate} />
                        )}
                      </span>
                    </div>
                    <div className="account-list-item-bottom">
                      <span className="account-list-preview">
                        {isPromo
                          ? 'iM뱅크 신용카드 혜택 알아보기'
                          : last
                          ? `${last.counterpart} ${last.amountFormatted}`
                          : cfg.label}
                      </span>
                      <span className="account-list-time">
                        {last ? formatDateShort(last.date) : ''}
                      </span>
                    </div>
                  </div>

                  {unread > 0 && (
                    <div className="unread-badge">{unread}</div>
                  )}
                </button>
              )
            })}

        {/* 상품 추천 섹션 (콜드 스타트 / 계좌 4개 미만) */}
        {showSuggestions && (
          <div className="product-suggestion-section">
            <div className="product-suggestion-header">
              <span>더 열어볼 수 있어요</span>
            </div>
            {suggestedTypes.map((type) => {
              const sg = PRODUCT_SUGGESTIONS[type]
              return (
                <button
                  key={type}
                  className="product-suggestion-item"
                  onClick={() => onProductSuggest?.(sg.query)}
                >
                  <div
                    className="product-suggestion-icon"
                    style={{ background: sg.color }}
                  >
                    {ICONS[type] || ICONS.checking}
                  </div>
                  <div className="product-suggestion-body">
                    <div className="product-suggestion-label">{sg.label}</div>
                    <div className="product-suggestion-desc">{sg.desc}</div>
                  </div>
                  <div className="product-suggestion-cta">AI에게 물어보기</div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
