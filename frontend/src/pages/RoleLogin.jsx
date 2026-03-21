import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleConfig = {
  owner: { label: 'Owner', icon: '👑', color: '#f59e0b', desc: 'System Owner Access' },
  manager: { label: 'Manager', icon: '📋', color: '#6366f1', desc: 'Manager Access' },
  team_lead: { label: 'Team Lead', icon: '🎯', color: '#8b5cf6', desc: 'Team Lead Access' },
  developer: { label: 'Developer', icon: '⚡', color: '#06b6d4', desc: 'Developer Access' },
}

export default function RoleLogin() {
  const { role } = useParams()
  const config = roleConfig[role] || roleConfig.developer
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(form.username, form.password, role)
      // Redirect based on role
      const routes = {
        owner: '/owner/dashboard',
        manager: '/manager/dashboard',
        team_lead: '/teamlead/dashboard',
        developer: '/developer/dashboard',
      }
      navigate(routes[user.role] || '/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials or wrong role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...styles.root, '--role-color': config.color }}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>W</div>
          <span style={styles.logoText}>WorkNext</span>
        </div>

        {/* Role Badge */}
        <div style={{ ...styles.roleBadge, background: `${config.color}18`, border: `1px solid ${config.color}44`, color: config.color }}>
          <span>{config.icon}</span>
          <span>{config.desc}</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in as <strong style={{ color: config.color }}>{config.label}</strong></p>

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={styles.input}
              placeholder="Enter your username"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ ...styles.input, paddingRight: '3rem' }}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              background: loading ? '#374151' : `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
              boxShadow: loading ? 'none' : `0 8px 30px ${config.color}44`,
            }}
          >
            {loading ? 'Signing in...' : `Sign In as ${config.label}`}
          </button>
        </form>

        <div style={styles.footer}>
          <span
            style={{ color: '#6366f1', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => navigate('/role-select')}
          >
            ← Choose different role
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus { outline: none; border-color: ${config.color} !important; box-shadow: 0 0 0 3px ${config.color}22 !important; }
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
    maxWidth: '420px',
    animation: 'fadeIn 0.5s ease',
  },
  logo: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.6rem',
    marginBottom: '1.5rem',
  },
  logoIcon: {
    width: '38px', height: '38px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '1rem', color: 'white',
  },
  logoText: { fontSize: '1.4rem', fontWeight: 700, color: '#fff' },
  roleBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '100px',
    fontSize: '0.85rem', fontWeight: 600,
    marginBottom: '1.5rem',
  },
  title: { fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem', textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 },
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#e2e8f0',
    fontSize: '0.95rem',
    width: '100%',
    transition: 'all 0.2s',
  },
  eyeBtn: {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '1rem',
  },
  submitBtn: {
    padding: '0.85rem',
    color: 'white', border: 'none',
    borderRadius: '12px',
    fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '0.5rem',
  },
  footer: { textAlign: 'center', marginTop: '1.5rem' },
}
