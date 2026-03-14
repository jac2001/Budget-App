import { useRef, useState } from 'react'
import { parseCSV } from '../utils/csvParser'

export default function FileUpload({ onImport }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleFiles(files) {
    const csvFiles = Array.from(files).filter(f => f.name.endsWith('.csv'))
    if (!csvFiles.length) {
      setStatus({ type: 'error', message: 'Please upload CSV files.' })
      return
    }

    setLoading(true)
    setStatus(null)
    let totalImported = 0

    for (const file of csvFiles) {
      try {
        const { transactions, format } = await parseCSV(file)
        onImport(transactions)
        totalImported += transactions.length
        setStatus({ type: 'success', message: `Imported ${totalImported} transaction(s) from ${csvFiles.length} file(s). Format detected: ${format}.` })
      } catch (err) {
        setStatus({ type: 'error', message: `Error parsing ${file.name}: ${err.message}` })
      }
    }

    setLoading(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="card">
      <h2>Import Transactions</h2>
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {loading ? (
          <p>Parsing...</p>
        ) : (
          <>
            <p className="drop-icon">📂</p>
            <p>Drag & drop CSV files here, or click to browse</p>
            <p className="drop-hint">Supports bank exports (Chase, generic) and Venmo CSV</p>
          </>
        )}
      </div>
      {status && (
        <p className={`status-msg ${status.type}`}>{status.message}</p>
      )}
    </div>
  )
}
