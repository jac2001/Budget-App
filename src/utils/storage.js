const TRANSACTIONS_KEY = 'budget_transactions'
const BUDGETS_KEY = 'budget_limits'

export function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveTransactions(transactions) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
}

export function loadBudgets() {
  try {
    return JSON.parse(localStorage.getItem(BUDGETS_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveBudgets(budgets) {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets))
}

export function clearAll() {
  localStorage.removeItem(TRANSACTIONS_KEY)
  localStorage.removeItem(BUDGETS_KEY)
}
