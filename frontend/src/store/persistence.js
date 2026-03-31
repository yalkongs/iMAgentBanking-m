const SESSION_KEY = 'zb-m-session-id'
const roomKey = (id) => `zb-m-room-${id}`
const MAX_MESSAGES = 50

/** localStorage에서 sessionId 로드. 없으면 신규 생성 후 저장. */
export function loadSessionId() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) return stored
    const id = 'sess_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return 'sess_' + Math.random().toString(36).slice(2, 10)
  }
}

/** 방별 메시지 로드. 파싱 실패 시 [] 반환. */
export function loadRoomMessages(accountId) {
  try {
    const raw = localStorage.getItem(roomKey(accountId))
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/**
 * 방별 메시지 저장.
 * 직렬화 가능한 메시지(텍스트, 스트리밍 완료)만 최근 50개 보존.
 */
export function saveRoomMessages(accountId, msgs) {
  try {
    const serializable = msgs.filter(
      (m) =>
        !m.streaming &&
        ((m.role === 'user' && typeof m.text === 'string') ||
          (m.role === 'assistant' && m.type === 'text' && typeof m.text === 'string'))
    )
    localStorage.setItem(roomKey(accountId), JSON.stringify(serializable.slice(-MAX_MESSAGES)))
  } catch { /* storage full 등 — silent */ }
}

/**
 * zb-m-* 키 전체 삭제 (초기화).
 * sessionId도 삭제되므로 reload 후 신규 생성된다.
 */
export function clearAllData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('zb-m-'))
      .forEach((k) => localStorage.removeItem(k))
  } catch { /* silent */ }
}
