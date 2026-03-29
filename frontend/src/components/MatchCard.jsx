import { useState } from 'react'
import api from '../api/client'
import { Calendar, MapPin, Plane, Car, Bus, Plus, Check, Loader2, Navigation, Compass, ExternalLink, ChevronDown, ChevronRight, X } from 'lucide-react'
import FinancePanel from './FinancePanel'

export default function MatchCard({ jogo, modoViagem = false, user = null, cidadeOrigem = '', onDiaryChange, onCidadeAtualizada }) {
  const origemBase = user?.cidade_origem || cidadeOrigem
  const [saved, setSaved]             = useState(jogo._saved || false)
  const [loadingTravel, setLoadingTravel] = useState(false)
  const [travelData, setTravelData]   = useState(null)
  const [travelOpen, setTravelOpen]   = useState(false)
  const [financeOpen, setFinanceOpen] = useState(false)

  async function toggleDiary() {
    try {
      if (saved) {
        await api.delete(`/api/diary/${jogo.id}`)
      } else {
        await api.post('/api/diary/', {
          id: jogo.id, data_fmt: jogo.data_fmt, home: jogo.home, away: jogo.away,
          estadio: jogo.estadio, cidade: jogo.cidade, placar: jogo.placar,
          torneio: jogo.torneio, home_logo: jogo.home_logo, away_logo: jogo.away_logo,
          status: modoViagem ? 'vou' : 'fui'
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

    // Sem cidade de origem configurada: pedem pra configurar
    if (!origemBase) {
      setTravelData({ tipo: 'sem_cidade' })
      setTravelOpen(true); return
    }

    // Sempre mostra o seletor de origem (Casa / Trabalho / Cidade)
    // para o usuário escolher de onde vai partir
    setTravelData({ tipo: 'origin_selector' })
    setTravelOpen(true)
  }

  async function calcularComOrigem(origem) {
    setTravelData(null)
    setTravelOpen(false)
    setLoadingTravel(true)
    // Destino é sempre o estádio (com cidade para geolocalização)
    const destino = jogo.estadio && jogo.estadio !== 'A definir'
      ? `${jogo.estadio}, ${jogo.cidade}`
      : jogo.cidade
    try {
      const params = new URLSearchParams({
        origem,
        destino,
        ...(jogo.dt_obj ? { data_jogo: jogo.dt_obj } : {}),
      })
      const { data: tData } = await api.get(`/api/travel/opcoes?${params}`)
      // Sobrescreve o destino na resposta para exibir o nome do estádio
      tData.destino = jogo.estadio && jogo.estadio !== 'A definir' ? jogo.estadio : jogo.cidade
      setTravelData(tData)
      setTravelOpen(true)
    } catch {
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
    <div className={`match-card ${saved ? 'is-saved' : modoViagem ? 'is-future' : ''} glass-panel`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: saved ? 'var(--gold)' : modoViagem ? 'var(--blue-bright)' : 'var(--text-muted)' }}>
          <Calendar size={14} />
          {jogo.data_fmt.toUpperCase()}
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {jogo.torneio}
        </div>
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

      <div className="match-footer" style={{ borderTopColor: 'rgba(255,255,255,0.08)' }}>
        <span className="match-venue">
          <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{jogo.estadio}</strong> · {jogo.cidade}
          </span>
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          {saved && (
            <button onClick={() => setFinanceOpen(!financeOpen)} className="btn btn-ghost"
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)',
                borderColor: financeOpen ? 'var(--gold)' : 'var(--border)',
                background: financeOpen ? 'var(--gold-soft)' : 'transparent',
                color: financeOpen ? 'var(--gold)' : 'var(--text-primary)' }}>
              Planejar Finanças
            </button>
          )}
          {modoViagem && (
            <button onClick={handleViagemClick} disabled={loadingTravel} className="btn btn-ghost"
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)',
                borderColor: travelOpen ? 'var(--green)' : 'var(--border)',
                background: travelOpen ? 'var(--green-soft)' : 'transparent',
                color: travelOpen ? 'var(--green)' : 'var(--text-primary)' }}>
              {loadingTravel
                ? <Loader2 size={16} className="spinner" />
                : travelOpen ? <><X size={16} /> Fechar</> : <><Plane size={16} fill={travelOpen ? "currentColor" : "none"} /> Viagem</>}
            </button>
          )}
          <button onClick={toggleDiary} className={`btn ${saved ? 'btn-ghost' : 'btn-primary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)', color: saved ? '#EF4444' : 'inherit', borderColor: saved ? 'rgba(239, 68, 68, 0.3)' : 'transparent' }}>
            {saved ? <><X size={16} /> Remover</> : <><Plus size={16} /> {modoViagem ? 'Salvar p/ Viagem' : 'Eu Fui!'}</>}
          </button>
        </div>
      </div>

      {/* ── Painel de Finanças ────────────────────────────────────────────── */}
      {financeOpen && saved && (
        <FinancePanel jogo={jogo} modo={modoViagem ? 'viagem' : 'historico'} />
      )}

      {/* ── Painel de Viagem ──────────────────────────────────────────────── */}
      {travelOpen && travelData && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) both' }}>
          {travelData.tipo === 'sem_cidade'
            ? <CidadeForm
                jogoCidade={jogo.estadio || jogo.cidade}
                onConfirm={async (cidade) => {
                  await onCidadeAtualizada?.(cidade)
                  calcularComOrigem(cidade)
                }} />
            : travelData.tipo === 'origin_selector' || travelData.tipo === 'local_transit'
              ? <OriginSelector user={user} jogo={jogo} onConfirm={calcularComOrigem} />
              : <TravelPanel data={travelData} />
          }
        </div>
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
    <div className="glass-panel" style={{
      padding: '20px', background: 'rgba(59, 130, 246, 0.05)', 
      border: '1px solid var(--border-blue)', borderRadius: 'var(--radius-lg)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Compass size={18} className="text-blue" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            De onde você vai viajar para {jogoCidade}?
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Informe sua cidade atual para calcularmos as rotas (Salvaremos no seu perfil).
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin size={16} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Sua cidade... (Ex: São Paulo)"
                autoFocus
                style={{ paddingLeft: '36px', height: '44px', background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <button type="submit" disabled={loading || !cidade.trim()} className="btn btn-primary"
              style={{ height: '44px', padding: '0 20px', borderRadius: 'var(--radius-md)' }}>
              {loading ? <Loader2 size={18} className="spinner" /> : <><Navigation size={16} /> Rota</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Seletor de Origem Premium (Apple-style) ─────────────────────────────────

function OriginSelector({ user, jogo, onConfirm }) {
  const [loading, setLoading] = useState(null) // key do botão em loading

  const estadio = jogo.estadio && jogo.estadio !== 'A definir' ? jogo.estadio : jogo.cidade

  async function handleSelect(key, origem) {
    setLoading(key)
    try { await onConfirm(origem) }
    finally { setLoading(null) }
  }

  const opcoes = [
    { key: 'casa',      label: 'De Casa',      emoji: '🏠', valor: user?.endereco_casa,      show: !!user?.endereco_casa },
    { key: 'trabalho',  label: 'Do Trabalho',  emoji: '🏢', valor: user?.endereco_trabalho,  show: !!user?.endereco_trabalho },
    { key: 'cidade',    label: `Centro de ${user?.cidade_origem || 'sua cidade'}`, emoji: '📍', valor: user?.cidade_origem, show: true },
  ].filter(o => o.show)

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(10,10,15,0.95), rgba(20,20,30,0.8))',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      animation: 'slideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.1) both'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Destino
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1rem' }}>🏟️</span>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{estadio}</span>
          {jogo.cidade && jogo.estadio !== jogo.cidade && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>· {jogo.cidade}</span>
          )}
        </div>
      </div>

      {/* Pergunta */}
      <div style={{ padding: '12px 18px 4px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          De onde você vai sair?
        </div>
      </div>

      {/* Opções */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {opcoes.map(op => (
          <button key={op.key} onClick={() => handleSelect(op.key, op.valor)}
            disabled={!!loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 'var(--radius-md)',
              background: 'transparent', border: '1px solid transparent',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
            }}>
              {loading === op.key ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} /> : op.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: 2 }}>{op.label}</div>
              {op.valor && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                  {op.valor}
                </div>
              )}
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  )
}

// Função legada mantida para compatibilidade
function LocalTransitForm({ user, jogo, onOptionResolved }) {
  return <OriginSelector user={user} jogo={jogo} onConfirm={onOptionResolved} />
}


// ─── Painel comparativo de viagem ────────────────────────────────────────────

function TravelPanel({ data }) {
  const [modalAberto, setModalAberto] = useState(null)

  if (data.erro) {
    return (
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-lg)', color: '#FCA5A5', fontWeight: 600, fontSize: '0.9rem'
      }}>
        <X size={20} /> {data.erro}
      </div>
    )
  }

  // Define array of modals matching the order we want to display
  const modals = ['aviao', 'onibus', 'carro']

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', 
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)'
    }}>
      {/* Cabeçalho do Painel */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {data.origem} <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--text-muted)' }} /> {data.destino}
          </span>
          {/* Badges IATA — exibidos quando os aeroportos forem detectados */}
          {data.iata_origem && data.iata_destino && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em',
              padding: '3px 10px', borderRadius: '100px',
              background: 'rgba(167, 139, 250, 0.1)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              color: '#A78BFA',
            }}>
              <Plane size={10} />
              {data.iata_origem} → {data.iata_destino}
            </span>
          )}
        </div>
        <span className="badge badge-muted" style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.5)' }}>
          {data.distancia_km} km
        </span>
      </div>

      <div style={{
        padding: '6px 16px', fontSize: '0.7rem', color: 'var(--text-muted)', 
        borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '6px',
        fontWeight: 600
      }}>
         Estimativas de mercado sujeitas a alterações.
      </div>

      {/* Accordion das opções */}
      <div>
        {data.opcoes?.map(op => (
          <ModalRow key={op.modal} op={op}
            aberto={modalAberto === op.modal}
            onToggle={() => setModalAberto(v => v === op.modal ? null : op.modal)} />
        ))}
      </div>
    </div>
  )
}

// ─── Linha de modal ──────────────────────────────────────────────────────────

const MODAL_CONFIG = { 
  transporte_local: { color: 'var(--gold)', icon: Navigation },
  carro:  { color: 'var(--blue-bright)', icon: Car },
  onibus: { color: 'var(--gold-dim)', icon: Bus },
  aviao:  { color: '#A78BFA', icon: Plane }
}

function ModalRow({ op, aberto, onToggle }) {
  const config = MODAL_CONFIG[op.modal] || { color: 'var(--text-muted)', icon: Navigation }
  const Icon = config.icon

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: op.recomendado ? `linear-gradient(90deg, ${config.color}15 0%, transparent 100%)` : 'transparent',
      transition: 'background 0.3s'
    }}>
      <button onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `rgba(0,0,0,0.3)`, border: `1px solid ${config.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color: config.color }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{op.label}</span>
            {op.recomendado && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                background: 'var(--green-soft)', color: 'var(--green)',
                border: '1px solid var(--border-green)', borderRadius: '4px', padding: '2px 6px',
              }}>Recomendado</span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
             Tempo aprox. {formatarDuracao(op.duracao_h)}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: config.color, whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{op.custo.min === op.custo.max ? '' : 'Entre '}</span>
            R${op.custo.min}{op.custo.min !== op.custo.max && ` – ${op.custo.max}`}
          </span>
          <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
        </div>
      </button>

      {aberto && (
        <div className="animate-fade-in" style={{
          padding: '0 16px 16px 66px', display: 'flex', flexWrap: 'wrap', gap: 10,
        }}>
          {Object.entries(op.links || {}).map(([nome, url]) => {
            const label = LINK_LABELS[nome] || nome
            const hl = LINK_HIGHLIGHTS[nome]
            return (
              <a key={nome} href={url} target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: hl ? '8px 16px' : '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  color: hl ? hl.color : 'var(--text-primary)',
                  fontSize: hl ? '0.8rem' : '0.75rem',
                  fontWeight: hl ? 700 : 500,
                  border: `1px solid ${hl ? hl.border : 'rgba(255,255,255,0.1)'}`,
                  background: hl ? hl.bg : 'rgba(0,0,0,0.3)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (hl) { e.currentTarget.style.background = hl.hoverBg; e.currentTarget.style.transform = 'translateY(-1px)' }
                  else { e.currentTarget.style.borderColor = config.color; e.currentTarget.style.color = config.color }
                }}
                onMouseLeave={e => {
                  if (hl) { e.currentTarget.style.background = hl.bg; e.currentTarget.style.transform = 'none' }
                  else { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)' }
                }}
              >
                {label}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

const LINK_LABELS = {
  google_maps:    <><MapPin size={12} /> Google Maps</>,
  waze:           <><Navigation size={12} /> Waze</>,
  uber:           <><Car size={12} /> Uber</>,
  buser:          <><Bus size={12} /> Buser</>,
  clickbus:       <><Bus size={12} /> ClickBus</>,
  google_flights: <><Plane size={13} /> Google Flights</>,
  skyscanner:     <><Plane size={12} /> Skyscanner</>,
}

// Links que merecem destaque especial (cores únicas)
const LINK_HIGHLIGHTS = {
  google_flights: { bg: 'rgba(66, 133, 244, 0.12)', border: 'rgba(66, 133, 244, 0.35)', color: '#60A5FA', hoverBg: 'rgba(66, 133, 244, 0.22)' },
  skyscanner:     { bg: 'rgba(0, 225, 180, 0.08)',  border: 'rgba(0, 225, 180, 0.25)',  color: '#2dd4bf', hoverBg: 'rgba(0, 225, 180, 0.18)' },
}

function formatarDuracao(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}m`
}
