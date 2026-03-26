import { useState, useEffect, useRef, useCallback } from 'react'
import Message from './components/Message.jsx'
import AnimatedBackground from './components/AnimatedBackground.jsx'
import DrawerBanner from './components/DrawerBanner.jsx'
import VoiceOverlay from './components/VoiceOverlay.jsx'
import AccountListScreen from './components/AccountListScreen.jsx'
import AccountRoom from './components/AccountRoom.jsx'
import { useWebSocket } from './hooks/useWebSocket.js'
import { useVoiceInput } from './hooks/useVoiceInput.js'

const API_BASE = import.meta.env.VITE_API_URL || ''

function getSessionId() {
  const id = 'sess_' + Math.random().toString(36).slice(2, 10)
  return id
}

const QUICK_CATEGORIES = [
  {
    label: '조회',
    items: ['잔액 얼마야?', '계좌 목록 보여줘', '최근 거래 내역 보여줘'],
  },
  {
    label: '이체',
    items: ['엄마한테 5만원 보내줘', '최근에 이체한 내역 보여줘'],
  },
  {
    label: '분석',
    items: ['이번 달 지출 분석해줘', '이번 달 카페 얼마 썼어?', '이번 달 어땠어?'],
  },
]

// 컨텍스트 기반 퀵 숏컷 — 마지막 카드 타입에 따라 변경
const CONTEXTUAL_SHORTCUTS = {
  get_balance: [
    { label: '이체', msg: '이체하기' },
    { label: '지출분석', msg: '이번 달 지출 분석해줘' },
    { label: '거래내역', msg: '최근 거래 내역 보여줘' },
    { label: '카드내역', msg: '이번 달 카드 내역 보여줘' },
    { label: '이달이야기', msg: '이번 달 어땠어?' },
  ],
  get_transactions: [
    { label: '지출분석', msg: '이번 달 지출 분석해줘' },
    { label: '카드내역', msg: '이번 달 카드 내역 보여줘' },
    { label: '이체', msg: '이체하기' },
    { label: '잔액조회', msg: '잔액 얼마야?' },
  ],
  analyze_spending: [
    { label: '카드내역', msg: '이번 달 카드 내역 보여줘' },
    { label: '이달이야기', msg: '이번 달 어땠어?' },
    { label: '잔액조회', msg: '잔액 얼마야?' },
    { label: '이체', msg: '이체하기' },
  ],
  analyze_card_spending: [
    { label: '지출분석', msg: '이번 달 지출 분석해줘' },
    { label: '이달이야기', msg: '이번 달 어땠어?' },
    { label: '잔액조회', msg: '잔액 얼마야?' },
    { label: '이체', msg: '이체하기' },
  ],
  get_transfer_suggestion: [
    { label: '이체', msg: '이체하기' },
    { label: '잔액조회', msg: '잔액 얼마야?' },
    { label: '거래내역', msg: '최근 거래 내역 보여줘' },
  ],
  transfer_receipt: [
    { label: '이체내역', msg: '최근 이체 내역 보여줘' },
    { label: '잔액확인', msg: '잔액 얼마야?' },
    { label: '또이체', msg: '이체하기' },
    { label: '지출분석', msg: '이번 달 지출 분석해줘' },
  ],
  monthly_story: [
    { label: '잔액조회', msg: '잔액 얼마야?' },
    { label: '이체', msg: '이체하기' },
    { label: '지출분석', msg: '이번 달 지출 분석해줘' },
    { label: '카드내역', msg: '이번 달 카드 내역 보여줘' },
  ],
  default: [
    { label: '잔액조회', msg: '잔액 얼마야?' },
    { label: '이체', msg: '이체하기' },
    { label: '지출분석', msg: '이번 달 지출 분석해줘' },
    { label: '최근거래', msg: '최근 거래 내역 보여줘' },
    { label: '카드내역', msg: '이번 달 카드 내역 보여줘' },
  ],
}

// 데모 시나리오 메시지 목록
const DEMO_MESSAGES = [
  '잔액 얼마야?',
  '이번 달 지출 분석해줘',
  '엄마한테 5만원 보내줘',
]

// 음성 데모 시나리오
const VOICE_DEMO_MESSAGES = [
  '엄마한테 5만원 보내줘',
  '이번 달 얼마 절약할 수 있어?',
  '적금 뭐가 좋아?',
]

// ── TTS 헬퍼 ──
function speakKorean(text, rate = 1.05, onEnd = null) {
  if (!window.speechSynthesis || !text) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ko-KR'
  utt.rate = rate
  utt.pitch = 1.0
  // 너무 긴 텍스트는 첫 100자만
  utt.text = text.length > 120 ? text.slice(0, 120) + '.' : text
  if (onEnd) utt.onend = onEnd
  utt.onerror = (e) => console.error('[speakKorean] TTS error:', e.error)
  window.speechSynthesis.speak(utt)
}

// 헬스 등급 계산
function getHealthGrade(score) {
  if (score >= 80) return { grade: 'A', color: '#34D399', cls: 'good' }
  if (score >= 60) return { grade: 'B', color: '#7dd3fc', cls: 'good' }
  if (score >= 40) return { grade: 'C', color: '#FBBF24', cls: 'fair' }
  return { grade: 'D', color: '#F87171', cls: 'poor' }
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('계좌 목록 보여줘')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(getSessionId)
  const [alert, setAlert] = useState(null)

  // 프로액티브 AI 인사이트
  const [proactiveInsights, setProactiveInsights] = useState([])
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [insightsError, setInsightsError] = useState(false)

  // 초기 화면 fade-out
  const [leavingEmpty, setLeavingEmpty] = useState(false)

  // 데모 모드
  const [demoMode, setDemoMode] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const demoQueueRef = useRef([])
  const demoTimeoutRef = useRef(null)
  const prevLoadingRef = useRef(false)

  // 음성 모드
  const [voiceMode, setVoiceMode] = useState(false)
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false)
  const voiceModeRef = useRef(false)
  const pendingDemoRef = useRef(false)

  // voiceModeRef를 최신 voiceMode와 동기화
  useEffect(() => { voiceModeRef.current = voiceMode }, [voiceMode])

  // 상단 오버레이 입출금 알림
  const [txNotif, setTxNotif] = useState(null)
  const [txNotifVisible, setTxNotifVisible] = useState(false)
  const txNotifTimersRef = useRef([])

  // TTS 활성 여부
  const [ttsEnabled, setTtsEnabled] = useState(false)

  // 마지막 카드 타입 (컨텍스트 숏컷)
  const [lastCardType, setLastCardType] = useState(null)

  // 헬스 인덱스
  const [healthScore, setHealthScore] = useState(null)
  const [healthOpen, setHealthOpen] = useState(false)

  // ── 메신저 UI 상태 ──
  const [screen, setScreen] = useState('home')           // 'home' | 'room'
  const [activeAccountId, setActiveAccountId] = useState(null)
  const [accountList, setAccountList] = useState([])
  const [isAccountsLoading, setIsAccountsLoading] = useState(true)
  const [roomTransactions, setRoomTransactions] = useState({})
  const [roomMessages, setRoomMessages] = useState({})   // { [accountId]: Message[] }
  const [unreadCounts, setUnreadCounts] = useState({})   // { [accountId]: number }

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const streamingIdRef = useRef(null)
  const prevMsgCountRef = useRef(0)
  // GUI 드릴-다운에서 발생한 메시지를 scope별로 제거하기 위한 ref
  const currentGuiScopeRef = useRef(null)

  // 메신저 라우팅 refs (sendMessage 클로저에서 사용)
  const screenRef = useRef('home')
  const activeAccountIdRef = useRef(null)

  // screenRef, activeAccountIdRef 동기화 (sendMessage 클로저용)
  useEffect(() => { screenRef.current = screen }, [screen])
  useEffect(() => { activeAccountIdRef.current = activeAccountId }, [activeAccountId])

  // 컨텍스트 숏컷 계산
  const currentShortcuts = CONTEXTUAL_SHORTCUTS[lastCardType] || CONTEXTUAL_SHORTCUTS.default

  // 스크롤 컨테이너 기준으로 즉시 스크롤
  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const isNearBottom = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150
  }, [])

  const scrollToCardTop = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return
    const all = el.querySelectorAll(
      '.message, .ui-card, .tx-alert-card, .transfer-card, .transfer-result, .transfer-receipt, .moment-card, .story-card'
    )
    const last = all[all.length - 1]
    if (last) el.scrollTop = last.offsetTop - 8
  }, [])

  useEffect(() => {
    const newCount = messages.length
    const added = newCount > prevMsgCountRef.current
    prevMsgCountRef.current = newCount

    if (added) {
      const lastMsg = messages[messages.length - 1]

      if (lastMsg?.noAutoScroll) {
        if (isNearBottom()) {
          const t = setTimeout(scrollToBottom, 60)
          return () => clearTimeout(t)
        }
        return
      }

      if (lastMsg?.type === 'ui_card' || lastMsg?.type === 'transfer_pending') {
        const t = setTimeout(scrollToCardTop, 80)
        return () => clearTimeout(t)
      }

      const t = setTimeout(scrollToBottom, 60)
      return () => clearTimeout(t)
    } else if (isNearBottom()) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom, scrollToCardTop, isNearBottom])

  useEffect(() => () => txNotifTimersRef.current.forEach(clearTimeout), [])

  // visualViewport → CSS 변수 동기화
  // resize: Android Chrome 키보드 (viewport 높이 변화)
  // scroll: iOS Safari 키보드 (offsetTop 변화 — 이걸 빠뜨리면 입력창이 위로 사라짐)
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

  // 프로액티브 알림 로드
  useEffect(() => {
    fetch(`${API_BASE}/api/proactive`)
      .then((r) => r.json())
      .then((d) => { if (d.alert) setAlert(d.alert) })
      .catch(() => {})
  }, [])

  // 프로액티브 AI 인사이트 로드
  useEffect(() => {
    setInsightsLoading(true)
    setInsightsError(false)
    fetch(`${API_BASE}/api/insights`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.insights)) setProactiveInsights(d.insights) })
      .catch(() => setInsightsError(true))
      .finally(() => setInsightsLoading(false))
  }, [])

  // 헬스 스코어 로드
  useEffect(() => {
    fetch(`${API_BASE}/api/health-score`)
      .then((r) => r.json())
      .then((d) => { if (d.score !== undefined) setHealthScore(d.score) })
      .catch(() => {})
  }, [])

  // ── 메신저 메시지 라우터 (refs 기반 — SSE 클로저 안전) ──
  // useWebSocket dependency array보다 먼저 선언해야 TDZ 방지
  const appendToActiveStore = useCallback((msg) => {
    const aid = activeAccountIdRef.current
    const s = screenRef.current
    if (s === 'room' && aid) {
      setRoomMessages((prev) => ({
        ...prev,
        [aid]: [...(prev[aid] || []), msg],
      }))
    } else {
      setMessages((prev) => [...prev, msg])
    }
  }, [])

  const updateInActiveStore = useCallback((id, updater) => {
    const aid = activeAccountIdRef.current
    const s = screenRef.current
    if (s === 'room' && aid) {
      setRoomMessages((prev) => ({
        ...prev,
        [aid]: (prev[aid] || []).map((m) => m.id === id ? updater(m) : m),
      }))
    } else {
      setMessages((prev) => prev.map((m) => m.id === id ? updater(m) : m))
    }
  }, [])

  // WebSocket — 이벤트 처리
  useWebSocket(sessionId, useCallback((event) => {
    if (event.type === 'PENDING_TRANSFER') {
      // voiceMode일 때 녹음 일시 정지 → useVoiceConfirm이 처리
      if (voiceModeRef.current) stopRecording()
      const msgId = 'transfer_' + Date.now()
      appendToActiveStore({ id: msgId, type: 'transfer_pending', data: event.data })
    } else if (event.type === 'TRANSFER_COMPLETE') {
      const r = event.data
      appendToActiveStore({ id: 'tr_done_' + Date.now(), type: 'transfer_receipt', data: r })
      setLastCardType('transfer_receipt')
    } else if (event.type === 'TRANSFER_CANCELLED') {
      appendToActiveStore({ id: 'tr_cancel_' + Date.now(), type: 'transfer_result', success: false, text: '이체가 취소되었습니다.' })
    } else if (event.type === 'TRANSFER_FAILED') {
      appendToActiveStore({ id: 'tr_fail_' + Date.now(), type: 'transfer_result', success: false, text: `이체 실패: ${event.error}` })
    } else if (event.type === 'TRANSACTION_ALERT') {
      const data = event.data
      const inMatchingRoom =
        screenRef.current === 'room' &&
        activeAccountIdRef.current === data.accountId
      if (inMatchingRoom) {
        // 현재 계좌 채팅방에 있으면 방 메시지로 추가
        const aid = activeAccountIdRef.current
        setRoomMessages((prev) => ({
          ...prev,
          [aid]: [...(prev[aid] || []), { id: 'alert_' + Date.now(), type: 'transaction_alert', data }],
        }))
      } else {
        // 다른 화면이면 상단 토스트
        txNotifTimersRef.current.forEach(clearTimeout)
        txNotifTimersRef.current = []
        setTxNotif(data)
        const t1 = setTimeout(() => setTxNotifVisible(true), 30)
        const t2 = setTimeout(() => setTxNotifVisible(false), 5000)
        const t3 = setTimeout(() => setTxNotif(null), 5350)
        txNotifTimersRef.current = [t1, t2, t3]
        // 미읽 카운트 증가
        if (data.accountId) {
          setUnreadCounts((prev) => ({ ...prev, [data.accountId]: (prev[data.accountId] || 0) + 1 }))
        }
      }
    } else if (event.type === 'TRANSACTION_ALERT_COMMENT') {
      const { alertId, comment } = event.data
      setTxNotif((prev) =>
        prev && prev.alertId === alertId ? { ...prev, aiComment: comment } : prev
      )
      // 방 안에 있는 alert 메시지에도 코멘트 업데이트
      const aid = activeAccountIdRef.current
      if (aid) {
        setRoomMessages((prev) => {
          const msgs = prev[aid] || []
          const updated = msgs.map((m) =>
            m.type === 'transaction_alert' && m.data?.alertId === alertId
              ? { ...m, data: { ...m.data, aiComment: comment } }
              : m
          )
          return { ...prev, [aid]: updated }
        })
      }
    } else if (event.type === 'FINANCIAL_MOMENT') {
      // 금융 모먼트 카드 (급여, 카드대금, 과소비) — 방에 있으면 방으로
      appendToActiveStore({ id: 'moment_' + Date.now(), type: 'financial_moment', data: event.data, noAutoScroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendToActiveStore]))

  // Model C: 현재 GUI 위치/상태를 추적하는 ref (sendMessage 클로저에서 읽음)
  const currentGuiContextRef = useRef(null)

  // GUI 드릴-다운 scope 메시지 일괄 제거 (UI + 서버 AI 히스토리 동시 정리)
  const removeGuiScope = useCallback((scopeId) => {
    if (!scopeId) return
    setMessages((prev) => prev.filter((m) => m.guiScope !== scopeId))
    fetch(`${API_BASE}/api/clear-gui-scope`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, guiScope: scopeId }),
    }).catch(() => {})
  }, [sessionId])

  // 메시지 전송 (guiContext: undefined = ref 값 사용, null = 명시적 없음, object = override)
  const sendMessage = useCallback(async (text, guiScope = null, guiContext = undefined) => {
    const msg = text.trim()
    if (!msg || isLoading) return

    currentGuiScopeRef.current = guiScope

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsLoading(true)
    setLeavingEmpty(true)

    appendToActiveStore({ id: 'user_' + Date.now(), role: 'user', type: 'text', text: msg, guiScope })

    const assistantId = 'assistant_' + Date.now()
    streamingIdRef.current = assistantId
    appendToActiveStore({ id: assistantId, role: 'assistant', type: 'text', text: '', streaming: true, guiScope })

    let finalText = ''

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          sessionId,
          guiScope,
          guiContext: guiContext !== undefined ? guiContext : currentGuiContextRef.current,
        }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'text') {
              finalText += data.delta
              updateInActiveStore(assistantId, (m) => ({ ...m, text: m.text + data.delta }))
            } else if (data.type === 'ui_card') {
              appendToActiveStore({ id: 'card_' + Date.now() + Math.random(), type: 'ui_card', cardType: data.cardType, data: data.data, guiScope: currentGuiScopeRef.current })
              setLastCardType(data.cardType)
              // voiceMode Path 2: ui_card 수신 시 요약 TTS
              if (voiceModeRef.current) {
                const summaryMap = {
                  get_balance: '잔액을 확인했습니다.',
                  get_savings_advice: '절약 분석 결과를 확인해보세요.',
                  compare_products: 'iM뱅크 추천 적금 상품을 확인해보세요.',
                  get_transactions: '거래 내역입니다.',
                  analyze_spending: '지출 분석 결과입니다.',
                }
                const summary = summaryMap[data.cardType]
                if (summary) {
                  setIsTtsSpeaking(true)
                  speakKorean(summary, 1.0, () => setIsTtsSpeaking(false))
                }
              }
            } else if (data.type === 'done') {
              updateInActiveStore(assistantId, (m) => ({ ...m, streaming: false }))
              // voiceMode Path 1 억제: ui_card TTS(Path 2)와 충돌 방지
              if (voiceModeRef.current) {
                // voiceMode에서는 Path 2(ui_card TTS)만 사용
              } else if (ttsEnabled && finalText && finalText.length < 200) {
                // 일반 TTS Path 1
                speakKorean(finalText)
              }
            } else if (data.type === 'error') {
              updateInActiveStore(assistantId, (m) => ({
                ...m, text: '오류가 발생했습니다. 다시 시도해주세요.', streaming: false, isError: true, failedMsg: msg,
              }))
            }
          } catch {}
        }
      }
    } catch {
      updateInActiveStore(streamingIdRef.current, (m) => ({
        ...m, text: '연결 오류. 서버를 확인해주세요.', streaming: false, isError: true, failedMsg: msg,
      }))
    } finally {
      setIsLoading(false)
      currentGuiScopeRef.current = null
    }
  }, [isLoading, sessionId, ttsEnabled, appendToActiveStore, updateInActiveStore])

  // Model C: 카드별 quickAction — overrideContext가 있으면 guiContext ref도 갱신
  const handleQuickAction = useCallback((text, overrideContext) => {
    if (overrideContext !== undefined) {
      currentGuiContextRef.current = overrideContext
    }
    sendMessage(text, null, overrideContext)
  }, [sendMessage])

  // 데모 모드: isLoading false 전환 시 다음 큐 실행 (TTS 완료 대기)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && demoMode) {
      if (demoQueueRef.current.length > 0) {
        if (!isTtsSpeaking) {
          const next = demoQueueRef.current.shift()
          sendMessage(next)
        } else {
          pendingDemoRef.current = true // TTS 끝나면 발송
        }
      }
    }
    prevLoadingRef.current = isLoading
  }, [isLoading, demoMode, sendMessage, isTtsSpeaking])

  // TTS 완료 → 대기 중인 데모 메시지 발송
  useEffect(() => {
    if (!isTtsSpeaking && pendingDemoRef.current && demoMode && !isLoading) {
      pendingDemoRef.current = false
      if (demoQueueRef.current.length > 0) {
        const next = demoQueueRef.current.shift()
        sendMessage(next)
      }
    }
  }, [isTtsSpeaking, demoMode, isLoading, sendMessage])

  // 데모 모드: ContactCandidatesCard 자동 선택 / TransferCard 정지
  useEffect(() => {
    if (!demoMode) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg) return

    if (lastMsg.type === 'ui_card' && lastMsg.cardType === 'resolve_contact_candidates') {
      const d = lastMsg.data
      if (d.candidates && d.candidates.length > 0) {
        const c = d.candidates[0]
        const autoMsg = `${d.query}은(는) ${c.realName} (${c.bank} ${c.accountNoMasked})이야. 이 분으로 진행해줘.`
        setTimeout(() => sendMessage(autoMsg), 800)
      }
    }

    if (lastMsg.type === 'transfer_pending') {
      demoQueueRef.current = []
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current)
      setDemoMode(false)
    }
  }, [messages, demoMode, sendMessage])

  // 데모 시작
  function startDemo() {
    setMenuOpen(false)
    demoQueueRef.current = [...DEMO_MESSAGES.slice(1)]
    setDemoMode(true)
    demoTimeoutRef.current = setTimeout(() => {
      demoQueueRef.current = []
      setDemoMode(false)
    }, 15000)
    sendMessage(DEMO_MESSAGES[0])
  }

  // 음성 데모 시작
  function startVoiceDemo() {
    setMenuOpen(false)
    setVoiceMode(true)
    setTtsEnabled(true)
    demoQueueRef.current = [...VOICE_DEMO_MESSAGES.slice(1)]
    setDemoMode(true)
    demoTimeoutRef.current = setTimeout(() => {
      demoQueueRef.current = []
      setDemoMode(false)
      setVoiceMode(false)
    }, 30000)
    sendMessage(VOICE_DEMO_MESSAGES[0])
  }

  // mock 데이터 리셋
  async function handleResetMock() {
    setMenuOpen(false)
    await fetch(`${API_BASE}/api/reset-mock`, { method: 'POST' })
    await fetch(`${API_BASE}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    setMessages([])
    setRoomMessages({})
    setRoomTransactions({})
    setUnreadCounts({})
    setAlert(null)
    setLastCardType(null)
    setInsightsLoading(true)
    setInsightsError(false)
    setProactiveInsights([])
    fetch(`${API_BASE}/api/insights`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.insights)) setProactiveInsights(d.insights) })
      .catch(() => setInsightsError(true))
      .finally(() => setInsightsLoading(false))
    fetchAccountList()
  }

  // ── Living Accounts: 채팅방 첫 입장 시 AI 프로액티브 인사말 ──
  const fetchRoomGreeting = useCallback(async (accountId) => {
    const greetingId = 'greeting_' + Date.now()
    setRoomMessages((prev) => ({
      ...prev,
      [accountId]: [...(prev[accountId] || []), { id: greetingId, role: 'assistant', type: 'text', text: '', streaming: true }],
    }))

    try {
      const res = await fetch(`${API_BASE}/api/room-greeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, accountId }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'text') {
              setRoomMessages((prev) => ({
                ...prev,
                [accountId]: (prev[accountId] || []).map((m) =>
                  m.id === greetingId ? { ...m, text: m.text + data.delta } : m
                ),
              }))
            } else if (data.type === 'done') {
              setRoomMessages((prev) => ({
                ...prev,
                [accountId]: (prev[accountId] || []).map((m) =>
                  m.id === greetingId ? { ...m, streaming: false } : m
                ),
              }))
            }
          } catch {}
        }
      }
    } catch {
      setRoomMessages((prev) => ({
        ...prev,
        [accountId]: (prev[accountId] || []).filter((m) => m.id !== greetingId),
      }))
    }
  }, [sessionId])

  // ── 계좌 목록 로드 ──
  const fetchAccountList = useCallback(() => {
    setIsAccountsLoading(true)
    fetch(`${API_BASE}/api/accounts?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.accounts)) setAccountList(d.accounts) })
      .catch(() => {})
      .finally(() => setIsAccountsLoading(false))
  }, [sessionId])

  // 앱 시작 시 계좌 목록 로드
  useEffect(() => { fetchAccountList() }, [fetchAccountList])

  // ── 방 입장 / 퇴장 ──
  function enterRoom(accountId) {
    const acc = accountList.find((a) => a.id === accountId)
    if (!acc) return

    // guiContext 자동 주입
    const totalBalance = accountList.reduce((s, a) => s + a.balance, 0)
    currentGuiContextRef.current = {
      view: 'account_room',
      accountId: acc.id,
      accountName: acc.name,
      accountType: acc.type,
      balance: acc.balance,
      totalBalance,
    }

    setActiveAccountId(accountId)
    setScreen('room')
    setUnreadCounts((prev) => ({ ...prev, [accountId]: 0 }))

    // 거래 내역 로드 (캐시 없을 때만)
    if (!roomTransactions[accountId]) {
      fetch(`${API_BASE}/api/account/${accountId}?sessionId=${sessionId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.recentTransactions) {
            setRoomTransactions((prev) => ({ ...prev, [accountId]: d.recentTransactions }))
          }
        })
        .catch(() => {})
    }

    // Living Accounts: 첫 입장 시만 AI 프로액티브 인사말 생성
    if (!roomMessages[accountId] || roomMessages[accountId].length === 0) {
      fetchRoomGreeting(accountId)
    }
  }

  function exitRoom() {
    currentGuiContextRef.current = null
    setActiveAccountId(null)
    setScreen('home')
    // 방 퇴장 시 계좌 목록 갱신 (잔액 변동 반영)
    fetchAccountList()
  }

  // 대화 초기화 (세션만)
  async function handleReset() {
    await fetch(`${API_BASE}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    setMessages([])
    setRoomMessages({})
    setRoomTransactions({})
    setUnreadCounts({})
    setAlert(null)
    setLeavingEmpty(false)
    setLastCardType(null)
    setIsAccountsLoading(true)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    fetchAccountList()
  }

  const { isRecording, toggleRecording, stopRecording, error: voiceError } = useVoiceInput(
    useCallback((text) => {
      setInput(text)
      textareaRef.current?.focus()
    }, [])
  )

  function handleInputChange(e) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="app">
      <AnimatedBackground />

      {screen === 'room' ? (
        <AccountRoom
          account={accountList.find((a) => a.id === activeAccountId)}
          transactions={roomTransactions[activeAccountId] || []}
          messages={roomMessages[activeAccountId] || []}
          isLoading={isLoading}
          isLoadingTxs={roomTransactions[activeAccountId] === undefined}
          sessionId={sessionId}
          voiceMode={voiceMode}
          onBack={exitRoom}
          onSendMessage={(text) => sendMessage(text)}
          onTransferDone={() => {}}
          onMarkRead={() => setUnreadCounts((prev) => ({ ...prev, [activeAccountId]: 0 }))}
        />
      ) : (
        <AccountListScreen
          accounts={accountList}
          unreadCounts={unreadCounts}
          isLoading={isAccountsLoading}
          ttsEnabled={ttsEnabled}
          onEnterRoom={enterRoom}
          onTtsToggle={() => setTtsEnabled((t) => !t)}
          onReset={handleResetMock}
        />
      )}

      {/* 입출금 알림 오버레이 */}
      {txNotif && (
        <div
          className={`tx-notif-wrap${txNotifVisible ? ' visible' : ''}`}
          onClick={() => {
            if (txNotif.accountId) {
              txNotifTimersRef.current.forEach(clearTimeout)
              txNotifTimersRef.current = []
              setTxNotifVisible(false)
              setTxNotif(null)
              enterRoom(txNotif.accountId)
            }
          }}
          style={{ cursor: txNotif.accountId ? 'pointer' : 'default' }}
        >
          <div className={`tx-notif-inner ${txNotif.isIncome ? 'income' : 'expense'}`}>
            <span className={`tx-notif-badge ${txNotif.isIncome ? 'income' : 'expense'}`}>
              {txNotif.isIncome ? '입금' : '출금'}
            </span>
            <span className="tx-notif-counterpart">{txNotif.counterpart}</span>
            <span className={`tx-notif-amount ${txNotif.isIncome ? 'income' : 'expense'}`}>
              {txNotif.amountFormatted}
            </span>
            {txNotif.aiComment && (
              <span className="tx-notif-comment">{txNotif.aiComment}</span>
            )}
          </div>
        </div>
      )}

      {/* 음성 오버레이 */}
      {voiceMode && (
        <VoiceOverlay
          state={isTtsSpeaking ? 'SPEAKING' : isLoading ? 'PROCESSING' : isRecording ? 'RECORDING' : 'IDLE'}
          onClose={() => {
            setVoiceMode(false)
            setDemoMode(false)
            demoQueueRef.current = []
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            setIsTtsSpeaking(false)
          }}
          onMicTap={toggleRecording}
        />
      )}
    </div>
  )
}

