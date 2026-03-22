import { useState } from 'react'
import api from '../api/client'
import { useMatches } from '../hooks/useMatches'
import MatchCard from '../components/MatchCard'

export default function ClubSearch() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [search, setSearch] = useState('')
  const [club, setClub] = useState(null)
  const [searching, setSearching] = useState(false)
  const [tab, setTab] = useState('next')
  const { matches, loading, fetchMatches } = useMatches()

  async function handleSearch(e) {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    try {
      const { data } = await api.get(`/api/clubs/search?nome=${encodeURIComponent(search)}`)
      setClub(data)
    } catch {
      alert('Clube não encontrado')
    } finally {
      setSearching(false)
    }
  }

  async function loadMatches(tipo) {
    setTab(tipo)
    await fetchMatches(club.id, tipo)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ marginBottom: 20 }}>🔍 Buscar Clube</h2>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input placeholder="Nome do clube..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
        <button type="submit" disabled={searching}
          style={{ background: '#1a1a2e', color: '#fff', whiteSpace: 'nowrap' }}>
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {club && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
            padding: '16px', background: '#fff', borderRadius: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <img src={club.logo} alt={club.nome} style={{ width: 60, height: 60, objectFit: 'contain' }} />
            <div>
              <h3 style={{ margin: 0 }}>{club.nome}</h3>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>{club.pais}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[['next', '📅 Próximos'], ['last', '📜 Histórico']].map(([tipo, label]) => (
              <button key={tipo} onClick={() => loadMatches(tipo)}
                style={{ background: tab === tipo ? '#1a1a2e' : '#e0e0e0',
                  color: tab === tipo ? '#fff' : '#333' }}>
                {label}
              </button>
            ))}
          </div>

          {loading && <p style={{ color: '#666' }}>Carregando jogos...</p>}

          {matches.map(jogo => (
            <MatchCard
              key={jogo.id}
              jogo={jogo}
              modoViagem={tab === 'next'}
              cidadeOrigem={user.cidade_origem}
            />
          ))}
        </>
      )}
    </div>
  )
}
