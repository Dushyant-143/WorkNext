import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../api/axios'
import Toast from '../components/Toast'
import RejectModal from '../components/RejectModal'

const statusFlow = [
  { key: 'todo',                   label: 'To Do' },
  { key: 'assigned_to_teamlead',   label: 'Assigned TL' },
  { key: 'in_progress',            label: 'In Progress' },
  { key: 'assigned_to_developer',  label: 'Assigned Dev' },
  { key: 'submitted',              label: 'Submitted' },
  { key: 'completed',              label: 'Completed' },
]

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
const priorityBg = { low: 'rgba(100,116,139,0.15)', medium: 'rgba(245,158,11,0.15)', high: 'rgba(249,115,22,0.15)', critical: 'rgba(239,68,68,0.15)' }

export default function TaskDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [toast, setToast] = useState(null)
  const [rejectModal, setRejectModal] = useState(false)
  const [developers, setDevelopers] = useState([])
  const [assignModal, setAssignModal] = useState(false)
  const [selectedDev, setSelectedDev] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}/`)
      setTask(res.data)
    } catch {
      setToast({ message: 'Task not found or access denied', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTask() }, [id])

  // Load developers for team lead assign action
  useEffect(() => {
    if (user?.role === 'team_lead') {
      api.get('/auth/developers/?page_size=100').then(res => setDevelopers(res.data.results || res.data || []))
    }
  }, [user])

  const doAction = async (action, extra = {}) => {
    setActionLoading(true)
    try {
      await api.post(`/tasks/${id}/action/`, { action, ...extra })
      const msgs = {
        accept_teamlead: 'Task accepted!', reject_teamlead: 'Task rejected',
        assign_developer: 'Developer assigned!',
        accept_developer: 'Task accepted!', reject_developer: 'Task rejected',
        mark_complete: 'Submitted for review!', approve_manager: 'Task approved!',
      }
      setToast({ message: msgs[action] || 'Done!', type: action.includes('reject') ? 'info' : 'success' })
      setAssignModal(false); setSelectedDev('')
      fetchTask()
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Action failed', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (reason) => {
    const action = user?.role === 'team_lead' ? 'reject_teamlead' : 'reject_developer'
    await doAction(action, { reason })
    setRejectModal(false)
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmittingComment(true)
    try {
      await api.post(`/tasks/${id}/comments/`, { content: comment })
      setComment('')
      setToast({ message: 'Comment added!', type: 'success' })
      fetchTask()
    } catch {
      setToast({ message: 'Failed to add comment', type: 'error' })
    } finally {
      setSubmittingComment(false)
    }
  }

  // Check if due date is overdue
  const isOverdue = task?.due_date && new Date(task.due_date) < new Date() && task?.status !== 'completed'

  // Status flow index
  const currentFlowIdx = statusFlow.findIndex(s => s.key === task?.status)

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  )

  if (!task) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
        <p style={{ fontSize: '2.5rem' }}>🔍</p>
        <p style={{ marginTop: '0.5rem', color: '#e2e8f0', fontWeight: 600 }}>Task not found</p>
        <button onClick={() => navigate(-1)} style={S.backBtn}>← Go Back</button>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div style={S.root}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={S.backBtn}>← Back</button>

        {/* Status Flow Timeline */}
        {task.status !== 'rejected' && (
          <div style={S.timeline}>
            {statusFlow.map((s, i) => {
              const done = i <= currentFlowIdx
              const active = i === currentFlowIdx
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < statusFlow.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: active ? '#6366f1' : done ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
                      border: active ? '2px solid #6366f1' : done ? '2px solid rgba(99,102,241,0.4)' : '2px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', color: done ? '#a5b4fc' : '#374151',
                      fontWeight: 700,
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: active ? '#a5b4fc' : done ? '#6366f1' : '#374151', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < statusFlow.length - 1 && (
                    <div style={{ flex: 1, height: '2px', background: i < currentFlowIdx ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)', margin: '0 4px', marginBottom: '18px' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Rejected banner */}
        {task.status === 'rejected' && (
          <div style={S.rejectedBanner}>
            <span>✕ Task Rejected</span>
            {task.rejected_reason && <span style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{task.rejected_reason}</span>}
          </div>
        )}

        <div style={S.grid}>
          {/* Left */}
          <div style={S.main}>
            {/* Task Header Card */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <h1 style={S.taskTitle}>{task.title}</h1>
                <span style={{
                  ...S.badge,
                  background: `${statusColors[task.status]}22`,
                  color: statusColors[task.status],
                  border: `1px solid ${statusColors[task.status]}44`,
                  flexShrink: 0,
                }}>
                  {statusLabels[task.status]}
                </span>
              </div>

              {task.description && (
                <p style={S.desc}>{task.description}</p>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <span style={{ ...S.badge, background: priorityBg[task.priority], color: priorityColors[task.priority], border: `1px solid ${priorityColors[task.priority]}44` }}>
                  🚩 {task.priority}
                </span>
                {task.due_date && (
                  <span style={{
                    ...S.badge,
                    background: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isOverdue ? '#f87171' : '#94a3b8',
                    border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    📅 {new Date(task.due_date).toLocaleDateString('en-IN')}
                    {isOverdue && ' ⚠ Overdue'}
                  </span>
                )}
              </div>

              {/* ── Role-based Action Buttons ── */}
              {(() => {
                const isTL = user?.role === 'team_lead' && task.assigned_to_teamlead?.id === user?.id
                const isDev = user?.role === 'developer' && task.assigned_to_developer?.id === user?.id
                const isMgr = ['owner','manager'].includes(user?.role)
                const btnBase = { padding: '0.6rem 1.25rem', border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '0.875rem', cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: actionLoading ? 0.6 : 1, transition: 'all 0.2s' }

                if (isTL && task.status === 'assigned_to_teamlead') return (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                    <button style={{ ...btnBase, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }} onClick={() => doAction('accept_teamlead')}>✓ Accept Task</button>
                    <button style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }} onClick={() => setRejectModal(true)}>✕ Reject</button>
                  </div>
                )
                if (isTL && task.status === 'in_progress' && !task.assigned_to_developer) return (
                  <div style={{ marginTop: '1.25rem' }}>
                    <button style={{ ...btnBase, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', boxShadow: '0 4px 14px rgba(139,92,246,0.25)' }} onClick={() => setAssignModal(true)}>👥 Assign Developer</button>
                  </div>
                )
                if (isDev && task.status === 'assigned_to_developer') return (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                    <button style={{ ...btnBase, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }} onClick={() => doAction('accept_developer')}>✓ Accept Task</button>
                    <button style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }} onClick={() => setRejectModal(true)}>✕ Reject</button>
                  </div>
                )
                if (isDev && task.status === 'in_progress') return (
                  <div style={{ marginTop: '1.25rem' }}>
                    <button style={{ ...btnBase, background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff', boxShadow: '0 4px 14px rgba(6,182,212,0.25)' }} onClick={() => doAction('mark_complete')}>✓ Submit for Review</button>
                  </div>
                )
                if (isMgr && task.status === 'submitted') return (
                  <div style={{ marginTop: '1.25rem' }}>
                    <button style={{ ...btnBase, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', fontSize: '0.95rem', padding: '0.7rem 1.75rem' }} onClick={() => doAction('approve_manager')}>✓ Approve & Complete Task</button>
                  </div>
                )
                return null
              })()}
            </div>

            {/* Comments */}
            <div style={S.card}>
              <h2 style={S.sectionTitle}>💬 Comments ({task.comments?.length || 0})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                {task.comments?.length > 0 ? (
                  [...task.comments].map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={S.commentAvatar}>
                        {c.user.username[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem' }}>{c.user.username}</span>
                          <span style={{ color: '#374151', fontSize: '0.72rem' }}>
                            {new Date(c.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.55', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#374151', fontSize: '0.85rem' }}>No comments yet — be the first!</p>
                )}
              </div>
              <form onSubmit={addComment} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text" value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  style={S.commentInput}
                />
                <button type="submit" disabled={submittingComment || !comment.trim()} style={S.commentBtn}>
                  {submittingComment ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={S.sidebar}>
            {/* Task Details */}
            <div style={S.card}>
              <h3 style={S.sectionTitle}>Task Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Created by', value: task.created_by?.username, icon: '👤' },
                  { label: 'Team Lead', value: task.assigned_to_teamlead?.username || '—', icon: '🎯' },
                  { label: 'Developer', value: task.assigned_to_developer?.username || '—', icon: '⚡' },
                  { label: 'Created', value: new Date(task.created_at).toLocaleDateString('en-IN'), icon: '📅' },
                  { label: 'Updated', value: new Date(task.updated_at).toLocaleDateString('en-IN'), icon: '🔄' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontSize: '0.78rem' }}>{icon} {label}</span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}

                {/* Acceptance status */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Acceptance Status</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      ...S.badge,
                      background: task.accepted_by_teamlead ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                      color: task.accepted_by_teamlead ? '#10b981' : '#64748b',
                      border: `1px solid ${task.accepted_by_teamlead ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.2)'}`,
                    }}>
                      TL {task.accepted_by_teamlead ? '✓' : '○'}
                    </span>
                    <span style={{
                      ...S.badge,
                      background: task.accepted_by_developer ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                      color: task.accepted_by_developer ? '#10b981' : '#64748b',
                      border: `1px solid ${task.accepted_by_developer ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.2)'}`,
                    }}>
                      Dev {task.accepted_by_developer ? '✓' : '○'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div style={S.card}>
              <h3 style={S.sectionTitle}>📋 Activity Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
                {task.activity_logs?.length > 0 ? (
                  [...task.activity_logs].reverse().map((log, i) => (
                    <div key={log.id} style={{
                      borderLeft: '2px solid rgba(99,102,241,0.3)',
                      paddingLeft: '0.75rem',
                      paddingBottom: i < task.activity_logs.length - 1 ? '0.5rem' : 0,
                    }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: '1.4' }}>{log.action}</p>
                      <p style={{ color: '#374151', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                        {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#374151', fontSize: '0.82rem' }}>No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Developer Modal (for Team Lead) */}
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
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => { setAssignModal(false); setSelectedDev('') }} style={{ flex: 1, padding: '0.65rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => doAction('assign_developer', { developer_id: parseInt(selectedDev) })} disabled={!selectedDev}
                style={{ flex: 1, padding: '0.65rem', background: selectedDev ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '9px', color: selectedDev ? '#fff' : '#475569', fontWeight: 600, cursor: selectedDev ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      <RejectModal isOpen={rejectModal} onConfirm={handleReject} onClose={() => setRejectModal(false)} title={user?.role === 'team_lead' ? 'Reject Task' : 'Reject Assignment'} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`* { box-sizing: border-box; } input:focus { outline: none; border-color: #6366f1 !important; } select option { background: #0a0a16; }`}</style>
    </Layout>
  )
}

const S = {
  root: { maxWidth: '1100px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.88rem', marginBottom: '1.25rem', padding: 0 },
  timeline: { display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflowX: 'auto' },
  rejectedBanner: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: '#f87171', fontWeight: 600, fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' },
  main: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.4rem' },
  taskTitle: { color: '#fff', fontSize: '1.35rem', fontWeight: 700, flex: 1, lineHeight: 1.3 },
  desc: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.7' },
  badge: { display: 'inline-block', fontSize: '0.75rem', fontWeight: 600, padding: '0.28rem 0.7rem', borderRadius: '100px' },
  sectionTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem' },
  commentAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 },
  commentInput: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#e2e8f0', fontSize: '0.88rem' },
  commentBtn: { padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
}