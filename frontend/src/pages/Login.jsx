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
    <div style={{ maxWidth: 380, margin: '80px auto', padding: '32px 24px',
      background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 24, textAlign: 'center' }}>⚽ De Olho No Jogo</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="E-mail" type="email" required
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Senha" type="password" required
          value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} />
        {error && <p style={{ color: '#e53935', fontSize: '0.85rem' }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ background: '#1a1a2e', color: '#fff', padding: '10px', marginTop: 4 }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
        Não tem conta? <Link to="/register" style={{ color: '#2196F3' }}>Cadastre-se</Link>
      </p>
    </div>
  )
}
