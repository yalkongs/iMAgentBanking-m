import { useState, useRef, useEffect, useCallback } from 'react'
import Message from './Message.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

const SERVICE_CONFIGS = {
  'monthly-report': {
    name: '월간 금융 리포트',
    color: '#3B82F6',
    greeting: '이번 달 소비 패턴을 분석해드릴게요. 어떤 부분이 궁금하세요?',
  },
  'credit-score': {
    name: '신용점수 콘솔',
    color: '#8B5CF6',
    greeting: '신용점수와 관련해 궁금한 것을 물어보세요.',
  },
  'loan-consult': {
    name: '대출 상담',
    color: '#F59E0B',
    greeting: '대출 관련 상담을 도와드릴게요. 어떤 대출을 알아보고 계신가요?',
  },
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  )
}

function MicIcon({ active }) {
  return active ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="9" y1="22" x2="15" y2="22"/>
    </svg>
  )
}

export default function ServiceRoom({ serviceId, sessionId, messages, isLoading, onBack, onSendMessage }) {
  const cfg = SERVICE_CONFIGS[serviceId] || { name: '서비스', color: '#00C9A7', greeting: '무엇을 도와드릴까요?' }
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)

  // 초기 인사말 (메시지 없을 때)
  const displayMessages = messages.length === 0 && !isLoading
    ? [{ id: 'greeting', role: 'assistant', type: 'text', text: cfg.greeting }]
    : messages

  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    onSendMessage(text)
  }

  return (
    <div className="service-room">
      <div className="service-room-header">
        <button className="service-room-back-btn" onClick={onBack} aria-label="뒤로가기">
          <BackIcon />
        </button>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${cfg.color}44, ${cfg.color}22)`,
            border: `1px solid ${cfg.color}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
        </div>
        <span className="service-room-title">{cfg.name}</span>
      </div>

      <div
        ref={messagesContainerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {displayMessages.map((msg) => (
          <Message key={msg.id} message={msg} sessionId={sessionId} />
        ))}
        {isLoading && (
          <div className="message message--assistant">
            <span className="typing-dots"><span /><span /><span /></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="room-input-bar" style={{ flexShrink: 0 }}>
        <div className="room-input-wrap">
          <textarea
            ref={textareaRef}
            className="room-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder={`${cfg.name}에 대해 물어보세요`}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="room-send-btn"
            onClick={submit}
            disabled={!input.trim() || isLoading}
            aria-label="전송"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
