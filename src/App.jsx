import { useState, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import TransactionList from './components/TransactionList'
import Dashboard from './components/Dashboard'
import BudgetManager from './components/BudgetManager'
import WorkExpenses from './components/WorkExpenses'
import { loadTransactions, saveTransactions, loadBudgets, saveBudgets, clearAll } from './utils/storage'
import { guessCategory, mapBankCategory } from './utils/csvParser'
import './App.css'

const TABS = ['Dashboard', 'Transactions', 'Work Expenses', 'Budgets', 'Import']

export default function App() {
  const [transactions, setTransactions] = useState(() => loadTransactions())
  const [budgets, setBudgets] = useState(() => loadBudgets())
  const [tab, setTab] = useState('Dashboard')

  const handleImport = useCallback((newTxns) => {
    setTransactions(prev => {
      // Deduplicate by id
      const existing = new Set(prev.map(t => t.id))
      const toAdd = newTxns.filter(t => !existing.has(t.id))
      const merged = [...prev, ...toAdd]
      saveTransactions(merged)
      return merged
    })
    setTab('Transactions')
  }, [])

  const handleUpdateCategory = useCallback((id, category) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, category } : t)
      saveTransactions(updated)
      return updated
    })
  }, [])

  const handleDeleteTransaction = useCallback((id) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id)
      saveTransactions(updated)
      return updated
    })
  }, [])

  const handleToggleWorkExpense = useCallback((id) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, workExpense: !t.workExpense, reimbursementStatus: t.reimbursementStatus || 'pending' } : t)
      saveTransactions(updated)
      return updated
    })
  }, [])

  const handleUpdateReimbursementStatus = useCallback((id, status) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, reimbursementStatus: status } : t)
      saveTransactions(updated)
      return updated
    })
  }, [])

  const handleSaveBudget = useCallback((category, amount) => {
    setBudgets(prev => {
      const updated = { ...prev }
      if (amount === null) {
        delete updated[category]
      } else {
        updated[category] = amount
      }
      saveBudgets(updated)
      return updated
    })
  }, [])

  function handleRecategorize() {
    setTransactions(prev => {
      const updated = prev.map(t => ({
        ...t,
        category: mapBankCategory(t.bankCategory) || guessCategory(t.description),
      }))
      saveTransactions(updated)
      return updated
    })
  }

  function handleClearAll() {
    if (confirm('Clear all transactions and budgets? This cannot be undone.')) {
      clearAll()
      setTransactions([])
      setBudgets({})
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Budget Tracker</h1>
          <span className="header-sub">{transactions.length} transactions</span>
        </div>
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        <button className="recat-btn" onClick={handleRecategorize}>Re-categorize All</button>
        <button className="clear-btn" onClick={handleClearAll}>Clear All</button>
      </header>

      <main className="app-main">
        {tab === 'Dashboard' && <Dashboard transactions={transactions} budgets={budgets} />}
        {tab === 'Transactions' && (
          <TransactionList
            transactions={transactions}
            onUpdateCategory={handleUpdateCategory}
            onDeleteTransaction={handleDeleteTransaction}
            onToggleWorkExpense={handleToggleWorkExpense}
          />
        )}
        {tab === 'Work Expenses' && (
          <WorkExpenses
            transactions={transactions}
            onUpdateStatus={handleUpdateReimbursementStatus}
          />
        )}
        {tab === 'Budgets' && <BudgetManager budgets={budgets} onSaveBudget={handleSaveBudget} />}
        {tab === 'Import' && <FileUpload onImport={handleImport} />}
      </main>
    </div>
  )
}
