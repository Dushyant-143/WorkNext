import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const features = [
  { icon: '👑', title: 'Owner Control', desc: 'Full authority over users and system. Create accounts, set passwords, complete oversight.', color: '#f59e0b' },
  { icon: '📋', title: 'Manager Tasks', desc: 'Create tasks, assign team leads, track progress and approve final submissions.', color: '#6366f1' },
  { icon: '🎯', title: 'Team Lead Flow', desc: 'Accept or reject tasks, distribute to developers, track team delivery in real-time.', color: '#8b5cf6' },
  { icon: '⚡', title: 'Developer Focus', desc: 'See only your assigned tasks. Accept, work, submit. Zero noise, full focus.', color: '#06b6d4' },
  { icon: '📊', title: 'Role Dashboards', desc: 'Every role gets a custom dashboard built exactly for their responsibilities.', color: '#10b981' },
  { icon: '🔒', title: 'Secure by Design', desc: 'JWT auth, role-based permissions, token blacklisting. Security at every layer.', color: '#f97316' },
]

const steps = [
  { num: '01', role: 'Manager', action: 'Creates task & assigns to Team Lead', color: '#6366f1' },
  { num: '02', role: 'Team Lead', action: 'Accepts task, assigns a Developer', color: '#8b5cf6' },
  { num: '03', role: 'Developer', action: 'Works on task & submits for review', color: '#06b6d4' },
  { num: '04', role: 'Manager', action: 'Reviews submission & approves', color: '#10b981' },
]

const roles = [
  { icon: '👑', label: 'Owner', color: '#f59e0b' },
  { icon: '📋', label: 'Manager', color: '#6366f1' },
  { icon: '🎯', label: 'Team Lead', color: '#8b5cf6' },
  { icon: '⚡', label: 'Developer', color: '#06b6d4' },
]

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function AnimSection({ children, delay = 0, style = {} }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    const onMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('scroll', onScroll)
    window.addEventListener('mousemove', onMouse)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
      op: Math.random() * 0.3 + 0.04,
    }))
    let id
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,102,241,${p.op})`; ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < 110) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - d / 110)})`
          ctx.lineWidth = 0.4; ctx.stroke()
        }
      }))
      id = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize) }
  }, [])

  const navSolid = scrollY > 50

  return (
    <div style={{ minHeight: '100vh', background: '#030308', color: '#e2e8f0', fontFamily: "'Outfit','Inter',sans-serif", overflowX: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Mouse glow */}
      <div style={{
        position: 'fixed', zIndex: 0, pointerEvents: 'none',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
        transition: 'transform 0.15s ease',
      }} />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 3rem',
        background: navSolid ? 'rgba(3,3,8,0.92)' : 'transparent',
        backdropFilter: navSolid ? 'blur(20px)' : 'none',
        borderBottom: navSolid ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>W</div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>WorkNext</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {['Features', 'How it works'].map(l => (
            <button key={l} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', padding: '0.4rem 0.75rem', borderRadius: '6px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              onClick={() => document.getElementById(l === 'Features' ? 'features' : 'how')?.scrollIntoView({ behavior: 'smooth' })}>
              {l}
            </button>
          ))}
          <button style={{ marginLeft: '0.5rem', padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)' }}
            onClick={() => navigate('/role-select')}>
            Sign In →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '9rem 1.5rem 5rem' }}>

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '25%', right: '15%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.9rem 0.3rem 0.5rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '100px', marginBottom: '2rem', animation: 'fadeUp 0.8s ease both' }}>
          <div style={{ width: '18px', height: '18px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: 800 }}>W</div>
          <span style={{ fontSize: '0.75rem', color: '#818cf8', letterSpacing: '0.03em' }}>Role-Based Task Management Platform</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.12, color: '#f8fafc', marginBottom: '1.5rem', maxWidth: '820px', letterSpacing: '-0.02em', animation: 'fadeUp 0.8s ease 0.1s both' }}>
          The workspace where<br />
          <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            every role has a purpose.
          </span>
        </h1>

        {/* Subtext */}
        <p style={{ maxWidth: '520px', fontSize: '1.05rem', color: '#64748b', lineHeight: 1.8, marginBottom: '2.5rem', animation: 'fadeUp 0.8s ease 0.2s both' }}>
          Owner, Manager, Team Lead, Developer — each gets a dedicated dashboard and workflow. No clutter. No confusion. Just clarity.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3.5rem', animation: 'fadeUp 0.8s ease 0.3s both' }}>
          <button style={{ padding: '0.9rem 2.4rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 32px rgba(99,102,241,0.35)', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.35)' }}
            onClick={() => navigate('/role-select')}>
            Get Started Free
          </button>
          <button style={{ padding: '0.9rem 2.4rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
            See how it works ↓
          </button>
        </div>

        {/* Role pills */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3.5rem', animation: 'fadeUp 0.8s ease 0.4s both' }}>
          {roles.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', background: `${r.color}0d`, border: `1px solid ${r.color}30`, borderRadius: '100px', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${r.color}18`; e.currentTarget.style.borderColor = `${r.color}55`; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = `${r.color}0d`; e.currentTarget.style.borderColor = `${r.color}30`; e.currentTarget.style.transform = 'translateY(0)' }}>
              <span style={{ fontSize: '1rem' }}>{r.icon}</span>
              <span style={{ color: r.color, fontWeight: 600, fontSize: '0.82rem' }}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', animation: 'fadeUp 0.8s ease 0.5s both' }}>
          {[['4', 'Role Levels'], ['JWT', 'Auth'], ['Real-time', 'Tracking'], ['100%', 'Role Isolated']].map(([v, l], i, arr) => (
            <div key={l} style={{ padding: '1rem 2rem', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8', marginBottom: '0.2rem' }}>{v}</div>
              <div style={{ fontSize: '0.68rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <AnimSection>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <div style={TAG}>Features</div>
              <h2 style={H2}>Everything your team needs</h2>
              <p style={SUB}>Built around roles — not generic task boards.</p>
            </div>
          </AnimSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
            {features.map((f, i) => (
              <AnimSection key={f.title} delay={i * 0.07}>
                <div style={{ background: '#030308', padding: '2rem', height: '100%', transition: 'background 0.25s' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${f.color}07`}
                  onMouseLeave={e => e.currentTarget.style.background = '#030308'}>
                  <div style={{ width: '40px', height: '40px', background: `${f.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', marginBottom: '1rem' }}>{f.icon}</div>
                  <h3 style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>{f.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <AnimSection>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <div style={TAG}>Workflow</div>
              <h2 style={H2}>How tasks flow</h2>
              <p style={SUB}>A clear chain from creation to completion — every step tracked.</p>
            </div>
          </AnimSection>

          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '1px', background: 'linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(6,182,212,0.4))', zIndex: 0 }} />

            {steps.map((s, i) => (
              <AnimSection key={s.num} delay={i * 0.1}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: i < steps.length - 1 ? '1.5rem' : '0', position: 'relative', zIndex: 1 }}>
                  {/* Number circle */}
                  <div style={{ width: '40px', height: '40px', flexShrink: 0, background: `${s.color}18`, border: `1px solid ${s.color}40`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: s.color }}>
                    {s.num}
                  </div>
                  {/* Card */}
                  <div style={{ flex: 1, background: `${s.color}06`, border: `1px solid ${s.color}20`, borderRadius: '14px', padding: '1.25rem 1.5rem', transition: 'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${s.color}10`; e.currentTarget.style.borderColor = `${s.color}38`; e.currentTarget.style.transform = 'translateX(4px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${s.color}06`; e.currentTarget.style.borderColor = `${s.color}20`; e.currentTarget.style.transform = 'translateX(0)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                      <span style={{ color: s.color, fontWeight: 700, fontSize: '0.95rem' }}>{s.role}</span>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: s.color, opacity: 0.5 }} />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.55 }}>{s.action}</p>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '6rem 1.5rem' }}>
        <AnimSection>
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '24px', padding: '4rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
              {/* Glow */}
              <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '200px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={TAG}>Get started today</div>
              <h2 style={{ ...H2, marginBottom: '1rem' }}>Ready to bring order to your team?</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '2.25rem' }}>
                Sign in with your role and experience a workspace built just for you.
              </p>
              <button style={{ padding: '1rem 3rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 32px rgba(99,102,241,0.35)', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 44px rgba(99,102,241,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.35)' }}
                onClick={() => navigate('/role-select')}>
                Sign In to WorkNext →
              </button>
            </div>
          </div>
        </AnimSection>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 3rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>W</div>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>WorkNext</span>
        </div>
        <span style={{ color: '#374151', fontSize: '0.8rem' }}>© 2026 WorkNext. All rights reserved.</span>
      </footer>

      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @media (max-width:640px) {
          nav { padding: 0.875rem 1.25rem !important; }
          footer { padding: 1.25rem 1.5rem !important; }
          h1 { font-size: 2rem !important; }
        }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #030308; }
        ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 3px; }
      `}</style>
    </div>
  )
}

const TAG = {
  display: 'inline-block', padding: '0.28rem 0.85rem',
  background: 'rgba(99,102,241,0.09)', border: '1px solid rgba(99,102,241,0.18)',
  borderRadius: '100px', fontSize: '0.7rem', color: '#818cf8',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem',
}
const H2 = {
  fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700,
  color: '#f1f5f9', marginBottom: '0.65rem', letterSpacing: '-0.01em', lineHeight: 1.25,
}
const SUB = { color: '#64748b', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '2.5rem' }
