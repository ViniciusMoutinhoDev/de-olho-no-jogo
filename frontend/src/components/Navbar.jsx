import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Eye, Home } from 'lucide-react'
import { useState } from 'react'
import { getColorSync } from 'colorthief'
import HamburgerMenu from './HamburgerMenu'

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    setSearchQuery('')
  }

  const handleLogoLoad = (e) => {
    try {
      const color = getColorSync(e.target)
      if (color) {
        const r = color.r !== undefined ? color.r : color[0];
        const g = color.g !== undefined ? color.g : color[1];
        const b = color.b !== undefined ? color.b : color[2];
        document.documentElement.style.setProperty('--brand-color', `rgb(${r}, ${g}, ${b})`)
      }
    } catch(err) {
      console.warn("Could not extract color", err)
    }
  }

  return (
    <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Esquerda: Brand */}
      <Link to="/?view=search" className="navbar-brand" style={{ width: '25%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px',
          background: 'var(--gold-soft)', borderRadius: '10px',
          boxShadow: '0 0 16px var(--gold-glow-lg)'
        }}>
          <Eye size={20} className="text-gold" />
        </div>
        De Olho <span className="text-gold">No Jogo</span>
      </Link>

      {/* Centro: Barra de Busca Global */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Pesquisar time, liga, ou cidade próxima..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 18px 12px 42px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-body)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
          }}
        />
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </form>

      {/* Direita: Perfil e Hamburger */}
      <div className="navbar-links flex items-center gap-3" style={{ width: '25%', justifyContent: 'flex-end', display: 'flex', alignItems: 'center', gap: 8 }}>
        {user?.clube_coracao_nome ? (
          <Link to="/?view=home" className="navbar-clube glass-panel" style={{ padding: '6px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--gold-soft)', textDecoration: 'none' }}>
            {user.clube_coracao_logo && (
              <img 
                src={user.clube_coracao_logo} 
                alt={user.clube_coracao_nome} 
                crossOrigin="anonymous"
                onLoad={handleLogoLoad}
                style={{ width: 22, height: 22, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} 
              />
            )}
            <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.02em', textShadow: '0 0 8px rgba(251, 191, 36, 0.5)' }}>
              {user.clube_coracao_nome} <span style={{ color: 'var(--text-primary)', fontWeight: 600, opacity: 0.9 }}>| {user.nome}</span>
            </span>
          </Link>
        ) : (
          <span className="navbar-user" style={{ color: 'var(--text-secondary)', fontWeight: 500, paddingRight: '12px' }}>
            {user?.nome}
          </span>
        )}

        {/* Botão de Casa fora do menu */}
        <Link to="/?view=search"
          title="Início / Buscar"
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
            transition: 'all 0.2s', backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          <Home size={17} />
        </Link>

        <HamburgerMenu user={user} onLogout={onLogout} />
      </div>
    </nav>
  )
}
