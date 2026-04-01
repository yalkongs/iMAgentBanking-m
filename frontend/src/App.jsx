import { useState, useEffect, useRef, useCallback } from 'react'
import Message from './components/Message.jsx'
import AnimatedBackground from './components/AnimatedBackground.jsx'
import DrawerBanner from './components/DrawerBanner.jsx'
import VoiceOverlay from './components/VoiceOverlay.jsx'
import AccountListScreen from './components/AccountListScreen.jsx'
import AccountRoom from './components/AccountRoom.jsx'
import EnrollmentModal from './components/EnrollmentModal.jsx'
import { useWebSocket } from './hooks/useWebSocket.js'
import { useVoiceInput } from './hooks/useVoiceInput.js'
import { loadSessionId, loadRoomMessages, saveRoomMessages, clearAllData } from './store/persistence.js'

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
  const [sessionId] = useState(loadSessionId)
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
  const [momentNotif, setMomentNotif] = useState(null)
  const [momentNotifVisible, setMomentNotifVisible] = useState(false)
  const momentNotifTimersRef = useRef([])

  // TTS 활성 여부
  const [ttsEnabled, setTtsEnabled] = useState(false)

  // 마지막 카드 타입 (컨텍스트 숏컷)
  const [lastCardType, setLastCardType] = useState(null)

  // 헬스 인덱스
  const [healthScore, setHealthScore] = useState(null)
  const [healthOpen, setHealthOpen] = useState(false)

  // ── 온보딩 오버레이 (매 새로고침 + 로고 탭 시 표시) ──
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [onboardingFading, setOnboardingFading] = useState(false)

  function dismissOnboarding() {
    setOnboardingFading(true)
    setTimeout(() => { setShowOnboarding(false); setOnboardingFading(false) }, 300)
  }

  function showOnboardingAgain() {
    setOnboardingFading(false)
    setShowOnboarding(true)
  }

  // ── 가입 상태 머신 상수 ──
  const ENROLL_MESSAGES = {
    promo_cma: {
      afterPhone: '인증번호를 보냈어요. 문자 확인해주세요.',
      afterSms: '확인됐어요! 입금할 금액만 정하면 바로 개설돼요.',
      complete: 'iM CMA 계좌가 열렸어요. 오늘 밤부터 이자가 붙기 시작해요.',
      nudge: '가입 중간에 나가셨더라고요. 아직 자리 있어요, 이어서 할까요?',
    },
    promo_term_deposit: {
      afterPhone: '인증번호 보냈어요.',
      afterSms: '확인됐어요! 기간이랑 금액만 정해볼게요.',
      afterTerm: '마지막 단계예요. 공인인증서로 확인해 드릴게요.',
      complete: '12개월 예금 가입됐어요. 만기일에 원금과 이자를 받으실 거예요.',
      nudge: '예금 설정 중간에 나가셨어요. 언제든 이어서 하셔도 돼요.',
    },
    promo_savings: {
      afterPhone: '인증번호 보냈어요.',
      afterSms: '확인됐어요! 지금 넣어둘 금액이 있으면 정해볼게요. 없어도 괜찮아요.',
      complete: '비상금통장이 생겼어요. 쓸 일이 없는 게 제일 좋지만, 있다는 게 중요해요.',
      nudge: '비상금통장 개설 중이었어요. 3분이면 돼요, 이어서 할까요?',
    },
    acc007: {
      afterPhone: '인증번호 보냈어요.',
      afterSms: '본인 확인 완료됐어요! 마지막으로 간단한 정보만 확인할게요.',
      complete: '신용카드 신청이 완료됐어요. 심사 결과는 영업일 기준 3-5일 내 문자로 안내드립니다.',
      nudge: '신용카드 신청 중이었어요. 2분이면 완료돼요, 이어서 할까요?',
    },
  }

  const ENROLL_TOTAL_STEPS = { promo_cma: 3, promo_term_deposit: 4, promo_savings: 3, acc007: 3 }

  // 신규 계좌에 AccountLifeCard 표시용 enriched 필드 계산
  function enrichAccountForLifeCard(acc) {
    if (acc.type === 'cma') {
      return { ...acc, accruedInterest: 0, todayInterest: 0 }
    }
    if (acc.type === 'term_deposit') {
      const now = new Date()
      const open = new Date(acc.openDate || now.toISOString().slice(0, 10))
      const maturity = new Date(acc.maturityDate)
      const totalMs = maturity - open
      const elapsedMs = now - open
      const progressRatio = totalMs > 0 ? Math.max(0, Math.min(1, elapsedMs / totalMs)) : 0
      const daysRemaining = Math.max(0, Math.ceil((maturity - now) / 86400000))
      const expectedInterest = Math.floor(acc.balance * (acc.interestRate / 100) * ((acc.term || 12) / 12))
      const finalAmount = acc.balance + expectedInterest
      return { ...acc, progressRatio, daysRemaining, expectedInterest, finalAmount, accruedInterest: 0 }
    }
    return null  // savings 등 life card 없는 타입
  }

  // ── 계좌 순서 localStorage 유틸 ──
  const ACCOUNT_ORDER_KEY = 'zb-m-account-order'
  function loadAccountOrder() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_ORDER_KEY) || 'null') } catch { return null }
  }
  function saveAccountOrder(accs) {
    try { localStorage.setItem(ACCOUNT_ORDER_KEY, JSON.stringify(accs.map((a) => a.id))) } catch {}
  }
  function applyStoredOrder(fetched) {
    const order = loadAccountOrder()
    if (!order || order.length === 0) return fetched
    const orderMap = new Map(order.map((id, i) => [id, i]))
    return [...fetched].sort((a, b) => {
      const ia = orderMap.has(a.id) ? orderMap.get(a.id) : 9999
      const ib = orderMap.has(b.id) ? orderMap.get(b.id) : 9999
      return ia - ib
    })
  }
  function handleAccountReorder(newOrder) {
    setAccountList(newOrder)
    saveAccountOrder(newOrder)
  }

  // ── 메신저 UI 상태 ──
  const [screen, setScreen] = useState('home')           // 'home' | 'room'
  const [activeAccountId, setActiveAccountId] = useState(null)
  const [accountList, setAccountList] = useState([])
  const [contacts, setContacts] = useState([])
  const [isAccountsLoading, setIsAccountsLoading] = useState(true)
  const [roomTransactions, setRoomTransactions] = useState({})
  const [roomMessages, setRoomMessages] = useState({})   // { [accountId]: Message[] }
  const [roomTxMeta, setRoomTxMeta] = useState({})       // { [accountId]: { page, hasMore, isLoadingMore } }
  const [unreadCounts, setUnreadCounts] = useState({ 'acc001': 3 })   // { [accountId]: number }
  const [typingAccountIds, setTypingAccountIds] = useState(new Set()) // Living Accounts: 타이핑 중인 계좌
  const typingTimeoutsRef = useRef(new Map())                          // 3s 안전망 타이머

  // ── 가입 상태 머신 ──
  const [enrollmentState, setEnrollmentState] = useState({
    productId: null,
    step: 0,
    data: {},
    isOpen: false,
    status: 'idle', // 'idle' | 'in_progress' | 'completed' | 'abandoned'
  })

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const enrollNudgeTimeoutRef = useRef(null)
  const enrollStepInFlightRef = useRef(false)
  const streamingIdRef = useRef(null)
  const prevMsgCountRef = useRef(0)
  // GUI 드릴-다운에서 발생한 메시지를 scope별로 제거하기 위한 ref
  const currentGuiScopeRef = useRef(null)

  // 메신저 라우팅 refs (sendMessage 클로저에서 사용)
  const screenRef = useRef('home')
  const activeAccountIdRef = useRef(null)
  // #12 이체 카드가 어느 계좌방에 속하는지 추적
  const pendingTransferAccountIdRef = useRef(null)

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
  useEffect(() => () => momentNotifTimersRef.current.forEach(clearTimeout), [])
  useEffect(() => () => {
    if (enrollNudgeTimeoutRef.current) clearTimeout(enrollNudgeTimeoutRef.current)
  }, [])

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

  // contacts 로드
  useEffect(() => {
    fetch(`${API_BASE}/api/contacts`)
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
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
      // #12 from_account_id로 정확한 계좌방에 라우팅
      const targetAccountId = event.data?.from_account_id || activeAccountIdRef.current
      pendingTransferAccountIdRef.current = targetAccountId
      const msgId = 'transfer_' + Date.now()
      // #11 중복 방지: 이미 pending이 있으면 새 카드로 교체 (기존 카드 expired 처리)
      setRoomMessages((prev) => {
        const existing = prev[targetAccountId] || []
        const cleaned = existing.map((m) =>
          m.type === 'transfer_pending' ? { ...m, type: 'transfer_expired' } : m
        )
        return { ...prev, [targetAccountId]: [...cleaned, { id: msgId, type: 'transfer_pending', data: event.data }] }
      })
    // TRANSFER_COMPLETE/CANCELLED: handleTransferDone(REST 응답)에서 처리 — WS는 무시
    // TRANSFER_FAILED: 서버측 오류는 TransferCard 인라인 에러로 표시되므로 WS도 무시
    } else if (
      event.type === 'TRANSFER_COMPLETE' ||
      event.type === 'TRANSFER_CANCELLED' ||
      event.type === 'TRANSFER_FAILED'
    ) {
      // no-op: handleTransferDone 콜백이 REST 응답으로 처리
    } else if (event.type === 'TRANSACTION_ALERT') {
      const data = event.data
      const inMatchingRoom =
        screenRef.current === 'room' &&
        activeAccountIdRef.current === data.accountId

      // 거래내역 탭 반영: 이미 로드된 계좌면 맨 앞에 삽입
      if (data.accountId) {
        const today = new Date().toISOString().split('T')[0]
        const newTx = {
          id: 'alert_' + data.alertId,
          date: today,
          amount: data.amount,
          category: data.category,
          counterpart: data.counterpart,
          accountId: data.accountId,
          source: data.source || 'account',
          memo: data.memo || '',
          amountFormatted: data.amountFormatted,
        }
        setRoomTransactions((prev) => {
          if (!prev[data.accountId]) return prev // 아직 로드 안 된 계좌면 스킵
          return { ...prev, [data.accountId]: [newTx, ...prev[data.accountId]] }
        })
        // 계좌 목록 잔액 업데이트
        setAccountList((prev) =>
          prev.map((a) =>
            a.id === data.accountId ? { ...a, balance: (a.balance || 0) + data.amount } : a
          )
        )
      }

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
      // 금융 모먼트 (급여, 카드대금, 납입일) — 어느 화면에서든 상단 팝오버로 표시
      momentNotifTimersRef.current.forEach(clearTimeout)
      momentNotifTimersRef.current = []
      setMomentNotif(event.data)
      const mt1 = setTimeout(() => setMomentNotifVisible(true), 30)
      const mt2 = setTimeout(() => setMomentNotifVisible(false), 6000)
      const mt3 = setTimeout(() => setMomentNotif(null), 6350)
      momentNotifTimersRef.current = [mt1, mt2, mt3]
    } else if (event.type === 'TYPING_START') {
      // Living Accounts: 계좌 타이핑 시작 — AccountListScreen에 점 애니메이션 표시
      const { accountId } = event.data
      setTypingAccountIds((prev) => { const n = new Set(prev); n.add(accountId); return n })
      // 3s 안전망: TYPING_END가 안 오면 자동 제거
      if (typingTimeoutsRef.current.has(accountId)) clearTimeout(typingTimeoutsRef.current.get(accountId))
      const t = setTimeout(() => {
        setTypingAccountIds((prev) => { const n = new Set(prev); n.delete(accountId); return n })
        typingTimeoutsRef.current.delete(accountId)
      }, 3000)
      typingTimeoutsRef.current.set(accountId, t)
    } else if (event.type === 'TYPING_END') {
      // Living Accounts: 계좌 타이핑 종료
      const { accountId } = event.data
      if (typingTimeoutsRef.current.has(accountId)) {
        clearTimeout(typingTimeoutsRef.current.get(accountId))
        typingTimeoutsRef.current.delete(accountId)
      }
      setTypingAccountIds((prev) => { const n = new Set(prev); n.delete(accountId); return n })
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

  // Living Accounts 데모 시퀀스 트리거 (로고 5번 탭)
  const logoTapRef = useRef({ count: 0, timer: null })
  function handleLogoTap() {
    const tap = logoTapRef.current
    tap.count++
    if (tap.timer) clearTimeout(tap.timer)
    if (tap.count >= 5) {
      tap.count = 0
      fetch(`${API_BASE}/api/demo-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {})
    } else {
      tap.timer = setTimeout(() => { tap.count = 0 }, 1500)
    }
  }

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

  // 전체 데이터 초기화 (localStorage + mock + 페이지 리로드)
  async function handleResetAll() {
    clearAllData()
    await fetch(`${API_BASE}/api/reset-mock`, { method: 'POST' }).catch(() => {})
    window.location.reload()
  }

  // roomMessages 변경 시 localStorage에 자동 저장
  useEffect(() => {
    if (screen === 'room' && activeAccountId && roomMessages[activeAccountId]) {
      saveRoomMessages(activeAccountId, roomMessages[activeAccountId])
    }
  }, [screen, activeAccountId, roomMessages])

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
            } else if (data.type === 'ui_card') {
              // 상품 방 room-greeting에서 발송한 ProductPitchCard 등
              setRoomMessages((prev) => ({
                ...prev,
                [accountId]: [
                  ...(prev[accountId] || []).map((m) =>
                    m.id === greetingId ? { ...m, streaming: false } : m
                  ),
                  {
                    id: 'greeting_card_' + Date.now(),
                    type: 'ui_card',
                    cardType: data.cardType,
                    data: data.data,
                  },
                ],
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
      .then((d) => { if (Array.isArray(d.accounts)) setAccountList(applyStoredOrder(d.accounts)) })
      .catch(() => {})
      .finally(() => setIsAccountsLoading(false))
  }, [sessionId])

  // 앱 시작 시 계좌 목록 로드
  useEffect(() => { fetchAccountList() }, [fetchAccountList])

  // ── 상품 추천 카드 탭 → 첫 번째 계좌 방으로 이동 후 AI에게 질문 ──
  function handleProductSuggest(query) {
    const firstAccount = accountList[0]
    if (!firstAccount) return
    enterRoom(firstAccount.id)
    // 약간의 딜레이 후 메시지 전송 (방 입장 애니메이션 후)
    setTimeout(() => sendMessage(query), 300)
  }

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
      fetch(`${API_BASE}/api/account/${accountId}?sessionId=${sessionId}&page=1&limit=20`)
        .then((r) => r.json())
        .then((d) => {
          if (d.recentTransactions) {
            setRoomTransactions((prev) => ({ ...prev, [accountId]: d.recentTransactions }))
            setRoomTxMeta((prev) => ({
              ...prev,
              [accountId]: { page: 1, hasMore: d.pagination?.hasMore ?? false, isLoadingMore: false },
            }))
          }
        })
        .catch(() => {})
    }

    // Living Accounts: 메시지 없을 때만 처리
    if (!roomMessages[accountId] || roomMessages[accountId].length === 0) {
      const stored = loadRoomMessages(accountId)
      if (stored.length > 0) {
        // 이전 대화 복원 + 서버 컨텍스트 재건 (fire-and-forget)
        setRoomMessages((prev) => ({ ...prev, [accountId]: stored }))
        const contextMsgs = stored.slice(-20).map((m) => ({ role: m.role, content: m.text || '' }))
        fetch(`${API_BASE}/api/rebuild-context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, messages: contextMsgs }),
        }).catch(() => {})
      } else {
        fetchRoomGreeting(accountId)
      }
    }
  }

  function exitRoom() {
    currentGuiContextRef.current = null
    setScreen('home')
    fetchAccountList()
    // 슬라이드 아웃 애니메이션(320ms)이 끝난 후 activeAccountId 클리어
    setTimeout(() => setActiveAccountId(null), 350)
  }

  // 거래내역 다음 페이지 로드
  function handleLoadMoreTxs() {
    if (!activeAccountId) return
    const meta = roomTxMeta[activeAccountId]
    if (!meta || !meta.hasMore || meta.isLoadingMore) return

    const nextPage = meta.page + 1
    setRoomTxMeta((prev) => ({
      ...prev,
      [activeAccountId]: { ...meta, isLoadingMore: true },
    }))

    fetch(`${API_BASE}/api/account/${activeAccountId}?sessionId=${sessionId}&page=${nextPage}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (d.recentTransactions) {
          setRoomTransactions((prev) => ({
            ...prev,
            [activeAccountId]: [...(prev[activeAccountId] || []), ...d.recentTransactions],
          }))
          setRoomTxMeta((prev) => ({
            ...prev,
            [activeAccountId]: {
              page: nextPage,
              hasMore: d.pagination?.hasMore ?? false,
              isLoadingMore: false,
            },
          }))
        }
      })
      .catch(() => {
        setRoomTxMeta((prev) => ({
          ...prev,
          [activeAccountId]: { ...meta, isLoadingMore: false },
        }))
      })
  }

  // ── 가입 상태 머신 핸들러 ──
  function injectAiMessage(accountId, text) {
    const msg = {
      id: 'enroll_msg_' + Date.now(),
      role: 'assistant',
      content: text,
      text,
      timestamp: new Date().toISOString(),
    }
    setRoomMessages((prev) => ({
      ...prev,
      [accountId]: [...(prev[accountId] || []), msg],
    }))
  }

  async function handleTransferReady(contactId, amount) {
    const accountId = activeAccountId
    if (!accountId) return
    // #11 이미 pending 이체 카드가 있으면 중단
    const currentMsgs = roomMessages[accountId] || []
    if (currentMsgs.some((m) => m.type === 'transfer_pending')) return

    try {
      const res = await fetch(`${API_BASE}/api/quick-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, contactId, amount }),
      })
      if (!res.ok) return
      const { userText, aiText, pendingTransfer } = await res.json()

      // #12 QTP 경로도 pendingTransferAccountId 설정
      pendingTransferAccountIdRef.current = accountId

      // 1. 사용자 말풍선
      setRoomMessages((prev) => ({
        ...prev,
        [accountId]: [
          ...(prev[accountId] || []),
          { id: 'qt_user_' + Date.now(), role: 'user', text: userText },
        ],
      }))

      // 2. AI 말풍선 (300ms 후)
      await new Promise((r) => setTimeout(r, 300))
      setRoomMessages((prev) => ({
        ...prev,
        [accountId]: [
          ...(prev[accountId] || []),
          { id: 'qt_ai_' + Date.now(), role: 'assistant', text: aiText },
        ],
      }))

      // 3. TransferCard (300ms 후)
      await new Promise((r) => setTimeout(r, 300))
      setRoomMessages((prev) => ({
        ...prev,
        [accountId]: [
          ...(prev[accountId] || []),
          { id: 'qt_card_' + Date.now(), type: 'transfer_pending', data: pendingTransfer },
        ],
      }))
    } catch (err) {
      console.error('quick-transfer failed:', err)
      pendingTransferAccountIdRef.current = null
    }
  }

  // #8 WS 없이 REST 응답으로 영수증/결과 처리
  // #3 금액 미입력 취소: 조용히 사라짐 / 금액 입력 후 취소: 메시지 표시
  function handleTransferDone(confirmed, json, meta) {
    const accountId = pendingTransferAccountIdRef.current || activeAccountId
    pendingTransferAccountIdRef.current = null

    // transfer_pending 카드를 roomMessages에서 제거 (hasPendingTransfer 해제)
    setRoomMessages((prev) => ({
      ...prev,
      [accountId]: (prev[accountId] || []).filter((m) => m.type !== 'transfer_pending'),
    }))

    if (!confirmed) {
      if (meta?.hadAmount) {
        setRoomMessages((prev) => ({
          ...prev,
          [accountId]: [
            ...(prev[accountId] || []),
            { id: 'tr_cancel_' + Date.now(), type: 'transfer_result', success: false, text: '이체가 취소되었습니다.' },
          ],
        }))
      }
      // hadAmount=false면 조용히 카드만 사라짐
      return
    }

    // 이체 성공: REST 응답으로 바로 영수증 주입
    if (json.success && json.result) {
      setRoomMessages((prev) => ({
        ...prev,
        [accountId]: [
          ...(prev[accountId] || []),
          { id: 'tr_done_' + Date.now(), type: 'transfer_receipt', data: json.result },
        ],
      }))
      setLastCardType('transfer_receipt')
      fetchAccountList()
      // 거래내역 탭에도 이체 항목 삽입
      const r = json.result
      const newTx = {
        id: r.transactionId || ('tr_' + Date.now()),
        date: new Date().toISOString().split('T')[0],
        amount: -r.amount,
        category: '송금',
        counterpart: r.to?.name || '',
        accountId,
        source: 'account',
        memo: r.memo || '',
        amountFormatted: '-' + r.amountFormatted,
      }
      setRoomTransactions((prev) => {
        if (!prev[accountId]) return prev
        return { ...prev, [accountId]: [newTx, ...prev[accountId]] }
      })
    }
  }

  function startEnrollment(productId) {
    if (enrollNudgeTimeoutRef.current) {
      clearTimeout(enrollNudgeTimeoutRef.current)
      enrollNudgeTimeoutRef.current = null
    }
    setEnrollmentState({
      productId,
      step: 1,
      data: {},
      isOpen: true,
      status: 'in_progress',
    })
  }

  async function handleEnrollStep(stepData) {
    if (enrollStepInFlightRef.current) return
    enrollStepInFlightRef.current = true

    const { productId, step } = enrollmentState
    const msgs = ENROLL_MESSAGES[productId]
    const totalSteps = ENROLL_TOTAL_STEPS[productId] || 3

    try {
      // Merge step data
      const newData = { ...enrollmentState.data, ...stepData }

      // Close modal first
      setEnrollmentState((prev) => ({ ...prev, isOpen: false, data: newData }))

      // Determine AI message for this step
      let aiText = null
      if (step === 1) aiText = msgs.afterPhone
      else if (step === 2) aiText = msgs.afterSms
      else if (step === 3 && productId === 'promo_term_deposit') aiText = msgs.afterTerm

      if (aiText && activeAccountId) {
        await new Promise((r) => setTimeout(r, 500))
        injectAiMessage(activeAccountId, aiText)
        await new Promise((r) => setTimeout(r, 1200))
      }

      const nextStep = step + 1
      if (nextStep > totalSteps) {
        handleEnrollComplete(newData, productId)
      } else {
        setEnrollmentState((prev) => ({ ...prev, step: nextStep, isOpen: true }))
      }
    } finally {
      enrollStepInFlightRef.current = false
    }
  }

  async function handleEnrollComplete(data, productId) {
    const msgs = ENROLL_MESSAGES[productId]

    try {
      const res = await fetch(`${API_BASE}/api/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, productId, enrollData: data }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || '가입 실패')

      const newAccount = json.account

      // Update accounts list — replace promo with real account
      setAccountList((prev) => prev.map((a) => (a.id === productId ? newAccount : a)))

      // Migrate room messages to new account id
      setRoomMessages((prev) => {
        const updated = { ...prev }
        updated[newAccount.id] = prev[productId] || []
        delete updated[productId]
        return updated
      })

      // Clear promo transactions cache, force fresh fetch for new account
      setRoomTransactions((prev) => {
        const updated = { ...prev }
        delete updated[productId]
        delete updated[newAccount.id]
        return updated
      })
      setRoomTxMeta((prev) => {
        const updated = { ...prev }
        delete updated[productId]
        delete updated[newAccount.id]
        return updated
      })

      // Switch active room to new account
      setActiveAccountId(newAccount.id)

      // Mark enrollment complete
      setEnrollmentState({
        productId: null, step: 0, data: {}, isOpen: false, status: 'completed',
      })

      // Fetch fresh transactions for new account (enrollment transfer included)
      fetch(`${API_BASE}/api/account/${newAccount.id}?sessionId=${sessionId}&page=1&limit=20`)
        .then((r) => r.json())
        .then((d) => {
          if (d.recentTransactions) {
            setRoomTransactions((prev) => ({ ...prev, [newAccount.id]: d.recentTransactions }))
            setRoomTxMeta((prev) => ({
              ...prev,
              [newAccount.id]: { page: 1, hasMore: d.pagination?.hasMore ?? false, isLoadingMore: false },
            }))
          }
        })
        .catch(() => {})

      // Inject completion message after a brief delay
      await new Promise((r) => setTimeout(r, 400))
      injectAiMessage(newAccount.id, msgs.complete)

      // Inject AccountLifeCard as final chat message
      await new Promise((r) => setTimeout(r, 600))
      const enriched = enrichAccountForLifeCard(newAccount)
      if (enriched) {
        setRoomMessages((prev) => ({
          ...prev,
          [newAccount.id]: [...(prev[newAccount.id] || []), {
            id: 'life_card_' + Date.now(),
            type: 'account_life_card',
            data: enriched,
          }],
        }))
      }

    } catch (err) {
      console.error('Enroll failed:', err)
      if (activeAccountId) {
        injectAiMessage(activeAccountId, '일시적 오류가 있어요. 잠시 후 다시 시도해 주세요.')
      }
      setEnrollmentState((prev) => ({ ...prev, isOpen: false, status: 'idle' }))
    }
  }

  function handleEnrollDismiss() {
    const { productId } = enrollmentState
    setEnrollmentState((prev) => ({ ...prev, isOpen: false, status: 'abandoned' }))

    // Re-nudge after 10 minutes (once)
    if (enrollNudgeTimeoutRef.current) clearTimeout(enrollNudgeTimeoutRef.current)
    enrollNudgeTimeoutRef.current = setTimeout(() => {
      enrollNudgeTimeoutRef.current = null
      // Only nudge if still in the same promo room
      if (activeAccountId === productId) {
        const msgs = ENROLL_MESSAGES[productId]
        if (msgs) injectAiMessage(productId, msgs.nudge)
      }
    }, 10 * 60 * 1000)
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
    setRoomTxMeta({})
    setUnreadCounts({ 'acc001': 3 })
    setAlert(null)
    setLeavingEmpty(false)
    setLastCardType(null)
    setIsAccountsLoading(true)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    if (enrollNudgeTimeoutRef.current) {
      clearTimeout(enrollNudgeTimeoutRef.current)
      enrollNudgeTimeoutRef.current = null
    }
    setEnrollmentState({ productId: null, step: 0, data: {}, isOpen: false, status: 'idle' })
    showOnboardingAgain()
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

      <div className={`screen-stack${screen === 'room' ? ' screen-stack--room' : ''}`}>
        <div className="screen-panel screen-panel--home">
          <AccountListScreen
            accounts={accountList}
            unreadCounts={unreadCounts}
            typingAccountIds={typingAccountIds}
            isLoading={isAccountsLoading}
            ttsEnabled={ttsEnabled}
            onEnterRoom={enterRoom}
            onTtsToggle={() => setTtsEnabled((t) => !t)}
            onReset={handleResetAll}
            onShowOnboarding={showOnboardingAgain}
            onProductSuggest={handleProductSuggest}
            onReorder={handleAccountReorder}
            onLogoTap={handleLogoTap}
          />
        </div>
        <div className="screen-panel screen-panel--room">
          <AccountRoom
            account={accountList.find((a) => a.id === activeAccountId)}
            contacts={contacts}
            transactions={roomTransactions[activeAccountId] || []}
            messages={roomMessages[activeAccountId] || []}
            isLoading={isLoading}
            isLoadingTxs={roomTransactions[activeAccountId] === undefined}
            sessionId={sessionId}
            voiceMode={voiceMode}
            onBack={exitRoom}
            onSendMessage={(text) => sendMessage(text)}
            onTransferDone={handleTransferDone}
            onMarkRead={() => setUnreadCounts((prev) => ({ ...prev, [activeAccountId]: 0 }))}
            txMeta={roomTxMeta[activeAccountId]}
            onLoadMoreTxs={handleLoadMoreTxs}
            onStartEnrollment={startEnrollment}
            promoIds={new Set(accountList.filter((a) => a.isPromo).map((a) => a.id))}
            onTransferReady={handleTransferReady}
          />
        </div>
      </div>

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

      {/* 금융 모먼트 알림 오버레이 (급여·카드대금·납입일) */}
      {momentNotif && (
        <div className={`tx-notif-wrap${momentNotifVisible ? ' visible' : ''}`}>
          <div className="tx-notif-inner moment">
            <span className="tx-notif-badge moment">알림</span>
            <span className="tx-notif-counterpart">{momentNotif.title}</span>
            {momentNotif.amountFormatted && (
              <span className="tx-notif-amount moment">{momentNotif.amountFormatted}</span>
            )}
          </div>
        </div>
      )}

      {/* 온보딩 오버레이 */}
      {showOnboarding && (
        <div
          className={`onboarding-overlay${onboardingFading ? ' fading' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-headline"
        >
          <div className="onboarding-content">
            <img src="/imbank-mark.png" alt="iM뱅크" className="onboarding-logo" />
            <h1 id="onboarding-headline" className="onboarding-headline">계좌가 먼저 말을 걸어요</h1>
            <p className="onboarding-sub">iM뱅크 AI 금융 어시스턴트</p>
            <ul className="onboarding-features">
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>각 계좌를 탭하면 AI 어시스턴트와 대화할 수 있어요</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span>입출금이 생기면 실시간으로 알려드려요</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                <span>음성으로도 이체, 조회, 분석이 가능해요</span>
              </li>
            </ul>
            <button
              className="onboarding-cta"
              onClick={dismissOnboarding}
              autoFocus
            >
              시작하기
            </button>
            <button
              className="onboarding-reset-btn"
              onClick={handleResetAll}
            >
              데이터 초기화
            </button>
          </div>
        </div>
      )}

      {/* 가입 모달 */}
      {enrollmentState.isOpen && (
        <EnrollmentModal
          state={enrollmentState}
          accounts={accountList}
          onStepComplete={handleEnrollStep}
          onDismiss={handleEnrollDismiss}
        />
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

