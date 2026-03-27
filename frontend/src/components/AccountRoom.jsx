import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Message from './Message.jsx'
import { useVoiceInput } from '../hooks/useVoiceInput.js'

function MicIcon({ active }) {
  return active ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="9" y1="22" x2="15" y2="22"/>
    </svg>
  )
}

const ICONS = {
  // 입출금: 양방향 화살표 (돈의 흐름)
  checking: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5L3 10l5 5"/><line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M16 19l5-5-5-5"/><line x1="21" y1="14" x2="3" y2="14"/>
    </svg>
  ),
  // 정기적금: 동전 위에 위로 성장 화살표
  installment_savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="17" rx="7" ry="3"/>
      <path d="M5 17v-3M19 17v-3"/>
      <ellipse cx="12" cy="14" rx="7" ry="3"/>
      <path d="M12 11V5"/><path d="M9 8l3-3 3 3"/>
    </svg>
  ),
  // 정기예금: 자물쇠 (안전 보관)
  term_deposit: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      <circle cx="12" cy="16" r="1.5" fill="white"/>
    </svg>
  ),
  // 비상금: 우산 (보호)
  savings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 12a11.05 11.05 0 0 0-22 0z"/>
      <path d="M12 12v7a2 2 0 0 0 4 0"/>
    </svg>
  ),
  // CMA: 상승 막대그래프
  cma: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="20" x2="21" y2="20"/>
      <rect x="4" y="14" width="4" height="6" rx="1" fill="white" fillOpacity="0.3"/>
      <rect x="10" y="8" width="4" height="12" rx="1" fill="white" fillOpacity="0.3"/>
      <rect x="16" y="4" width="4" height="16" rx="1" fill="white" fillOpacity="0.3"/>
    </svg>
  ),
  // 체크카드: 카드 + IC칩
  debit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <rect x="6" y="9" width="4" height="4" rx="1"/>
      <line x1="2" y1="11" x2="6" y2="11"/>
      <line x1="14" y1="15" x2="19" y2="15"/>
      <line x1="12" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  // 신용카드: 카드 + 별 (리워드/혜택)
  credit_card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <path d="M15 15l.8 2 1.7-2.5-2.5.8.8-1.7-.8 1.7-2.5-.8 1.7 2.5.8-2z" fill="white" stroke="none"/>
    </svg>
  ),
}

// ── SavingsLifeCard: 예금/적금 만기 진행 시각화 ──
function SavingsLifeCard({ account }) {
  const isInstallment = account.type === 'installment_savings'
  const color = isInstallment ? '#10B981' : '#8B5CF6'
  const { progressRatio = 0, daysRemaining = 0, accruedInterest = 0,
          maturityDate, openDate, interestRate, balance } = account

  const R = 40
  const circumference = 2 * Math.PI * R
  const filled = circumference * progressRatio
  const pct = Math.round(progressRatio * 100)

  const fmt = (s) => s ? s.replace(/-/g, '.') : ''

  return (
    <div className="savings-life-card" style={{ '--slc': color }}>
      <div className="savings-life-egg-wrap">
        <div className="savings-life-glow" />
        <svg className="savings-life-svg" viewBox="0 0 100 100" width="96" height="96">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="5" />
          <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
          <text x="50" y="46" textAnchor="middle" fontSize="17" fontWeight="800"
            fill={color} fontFamily="inherit" style={{ letterSpacing: '-0.5px' }}>
            D-{daysRemaining}
          </text>
          <text x="50" y="60" textAnchor="middle" fontSize="9"
            fill="rgba(128,128,128,0.8)" fontFamily="inherit">
            만기까지
          </text>
        </svg>
      </div>
      <div className="savings-life-info">
        <div className="savings-life-type">{isInstallment ? '정기적금' : '정기예금'}</div>
        <div className="savings-life-row">
          <span className="savings-life-label">원금</span>
          <span className="savings-life-val">{balance.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="savings-life-row">
          <span className="savings-life-label">누적 이자</span>
          <span className="savings-life-interest">+{accruedInterest.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="savings-life-row">
          <span className="savings-life-label">금리</span>
          <span className="savings-life-val">연 {interestRate}%</span>
        </div>
        <div className="savings-life-progress">
          <div className="savings-life-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="savings-life-dates">
          <span>{fmt(openDate)}</span>
          <span className="savings-life-pct">{pct}%</span>
          <span>{fmt(maturityDate)}</span>
        </div>
      </div>
    </div>
  )
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

function TxSkeleton() {
  return (
    <div className="tx-skeleton" aria-hidden="true">
      <div className="skeleton-line" style={{ width: '60px', height: '11px', marginBottom: '4px' }} />
      <div className="skeleton-line" style={{ width: '100px', height: '14px' }} />
    </div>
  )
}

function getDateLabel(dateStr) {
  if (!dateStr) return ''
  const today = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((today.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

// 거래 내역에 날짜 구분선 삽입
function buildTxList(transactions) {
  const result = []
  let lastLabel = null
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
  for (const tx of sorted) {
    const label = getDateLabel(tx.date)
    if (label !== lastLabel) {
      result.push({ kind: 'date', label })
      lastLabel = label
    }
    result.push({ kind: 'tx', data: tx })
  }
  return result
}

export default function AccountRoom({
  account,
  transactions,
  messages,
  isLoading,
  isLoadingTxs,
  sessionId,
  voiceMode,
  onBack,
  onSendMessage,
  onTransferDone,
  onMarkRead,
  // 페이지네이션 (TODO-9에서 활성화)
  txMeta,
  onLoadMoreTxs,
}) {
  const [activeTab, setActiveTab] = useState('chat')
  const [input, setInput] = useState('')
  const [contactCardOpen, setContactCardOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedTxId, setExpandedTxId] = useState(null)

  const { isRecording, toggleRecording } = useVoiceInput(
    useCallback((text) => { setInput(text) }, [])
  )
  const chatContainerRef = useRef(null)
  const txContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const loadMoreRef = useRef(null)

  const cfg = TYPE_CONFIG[account?.type] || { color: '#6B7280', label: '' }

  // 방 입장 시 미읽 초기화
  useEffect(() => {
    onMarkRead?.()
  }, [account?.id])

  // 대화 탭: 새 메시지 시 스크롤
  useEffect(() => {
    if (activeTab !== 'chat') return
    const el = chatContainerRef.current
    if (el) {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < 150
      if (near) el.scrollTop = el.scrollHeight
    }
  }, [messages, activeTab])

  // iOS 키보드 대응 — visualViewport
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`)
      document.documentElement.style.setProperty('--vvtop', `${vv.offsetTop}px`)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  // 무한 스크롤 — IntersectionObserver (거래내역 탭)
  useEffect(() => {
    const sentinel = loadMoreRef.current
    if (!sentinel || !onLoadMoreTxs) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMoreTxs() },
      { threshold: 0.1 }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [onLoadMoreTxs, activeTab])

  const handleSend = () => {
    const msg = input.trim()
    if (!msg || isLoading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSendMessage(msg)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleCopyAccountNo = () => {
    if (!account?.accountNo) return
    navigator.clipboard.writeText(account.accountNo).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const txList = buildTxList(transactions || [])

  if (!account) return null

  return (
    <div className="account-room">
      {/* 헤더 */}
      <div className="room-header" onClick={() => setContactCardOpen(o => !o)}>
        <button
          className="room-back-btn"
          onClick={(e) => { e.stopPropagation(); onBack() }}
          aria-label="뒤로가기"
        >
          ‹
        </button>
        <div
          className="room-header-avatar"
          style={{ background: cfg.color }}
        >
          {ICONS[account?.type] || ICONS.checking}
        </div>
        <div className="room-header-info">
          <div className="room-header-name">{account.name}</div>
          <div className="room-header-sub">{account.bank} · {cfg.label}</div>
        </div>
        <div className="room-header-chevron">{contactCardOpen ? '▲' : '▼'}</div>
      </div>

      {/* 계좌 상세 ContactCard */}
      <div className={`contact-card ${contactCardOpen ? 'open' : ''}`}>
        <div className="contact-card-row">
          <span className="contact-card-label">
            {account.type === 'debit_card' ? '이번달 사용' : account.isPromo ? '상태' : '잔액'}
          </span>
          <span className="contact-card-value">{account.balanceFormatted}</span>
        </div>
        <div className="contact-card-row">
          <span className="contact-card-label">계좌번호</span>
          <span className="contact-card-value">{account.accountNo}</span>
          <button className="copy-btn" onClick={handleCopyAccountNo}>
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        {account.interestRate && (
          <div className="contact-card-row">
            <span className="contact-card-label">금리</span>
            <span className="contact-card-value">연 {account.interestRate}%</span>
          </div>
        )}
        {account.cardNo && (
          <div className="contact-card-row">
            <span className="contact-card-label">카드번호</span>
            <span className="contact-card-value">{account.cardNo}</span>
          </div>
        )}
        {account.maturityDate && (
          <div className="contact-card-row">
            <span className="contact-card-label">만기일</span>
            <span className="contact-card-value">{account.maturityDate}</span>
          </div>
        )}
        {account.openDate && (
          <div className="contact-card-row">
            <span className="contact-card-label">개설일</span>
            <span className="contact-card-value">{account.openDate}</span>
          </div>
        )}
      </div>

      {/* 탭 바 */}
      <div className="room-tab-bar" role="tablist" aria-label="계좌 탭">
        <button
          role="tab"
          aria-selected={activeTab === 'chat'}
          aria-controls="panel-chat"
          className={`room-tab${activeTab === 'chat' ? ' active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          대화
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'txlist'}
          aria-controls="panel-txlist"
          className={`room-tab${activeTab === 'txlist' ? ' active' : ''}`}
          onClick={() => setActiveTab('txlist')}
        >
          거래내역
        </button>
      </div>

      {/* 대화 탭 패널 */}
      <div
        id="panel-chat"
        role="tabpanel"
        className="room-timeline"
        ref={chatContainerRef}
        style={{ display: activeTab === 'chat' ? 'flex' : 'none' }}
      >
        {account?.isPromo && (
          <div className="promo-banner">
            <div className="promo-banner-badge">혜택 준비됨</div>
            <div className="promo-banner-title">당신을 기다리고 있어요</div>
            <div className="promo-banner-sub">캐시백, 할인, 포인트 — iM 신용카드의 혜택이 지금 당신을 기다립니다. 아래에서 AI에게 물어보세요.</div>
          </div>
        )}
        {(account?.type === 'installment_savings' || account?.type === 'term_deposit') && account.progressRatio !== undefined && (
          <SavingsLifeCard account={account} />
        )}
        {(messages || []).map((msg) => {
          if (msg.role === 'assistant') {
            return (
              <div key={msg.id} className="ai-bubble">
                <div className="ai-bubble-icon">
                  <img src="/imbank-mark.png" alt="iM" />
                </div>
                <div className="ai-bubble-body">
                  {msg.streaming && !msg.text ? (
                    <div className="typing-dots inline">
                      <span /><span /><span />
                    </div>
                  ) : (
                    <>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      {msg.streaming && <span className="cursor" />}
                    </>
                  )}
                </div>
              </div>
            )
          }

          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="message user">
                <div className="message-bubble">{msg.text}</div>
              </div>
            )
          }

          return (
            <div key={msg.id} className="room-card-wrapper">
              <Message
                msg={msg}
                sessionId={sessionId}
                voiceMode={voiceMode}
                onTransferDone={onTransferDone}
                onQuickAction={onSendMessage}
                onClearScope={() => {}}
                onGuiContextChange={() => {}}
              />
            </div>
          )
        })}

        {isLoading && (
          <div className="ai-bubble ai-bubble--typing">
            <div className="ai-bubble-icon">
              <img src="/imbank-mark.png" alt="iM" />
            </div>
            <div className="ai-bubble-body">
              <div className="typing-dots inline">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 거래내역 탭 패널 */}
      <div
        id="panel-txlist"
        role="tabpanel"
        className="room-timeline room-txlist"
        ref={txContainerRef}
        style={{ display: activeTab === 'txlist' ? 'flex' : 'none' }}
      >
        {account?.isPromo ? (
          <div className="txlist-promo">
            <div className="txlist-promo-card-visual">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
                <path d="M15 15l.8 2 1.7-2.5-2.5.8.8-1.7-.8 1.7-2.5-.8 1.7 2.5.8-2z" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div className="txlist-promo-headline">혜택을 가져가세요</div>
            <div className="txlist-promo-tagline">iM 신용카드와 함께라면</div>
            <div className="txlist-promo-benefits">
              <div className="txlist-promo-benefit">국내외 가맹점 최대 1.5% 캐시백</div>
              <div className="txlist-promo-benefit">스타벅스·편의점 10% 즉시 할인</div>
              <div className="txlist-promo-benefit">첫 해 연회비 면제</div>
            </div>
            <button
              className="txlist-promo-cta"
              onClick={() => { setActiveTab('chat'); onSendMessage('iM 신용카드 혜택과 발급 방법 알려줘') }}
            >
              지금 바로 혜택 확인하기
            </button>
          </div>
        ) : (account?.type === 'installment_savings' || account?.type === 'term_deposit') && account.progressRatio !== undefined ? (
          <>
            <SavingsLifeCard account={account} />
            {isLoadingTxs ? (
              <><TxSkeleton /><TxSkeleton /><TxSkeleton /></>
            ) : txList.length === 0 ? (
              <div className="txlist-empty">아직 거래 내역이 없습니다.</div>
            ) : (
              <>
                {txList.map((item, idx) => {
                  if (item.kind === 'date') {
                    return <div key={'date_' + idx} className="date-separator"><span>{item.label}</span></div>
                  }
                  const tx = item.data
                  const txId = tx.id || 'tx_' + idx
                  const isIncome = tx.amount > 0
                  const amountFmt = (isIncome ? '+' : '') + tx.amount.toLocaleString('ko-KR') + '원'
                  const isExpanded = expandedTxId === txId
                  return (
                    <div key={txId}
                      className={`tx-bubble tx-bubble--full ${isIncome ? 'tx-bubble--income' : 'tx-bubble--expense'}${isExpanded ? ' tx-bubble--expanded' : ''}`}
                      onClick={() => setExpandedTxId((prev) => prev === txId ? null : txId)}
                      role="button" tabIndex={0} aria-expanded={isExpanded}
                    >
                      <div className="tx-bubble-main">
                        <div className="tx-bubble-counterpart">{tx.counterpart}</div>
                        <div className="tx-bubble-amount">{amountFmt}</div>
                      </div>
                      {isExpanded && (
                        <div className="tx-bubble-detail">
                          <div className="tx-detail-row"><span className="tx-detail-label">날짜</span><span className="tx-detail-value">{tx.date}</span></div>
                          {tx.memo && <div className="tx-detail-row"><span className="tx-detail-label">메모</span><span className="tx-detail-value">{tx.memo}</span></div>}
                          <div className="tx-detail-row"><span className="tx-detail-label">거래 유형</span><span className="tx-detail-value">{isIncome ? '입금' : '출금'}</span></div>
                        </div>
                      )}
                      {!isExpanded && tx.memo && <div className="tx-bubble-memo">{tx.memo}</div>}
                    </div>
                  )
                })}
                {hasMore && <div ref={loaderRef} style={{ height: 40 }} />}
              </>
            )}
          </>
        ) : isLoadingTxs ? (
          <>
            <TxSkeleton />
            <TxSkeleton />
            <TxSkeleton />
          </>
        ) : txList.length === 0 ? (
          <div className="txlist-empty">아직 거래 내역이 없습니다.</div>
        ) : (
          <>
            {txList.map((item, idx) => {
              if (item.kind === 'date') {
                return (
                  <div key={'date_' + idx} className="date-separator">
                    <span>{item.label}</span>
                  </div>
                )
              }
              const tx = item.data
              const txId = tx.id || 'tx_' + idx
              const isIncome = tx.amount > 0
              const amountFmt = (isIncome ? '+' : '') + tx.amount.toLocaleString('ko-KR') + '원'
              const isExpanded = expandedTxId === txId
              return (
                <div
                  key={txId}
                  className={`tx-bubble tx-bubble--full ${isIncome ? 'tx-bubble--income' : 'tx-bubble--expense'}${isExpanded ? ' tx-bubble--expanded' : ''}`}
                  onClick={() => setExpandedTxId((prev) => prev === txId ? null : txId)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                >
                  <div className="tx-bubble-main">
                    <div className="tx-bubble-counterpart">{tx.counterpart}</div>
                    <div className="tx-bubble-amount">{amountFmt}</div>
                  </div>
                  {isExpanded && (
                    <div className="tx-bubble-detail">
                      <div className="tx-detail-row">
                        <span className="tx-detail-label">날짜</span>
                        <span className="tx-detail-value">{tx.date}</span>
                      </div>
                      {tx.memo && (
                        <div className="tx-detail-row">
                          <span className="tx-detail-label">메모</span>
                          <span className="tx-detail-value">{tx.memo}</span>
                        </div>
                      )}
                      <div className="tx-detail-row">
                        <span className="tx-detail-label">거래 유형</span>
                        <span className="tx-detail-value">{isIncome ? '입금' : '출금'}</span>
                      </div>
                    </div>
                  )}
                  {!isExpanded && tx.memo && (
                    <div className="tx-bubble-memo">{tx.memo}</div>
                  )}
                </div>
              )
            })}

            {/* 무한 스크롤 센티넬 */}
            {txMeta?.hasMore && (
              <div ref={loadMoreRef} className="tx-load-sentinel">
                {txMeta.isLoadingMore && (
                  <>
                    <TxSkeleton />
                    <TxSkeleton />
                  </>
                )}
              </div>
            )}
            {!txMeta?.hasMore && transactions?.length > 0 && (
              <div className="txlist-end">모든 거래 내역을 확인했습니다</div>
            )}
          </>
        )}
      </div>

      {/* 채팅 입력창 (대화 탭에서만 표시) */}
      {activeTab === 'chat' && (
        <div className="room-input-bar">
          <button
            className={`room-mic-btn${isRecording ? ' recording' : ''}`}
            onClick={toggleRecording}
            type="button"
            aria-label={isRecording ? '녹음 중지' : '음성 입력'}
          >
            <MicIcon active={isRecording} />
          </button>
          <textarea
            ref={textareaRef}
            className="room-input"
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? '듣고 있어요…' : `${account.name}에 대해 물어보세요`}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="room-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="전송"
          >
            ↑
          </button>
        </div>
      )}
    </div>
  )
}
