import { useMemo, useState } from 'react'

const STATUS_LABELS = { pending: 'Pending', submitted: 'Submitted', reimbursed: 'Reimbursed' }
const STATUS_COLORS = { pending: '#f59e0b', submitted: '#3b82f6', reimbursed: '#10b981' }

function getMonthKey(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 7)
}

function formatMonth(key) {
  const [year, month] = key.split('-')
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function exportCSV(transactions) {
  const rows = [
    ['Date', 'Description', 'Category', 'Source', 'Amount', 'Status'],
    ...transactions.map(t => [
      t.date, t.description, t.category, t.source,
      Math.abs(t.amount).toFixed(2), STATUS_LABELS[t.reimbursementStatus] || 'Pending'
    ])
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `work-expenses-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function WorkExpenses({ transactions, onUpdateStatus }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')

  const workTxns = useMemo(() =>
    transactions.filter(t => t.workExpense),
    [transactions]
  )

  const months = useMemo(() => {
    const keys = new Set(workTxns.map(t => getMonthKey(t.date)).filter(Boolean))
    return ['all', ...[...keys].sort().reverse()]
  }, [workTxns])

  const filtered = useMemo(() => {
    let list = [...workTxns]
    if (filterStatus !== 'all') list = list.filter(t => (t.reimbursementStatus || 'pending') === filterStatus)
    if (filterMonth !== 'all') list = list.filter(t => getMonthKey(t.date) === filterMonth)
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [workTxns, filterStatus, filterMonth])

  const monthlyTotals = useMemo(() => {
    const map = {}
    for (const t of workTxns) {
      const key = getMonthKey(t.date)
      if (!map[key]) map[key] = { total: 0, pending: 0, submitted: 0, reimbursed: 0 }
      const amt = Math.abs(t.amount)
      map[key].total += amt
      map[key][t.reimbursementStatus || 'pending'] += amt
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [workTxns])

  const totalPending = workTxns.filter(t => (t.reimbursementStatus || 'pending') === 'pending').reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalSubmitted = workTxns.filter(t => t.reimbursementStatus === 'submitted').reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalReimbursed = workTxns.filter(t => t.reimbursementStatus === 'reimbursed').reduce((s, t) => s + Math.abs(t.amount), 0)

  if (!workTxns.length) {
    return (
      <div className="card">
        <h2>Work Expenses</h2>
        <p className="empty-msg">No work expenses yet. Mark transactions as work expenses from the Transactions tab.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="summary-cards" style={{ marginBottom: 20 }}>
        <div className="summary-card" style={{ borderColor: '#f59e0b' }}>
          <div className="summary-label">Pending Reimbursement</div>
          <div className="summary-value" style={{ color: '#f59e0b' }}>${totalPending.toFixed(2)}</div>
          <div className="summary-sub">{workTxns.filter(t => (t.reimbursementStatus || 'pending') === 'pending').length} expenses</div>
        </div>
        <div className="summary-card" style={{ borderColor: '#3b82f6' }}>
          <div className="summary-label">Submitted</div>
          <div className="summary-value" style={{ color: '#3b82f6' }}>${totalSubmitted.toFixed(2)}</div>
          <div className="summary-sub">{workTxns.filter(t => t.reimbursementStatus === 'submitted').length} expenses</div>
        </div>
        <div className="summary-card" style={{ borderColor: '#10b981' }}>
          <div className="summary-label">Reimbursed</div>
          <div className="summary-value" style={{ color: '#10b981' }}>${totalReimbursed.toFixed(2)}</div>
          <div className="summary-sub">{workTxns.filter(t => t.reimbursementStatus === 'reimbursed').length} expenses</div>
        </div>
      </div>

      {monthlyTotals.length > 0 && (
        <div className="card">
          <h3>Monthly Breakdown</h3>
          <div className="table-wrap">
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total</th>
                  <th>Pending</th>
                  <th>Submitted</th>
                  <th>Reimbursed</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTotals.map(([key, vals]) => (
                  <tr key={key}>
                    <td>{formatMonth(key)}</td>
                    <td><strong>${vals.total.toFixed(2)}</strong></td>
                    <td style={{ color: '#f59e0b' }}>${vals.pending.toFixed(2)}</td>
                    <td style={{ color: '#3b82f6' }}>${vals.submitted.toFixed(2)}</td>
                    <td style={{ color: '#10b981' }}>${vals.reimbursed.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Expenses <span className="badge">{filtered.length}</span></h3>
          <button className="btn-save" onClick={() => exportCSV(filtered)}>Export CSV</button>
        </div>

        <div className="filters" style={{ marginBottom: 14 }}>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="filter-select">
            {months.map(m => (
              <option key={m} value={m}>{m === 'all' ? 'All Months' : formatMonth(m)}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="reimbursed">Reimbursed</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td className="date-cell">{t.date}</td>
                  <td className="desc-cell" title={t.description}>{t.description}</td>
                  <td>{t.category}</td>
                  <td className="amount-cell negative">${Math.abs(t.amount).toFixed(2)}</td>
                  <td>
                    <select
                      value={t.reimbursementStatus || 'pending'}
                      onChange={e => onUpdateStatus(t.id, e.target.value)}
                      className="status-select"
                      style={{ color: STATUS_COLORS[t.reimbursementStatus || 'pending'] }}
                    >
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="reimbursed">Reimbursed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
