import { useState } from 'react'
import api from '../api/client'

export default function MatchCard({ jogo, modoViagem = false, cidadeOrigem = '', onDiaryChange, onCidadeAtualizada }) {
  const [saved, setSaved]             = useState(jogo._saved || false)
  const [loadingTravel, setLoadingTravel] = useState(false)
  const [travelData, setTravelData]   = useState(null)
  const [travelOpen, setTravelOpen]   = useState(false)

  async function toggleDiary() {
    try {
      if (saved) {
        await api.delete(`/api/diary/${jogo.id}`)
      } else {
        await api.post('/api/diary/', {
          id: jogo.id, data_fmt: jogo.data_fmt, home: jogo.home, away: jogo.away,
          estadio: jogo.estadio, cidade: jogo.cidade, placar: jogo.placar,
          torneio: jogo.torneio, home_logo: jogo.home_logo, away_logo: jogo.away_logo,
        })
      }
      setSaved(!saved)
      onDiaryChange?.()
    } catch (e) { console.error(e) }
  }

  async function handleViagemClick() {
    if (travelOpen) { setTravelOpen(false); return }
    if (travelData) { setTravelOpen(true);  return }

    if (!jogo.cidade || jogo.cidade === 'A definir') {
      setTravelData({ erro: 'Localização do estádio indisponível para este jogo.' })
      setTravelOpen(true); return
    }
    if (!cidadeOrigem) {
      setTravelData({ tipo: 'sem_cidade' })
      setTravelOpen(true); return
    }

    setLoadingTravel(true)
    try {
      const params = new URLSearchParams({
        origem:  cidadeOrigem,
        destino: jogo.cidade,
        ...(jogo.dt_obj ? { data_jogo: jogo.dt_obj } : {}),
      })
      const { data } = await api.get(`/api/travel/opcoes?${params}`)
      setTravelData(data)
      setTravelOpen(true)
    } catch (e) {
      setTravelData({ erro: 'Não foi possível calcular as opções de viagem.' })
      setTravelOpen(true)
    } finally {
      setLoadingTravel(false)
    }
  }

  const scoreText = modoViagem && jogo.placar === 'vs' && jogo.dt_obj
    ? new Date(jogo.dt_obj).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : jogo.placar

  return (
    <div className={`match-card ${saved ? 'is-saved' : modoViagem ? 'is-future' : ''} animate-slide-up`}>
      <div className={`match-card-header ${saved ? 'saved' : modoViagem ? 'future' : ''}`}>
        <span>{saved ? '✓ Memória salva' : `${jogo.data_fmt} · ${jogo.torneio}`}</span>
        {saved && <span>{jogo.data_fmt}</span>}
      </div>

      <div className="match-teams">
        <div className="team">
          <img src={jogo.home_logo} alt="" className="team-logo" onError={e => e.target.style.display = 'none'} />
          <span className="team-name">{jogo.home}</span>
        </div>
        <div className="match-score">{scoreText}</div>
        <div className="team away">
          <img src={jogo.away_logo} alt="" className="team-logo" onError={e => e.target.style.display = 'none'} />
          <span className="team-name">{jogo.away}</span>
        </div>
      </div>

      <div className="match-footer">
        <span className="match-venue">🏟 {jogo.estadio} · {jogo.cidade}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {modoViagem && (
            <button onClick={handleViagemClick} disabled={loadingTravel} className="btn btn-ghost"
              style={{ padding: '5px 12px', fontSize: '0.78rem',
                borderColor: travelOpen ? 'var(--green)' : undefined,
                color:       travelOpen ? 'var(--green)' : undefined }}>
              {loadingTravel
                ? <span className="spinner" style={{ width: 12, height: 12 }} />
                : travelOpen ? '✈ Fechar' : '✈ Viagem'}
            </button>
          )}
          <button onClick={toggleDiary} className={`btn ${saved ? 'btn-danger' : 'btn-primary'}`}
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
            {saved ? '× Remover' : '+ Eu Fui!'}
          </button>
        </div>
      </div>

      {/* ── Painel de Viagem ──────────────────────────────────────────────── */}
      {travelOpen && travelData && (
        travelData.tipo === 'sem_cidade'
          ? <CidadeForm
              jogoCidade={jogo.cidade}
              onConfirm={async (cidade) => {
                // Informa o pai para persistir no auth
                await onCidadeAtualizada?.(cidade)
                // Calcula imediatamente com a cidade inserida
                setTravelData(null)
                setTravelOpen(false)
                setLoadingTravel(true)
                try {
                  const params = new URLSearchParams({ origem: cidade, destino: jogo.cidade,
                    ...(jogo.dt_obj ? { data_jogo: jogo.dt_obj } : {}) })
                  const { data } = await api.get(`/api/travel/opcoes?${params}`)
                  setTravelData(data)
                  setTravelOpen(true)
                } catch {
                  setTravelData({ erro: 'Não foi possível calcular as opções.' })
                  setTravelOpen(true)
                } finally { setLoadingTravel(false) }
              }} />
          : <TravelPanel data={travelData} />
      )}
    </div>
  )
}

// ─── Form inline para configurar cidade ──────────────────────────────────────

function CidadeForm({ jogoCidade, onConfirm }) {
  const [cidade, setCidade] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!cidade.trim()) return
    setLoading(true)
    try { await onConfirm(cidade.trim()) }
    finally { setLoading(false) }
  }

  return (
    <div className="animate-slide-up" style={{
      marginTop: 10, padding: '14px 16px',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
        📍 De onde você vai viajar para {jogoCidade}?
      </div>
      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 10 }}>
        Informe sua cidade e calcularemos as melhores rotas.
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={cidade}
          onChange={e => setCidade(e.target.value)}
          placeholder="Ex: São Paulo, Campinas, Curitiba..."
          autoFocus
          style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '7px 12px',
            color: 'var(--text-primary)', fontSize: '0.85rem',
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e  => e.target.style.borderColor = 'var(--green)'}
          onBlur={e   => e.target.style.borderColor = 'var(--border)'}
        />
        <button type="submit" disabled={loading || !cidade.trim()} className="btn btn-primary"
          style={{ padding: '7px 16px', fontSize: '0.82rem', flexShrink: 0 }}>
          {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Calcular ✈'}
        </button>
      </form>
      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 6 }}>
        Sua cidade será salva no perfil para os próximos acessos.
      </div>
    </div>
  )
}

// ─── Painel comparativo de viagem ────────────────────────────────────────────

function TravelPanel({ data }) {
  const [modalAberto, setModalAberto] = useState(null)

  if (data.erro) {
    return (
      <div style={{
        margin: '10px 0 0', padding: '10px 14px',
        background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)',
        borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)',
      }}>
        ⚠️ {data.erro}
      </div>
    )
  }

  return (
    <div className="animate-slide-up" style={{
      marginTop: 10, background: 'var(--bg-elevated)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      {/* Cabeçalho */}
      <div style={{
        padding: '9px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          📍 {data.origem} → {data.destino}
        </span>
        <span style={{
          fontSize: '0.7rem', color: 'var(--text-muted)',
          background: 'var(--bg-card)', borderRadius: 999, padding: '1px 8px',
          border: '1px solid var(--border)',
        }}>
          ~{data.distancia_km} km
        </span>
      </div>

      {/* Aviso de estimativa */}
      <div style={{
        padding: '4px 14px', fontSize: '0.63rem', fontStyle: 'italic',
        color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        ℹ️ Valores estimados. Consute as plataformas para preços exatos.
      </div>

      {/* Linhas de cada modal */}
      {data.opcoes?.map(op => (
        <ModalRow key={op.modal} op={op}
          aberto={modalAberto === op.modal}
          onToggle={() => setModalAberto(v => v === op.modal ? null : op.modal)} />
      ))}
    </div>
  )
}

// ─── Linha de modal ──────────────────────────────────────────────────────────

const MODAL_COLOR = { carro: '#60A5FA', onibus: '#34D399', aviao: '#A78BFA' }

function ModalRow({ op, aberto, onToggle }) {
  const cor = MODAL_COLOR[op.modal] || 'var(--text-muted)'
  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      background: op.recomendado ? 'rgba(0,199,133,0.04)' : 'transparent',
    }}>
      <button onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <span style={{ fontSize: '1rem', width: 22, flexShrink: 0 }}>{op.emoji}</span>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: cor, minWidth: 55 }}>{op.label}</span>
        {op.recomendado && (
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
            background: 'rgba(0,199,133,0.12)', color: 'var(--green)',
            border: '1px solid rgba(0,199,133,0.3)', borderRadius: 999, padding: '1px 7px',
          }}>★ Melhor custo</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            ⏱ {formatarDuracao(op.duracao_h)}
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            R${op.custo.min}–{op.custo.max}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem',
            transform: aberto ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
        </div>
      </button>

      {aberto && (
        <div className="animate-slide-up" style={{
          padding: '6px 14px 10px 46px', display: 'flex', flexWrap: 'wrap', gap: 8,
        }}>
          {Object.entries(op.links || {}).map(([nome, url]) => (
            <a key={nome} href={url} target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 11px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: cor, fontSize: '0.74rem', fontWeight: 600, textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = cor; e.currentTarget.style.background = `${cor}18` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
            >
              {LINK_LABELS[nome] ?? nome} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

const LINK_LABELS = {
  google_maps:    '🗺 Google Maps',
  waze:           '🧭 Waze',
  buser:          '🚌 Buser',
  clickbus:       '🎟 ClickBus',
  google_flights: '✈ Google Flights',
  skyscanner:     '🛫 Skyscanner',
}

function formatarDuracao(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}min`
}
