import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleColors = {
  owner:     { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  manager:   { bg: 'rgba(99,102,241,0.15)',   color: '#6366f1' },
  team_lead: { bg: 'rgba(139,92,246,0.15)',   color: '#8b5cf6' },
  developer: { bg: 'rgba(6,182,212,0.15)',    color: '#06b6d4' },
}

const roleLabels = {
  owner: 'Owner',
  manager: 'Manager',
  team_lead: 'Team Lead',
  developer: 'Developer',
}

const ROLE_ROUTES = {
  owner: '/owner/dashboard',
  manager: '/manager/dashboard',
  team_lead: '/teamlead/dashboard',
  developer: '/developer/dashboard',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const roleStyle = roleColors[user?.role] || roleColors.developer

  return (
    <nav style={S.nav}>
      <div style={S.logo} onClick={() => navigate(ROLE_ROUTES[user?.role] || '/')}>
        <div style={S.logoIcon}>W</div>
        <span style={S.logoText}>WorkNext</span>
      </div>
      <div style={S.right}>
        {user && (
          <div style={{ ...S.roleBadge, background: roleStyle.bg, color: roleStyle.color }}>
            {roleLabels[user.role] || user.role} — {user.username}
          </div>
        )}
        <button onClick={handleLogout} style={S.logoutBtn}>Logout</button>
      </div>
    </nav>
  )
}

const S = {
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: 'rgba(5,5,16,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100, fontFamily: "'Outfit', 'Segoe UI', sans-serif" },
  logo: { display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' },
  logoIcon: { width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: 'white' },
  logoText: { fontSize: '1.2rem', fontWeight: 700, color: '#fff' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  roleBadge: { padding: '0.35rem 0.9rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 },
  logoutBtn: { padding: '0.4rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.82rem', cursor: 'pointer' },
}
