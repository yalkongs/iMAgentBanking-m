export default function MyScreen({ sessionId, ttsEnabled, onTtsToggle, onReset, buildTime }) {
  const maskedSession = sessionId
    ? sessionId.slice(0, 8) + '••••'
    : '—'

  return (
    <div className="my-screen">
      <div className="my-screen-header">MY</div>
      <div className="my-screen-scroll">
        <div className="my-section">
          <div className="my-row">
            <span>세션</span>
            <span className="my-row-label">{maskedSession}</span>
          </div>
          <div className="my-row" style={{ justifyContent: 'space-between' }}>
            <span>음성 안내 (TTS)</span>
            <button
              onClick={onTtsToggle}
              style={{
                background: ttsEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '12px',
                padding: '4px 14px',
                color: ttsEnabled ? '#0D0F1A' : '#94A3B8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {ttsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="my-divider" />

        <button className="my-action-btn my-action-btn--danger" onClick={onReset}>
          데이터 초기화
        </button>

        {buildTime && (
          <div className="my-build-time">빌드: {buildTime}</div>
        )}
      </div>
    </div>
  )
}
