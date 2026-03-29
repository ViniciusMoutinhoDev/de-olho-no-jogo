import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useMatches } from '../hooks/useMatches'
import MatchCard from '../components/MatchCard'
import LeagueSelector from '../components/LeagueSelector'
import HistoricoJogos from '../components/HistoricoJogos'
import { Search, Heart, ArrowLeft, Trophy, History, MapPin, Loader2, Inbox } from 'lucide-react'

export default function Home({ auth }) {
  const { user, salvarClubeCoracao, atualizarCidade } = auth
  const { matches, loading, fetchMatches } = useMatches()
  const location = useLocation()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [view, setView] = useState('home')
  const [clubeAtual, setClubeAtual] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('view') === 'search') {
      setView('search')
    } else if (params.get('view') === 'home') {
      setView('home')
    } else if (!user?.clube_coracao_id) {
      setView('search')
    }
  }, [location.search, user])

  useEffect(() => {
    if (user?.clube_coracao_id && view === 'home') {
      setClubeAtual({ id: user.clube_coracao_id, nome: user.clube_coracao_nome, logo: user.clube_coracao_logo })
      fetchMatches(user.clube_coracao_id, 'next')
    }
  }, [user?.clube_coracao_id, view])

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
      <div className="page animate-fade-in">
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, background: 'var(--blue-soft)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--blue-glow)' }}>
              <Trophy size={20} className="text-blue" />
            </div>
            <h2>Explorar Ligas</h2>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }}
            onClick={() => setView(user?.clube_coracao_id ? 'home' : 'search')}>
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
        <LeagueSelector />
      </div>
    )
  }

  // ── HISTÓRICO ──────────────────────────────────────────────
  if (view === 'historico' && clubeAtual) {
    return (
      <div className="page animate-fade-in">
        <div className="page-header club-header" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(22, 29, 43, 0.8) 0%, rgba(10, 15, 25, 0.6) 100%)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {clubeAtual.logo && (
              <img src={clubeAtual.logo} alt="" style={{ width: 48, height: 48, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
            )}
            <div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '2px' }}>{clubeAtual.nome}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <History size={14} /> Histórico de jogos
              </span>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }}
            onClick={() => setView(user?.clube_coracao_id ? 'home' : 'jogos-avulso')}>
            <ArrowLeft size={16} /> Próximos jogos
          </button>
        </div>
        <HistoricoJogos clubId={clubeAtual.id} cidadeOrigem={user?.cidade_origem} />
      </div>
    )
  }

  // ── COM CLUBE DO CORAÇÃO ───────────────────────────────────
  if (user?.clube_coracao_id && view === 'home') {
    return (
      <div className="page animate-fade-in">
        {/* CLUBE DO CORAÇÃO - LIQUID GLASS FUTURISTA */}
        <div 
          className="club-header liquid-glass" 
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
            e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
          }}
          style={{ 
            marginBottom: '2.5rem',
            padding: '2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            position: 'relative', 
            overflow: 'hidden',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(20,20,20,0.5) 0%, rgba(5,5,5,0.8) 100%)',
            backdropFilter: 'blur(30px) saturate(200%)',
            WebkitBackdropFilter: 'blur(30px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Camada Liquid (Bolinhas desfocadas se movendo passivamente + mouse tracking) */}
          <div style={{
            position: 'absolute', top: -50, left: -50, width: 200, height: 200,
            background: 'var(--gold)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%',
            animation: 'floatLiquid 10s infinite ease-in-out'
          }} />
          <div style={{
            position: 'absolute', bottom: -50, right: -50, width: 250, height: 250,
            background: 'var(--blue)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%',
            animation: 'floatLiquid 12s infinite reverse ease-in-out'
          }} />
          {/* Tracking do Mouse Ouro Profundo */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle 400px at var(--mouse-x, -500px) var(--mouse-y, -500px), var(--gold-glow-lg), transparent 70%)',
            mixBlendMode: 'screen', zIndex: 0
          }} />

          {/* Top part: Logo + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', position: 'relative', zIndex: 1 }}>
            {user.clube_coracao_logo && (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -15, background: 'var(--gold)', filter: 'blur(25px)', borderRadius: '50%', opacity: 0.4 }}></div>
                <img src={user.clube_coracao_logo} alt={user.clube_coracao_nome} crossOrigin="anonymous"
                  style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))', position: 'relative', zIndex: 1 }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--gold)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800, marginBottom: '4px', textShadow: '0 0 12px var(--gold-glow)' }}>O Mais Querido</div>
              <h2 style={{ fontSize: '2.8rem', color: '#FFF', fontWeight: 900, textShadow: '0 4px 16px rgba(0,0,0,0.8)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {user.clube_coracao_nome}
              </h2>
            </div>
          </div>

          {/* Action Buttons Glass */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', position: 'relative', zIndex: 1, marginTop: '0.5rem' }}>
            <button
              style={{ padding: '14px 28px', fontSize: '0.95rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 'var(--radius-pill)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(12px)', transition: 'all 0.3s', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none' }}
              onClick={() => { 
                setClubeAtual({ id: user.clube_coracao_id, nome: user.clube_coracao_nome, logo: user.clube_coracao_logo }); 
                fetchMatches(user.clube_coracao_id, 'all', new Date().getFullYear());
                setView('jogos-avulso');
              }}>
              <Trophy size={18} /> Resultados (2026)
            </button>
            <button
              style={{ padding: '14px 28px', fontSize: '0.95rem', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(12px)', transition: 'all 0.3s', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none' }}
              onClick={() => { 
                setClubeAtual({ id: user.clube_coracao_id, nome: user.clube_coracao_nome, logo: user.clube_coracao_logo }); 
                setView('historico');
              }}>
              <History size={18} /> Arquivo de Temporadas
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Próximos Confrontos</h3>
        </div>

        {loading ? (
          <div className="loading" style={{ minHeight: '30vh' }}><Loader2 size={28} className="spinner" /> Carregando estatísticas...</div>
        ) : matches.length === 0 ? (
          <div className="empty-state card glass-panel">
            <Inbox size={48} className="empty-state-icon mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p>Nenhum jogo confirmado na agenda do {user.clube_coracao_nome}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {matches.map((jogo, i) => (
              <div key={jogo.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <MatchCard jogo={jogo} modoViagem user={user} cidadeOrigem={user.cidade_origem} onCidadeAtualizada={atualizarCidade} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── JOGOS AVULSO ───────────────────────────────────────────
  if (view === 'jogos-avulso' && clubeAtual) {
    return (
      <div className="page animate-fade-in">
        <div className="page-header glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={clubeAtual.logo} alt="" style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
            <h2 style={{ fontSize: '1.5rem' }}>{clubeAtual.nome}</h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm"
              onClick={() => setView('historico')}>
              <History size={14} /> Histórico
            </button>
            <button className="btn btn-ghost btn-sm"
              onClick={() => { setView('search'); setSearchResults(clubeAtual) }}>
              <ArrowLeft size={14} /> Voltar
            </button>
          </div>
        </div>
        
        {loading ? (
           <div className="loading"><Loader2 size={24} className="spinner" /> Buscando dados de {clubeAtual.nome}...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {matches.map((jogo, i) => (
              <div key={jogo.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <MatchCard jogo={jogo} modoViagem user={user} cidadeOrigem={user?.cidade_origem} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── HOME SEM CLUBE DO CORAÇÃO (HERO BOLADO) ────────────────
  return (
    <div className="page animate-fade-in">
      <div className="card" style={{ 
        position: 'relative', overflow: 'hidden', padding: '3.5rem 2rem', 
        marginBottom: '2rem', textAlign: 'center',
        background: 'linear-gradient(145deg, rgba(20, 26, 38, 0.8) 0%, rgba(10, 14, 20, 0.95) 100%)',
        border: '1px solid rgba(0, 232, 150, 0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 80px rgba(0, 232, 150, 0.03)'
      }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '120%', height: '200%', background: 'radial-gradient(circle at 50% 10%, rgba(0,232,150,0.06) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '580px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', marginBottom: '1rem', color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>Defina o seu Clube</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.5 }}>
            Acompanhe o calendário completo, descubra as melhores rotas de viagem e não perca nenhum jogo decisivo.
          </p>
          
          <form onSubmit={handleSearch} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '20px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <Search size={22} />
            </div>
            <input
              placeholder="Digite o nome do clube (ex: Flamengo, Real Madrid)"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ 
                height: '64px', paddingLeft: '56px', paddingRight: '140px',
                borderRadius: 'var(--radius-pill)', fontSize: '1.1rem',
                border: '1px solid var(--border-strong)', background: 'var(--bg-card)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            />
            <button type="submit" className="btn btn-primary" disabled={searching}
              style={{ position: 'absolute', right: '8px', height: '48px', borderRadius: 'inherit', padding: '0 24px' }}>
              {searching ? <Loader2 size={20} className="spinner" /> : 'Procurar'}
            </button>
          </form>
        </div>

        {searchResults && (
          <div className="card glass-panel" style={{
            marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', animation: 'slideUp 0.35s var(--ease-elastic) both', flexWrap: 'wrap', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 56, height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: '14px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' 
              }}>
                <img src={searchResults.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{searchResults.nome}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {searchResults.pais}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ padding: '10px 22px', fontSize: '0.9rem', borderRadius: 'var(--radius-pill)', background: 'var(--gold)', color: '#000', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, border: 'none', boxShadow: '0 4px 16px rgba(251,191,36,0.4)', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none' }}
                onClick={async () => {
                  try {
                    await handleSalvarCoracao(searchResults);
                    // Para melhorar a ux, já joga os jogos do time que acabou de favoritar
                    setClubeAtual(searchResults);
                    fetchMatches(searchResults.id, 'all', new Date().getFullYear());
                    setView('jogos-avulso');
                  } catch (e) { console.error(e) }
                }}>
                <Heart size={16} className="fill-current" /> Meu Time!
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Trophy size={20} className="text-blue" />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Ou explore por Liga</h3>
        </div>
        <LeagueSelector />
      </div>
    </div>
  )
}
