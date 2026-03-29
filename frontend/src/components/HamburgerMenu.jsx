import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Home, CalendarDays, Plane, MapPin, LogOut } from 'lucide-react'

export default function HamburgerMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const closeAndNavigate = (path) => {
    setIsOpen(false)
    navigate(path)
  }

  const toggle = () => setIsOpen(!isOpen)

  return (
    <>
      <button 
        onClick={toggle}
        className="btn btn-ghost"
        style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', color: 'var(--text-primary)' }}
      >
        <Menu size={24} />
      </button>

      {/* Backdrop overlay */}
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'all' : 'none',
          transition: 'var(--transition)', zIndex: 999
        }}
        onClick={toggle}
      />

      {/* Slide-out Menu */}
      <div 
        style={{
          position: 'fixed', top: 0, right: isOpen ? 0 : '-350px',
          width: '300px', height: '100vh', zIndex: 1000,
          background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.8)',
          transition: 'var(--transition)', padding: '2rem 1.5rem',
          display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Menu</h3>
          <button onClick={toggle} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <MenuItem icon={<Home size={20}/>} label="Início / Buscar" onClick={() => closeAndNavigate('/?view=search')} />
          {user?.clube_coracao_id && (
            <MenuItem icon={<img src={user.clube_coracao_logo} style={{width: 20, height: 20, objectFit: 'contain'}} alt=""/>} 
                      label="Meu Clube" onClick={() => closeAndNavigate('/?view=home')} />
          )}
          <MenuItem icon={<Plane size={20}/>} label="Minhas Viagens" onClick={() => closeAndNavigate('/trips')} />
          <MenuItem icon={<CalendarDays size={20}/>} label="Meu Diário" onClick={() => closeAndNavigate('/diary')} />
          <MenuItem icon={<MapPin size={20}/>} label="Endereços" onClick={() => closeAndNavigate('/settings')} />
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
          <MenuItem icon={<LogOut size={20}/>} label="Sair" onClick={() => { setIsOpen(false); onLogout(); }} isDanger />
        </div>
      </div>
    </>
  )
}

function MenuItem({ icon, label, onClick, isDanger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem', width: '100%',
        padding: '14px 16px', background: 'transparent', border: 'none',
        borderRadius: 'var(--radius-md)', textAlign: 'left',
        color: isDanger ? '#EF4444' : 'var(--text-primary)',
        fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer',
        transition: 'var(--transition-fast)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ color: isDanger ? '#EF4444' : 'var(--gold)' }}>{icon}</span> {label}
    </button>
  )
}
