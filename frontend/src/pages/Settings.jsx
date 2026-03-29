import { useState } from 'react'
import { MapPin, Briefcase, Loader2, Save, CheckCircle } from 'lucide-react'
import api from '../api/client'

export default function Settings({ auth }) {
  const { user, login } = auth // login from auth context can be used to refetch user data if available, but let's just use API and trust reload or local state

  const [casa, setCasa] = useState(user?.endereco_casa || '')
  const [trabalho, setTrabalho] = useState(user?.endereco_trabalho || '')
  
  const [loadingC, setLoadingC] = useState(false)
  const [successC, setSuccessC] = useState(false)
  
  const [loadingT, setLoadingT] = useState(false)
  const [successT, setSuccessT] = useState(false)

  async function handleSaveCasa(e) {
    e.preventDefault()
    setLoadingC(true)
    try {
      await api.put('/api/auth/enderecos', { tipo: 'casa', endereco: casa })
      if(user) user.endereco_casa = casa // Optmistic UI update
      setSuccessC(true)
      setTimeout(() => setSuccessC(false), 3000)
    } catch {
      alert("Erro ao salvar endereço de casa")
    } finally { setLoadingC(false) }
  }

  async function handleSaveTrabalho(e) {
    e.preventDefault()
    setLoadingT(true)
    try {
      await api.put('/api/auth/enderecos', { tipo: 'trabalho', endereco: trabalho })
      if(user) user.endereco_trabalho = trabalho // Optmistic UI update
      setSuccessT(true)
      setTimeout(() => setSuccessT(false), 3000)
    } catch {
      alert("Erro ao salvar endereço de trabalho")
    } finally { setLoadingT(false) }
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header club-header glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#FFF' }}>Configurações de Logística</h2>
        <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Defina seus pontos de partida para que o De Olho No Jogo calcule suas rotas mais rapidamente.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Endereço de Casa */}
        <div className="card glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} className="text-blue" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Endereço de Casa</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Seu ponto de partida oficial.</p>
            </div>
          </div>
          <form onSubmit={handleSaveCasa} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="text" value={casa} onChange={e => setCasa(e.target.value)} 
              placeholder="Ex: Rua das Flores, 123 - Tatuapé, SP" 
              style={{ padding: '14px', background: 'rgba(0,0,0,0.3)' }}
            />
            <button type="submit" disabled={loadingC} className="btn btn-ghost" style={{ alignSelf: 'flex-start', color: successC ? 'var(--green)' : 'var(--text-primary)', borderColor: successC ? 'var(--green)' : 'var(--border-strong)' }}>
              {loadingC ? <Loader2 size={18} className="spinner" /> : successC ? <><CheckCircle size={18} /> Salvo</> : <><Save size={18} /> Salvar Endereço</>}
            </button>
          </form>
        </div>

        {/* Endereço de Trabalho */}
        <div className="card glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={22} className="text-gold" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Endereço do Trabalho</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jogos em dias de semana?</p>
            </div>
          </div>
          <form onSubmit={handleSaveTrabalho} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="text" value={trabalho} onChange={e => setTrabalho(e.target.value)} 
              placeholder="Ex: Av. Paulista, 1000 - SP" 
              style={{ padding: '14px', background: 'rgba(0,0,0,0.3)' }}
            />
            <button type="submit" disabled={loadingT} className="btn btn-ghost" style={{ alignSelf: 'flex-start', color: successT ? 'var(--green)' : 'var(--text-primary)', borderColor: successT ? 'var(--green)' : 'var(--border-strong)' }}>
              {loadingT ? <Loader2 size={18} className="spinner" /> : successT ? <><CheckCircle size={18} /> Salvo</> : <><Save size={18} /> Salvar Endereço</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
