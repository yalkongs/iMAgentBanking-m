import { useState, useMemo } from 'react'
import QuickTransferRecipientRow from './QuickTransferRecipientRow.jsx'

const TABS = ['자주', '최근', '연락처']
const LS_KEY = 'zb-m-qtp-collapsed'

function calcStats(transactions, contacts) {
  const contactNames = new Set(contacts.map((c) => c.realName))
  const outbound = transactions.filter(
    (t) => t.amount < 0 && contactNames.has(t.counterpart)
  )

  // 수신자별 빈도
  const freqMap = {}
  outbound.forEach((t) => {
    freqMap[t.counterpart] = (freqMap[t.counterpart] || 0) + 1
  })

  // 수신자별 최근/최다 금액
  const amountStats = {}
  contacts.forEach((c) => {
    const txs = outbound
      .filter((t) => t.counterpart === c.realName)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    const recentAmount = txs[0] ? Math.abs(txs[0].amount) : null

    const amtFreq = {}
    txs.forEach((t) => {
      const amt = Math.abs(t.amount)
      amtFreq[amt] = (amtFreq[amt] || 0) + 1
    })
    const top = Object.entries(amtFreq).sort((a, b) => b[1] - a[1])[0]
    const frequentAmount = top ? Number(top[0]) : null

    amountStats[c.realName] = { recentAmount, frequentAmount }
  })

  return { freqMap, amountStats }
}

export default function QuickTransferPanel({ contacts, transactions, onTransferReady }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true' } catch { return false }
  })
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')

  const { freqMap, amountStats } = useMemo(
    () => calcStats(transactions, contacts),
    [transactions, contacts]
  )

  // 자주 탭: 빈도 있는 contacts를 내림차순 정렬, 최대 8명
  const frequentList = useMemo(
    () =>
      contacts
        .filter((c) => (freqMap[c.realName] || 0) > 0)
        .sort((a, b) => (freqMap[b.realName] || 0) - (freqMap[a.realName] || 0))
        .slice(0, 8),
    [contacts, freqMap]
  )

  // 최근 탭: 최근 이체 기준, 수신자 중복 제거, 최대 10명
  const recentList = useMemo(() => {
    const contactNames = new Set(contacts.map((c) => c.realName))
    const seen = new Set()
    return transactions
      .filter((t) => t.amount < 0 && contactNames.has(t.counterpart))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((t) => {
        if (seen.has(t.counterpart)) return false
        seen.add(t.counterpart)
        return true
      })
      .slice(0, 10)
      .map((t) => contacts.find((c) => c.realName === t.counterpart))
      .filter(Boolean)
  }, [transactions, contacts])

  // 연락처 탭: 검색 필터 + 가나다 정렬
  const filteredContacts = useMemo(() => {
    const q = search.trim()
    return contacts
      .filter((c) => !q || c.realName.includes(q))
      .sort((a, b) => a.realName.localeCompare(b.realName, 'ko'))
  }, [contacts, search])

  const listForTab = [frequentList, recentList, filteredContacts][activeTab]

  // Collapsed 미리보기 (상위 3명 이름)
  const previewNames = frequentList.slice(0, 3).map((c) => c.realName)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(LS_KEY, String(next)) } catch {}
  }

  function renderRow(contact) {
    const stats = amountStats[contact.realName] || {}
    return (
      <QuickTransferRecipientRow
        key={contact.id}
        contact={contact}
        recentAmount={stats.recentAmount ?? null}
        frequentAmount={stats.frequentAmount ?? null}
        onTransfer={(amount) => {
          setCollapsed(true)
          try { localStorage.setItem(LS_KEY, 'true') } catch {}
          onTransferReady(contact.id, amount)
        }}
      />
    )
  }

  return (
    <div className="qtp-panel">
      {/* 헤더 (항상 표시) */}
      <div className="qtp-header" onClick={toggle} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }} role="button" tabIndex={0}>
        <div className="qtp-header-left">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <polyline points="19 12 12 19 5 12"/>
            <polyline points="19 5 12 12 5 5"/>
          </svg>
          <span className="qtp-header-title">빠른 송금</span>
        </div>
        {collapsed && previewNames.length > 0 && (
          <span className="qtp-preview">
            {previewNames.join(' · ')}
            {frequentList.length > 3 && ` +${frequentList.length - 3}명`}
          </span>
        )}
        <svg
          className={`qtp-chevron${collapsed ? '' : ' qtp-chevron--up'}`}
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Expanded 바디 */}
      {!collapsed && (
        <div className="qtp-body">
          {/* 탭 */}
          <div className="qtp-tabs" role="tablist">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === i}
                className={`qtp-tab${activeTab === i ? ' qtp-tab--active' : ''}`}
                onClick={() => { setActiveTab(i); setSearch('') }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 연락처 탭 검색 */}
          {activeTab === 2 && (
            <div className="qtp-search-wrap">
              <input
                className="qtp-search"
                type="text"
                placeholder="이름으로 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* 수신자 목록 */}
          <div className="qtp-list">
            {listForTab.length === 0 ? (
              <div className="qtp-empty">
                {activeTab === 0
                  ? '아직 이체 내역이 없어요'
                  : activeTab === 1
                  ? '최근 이체 내역이 없어요'
                  : search ? '검색 결과가 없어요' : '연락처가 없어요'}
              </div>
            ) : (
              listForTab.map(renderRow)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
