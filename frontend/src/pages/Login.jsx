import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.senha)
      navigate('/')
    } catch {
      setError('E-mail ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--green-soft)', borderRadius: '24px', marginBottom: '1.25rem', boxShadow: '0 0 32px var(--green-glow)' }}>
            <Eye size={42} className="text-green" strokeWidth={1.5} />
          </div>
          <h1>De Olho <span>No Jogo</span></h1>
          <p className="auth-subtitle">Sua logística de viagem inteligente para o próximo jogo.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ paddingLeft: '4px' }}>E-mail</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} className="text-muted" style={{ position: 'absolute', left: '16px' }} />
              <input
                type="email" placeholder="seu@email.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ paddingLeft: '4px' }}>Senha</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} className="text-muted" style={{ position: 'absolute', left: '16px' }} />
              <input
                type="password" placeholder="••••••••" required
                value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })}
                style={{ paddingLeft: '44px' }}
              />
            </div>
            {error && (
              <p className="form-error animate-fade-in" style={{ paddingLeft: '4px' }}>
                {error}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full animate-fade-in" disabled={loading}
            style={{ marginTop: '0.75rem', height: '52px', fontSize: '1rem' }}>
            {loading ? <Loader2 size={20} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : (
              <>Entrar na plataforma <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="auth-divider" />
        
        <p className="auth-footer text-muted" style={{ fontSize: '0.9rem' }}>
          Ainda não tem conta?{' '}
          <Link to="/register" style={{ color: 'var(--green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
