import { useNavigate } from 'react-router-dom'

const roles = [
  {
    key: 'owner',
    label: 'Owner',
    icon: '👑',
    desc: 'Full system control. Manage all users, passwords, and settings.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
  },
  {
    key: 'manager',
    label: 'Manager',
    icon: '📋',
    desc: 'Create tasks, assign to team leads, monitor progress and approve work.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.3)',
  },
  {
    key: 'team_lead',
    label: 'Team Lead',
    icon: '🎯',
    desc: 'Accept tasks from manager, distribute to developers, track delivery.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.3)',
  },
  {
    key: 'developer',
    label: 'Developer',
    icon: '⚡',
    desc: 'View your assigned tasks, accept, work and submit for review.',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    border: 'rgba(6,182,212,0.3)',
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>W</div>
          <span style={styles.logoText}>WorkNext</span>
        </div>

        <h1 style={styles.title}>Who are you?</h1>
        <p style={styles.subtitle}>Select your role to continue to login</p>

        <div style={styles.grid}>
          {roles.map((role) => (
            <button
              key={role.key}
              style={{
                ...styles.roleCard,
                background: role.bg,
                borderColor: role.border,
              }}
              onClick={() => navigate(`/login/${role.key}`)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 12px 40px ${role.color}22`
                e.currentTarget.style.borderColor = role.color
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = role.border
              }}
            >
              <span style={styles.roleIcon}>{role.icon}</span>
              <span style={{ ...styles.roleLabel, color: role.color }}>{role.label}</span>
              <span style={styles.roleDesc}>{role.desc}</span>
            </button>
          ))}
        </div>

        <p style={styles.backLink}>
          <span
            style={{ color: '#6366f1', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </span>
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#050510',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: "'Outfit', 'Segoe UI', sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '3rem',
    width: '100%',
    maxWidth: '640px',
    animation: 'fadeIn 0.5s ease',
    textAlign: 'center',
  },
  logo: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.6rem',
    marginBottom: '2rem',
  },
  logoIcon: {
    width: '40px', height: '40px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '1.2rem', color: 'white',
  },
  logoText: { fontSize: '1.5rem', fontWeight: 700, color: '#fff' },
  title: { fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' },
  subtitle: { color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '2rem',
  },
  roleCard: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '1.5rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.25s ease',
    textAlign: 'center',
  },
  roleIcon: { fontSize: '2rem' },
  roleLabel: { fontWeight: 700, fontSize: '1rem' },
  roleDesc: { color: '#64748b', fontSize: '0.78rem', lineHeight: '1.5' },
  backLink: { color: '#475569', fontSize: '0.85rem' },
}
