import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0d0d1f',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          width: '100%', maxWidth: '520px',
          maxHeight: '90vh', overflowY: 'auto',
          fontFamily: "'Outfit','Segoe UI',sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#64748b', cursor: 'pointer',
              width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}