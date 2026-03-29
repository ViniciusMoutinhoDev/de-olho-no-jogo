import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, User, Mail, Lock, MapPin, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '', nome: '', cidade_origem: 'São Paulo' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const f = field => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) })

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--green-soft)', borderRadius: '24px', marginBottom: '1.25rem', boxShadow: '0 0 32px var(--green-glow)' }}>
            <UserPlus size={42} className="text-green" strokeWidth={1.5} />
          </div>
          <h1>Criar <span>Conta</span></h1>
          <p className="auth-subtitle">Comece a planejar suas viagens agora mesmo.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ paddingLeft: '4px' }}>Nome</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} className="text-muted" style={{ position: 'absolute', left: '16px' }} />
              <input placeholder="Seu nome completo" required {...f('nome')} style={{ paddingLeft: '44px' }} />
            </div>
          </div>
          
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ paddingLeft: '4px' }}>E-mail</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} className="text-muted" style={{ position: 'absolute', left: '16px' }} />
              <input type="email" placeholder="seu@email.com" required {...f('email')} style={{ paddingLeft: '44px' }} />
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ paddingLeft: '4px' }}>Senha</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} className="text-muted" style={{ position: 'absolute', left: '16px' }} />
              <input type="password" placeholder="••••••••" required {...f('senha')} style={{ paddingLeft: '44px' }} />
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ paddingLeft: '4px' }}>Cidade de Origem <span className="text-muted" style={{textTransform: 'none', fontWeight: 400}}>(opcional)</span></label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MapPin size={18} className="text-muted" style={{ position: 'absolute', left: '16px' }} />
              <input placeholder="Ex: Rio de Janeiro" {...f('cidade_origem')} style={{ paddingLeft: '44px' }} />
            </div>
            {error && <p className="form-error animate-fade-in" style={{ paddingLeft: '4px' }}>{error}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-full animate-fade-in" disabled={loading}
            style={{ marginTop: '0.75rem', height: '52px', fontSize: '1rem' }}>
            {loading ? <Loader2 size={20} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : (
              <>Criar conta <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="auth-divider" />
        
        <p className="auth-footer text-muted" style={{ fontSize: '0.9rem' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: 'var(--green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
