import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import MatchCard from '../components/MatchCard'

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

  // Estado para time selecionado (clique na tabela)
  const [timeSel, setTimeSel] = useState(null)
  const [jogosTime, setJogosTime] = useState([])
  const [loadingTime, setLoadingTime] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { carregarTabela() }, [tournamentId])

  async function carregarTabela() {
    setLoading(true); setError(null)
    try {
      const { data } = await api.get(`/api/leagues/${tournamentId}/tabela`)
      setTabela(data)
    } catch { setError('Tabela não disponível para esta competição.') }
    finally { setLoading(false) }
  }

  async function carregarJogos() {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/leagues/${tournamentId}/jogos`)
      setJogos(data)
    } catch { setJogos([]) }
    finally { setLoading(false) }
  }

  async function verJogosTime(row) {
    setTimeSel(row)
    setJogosTime([])
    setLoadingTime(true)
    try {
      const { data } = await api.get(`/api/clubs/${row.time_id}/matches?tipo=next`)
      setJogosTime(data)
    } catch { setJogosTime([]) }
    finally { setLoadingTime(false) }
  }

  function handleTab(t) {
    setTab(t)
    if (t === 'jogos' && jogos.length === 0) carregarJogos()
    setTimeSel(null)
  }

  // ── TELA DE JOGOS DO TIME ──────────────────────────────────
  if (timeSel) {
    return (
      <div className="page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={timeSel.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }}
              onError={e => e.target.style.display = 'none'} />
            <div>
              <h2>{timeSel.time}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Próximos jogos · {nomeLiga}
              </span>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
            onClick={() => setTimeSel(null)}>
            ← Voltar à tabela
          </button>
        </div>

        {/* Aviso: não é clube do coração */}
        <div style={{
          padding: '10px 14px', marginBottom: '1rem',
          background: 'rgba(0,192,127,0.06)', border: '1px solid var(--border-green)',
          borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>ℹ️</span>
          Você está vendo jogos do <strong style={{ color: 'var(--text-primary)' }}>{timeSel.time}</strong>.
          Seu clube do coração continua sendo <strong style={{ color: 'var(--green)' }}>
            {user.clube_coracao_nome || '—'}
          </strong>.
        </div>

        {loadingTime && <div className="loading"><span className="spinner" /> Carregando jogos...</div>}

        {!loadingTime && jogosTime.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <p>Nenhum jogo próximo encontrado</p>
          </div>
        )}

        {jogosTime.map((jogo, i) => (
          <div key={jogo.id} style={{ animationDelay: `${i * 0.04}s` }}>
            <MatchCard jogo={jogo} modoViagem cidadeOrigem={user.cidade_origem} />
          </div>
        ))}
      </div>
    )
  }

  // ── TELA PRINCIPAL ─────────────────────────────────────────
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
          {error && <div className="empty-state"><span className="empty-state-icon">🏆</span><p>{error}</p></div>}

          {tabela?.grupos?.map((grupo, gi) => (
            <div key={gi} style={{ marginBottom: '2rem' }} className="animate-slide-up">
              {grupo.nome && (
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {grupo.nome}
                </div>
              )}

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ display: 'grid',
                  gridTemplateColumns: '6px 36px 1fr 40px 40px 40px 40px 40px 48px',
                  gap: 4, padding: '10px 16px', borderBottom: '1px solid var(--border)',
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  <span /><span>#</span><span>Time</span>
                  <span style={{ textAlign: 'center' }}>J</span>
                  <span style={{ textAlign: 'center' }}>V</span>
                  <span style={{ textAlign: 'center' }}>E</span>
                  <span style={{ textAlign: 'center' }}>D</span>
                  <span style={{ textAlign: 'center' }}>SG</span>
                  <span style={{ textAlign: 'center' }}>PTS</span>
                </div>

                {/* Rows — clicáveis */}
                {grupo.tabela.map((row, idx) => (
                  <div key={idx}
                    onClick={() => verJogosTime(row)}
                    style={{ display: 'grid',
                      gridTemplateColumns: '6px 36px 1fr 40px 40px 40px 40px 40px 48px',
                      gap: 4, padding: '9px 16px',
                      borderBottom: idx < grupo.tabela.length - 1 ? '1px solid var(--border)' : 'none',
                      alignItems: 'center', fontSize: '0.86rem',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg-elevated)'
                      e.currentTarget.querySelector('.time-hint').style.opacity = '1'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.querySelector('.time-hint').style.opacity = '0'
                    }}
                  >
                    <div style={{ width: 3, height: 26, borderRadius: 99,
                      background: row.promo_cor || 'transparent' }}
                      title={row.promo_texto || ''} />

                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: '0.84rem', color: row.promo_cor || 'var(--text-muted)' }}>
                      {row.posicao}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={row.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }}
                        onError={e => e.target.style.display = 'none'} />
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.time}</span>
                      <span className="time-hint" style={{ fontSize: '0.7rem', color: 'var(--green)',
                        opacity: 0, transition: 'opacity 0.15s', marginLeft: 4 }}>
                        ver jogos →
                      </span>
                    </div>

                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.jogos}</span>
                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.vitorias}</span>
                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.empates}</span>
                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.derrotas}</span>
                    <span style={{ textAlign: 'center',
                      color: row.saldo > 0 ? 'var(--green)' : row.saldo < 0 ? '#F87171' : 'var(--text-secondary)' }}>
                      {row.saldo > 0 ? `+${row.saldo}` : row.saldo}
                    </span>
                    <span style={{ textAlign: 'center', fontWeight: 700,
                      fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      {row.pontos}
                    </span>
                  </div>
                ))}
              </div>

              {/* Legenda dinâmica */}
              {tabela?.legenda?.length > 0 && gi === 0 && (
                <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                  {tabela.legenda.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2,
                        background: item.cor, display: 'inline-block' }} />
                      {item.label}
                    </div>
                  ))}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    Clique em um time para ver os jogos
                  </div>
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
            <div className="empty-state"><span className="empty-state-icon">📭</span>
              <p>Nenhum jogo encontrado</p></div>
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
