import { useState } from 'react'
import api from '../api/client'
import { useMatches } from '../hooks/useMatches'
import MatchCard from '../components/MatchCard'
import { Search, Loader2, SearchX, Calendar, History, MapPin } from 'lucide-react'

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
    <div className="page animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem' }}>Explorar Equipes</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Busque por qualquer time e planeje suas viagens para os jogos.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '2.5rem' }}>
        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
          <Search size={20} />
        </div>
        <input
          placeholder="Ex: Corinthians, Real Madrid, Boca Juniors..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ 
            width: '100%', height: '56px', paddingLeft: '48px', paddingRight: '120px',
            borderRadius: 'var(--radius-pill)', fontSize: '1rem',
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)', transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--green)'
            e.target.style.boxShadow = '0 0 0 4px var(--green-glow)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border-strong)'
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={searching}
          style={{ 
            position: 'absolute', right: '4px', top: '4px', bottom: '4px', 
            borderRadius: '40px', padding: '0 24px' 
          }}>
          {searching ? <Loader2 size={18} className="spinner" /> : 'Procurar'}
        </button>
      </form>

      {club && (
        <div className="animate-slide-up">
          <div className="glass-panel" style={{ 
            padding: '1.5rem', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '1.25rem',
            background: 'linear-gradient(135deg, rgba(20, 26, 38, 0.6) 0%, rgba(10, 14, 20, 0.4) 100%)'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '20%', background: 'rgba(255,255,255,0.03)', padding: '10px', flexShrink: 0 }}>
              <img src={club.logo} alt={club.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} onError={e => e.target.style.opacity = '0.1'} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>{club.nome}</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <MapPin size={12} /> {club.pais}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', padding: '6px', borderRadius: 'var(--radius-pill)', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => switchTab('next')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '40px',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-body)',
                background: tab === 'next' ? 'var(--blue)' : 'transparent',
                color: tab === 'next' ? '#fff' : 'rgba(255,255,255,0.5)'
              }}>
              <Calendar size={16} /> Próximos Jogos
            </button>
            <button onClick={() => switchTab('last')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '40px',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-body)',
                background: tab === 'last' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: tab === 'last' ? '#fff' : 'rgba(255,255,255,0.5)'
              }}>
              <History size={16} /> Resultados Anteriores
            </button>
          </div>

          {loading && (
            <div className="loading" style={{ minHeight: '30vh', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
              <Loader2 size={28} className="spinner text-blue" />
              <span style={{ marginTop: '1rem', fontWeight: 600 }}>Sincronizando {tab === 'next' ? 'agenda' : 'resultados'}...</span>
            </div>
          )}

          {!loading && matches.length === 0 && (
            <div className="empty-state glass-panel" style={{ padding: '3rem', border: 'none' }}>
              <SearchX size={48} className="empty-state-icon mx-auto" style={{ color: 'var(--text-muted)' }} />
              <p>Nenhuma partida agendada para este período</p>
            </div>
          )}

          {!loading && matches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matches.map((jogo, i) => (
                <div key={jogo.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <MatchCard
                    jogo={jogo}
                    modoViagem={tab === 'next'}
                    cidadeOrigem={user.cidade_origem}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!club && !searching && (
        <div className="empty-state" style={{ marginTop: '4rem' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.02)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <Search size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Onde seu time vai jogar?</h3>
          <p style={{ maxWidth: 300, margin: '0 auto' }}>Descubra as próximas datas e trace as melhores opções para viajar e apoiar da arquibancada.</p>
        </div>
      )}
    </div>
  )
}
