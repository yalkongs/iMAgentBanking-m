import { useState, useRef, useEffect } from 'react'

const BLOCK_COLORS = {
  checking:            ['#3B82F6', '#1D4ED8'],
  installment_savings: ['#10B981', '#059669'],
  term_deposit:        ['#8B5CF6', '#6D28D9'],
  savings:             ['#F59E0B', '#D97706'],
  cma:                 ['#EF4444', '#B91C1C'],
  debit_card:          ['#0EA5E9', '#0369A1'],
  credit_card:         ['rgba(107,114,128,0.35)', 'rgba(107,114,128,0.2)'],
}

const ICONS = {
  checking: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5L3 10l5 5"/><line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M16 19l5-5-5-5"/><line x1="21" y1="14" x2="3" y2="14"/>
    </svg>
  ),
  installment_savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="17" rx="7" ry="3"/>
      <path d="M5 17v-3M19 17v-3"/>
      <ellipse cx="12" cy="14" rx="7" ry="3"/>
      <path d="M12 11V5"/><path d="M9 8l3-3 3 3"/>
    </svg>
  ),
  term_deposit: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      <circle cx="12" cy="16" r="1.5" fill="white"/>
    </svg>
  ),
  savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 12a11.05 11.05 0 0 0-22 0z"/>
      <path d="M12 12v7a2 2 0 0 0 4 0"/>
    </svg>
  ),
  cma: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="20" x2="21" y2="20"/>
      <rect x="4" y="14" width="4" height="6" rx="1" fill="white" fillOpacity="0.3"/>
      <rect x="10" y="8" width="4" height="12" rx="1" fill="white" fillOpacity="0.3"/>
      <rect x="16" y="4" width="4" height="16" rx="1" fill="white" fillOpacity="0.3"/>
    </svg>
  ),
  debit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <rect x="6" y="9" width="4" height="4" rx="1"/>
      <line x1="2" y1="11" x2="6" y2="11"/>
      <line x1="14" y1="15" x2="19" y2="15"/>
    </svg>
  ),
  credit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <path d="M15 15l.8 2 1.7-2.5-2.5.8.8-1.7-.8 1.7-2.5-.8 1.7 2.5.8-2z" fill="white" stroke="none"/>
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
    const DURATION = 2200

    const tick = (now) => {
      const t = Math.min((now - start) / DURATION, 1)
      const eased = 1 - Math.pow(1 - t, 4)
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
          : (() => {
              const BANKING_TYPES = new Set(['checking', 'debit_card', 'credit_card'])
              const items = []
              let lastSection = null

              accounts.forEach((acc, idx) => {
                const section = BANKING_TYPES.has(acc.type) ? 'banking' : 'savings'
                if (section !== lastSection) {
                  lastSection = section
                  items.push(
                    <div key={`section-${section}`} className="account-section-label">
                      {section === 'banking' ? '입출금 · 카드' : '저축 · 투자'}
                    </div>
                  )
                }
                const cfg = TYPE_CONFIG[acc.type] || { color: '#6B7280', label: acc.type }
                const unread = unreadCounts?.[acc.id] || 0
                const last = acc.lastTransaction
                const isPromo = acc.isPromo === true

                items.push(
                  <button
                    key={acc.id}
                    className={`account-list-item${isPromo ? ' account-list-item--promo' : ''}`}
                    onClick={() => onEnterRoom(acc.id)}
                  >
                    <div
                      className="account-list-item-block"
                      style={{
                        background: isPromo
                          ? 'rgba(107,114,128,0.25)'
                          : `linear-gradient(180deg, ${(BLOCK_COLORS[acc.type] || BLOCK_COLORS.checking)[0]} 0%, ${(BLOCK_COLORS[acc.type] || BLOCK_COLORS.checking)[1]} 100%)`,
                      }}
                    >
                      {ICONS[acc.type] || ICONS.checking}
                    </div>

                    <div className="account-list-item-body">
                      <div className="account-list-item-top">
                        <span className="account-list-name">{acc.name}</span>
                        <span className="account-list-balance">
                          {acc.isPromo ? (
                            <span className="balance-promo-badge">발급 가능</span>
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
                            ? '혜택을 가져가세요 →'
                            : last
                            ? `${last.counterpart} ${last.amountFormatted}`
                            : cfg.label}
                        </span>
                        <span className="account-list-time">
                          {last ? formatDateShort(last.date) : ''}
                        </span>
                      </div>
                    </div>

                    <div className="unread-badge-slot">
                      {unread > 0 && <div className="unread-badge">{unread}</div>}
                    </div>
                  </button>
                )
              })
              return items
            })()}

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
