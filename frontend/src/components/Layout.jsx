import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import api from '../api/axios'

const roleConfig = {
  owner: {
    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
    nav: [
      { label: 'Dashboard', path: '/owner/dashboard', icon: '📊' },
      { label: 'All Users', path: '/owner/users', icon: '👥' },
      { label: 'All Tasks', path: '/owner/tasks', icon: '📋' },
    ]
  },
  manager: {
    color: '#6366f1', bg: 'rgba(99,102,241,0.1)',
    nav: [
      { label: 'Dashboard', path: '/manager/dashboard', icon: '📊' },
      { label: 'My Tasks', path: '/manager/tasks', icon: '📋' },
      { label: 'Team', path: '/manager/team', icon: '👥' },
    ]
  },
  team_lead: {
    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',
    nav: [
      { label: 'Dashboard', path: '/teamlead/dashboard', icon: '📊' },
      { label: 'My Tasks', path: '/teamlead/tasks', icon: '📋' },
    ]
  },
  developer: {
    color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',
    nav: [
      { label: 'Dashboard', path: '/developer/dashboard', icon: '📊' },
      { label: 'My Tasks', path: '/developer/tasks', icon: '📋' },
    ]
  },
}

const roleIcons = { owner: '👑', manager: '📋', team_lead: '🎯', developer: '⚡' }
const roleLabels = { owner: 'Owner', manager: 'Manager', team_lead: 'Team Lead', developer: 'Developer' }

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const config = roleConfig[user?.role] || roleConfig.developer
  const [pendingCount, setPendingCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Pending tasks badge
  useEffect(() => {
    if (!user) return
    api.get('/dashboard/').then(res => {
      const stats = res.data?.stats || {}
      if (user.role === 'team_lead') {
        setPendingCount(stats.pending_acceptance || 0)
      } else if (user.role === 'developer') {
        setPendingCount(stats.pending_acceptance || 0)
      } else if (user.role === 'manager') {
        setPendingCount(stats.submitted || 0)
      }
    }).catch(() => {})
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '240px' : '64px' }}>
        {/* Logo */}
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}>W</div>
          {sidebarOpen && <span style={styles.logoText}>WorkNext</span>}
        </div>

        {/* Role Badge */}
        {sidebarOpen && (
          <div style={{ ...styles.roleBadge, background: config.bg, borderColor: `${config.color}44`, color: config.color }}>
            <span>{roleIcons[user?.role]}</span>
            <span>{roleLabels[user?.role]}</span>
          </div>
        )}

        {/* Nav Links */}
        <nav style={styles.nav}>
          {config.nav.map(({ label, path, icon }) => {
            const active = location.pathname === path
            const showBadge = label === 'Dashboard' && pendingCount > 0
            return (
              <Link
                key={path}
                to={path}
                style={{
                  ...styles.navLink,
                  background: active ? config.bg : 'transparent',
                  borderColor: active ? `${config.color}44` : 'transparent',
                  color: active ? config.color : '#64748b',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  padding: sidebarOpen ? '0.65rem 0.75rem' : '0.65rem',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                {sidebarOpen && <span>{label}</span>}
                {showBadge && (
                  <span style={{
                    ...styles.badge,
                    marginLeft: sidebarOpen ? 'auto' : undefined,
                    position: sidebarOpen ? 'relative' : 'absolute',
                    top: sidebarOpen ? undefined : '4px',
                    right: sidebarOpen ? undefined : '4px',
                    fontSize: '0.6rem',
                    minWidth: '16px',
                    height: '16px',
                  }}>
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={styles.sidebarBottom}>
          {sidebarOpen && (
            <div style={styles.userInfo}>
              <div style={{ ...styles.avatar, background: `${config.color}22`, color: config.color }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={styles.userName}>{user?.first_name || user?.username}</p>
                <p style={styles.userRole}>{roleLabels[user?.role]}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            ...styles.logoutBtn,
            padding: sidebarOpen ? '0.6rem' : '0.6rem',
            justifyContent: 'center',
          }}>
            {sidebarOpen ? '🚪 Logout' : '🚪'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Top bar with collapse button */}
        <div style={styles.topBar}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.collapseBtn}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {pendingCount > 0 && (
            <div style={styles.topAlert}>
              <span style={{ fontSize: '0.8rem' }}>🔔</span>
              <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}>
                {pendingCount} task{pendingCount > 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your attention
              </span>
            </div>
          )}
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </main>

      <style>{`
        a { text-decoration: none; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a1a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        aside { transition: width 0.25s ease; }
      `}</style>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex', minHeight: '100vh',
    background: '#070714',
    fontFamily: "'Outfit', 'Segoe UI', sans-serif",
    color: '#e2e8f0',
  },
  sidebar: {
    flexShrink: 0,
    background: '#050510',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column',
    padding: '1.25rem 0.75rem',
    position: 'sticky', top: 0, height: '100vh',
    overflow: 'hidden',
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    marginBottom: '1.25rem', paddingLeft: '0.25rem',
    overflow: 'hidden',
  },
  logoIcon: {
    width: '32px', height: '32px', flexShrink: 0,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '0.9rem', color: 'white',
  },
  logoText: { fontSize: '1.2rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' },
  roleBadge: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.45rem 0.7rem',
    border: '1px solid',
    borderRadius: '10px',
    fontSize: '0.78rem', fontWeight: 600,
    marginBottom: '1.25rem',
    overflow: 'hidden', whiteSpace: 'nowrap',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 },
  navLink: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.88rem', fontWeight: 500,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap', overflow: 'hidden',
  },
  badge: {
    background: '#ef4444', color: '#fff',
    borderRadius: '100px',
    padding: '0 5px',
    fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  sidebarBottom: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '0.875rem',
  },
  userInfo: {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    marginBottom: '0.65rem', overflow: 'hidden',
  },
  avatar: {
    width: '34px', height: '34px', flexShrink: 0,
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.9rem',
  },
  userName: { color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { color: '#475569', fontSize: '0.72rem' },
  logoutBtn: {
    width: '100%', padding: '0.55rem',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '10px',
    color: '#f87171', fontSize: '0.82rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: '0.4rem',
  },
  topBar: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.6rem 0 0.6rem 0',
    marginBottom: '0.5rem',
  },
  collapseBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px', color: '#475569',
    cursor: 'pointer', padding: '0.3rem 0.6rem',
    fontSize: '0.75rem',
  },
  topAlert: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: '8px', padding: '0.35rem 0.75rem',
  },
  main: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' },
  content: { padding: '0 2rem 2rem', flex: 1 },
}