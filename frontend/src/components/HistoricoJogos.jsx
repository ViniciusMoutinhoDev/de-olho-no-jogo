import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/client'
import MatchCard from './MatchCard'
import { Calendar, ChevronDown, FolderArchive, Loader2, ListOrdered, Inbox } from 'lucide-react'

const ANO_ATUAL = new Date().getFullYear()

// O Arquivo começa do ano anterior (ex: 2025 para baixo)
const ANOS_AUTO = Array.from({ length: (ANO_ATUAL - 1) - 2019 }, (_, i) => (ANO_ATUAL - 1) - i)

const GRUPOS_HISTORICOS = [
  { label: 'De 2015 a 2019', anos: [2019, 2018, 2017, 2016, 2015] },
  { label: 'De 2010 a 2014', anos: [2014, 2013, 2012, 2011, 2010] },
  { label: 'Antes de 2010', anos: [2009, 2008, 2007, 2006, 2005] },
]

function BlocoAno({ clubId, ano, cidadeOrigem, autoLoad = false, subBloco = false }) {
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
    <div ref={ref} style={{ marginBottom: subBloco ? '0.5rem' : '1rem' }}>
      <button
        onClick={toggle}
        className={subBloco ? '' : 'glass-panel'}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 18px',
          background: subBloco ? 'rgba(255,255,255,0.03)' : (aberto ? 'var(--bg-elevated)' : 'var(--bg-card)'), 
          border: subBloco ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${aberto ? 'var(--border-strong)' : 'var(--border)'}`,
          borderRadius: aberto ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
          cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', color: 'var(--text-primary)',
        }}
        onMouseEnter={e => {
          if(!subBloco) e.currentTarget.style.borderColor = 'var(--blue)'
        }}
        onMouseLeave={e => {
          if(!subBloco) e.currentTarget.style.borderColor = aberto ? 'var(--border-strong)' : 'var(--border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {subBloco ? <ListOrdered size={16} className="text-muted" /> : <Calendar size={18} className="text-blue" />}
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em',
            fontSize: '1rem', color: 'var(--text-primary)',
          }}>
            Temporada {ano}
          </span>
          {total !== null && (
            <span className="badge badge-muted">
              {total} jogos
            </span>
          )}
          {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
        </div>
        <ChevronDown size={18} style={{
          color: 'var(--text-muted)',
          transform: aberto ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }} />
      </button>

      {aberto && (
        <div className="animate-fade-in" style={{
          border: subBloco ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--border-strong)', 
          borderTop: 'none',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          background: subBloco ? 'rgba(0,0,0,0.2)' : 'rgba(10, 15, 25, 0.6)',
          padding: jogos?.length ? '12px' : '1.5rem',
        }}>
          {loading && !jogos && (
            <div className="loading" style={{ padding: '2rem' }}>
              <Loader2 size={24} className="spinner" /> Carregando estatísticas de {ano}...
            </div>
          )}

          {jogos?.length === 0 && (
            <div className="empty-state card glass-panel" style={{ padding: '2rem', boxShadow: 'none', background: 'transparent', border: 'none' }}>
              <Inbox size={42} className="empty-state-icon mx-auto" style={{ color: 'var(--text-muted)' }} />
              <p>Nenhuma partida encontrada nos registros de {ano}</p>
            </div>
          )}

          {jogos && jogos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jogos.map((jogo, i) => (
                <div key={jogo.id} style={{ animationDelay: `${Math.min(i, 20) * 0.03}s` }}>
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
      )}
    </div>
  )
}

function GrupoHistorico({ grupo, clubId, cidadeOrigem }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button
        className="glass-panel"
        onClick={() => setAberto(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 18px',
          background: aberto ? 'var(--bg-elevated)' : 'var(--bg-card)', 
          border: `1px solid ${aberto ? 'var(--border-strong)' : 'var(--border)'}`,
          borderRadius: aberto ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
          cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.3s'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = aberto ? 'var(--border-strong)' : 'var(--border)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FolderArchive size={18} className="text-secondary" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem' }}>
            {grupo.label}
          </span>
        </div>
        <ChevronDown size={18} style={{
          color: 'var(--text-secondary)',
          transform: aberto ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }} />
      </button>

      {aberto && (
        <div className="animate-fade-in glass-panel" style={{
          border: '1px solid var(--border-strong)', borderTop: 'none',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          background: 'rgba(0,0,0,0.5)', padding: '12px',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)'
        }}>
          {grupo.anos.map(ano => (
            <BlocoAno
              key={ano}
              clubId={clubId}
              ano={ano}
              cidadeOrigem={cidadeOrigem}
              autoLoad={false}
              subBloco={true}
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
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--text-secondary)',
        margin: '2rem 0 1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <FolderArchive size={14} /> Ficheiro Histórico
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