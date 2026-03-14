import Papa from 'papaparse'

const CATEGORY_RULES = [
  { keywords: ['payroll'], patterns: [/\bpay\b/], category: 'Income' },
  { keywords: ['uber', 'lyft', 'metro', 'subway', 'transit', 'parking', 'gas', 'fuel', 'shell', 'bp', 'chevron', 'exxon', 'citgo', 'sunoco', 'mobil', 'marathon', 'speedway', 'circle k', 'wawa', 'kwik'], category: 'Transport' },
  { keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'chipotle', 'mcdonald', 'pizza', 'sushi', 'doordash', 'grubhub', 'instacart', 'whole foods', 'trader joe', 'safeway', 'kroger', 'grocery', 'market', 'deli', 'bakery', 'taco', 'burger', 'eatery', 'kitchen'], category: 'Food & Dining' },
  { keywords: ['netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'apple music', 'youtube', 'twitch', 'steam', 'playstation', 'xbox'], category: 'Entertainment' },
  { keywords: ['amazon', 'walmart', 'target', 'costco', 'ebay', 'etsy', 'best buy', 'home depot', 'ikea', 'zara', 'h&m', 'nordstrom', 'macy'], category: 'Shopping' },
  { keywords: ['rent', 'mortgage', 'hoa', 'landlord', 'lease'], category: 'Housing' },
  { keywords: ['electric', 'water', 'gas bill', 'internet', 'comcast', 'at&t', 'verizon', 't-mobile', 'phone'], category: 'Utilities' },
  { keywords: ['doctor', 'hospital', 'pharmacy', 'cvs', 'walgreens', 'health', 'dental', 'vision', 'insurance'], category: 'Health' },
  { keywords: ['gym', 'fitness', 'yoga', 'peloton', 'classpass'], category: 'Fitness' },
  { keywords: ['venmo', 'zelle', 'paypal', 'cashapp', 'cash app', 'transfer', 'withdrawal', 'capital one', 'mobile pmt', 'mobile payment', 'schwab', 'fidelity', 'vanguard', 'merrill', 'brokerage', 'moneylink', 'wire', 'ach'], category: 'Transfers' },
  { keywords: ['interest paid', 'interest earned', 'dividend'], category: 'Income' },
  { keywords: ['airline', 'hotel', 'airbnb', 'vrbo', 'expedia', 'booking.com', 'delta', 'united', 'southwest', 'american air'], category: 'Travel' },
]

const BANK_CATEGORY_MAP = {
  'dining': 'Food & Dining',
  'restaurants': 'Food & Dining',
  'food & drink': 'Food & Dining',
  'food and drink': 'Food & Dining',
  'groceries': 'Food & Dining',
  'supermarkets': 'Food & Dining',
  'fast food': 'Food & Dining',
  'coffee shops': 'Food & Dining',
  'gas': 'Transport',
  'gas & fuel': 'Transport',
  'gas and fuel': 'Transport',
  'gas/automotive': 'Transport',
  'automotive': 'Transport',
  'auto & transport': 'Transport',
  'auto and transport': 'Transport',
  'ride share': 'Transport',
  'parking': 'Transport',
  'public transportation': 'Transport',
  'travel': 'Travel',
  'airlines': 'Travel',
  'hotels': 'Travel',
  'hotel': 'Travel',
  'car rental': 'Travel',
  'entertainment': 'Entertainment',
  'movies & dvds': 'Entertainment',
  'music': 'Entertainment',
  'shopping': 'Shopping',
  'merchandise': 'Shopping',
  'clothing': 'Shopping',
  'electronics': 'Shopping',
  'home': 'Shopping',
  'utilities': 'Utilities',
  'bills & utilities': 'Utilities',
  'bills and utilities': 'Utilities',
  'phone': 'Utilities',
  'health & fitness': 'Health',
  'health and fitness': 'Health',
  'medical': 'Health',
  'healthcare': 'Health',
  'pharmacy': 'Health',
  'doctor': 'Health',
  'gym': 'Fitness',
  'fitness': 'Fitness',
  'transfer': 'Transfers',
  'transfers': 'Transfers',
  'payment': 'Transfers',
  'payments': 'Transfers',
  'rent': 'Housing',
  'mortgage': 'Housing',
}

// Partial keyword matching applied to the bank category string itself,
// catches things like "Dining" → Food & Dining, "Merchandise" → Shopping, etc.
const BANK_CATEGORY_PARTIAL = [
  { keywords: ['dine', 'dining', 'restaurant', 'food', 'grocer', 'cafe', 'coffee', 'drink', 'beverage'], category: 'Food & Dining' },
  { keywords: ['gas', 'auto', 'automotive', 'vehicle', 'transport', 'parking', 'toll', 'commute', 'transit', 'ride'], category: 'Transport' },
  { keywords: ['travel', 'airline', 'flight', 'hotel', 'lodging', 'vacation', 'cruise', 'resort'], category: 'Travel' },
  { keywords: ['entertain', 'movie', 'theater', 'music', 'concert', 'sport', 'recreation', 'streaming', 'gaming'], category: 'Entertainment' },
  { keywords: ['shop', 'merchand', 'retail', 'cloth', 'department', 'electron', 'hardware', 'home improvement'], category: 'Shopping' },
  { keywords: ['util', 'electric', 'water', 'phone', 'cable', 'bill'], category: 'Utilities' },
  { keywords: ['health', 'medical', 'dental', 'vision', 'pharma', 'doctor', 'hospital', 'clinic', 'wellness'], category: 'Health' },
  { keywords: ['gym', 'fitness', 'workout', 'yoga', 'athletic'], category: 'Fitness' },
  { keywords: ['transfer', 'payment', 'wire', 'ach', 'withdrawal', 'deposit'], category: 'Transfers' },
  { keywords: ['rent', 'mortgage', 'housing', 'home'], category: 'Housing' },
  { keywords: ['education', 'tuition', 'school', 'book'], category: 'Other' },
  { keywords: ['personal', 'miscellaneous', 'other'], category: 'Other' },
]

export function mapBankCategory(raw) {
  if (!raw) return null
  const lower = raw.trim().toLowerCase()
  // 1. Exact match
  if (BANK_CATEGORY_MAP[lower]) return BANK_CATEGORY_MAP[lower]
  // 2. Partial keyword match on the bank's category string
  for (const rule of BANK_CATEGORY_PARTIAL) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.category
  }
  return null
}

export function guessCategory(description) {
  const lower = (description || '').toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.category
    if (rule.patterns && rule.patterns.some(p => p.test(lower))) return rule.category
  }
  return 'Other'
}

function parseAmount(raw) {
  if (raw === null || raw === undefined) return null
  const cleaned = String(raw).replace(/[$,\s]/g, '').replace(/[()]/g, m => m === '(' ? '-' : '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function normalizeDate(raw) {
  if (!raw) return null
  // Try native Date parsing
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return raw
}

function detectFormat(headers) {
  const h = headers.map(s => (s || '').trim().toLowerCase())
  // Venmo: has "datetime" and "note" and "amount (total)"
  if (h.some(x => x.includes('amount (total)')) && h.some(x => x === 'note')) return 'venmo'
  // Credit card / Chase: has "transaction date" or both debit+credit columns
  if (h.some(x => x.includes('transaction date')) || (h.includes('debit') && h.includes('credit'))) return 'chase'
  // Generic bank
  return 'generic'
}

function parseVenmo(rows, rawHeaders) {
  const findCol = (...names) => {
    for (const name of names) {
      const match = rawHeaders.find(h => h.trim().toLowerCase() === name.toLowerCase())
      if (match) return match
    }
    return null
  }

  const dateCol = findCol('Datetime', 'Date')
  const noteCol = findCol('Note')
  const amountCol = findCol('Amount (total)', 'Amount')
  const fromCol = findCol('From')
  const toCol = findCol('To')
  const statusCol = findCol('Status')
  const typeCol = findCol('Type')

  return rows
    .filter(r => {
      if (!r[dateCol]) return false
      // Skip incomplete transactions and standard transfers (balance top-ups)
      const status = (r[statusCol] || '').trim().toLowerCase()
      const type = (r[typeCol] || '').trim().toLowerCase()
      if (status && status !== 'complete') return false
      if (type === 'transfer') return false
      return true
    })
    .map((r, i) => {
      // Amount (total) is already signed: negative = you paid, positive = you received
      const amount = parseAmount(r[amountCol])
      const note = (r[noteCol] || '').trim()
      const from = (r[fromCol] || '').trim()
      const to = (r[toCol] || '').trim()
      const description = note || `${from} → ${to}`
      return {
        id: `venmo-${i}-${Date.now()}`,
        date: normalizeDate(r[dateCol]),
        description,
        amount,
        category: guessCategory(description),
        source: 'Venmo',
      }
    })
    .filter(t => t.date && t.amount !== null && t.amount !== 0)
}

function parseChase(rows, rawHeaders) {
  const findCol = (...names) => {
    for (const name of names) {
      const match = rawHeaders.find(h => h.trim().toLowerCase() === name.toLowerCase())
      if (match) return match
    }
    return null
  }

  const dateCol = findCol('Transaction Date', 'Date', 'Post Date')
  const descCol = findCol('Description', 'Transaction Description', 'Merchant Name', 'Payee')
  const catCol = findCol('Category')
  const cardCol = findCol('Card No.', 'Card Number', 'Card No')
  const accountCol = findCol('Account Number', 'Account No.', 'Account No')

  // Detect split debit/credit columns vs single amount column
  const debitCol = findCol('Debit')
  const creditCol = findCol('Credit')
  const amountCol = findCol('Transaction Amount', 'Amount')

  const hasSplitCols = debitCol && creditCol

  function resolveAmount(r) {
    if (hasSplitCols) {
      const debit = parseAmount(r[debitCol])
      // Only import debit rows (charges). Skip credit rows (card payments/refunds).
      if (debit != null && debit !== 0) return -Math.abs(debit)
      return null
    }
    return parseAmount(r[amountCol])
  }

  return rows
    .filter(r => r[dateCol])
    .map((r, i) => {
      const description = r[descCol] || ''
      const bankCategory = (catCol && r[catCol]) ? r[catCol].trim() : ''
      const category = mapBankCategory(bankCategory) || guessCategory(description)
      const cardNo = cardCol && r[cardCol] ? ` ···${String(r[cardCol]).slice(-4)}` : ''
      const acctNo = accountCol && r[accountCol] ? ` ···${String(r[accountCol]).slice(-4)}` : ''
      const source = cardNo ? `Credit Card${cardNo}` : acctNo ? `Checking${acctNo}` : 'Bank'
      return {
        id: `chase-${i}-${Date.now()}`,
        date: normalizeDate(r[dateCol]),
        description,
        amount: resolveAmount(r),
        category,
        bankCategory,
        source,
      }
    })
    .filter(t => t.date && t.amount !== null)
}

function parseGeneric(rows, rawHeaders) {
  const findCol = (...names) => {
    for (const name of names) {
      const match = rawHeaders.find(h => h.trim().toLowerCase() === name.toLowerCase())
      if (match) return match
    }
    return null
  }

  const dateCol = findCol('Date', 'Transaction Date', 'Post Date', 'Datetime')
  const descCol = findCol('Description', 'Merchant', 'Payee', 'Note', 'Memo')
  const amountCol = findCol('Amount', 'Debit', 'Credit', 'Amount (total)')

  if (!dateCol || !amountCol) return []

  return rows
    .filter(r => r[dateCol])
    .map((r, i) => {
      const description = r[descCol] || ''
      return {
        id: `txn-${i}-${Date.now()}`,
        date: normalizeDate(r[dateCol]),
        description,
        amount: parseAmount(r[amountCol]),
        category: guessCategory(description),
        source: 'Bank',
      }
    })
    .filter(t => t.date && t.amount !== null)
}

// Some CSVs have account info rows before the real column header row.
// Scan lines until we find the one containing the expected column headers.
function findHeaderLine(text, requiredColumns) {
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase()
    if (requiredColumns.every(col => lower.includes(col))) {
      return lines.slice(i).join('\n')
    }
  }
  return text
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const rawText = e.target.result

        const isVenmo = rawText.includes('Amount (total)') && rawText.includes('Account Activity')
        // Credit card CSVs from some banks include account info rows before the real headers
        const isCreditCard = !isVenmo && rawText.toLowerCase().includes('transaction date') && rawText.toLowerCase().includes('category')

        let textToParse = rawText
        if (isVenmo) textToParse = findHeaderLine(rawText, ['datetime', 'amount (total)'])
        else if (isCreditCard) textToParse = findHeaderLine(rawText, ['transaction date', 'description', 'category'])

        Papa.parse(textToParse, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const rawHeaders = results.meta.fields || []
              const format = isVenmo ? 'venmo' : isCreditCard ? 'chase' : detectFormat(rawHeaders)

              let transactions
              if (format === 'venmo') {
                transactions = parseVenmo(results.data, rawHeaders)
              } else if (format === 'chase') {
                transactions = parseChase(results.data, rawHeaders)
              } else {
                transactions = parseGeneric(results.data, rawHeaders)
              }

              resolve({ transactions, format })
            } catch (err) {
              reject(err)
            }
          },
          error: reject,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
