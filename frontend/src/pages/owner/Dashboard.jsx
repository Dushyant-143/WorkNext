import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ username: '', email: '', role: '', password: '', is_active: true, first_name: '', last_name: '' })
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    username: '', email: '', password: '', password2: '',
    role: 'developer', first_name: '', last_name: ''
  })
  const [toast, setToast] = useState(null)

  const fetchData = async () => {
    try {
      const res = await api.get('/dashboard/owner/')
      setData({ ...res.data, _ts: Date.now() })
    } catch {
      setToast({ message: 'Failed to load dashboard', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ username: u.username, email: u.email, role: u.role, password: '', is_active: u.is_active, first_name: u.first_name || '', last_name: u.last_name || '' })
  }

  const saveUser = async () => {
    setSaving(true)
    const payload = { ...form }
    if (!payload.password) delete payload.password
    try {
      await api.patch(`/auth/users/${editUser.id}/`, payload)
      setEditUser(null)
      setToast({ message: `${editUser.username} updated!`, type: 'success' })
      fetchData()
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(', ') : 'Update failed'
      setToast({ message: msg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`Delete ${username}? This cannot be undone.`)) return
    try {
      await api.delete(`/auth/users/${userId}/`)
      setToast({ message: `${username} deleted!`, type: 'success' })
      fetchData()
    } catch {
      setToast({ message: 'Failed to delete user', type: 'error' })
    }
  }

  const createUser = async (e) => {
    e.preventDefault()
    if (createForm.password !== createForm.password2) {
      setToast({ message: 'Passwords do not match', type: 'error' })
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/register/', createForm)
      setShowCreate(false)
      setCreateForm({ username: '', email: '', password: '', password2: '', role: 'developer', first_name: '', last_name: '' })
      setToast({ message: 'User created!', type: 'success' })
      await fetchData()
    } catch (err) {
      const d = err.response?.data
      const msg = d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed'
      setToast({ message: msg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const roleGroups = [
    { key: 'managers',   label: 'Managers',   icon: '📋', color: '#6366f1', users: data?.managers },
    { key: 'team_leads', label: 'Team Leads', icon: '🎯', color: '#8b5cf6', users: data?.team_leads },
    { key: 'developers', label: 'Developers', icon: '⚡', color: '#06b6d4', users: data?.developers },
  ]

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
            <h1 style={S.title}>Owner Panel</h1>
            <p style={S.subtitle}>Full system control — <strong style={{ color: '#f59e0b' }}>{user?.username}</strong></p>
          </div>
          <button style={S.createBtn} onClick={() => setShowCreate(true)}>+ Add User</button>
        </div>

        {/* Stats */}
        {data && (
          <div style={S.statsGrid} key={data._ts}>
            {[
              { label: 'Total Users', val: data.total_users,       color: '#f59e0b' },
              { label: 'Managers',    val: data.managers?.length,   color: '#6366f1' },
              { label: 'Team Leads',  val: data.team_leads?.length, color: '#8b5cf6' },
              { label: 'Developers',  val: data.developers?.length, color: '#06b6d4' },
              { label: 'Total Tasks', val: data.total_tasks,        color: '#3b82f6' },
              { label: 'Completed',   val: data.completed_tasks,    color: '#10b981' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ ...S.statCard, borderColor: `${color}44` }}>
                <span style={{ ...S.statVal, color }}>{val ?? 0}</span>
                <span style={S.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* User Groups */}
        {roleGroups.map(({ key, label, icon, color, users }) => (
          <div key={key} style={S.section}>
            <h2 style={S.sectionTitle}><span style={{ color }}>{icon}</span> {label} <span style={{ color: '#475569', fontWeight: 400, fontSize: '0.85rem' }}>({users?.length || 0})</span></h2>
            {users?.length > 0 ? (
              <div style={S.userGrid}>
                {users.map(u => (
                  <div key={u.id} style={{ ...S.userCard, borderColor: `${color}33` }}>
                    {/* Avatar */}
                    <div style={{ ...S.avatar, background: `${color}18`, color, border: `1px solid ${color}33` }}>
                      {u.first_name ? u.first_name[0].toUpperCase() : u.username[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={S.userInfo}>
                      <p style={S.userName}>
                        {u.first_name || u.last_name
                          ? `${u.first_name} ${u.last_name}`.trim()
                          : u.username}
                      </p>
                      <p style={S.userHandle}>@{u.username}</p>
                      <p style={S.userEmail} title={u.email}>{u.email || '—'}</p>
                      <span style={{
                        ...S.statusBadge,
                        background: u.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: u.is_active ? '#10b981' : '#f87171',
                        border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        {u.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={S.cardActions}>
                      <button style={S.editBtn} onClick={() => openEdit(u)}>✏️ Edit</button>
                      <button style={S.deleteBtn} onClick={() => deleteUser(u.id, u.username)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={S.empty}>No {label.toLowerCase()} yet</p>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Edit — @{editUser.username}</h2>
            <div style={S.formGrid}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={S.formField}>
                  <label style={S.formLabel}>First Name</label>
                  <input style={S.formInput} type="text" value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Last Name</label>
                  <input style={S.formInput} type="text" value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </div>
              </div>
              {[
                { label: 'Username', key: 'username', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'New Password (blank = no change)', key: 'password', type: 'password' },
              ].map(({ label, key, type }) => (
                <div key={key} style={S.formField}>
                  <label style={S.formLabel}>{label}</label>
                  <input type={type} style={S.formInput} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div style={S.formField}>
                <label style={S.formLabel}>Role</label>
                <select style={S.formInput} value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="manager">Manager</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="developer">Developer</option>
                </select>
              </div>
              <div style={S.formField}>
                <label style={S.formLabel}>Status</label>
                <select style={S.formInput} value={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button style={S.cancelBtn} onClick={() => setEditUser(null)}>Cancel</button>
                <button style={{ ...S.cancelBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={() => { deleteUser(editUser.id, editUser.username); setEditUser(null) }}>
                  🗑 Delete
                </button>
                <button style={S.submitBtn} onClick={saveUser} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Create New User</h2>
            <form onSubmit={createUser} style={S.formGrid}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={S.formField}>
                  <label style={S.formLabel}>First Name</label>
                  <input style={S.formInput} type="text" value={createForm.first_name}
                    onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Last Name</label>
                  <input style={S.formInput} type="text" value={createForm.last_name}
                    onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} />
                </div>
              </div>
              {[
                { label: 'Username *', key: 'username', type: 'text' },
                { label: 'Email *', key: 'email', type: 'email' },
                { label: 'Password *', key: 'password', type: 'password' },
                { label: 'Confirm Password *', key: 'password2', type: 'password' },
              ].map(({ label, key, type }) => (
                <div key={key} style={S.formField}>
                  <label style={S.formLabel}>{label}</label>
                  <input type={type} style={S.formInput} value={createForm[key]}
                    onChange={e => setCreateForm({ ...createForm, [key]: e.target.value })}
                    required={label.includes('*')} />
                </div>
              ))}
              <div style={S.formField}>
                <label style={S.formLabel}>Role *</label>
                <select style={S.formInput} value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="manager">Manager</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="developer">Developer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" style={S.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" style={S.submitBtn} disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`* { box-sizing: border-box; } input:focus, select:focus { outline: none; border-color: #f59e0b !important; }`}</style>
    </Layout>
  )
}

const S = {
  root: { maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' },
  subtitle: { color: '#64748b', fontSize: '0.88rem' },
  createBtn: { padding: '0.65rem 1.4rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '2rem' },
  statCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: '12px', padding: '1rem', textAlign: 'center' },
  statVal: { display: 'block', fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 },
  statLabel: { color: '#64748b', fontSize: '0.72rem', marginTop: '0.3rem', display: 'block' },

  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: '0.875rem', color: '#e2e8f0' },

  userGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' },
  userCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    borderRadius: '14px',
    padding: '1rem',
    display: 'grid',
    gridTemplateColumns: '44px 1fr auto',
    gap: '0.75rem',
    alignItems: 'center',
  },
  avatar: {
    width: '44px', height: '44px',
    borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1.1rem',
    flexShrink: 0,
  },
  userInfo: { minWidth: 0 },
  userName: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userHandle: { color: '#6366f1', fontSize: '0.75rem', marginBottom: '0.1rem' },
  userEmail: { color: '#475569', fontSize: '0.75rem', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  statusBadge: { display: 'inline-block', fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '100px' },

  cardActions: { display: 'flex', flexDirection: 'row', gap: '0.4rem', alignItems: 'flex-start', flexShrink: 0 },
  editBtn: { padding: '0.3rem 0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' },
  deleteBtn: { padding: '0.3rem 0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' },

  empty: { color: '#374151', fontSize: '0.88rem', padding: '0.5rem 0' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' },
  formGrid: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  formField: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  formLabel: { color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 },
  formInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#e2e8f0', fontSize: '0.88rem' },
  cancelBtn: { flex: 1, padding: '0.65rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#64748b', cursor: 'pointer', fontSize: '0.88rem' },
  submitBtn: { flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' },
}