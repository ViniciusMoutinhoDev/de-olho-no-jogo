import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { Search, Globe, ChevronRight, X, Trophy, XCircle, ChevronDown, Activity } from 'lucide-react'

const LOGO_LIGA = (id) => `https://api.sofascore.app/api/v1/unique-tournament/${id}/image`

const FLAG_URL = (paisId) => {
  const codigos = {
    brasil: 'br', england: 'gb-eng', spain: 'es', france: 'fr',
    argentina: 'ar', germany: 'de', italy: 'it', portugal: 'pt',
    usa: 'us', mexico: 'mx',
  }
  const code = codigos[paisId]
  return code ? `https://flagcdn.com/w40/${code}.png` : null
}

export default function LeagueSelector() {
  const navigate   = useNavigate()
  const timeoutRef = useRef(null)

  const [paises, setPaises]     = useState([])
  const [paisSel, setPaisSel]   = useState(null)

  const [todasLigas, setTodasLigas]   = useState([])
  const [principaisLigas, setPrincipaisLigas] = useState([])
  const [loadingLigas, setLoadingLigas] = useState(false)

  const [filtro, setFiltro]       = useState('')
  const [verTodas, setVerTodas]   = useState(false)

  const [query, setQuery]               = useState('')
  const [searching, setSearching]       = useState(false)
  const [searchResults, setSearchResults] = useState(null)

  useEffect(() => {
    api.get('/api/leagues/paises').then(r => setPaises(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    clearTimeout(timeoutRef.current)
    if (!query.trim()) { setSearchResults(null); return }

    timeoutRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const [clubeRes, ligaRes] = await Promise.allSettled([
          api.get(`/api/clubs/search?nome=${encodeURIComponent(query)}`),
          api.get(`/api/leagues/search?q=${encodeURIComponent(query)}`),
        ])
        const clube = clubeRes.status === 'fulfilled' ? clubeRes.value.data : null
        const ligas = ligaRes.status  === 'fulfilled' ? ligaRes.value.data  : []
        setSearchResults({ clube, ligas })
      } catch {
        setSearchResults({ clube: null, ligas: [] })
      } finally {
        setSearching(false)
      }
    }, 450)
  }, [query])

  async function selecionarPais(paisId) {
    if (paisSel?.id === paisId) {
      setPaisSel(null); setTodasLigas([]); setPrincipaisLigas([])
      setFiltro(''); setVerTodas(false)
      return
    }
    const pais = paises.find(p => p.id === paisId) || { id: paisId }
    setPaisSel(pais)
    setTodasLigas([]); setPrincipaisLigas([])
    setFiltro(''); setVerTodas(false)
    setLoadingLigas(true)
    try {
      const { data } = await api.get(`/api/leagues/${paisId}/ligas`)
      setPrincipaisLigas(data.principais || [])
      setTodasLigas(data.todas || [])
    } catch {
      setPrincipaisLigas([]); setTodasLigas([])
    } finally {
      setLoadingLigas(false)
    }
  }

  function irParaLiga(liga) {
    navigate(`/league/${liga.id}?nome=${encodeURIComponent(liga.nome)}`)
    setQuery(''); setSearchResults(null)
  }

  function irParaClube(clube) {
    navigate(`/?clube=${clube.id}&nome=${encodeURIComponent(clube.nome)}&logo=${encodeURIComponent(clube.logo)}`)
  }

  const listaBase  = verTodas ? todasLigas : principaisLigas
  const ligasFiltradas = filtro.trim()
    ? listaBase.filter(l => l.nome.toLowerCase().includes(filtro.toLowerCase()))
    : listaBase

  const temResultados = searchResults &&
    (searchResults.clube || searchResults.ligas?.length > 0)

  return (
    <div>
      {/* ── BARRA DE BUSCA GLOBAL ── */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-pill)', padding: '12px 20px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
        }}>
          {searching ? <span className="spinner" style={{ width: 20, height: 20, color: 'var(--text-muted)' }} /> : <Search size={22} className="text-muted" />}
          
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Encontre qualquer liga ou time..."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '1rem', color: 'var(--text-primary)',
              width: '100%', padding: 0, boxShadow: 'none'
            }}
            onFocus={e => {
              e.currentTarget.parentElement.style.borderColor = 'var(--green)'
              e.currentTarget.parentElement.style.boxShadow = '0 0 0 4px var(--green-glow-lg)'
            }}
            onBlur={e => {
              e.currentTarget.parentElement.style.borderColor = 'var(--border-strong)'
              e.currentTarget.parentElement.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.4)'
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchResults(null) }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <XCircle size={20} />
            </button>
          )}
        </div>

        {/* Dropdown de busca global */}
        {searchResults && (temResultados || query) && (
          <div className="animate-slide-up glass-panel" style={{
            position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0,
            borderRadius: 'var(--radius-xl)', overflow: 'hidden', padding: '0.5rem 0',
            zIndex: 50, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {!searchResults.clube && !searchResults.ligas?.length && (
              <div style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center' }}>
                Nenhum resultado de busca para "{query}"
              </div>
            )}
            {searchResults.clube && (
              <>
                <SectionLabel icon={<Shield size={14} />}>Clube</SectionLabel>
                <ResultItem
                  logo={searchResults.clube.logo} nome={searchResults.clube.nome}
                  sub={`Time Oficial · ${searchResults.clube.pais || ''}`}
                  tag="Perfil do Clube" tagColor="var(--green)"
                  onClick={() => irParaClube(searchResults.clube)}
                />
              </>
            )}
            {searchResults.ligas?.length > 0 && (
              <>
                <SectionLabel hasBorder={!!searchResults.clube} icon={<Trophy size={14} />}>Ligas & Copas</SectionLabel>
                {searchResults.ligas.map(liga => (
                  <ResultItem key={liga.id}
                    logo={LOGO_LIGA(liga.id)} logoSize={30}
                    nome={liga.nome}
                    sub={`${liga.tipo === 'copa' ? 'Competição' : 'Campeonato'}${liga.pais ? ` · ${liga.pais}` : ''}`}
                    tag="Acessar" tagColor="var(--blue)"
                    onClick={() => irParaLiga(liga)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── GRID DE PAÍSES (Pílulas Glassmorfismo) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: 12, marginBottom: '2.5rem',
      }}>
        {paises.map(p => {
          const ativo   = paisSel?.id === p.id
          const flagUrl = FLAG_URL(p.id)
          return (
            <button key={p.id} onClick={() => selecionarPais(p.id)} className="glass-panel" style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: '16px 10px',
              background: ativo ? 'linear-gradient(145deg, rgba(0,232,150,0.15), rgba(0,232,150,0.05))' : 'rgba(15, 20, 30, 0.4)',
              border: `1px solid ${ativo ? 'var(--border-green)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              boxShadow: ativo ? '0 8px 24px rgba(0,232,150,0.2)' : '0 4px 12px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={e => {
              if (ativo) return
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'
              e.currentTarget.style.background = 'rgba(25, 32, 45, 0.7)'
            }}
            onMouseLeave={e => {
              if (ativo) return
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
              e.currentTarget.style.background = 'rgba(15, 20, 30, 0.4)'
            }}
            >
              {flagUrl
                ? <img src={flagUrl} alt={p.nome} style={{
                    width: 44, height: 30, objectFit: 'cover', borderRadius: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)', filter: ativo ? 'brightness(1.1)' : 'brightness(0.9)'
                  }} onError={e => { e.target.style.display = 'none' }} />
                : <Globe size={28} className={ativo ? "text-green" : "text-muted"} />
              }
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.2,
                color: ativo ? 'var(--green)' : 'var(--text-secondary)',
              }}>
                {p.nome}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── SEÇÃO DE LIGAS DO PAÍS SELECIONADO ── */}
      {paisSel && (
        <div className="animate-slide-up glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>

          {/* Cabeçalho: título + campo de filtro + toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-soft)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <Activity size={16} className="text-blue" />
              </div>
              <span style={{
                fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}>
                Torneios do(a) {paisSel.nome}
              </span>
              
              {!loadingLigas && ligasFiltradas.length > 0 && (
                <span className="badge badge-muted" style={{ marginLeft: '4px' }}>
                  {ligasFiltradas.length} Competições
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              {/* Campo de filtro local */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-pill)', padding: '6px 16px',
                minWidth: 200, transition: 'all 0.3s',
              }}>
                <Search size={14} className="text-muted" />
                <input
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                  placeholder={`Filtrar ${verTodas ? 'todas' : 'principais'}...`}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '0.85rem', color: 'var(--text-primary)',
                    width: '100%', padding: 0, boxShadow: 'none'
                  }}
                  onFocus={e => {
                    e.currentTarget.parentElement.style.borderColor = 'var(--green)'
                    e.currentTarget.parentElement.style.background = 'rgba(0,232,150,0.05)'
                  }}
                  onBlur={e => {
                    e.currentTarget.parentElement.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.parentElement.style.background = 'rgba(0,0,0,0.3)'
                  }}
                />
                {filtro && (
                  <button onClick={() => setFiltro('')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Toggle: Principais / Ver todas */}
              {todasLigas.length > principaisLigas.length && (
                <button className="btn btn-ghost"
                  onClick={() => { setVerTodas(v => !v); setFiltro('') }}
                  style={{
                    background: verTodas ? 'rgba(0,232,150,0.1)' : 'rgba(255,255,255,0.05)',
                    borderColor: verTodas ? 'var(--green)' : 'rgba(255,255,255,0.1)',
                    color: verTodas ? 'var(--green)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-pill)', padding: '6px 20px',
                    fontSize: '0.8rem'
                  }}
                >
                  {verTodas ? 'Ocultar Divisões Inferiores' : `Mostrar Todas (${todasLigas.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Mensagem de carregamento */}
          {loadingLigas && (
            <div className="loading" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
              <span className="spinner" style={{ width: 32, height: 32 }} /> 
              <span style={{ fontWeight: 600 }}>Mapeando compenonatos do(a) {paisSel.nome}...</span>
            </div>
          )}

          {/* Sem resultados */}
          {!loadingLigas && ligasFiltradas.length === 0 && (
            <div className="empty-state" style={{ padding: '3rem' }}>
              {filtro
                ? <><XCircle size={48} className="empty-state-icon mx-auto" /><p>Nenhum campeonato atende ao filtro "{filtro}"</p></>
                : <><Globe size={48} className="empty-state-icon mx-auto" /><p>Nenhum campeonato mapeado ativamente para {paisSel.nome}</p></>
              }
            </div>
          )}

          {/* Grid de ligas */}
          {!loadingLigas && ligasFiltradas.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 14,
            }}>
              {ligasFiltradas.map(liga => (
                <LeagueCard key={liga.id} liga={liga} onClick={() => irParaLiga(liga)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function Shield({size}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}

function LeagueCard({ liga, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 14, padding: '24px 16px',
        background: hover ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 'var(--radius-lg)', cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.25,1,0.5,1)',
        transform: hover ? 'translateY(-6px)' : 'none',
        boxShadow: hover ? '0 16px 32px rgba(0,0,0,0.5)' : 'none',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ 
        position: 'absolute', top: -20, right: -20, width: 80, height: 80, 
        background: `radial-gradient(circle, ${hover ? 'rgba(0,232,150,0.1)' : 'transparent'} 0%, transparent 70%)` 
      }}></div>
      
      <img
        src={`https://api.sofascore.app/api/v1/unique-tournament/${liga.id}/image`}
        alt={liga.nome}
        style={{
          width: 64, height: 64, objectFit: 'contain',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
          transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: hover ? 'scale(1.15) rotate(5deg)' : 'scale(1)',
        }}
        onError={e => { e.target.style.opacity = '0.1' }}
      />
      <div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.2,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          {liga.nome}
        </div>
        <div style={{
          fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6,
          textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
        }}>
          {liga.tipo === 'copa' ? 'Competição' : 'Campeonato'}
        </div>
      </div>
    </button>
  )
}

function SectionLabel({ children, hasBorder, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '12px 24px 6px',
      fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--text-secondary)',
      borderTop: hasBorder ? '1px solid rgba(255,255,255,0.08)' : 'none',
      marginTop: hasBorder ? 4 : 0,
    }}>
      {icon} {children}
    </div>
  )
}

function ResultItem({ logo, logoSize = 40, nome, sub, tag, tagColor, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 24px', background: hover ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
        transition: 'background 0.2s', textAlign: 'left',
      }}
    >
      <div style={{ width: logoSize, height: logoSize, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', flexShrink: 0 }}>
        <img src={logo} alt=""
          style={{ width: logoSize - 8, height: logoSize - 8, objectFit: 'contain' }}
          onError={e => { e.target.style.opacity = '0.2' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
        <div style={{ fontSize: '0.75rem', color: hover ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: 2, transition: 'var(--transition)' }}>{sub}</div>
      </div>
      {tag && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem',
        color: hover ? tagColor : 'var(--text-muted)', fontWeight: 700, flexShrink: 0, transition: 'color 0.2s' }}>
          {tag} <ChevronRight size={14} />
      </span>}
    </button>
  )
}
