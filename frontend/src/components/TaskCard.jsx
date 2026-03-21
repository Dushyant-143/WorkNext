import { useNavigate } from 'react-router-dom'

const priorityColors = {
  low:      { color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.25)'  },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'   },
}

const statusColors = {
  todo:                   { color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  assigned_to_teamlead:   { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  assigned_to_developer:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  in_progress:            { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  blocked:                { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  review:                 { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  submitted:              { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  completed:              { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  rejected:               { color: '#dc2626', bg: 'rgba(220,38,38,0.12)'  },
}

const statusLabels = {
  todo: 'To Do',
  assigned_to_teamlead: 'With Team Lead',
  assigned_to_developer: 'With Developer',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  review: 'Review',
  submitted: 'Submitted ✓',
  completed: 'Completed',
  rejected: 'Rejected',
}

export default function TaskCard({ task }) {
  const navigate = useNavigate()
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  const pColor = priorityColors[task.priority] || priorityColors.medium
  const sColor = statusColors[task.status] || statusColors.todo

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '14px',
        padding: '1.2rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: "'Outfit','Segoe UI',sans-serif",
      }}
      onClick={() => navigate(`/tasks/${task.id}`)}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Title + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <h3 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.4, flex: 1, margin: 0 }}>
          {task.title}
        </h3>
        <span style={{
          fontSize: '0.68rem', fontWeight: 600,
          padding: '0.2rem 0.55rem', borderRadius: '100px',
          background: sColor.bg, color: sColor.color,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {statusLabels[task.status] || task.status}
        </span>
      </div>

      {/* Priority + Due Date */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <span style={{
          fontSize: '0.68rem', fontWeight: 600,
          padding: '0.2rem 0.55rem', borderRadius: '100px',
          background: pColor.bg, color: pColor.color,
          border: `1px solid ${pColor.border}`,
        }}>
          🚩 {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>

        {task.due_date && (
          <span style={{
            fontSize: '0.68rem',
            padding: '0.2rem 0.55rem', borderRadius: '100px',
            background: isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
            color: isOverdue ? '#f87171' : '#64748b',
            border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}>
            📅 {new Date(task.due_date).toLocaleDateString('en-IN')}
            {isOverdue && ' ⚠'}
          </span>
        )}
      </div>

      {/* Assigned To + View Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {task.assigned_to_developer ? (
          <span style={{ color: '#8b5cf6', fontSize: '0.78rem' }}>
            ⚡ {task.assigned_to_developer.username}
          </span>
        ) : task.assigned_to_teamlead ? (
          <span style={{ color: '#6366f1', fontSize: '0.78rem' }}>
            🎯 {task.assigned_to_teamlead.username}
          </span>
        ) : (
          <span style={{ color: '#374151', fontSize: '0.78rem' }}>Unassigned</span>
        )}

        <span style={{ color: '#6366f1', fontSize: '0.78rem', fontWeight: 600 }}>
          View →
        </span>
      </div>
    </div>
  )
}