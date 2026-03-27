import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/client'
import MatchCard from './MatchCard'

const ANO_ATUAL = new Date().getFullYear()

const ANOS_AUTO = Array.from({ length: ANO_ATUAL - 2019 }, (_, i) => ANO_ATUAL - i)

const GRUPOS_HISTORICOS = [
  { label: '2015 – 2019', anos: [2019, 2018, 2017, 2016, 2015] },
  { label: '2010 – 2014', anos: [2014, 2013, 2012, 2011, 2010] },
  { label: 'Antes de 2010', anos: [2009, 2008, 2007, 2006, 2005] },
]

function BlocoAno({ clubId, ano, cidadeOrigem, autoLoad = false }) {
  const [jogos, setJogos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aberto, setAberto] = useState(autoLoad)
  const ref = useRef(null)
  const carregado = useRef(false)

  // ✅ Reset completo quando clube ou ano mudam
  useEffect(() => {
    setJogos(null)
    setLoading(false)
    setAberto(autoLoad)
    carregado.current = false
  }, [clubId, ano])

  const carregar = useCallback(async () => {
    if (carregado.current) return
    carregado.current = true
    setLoading(true)
    try {
      const { data } = await api.get(`/api/clubs/${clubId}/historico/${ano}`)
      setJogos(data.jogos)
    } catch {
      setJogos([])
    } finally {
      setLoading(false)
    }
  }, [clubId, ano])

  // ✅ Observer reinicia quando clubId ou ano mudam
  useEffect(() => {
    if (!autoLoad) return
    carregado.current = false
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { carregar(); observer.disconnect() } },
      { rootMargin: '300px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [autoLoad, carregar, clubId, ano])

  function toggle() {
    setAberto(v => !v)
    if (!carregado.current) carregar()
  }

  const total = jogos?.length ?? null

  return (
    <div ref={ref} style={{ marginBottom: '1rem' }}>
      <button
        onClick={toggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '10px 16px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: aberto ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
          cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '0.95rem', color: 'var(--text-primary)',
          }}>
            Temporada {ano}
          </span>
          {total !== null && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px',
              borderRadius: 999, background: 'var(--bg-elevated)',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
            }}>
              {total} jogos
            </span>
          )}
          {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
        </div>
        <span style={{
          color: 'var(--text-muted)', fontSize: '0.9rem',
          transform: aberto ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s',
        }}>›</span>
      </button>

      {aberto && (
        <div style={{
          border: '1px solid var(--border)', borderTop: 'none',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          background: 'var(--bg-elevated)',
          padding: jogos?.length ? '8px' : '1.5rem',
        }}>
          {loading && !jogos && (
            <div className="loading" style={{ padding: '2rem' }}>
              <span className="spinner" /> Carregando {ano}...
            </div>
          )}

          {jogos?.length === 0 && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>Nenhum jogo encontrado em {ano}</p>
            </div>
          )}

          {jogos?.map((jogo, i) => (
            <div key={jogo.id} style={{ animationDelay: `${Math.min(i, 20) * 0.02}s` }}>
              <MatchCard
                jogo={jogo}
                modoViagem={false}
                cidadeOrigem={cidadeOrigem}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GrupoHistorico({ grupo, clubId, cidadeOrigem }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        onClick={() => setAberto(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '10px 16px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: aberto ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
          cursor: 'pointer', color: 'var(--text-secondary)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
          📁 {grupo.label}
        </span>
        <span style={{
          color: 'var(--text-muted)',
          transform: aberto ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s',
        }}>›</span>
      </button>

      {aberto && (
        <div style={{
          border: '1px solid var(--border)', borderTop: 'none',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          background: 'var(--bg-elevated)', padding: '8px',
        }}>
          {grupo.anos.map(ano => (
            <BlocoAno
              key={ano}
              clubId={clubId}
              ano={ano}
              cidadeOrigem={cidadeOrigem}
              autoLoad={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HistoricoJogos({ clubId, cidadeOrigem }) {
  return (
    <div>
      {ANOS_AUTO.map(ano => (
        <BlocoAno
          key={ano}
          clubId={clubId}
          ano={ano}
          cidadeOrigem={cidadeOrigem}
          autoLoad={true}
        />
      ))}

      <div style={{
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        margin: '1.5rem 0 0.75rem',
      }}>
        Arquivo histórico
      </div>

      {GRUPOS_HISTORICOS.map(grupo => (
        <GrupoHistorico
          key={grupo.label}
          grupo={grupo}
          clubId={clubId}
          cidadeOrigem={cidadeOrigem}
        />
      ))}
    </div>
  )
}