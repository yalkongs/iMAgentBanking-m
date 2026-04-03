import { useState, useRef, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

// ── Whisper 폴백용 유틸 ──
function getSupportedMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

function mimeToExt(mimeType) {
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}

const hasSpeechAPI = typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition)

export function useVoiceInput(onTranscript) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)

  // SpeechRecognition 객체를 한 번만 생성하고 재사용한다.
  // Chrome/Arc은 매 녹음마다 new를 하면 이전 audio session과 충돌해 탭이 크래시된다.
  const recognitionRef = useRef(null)
  const activeRef = useRef(false) // 의도적으로 녹음 중인지 추적

  // onTranscript는 ref로 유지 — recognition 핸들러가 항상 최신 콜백을 호출하도록
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])

  // Whisper 폴백용
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  // ── SpeechRecognition 초기화 (최초 1회) ──
  const getRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'ko-KR'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      if (!activeRef.current) return
      let interim = ''
      let final = ''
      for (const result of event.results) {
        if (result.isFinal) final += result[0].transcript
        else interim += result[0].transcript
      }
      onTranscriptRef.current(final || interim)
    }

    recognition.onend = () => {
      // 의도적으로 녹음 중이었다면 자연 종료 — 상태 업데이트
      if (activeRef.current) {
        activeRef.current = false
        setIsRecording(false)
      }
      // stopStreaming이 호출된 경우 activeRef는 이미 false이므로 아무것도 하지 않음
    }

    recognition.onerror = (event) => {
      if (!activeRef.current) return
      activeRef.current = false
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('음성 인식 오류: ' + event.error)
      }
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    return recognition
  }, [])

  // ── 1. Web Speech API — 실시간 스트리밍 ──
  const startStreaming = useCallback(() => {
    setError(null)
    const recognition = getRecognition()
    activeRef.current = true
    try {
      recognition.start()
      setIsRecording(true)
    } catch (err) {
      // InvalidStateError: 이미 실행 중이거나 직전 세션이 미완료 상태
      activeRef.current = false
      setError('음성 인식을 시작할 수 없습니다.')
      setIsRecording(false)
    }
  }, [getRecognition])

  const stopStreaming = useCallback(() => {
    activeRef.current = false
    setIsRecording(false)
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (_) {}
    }
  }, [])

  // ── 2. Whisper 폴백 — 녹음 후 전송 (Web Speech API 미지원 브라우저) ──
  const startWhisper = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const actualMime = mediaRecorder.mimeType || mimeType || 'audio/webm'
        const ext = mimeToExt(actualMime)
        const blob = new Blob(chunksRef.current, { type: actualMime })
        const formData = new FormData()
        formData.append('audio', blob, `audio.${ext}`)

        try {
          const res = await fetch(`${API_BASE}/api/whisper`, { method: 'POST', body: formData })
          const data = await res.json()
          if (data.text) onTranscriptRef.current(data.text)
          else setError('음성 인식 결과가 없습니다.')
        } catch (err) {
          setError('음성 인식 실패: ' + err.message)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError('마이크 접근 실패: ' + err.message)
    }
  }, [])

  const stopWhisper = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      if (hasSpeechAPI) stopStreaming()
      else stopWhisper()
    } else {
      if (hasSpeechAPI) startStreaming()
      else startWhisper()
    }
  }, [isRecording, startStreaming, stopStreaming, startWhisper, stopWhisper])

  const stopRecording = useCallback(() => {
    if (hasSpeechAPI) stopStreaming()
    else stopWhisper()
  }, [stopStreaming, stopWhisper])

  return { isRecording, toggleRecording, stopRecording, error }
}
