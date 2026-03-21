import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
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

export default function DeveloperDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [newTasks, setNewTasks] = useState([])
  const [inProgressTasks, setInProgressTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchData = async () => {
    try {
      const [dash, newRes, inProgRes] = await Promise.all([
        api.get('/dashboard/'),
        api.get('/tasks/?status=assigned_to_developer&page_size=20'),
        api.get('/tasks/?status=in_progress&page_size=20'),
      ])
      setData(dash.data)
      setNewTasks(newRes.data.results || [])
      setInProgressTasks(inProgRes.data.results || [])
    } catch {
      setToast({ message: 'Failed to load dashboard', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const doAction = async (taskId, action) => {
    try {
      await api.post(`/tasks/${taskId}/action/`, { action })
      setToast({ message: action === 'accept_developer' ? 'Task accepted!' : 'Submitted for review!', type: 'success' })
      fetchData()
    } catch { setToast({ message: 'Action failed', type: 'error' }) }
  }

  const handleRejectConfirm = async (reason) => {
    try {
      await api.post(`/tasks/${rejectModal}/action/`, { action: 'reject_developer', reason })
      setRejectModal(null)
      setToast({ message: 'Task rejected', type: 'info' })
      fetchData()
    } catch { setToast({ message: 'Failed to reject', type: 'error' }) }
  }

  const today = new Date()
  const isOverdue = (due) => due && new Date(due) < today

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #06b6d4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
            <h1 style={S.title}>Developer Dashboard</h1>
            <p style={S.sub}>Welcome, <strong style={{ color: '#06b6d4' }}>{user?.first_name || user?.username}</strong></p>
          </div>
          <button style={S.tasksBtn} onClick={() => navigate('/developer/tasks')}>
            View All Tasks →
          </button>
        </div>

        {/* Stats */}
        {data && (
          <div style={S.statsGrid}>
            {[
              { label: 'Total Tasks',      val: data.stats?.total,              color: '#06b6d4' },
              { label: 'New Assignments',  val: data.stats?.pending_acceptance, color: '#f59e0b' },
              { label: 'In Progress',      val: data.stats?.in_progress,        color: '#3b82f6' },
              { label: 'Submitted',        val: data.stats?.submitted,          color: '#8b5cf6' },
              { label: 'Completed',        val: data.stats?.completed,          color: '#10b981' },
              { label: 'Rejected',         val: data.stats?.rejected,           color: '#ef4444' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ ...S.statCard, borderColor: `${color}30` }}>
                <span style={{ ...S.statVal, color }}>{val ?? 0}</span>
                <span style={S.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* New Assignments */}
        {newTasks.length > 0 && (
          <div style={S.section}>
            <h2 style={S.sectionTitle}>🔔 New Assignments — Action Required ({newTasks.length})</h2>
            <div style={S.list}>
              {newTasks.map(task => (
                <div key={task.id} style={{ ...S.alertCard, borderColor: isOverdue(task.due_date) ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.2)', background: isOverdue(task.due_date) ? 'rgba(239,68,68,0.04)' : 'rgba(6,182,212,0.04)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={S.taskTitle}>{task.title}</p>
                    {task.description && <p style={S.taskDesc}>{task.description.slice(0, 100)}</p>}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '100px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>{task.priority}</span>
                      {task.due_date && <span style={{ fontSize: '0.72rem', color: isOverdue(task.due_date) ? '#f87171' : '#64748b' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}{isOverdue(task.due_date) && ' ⚠'}</span>}
                      {task.assigned_to_teamlead && <span style={{ fontSize: '0.72rem', color: '#8b5cf6' }}>TL: {task.assigned_to_teamlead.username}</span>}
                    </div>
                  </div>
                  <div style={S.actions}>
                    <button style={S.viewBtn} onClick={() => navigate(`/tasks/${task.id}`)}>View</button>
                    <button style={S.acceptBtn} onClick={() => doAction(task.id, 'accept_developer')}>✓ Accept</button>
                    <button style={S.rejectBtn} onClick={() => setRejectModal(task.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In Progress */}
        {inProgressTasks.length > 0 && (
          <div style={S.section}>
            <h2 style={S.sectionTitle}>⚡ In Progress ({inProgressTasks.length})</h2>
            <div style={S.grid}>
              {inProgressTasks.map(task => (
                <div key={task.id} style={{ ...S.card, borderColor: isOverdue(task.due_date) ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.2)', cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isOverdue(task.due_date) ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.2)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <p style={S.cardTitle}>{task.title}</p>
                  {task.due_date && <p style={{ fontSize: '0.78rem', color: isOverdue(task.due_date) ? '#f87171' : '#475569', marginBottom: '0.75rem' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}{isOverdue(task.due_date) && ' ⚠ Overdue'}</p>}
                  <button style={S.submitBtn} onClick={e => { e.stopPropagation(); doAction(task.id, 'mark_complete') }}>
                    ✓ Submit for Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {newTasks.length === 0 && inProgressTasks.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚡</p>
            <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem' }}>All caught up!</p>
            <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.25rem' }}>No new assignments or in-progress tasks right now</p>
            <button style={{ padding: '0.6rem 1.4rem', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '8px', color: '#06b6d4', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}
              onClick={() => navigate('/developer/tasks')}>
              View All Tasks →
            </button>
          </div>
        )}
      </div>

      <RejectModal isOpen={!!rejectModal} onConfirm={handleRejectConfirm} onClose={() => setRejectModal(null)} title="Reject Assignment" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
    </Layout>
  )
}

const S = {
  root: { maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem', letterSpacing: '-0.01em' },
  sub: { color: '#64748b', fontSize: '0.875rem' },
  tasksBtn: { padding: '0.55rem 1.25rem', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '10px', color: '#06b6d4', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', transition: 'all 0.2s' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '2rem' },
  statCard: { background: 'rgba(255,255,255,0.025)', border: '1px solid', borderRadius: '12px', padding: '1rem', textAlign: 'center' },
  statVal: { display: 'block', fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.25rem' },
  statLabel: { color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  alertCard: { border: '1px solid', borderRadius: '14px', padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  taskTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.2rem' },
  taskDesc: { color: '#475569', fontSize: '0.8rem', lineHeight: 1.5 },
  actions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  viewBtn: { padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  acceptBtn: { padding: '0.4rem 0.875rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: '7px', color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' },
  rejectBtn: { padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.875rem' },
  card: { background: 'rgba(255,255,255,0.025)', border: '1px solid', borderRadius: '14px', padding: '1.2rem', transition: 'all 0.2s' },
  cardTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.5rem' },
  submitBtn: { width: '100%', padding: '0.5rem', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '8px', color: '#06b6d4', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit' },
}
