import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import Toast from '../../components/Toast'

export default function ManagerTeam() {
  const [teamleads, setTeamleads] = useState([])
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/auth/teamleads/?page_size=100'),
      api.get('/auth/developers/?page_size=100'),
    ]).then(([tlRes, devRes]) => {
      setTeamleads(tlRes.data.results || tlRes.data || [])
      setDevelopers(devRes.data.results || devRes.data || [])
    }).catch(() => setToast({ message: 'Failed to load team', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  const Section = ({ title, icon, color, users }) => (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>
        <span style={{ color }}>{icon}</span> {title}
        <span style={{ color: '#475569', fontWeight: 400, fontSize: '0.85rem', marginLeft: '0.5rem' }}>
          ({users.length})
        </span>
      </h2>
      {users.length === 0 ? (
        <p style={{ color: '#374151', fontSize: '0.88rem' }}>No {title.toLowerCase()} yet</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {users.map(u => (
            <div key={u.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${color}22`,
              borderRadius: '12px', padding: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: `${color}15`, color, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1rem',
              }}>
                {u.first_name ? u.first_name[0].toUpperCase() : u.username[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                </p>
                <p style={{ color: '#475569', fontSize: '0.75rem' }}>@{u.username}</p>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 600,
                padding: '0.15rem 0.45rem', borderRadius: '100px',
                background: u.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: u.is_active ? '#10b981' : '#f87171',
                border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                flexShrink: 0,
              }}>
                {u.is_active ? 'Active' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Layout>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>My Team</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            {teamleads.length} team leads · {developers.length} developers
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            <Section title="Team Leads" icon="🎯" color="#8b5cf6" users={teamleads} />
            <Section title="Developers" icon="⚡" color="#06b6d4" users={developers} />
          </>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  )
}