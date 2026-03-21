import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'
import RejectModal from '../../components/RejectModal'

export default function TeamLeadDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [newTasks, setNewTasks] = useState([])
  const [activeTasks, setActiveTasks] = useState([])
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignModal, setAssignModal] = useState(null)
  const [selectedDev, setSelectedDev] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchData = async () => {
    try {
      const [dash, newRes, activeRes, devRes] = await Promise.all([
        api.get('/dashboard/'),
        api.get('/tasks/?status=assigned_to_teamlead&page_size=20'),
        api.get('/tasks/?status=in_progress&page_size=20'),
        api.get('/auth/developers/?page_size=100'),
      ])
      setData(dash.data)
      setNewTasks(newRes.data.results || [])
      setActiveTasks(activeRes.data.results || [])
      setDevelopers(devRes.data.results || devRes.data || [])
    } catch {
      setToast({ message: 'Failed to load dashboard', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const acceptTask = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/action/`, { action: 'accept_teamlead' })
      setToast({ message: 'Task accepted!', type: 'success' })
      fetchData()
    } catch { setToast({ message: 'Failed to accept', type: 'error' }) }
  }

  const handleRejectConfirm = async (reason) => {
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

  const today = new Date()
  const isOverdue = (due) => due && new Date(due) < today

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
            <h1 style={S.title}>Team Lead Dashboard</h1>
            <p style={S.sub}>Welcome, <strong style={{ color: '#8b5cf6' }}>{user?.first_name || user?.username}</strong></p>
          </div>
          <button style={S.tasksBtn} onClick={() => navigate('/teamlead/tasks')}>View All Tasks →</button>
        </div>

        {/* Stats */}
        {data && (
          <div style={S.statsGrid}>
            {[
              { label: 'Total Tasks',   val: data.stats?.total,              color: '#8b5cf6' },
              { label: 'New Tasks',     val: data.stats?.pending_acceptance, color: '#f59e0b' },
              { label: 'With Devs',     val: data.stats?.assigned_to_dev,    color: '#3b82f6' },
              { label: 'In Progress',   val: data.stats?.in_progress,        color: '#06b6d4' },
              { label: 'Submitted',     val: data.stats?.submitted,          color: '#10b981' },
              { label: 'Completed',     val: data.stats?.completed,          color: '#10b981' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ ...S.statCard, borderColor: `${color}30` }}>
                <span style={{ ...S.statVal, color }}>{val ?? 0}</span>
                <span style={S.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* New Tasks */}
        {newTasks.length > 0 && (
          <div style={S.section}>
            <h2 style={S.sectionTitle}>🔔 New Tasks — Action Required ({newTasks.length})</h2>
            <div style={S.list}>
              {newTasks.map(task => (
                <div key={task.id} style={{ ...S.alertCard, borderColor: isOverdue(task.due_date) ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)', background: isOverdue(task.due_date) ? 'rgba(239,68,68,0.04)' : 'rgba(99,102,241,0.04)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={S.taskTitle}>{task.title}</p>
                    {task.description && <p style={S.taskDesc}>{task.description.slice(0, 100)}</p>}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '100px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>{task.priority}</span>
                      {task.due_date && <span style={{ fontSize: '0.72rem', color: isOverdue(task.due_date) ? '#f87171' : '#64748b' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}{isOverdue(task.due_date) && ' ⚠'}</span>}
                    </div>
                  </div>
                  <div style={S.actions}>
                    <button style={S.viewBtn} onClick={() => navigate(`/tasks/${task.id}`)}>View</button>
                    <button style={S.acceptBtn} onClick={() => acceptTask(task.id)}>✓ Accept</button>
                    <button style={S.rejectBtn} onClick={() => setRejectModal(task.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Tasks needing developer assignment */}
        {activeTasks.filter(t => !t.assigned_to_developer).length > 0 && (
          <div style={S.section}>
            <h2 style={S.sectionTitle}>👥 Needs Developer Assignment ({activeTasks.filter(t => !t.assigned_to_developer).length})</h2>
            <div style={S.grid}>
              {activeTasks.filter(t => !t.assigned_to_developer).map(task => (
                <div key={task.id} style={{ ...S.card, borderColor: 'rgba(139,92,246,0.2)', cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <p style={S.cardTitle}>{task.title}</p>
                  {task.due_date && <p style={{ fontSize: '0.75rem', color: isOverdue(task.due_date) ? '#f87171' : '#475569', marginBottom: '0.75rem' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}</p>}
                  <button style={S.assignBtn} onClick={e => { e.stopPropagation(); setAssignModal(task.id) }}>+ Assign Developer</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {newTasks.length === 0 && activeTasks.filter(t => !t.assigned_to_developer).length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎯</p>
            <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem' }}>All caught up!</p>
            <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.25rem' }}>No pending actions right now</p>
            <button style={{ padding: '0.6rem 1.4rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '8px', color: '#a78bfa', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}
              onClick={() => navigate('/teamlead/tasks')}>View All Tasks →</button>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0a0a18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '1.75rem', width: '100%', maxWidth: '360px' }}>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Assign Developer</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Select a developer for this task</p>
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

      <RejectModal isOpen={!!rejectModal} onConfirm={handleRejectConfirm} onClose={() => setRejectModal(null)} title="Reject Task" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; } select option { background: #0a0a16; }`}</style>
    </Layout>
  )
}

const S = {
  root: { maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem', letterSpacing: '-0.01em' },
  sub: { color: '#64748b', fontSize: '0.875rem' },
  tasksBtn: { padding: '0.55rem 1.25rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', color: '#a78bfa', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' },
  card: { background: 'rgba(255,255,255,0.025)', border: '1px solid', borderRadius: '14px', padding: '1.2rem', transition: 'all 0.2s' },
  cardTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.5rem' },
  assignBtn: { width: '100%', padding: '0.5rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.28)', borderRadius: '8px', color: '#a78bfa', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' },
}
