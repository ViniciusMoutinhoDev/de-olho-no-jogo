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
      setTab('next')
      await fetchMatches(data.id, 'next')
    } catch {
      alert('Clube não encontrado')
    } finally {
      setSearching(false)
    }
  }

  async function switchTab(tipo) {
    setTab(tipo)
    if (club) await fetchMatches(club.id, tipo)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Explorar Clube</h2>
      </div>

      <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: '1.5rem' }}>
        <input
          placeholder="Buscar time... ex: Corinthians, Real Madrid"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={searching}>
          {searching ? <span className="spinner" /> : 'Buscar'}
        </button>
      </form>

      {club && (
        <>
          <div className="club-header animate-slide-up">
            <img src={club.logo} alt={club.nome} className="club-logo" />
            <div className="club-info">
              <h2>{club.nome}</h2>
              <span className="club-meta">{club.pais} · ID {club.id}</span>
            </div>
          </div>

          <div className="tabs">
            {[['next', '📅 Próximos'], ['last', '📜 Histórico']].map(([tipo, label]) => (
              <button key={tipo} onClick={() => switchTab(tipo)}
                className={`tab-btn ${tab === tipo ? 'active' : ''}`}>
                {label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="loading">
              <span className="spinner" />
              Carregando jogos...
            </div>
          )}

          {!loading && matches.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">📭</span>
              <p>Nenhum jogo encontrado para este período</p>
            </div>
          )}

          {matches.map((jogo, i) => (
            <div key={jogo.id} style={{ animationDelay: `${i * 0.04}s` }}>
              <MatchCard
                jogo={jogo}
                modoViagem={tab === 'next'}
                cidadeOrigem={user.cidade_origem}
              />
            </div>
          ))}
        </>
      )}

      {!club && (
        <div className="empty-state" style={{ marginTop: '4rem' }}>
          <span className="empty-state-icon">🔍</span>
          <p>Busque um clube para ver os jogos e planejar sua viagem</p>
        </div>
      )}
    </div>
  )
}
