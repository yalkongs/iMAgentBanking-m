const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 4l9 8"/>
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"/>
  </svg>
)

const GridIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1.5"/>
    <rect x="13" y="3" width="8" height="8" rx="1.5"/>
    <rect x="3" y="13" width="8" height="8" rx="1.5"/>
    <rect x="13" y="13" width="8" height="8" rx="1.5"/>
  </svg>
)

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

export default function BottomTabBar({ activeTab, onTabChange, isInsideRoom }) {
  const tabs = [
    { id: 'accounts', label: '계좌', Icon: HomeIcon },
    { id: 'services', label: '서비스', Icon: GridIcon },
    { id: 'my', label: 'MY', Icon: UserIcon },
  ]

  return (
    <div className={`bottom-tab-bar${isInsideRoom ? ' bottom-tab-bar--hidden' : ''}`}>
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`bottom-tab-btn${activeTab === id ? ' bottom-tab-btn--active' : ''}`}
          onClick={() => onTabChange(id)}
          aria-label={label}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  )
}
