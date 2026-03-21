import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast'
import RejectModal from '../../components/RejectModal'

const statusColors = {
  assigned_to_developer: '#f59e0b', in_progress: '#3b82f6',
  blocked: '#ef4444', submitted: '#06b6d4',
  completed: '#10b981', rejected: '#dc2626',
}
const statusLabels = {
  assigned_to_developer: 'New Assignment', in_progress: 'In Progress',
  blocked: 'Blocked', submitted: 'Submitted ✓',
  completed: 'Completed', rejected: 'Rejected',
}
const priorityColors = { low: '#64748b', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function DeveloperMyTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filter, setFilter] = useState({ search: '', status: '', priority: '' })
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filter.search), 400)
    return () => clearTimeout(t)
  }, [filter.search])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, page_size: 12 })
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filter.status)   params.append('status',   filter.status)
      if (filter.priority) params.append('priority', filter.priority)
      const res = await api.get(`/tasks/?${params}`)
      setTasks(res.data.results || [])
      setTotalPages(res.data.total_pages || 1)
      setTotalCount(res.data.count || 0)
    } catch {
      setToast({ message: 'Failed to load tasks', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [page, debouncedSearch, filter.status, filter.priority])

  const doAction = async (taskId, action) => {
    try {
      await api.post(`/tasks/${taskId}/action/`, { action })
      setToast({ message: action === 'accept_developer' ? 'Task accepted!' : 'Submitted for review!', type: 'success' })
      fetchTasks()
    } catch { setToast({ message: 'Action failed', type: 'error' }) }
  }

  const handleReject = async (reason) => {
    try {
      await api.post(`/tasks/${rejectModal}/action/`, { action: 'reject_developer', reason })
      setRejectModal(null)
      setToast({ message: 'Task rejected', type: 'info' })
      fetchTasks()
    } catch { setToast({ message: 'Failed to reject', type: 'error' }) }
  }

  const handleFilter = (f) => { setPage(1); setFilter(f) }
  const hasFilters = filter.search || filter.status || filter.priority
  const today = new Date()

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>My Tasks</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {totalCount} task{totalCount !== 1 ? 's' : ''} assigned to you
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍  Search tasks..."
            value={filter.search}
            onChange={e => handleFilter({ ...filter, search: e.target.value })}
            style={{ flex: '1', minWidth: '180px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '0.6rem 0.9rem', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'rgba(6,182,212,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
          />
          <select
            value={filter.status}
            onChange={e => handleFilter({ ...filter, status: e.target.value })}
            style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#94a3b8', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="">All Status</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={filter.priority}
            onChange={e => handleFilter({ ...filter, priority: e.target.value })}
            style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#94a3b8', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          {hasFilters && (
            <button onClick={() => handleFilter({ search: '', status: '', priority: '' })}
              style={{ padding: '0.6rem 0.9rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Tasks */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #06b6d4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</p>
            <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem' }}>
              {hasFilters ? 'No tasks match your filters' : 'No tasks assigned yet'}
            </p>
            <p style={{ color: '#475569', fontSize: '0.875rem' }}>
              {hasFilters ? 'Try clearing filters' : 'Your team lead will assign tasks soon'}
            </p>
            {hasFilters && (
              <button onClick={() => handleFilter({ search: '', status: '', priority: '' })}
                style={{ marginTop: '1rem', padding: '0.55rem 1.25rem', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '8px', color: '#06b6d4', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {tasks.map(task => {
              const overdue = task.due_date && new Date(task.due_date) < today && task.status !== 'completed'
              const isNew = task.status === 'assigned_to_developer'
              const inProg = task.status === 'in_progress'
              return (
                <div key={task.id}
                  style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.25)' : isNew ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', padding: '1.25rem', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = overdue ? 'rgba(239,68,68,0.4)' : 'rgba(6,182,212,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = overdue ? 'rgba(239,68,68,0.25)' : isNew ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>

                  {/* Overdue tag */}
                  {overdue && <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderBottomLeftRadius: '8px' }}>⚠ OVERDUE</div>}
                  {/* New tag */}
                  {isNew && <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderBottomLeftRadius: '8px' }}>NEW</div>}

                  {/* Title + priority */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.4, flex: 1 }}>{task.title}</p>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: '100px', background: `${priorityColors[task.priority]}18`, color: priorityColors[task.priority], border: `1px solid ${priorityColors[task.priority]}30`, flexShrink: 0 }}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Description */}
                  {task.description && <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.55, marginBottom: '0.875rem' }}>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>}

                  {/* Status + due */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.22rem 0.6rem', borderRadius: '100px', background: `${statusColors[task.status]}18`, color: statusColors[task.status] }}>
                      {statusLabels[task.status]}
                    </span>
                    {task.due_date && <span style={{ color: overdue ? '#f87171' : '#475569', fontSize: '0.75rem' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}</span>}
                  </div>

                  {/* Action buttons */}
                  {isNew && (
                    <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => doAction(task.id, 'accept_developer')}
                        style={{ flex: 1, padding: '0.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit' }}>
                        ✓ Accept
                      </button>
                      <button onClick={() => setRejectModal(task.id)}
                        style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                        ✕
                      </button>
                    </div>
                  )}
                  {inProg && (
                    <button onClick={e => { e.stopPropagation(); doAction(task.id, 'mark_complete') }}
                      style={{ width: '100%', padding: '0.5rem', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '8px', color: '#06b6d4', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>
                      ✓ Submit for Review
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '0.5rem 1.1rem', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', color: page === 1 ? '#374151' : '#67e8f9', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: '0.5rem 1.1rem', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', color: page === totalPages ? '#374151' : '#67e8f9', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>
              Next →
            </button>
          </div>
        )}
      </div>

      <RejectModal isOpen={!!rejectModal} onConfirm={handleReject} onClose={() => setRejectModal(null)} title="Reject Assignment" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; } select option { background: #0a0a16; }`}</style>
    </Layout>
  )
}
