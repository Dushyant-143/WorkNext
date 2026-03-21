import { useState } from 'react'

export default function RejectModal({ isOpen, onConfirm, onClose, title = 'Reject Task' }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    onConfirm(reason.trim())
    setReason('')
    setError('')
  }

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: '#0d0d1f',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '2rem',
        width: '100%', maxWidth: '420px',
      }}>
        <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {title}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Please provide a reason so the manager is informed.
        </p>
        <textarea
          value={reason}
          onChange={e => { setReason(e.target.value); setError('') }}
          placeholder="Enter rejection reason..."
          rows={3}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px', padding: '0.75rem',
            color: '#e2e8f0', fontSize: '0.9rem', resize: 'none',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.4rem' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button onClick={handleClose} style={{
            flex: 1, padding: '0.7rem', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', color: '#64748b', cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={{
            flex: 1, padding: '0.7rem',
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px', color: '#f87171',
            fontWeight: 600, cursor: 'pointer',
          }}>
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
