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
  // 입출금: 위아래 화살표 (입금↑ 출금↓)
  checking: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v7M9 7l3-4 3 4"/>
      <path d="M12 21v-7M9 17l3 4 3-4"/>
      <line x1="5" y1="12" x2="19" y2="12" strokeOpacity="0.4"/>
    </svg>
  ),
  // 정기적금: 달력 (월납입 스케줄)
  installment_savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M12 14v4M10 16l2-2 2 2"/>
    </svg>
  ),
  // 정기예금: 자물쇠 (만기까지 잠금)
  term_deposit: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      <circle cx="12" cy="16" r="1.5" fill="white"/>
    </svg>
  ),
  // 비상금: 방패 + 체크 (긴급 자금 보호)
  savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  // CMA: 우상향 꺾은선 (수익 성장)
  cma: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 8.5 11 13 14.5 20 7"/>
      <polyline points="15 7 20 7 20 12"/>
    </svg>
  ),
  // 체크카드: 카드 + EMV 칩
  debit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <rect x="6" y="9" width="4" height="4" rx="1" fill="white" fillOpacity="0.35"/>
      <line x1="14" y1="13" x2="19" y2="13"/>
      <line x1="14" y1="16" x2="17" y2="16"/>
    </svg>
  ),
  // 신용카드: 카드 + 컨택리스 웨이브
  credit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <path d="M13.5 15.5c.8-.8.8-2.2 0-3" strokeWidth="1.8"/>
      <path d="M16 13c1.5-1.5 1.5-4 0-5.5" strokeWidth="1.8" strokeOpacity="0.55"/>
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

function computeProductHints(accounts) {
  const ownedTypes = new Set(accounts.filter((a) => !a.isPromo).map((a) => a.type))
  const hints = []

  // CMA: 입출금 잔액 1,000,000원 이상이고 CMA 미보유
  if (!ownedTypes.has('cma')) {
    const checking = accounts.find((a) => a.type === 'checking' && !a.isPromo)
    const promoAcc = accounts.find((a) => a.type === 'cma' && a.isPromo)
    if (checking && promoAcc && checking.balance >= 1000000) {
      const dailyInterest = Math.round(checking.balance * 0.0475 / 365)
      hints.push({
        productType: 'cma',
        promoAccountId: promoAcc.id,
        hint: `주계좌에 ${checking.balance.toLocaleString('ko-KR')}원이 쉬고 있어요. CMA에 두면 오늘부터 +${dailyInterest.toLocaleString('ko-KR')}원/일.`,
        accentColor: '#EF4444',
        score: checking.balance,
      })
    }
  }

  // 정기예금: 적금 만기 180일 이하이고 예금 미보유
  if (!ownedTypes.has('term_deposit')) {
    const installment = accounts.find((a) => a.type === 'installment_savings' && !a.isPromo)
    const promoAcc = accounts.find((a) => a.type === 'term_deposit' && a.isPromo)
    if (installment && promoAcc && installment.maturityDate) {
      const daysToMaturity = Math.ceil((new Date(installment.maturityDate) - new Date()) / 86400000)
      if (daysToMaturity > 0 && daysToMaturity <= 180) {
        const projected = installment.balance + (installment.monthlyDeposit || 0) * Math.ceil(daysToMaturity / 30)
        const annualInterest = Math.round(projected * 0.042)
        hints.push({
          productType: 'term_deposit',
          promoAccountId: promoAcc.id,
          hint: `적금 만기 ${daysToMaturity}일 후 수령 예정 ${projected.toLocaleString('ko-KR')}원. 정기예금 넣으면 연 +${annualInterest.toLocaleString('ko-KR')}원.`,
          accentColor: '#8B5CF6',
          score: projected,
        })
      }
    }
  }

  // 비상금: savings 미보유 (무조건, 단 입출금 계좌 보유 전제)
  if (!ownedTypes.has('savings') && ownedTypes.has('checking')) {
    const promoAcc = accounts.find((a) => a.type === 'savings' && a.isPromo)
    if (promoAcc) {
      hints.push({
        productType: 'savings',
        promoAccountId: promoAcc.id,
        hint: '비상금 전용 통장이 없어요. 3개월치 생활비를 따로 모아두면 든든합니다.',
        accentColor: '#F59E0B',
        score: 500000,
      })
    }
  }

  // 콜드스타트 방지: 스코어 높은 것 1개만 반환
  return hints.sort((a, b) => b.score - a.score).slice(0, 1)
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

  // 콜드스타트 가드: 저축·투자 계좌 1개 이상 보유 시에만 프로모 방 표시
  const SAVINGS_TYPES = new Set(['installment_savings', 'term_deposit', 'savings', 'cma'])
  const ownedSavingsCount = accounts.filter((a) => !a.isPromo && SAVINGS_TYPES.has(a.type)).length
  const showPromoRooms = ownedSavingsCount >= 1

  const productHints = computeProductHints(accounts)

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
                // showPromoRooms가 false이면 프로모 계좌는 목록에서 숨김 (콜드스타트)
                if (acc.isPromo && !showPromoRooms) return

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

                // 저축·투자 섹션 마지막 비-프로모 계좌 뒤에 힌트 카드 삽입
                const isLastOwnedSavings =
                  section === 'savings' &&
                  !acc.isPromo &&
                  (() => {
                    const remaining = accounts.slice(idx + 1)
                    return !remaining.some((a) => !a.isPromo && SAVINGS_TYPES.has(a.type))
                  })()

                if (isLastOwnedSavings && productHints.length > 0) {
                  const hint = productHints[0]
                  items.push(
                    <button
                      key="product-hint"
                      className="product-hint-card"
                      style={{ borderColor: hint.accentColor + '26', backgroundColor: hint.accentColor + '0D' }}
                      onClick={() => onEnterRoom(hint.promoAccountId)}
                    >
                      <span className="product-hint-dot" style={{ background: hint.accentColor, boxShadow: `0 0 5px ${hint.accentColor}` }} />
                      <span className="product-hint-text">{hint.hint}</span>
                      <span className="product-hint-arrow" style={{ color: hint.accentColor }}>›</span>
                    </button>
                  )
                }
              })
              return items
            })()}

      </div>
    </div>
  )
}
