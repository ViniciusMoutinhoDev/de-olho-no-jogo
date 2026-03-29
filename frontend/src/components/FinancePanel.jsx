import { useState } from 'react'
import api from '../api/client'
import { Wallet, Check, X, Pencil, Loader2 } from 'lucide-react'

const ITENS = [
  { key: 'ingresso',    label: 'Ingressos',    emoji: '🎟️' },
  { key: 'transporte',  label: 'Transporte',   emoji: '🚗' },
  { key: 'alimentacao', label: 'Alimentação',  emoji: '🍔' },
]

/**
 * Um item de custo com dois campos: planejado e real.
 * - Check ✓  → confirma o valor como correto (gasto real = planejado)
 * - X       → entra em modo de edição para colocar o gasto real
 */
function CostItem({ label, emoji, planejado, real, onUpdate }) {
  const [editMode, setEditMode] = useState(false)
  const [draftReal, setDraftReal] = useState(real ?? '')
  const [saving, setSaving] = useState(false)

  const confirmed = real !== null && real !== undefined

  async function handleConfirm() {
    setSaving(true)
    await onUpdate(Number(planejado))
    setSaving(false)
  }

  async function handleSaveReal() {
    if (draftReal === '' || isNaN(Number(draftReal))) return
    setSaving(true)
    await onUpdate(Number(draftReal))
    setEditMode(false)
    setSaving(false)
  }

  return (
    <div className={`cost-item ${confirmed ? 'confirmed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {emoji} {label}
        </span>
        {!confirmed && !editMode && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              title="Confirmar (valor real = planejado)"
              disabled={saving || !planejado}
              onClick={handleConfirm}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.4)',
                background: 'rgba(34,197,94,0.1)', color: '#4ade80', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
            >
              {saving ? <Loader2 size={12} className="spinner" /> : <Check size={12} />}
            </button>
            <button
              title="Editar (digitar valor real)"
              onClick={() => { setEditMode(true); setDraftReal('') }}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <X size={12} />
            </button>
          </div>
        )}
        {confirmed && (
          <button
            title="Editar gasto real"
            onClick={() => { setEditMode(true); setDraftReal(real); onUpdate(null) }}
            style={{
              width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Pencil size={11} />
          </button>
        )}
      </div>

      {/* Linha de valores */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Planejado */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>Planejado</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {planejado ? `R$ ${Number(planejado).toFixed(2)}` : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

        {/* Real */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>Gasto Real</div>
          {editMode ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number" min="0" step="0.01"
                value={draftReal}
                onChange={e => setDraftReal(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveReal(); if (e.key === 'Escape') setEditMode(false) }}
                style={{
                  height: '30px', padding: '0 8px', fontSize: '0.85rem',
                  background: 'rgba(0,0,0,0.4)', border: '1px solid var(--gold)',
                  borderRadius: 'var(--radius-xs)', color: '#fff', width: '80px'
                }}
              />
              <button onClick={handleSaveReal} disabled={saving}
                style={{ height: 28, padding: '0 10px', borderRadius: 'var(--radius-xs)', border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                {saving ? <Loader2 size={12} className="spinner" /> : 'OK'}
              </button>
              <button onClick={() => setEditMode(false)}
                style={{ height: 28, width: 28, borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="cost-amount" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              {confirmed
                ? `R$ ${Number(real).toFixed(2)}`
                : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pendente</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FinancePanel({ jogo, modo = 'viagem' }) {
  // Planejado (estimativas, salvo em banco)
  const [planejado, setPlanejado] = useState({
    ingresso:    jogo.gastos_ingresso    ?? '',
    transporte:  jogo.gastos_transporte  ?? '',
    alimentacao: jogo.gastos_alimentacao ?? '',
  })
  // Real (confirmado ou editado)
  const [real, setReal] = useState({
    ingresso:    jogo.gastos_real_ingresso    ?? null,
    transporte:  jogo.gastos_real_transporte  ?? null,
    alimentacao: jogo.gastos_real_alimentacao ?? null,
  })
  const [editPlan, setEditPlan] = useState({ ingresso: false, transporte: false, alimentacao: false })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalPlanejado = Object.values(planejado).reduce((s, v) => s + Number(v || 0), 0)
  const totalReal = Object.values(real).reduce((s, v) => s + Number(v || 0), 0)
  const allConfirmed = Object.values(real).every(v => v !== null && v !== undefined)

  async function updateReal(key, value) {
    const next = { ...real, [key]: value }
    setReal(next)
    // Se tiver um valor real, salvar no backend
    if (value !== null) {
      try {
        await api.patch(`/api/diary/${jogo.id}`, {
          [`gastos_real_${key}`]: value,
        })
      } catch { /* silent */ }
    }
  }

  async function savePlan(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/api/diary/${jogo.id}`, {
        gastos_ingresso:    Number(planejado.ingresso    || 0),
        gastos_transporte:  Number(planejado.transporte  || 0),
        gastos_alimentacao: Number(planejado.alimentacao || 0),
      })
      jogo.gastos_ingresso    = Number(planejado.ingresso    || 0)
      jogo.gastos_transporte  = Number(planejado.transporte  || 0)
      jogo.gastos_alimentacao = Number(planejado.alimentacao || 0)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { alert('Erro ao salvar estimativas') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)', animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) both' }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(10,10,10,0.9) 0%, rgba(20,20,20,0.7) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))',
            border: '1px solid rgba(251,191,36,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Wallet size={15} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>Centro de Custos</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {modo === 'historico' ? 'Registre o que foi gasto' : 'Planeje e registre os gastos desta viagem'}
            </div>
          </div>

          {/* Totais */}
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              {allConfirmed ? (
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#4ade80' }}>R$ {totalReal.toFixed(2)}</span>
              ) : (
                <>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textDecoration: totalReal > 0 ? 'line-through' : 'none' }}>
                    R$ {totalPlanejado.toFixed(2)}
                  </span>
                  {totalReal > 0 && (
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--gold)' }}>R$ {totalReal.toFixed(2)}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Seção Planejamento */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Estimativas
          </div>
          <form onSubmit={savePlan} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, alignItems: 'end' }}>
            {ITENS.map(({ key, label, emoji }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                  {emoji} {label}
                </label>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="R$ 0"
                  value={planejado[key]}
                  onChange={e => setPlanejado(p => ({ ...p, [key]: e.target.value }))}
                  style={{ height: '40px', padding: '0 10px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>Total Est.</label>
              <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--gold)', fontSize: '1rem' }}>
                R$ {totalPlanejado.toFixed(2)}
              </div>
            </div>
            <button type="submit" disabled={saving} style={{
              height: '40px', padding: '0 16px', borderRadius: 'var(--radius-sm)',
              background: saved ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.12)',
              border: `1px solid ${saved ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.2)'}`,
              color: saved ? '#4ade80' : 'var(--gold)', fontWeight: 700, fontSize: '0.8rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
            }}>
              {saving ? <Loader2 size={14} className="spinner" /> : saved ? <><Check size={14} /> Salvo!</> : 'Salvar'}
            </button>
          </form>
        </div>

        {/* Divisor */}
        <div style={{ margin: '0 20px', height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Seção Gasto Real */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Gasto Real — confirme ✓ ou edite ✕
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {ITENS.map(({ key, label, emoji }) => (
              <CostItem
                key={key}
                emoji={emoji}
                label={label}
                planejado={planejado[key]}
                real={real[key]}
                onUpdate={val => updateReal(key, val)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
