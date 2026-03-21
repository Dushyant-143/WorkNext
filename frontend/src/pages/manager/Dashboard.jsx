import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
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
  submitted: 'Submitted ✓', completed: 'Completed', rejected: 'Rejected',
}
const priorityColors = { low: '#64748b', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function ManagerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [teamleads, setTeamleads] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submittedTasks, setSubmittedTasks] = useState([])
  const [filter, setFilter] = useState({ status: '', search: '', priority: '' })
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    due_date: '', assigned_to_teamlead_id: ''
  })
  const [toast, setToast] = useState(null)

  // Debounce search — 400ms delay
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filter.search), 400)
    return () => clearTimeout(t)
  }, [filter.search])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ page, page_size: 12 })
      if (filter.status)   params.append('status', filter.status)
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filter.priority) params.append('priority', filter.priority)

      const [dash, taskRes, tlRes, submittedRes] = await Promise.all([
        api.get('/dashboard/'),
        api.get(`/tasks/?${params}`),
        api.get('/auth/teamleads/?page_size=100'),
        api.get('/tasks/?status=submitted&page_size=100'),
      ])
      setData(dash.data)
      setTasks(taskRes.data.results || [])
      setTotalPages(taskRes.data.total_pages || 1)
      setTotalCount(taskRes.data.count || 0)
      setTeamleads(tlRes.data.results || tlRes.data || [])
      setSubmittedTasks(submittedRes.data.results || [])
    } catch {
      setToast({ message: 'Failed to load dashboard', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, filter.status, filter.priority, debouncedSearch])

  const handleFilter = (newFilter) => { setPage(1); setFilter(newFilter) }
  const clearFilters = () => { setPage(1); setFilter({ status: '', search: '', priority: '' }) }
  const hasFilters = filter.status || filter.search || filter.priority

  const today = new Date()
  const isOverdue = (due) => due && new Date(due) < today

  const createTask = async (e) => {
    e.preventDefault()
    if (!form.assigned_to_teamlead_id) {
      setToast({ message: 'Please select a Team Lead', type: 'error' }); return
    }
    setSaving(true)
    try {
      await api.post('/tasks/', form)
      setShowModal(false)
      setForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to_teamlead_id: '' })
      setToast({ message: 'Task created successfully!', type: 'success' })
      fetchData()
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to create task', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const approveTask = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/action/`, { action: 'approve_manager' })
      setToast({ message: 'Task approved and completed!', type: 'success' })
      fetchData()
    } catch {
      setToast({ message: 'Failed to approve task', type: 'error' })
    }
  }



  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div style={S.root}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Manager Dashboard</h1>
            <p style={S.subtitle}>Welcome back, <strong style={{ color: '#6366f1' }}>{user?.first_name || user?.username}</strong></p>
          </div>
          <button style={S.createBtn} onClick={() => setShowModal(true)}>+ New Task</button>
        </div>

        {/* Stats */}
        {data && (
          <div style={S.statsGrid}>
            {[
              { label: 'Total Tasks',      val: data.stats?.total,       color: '#6366f1' },
              { label: 'In Progress',      val: data.stats?.in_progress, color: '#3b82f6' },
              { label: 'Pending Approval', val: data.stats?.submitted,   color: '#f59e0b' },
              { label: 'Completed',        val: data.stats?.completed,   color: '#10b981' },
              { label: 'Rejected',         val: data.stats?.rejected,    color: '#ef4444' },
              { label: 'Team Leads',       val: data.extra?.team_leads,  color: '#8b5cf6' },
              { label: 'Developers',       val: data.extra?.developers,  color: '#06b6d4' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ ...S.statCard, borderColor: `${color}33` }}>
                <span style={{ ...S.statVal, color }}>{val ?? 0}</span>
                <span style={S.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Awaiting Approval */}
        {submittedTasks.length > 0 && (
          <div style={S.section}>
            <h2 style={S.sectionTitle}>⏳ Awaiting Your Approval ({submittedTasks.length})</h2>
            <div style={S.taskList}>
              {submittedTasks.map(task => (
                <div key={task.id} style={S.approvalCard}>
                  <div style={{ flex: 1 }}>
                    <p style={S.taskTitle}>{task.title}</p>
                    <p style={S.taskMeta}>
                      {task.assigned_to_teamlead?.username && `TL: ${task.assigned_to_teamlead.username}`}
                      {task.assigned_to_developer?.username && ` · Dev: ${task.assigned_to_developer.username}`}
                      {task.due_date && ` · Due: ${new Date(task.due_date).toLocaleDateString('en-IN')}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={S.viewBtn} onClick={() => navigate(`/tasks/${task.id}`)}>View</button>
                    <button style={S.approveBtn} onClick={() => approveTask(task.id)}>✓ Approve</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tasks */}
        <div style={S.section}>
          <div style={S.sectionHeader}>
            <div>
              <h2 style={S.sectionTitle}>All Tasks</h2>
              <p style={{ color: '#475569', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                {totalCount} tasks {hasFilters ? '(filtered)' : 'total'}
              </p>
            </div>
            <div style={S.filterRow}>
              <input
                style={S.filterInput}
                placeholder="🔍 Search..."
                value={filter.search}
                onChange={e => handleFilter({ ...filter, search: e.target.value })}
              />
              <select style={S.filterSelect} value={filter.status}
                onChange={e => handleFilter({ ...filter, status: e.target.value })}>
                <option value="">All Status</option>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select style={S.filterSelect} value={filter.priority}
                onChange={e => handleFilter({ ...filter, priority: e.target.value })}>
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {hasFilters && (
                <button style={S.clearBtn} onClick={clearFilters}>✕ Clear</button>
              )}
            </div>
          </div>

          {tasks.length === 0 ? (
            <div style={S.emptyState}>
              <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</p>
              <p style={{ color: '#475569', fontWeight: 600 }}>
                {hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
              </p>
              <p style={{ color: '#374151', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {hasFilters ? 'Try clearing filters' : 'Create your first task using "+ New Task"'}
              </p>
              {hasFilters && (
                <button style={{ ...S.approveBtn, marginTop: '1rem' }} onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={S.taskGrid}>
              {tasks.map(task => {
                const overdue = isOverdue(task.due_date) && task.status !== 'completed'
                return (
                  <div
                    key={task.id}
                    style={{
                      ...S.card,
                      borderColor: overdue ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)',
                    }}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = overdue ? 'rgba(239,68,68,0.45)' : 'rgba(99,102,241,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = overdue ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}
                  >
                    {/* Overdue strip */}
                    {overdue && (
                      <div style={S.overdueStrip}>⚠ Overdue</div>
                    )}
                    <div style={S.cardTop}>
                      <span style={S.cardTitle}>{task.title}</span>
                      <span style={{ ...S.badge, background: `${priorityColors[task.priority]}20`, color: priorityColors[task.priority], border: `1px solid ${priorityColors[task.priority]}44` }}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p style={S.cardDesc}>{task.description.slice(0, 75)}{task.description.length > 75 ? '...' : ''}</p>
                    )}
                    <div style={S.cardBottom}>
                      <span style={{ ...S.statusBadge, background: `${statusColors[task.status]}20`, color: statusColors[task.status] }}>
                        {statusLabels[task.status]}
                      </span>
                      {task.due_date && (
                        <span style={{ color: overdue ? '#f87171' : '#475569', fontSize: '0.76rem' }}>
                          📅 {new Date(task.due_date).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                    <div style={S.cardFooter}>
                      {task.assigned_to_teamlead && <span style={S.pill}>TL: {task.assigned_to_teamlead.username}</span>}
                      {task.assigned_to_developer && <span style={S.pill}>Dev: {task.assigned_to_developer.username}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={S.pagination}>
              <button style={S.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={S.pageInfo}>Page {page} of {totalPages}</span>
              <button style={S.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div style={S.overlay} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={S.modalTitle}>Create New Task</h2>
            <form onSubmit={createTask} style={S.formGrid}>
              <div style={S.formField}>
                <label style={S.formLabel}>Title *</label>
                <input style={S.formInput} value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Task title" required />
              </div>
              <div style={S.formField}>
                <label style={S.formLabel}>Description</label>
                <textarea style={{ ...S.formInput, height: '80px', resize: 'none' }}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What needs to be done?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={S.formField}>
                  <label style={S.formLabel}>Priority</label>
                  <select style={S.formInput} value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Due Date</label>
                  <input type="date" style={S.formInput} value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div style={S.formField}>
                <label style={S.formLabel}>Assign to Team Lead *</label>
                <select style={S.formInput} value={form.assigned_to_teamlead_id}
                  onChange={e => setForm({ ...form, assigned_to_teamlead_id: e.target.value })} required>
                  <option value="">Select Team Lead</option>
                  {teamleads.map(tl => (
                    <option key={tl.id} value={tl.id}>
                      {tl.first_name ? `${tl.first_name} ${tl.last_name} (@${tl.username})` : tl.username}
                    </option>
                  ))}
                </select>
                {teamleads.length === 0 && (
                  <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                    No team leads found. Ask owner to add team leads first.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" style={S.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={S.submitBtn} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`* { box-sizing: border-box; } input:focus, select:focus, textarea:focus { outline: none; border-color: #6366f1 !important; }`}</style>
    </Layout>
  )
}

const S = {
  root: { maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' },
  subtitle: { color: '#64748b', fontSize: '0.88rem' },
  createBtn: { padding: '0.7rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '2rem' },
  statCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: '12px', padding: '1rem', textAlign: 'center' },
  statVal: { display: 'block', fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 },
  statLabel: { color: '#64748b', fontSize: '0.7rem', marginTop: '0.3rem', display: 'block' },

  section: { marginBottom: '2rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' },
  sectionTitle: { fontSize: '1.05rem', fontWeight: 600, color: '#e2e8f0' },

  taskList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  approvalCard: { background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  taskTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.2rem' },
  taskMeta: { color: '#475569', fontSize: '0.78rem' },
  viewBtn: { padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '7px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem' },
  approveBtn: { padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '7px', color: '#10b981', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },

  filterRow: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' },
  filterInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem 0.9rem', color: '#e2e8f0', fontSize: '0.83rem', width: '160px' },
  filterSelect: { background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#e2e8f0', fontSize: '0.83rem' },
  clearBtn: { padding: '0.5rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' },

  emptyState: { textAlign: 'center', padding: '3.5rem 1rem' },

  taskGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.875rem' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: '14px', padding: '1.2rem', cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative', overflow: 'hidden' },
  overdueStrip: { position: 'absolute', top: 0, right: 0, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderBottomLeftRadius: '8px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' },
  cardTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', flex: 1, lineHeight: 1.4 },
  cardDesc: { color: '#475569', fontSize: '0.8rem', lineHeight: '1.55', marginBottom: '0.75rem' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  cardFooter: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  badge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '100px', whiteSpace: 'nowrap' },
  statusBadge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '100px' },
  pill: { fontSize: '0.7rem', color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '100px', padding: '0.15rem 0.5rem' },

  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' },
  pageBtn: { padding: '0.5rem 1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem' },
  pageInfo: { color: '#64748b', fontSize: '0.85rem' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem' },
  formGrid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formField: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  formLabel: { color: '#94a3b8', fontSize: '0.82rem', fontWeight: 500 },
  formInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#e2e8f0', fontSize: '0.88rem' },
  cancelBtn: { flex: 1, padding: '0.7rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#64748b', cursor: 'pointer' },
  submitBtn: { flex: 1, padding: '0.7rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer' },
}