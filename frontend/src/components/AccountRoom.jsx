import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Message from './Message.jsx'
import TransferCard from './TransferCard.jsx'

const TYPE_CONFIG = {
  checking:            { icon: '💳', color: '#3B82F6', label: '입출금' },
  installment_savings: { icon: '🏦', color: '#10B981', label: '정기적금' },
  term_deposit:        { icon: '📈', color: '#8B5CF6', label: '정기예금' },
  savings:             { icon: '🐷', color: '#F59E0B', label: '비상금' },
  cma:                 { icon: '📊', color: '#EF4444', label: 'CMA' },
}

const WELCOME_MESSAGES = {
  checking:            '오늘 입출금 내역이에요. 궁금한 것을 물어보세요!',
  installment_savings: '오늘도 자동이체 잘 됐어요! 무엇이든 물어보세요.',
  term_deposit:        '고금리 보호 중이에요. 만기일이나 금리 궁금하신 것 있으세요?',
  savings:             '비상금 잘 모이고 있어요. 필요하신 것 있으면 말씀해 주세요.',
  cma:                 '자산 굴리는 중이에요. 수익률이나 현황 궁금하신 것 있으세요?',
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

// 거래 내역 + AI 메시지를 날짜 구분선과 함께 합침
function buildTimeline(transactions, messages) {
  const items = []

  // 거래 내역 → 타임라인 아이템
  for (const tx of transactions) {
    items.push({ kind: 'tx', data: tx, date: tx.date, sortKey: tx.date + '_tx_' + tx.id })
  }

  // AI 메시지 (고정 날짜 없음 → 오늘로 처리)
  for (const msg of messages) {
    const today = new Date().toISOString().slice(0, 10)
    items.push({ kind: 'msg', data: msg, date: today, sortKey: today + '_msg_' + msg.id })
  }

  items.sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  // 날짜 구분선 삽입
  const result = []
  let lastDate = null
  for (const item of items) {
    const label = getDateLabel(item.date)
    if (label !== lastDate) {
      result.push({ kind: 'date', label })
      lastDate = label
    }
    result.push(item)
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
}) {
  const [input, setInput] = useState('')
  const [contactCardOpen, setContactCardOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)

  const cfg = TYPE_CONFIG[account?.type] || { icon: '🏦', color: '#6B7280', label: '' }

  // 방 입장 시 미읽 초기화
  useEffect(() => {
    onMarkRead?.()
  }, [account?.id])

  // 새 메시지 시 스크롤
  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < 150
      if (near) el.scrollTop = el.scrollHeight
    }
  }, [messages, transactions])

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

  const timeline = buildTimeline(transactions || [], messages || [])

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
          {cfg.icon}
        </div>
        <div className="room-header-info">
          <div className="room-header-name">{account.name}</div>
          <div className="room-header-sub">{account.bank} · {cfg.label}</div>
        </div>
        <div className="room-header-chevron">{contactCardOpen ? '▲' : '▼'}</div>
      </div>

      {/* 계좌 상세 ContactCard (헤더 탭 시 슬라이드 다운) */}
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

      {/* 타임라인 */}
      <div className="room-timeline" ref={messagesContainerRef}>
        {/* 환영 메시지 (항상 첫 번째) */}
        <div className="ai-bubble">
          <div className="ai-bubble-icon">
            <img src="/imbank-mark.png" alt="iM" />
          </div>
          <div className="ai-bubble-body">
            {WELCOME_MESSAGES[account?.type] || '안녕하세요! 무엇을 도와드릴까요?'}
          </div>
        </div>

        {/* 거래 내역 로딩 중 스켈레톤 */}
        {isLoadingTxs && (
          <>
            <TxSkeleton />
            <TxSkeleton />
            <TxSkeleton />
          </>
        )}

        {timeline.map((item, idx) => {
          if (item.kind === 'date') {
            return (
              <div key={'date_' + idx} className="date-separator">
                <span>{item.label}</span>
              </div>
            )
          }

          if (item.kind === 'tx') {
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
          }

          if (item.kind === 'msg') {
            const msg = item.data
            // AI 응답은 전체 너비 중앙 버블
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

            // 사용자 메시지
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="message user">
                  <div className="message-bubble">{msg.text}</div>
                </div>
              )
            }

            // UI 카드 / 이체 확인 등 — Message 컴포넌트 재사용
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
          }

          return null
        })}

        {/* AI 타이핑 인디케이터 */}
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

        <div ref={messagesEndRef} />
      </div>

      {/* 채팅 입력창 */}
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
    </div>
  )
}
