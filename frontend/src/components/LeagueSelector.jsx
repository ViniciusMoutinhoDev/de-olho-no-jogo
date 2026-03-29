import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

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

  // ── Estado de países ───────────────────────────────────────────────────────
  const [paises, setPaises]     = useState([])
  const [paisSel, setPaisSel]   = useState(null)

  // ── Estado de ligas (retorno do backend: {principais, todas}) ──────────────
  const [todasLigas, setTodasLigas]   = useState([])
  const [principaisLigas, setPrincipaisLigas] = useState([])
  const [loadingLigas, setLoadingLigas] = useState(false)

  // ── Filtro local dentro da grid ────────────────────────────────────────────
  const [filtro, setFiltro]       = useState('')
  const [verTodas, setVerTodas]   = useState(false)

  // ── Busca global (clube ou liga por nome) ──────────────────────────────────
  const [query, setQuery]               = useState('')
  const [searching, setSearching]       = useState(false)
  const [searchResults, setSearchResults] = useState(null)

  useEffect(() => {
    api.get('/api/leagues/paises').then(r => setPaises(r.data)).catch(() => {})
  }, [])

  // Debounce de busca global
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
      // Backend retorna { principais: [...], todas: [...] }
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

  // Ligas exibidas: filtradas pelo campo de texto e pelo toggle Ver todas
  const listaBase  = verTodas ? todasLigas : principaisLigas
  const ligasFiltradas = filtro.trim()
    ? listaBase.filter(l => l.nome.toLowerCase().includes(filtro.toLowerCase()))
    : listaBase

  const temResultados = searchResults &&
    (searchResults.clube || searchResults.ligas?.length > 0)

  return (
    <div>

      {/* ── BARRA DE BUSCA GLOBAL ── */}
      <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '10px 16px',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0, color: 'var(--text-muted)' }}>
            {searching ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '🔍'}
          </span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar liga ou clube... ex: Premier League, Flamengo"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '0.92rem', color: 'var(--text-primary)',
              width: '100%', padding: 0,
            }}
            onFocus={e => {
              e.currentTarget.parentElement.style.borderColor = 'var(--green)'
              e.currentTarget.parentElement.style.boxShadow = '0 0 0 3px var(--green-glow)'
            }}
            onBlur={e => {
              e.currentTarget.parentElement.style.borderColor = 'var(--border)'
              e.currentTarget.parentElement.style.boxShadow = 'none'
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchResults(null) }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '1.1rem', padding: 0, flexShrink: 0 }}>
              ✕
            </button>
          )}
        </div>

        {/* Dropdown de busca global */}
        {searchResults && (temResultados || query) && (
          <div className="animate-slide-up" style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            zIndex: 50, boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
          }}>
            {!searchResults.clube && !searchResults.ligas?.length && (
              <div style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Nenhum resultado para "{query}"
              </div>
            )}
            {searchResults.clube && (
              <>
                <SectionLabel>Clube</SectionLabel>
                <ResultItem
                  logo={searchResults.clube.logo} nome={searchResults.clube.nome}
                  sub={`Clube · ${searchResults.clube.pais || ''}`}
                  tag="Ver jogos →" tagColor="var(--green)"
                  onClick={() => irParaClube(searchResults.clube)}
                />
              </>
            )}
            {searchResults.ligas?.length > 0 && (
              <>
                <SectionLabel hasBorder={!!searchResults.clube}>Ligas</SectionLabel>
                {searchResults.ligas.map(liga => (
                  <ResultItem key={liga.id}
                    logo={LOGO_LIGA(liga.id)} logoSize={30}
                    nome={liga.nome}
                    sub={`${liga.tipo === 'copa' ? '🏆 Copa' : '📊 Liga'}${liga.pais ? ` · ${liga.pais}` : ''}`}
                    tag="Ver tabela →" tagColor="var(--blue)"
                    onClick={() => irParaLiga(liga)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── GRID DE PAÍSES ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: 10, marginBottom: '1.5rem',
      }}>
        {paises.map(p => {
          const ativo   = paisSel?.id === p.id
          const flagUrl = FLAG_URL(p.id)
          return (
            <button key={p.id} onClick={() => selecionarPais(p.id)} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '14px 8px',
              background: ativo
                ? 'linear-gradient(135deg, rgba(0,199,133,0.15), rgba(0,199,133,0.05))'
                : 'var(--bg-card)',
              border: `1px solid ${ativo ? 'var(--border-green)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: ativo ? '0 0 20px rgba(0,199,133,0.18)' : 'none',
            }}
            onMouseEnter={e => {
              if (ativo) return
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.borderColor = 'var(--border-hover)'
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)'
              e.currentTarget.style.background = 'var(--bg-elevated)'
            }}
            onMouseLeave={e => {
              if (ativo) return
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.background = 'var(--bg-card)'
            }}
            >
              {flagUrl
                ? <img src={flagUrl} alt={p.nome} style={{
                    width: 40, height: 27, objectFit: 'cover', borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }} onError={e => { e.target.style.display = 'none' }} />
                : <span style={{ fontSize: '1.6rem' }}>{p.bandeira}</span>
              }
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.3,
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
        <div className="animate-slide-up">

          {/* Cabeçalho: título + campo de filtro + toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: '0.85rem', flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
            }}>
              Ligas · {paisSel.nome}
            </span>
            {loadingLigas && <span className="spinner" style={{ width: 12, height: 12 }} />}
            {!loadingLigas && ligasFiltradas.length > 0 && (
              <span style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 999, padding: '1px 8px',
                fontSize: '0.65rem', color: 'var(--text-muted)',
              }}>
                {ligasFiltradas.length}
              </span>
            )}

            {/* Campo de filtro local */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '5px 10px',
              marginLeft: 'auto', minWidth: 180,
              transition: 'border-color 0.2s',
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔍</span>
              <input
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                placeholder={`Filtrar ${verTodas ? 'ligas' : 'principais'}...`}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '0.82rem', color: 'var(--text-primary)',
                  width: '100%', padding: 0,
                }}
                onFocus={e => e.currentTarget.parentElement.style.borderColor = 'var(--green)'}
                onBlur={e => e.currentTarget.parentElement.style.borderColor = 'var(--border)'}
              />
              {filtro && (
                <button onClick={() => setFiltro('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.9rem', padding: 0, flexShrink: 0 }}>
                  ✕
                </button>
              )}
            </div>

            {/* Toggle: Principais / Ver todas */}
            {todasLigas.length > principaisLigas.length && (
              <button
                onClick={() => { setVerTodas(v => !v); setFiltro('') }}
                style={{
                  background: verTodas ? 'rgba(0,199,133,0.12)' : 'var(--bg-elevated)',
                  border: `1px solid ${verTodas ? 'var(--border-green)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', padding: '5px 12px',
                  color: verTodas ? 'var(--green)' : 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {verTodas ? '✓ Todas' : `Ver todas (${todasLigas.length})`}
              </button>
            )}
          </div>

          {/* Mensagem de carregamento */}
          {loadingLigas && (
            <div className="loading" style={{ padding: '2rem' }}>
              <span className="spinner" /> Carregando ligas de {paisSel.nome}...
            </div>
          )}

          {/* Sem resultados */}
          {!loadingLigas && ligasFiltradas.length === 0 && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              {filtro
                ? <p>Nenhuma liga encontrada para "{filtro}"</p>
                : <p>Nenhuma liga encontrada para {paisSel.nome}</p>
              }
            </div>
          )}

          {/* Grid de ligas */}
          {!loadingLigas && ligasFiltradas.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
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
        gap: 10, padding: '20px 12px',
        background: hover ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.18)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)', cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        transform: hover ? 'translateY(-4px) scale(1.02)' : 'none',
        boxShadow: hover ? '0 14px 36px rgba(0,0,0,0.48)' : 'none',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}
    >
      <img
        src={`https://api.sofascore.app/api/v1/unique-tournament/${liga.id}/image`}
        alt={liga.nome}
        style={{
          width: 54, height: 54, objectFit: 'contain',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
          transition: 'transform 0.2s',
          transform: hover ? 'scale(1.08)' : 'scale(1)',
        }}
        onError={e => { e.target.style.opacity = '0.15' }}
      />
      <div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.3,
        }}>
          {liga.nome}
        </div>
        <div style={{
          fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: 4,
          textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600,
        }}>
          {liga.tipo === 'copa' ? '🏆 Copa' : '📊 Liga'}
        </div>
      </div>
    </button>
  )
}

function SectionLabel({ children, hasBorder }) {
  return (
    <div style={{
      padding: '6px 16px 4px',
      fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.07em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      borderBottom: '1px solid var(--border)',
      borderTop: hasBorder ? '1px solid var(--border)' : 'none',
      marginTop: hasBorder ? 4 : 0,
    }}>
      {children}
    </div>
  )
}

function ResultItem({ logo, logoSize = 36, nome, sub, tag, tagColor, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', background: hover ? 'rgba(255,255,255,0.04)' : 'none',
        border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
        transition: 'background 0.15s', textAlign: 'left',
      }}
    >
      <img src={logo} alt=""
        style={{ width: logoSize, height: logoSize, objectFit: 'contain', flexShrink: 0 }}
        onError={e => { e.target.style.opacity = '0.2' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
      </div>
      {tag && <span style={{ marginLeft: 'auto', fontSize: '0.73rem',
        color: tagColor, fontWeight: 700, flexShrink: 0 }}>{tag}</span>}
    </button>
  )
}
