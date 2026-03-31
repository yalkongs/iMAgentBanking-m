import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Message from './Message.jsx'
import { useVoiceInput } from '../hooks/useVoiceInput.js'
import QuickTransferPanel from './QuickTransferPanel.jsx'

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

// ── 공통: 링 SVG ──
function LifeRing({ ratio, color, children }) {
  const R = 38
  const C = 2 * Math.PI * R
  return (
    <div className="life-ring-wrap">
      <div className="life-ring-glow" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
      <svg className="life-ring-svg" viewBox="0 0 100 100" width="90" height="90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(128,128,128,0.13)" strokeWidth="6" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${C * ratio} ${C}`} strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{
            transition: 'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)',
            filter: `drop-shadow(0 0 6px ${color}99)`,
          }}
        />
        {children}
      </svg>
    </div>
  )
}

// ── 공통: 성장 바 ──
function GrowthBar({ label, current, total, color, isMoney = true, accent = false }) {
  const pct = total > 0 ? Math.min(100, Math.round(current / total * 100)) : 0
  const fmt = (v) => isMoney ? v.toLocaleString('ko-KR') + '원' : v
  return (
    <div className="slc-growth-block">
      <div className="slc-growth-header">
        <span className="slc-growth-label">{label}</span>
        <span className={`slc-growth-right${accent ? ' accent' : ''}`}>
          {accent ? '+' : ''}{fmt(current)}
          <span className="slc-growth-total"> / {accent ? '+' : ''}{fmt(total)}</span>
        </span>
      </div>
      <div className="slc-growth-bar">
        <div className="slc-growth-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ── 정기적금: 납입 횟수 중심 ──
function InstallmentLifeCard({ account }) {
  const color = '#10B981'
  const {
    paymentsMade = 0, totalPayments = 1, paymentsRemaining = 0,
    balance = 0, principalAtMaturity = 0,
    accruedInterest = 0, expectedInterest = 0,
    maturityDate, interestRate,
  } = account

  const payRatio = paymentsMade / totalPayments
  const fmt = (s) => s ? s.replace(/-/g, '.') : ''

  return (
    <div className="slc-card" style={{ '--slcc': color }}>
      <div className="slc-top">
        <div className="slc-tag">정기적금 · 연 {interestRate}%</div>
        <div className="slc-maturity-label">만기 {fmt(maturityDate)}</div>
      </div>
      <div className="slc-body">
        <LifeRing ratio={payRatio} color={color}>
          <text x="50" y="43" textAnchor="middle" fontSize="20" fontWeight="900"
            fill={color} fontFamily="inherit">{paymentsMade}</text>
          <text x="50" y="56" textAnchor="middle" fontSize="9"
            fill="rgba(128,128,128,0.9)" fontFamily="inherit">/ {totalPayments}회</text>
          <text x="50" y="68" textAnchor="middle" fontSize="8"
            fill="rgba(128,128,128,0.7)" fontFamily="inherit">납입 완료</text>
        </LifeRing>
        <div className="slc-stats">
          <div className="slc-stat-badge" style={{ color }}>
            <span className="slc-badge-num">{paymentsRemaining}</span>
            <span className="slc-badge-unit">회 남음</span>
          </div>
          <div className="slc-divider" />
          <GrowthBar
            label="납입 원금"
            current={balance}
            total={principalAtMaturity}
            color={color}
          />
          <GrowthBar
            label="이자 성장"
            current={accruedInterest}
            total={expectedInterest}
            color={color}
            accent
          />
          <div className="slc-final-row">
            <span className="slc-final-label">만기 수령 예상</span>
            <span className="slc-final-val">{(principalAtMaturity + expectedInterest).toLocaleString('ko-KR')}원</span>
          </div>
          {account.earlyWithdrawalLoss > 0 && (
            <div className="slc-early-row">
              <span className="slc-early-label">지금 해지하면</span>
              <span className="slc-early-loss">-{account.earlyWithdrawalLoss.toLocaleString('ko-KR')}원 손실</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 정기예금: 시간 경과 + 이자 성장 ──
function TermDepositLifeCard({ account }) {
  const color = '#8B5CF6'
  const {
    progressRatio = 0, daysRemaining = 0,
    balance = 0, accruedInterest = 0, expectedInterest = 0, finalAmount = 0,
    maturityDate, openDate, interestRate,
  } = account

  const fmt = (s) => s ? s.replace(/-/g, '.') : ''
  const growthPct = ((accruedInterest / balance) * 100).toFixed(2)

  return (
    <div className="slc-card" style={{ '--slcc': color }}>
      <div className="slc-top">
        <div className="slc-tag">정기예금 · 연 {interestRate}%</div>
        <div className="slc-maturity-label">만기 {fmt(maturityDate)}</div>
      </div>
      <div className="slc-body">
        <LifeRing ratio={progressRatio} color={color}>
          <text x="50" y="44" textAnchor="middle" fontSize="14" fontWeight="900"
            fill={color} fontFamily="inherit">D-{daysRemaining}</text>
          <text x="50" y="58" textAnchor="middle" fontSize="8.5"
            fill="rgba(128,128,128,0.85)" fontFamily="inherit">만기까지</text>
        </LifeRing>
        <div className="slc-stats">
          <div className="slc-stat-badge" style={{ color }}>
            <span className="slc-badge-num">{Math.round(progressRatio * 100)}</span>
            <span className="slc-badge-unit">% 경과</span>
          </div>
          <div className="slc-divider" />
          <div className="slc-row">
            <span className="slc-row-label">원금</span>
            <span className="slc-row-val">{balance.toLocaleString('ko-KR')}원</span>
          </div>
          <GrowthBar
            label="이자 성장"
            current={accruedInterest}
            total={expectedInterest}
            color={color}
            accent
          />
          <div className="slc-growth-subrow">
            <span>현재 수익률 {growthPct}%</span>
            <span>→ 만기 {interestRate}%</span>
          </div>
          <div className="slc-final-row">
            <span className="slc-final-label">만기 수령 예상</span>
            <span className="slc-final-val">{finalAmount.toLocaleString('ko-KR')}원</span>
          </div>
          {account.earlyWithdrawalLoss > 0 && (
            <div className="slc-early-row">
              <span className="slc-early-label">지금 해지하면</span>
              <span className="slc-early-loss">-{account.earlyWithdrawalLoss.toLocaleString('ko-KR')}원 손실</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CMA: 실시간 이자 ticker ──
function CMALifeCard({ account }) {
  const color = '#EF4444'
  const { balance = 0, accruedInterest = 0, todayInterest = 0, interestRate, openDate } = account
  const fmt = (s) => s ? s.replace(/-/g, '.') : ''
  const ratePerSec = balance * ((interestRate || 0) / 100) / 86400

  const [extra, setExtra] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    startRef.current = performance.now()
    setExtra(0)
    const tick = (now) => {
      setExtra((now - startRef.current) / 1000 * ratePerSec)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [ratePerSec])

  const live = accruedInterest + extra
  const whole = Math.floor(live)
  const frac = String(Math.floor((live - whole) * 100)).padStart(2, '0')

  return (
    <div className="slc-card slc-card--cma" style={{ '--slcc': color }}>
      <div className="slc-top">
        <div className="slc-tag">CMA · 연 {interestRate}%</div>
        <div className="slc-maturity-label">운용 개시 {fmt(openDate)}</div>
      </div>
      <div className="slc-cma-body">
        <div className="slc-cma-today">
          <div className="slc-cma-today-label">누적 이자 (실시간)</div>
          <div className="slc-cma-today-val" style={{ color }}>
            +{whole.toLocaleString('ko-KR')}<span className="cma-frac">.{frac}</span>원
          </div>
          <div className="slc-cma-today-sub">지금 이 순간에도 이자가 쌓이고 있어요</div>
        </div>
        <div className="slc-cma-stats">
          <div className="slc-row">
            <span className="slc-row-label">운용 잔액</span>
            <span className="slc-row-val">{balance.toLocaleString('ko-KR')}원</span>
          </div>
          <div className="slc-row">
            <span className="slc-row-label">오늘 이자</span>
            <span className="slc-row-val" style={{ color }}>+{todayInterest.toLocaleString('ko-KR')}원</span>
          </div>
          <div className="slc-row">
            <span className="slc-row-label">일 수익률</span>
            <span className="slc-row-val">{((interestRate || 0) / 365).toFixed(4)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 라우터: 계좌 타입별 분기 ──
function AccountLifeCard({ account }) {
  if (account.type === 'installment_savings') return <InstallmentLifeCard account={account} />
  if (account.type === 'term_deposit') return <TermDepositLifeCard account={account} />
  if (account.type === 'cma') return <CMALifeCard account={account} />
  return null
}

// 이전 이름 유지 (기존 코드 참조용)
const SavingsLifeCard = AccountLifeCard

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
  contacts,
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
  onStartEnrollment,
  promoIds,
  // 페이지네이션 (TODO-9에서 활성화)
  txMeta,
  onLoadMoreTxs,
  onTransferReady,
}) {
  const [activeTab, setActiveTab] = useState('chat')
  const [input, setInput] = useState('')
  const [contactCardOpen, setContactCardOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedTxId, setExpandedTxId] = useState(null)

  // #9, #1, #5: 이체 확인 카드가 활성화되어 있는지 여부
  const hasPendingTransfer = (messages || []).some((m) => m.type === 'transfer_pending')

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

  // 대화 탭: 새 메시지/카드 발생 시 무조건 끝으로 스크롤
  useEffect(() => {
    if (activeTab !== 'chat') return
    const el = chatContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
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
          className="room-header-block"
          style={{
            background: `linear-gradient(180deg, ${(BLOCK_COLORS[account?.type] || BLOCK_COLORS.checking)[0]} 0%, ${(BLOCK_COLORS[account?.type] || BLOCK_COLORS.checking)[1]} 100%)`,
          }}
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
        {(account.type === 'debit_card' || account.type === 'credit_card') && account.linkedAccountName && (
          <div className="contact-card-row">
            <span className="contact-card-label">결제 계좌</span>
            <span className="contact-card-value">{account.linkedAccountName}</span>
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
      <div className="room-tab-bar" role="tablist" aria-label="계좌 탭" style={{ '--tab-active-color': (BLOCK_COLORS[account?.type] || BLOCK_COLORS.checking)[0] }}>
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
        {account?.isPromo && (() => {
          const PROMO_BANNER = {
            credit_card: { badge: '혜택 준비됨', title: '당신을 기다리고 있어요', sub: '캐시백, 할인, 포인트 — iM 신용카드의 혜택이 지금 당신을 기다립니다. 아래에서 AI에게 물어보세요.' },
            cma:         { badge: '매일 이자', title: '잔액이 쉬는 동안 불어납니다', sub: 'iM CMA는 잔액이 있는 날마다 이자를 드립니다. 연 4.75% — 아래에서 AI에게 물어보세요.' },
            term_deposit:{ badge: '확정 금리', title: '목돈을 안전하게 키워보세요', sub: '연 4.20% 확정금리로 만기까지 안심하고 맡길 수 있습니다. 아래에서 AI에게 물어보세요.' },
            savings:     { badge: '비상금', title: '든든한 안전망을 만드세요', sub: '언제든 출금 가능한 비상금 전용 통장. 이자는 챙기고 유동성도 지킵니다. 아래에서 AI에게 물어보세요.' },
          }
          const b = PROMO_BANNER[account.type]
          if (!b) return null
          return (
            <div className="promo-banner">
              <div className="promo-banner-badge">{b.badge}</div>
              <div className="promo-banner-title">{b.title}</div>
              <div className="promo-banner-sub">{b.sub}</div>
            </div>
          )
        })()}
        {account?.applicationStatus === 'pending' && (
          <div className="card-pending-banner">
            <div className="card-pending-lamp-wrap">
              <span className="card-pending-lamp-icon" />
              <span className="card-pending-lamp-ring" />
            </div>
            <div className="card-pending-content">
              <div className="card-pending-title">카드 심사가 진행 중이에요</div>
              <div className="card-pending-sub">
                심사 결과는 영업일 기준 3~5일 내 문자로 안내드려요.<br />
                신청일 {account.applicationDate?.replace(/-/g, '.')}
              </div>
              <div className="card-pending-steps">
                <div className="card-pending-step card-pending-step--done">
                  <span className="cps-dot" />
                  <span className="cps-label">신청 완료</span>
                </div>
                <div className="card-pending-step card-pending-step--active">
                  <span className="cps-dot" />
                  <span className="cps-label">서류 심사</span>
                </div>
                <div className="card-pending-step">
                  <span className="cps-dot" />
                  <span className="cps-label">카드 발급</span>
                </div>
                <div className="card-pending-step">
                  <span className="cps-dot" />
                  <span className="cps-label">배송</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {(account?.type === 'installment_savings' || account?.type === 'term_deposit' || account?.type === 'cma') && account.accruedInterest !== undefined && (
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

          if (msg.type === 'account_life_card') {
            return (
              <div key={msg.id} className="room-card-wrapper">
                <AccountLifeCard account={msg.data} />
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
                onStartEnrollment={onStartEnrollment}
                promoIds={promoIds}
              />
            </div>
          )
        })}

        {isLoading && !messages.some(m => m.streaming) && (
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
        {account?.isPromo && account?.type === 'credit_card' ? (
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
        ) : (account?.type === 'installment_savings' || account?.type === 'term_deposit' || account?.type === 'cma') && account.accruedInterest !== undefined ? (
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
                {txMeta?.hasMore && <div ref={loadMoreRef} className="tx-load-sentinel" />}
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

      {/* 빠른 송금 패널 — 주계좌 + 대화 탭에서만 표시 */}
      {activeTab === 'chat' && account?.type === 'checking' && (
        <QuickTransferPanel
          contacts={contacts || []}
          transactions={transactions || []}
          onTransferReady={onTransferReady}
          hasPendingTransfer={hasPendingTransfer}
        />
      )}

      {/* 채팅 입력창 (대화 탭에서만 표시) */}
      {activeTab === 'chat' && (
        <div className="room-input-bar">
          <button
            className={`room-mic-btn${isRecording ? ' recording' : ''}`}
            onClick={toggleRecording}
            type="button"
            aria-label={isRecording ? '녹음 중지' : '음성 입력'}
            disabled={hasPendingTransfer}
          >
            <MicIcon active={isRecording} />
          </button>
          <textarea
            ref={textareaRef}
            className="room-input"
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={hasPendingTransfer ? '이체 확인 후 대화 가능합니다' : isRecording ? '듣고 있어요…' : `${account.name}에 대해 물어보세요`}
            rows={1}
            disabled={isLoading || hasPendingTransfer}
          />
          <button
            className="room-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || hasPendingTransfer}
            aria-label="전송"
          >
            ↑
          </button>
        </div>
      )}
    </div>
  )
}
