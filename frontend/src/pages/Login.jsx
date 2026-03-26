import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">⚽</span>
          <h1>De Olho <span>No Jogo</span></h1>
          <p className="auth-subtitle">Planeje sua viagem para o próximo jogo</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              type="email" placeholder="seu@email.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password" placeholder="••••••••" required
              value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '0.5rem' }}>
            {loading ? <><span className="spinner"></span> Entrando...</> : 'Entrar'}
          </button>
        </form>

        <div className="auth-divider" />
        <p className="auth-footer">
          Não tem conta? <Link to="/register">Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  )
}
