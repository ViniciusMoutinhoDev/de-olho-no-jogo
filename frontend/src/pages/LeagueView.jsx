import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function LeagueView() {
  const { tournamentId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const nomeLiga = params.get('nome') || 'Liga'

  const [tab, setTab] = useState('tabela')
  const [tabela, setTabela] = useState(null)
  const [jogos, setJogos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { carregarTabela() }, [tournamentId])

  async function carregarTabela() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/api/leagues/${tournamentId}/tabela`)
      setTabela(data)
    } catch {
      setError('Tabela não disponível para esta competição.')
    } finally {
      setLoading(false)
    }
  }

  async function carregarJogos() {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/leagues/${tournamentId}/jogos`)
      setJogos(data)
    } catch { setJogos([]) }
    finally { setLoading(false) }
  }

  function handleTab(t) {
    setTab(t)
    if (t === 'jogos' && jogos.length === 0) carregarJogos()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{nomeLiga}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Temporada atual</span>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => navigate(-1)}>
          ← Voltar
        </button>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'tabela' ? 'active' : ''}`} onClick={() => handleTab('tabela')}>
          📊 Tabela
        </button>
        <button className={`tab-btn ${tab === 'jogos' ? 'active' : ''}`} onClick={() => handleTab('jogos')}>
          ⚽ Jogos
        </button>
      </div>

      {loading && <div className="loading"><span className="spinner" /> Carregando...</div>}

      {/* ── TABELA ── */}
      {!loading && tab === 'tabela' && (
        <>
          {error && (
            <div className="empty-state">
              <span className="empty-state-icon">🏆</span>
              <p>{error}</p>
            </div>
          )}

          {tabela?.grupos?.map((grupo, gi) => (
            <div key={gi} style={{ marginBottom: '2rem' }} className="animate-slide-up">
              {grupo.nome && (
                <div style={{
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem',
                }}>
                  {grupo.nome}
                </div>
              )}

              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '6px 36px 1fr 40px 40px 40px 40px 40px 48px',
                  gap: 4, padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.68rem', fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  <span />
                  <span>#</span>
                  <span>Time</span>
                  <span style={{ textAlign: 'center' }}>J</span>
                  <span style={{ textAlign: 'center' }}>V</span>
                  <span style={{ textAlign: 'center' }}>E</span>
                  <span style={{ textAlign: 'center' }}>D</span>
                  <span style={{ textAlign: 'center' }}>SG</span>
                  <span style={{ textAlign: 'center' }}>PTS</span>
                </div>

                {/* Rows — cores 100% dinâmicas via row.promo_cor do backend */}
                {grupo.tabela.map((row, idx) => (
                  <div key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '6px 36px 1fr 40px 40px 40px 40px 40px 48px',
                      gap: 4, padding: '9px 16px',
                      borderBottom: idx < grupo.tabela.length - 1 ? '1px solid var(--border)' : 'none',
                      alignItems: 'center', fontSize: '0.86rem',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Faixa colorida lateral — vem direto do SofaScore via backend */}
                    <div style={{
                      width: 3, height: 26, borderRadius: 99,
                      background: row.promo_cor || 'transparent',
                      flexShrink: 0,
                    }} title={row.promo_texto || ''} />

                    {/* Número da posição com cor da promoção */}
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: '0.84rem',
                      color: row.promo_cor || 'var(--text-muted)',
                    }}>
                      {row.posicao}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={row.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }}
                        onError={e => e.target.style.display = 'none'} />
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.time}</span>
                    </div>

                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.jogos}</span>
                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.vitorias}</span>
                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.empates}</span>
                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.derrotas}</span>
                    <span style={{
                      textAlign: 'center',
                      color: row.saldo > 0 ? 'var(--green)' : row.saldo < 0 ? '#F87171' : 'var(--text-secondary)',
                    }}>
                      {row.saldo > 0 ? `+${row.saldo}` : row.saldo}
                    </span>
                    <span style={{
                      textAlign: 'center', fontWeight: 700,
                      fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
                    }}>
                      {row.pontos}
                    </span>
                  </div>
                ))}
              </div>

              {/* Legenda dinâmica — gerada pelo backend com os labels corretos de cada liga */}
              {tabela?.legenda?.length > 0 && gi === 0 && (
                <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                  {tabela.legenda.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: '0.72rem', color: 'var(--text-muted)',
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: 2,
                        background: item.cor, display: 'inline-block', flexShrink: 0,
                      }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── JOGOS ── */}
      {!loading && tab === 'jogos' && (
        <>
          {jogos.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">📭</span>
              <p>Nenhum jogo encontrado</p>
            </div>
          )}
          {jogos.map((jogo, i) => (
            <div key={jogo.id} className="match-card animate-slide-up"
              style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="match-card-header">
                <span>Rodada {jogo.rodada} · {jogo.data_fmt}</span>
                <span className={`badge ${jogo.status === 'finished' ? 'badge-green' : 'badge-blue'}`}>
                  {jogo.status === 'finished' ? 'Encerrado' : 'Agendado'}
                </span>
              </div>
              <div className="match-teams">
                <div className="team">
                  <img src={jogo.home_logo} alt="" className="team-logo"
                    onError={e => e.target.style.display = 'none'} />
                  <span className="team-name">{jogo.home}</span>
                </div>
                <div className="match-score">{jogo.placar}</div>
                <div className="team away">
                  <img src={jogo.away_logo} alt="" className="team-logo"
                    onError={e => e.target.style.display = 'none'} />
                  <span className="team-name">{jogo.away}</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
