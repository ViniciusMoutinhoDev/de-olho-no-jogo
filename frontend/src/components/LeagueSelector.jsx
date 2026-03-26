import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const LOGO_LIGA = (id) => `https://api.sofascore.app/api/v1/unique-tournament/${id}/image`
const FLAG_URL  = (slug) => `https://flagcdn.com/w40/${{
  brazil: 'br', england: 'gb-eng', spain: 'es', france: 'fr', argentina: 'ar'
}[slug]}.png`

const BANDEIRAS = {
  brasil:    { slug: 'brazil',    nome: 'Brasil'     },
  england:   { slug: 'england',  nome: 'Inglaterra' },
  spain:     { slug: 'spain',    nome: 'Espanha'    },
  france:    { slug: 'france',   nome: 'França'     },
  argentina: { slug: 'argentina',nome: 'Argentina'  },
}

export default function LeagueSelector() {
  const navigate = useNavigate()
  const searchRef = useRef(null)

  const [paises, setPaises]           = useState([])
  const [paisSel, setPaisSel]         = useState(null)
  const [ligas, setLigas]             = useState([])
  const [loadingLigas, setLoadingLigas] = useState(false)

  const [query, setQuery]             = useState('')
  const [searching, setSearching]     = useState(false)
  const [searchResults, setSearchResults] = useState(null) // { type, data }
  const searchTimeout                 = useRef(null)

  useEffect(() => {
    api.get('/api/leagues/paises').then(r => setPaises(r.data))
  }, [])

  // Busca universal com debounce
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    if (!query.trim()) { setSearchResults(null); return }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        // Busca clube
        const { data } = await api.get(`/api/clubs/search?nome=${encodeURIComponent(query)}`)
        setSearchResults({ type: 'clube', data })
      } catch {
        // Se não achou clube, filtra países/ligas localmente
        const q = query.toLowerCase()
        const paisMatch = Object.entries(BANDEIRAS).find(([, v]) =>
          v.nome.toLowerCase().includes(q)
        )
        if (paisMatch) {
          setSearchResults({ type: 'pais', data: { id: paisMatch[0], ...paisMatch[1] } })
        } else {
          setSearchResults({ type: 'vazio', data: null })
        }
      } finally {
        setSearching(false)
      }
    }, 500)
  }, [query])

  async function selecionarPais(paisId) {
    const pais = paises.find(p => p.id === paisId) || { id: paisId }
    if (paisSel?.id === paisId) { setPaisSel(null); setLigas([]); return }
    setPaisSel(pais)
    setLoadingLigas(true)
    try {
      const { data } = await api.get(`/api/leagues/${paisId}/ligas`)
      setLigas(data)
    } finally { setLoadingLigas(false) }
  }

  function handleSearchResult(result) {
    if (result.type === 'clube') {
      navigate(`/?clube=${result.data.id}&nome=${encodeURIComponent(result.data.nome)}&logo=${encodeURIComponent(result.data.logo)}`)
    } else if (result.type === 'pais') {
      setQuery('')
      setSearchResults(null)
      selecionarPais(result.data.id)
    }
  }

  return (
    <div>

      {/* ── BARRA DE BUSCA UNIVERSAL ── */}
      <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '10px 16px',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
          onFocus={() => {}}
          ref={searchRef}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>
            {searching ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '🔍'}
          </span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar liga, país ou clube... ex: Premier League, Brasil, Flamengo"
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
                cursor: 'pointer', fontSize: '1rem', padding: 0, flexShrink: 0 }}>
              ✕
            </button>
          )}
        </div>

        {/* Resultado da busca */}
        {searchResults && (
          <div className="animate-slide-up" style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            zIndex: 50, boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }}>
            {searchResults.type === 'vazio' && (
              <div style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Nenhum resultado encontrado para "{query}"
              </div>
            )}

            {searchResults.type === 'pais' && (
              <button onClick={() => handleSearchResult(searchResults)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-primary)', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <img src={FLAG_URL(searchResults.data.slug)} alt=""
                  style={{ width: 28, height: 19, objectFit: 'cover', borderRadius: 2 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{searchResults.data.nome}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>País</div>
                </div>
              </button>
            )}

            {searchResults.type === 'clube' && (
              <button onClick={() => handleSearchResult(searchResults)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-primary)', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <img src={searchResults.data.logo} alt=""
                  style={{ width: 36, height: 36, objectFit: 'contain' }}
                  onError={e => e.target.style.display = 'none'} />
                <div>
                  <div style={{ fontWeight: 600 }}>{searchResults.data.nome}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Clube · {searchResults.data.pais}
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem',
                  color: 'var(--green)', fontWeight: 600 }}>
                  Ver jogos →
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── GRID DE PAÍSES ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10,
        marginBottom: '1.5rem',
      }}>
        {paises.map(p => {
          const info = BANDEIRAS[p.id]
          const ativo = paisSel?.id === p.id
          return (
            <button key={p.id} onClick={() => selecionarPais(p.id)}
              className={ativo ? '' : 'pais-btn'}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '16px 8px',
                background: ativo
                  ? 'linear-gradient(135deg, rgba(0,192,127,0.15), rgba(0,192,127,0.05))'
                  : 'var(--bg-card)',
                border: `1px solid ${ativo ? 'var(--border-green)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative', overflow: 'hidden',
                boxShadow: ativo ? '0 0 20px rgba(0,192,127,0.2)' : 'none',
              }}
              onMouseEnter={e => {
                if (ativo) return
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.borderColor = 'var(--border-hover)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
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
              {/* Brilho sutil no ativo */}
              {ativo && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at 50% 0%, rgba(0,192,127,0.12), transparent 70%)',
                  pointerEvents: 'none',
                }} />
              )}
              <img src={FLAG_URL(info.slug)} alt={info.nome}
                style={{
                  width: 44, height: 30, objectFit: 'cover',
                  borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s',
                }}
                onError={e => e.target.style.display = 'none'}
              />
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: '0.8rem',
                color: ativo ? 'var(--green)' : 'var(--text-secondary)',
                letterSpacing: '-0.01em',
              }}>
                {info.nome}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── GRID DE LIGAS ── */}
      {paisSel && (
        <div className="animate-slide-up">
          {loadingLigas && <div className="loading"><span className="spinner" /></div>}

          {!loadingLigas && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12,
            }}>
              {ligas.map(liga => (
                <button key={liga.id}
                  onClick={() => navigate(`/league/${liga.id}?nome=${encodeURIComponent(liga.nome)}`)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 12, padding: '24px 16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)'
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                    e.currentTarget.querySelector('.liga-glow').style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.background = 'var(--bg-card)'
                    e.currentTarget.querySelector('.liga-glow').style.opacity = '0'
                  }}
                >
                  {/* Efeito glow no hover */}
                  <div className="liga-glow" style={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: '80%', height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    opacity: 0, transition: 'opacity 0.3s',
                  }} />

                  <img src={LOGO_LIGA(liga.id)} alt={liga.nome}
                    style={{
                      width: 64, height: 64, objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                      transition: 'transform 0.25s',
                    }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
                  />
                  <div style={{ display: 'none', fontSize: '2.5rem' }}>🏆</div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.3,
                    }}>
                      {liga.nome}
                    </div>
                    <div style={{
                      fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4,
                      textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600,
                    }}>
                      {liga.tipo === 'copa' ? '🏆 Copa' : '📊 Liga'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
