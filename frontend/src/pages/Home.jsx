import { useState, useEffect } from 'react'
import api from '../api/client'
import { useMatches } from '../hooks/useMatches'
import MatchCard from '../components/MatchCard'
import LeagueSelector from '../components/LeagueSelector'
import HistoricoJogos from '../components/HistoricoJogos'

export default function Home({ auth }) {
  const { user, salvarClubeCoracao } = auth
  const { matches, loading, fetchMatches } = useMatches()

  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [view, setView] = useState('home')
  const [clubeAtual, setClubeAtual] = useState(null)

  useEffect(() => {
    if (user?.clube_coracao_id) {
      setClubeAtual({ id: user.clube_coracao_id, nome: user.clube_coracao_nome, logo: user.clube_coracao_logo })
      fetchMatches(user.clube_coracao_id, 'next')
    }
  }, [user?.clube_coracao_id])

  async function handleSearch(e) {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    try {
      const { data } = await api.get(`/api/clubs/search?nome=${encodeURIComponent(search)}`)
      setSearchResults(data)
    } catch { alert('Clube não encontrado') }
    finally { setSearching(false) }
  }

  async function handleSalvarCoracao(clube) {
    await salvarClubeCoracao(clube)
    setClubeAtual(clube)
    setSearchResults(null)
    setSearch('')
    setView('home')
    fetchMatches(clube.id, 'next')
  }

  function handleVerJogos(clube) {
    setClubeAtual(clube)
    setSearchResults(null)
    setSearch('')
    fetchMatches(clube.id, 'next')
    setView('jogos-avulso')
  }

  // ── SELEÇÃO POR LIGA ───────────────────────────────────────
  if (view === 'leagues') {
    return (
      <div className="page">
        <div className="page-header">
          <h2>🏆 Selecionar por Liga</h2>
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
            onClick={() => setView(user?.clube_coracao_id ? 'home' : 'search')}>
            ← Voltar
          </button>
        </div>
        <LeagueSelector />
      </div>
    )
  }

  // ── HISTÓRICO ──────────────────────────────────────────────
  if (view === 'historico' && clubeAtual) {
    return (
      <div className="page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {clubeAtual.logo && (
              <img src={clubeAtual.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            )}
            <div>
              <h2>{clubeAtual.nome}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Histórico de jogos</span>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
            onClick={() => setView(user?.clube_coracao_id ? 'home' : 'jogos-avulso')}>
            ← Próximos jogos
          </button>
        </div>
        <HistoricoJogos clubId={clubeAtual.id} cidadeOrigem={user?.cidade_origem} />
      </div>
    )
  }

  // ── COM CLUBE DO CORAÇÃO ───────────────────────────────────
  if (user?.clube_coracao_id && view === 'home') {
    return (
      <div className="page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.clube_coracao_logo && (
              <img src={user.clube_coracao_logo} alt=""
                style={{ width: 44, height: 44, objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
            )}
            <div>
              <h2>{user.clube_coracao_nome}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Próximos jogos</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
              onClick={() => { setClubeAtual({ id: user.clube_coracao_id, nome: user.clube_coracao_nome, logo: user.clube_coracao_logo }); setView('historico') }}>
              📜 Histórico
            </button>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
              onClick={() => setView('search')}>
              🔍 Buscar outro
            </button>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
              onClick={() => setView('leagues')}>
              🏆 Por liga
            </button>
          </div>
        </div>

        {loading && <div className="loading"><span className="spinner" /> Carregando jogos...</div>}
        {!loading && matches.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <p>Nenhum jogo próximo encontrado</p>
          </div>
        )}
        {matches.map((jogo, i) => (
          <div key={jogo.id} style={{ animationDelay: `${i * 0.04}s` }}>
            <MatchCard jogo={jogo} modoViagem cidadeOrigem={user.cidade_origem} />
          </div>
        ))}
      </div>
    )
  }

  // ── JOGOS AVULSO ───────────────────────────────────────────
  if (view === 'jogos-avulso' && clubeAtual) {
    return (
      <div className="page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={clubeAtual.logo} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <h2>{clubeAtual.nome}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
              onClick={() => setView('historico')}>
              📜 Histórico
            </button>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
              onClick={() => { setView('search'); setSearchResults(clubeAtual) }}>
              ← Voltar
            </button>
          </div>
        </div>
        {loading && <div className="loading"><span className="spinner" /> Carregando...</div>}
        {matches.map((jogo, i) => (
          <div key={jogo.id} style={{ animationDelay: `${i * 0.04}s` }}>
            <MatchCard jogo={jogo} modoViagem cidadeOrigem={user?.cidade_origem} />
          </div>
        ))}
      </div>
    )
  }

  // ── HOME SEM CLUBE DO CORAÇÃO ──────────────────────────────
  return (
    <div className="page">
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <h2 style={{ marginBottom: 6 }}>Qual é o seu clube? ❤️</h2>
        <p style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}>
          Salve seu clube do coração e veja os próximos jogos direto na home.
        </p>
        <form onSubmit={handleSearch} className="search-bar" style={{ maxWidth: '100%', marginBottom: '1rem' }}>
          <input
            placeholder="ex: Corinthians, Flamengo, Real Madrid..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? <span className="spinner" /> : 'Buscar'}
          </button>
        </form>

        {searchResults && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
            animation: 'slideUp 0.25s ease both', flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={searchResults.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{searchResults.nome}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{searchResults.pais}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ fontSize: '0.78rem' }}
                onClick={() => handleVerJogos(searchResults)}>
                Ver jogos
              </button>
              <button className="btn btn-primary" style={{ fontSize: '0.78rem' }}
                onClick={() => handleSalvarCoracao(searchResults)}>
                ❤️ Salvar como meu clube
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)',
          fontWeight: 700, marginBottom: '1rem' }}>
          Ou explore por liga
        </h3>
        <LeagueSelector />
      </div>
    </div>
  )
}
