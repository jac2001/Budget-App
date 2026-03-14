import { useState } from 'react'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Housing',
  'Utilities', 'Health', 'Fitness', 'Transfers', 'Travel', 'Other',
]

export default function BudgetManager({ budgets, onSaveBudget }) {
  const [editing, setEditing] = useState({})

  function handleChange(cat, value) {
    setEditing(prev => ({ ...prev, [cat]: value }))
  }

  function handleSave(cat) {
    const val = parseFloat(editing[cat])
    if (!isNaN(val) && val >= 0) {
      onSaveBudget(cat, val)
    }
    setEditing(prev => { const next = { ...prev }; delete next[cat]; return next })
  }

  function handleRemove(cat) {
    onSaveBudget(cat, null)
  }

  return (
    <div className="card">
      <h2>Monthly Budgets</h2>
      <p className="section-desc">Set spending limits per category. The dashboard will show progress against these limits.</p>
      <div className="budget-grid">
        {CATEGORIES.map(cat => {
          const current = budgets[cat]
          const isEditing = cat in editing
          return (
            <div key={cat} className={`budget-item ${current != null ? 'has-budget' : ''}`}>
              <span className="budget-cat">{cat}</span>
              <div className="budget-controls">
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="Amount"
                      value={editing[cat]}
                      onChange={e => handleChange(cat, e.target.value)}
                      className="budget-input"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(cat); if (e.key === 'Escape') setEditing(prev => { const next = { ...prev }; delete next[cat]; return next }) }}
                    />
                    <button className="btn-save" onClick={() => handleSave(cat)}>Save</button>
                  </>
                ) : (
                  <>
                    <span className="budget-amount">
                      {current != null ? `$${current.toFixed(0)}/mo` : 'No limit'}
                    </span>
                    <button className="btn-edit" onClick={() => setEditing(prev => ({ ...prev, [cat]: current ?? '' }))}>
                      {current != null ? 'Edit' : 'Set'}
                    </button>
                    {current != null && (
                      <button className="btn-remove" onClick={() => handleRemove(cat)}>Remove</button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
