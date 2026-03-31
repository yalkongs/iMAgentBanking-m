import { useState, useRef, useCallback, useEffect } from 'react'
import { useVoiceConfirm } from '../hooks/useVoiceConfirm.js'

const API_BASE = import.meta.env.VITE_API_URL || ''

// ── 스와이프 확인 슬라이더 ──
function SwipeConfirm({ onConfirm, disabled }) {
  const trackRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [done, setDone] = useState(false)
  const startXRef = useRef(0)
  const THUMB = 48

  const getMax = useCallback(() => {
    const w = trackRef.current?.offsetWidth || 280
    return w - THUMB - 8
  }, [])

  function onTouchStart(e) {
    if (disabled || done) return
    setSwiping(true)
    startXRef.current = e.touches[0].clientX
  }

  function onTouchMove(e) {
    if (!swiping || disabled || done) return
    e.preventDefault()
    const dx = e.touches[0].clientX - startXRef.current
    const max = getMax()
    const clamped = Math.max(0, Math.min(dx, max))
    setOffset(clamped)
    if (clamped / max >= 0.92) {
      setSwiping(false)
      setDone(true)
      setOffset(max)
      setTimeout(onConfirm, 260)
    }
  }

  function onTouchEnd() {
    if (!swiping) return
    setSwiping(false)
    setOffset(0)
  }

  // 마우스 지원 (데스크톱 테스트용)
  function onMouseDown(e) {
    if (disabled || done) return
    setSwiping(true)
    startXRef.current = e.clientX
    const move = (ev) => {
      const dx = ev.clientX - startXRef.current
      const max = getMax()
      const clamped = Math.max(0, Math.min(dx, max))
      setOffset(clamped)
      if (clamped / max >= 0.92) {
        setSwiping(false)
        setDone(true)
        setOffset(max)
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
        setTimeout(onConfirm, 260)
      }
    }
    const up = () => {
      setSwiping(false)
      setOffset(0)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const max = getMax()
  const progress = max > 0 ? offset / max : 0

  return (
    <div
      ref={trackRef}
      className={`swipe-track ${disabled ? 'disabled' : ''} ${done ? 'confirmed' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      <div className="swipe-fill" style={{ width: `${progress * 100}%` }} />
      <span className="swipe-label" style={{ opacity: done ? 0 : Math.max(0, 1 - progress * 2.5) }}>
        {done ? '' : '밀어서 이체 확인'}
      </span>
      <div
        className="swipe-thumb"
        style={{
          transform: `translateY(-50%) translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {done ? '✓' : '›'}
      </div>
    </div>
  )
}

export default function TransferCard({ data, sessionId, onDone, voiceMode }) {
  const { to_contact, amountFormatted, from_account_id, contactInfo, availableAccounts } = data

  const accounts = availableAccounts || [{ id: from_account_id, name: '주계좌 (입출금)', balanceFormatted: '' }]
  const [selectedId, setSelectedId] = useState(from_account_id || accounts[0]?.id)
  const [status, setStatus] = useState('pending') // pending | confirming | done
  const [voiceHint, setVoiceHint] = useState(voiceMode ? '"네" 또는 "아니오"라고 말씀해 주세요' : null)
  const [accountsExpanded, setAccountsExpanded] = useState(accounts.length > 1)
  const [failureMsg, setFailureMsg] = useState(null)
  const [amountInput, setAmountInput] = useState(data.amount > 0 ? String(data.amount) : '')
  // #13 메모 인라인 편집
  const [memoValue, setMemoValue] = useState(data.memo || '')
  const [memoEditing, setMemoEditing] = useState(false)

  const cardRef = useRef(null)
  const amountInputRef = useRef(null)

  const effectiveAmount = data.amount > 0 ? data.amount : (Number(amountInput) || 0)
  const selectedAccount = accounts.find((a) => a.id === selectedId) || accounts[0]
  const isInsufficient = selectedAccount?.balance != null && effectiveAmount > 0 && selectedAccount.balance < effectiveAmount

  // #2 금액 입력이 필요한 카드: 마운트 후 카드 스크롤 보장
  useEffect(() => {
    if (data.amount > 0) return
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      amountInputRef.current?.focus()
    }, 120)
    return () => clearTimeout(t)
  }, [data.amount])

  // #2 키보드 닫힘 감지 (visualViewport 높이 복구) → 카드 재스크롤
  useEffect(() => {
    if (data.amount > 0) return
    const vv = window.visualViewport
    if (!vv) return
    let prevH = vv.height
    const onResize = () => {
      if (vv.height > prevH + 100) {
        // 키보드가 닫혔음
        setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
      }
      prevH = vv.height
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [data.amount])

  // 음성 확인 (voiceMode일 때 자동 활성화)
  useVoiceConfirm({
    isActive: voiceMode && status === 'pending',
    onConfirm: () => handleConfirm(true),
    onCancel: () => handleConfirm(false),
    onTimeout: () => setVoiceHint('음성 인식 시간이 초과되었습니다. 버튼을 눌러 확인해 주세요.'),
    timeoutMs: 5000,
  })

  async function handleConfirm(confirmed) {
    const hadAmount = effectiveAmount > 0
    setStatus('confirming')
    setFailureMsg(null)
    try {
      const res = await fetch(`${API_BASE}/api/confirm-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          confirmed,
          from_account_id: selectedId,
          amount: effectiveAmount,
          memo: memoValue,
        }),
      })
      const json = await res.json()
      if (!confirmed) {
        setStatus('done')
        // #3 금액 미입력 취소는 조용히 사라짐, 금액 입력 후 취소만 메시지 표시
        onDone(false, json, { hadAmount })
        return
      }
      if (json.success === false) {
        setStatus('pending')
        setFailureMsg(json.error || '이체에 실패했습니다.')
        return
      }
      setStatus('done')
      onDone(true, json, { hadAmount })
    } catch {
      setStatus('pending')
      setFailureMsg('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    }
  }

  if (status === 'done') return null

  return (
    <div className="transfer-card" ref={cardRef}>
      <div className="transfer-card-label">이체 확인</div>
      {voiceMode && (
        <div className="transfer-voice-hint">{voiceHint || '"네" 또는 "아니오"라고 말씀해 주세요'}</div>
      )}
      <div className="transfer-amount-row">
        <span className="transfer-amount-label">이체 금액</span>
        {data.amount > 0 ? (
          <span className="transfer-amount-value">{amountFormatted || `${data.amount.toLocaleString('ko-KR')}원`}</span>
        ) : (
          <div className="transfer-amount-input-wrap">
            <input
              ref={amountInputRef}
              className="transfer-amount-input"
              type="tel"
              inputMode="numeric"
              placeholder="금액 입력"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ''))}
              onBlur={() => {
                // 키보드 닫힌 후 카드가 보이도록 스크롤
                setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)
              }}
              disabled={status === 'confirming'}
            />
            <span className="transfer-amount-unit">원</span>
          </div>
        )}
      </div>

      {/* 이체 후 잔액 */}
      {data.balanceAfter !== undefined && (
        <div className="transfer-detail-row">
          <span className="transfer-detail-key">이체 후 잔액</span>
          <span className="transfer-detail-val">{data.balanceAfter.toLocaleString('ko-KR')}원</span>
        </div>
      )}

      {/* 수신자 정보 */}
      <div className="transfer-details">
        <div className="transfer-row">
          <span className="transfer-lbl">받는 분</span>
          <span className="transfer-val">{to_contact}</span>
        </div>
        {contactInfo && (
          <div className="transfer-row">
            <span className="transfer-lbl">받는 계좌</span>
            <span className="transfer-val">{contactInfo.bank} · {contactInfo.accountNo}</span>
          </div>
        )}
        {/* #13 메모 인라인 편집 */}
        <div className="transfer-row transfer-row--memo">
          <span className="transfer-lbl">메모</span>
          {memoEditing ? (
            <input
              className="transfer-memo-input"
              type="text"
              value={memoValue}
              maxLength={20}
              placeholder="메모 없음"
              autoFocus
              onChange={(e) => setMemoValue(e.target.value)}
              onBlur={() => setMemoEditing(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setMemoEditing(false) } }}
            />
          ) : (
            <button
              className="transfer-memo-val"
              onClick={() => setMemoEditing(true)}
              disabled={status === 'confirming'}
            >
              {memoValue || <span className="transfer-memo-placeholder">탭해서 입력</span>}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, opacity: 0.5 }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 출금 계좌 선택 */}
      <div className="transfer-account-section">
        <div className="transfer-account-header">
          <div className="transfer-account-label">출금 계좌</div>
          {accounts.length > 1 && !accountsExpanded && (
            <button className="transfer-account-change" onClick={() => setAccountsExpanded(true)}>
              변경
            </button>
          )}
        </div>
        {accountsExpanded ? (
          <div className="transfer-account-list">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                className={`transfer-account-btn ${selectedId === acc.id ? 'selected' : ''}`}
                onClick={() => { setSelectedId(acc.id); if (accounts.length > 1) setAccountsExpanded(false) }}
                disabled={status === 'confirming'}
              >
                <span className="transfer-account-name">{acc.name}</span>
                <span className="transfer-account-balance">{acc.balanceFormatted}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="transfer-account-selected">
            <span className="transfer-account-name">{selectedAccount?.name}</span>
            <span className="transfer-account-balance">{selectedAccount?.balanceFormatted}</span>
          </div>
        )}
        {isInsufficient && (
          <div className="transfer-account-warn">잔액이 부족합니다.</div>
        )}
        {failureMsg && (
          <div className="transfer-account-warn">{failureMsg}</div>
        )}
      </div>

      {/* 스와이프 확인 + 취소 */}
      <div className="transfer-swipe-row">
        {!isInsufficient && effectiveAmount > 0 && status !== 'confirming' ? (
          <SwipeConfirm
            onConfirm={() => handleConfirm(true)}
            disabled={false}
          />
        ) : (
          <button
            className="transfer-btn-confirm"
            onClick={() => handleConfirm(true)}
            disabled={status === 'confirming' || isInsufficient || effectiveAmount <= 0}
          >
            {status === 'confirming' ? '처리 중…' : effectiveAmount <= 0 ? '금액을 입력하세요' : '이체 확인'}
          </button>
        )}
      </div>

      <button
        className="transfer-btn-cancel"
        onClick={() => handleConfirm(false)}
        disabled={status === 'confirming'}
        style={{ width: '100%', marginTop: 6 }}
      >
        취소
      </button>
    </div>
  )
}
