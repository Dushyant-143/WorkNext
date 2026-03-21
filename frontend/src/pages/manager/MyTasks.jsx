import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import Toast from '../../components/Toast'

const statusColors = {
  todo: '#64748b', assigned_to_teamlead: '#6366f1', assigned_to_developer: '#8b5cf6',
  in_progress: '#3b82f6', blocked: '#ef4444', review: '#f59e0b',
  submitted: '#06b6d4', completed: '#10b981', rejected: '#dc2626',
}
const statusLabels = {
  todo: 'To Do', assigned_to_teamlead: 'With Team Lead', assigned_to_developer: 'With Developer',
  in_progress: 'In Progress', blocked: 'Blocked', review: 'Review',
  submitted: 'Submitted ✓', completed: 'Completed', rejected: 'Rejected',
}
const priorityColors = { low: '#64748b', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function ManagerMyTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filter, setFilter] = useState({ status: '', search: '', priority: '' })
  const [toast, setToast] = useState(null)

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({ page, page_size: 12 })
      if (filter.status)   params.append('status', filter.status)
      if (filter.search)   params.append('search', filter.search)
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

  useEffect(() => { fetchTasks() }, [page, filter])

  const handleFilter = (f) => { setPage(1); setFilter(f) }

  const approveTask = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/action/`, { action: 'approve_manager' })
      setToast({ message: 'Task approved!', type: 'success' })
      fetchTasks()
    } catch {
      setToast({ message: 'Failed to approve', type: 'error' })
    }
  }

  return (
    <Layout>
      <div style={S.root}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>My Tasks</h1>
            <p style={S.subtitle}>{totalCount} tasks created by you</p>
          </div>
        </div>

        <div style={S.filterRow}>
          <input style={S.filterInput} placeholder="Search..." value={filter.search}
            onChange={e => handleFilter({ ...filter, search: e.target.value })} />
          <select style={S.select} value={filter.status}
            onChange={e => handleFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select style={S.select} value={filter.priority}
            onChange={e => handleFilter({ ...filter, priority: e.target.value })}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
            <p style={{ fontSize: '2.5rem' }}>📋</p>
            <p style={{ marginTop: '0.5rem' }}>No tasks found</p>
          </div>
        ) : (
          <div style={S.taskGrid}>
            {tasks.map(task => (
              <div key={task.id} style={S.card}
                onClick={() => navigate(`/tasks/${task.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                <div style={S.cardTop}>
                  <span style={S.cardTitle}>{task.title}</span>
                  <span style={{ ...S.badge, background: `${priorityColors[task.priority]}20`, color: priorityColors[task.priority] }}>
                    {task.priority}
                  </span>
                </div>
                {task.description && <p style={S.cardDesc}>{task.description.slice(0, 80)}...</p>}
                <div style={S.cardBottom}>
                  <span style={{ ...S.statusBadge, background: `${statusColors[task.status]}20`, color: statusColors[task.status] }}>
                    {statusLabels[task.status]}
                  </span>
                  {task.due_date && <span style={S.due}>📅 {new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {task.assigned_to_teamlead && <span style={S.pill}>TL: {task.assigned_to_teamlead.username}</span>}
                  {task.assigned_to_developer && <span style={S.pill}>Dev: {task.assigned_to_developer.username}</span>}
                </div>
                {task.status === 'submitted' && (
                  <button style={{ ...S.approveBtn, width: '100%', marginTop: '0.75rem' }}
                    onClick={e => { e.stopPropagation(); approveTask(task.id) }}>
                    ✓ Approve Task
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={S.pagination}>
            <button style={S.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
            <button style={S.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`* { box-sizing: border-box; } input:focus, select:focus { outline: none; border-color: #6366f1 !important; }`}</style>
    </Layout>
  )
}

const S = {
  root: { maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' },
  subtitle: { color: '#64748b', fontSize: '0.88rem' },
  filterRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  filterInput: { flex: 1, minWidth: '160px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.55rem 0.9rem', color: '#e2e8f0', fontSize: '0.85rem' },
  select: { background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.55rem 0.75rem', color: '#e2e8f0', fontSize: '0.85rem' },
  taskGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.875rem' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem', cursor: 'pointer', transition: 'border-color 0.2s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' },
  cardTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', flex: 1 },
  cardDesc: { color: '#475569', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '0.75rem' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '100px', whiteSpace: 'nowrap' },
  statusBadge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '100px' },
  due: { color: '#475569', fontSize: '0.76rem' },
  pill: { fontSize: '0.7rem', color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '100px', padding: '0.15rem 0.5rem' },
  approveBtn: { padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '7px', color: '#10b981', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' },
  pageBtn: { padding: '0.5rem 1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem' },
}