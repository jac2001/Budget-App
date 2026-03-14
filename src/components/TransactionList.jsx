import { useState, useMemo } from 'react'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Housing',
  'Utilities', 'Health', 'Fitness', 'Transfers', 'Travel', 'Income', 'Other',
]

function getMonthOptions(transactions) {
  const months = new Set(
    transactions.map(t => t.date ? t.date.slice(0, 7) : null).filter(Boolean)
  )
  return ['All', ...[...months].sort().reverse()]
}

function formatMonthLabel(key) {
  if (key === 'All') return 'All Months'
  const [year, month] = key.split('-')
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

export default function TransactionList({ transactions, onUpdateCategory, onDeleteTransaction, onToggleWorkExpense }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [filterSource, setFilterSource] = useState('All')
  const [filterMonth, setFilterMonth] = useState('All')
  const [filterWork, setFilterWork] = useState('all')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const sources = useMemo(() => ['All', ...new Set(transactions.map(t => t.source))], [transactions])
  const monthOptions = useMemo(() => getMonthOptions(transactions), [transactions])

  const filtered = useMemo(() => {
    let list = [...transactions]
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(t => (t.description || '').toLowerCase().includes(q))
    if (filterCat !== 'All') list = list.filter(t => t.category === filterCat)
    if (filterSource !== 'All') list = list.filter(t => t.source === filterSource)
    if (filterMonth !== 'All') list = list.filter(t => (t.date || '').startsWith(filterMonth))
    if (filterWork === 'yes') list = list.filter(t => t.workExpense)
    if (filterWork === 'no') list = list.filter(t => !t.workExpense)
    list.sort((a, b) => {
      let av = a[sortField], bv = b[sortField]
      if (sortField === 'amount') { av = Math.abs(av); bv = Math.abs(bv) }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [transactions, search, filterCat, filterSource, filterMonth, sortField, sortDir])

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const totalSpend = filtered
    .filter(t => t.category !== 'Income' && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalIncome = filtered
    .filter(t => t.category === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)

  if (!transactions.length) {
    return (
      <div className="card">
        <h2>Transactions</h2>
        <p className="empty-msg">No transactions yet. Import a CSV to get started.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Transactions <span className="badge">{filtered.length}</span></h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="filter-input"
        />
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="filter-select">
          {monthOptions.map(m => (
            <option key={m} value={m}>{formatMonthLabel(m)}</option>
          ))}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="filter-select">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="filter-select">
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterWork} onChange={e => setFilterWork(e.target.value)} className="filter-select">
          <option value="all">All Expenses</option>
          <option value="yes">💼 Work Only</option>
          <option value="no">Personal Only</option>
        </select>
      </div>

      <div className="totals-row">
        <span className="total-chip spend">Spending: ${totalSpend.toFixed(2)}</span>
        <span className="total-chip income">Income: ${totalIncome.toFixed(2)}</span>
        <span className="total-chip net" style={{ color: totalIncome - totalSpend >= 0 ? '#16a34a' : '#dc2626' }}>
          Net: ${(totalIncome - totalSpend).toFixed(2)}
        </span>
      </div>

      <div className="table-wrap">
        <table className="txn-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('date')} className="sortable">
                Date {sortField === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Description</th>
              <th>Category</th>
              <th>Source</th>
              <th onClick={() => toggleSort('amount')} className="sortable">
                Amount {sortField === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th title="Work Expense">💼</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className={t.amount >= 0 ? 'income-row' : ''}>
                <td className="date-cell">{t.date}</td>
                <td className="desc-cell" title={t.description}>{t.description}</td>
                <td>
                  <select
                    value={t.category}
                    onChange={e => onUpdateCategory(t.id, e.target.value)}
                    className="cat-select"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td><span className="source-chip">{t.source}</span></td>
                <td className={`amount-cell ${t.amount >= 0 ? 'positive' : 'negative'}`}>
                  {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!t.workExpense}
                    onChange={() => onToggleWorkExpense(t.id)}
                    title="Mark as work expense"
                    className="work-checkbox"
                  />
                </td>
                <td>
                  <button className="delete-btn" onClick={() => onDeleteTransaction(t.id)} title="Delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
