import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import Toast from '../../components/Toast'

const roleColors = {
  manager:   { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)'  },
  team_lead: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
  developer: { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.25)'  },
  owner:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
}

export default function AllUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setLoading(true)
    // FIX: page_size=100 se sab users aayenge, role filter bhi backend pe
    const params = new URLSearchParams({ page_size: 100 })
    if (roleFilter) params.append('role', roleFilter)
    
    api.get(`/auth/users/?${params}`)
      .then(res => setUsers(res.data.results || res.data))
      .catch(() => setToast({ message: 'Failed to load users', type: 'error' }))
      .finally(() => setLoading(false))
  }, [roleFilter]) // roleFilter change hone pe dobara fetch karo

  // Search sirf frontend pe
  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.username.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
    )
  })

  return (
    <Layout>
      <div style={S.root}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>All Users</h1>
            <p style={S.subtitle}>{filtered.length} users {roleFilter ? `(${roleFilter.replace('_', ' ')})` : 'total'}</p>
          </div>
        </div>

        {/* Filters */}
        <div style={S.filterRow}>
          <input
            style={S.searchInput}
            placeholder="Search by name, username or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={S.select} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="manager">Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="developer">Developer</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={S.table}>
            <div style={S.tableHeader}>
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
            </div>
            {filtered.length === 0 ? (
              <div style={S.empty}>No users found</div>
            ) : filtered.map(u => {
              const rc = roleColors[u.role] || roleColors.developer
              return (
                <div key={u.id} style={S.tableRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ ...S.avatar, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                      {u.first_name ? u.first_name[0].toUpperCase() : u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={S.name}>
                        {u.first_name || u.last_name
                          ? `${u.first_name} ${u.last_name}`.trim()
                          : u.username}
                      </p>
                      <p style={S.handle}>@{u.username}</p>
                    </div>
                  </div>
                  <span style={S.email} title={u.email}>{u.email || '—'}</span>
                  <span style={{ ...S.roleBadge, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                    {u.role.replace('_', ' ')}
                  </span>
                  <span style={{
                    ...S.statusBadge,
                    background: u.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: u.is_active ? '#10b981' : '#f87171',
                    border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                    {u.is_active ? '● Active' : '● Inactive'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`* { box-sizing: border-box; } input:focus, select:focus { outline: none; border-color: #6366f1 !important; }`}</style>
    </Layout>
  )
}

const S = {
  root: { maxWidth: '1100px', margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' },
  subtitle: { color: '#64748b', fontSize: '0.88rem' },
  filterRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#e2e8f0', fontSize: '0.88rem' },
  select: { background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#e2e8f0', fontSize: '0.88rem' },
  table: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '1rem', padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.03)', color: '#475569', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '1rem', padding: '0.875rem 1.25rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  avatar: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  name: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.1rem' },
  handle: { color: '#475569', fontSize: '0.75rem' },
  email: { color: '#64748b', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  roleBadge: { display: 'inline-block', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '100px', textTransform: 'capitalize', whiteSpace: 'nowrap' },
  statusBadge: { display: 'inline-block', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '100px', whiteSpace: 'nowrap' },
  empty: { padding: '3rem', textAlign: 'center', color: '#374151' },
}