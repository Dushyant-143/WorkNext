import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast'
import RejectModal from '../../components/RejectModal'

const statusColors = {
  assigned_to_teamlead: '#6366f1', assigned_to_developer: '#8b5cf6',
  in_progress: '#3b82f6', blocked: '#ef4444',
  submitted: '#06b6d4', completed: '#10b981', rejected: '#dc2626',
}
const statusLabels = {
  assigned_to_teamlead: 'Pending Acceptance', assigned_to_developer: 'With Developer',
  in_progress: 'In Progress', blocked: 'Blocked',
  submitted: 'Submitted', completed: 'Completed', rejected: 'Rejected',
}
const priorityColors = { low: '#64748b', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function TeamLeadMyTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filter, setFilter] = useState({ search: '', status: '', priority: '' })
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [assignModal, setAssignModal] = useState(null)
  const [selectedDev, setSelectedDev] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filter.search), 400)
    return () => clearTimeout(t)
  }, [filter.search])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, page_size: 12 })
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filter.status)   params.append('status',   filter.status)
      if (filter.priority) params.append('priority', filter.priority)
      const [taskRes, devRes] = await Promise.all([
        api.get(`/tasks/?${params}`),
        api.get('/auth/developers/?page_size=100'),
      ])
      setTasks(taskRes.data.results || [])
      setTotalPages(taskRes.data.total_pages || 1)
      setTotalCount(taskRes.data.count || 0)
      setDevelopers(devRes.data.results || devRes.data || [])
    } catch {
      setToast({ message: 'Failed to load tasks', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, debouncedSearch, filter.status, filter.priority])

  const acceptTask = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/action/`, { action: 'accept_teamlead' })
      setToast({ message: 'Task accepted!', type: 'success' })
      fetchData()
    } catch { setToast({ message: 'Failed to accept', type: 'error' }) }
  }

  const handleReject = async (reason) => {
    try {
      await api.post(`/tasks/${rejectModal}/action/`, { action: 'reject_teamlead', reason })
      setRejectModal(null)
      setToast({ message: 'Task rejected', type: 'info' })
      fetchData()
    } catch { setToast({ message: 'Failed to reject', type: 'error' }) }
  }

  const assignDeveloper = async () => {
    if (!selectedDev) return setToast({ message: 'Select a developer', type: 'error' })
    try {
      await api.post(`/tasks/${assignModal}/action/`, { action: 'assign_developer', developer_id: parseInt(selectedDev) })
      setAssignModal(null); setSelectedDev('')
      setToast({ message: 'Developer assigned!', type: 'success' })
      fetchData()
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to assign', type: 'error' })
    }
  }

  const handleFilter = (f) => { setPage(1); setFilter(f) }
  const hasFilters = filter.search || filter.status || filter.priority
  const today = new Date()

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>My Tasks</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{totalCount} task{totalCount !== 1 ? 's' : ''} assigned to you</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input placeholder="🔍  Search tasks..." value={filter.search}
            onChange={e => handleFilter({ ...filter, search: e.target.value })}
            style={{ flex: 1, minWidth: '180px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '0.6rem 0.9rem', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
          <select value={filter.status} onChange={e => handleFilter({ ...filter, status: e.target.value })}
            style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#94a3b8', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="">All Status</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filter.priority} onChange={e => handleFilter({ ...filter, priority: e.target.value })}
            style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#94a3b8', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="">All Priority</option>
            <option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option><option value="critical">Critical</option>
          </select>
          {hasFilters && (
            <button onClick={() => handleFilter({ search: '', status: '', priority: '' })}
              style={{ padding: '0.6rem 0.9rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Tasks grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</p>
            <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem' }}>{hasFilters ? 'No tasks match your filters' : 'No tasks yet'}</p>
            <p style={{ color: '#475569', fontSize: '0.875rem' }}>{hasFilters ? 'Try clearing filters' : 'Tasks will appear here when assigned'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {tasks.map(task => {
              const overdue = task.due_date && new Date(task.due_date) < today && task.status !== 'completed'
              const isPending = task.status === 'assigned_to_teamlead'
              const needsAssign = task.status === 'in_progress' && !task.assigned_to_developer
              return (
                <div key={task.id}
                  style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${isPending ? 'rgba(99,102,241,0.25)' : overdue ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', padding: '1.25rem', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isPending ? 'rgba(99,102,241,0.25)' : overdue ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>

                  {isPending && <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderBottomLeftRadius: '8px' }}>ACTION NEEDED</div>}
                  {overdue && <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderBottomLeftRadius: '8px' }}>⚠ OVERDUE</div>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.4, flex: 1 }}>{task.title}</p>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: '100px', background: `${priorityColors[task.priority]}18`, color: priorityColors[task.priority], flexShrink: 0 }}>{task.priority}</span>
                  </div>

                  {task.description && <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.55, marginBottom: '0.75rem' }}>{task.description.slice(0, 75)}...</p>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.22rem 0.6rem', borderRadius: '100px', background: `${statusColors[task.status]}18`, color: statusColors[task.status] }}>{statusLabels[task.status]}</span>
                    {task.due_date && <span style={{ color: overdue ? '#f87171' : '#475569', fontSize: '0.75rem' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}</span>}
                  </div>

                  {task.assigned_to_developer && (
                    <p style={{ color: '#8b5cf6', fontSize: '0.78rem', marginBottom: '0.5rem' }}>⚡ {task.assigned_to_developer.first_name || task.assigned_to_developer.username}</p>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => acceptTask(task.id)} style={{ flex: 1, padding: '0.48rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit' }}>✓ Accept</button>
                      <button onClick={() => setRejectModal(task.id)} style={{ padding: '0.48rem 0.7rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                    </div>
                  )}
                  {!task.assigned_to_developer && !isPending && task.status !== 'completed' && task.status !== 'rejected' && (
                    <button onClick={e => { e.stopPropagation(); setAssignModal(task.id) }} style={{ width: '100%', padding: '0.48rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.28)', borderRadius: '8px', color: '#a78bfa', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>+ Assign Developer</button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem 1.1rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: page === 1 ? '#374151' : '#a5b4fc', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>← Prev</button>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem 1.1rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: page === totalPages ? '#374151' : '#a5b4fc', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>Next →</button>
          </div>
        )}
      </div>

      {/* Assign Dev Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0a0a18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '1.75rem', width: '100%', maxWidth: '360px' }}>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Assign Developer</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Select a developer to assign this task</p>
            <select value={selectedDev} onChange={e => setSelectedDev(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}>
              <option value="">Select Developer</option>
              {developers.map(d => <option key={d.id} value={d.id}>{d.first_name ? `${d.first_name} ${d.last_name} (@${d.username})` : d.username}</option>)}
            </select>
            {developers.length === 0 && <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '0.4rem' }}>No developers available</p>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => { setAssignModal(null); setSelectedDev('') }} style={{ flex: 1, padding: '0.65rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={assignDeveloper} style={{ flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', borderRadius: '9px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Assign</button>
            </div>
          </div>
        </div>
      )}

      <RejectModal isOpen={!!rejectModal} onConfirm={handleReject} onClose={() => setRejectModal(null)} title="Reject Task" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; } select option { background: #0a0a16; }`}</style>
    </Layout>
  )
}
