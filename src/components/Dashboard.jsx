import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#64748b',
]

function getMonthKey(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(key) {
  const [year, month] = key.split('-')
  return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
}

export default function Dashboard({ transactions, budgets }) {
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const currentMonthTxns = useMemo(() =>
    transactions.filter(t => getMonthKey(t.date) === currentMonthKey && t.amount < 0 && !t.workExpense),
    [transactions, currentMonthKey]
  )

  const spendByCategory = useMemo(() => {
    const map = {}
    for (const t of currentMonthTxns) {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount)
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  }, [currentMonthTxns])

  const totalSpendThisMonth = currentMonthTxns.reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalIncomeThisMonth = transactions
    .filter(t => getMonthKey(t.date) === currentMonthKey && t.category === 'Income')
    .reduce((s, t) => s + t.amount, 0)

  // Last 6 months bar chart
  const monthlyData = useMemo(() => {
    const keys = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return keys.map(key => {
      const spend = transactions
        .filter(t => getMonthKey(t.date) === key && t.amount < 0 && !t.workExpense)
        .reduce((s, t) => s + Math.abs(t.amount), 0)
      const income = transactions
        .filter(t => getMonthKey(t.date) === key && t.category === 'Income')
        .reduce((s, t) => s + t.amount, 0)
      return { month: formatMonth(key), spend: parseFloat(spend.toFixed(2)), income: parseFloat(income.toFixed(2)) }
    })
  }, [transactions])

  // Budget progress
  const budgetProgress = useMemo(() => {
    return Object.entries(budgets).map(([cat, limit]) => {
      const spent = currentMonthTxns
        .filter(t => t.category === cat)
        .reduce((s, t) => s + Math.abs(t.amount), 0)
      const pct = Math.min((spent / limit) * 100, 100)
      return { cat, limit, spent: parseFloat(spent.toFixed(2)), pct }
    })
  }, [budgets, currentMonthTxns])

  if (!transactions.length) {
    return (
      <div className="card">
        <h2>Dashboard</h2>
        <p className="empty-msg">Import transactions to see your spending overview.</p>
      </div>
    )
  }

  const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <div className="summary-card spend">
          <div className="summary-label">Spent this month</div>
          <div className="summary-value">${totalSpendThisMonth.toFixed(2)}</div>
          <div className="summary-sub">{currentMonthLabel}</div>
        </div>
        <div className="summary-card income">
          <div className="summary-label">Income this month</div>
          <div className="summary-value">${totalIncomeThisMonth.toFixed(2)}</div>
          <div className="summary-sub">{currentMonthLabel}</div>
        </div>
        <div className="summary-card net" style={{ borderColor: totalIncomeThisMonth - totalSpendThisMonth >= 0 ? '#16a34a' : '#dc2626' }}>
          <div className="summary-label">Net this month</div>
          <div className="summary-value" style={{ color: totalIncomeThisMonth - totalSpendThisMonth >= 0 ? '#16a34a' : '#dc2626' }}>
            ${(totalIncomeThisMonth - totalSpendThisMonth).toFixed(2)}
          </div>
          <div className="summary-sub">{currentMonthLabel}</div>
        </div>
        <div className="summary-card total">
          <div className="summary-label">Total transactions</div>
          <div className="summary-value">{transactions.length}</div>
          <div className="summary-sub">all time</div>
        </div>
      </div>

      {budgetProgress.length > 0 && (
        <div className="card">
          <h3>Budget Progress — {currentMonthLabel}</h3>
          <div className="budget-progress-list">
            {budgetProgress.map(({ cat, limit, spent, pct }) => (
              <div key={cat} className="budget-progress-item">
                <div className="bp-header">
                  <span>{cat}</span>
                  <span className={spent > limit ? 'over-budget' : ''}>
                    ${spent.toFixed(2)} / ${limit.toFixed(0)}
                  </span>
                </div>
                <div className="bp-bar-bg">
                  <div
                    className={`bp-bar-fill ${pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {spent > limit && (
                  <div className="bp-over-msg">Over by ${(spent - limit).toFixed(2)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="charts-row">
        {spendByCategory.length > 0 && (
          <div className="card chart-card">
            <h3>Spending by Category — {currentMonthLabel}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={spendByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {spendByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card chart-card">
          <h3>Monthly Spending (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => `$${v.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="spend" name="Spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
