import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Message from './Message.jsx'

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
}

const TYPE_CONFIG = {
  checking:            { color: '#3B82F6', label: '입출금' },
  installment_savings: { color: '#10B981', label: '정기적금' },
  term_deposit:        { color: '#8B5CF6', label: '정기예금' },
  savings:             { color: '#F59E0B', label: '비상금' },
  cma:                 { color: '#EF4444', label: 'CMA' },
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
          <span className="contact-card-label">잔액</span>
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
        {isLoadingTxs ? (
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
              const isIncome = tx.amount > 0
              const amountFmt = (isIncome ? '+' : '') + tx.amount.toLocaleString('ko-KR') + '원'
              return (
                <div
                  key={tx.id || 'tx_' + idx}
                  className={`tx-bubble ${isIncome ? 'tx-bubble--income' : 'tx-bubble--expense'}`}
                >
                  <div className="tx-bubble-counterpart">{tx.counterpart}</div>
                  <div className="tx-bubble-amount">{amountFmt}</div>
                  {tx.memo && <div className="tx-bubble-memo">{tx.memo}</div>}
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
          <textarea
            ref={textareaRef}
            className="room-input"
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={`${account.name}에 대해 물어보세요`}
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
