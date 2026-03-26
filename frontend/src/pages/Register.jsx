import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">⚽</span>
          <h1>Criar <span>Conta</span></h1>
          <p className="auth-subtitle">Comece a planejar suas viagens</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input placeholder="Seu nome" required {...f('nome')} />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input type="email" placeholder="seu@email.com" required {...f('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input type="password" placeholder="••••••••" required {...f('senha')} />
          </div>
          <div className="form-group">
            <label className="form-label">Cidade de origem</label>
            <input placeholder="São Paulo" {...f('cidade_origem')} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '0.5rem' }}>
            {loading ? <><span className="spinner"></span> Criando...</> : 'Criar conta'}
          </button>
        </form>

        <div className="auth-divider" />
        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
