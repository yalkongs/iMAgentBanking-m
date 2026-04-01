import { useState, useRef, useEffect } from 'react'

const BANKING_TYPES_SET = new Set(['checking', 'debit_card', 'credit_card', 'partner_promo'])

function getAccountSection(acc) {
  return BANKING_TYPES_SET.has(acc.type) ? 'banking' : 'savings'
}

const BLOCK_COLORS = {
  checking:            ['#3B82F6', '#1D4ED8'],
  installment_savings: ['#10B981', '#059669'],
  term_deposit:        ['#8B5CF6', '#6D28D9'],
  savings:             ['#F59E0B', '#D97706'],
  cma:                 ['#EF4444', '#B91C1C'],
  debit_card:          ['#0EA5E9', '#0369A1'],
  credit_card:         ['rgba(107,114,128,0.35)', 'rgba(107,114,128,0.2)'],
  partner_promo:       ['#1a1c3a', '#0f1124'],
}

const ICONS = {
  // 입출금: 좌우 교환 화살표 (이체의 양방향성)
  checking: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h13M14 6l3 3-3 3"/>
      <path d="M20 15H7M10 18l-3-3 3-3" strokeOpacity="0.65"/>
    </svg>
  ),
  // 정기적금: 계단형 막대 (월납입 성장)
  installment_savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="15" width="5" height="6" rx="1" fill="white" fillOpacity="0.38"/>
      <rect x="9.5" y="10" width="5" height="11" rx="1" fill="white" fillOpacity="0.65"/>
      <rect x="16" y="5" width="5" height="16" rx="1" fill="white" fillOpacity="0.92"/>
      <line x1="2" y1="21.5" x2="22" y2="21.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35"/>
    </svg>
  ),
  // 정기예금: 자물쇠 + 열쇠구멍 (만기 잠금)
  term_deposit: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2.5"/>
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>
      <circle cx="12" cy="16" r="1.5" fill="white"/>
      <line x1="12" y1="17.5" x2="12" y2="19.5" strokeWidth="2"/>
    </svg>
  ),
  // 비상금: 우산 (긴급 시 보호)
  savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 18 0" fill="white" fillOpacity="0.12" stroke="none"/>
      <path d="M3 12a9 9 0 0 1 18 0"/>
      <line x1="12" y1="12" x2="12" y2="19"/>
      <path d="M9 19a3 3 0 0 0 6 0" strokeOpacity="0.7"/>
    </svg>
  ),
  // CMA: 면적 그래프 + 상단 강조점 (일별 이자 성장)
  cma: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17L7 12L11 14.5L16 9L21 5"/>
      <path d="M3 17L7 12L11 14.5L16 9L21 5L21 20L3 20Z" fill="white" fillOpacity="0.12" stroke="none"/>
      <line x1="3" y1="20" x2="21" y2="20" strokeOpacity="0.35"/>
      <circle cx="21" cy="5" r="2" fill="white" stroke="none"/>
    </svg>
  ),
  // 체크카드: 카드 + EMV칩 + 서명줄
  debit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="13" rx="2"/>
      <line x1="2" y1="11" x2="22" y2="11"/>
      <rect x="5" y="14" width="3.5" height="2.5" rx="0.5" fill="white" fillOpacity="0.4" stroke="none"/>
      <line x1="12" y1="14.5" x2="18" y2="14.5" strokeOpacity="0.6" strokeWidth="1.5"/>
      <line x1="12" y1="17" x2="16" y2="17" strokeOpacity="0.4" strokeWidth="1.5"/>
    </svg>
  ),
  // 신용카드: 카드 + 4각 별빛 (프리미엄 미발급)
  credit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="13" rx="2"/>
      <line x1="2" y1="11" x2="22" y2="11"/>
      <line x1="6" y1="15.5" x2="10" y2="15.5" strokeOpacity="0.5" strokeWidth="1.5"/>
      <line x1="6" y1="18" x2="9" y2="18" strokeOpacity="0.35" strokeWidth="1.5"/>
      <path d="M17 13.5L17.6 14.9 19 15.5 17.6 16.1 17 17.5 16.4 16.1 15 15.5 16.4 14.9Z" fill="white" fillOpacity="0.85" stroke="none"/>
    </svg>
  ),
  // 제휴 프로모: 카드 + 링크 연결
  partner_promo: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="13" rx="2"/>
      <line x1="2" y1="11" x2="22" y2="11"/>
      <path d="M10 15.5C10 14.4 10.9 13.5 12 13.5C13.1 13.5 14 14.4 14 15.5C14 16.6 13.1 17.5 12 17.5C10.9 17.5 10 16.6 10 15.5Z" fill="white" fillOpacity="0.7" stroke="none"/>
      <path d="M15.5 13.5L17.5 11.5" strokeOpacity="0.5" strokeWidth="1.5"/>
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
  partner_promo:       { color: '#00C9A7', label: '제휴 카드' },
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
  typingAccountIds,
  isLoading,
  ttsEnabled,
  onEnterRoom,
  onTtsToggle,
  onReset,
  onShowOnboarding,
  onProductSuggest,
  onReorder,
  onLogoTap,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sortMode, setSortMode] = useState(false)

  const longPressTimerRef = useRef(null)
  const longPressCancelledRef = useRef(false)

  // Long-press 500ms → sort mode
  function handleLongPressStart(e, accId, isPromo) {
    if (sortMode || isPromo) return
    longPressCancelledRef.current = false
    const touch = e.touches ? e.touches[0] : e
    const startY = touch.clientY

    longPressTimerRef.current = setTimeout(() => {
      if (!longPressCancelledRef.current) {
        e.preventDefault?.()
        setSortMode(true)
        if (navigator.vibrate) navigator.vibrate(40)
      }
    }, 500)

    function cancelOnMove(me) {
      const t = me.touches ? me.touches[0] : me
      if (Math.abs(t.clientY - startY) > 8) {
        longPressCancelledRef.current = true
        clearTimeout(longPressTimerRef.current)
        document.removeEventListener('touchmove', cancelOnMove)
        document.removeEventListener('mousemove', cancelOnMove)
      }
    }
    document.addEventListener('touchmove', cancelOnMove, { passive: true })
    document.addEventListener('mousemove', cancelOnMove)
  }

  function handleLongPressEnd() {
    clearTimeout(longPressTimerRef.current)
  }

  // ↑↓ 버튼으로 섹션 내에서 이동
  function handleMoveItem(accId, direction) {
    const acc = accounts.find((a) => a.id === accId)
    if (!acc) return
    const section = getAccountSection(acc)
    const sectionItems = accounts.filter((a) => !a.isPromo && getAccountSection(a) === section)
    const idx = sectionItems.findIndex((a) => a.id === accId)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= sectionItems.length) return

    const newSection = [...sectionItems]
    ;[newSection[idx], newSection[newIdx]] = [newSection[newIdx], newSection[idx]]

    let secIdx = 0
    const newOrder = accounts.map((a) => {
      if (!a.isPromo && getAccountSection(a) === section) return newSection[secIdx++]
      return a
    })
    onReorder?.(newOrder)
  }

  const SAVINGS_TYPES = new Set(['installment_savings', 'term_deposit', 'savings', 'cma'])
  const ownedSavingsCount = accounts.filter((a) => !a.isPromo && SAVINGS_TYPES.has(a.type)).length
  const showPromoRooms = ownedSavingsCount >= 1
  const productHints = computeProductHints(accounts)

  return (
    <div
      className="account-list-screen"
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      <div className="account-list-header">
        <button
          className="account-list-title-btn"
          onClick={() => { onLogoTap?.(); onShowOnboarding?.() }}
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
          <div
            className={`account-list-dropdown${menuOpen ? ' account-list-dropdown--visible' : ''}`}
            aria-hidden={!menuOpen}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="dropdown-item" onClick={() => { onTtsToggle?.(); setMenuOpen(false) }}>
              {ttsEnabled ? '음성 끄기' : '음성 켜기'}
            </button>
            <button className="dropdown-item" onClick={() => { onReset?.(); setMenuOpen(false) }}>
              초기화
            </button>
          </div>
        </div>
      </div>

      <div className={`account-sort-mode-bar${sortMode ? ' account-sort-mode-bar--visible' : ''}`} aria-hidden={!sortMode}>
        <span>↑↓ 버튼으로 순서를 바꿔요</span>
        <button className="account-sort-done-btn" onClick={() => setSortMode(false)}>
          완료
        </button>
      </div>

      <div className={`account-list-items${sortMode ? ' account-sort-mode' : ''}`}>
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => <SkeletonItem key={i} />)
          : accounts.length === 0
          ? (
            <div className="account-list-empty">
              <p>연결된 계좌가 없어요.</p>
            </div>
          )
          : (() => {
              const items = []
              let lastSection = null
              let animIdx = 0

              accounts.forEach((acc, idx) => {
                if (acc.isPromo && !showPromoRooms) return

                const section = BANKING_TYPES_SET.has(acc.type) ? 'banking' : 'savings'
                if (section !== lastSection) {
                  lastSection = section
                  const sIdx = animIdx++
                  items.push(
                    <div key={`section-${section}`} className="account-section-label list-item-animated" style={{ animationDelay: `${sIdx * 60}ms` }}>
                      {section === 'banking' ? '입출금 · 카드' : '저축 · 투자'}
                    </div>
                  )
                }

                const cfg = TYPE_CONFIG[acc.type] || { color: '#6B7280', label: acc.type }
                const unread = unreadCounts?.[acc.id] || 0
                const last = acc.lastTransaction
                const isPromo = acc.isPromo === true
                const isPartnerPromo = acc.type === 'partner_promo'
                const canSort = sortMode && !isPromo && !isPartnerPromo
                const isTyping = !!(typingAccountIds?.has(acc.id))

                // 섹션 내 위치 계산 (↑↓ 버튼 disabled 조건)
                const sectionItems = canSort
                  ? accounts.filter((a) => !a.isPromo && getAccountSection(a) === section)
                  : []
                const sectionIdx = canSort ? sectionItems.findIndex((a) => a.id === acc.id) : -1
                const isFirst = sectionIdx === 0
                const isLast = sectionIdx === sectionItems.length - 1

                const bIdx = animIdx++
                items.push(
                  <button
                    key={acc.id}
                    className={[
                      'account-list-item',
                      isPromo ? 'account-list-item--promo' : '',
                      isPartnerPromo ? 'account-list-item--partner-promo' : '',
                      ['installment_savings', 'term_deposit', 'cma', 'savings'].includes(acc.type) && !acc.isPromo
                        ? `account-item-glow--${acc.type}` : '',
                      isPartnerPromo ? '' : 'list-item-animated',
                      canSort ? 'account-list-item--sorting' : '',
                      isTyping ? 'account-list-item--typing' : '',
                    ].filter(Boolean).join(' ')}
                    style={isPartnerPromo ? undefined : { animationDelay: `${bIdx * 60}ms` }}
                    onClick={() => { if (!sortMode) onEnterRoom(acc.id) }}
                    onTouchStart={(e) => handleLongPressStart(e, acc.id, isPromo)}
                    onTouchEnd={handleLongPressEnd}
                    onMouseDown={(e) => handleLongPressStart(e, acc.id, isPromo)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                  >
                    <div
                      className={`account-list-item-block${['installment_savings', 'term_deposit', 'cma', 'savings'].includes(acc.type) && !acc.isPromo ? ' account-block-breathing' : ''}`}
                      style={{
                        background: isPartnerPromo
                          ? 'linear-gradient(135deg, #1e2148 0%, #12142e 100%)'
                          : isPromo
                          ? 'rgba(107,114,128,0.25)'
                          : `linear-gradient(180deg, ${(BLOCK_COLORS[acc.type] || BLOCK_COLORS.checking)[0]} 0%, ${(BLOCK_COLORS[acc.type] || BLOCK_COLORS.checking)[1]} 100%)`,
                      }}
                    >
                      {ICONS[acc.type] || ICONS.checking}
                    </div>

                    <div className="account-list-item-body">
                      <div className="account-list-item-top">
                        <span className="account-list-name">
                          {acc.name}
                          {['installment_savings', 'term_deposit', 'cma', 'savings'].includes(acc.type) && !acc.isPromo && (
                            <span className="account-pulse-dot" aria-label="이자 발생 중" />
                          )}
                          {acc.applicationStatus === 'pending' && (
                            <span className="account-pending-lamp" aria-label="심사 진행 중" />
                          )}
                        </span>
                        <span className="account-list-balance">
                          {acc.isPromo ? null : acc.applicationStatus === 'pending' ? null : acc.type === 'debit_card' ? (
                            <BalanceDisplay value={acc.balance} animate={true} prefix="이번달 " suffix="원 사용" />
                          ) : (
                            <BalanceDisplay value={acc.balance} animate={true} />
                          )}
                        </span>
                      </div>
                      <div className="account-list-item-bottom">
                        <span className="account-list-preview">
                          {isTyping ? (
                            <span className="typing-dots inline" aria-label="AI 응답 중">
                              <span /><span /><span />
                            </span>
                          ) : isPartnerPromo && acc.applicationStatus === 'pending'
                            ? '심사 중 · 영업일 3~5일 소요'
                            : isPartnerPromo
                            ? (acc.promoHook || 'iM뱅크 × 현대카드 제휴 혜택')
                            : isPromo
                            ? (acc.promoHook || cfg.label)
                            : acc.applicationStatus === 'pending'
                            ? '심사 중 · 영업일 3~5일 소요'
                            : last
                            ? `${last.counterpart} ${last.amountFormatted}`
                            : cfg.label}
                        </span>
                        <span className="account-list-time">
                          {isTyping ? '방금' : last ? formatDateShort(last.date) : ''}
                        </span>
                      </div>
                    </div>

                    {canSort ? (
                      <div className="account-sort-arrows">
                        <button
                          className="account-sort-arrow-btn"
                          disabled={isFirst}
                          onClick={(e) => { e.stopPropagation(); handleMoveItem(acc.id, 'up') }}
                          aria-label="위로 이동"
                        >
                          ↑
                        </button>
                        <button
                          className="account-sort-arrow-btn"
                          disabled={isLast}
                          onClick={(e) => { e.stopPropagation(); handleMoveItem(acc.id, 'down') }}
                          aria-label="아래로 이동"
                        >
                          ↓
                        </button>
                      </div>
                    ) : (
                      <div className="unread-badge-slot">
                        {isPartnerPromo && acc.applicationStatus === 'pending'
                          ? <div className="partner-pending-badge">발급 대기</div>
                          : unread > 0
                            ? <div className="unread-badge">{unread}</div>
                            : null
                        }
                      </div>
                    )}
                  </button>
                )

                const isLastOwnedSavings =
                  section === 'savings' &&
                  !acc.isPromo &&
                  (() => {
                    const remaining = accounts.slice(idx + 1)
                    return !remaining.some((a) => !a.isPromo && SAVINGS_TYPES.has(a.type))
                  })()

                if (isLastOwnedSavings && productHints.length > 0) {
                  const hint = productHints[0]
                  const hIdx = animIdx++
                  items.push(
                    <button
                      key="product-hint"
                      className="product-hint-card list-item-animated"
                      style={{ borderColor: hint.accentColor + '26', backgroundColor: hint.accentColor + '0D', animationDelay: `${hIdx * 60}ms` }}
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
