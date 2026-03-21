import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [message])

  if (!message) return null

  const colors = {
    success: { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.4)', color: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',  color: '#f87171' },
    info:    { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.4)', color: '#a5b4fc' },
  }
  const c = colors[type] || colors.info

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, borderRadius: '12px',
      padding: '0.85rem 1.25rem',
      fontSize: '0.9rem', fontWeight: 500,
      zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease',
      maxWidth: '360px',
    }}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.color, cursor: 'pointer', fontSize: '1rem', padding: 0 }}>×</button>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
