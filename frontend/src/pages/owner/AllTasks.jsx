import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import Toast from '../../components/Toast'

const statusColors = {
  todo: '#64748b', assigned_to_teamlead: '#6366f1',
  assigned_to_developer: '#8b5cf6', in_progress: '#3b82f6',
  blocked: '#ef4444', review: '#f59e0b',
  submitted: '#06b6d4', completed: '#10b981', rejected: '#dc2626',
}
const statusLabels = {
  todo: 'To Do', assigned_to_teamlead: 'With Team Lead',
  assigned_to_developer: 'With Developer', in_progress: 'In Progress',
  blocked: 'Blocked', review: 'Review',
  submitted: 'Submitted', completed: 'Completed', rejected: 'Rejected',
}
const priorityColors = { low: '#64748b', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function AllTasksPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)
  const [filter, setFilter] = useState({ status: '', search: '', priority: '' })
  const [toast, setToast] = useState(null)

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({ page })
      if (filter.status)   params.append('status',   filter.status)
      if (filter.search)   params.append('search',   filter.search)
      if (filter.priority) params.append('priority', filter.priority)
      const res = await api.get(`/tasks/?${params}`)
      setTasks(res.data.results || [])
      setTotalPages(res.data.total_pages || 1)
      setCount(res.data.count || 0)
    } catch {
      setToast({ message: 'Failed to load tasks', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [page, filter])

  return (
    <Layout>
      <div style={S.root}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>All Tasks</h1>
            <p style={S.subtitle}>{count} total tasks in system</p>
          </div>
        </div>

        {/* Filters */}
        <div style={S.filterRow}>
          <input style={S.searchInput} placeholder="Search tasks..."
            value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
          <select style={S.select} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select style={S.select} value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })}>
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
          <div style={S.empty}>No tasks found</div>
        ) : (
          <>
            <div style={S.table}>
              <div style={S.tableHeader}>
                <span>Task</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Team Lead</span>
                <span>Developer</span>
                <span>Due</span>
              </div>
              {tasks.map(task => (
                <div key={task.id} style={S.tableRow} onClick={() => navigate(`/tasks/${task.id}`)}>
                  <div>
                    <p style={S.taskTitle}>{task.title}</p>
                    <p style={S.taskCreator}>by {task.created_by?.username}</p>
                  </div>
                  <span style={{ ...S.badge, background: `${priorityColors[task.priority]}22`, color: priorityColors[task.priority] }}>
                    {task.priority}
                  </span>
                  <span style={{ ...S.badge, background: `${statusColors[task.status]}22`, color: statusColors[task.status] }}>
                    {statusLabels[task.status]}
                  </span>
                  <span style={S.person}>{task.assigned_to_teamlead?.username || '—'}</span>
                  <span style={S.person}>{task.assigned_to_developer?.username || '—'}</span>
                  <span style={S.due}>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</span>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div style={S.pagination}>
                <button style={S.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={S.pageInfo}>Page {page} of {totalPages}</span>
                <button style={S.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
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
  searchInput: { flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#e2e8f0', fontSize: '0.88rem' },
  select: { background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#e2e8f0', fontSize: '0.88rem' },
  table: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 1.2fr 1fr 1fr 0.8fr', gap: '0.75rem', padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.03)', color: '#475569', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tableRow: { display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 1.2fr 1fr 1fr 0.8fr', gap: '0.75rem', padding: '0.875rem 1.25rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' },
  taskTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.1rem' },
  taskCreator: { color: '#475569', fontSize: '0.75rem' },
  badge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '100px', whiteSpace: 'nowrap' },
  person: { color: '#64748b', fontSize: '0.82rem' },
  due: { color: '#64748b', fontSize: '0.8rem' },
  empty: { padding: '4rem', textAlign: 'center', color: '#374151', fontSize: '0.9rem' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' },
  pageBtn: { padding: '0.5rem 1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem' },
  pageInfo: { color: '#64748b', fontSize: '0.85rem' },
}