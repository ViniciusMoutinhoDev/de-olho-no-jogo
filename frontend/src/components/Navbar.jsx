import { Link } from 'react-router-dom'

export default function Navbar({ user, onLogout }) {
  return (
    <nav style={{
      background: '#1a1a2e', color: '#fff',
      padding: '12px 24px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link to="/" style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
        ⚽ De Olho No Jogo
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/"      style={{ color: '#ccc', fontSize: '0.9rem' }}>Buscar</Link>
        <Link to="/diary" style={{ color: '#ccc', fontSize: '0.9rem' }}>Meu Diário</Link>
        <span style={{ color: '#888', fontSize: '0.85rem' }}>{user?.nome}</span>
        <button onClick={onLogout}
          style={{ background: '#e53935', color: '#fff', padding: '6px 14px', fontSize: '0.85rem' }}>
          Sair
        </button>
      </div>
    </nav>
  )
}
