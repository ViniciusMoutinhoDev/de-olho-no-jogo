import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ user, onLogout }) {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⚽ De Olho <span>No Jogo</span>
      </Link>

      <div className="navbar-links">
        {user?.clube_coracao_nome && (
          <Link to="/" className="navbar-clube">
            {user.clube_coracao_logo && (
              <img src={user.clube_coracao_logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            )}
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{user.clube_coracao_nome}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>· {user.nome}</span>
          </Link>
        )}

        <Link to="/"      className={`nav-link ${pathname === '/'      ? 'active' : ''}`}>Início</Link>
        <Link to="/diary" className={`nav-link ${pathname === '/diary' ? 'active' : ''}`}>Diário</Link>

        {!user?.clube_coracao_nome && (
          <span className="navbar-user">{user?.nome}</span>
        )}

        <button onClick={onLogout} className="btn btn-ghost"
          style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
          Sair
        </button>
      </div>
    </nav>
  )
}
