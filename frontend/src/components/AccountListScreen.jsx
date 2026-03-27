import { useState } from 'react'

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

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function SkeletonItem() {
  return (
    <div className="account-list-item skeleton-item" aria-hidden="true">
      <div className="account-avatar skeleton-avatar" />
      <div className="account-list-item-body">
        <div className="account-list-item-top">
          <div className="skeleton-line" style={{ width: '100px', height: '14px' }} />
          <div className="skeleton-line" style={{ width: '70px', height: '13px' }} />
        </div>
        <div className="account-list-item-bottom">
          <div className="skeleton-line" style={{ width: '140px', height: '12px', marginTop: '4px' }} />
        </div>
      </div>
    </div>
  )
}

export default function AccountListScreen({
  accounts,
  unreadCounts,
  isLoading,
  ttsEnabled,
  onEnterRoom,
  onTtsToggle,
  onReset,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="account-list-screen" onClick={() => menuOpen && setMenuOpen(false)}>
      <div className="account-list-header">
        <div>
          <div className="account-list-title">iM뱅크</div>
          {!isLoading && (
            <div className="account-list-total">
              총 {totalBalance.toLocaleString('ko-KR')}원
            </div>
          )}
        </div>
        <div className="account-list-menu-wrap">
          <button
            className="account-list-menu-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            aria-label="메뉴"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="account-list-dropdown" onClick={(e) => e.stopPropagation()}>
              <button
                className="dropdown-item"
                onClick={() => { onTtsToggle?.(); setMenuOpen(false) }}
              >
                {ttsEnabled ? '음성 끄기' : '음성 켜기'}
              </button>
              <button
                className="dropdown-item"
                onClick={() => { onReset?.(); setMenuOpen(false) }}
              >
                초기화
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="account-list-items">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => <SkeletonItem key={i} />)
          : accounts.map((acc) => {
              const cfg = TYPE_CONFIG[acc.type] || { color: '#6B7280', label: acc.type }
              const unread = unreadCounts?.[acc.id] || 0
              const last = acc.lastTransaction

              return (
                <button
                  key={acc.id}
                  className="account-list-item"
                  onClick={() => onEnterRoom(acc.id)}
                >
                  <div
                    className="account-avatar"
                    style={{ background: cfg.color }}
                  >
                    {ICONS[acc.type] || ICONS.checking}
                  </div>

                  <div className="account-list-item-body">
                    <div className="account-list-item-top">
                      <span className="account-list-name">{acc.name}</span>
                      <span className="account-list-balance">{acc.balanceFormatted}</span>
                    </div>
                    <div className="account-list-item-bottom">
                      <span className="account-list-preview">
                        {last
                          ? `${last.counterpart} ${last.amountFormatted}`
                          : cfg.label}
                      </span>
                      <span className="account-list-time">
                        {last ? formatDateShort(last.date) : ''}
                      </span>
                    </div>
                  </div>

                  {unread > 0 && (
                    <div className="unread-badge">{unread}</div>
                  )}
                </button>
              )
            })}
      </div>
    </div>
  )
}
