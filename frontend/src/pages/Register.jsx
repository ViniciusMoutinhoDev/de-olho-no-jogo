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

  const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) })

  return (
    <div style={{ maxWidth: 380, margin: '60px auto', padding: '32px 24px',
      background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Criar Conta</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Nome" required {...f('nome')} />
        <input placeholder="E-mail" type="email" required {...f('email')} />
        <input placeholder="Senha" type="password" required {...f('senha')} />
        <input placeholder="Cidade de origem" {...f('cidade_origem')} />
        {error && <p style={{ color: '#e53935', fontSize: '0.85rem' }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ background: '#1a1a2e', color: '#fff', padding: '10px', marginTop: 4 }}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
        Já tem conta? <Link to="/login" style={{ color: '#2196F3' }}>Entrar</Link>
      </p>
    </div>
  )
}
