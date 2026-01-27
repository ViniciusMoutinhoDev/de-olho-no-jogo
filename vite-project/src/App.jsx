import { useState, useEffect } from 'react'
import './App.css'

const API_URL = "http://127.0.0.1:5000/api"

// =============================================================================
// COMPONENTE DE LOGIN
// =============================================================================
const AuthScreen = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    city: 'São Paulo'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = isRegister ? '/register' : '/login'

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        onLogin(data.token, data.user)
      } else {
        setError(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
    }

    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1
          className="app-title"
          style={{ fontSize: '2rem', marginBottom: '10px' }}
        >
          De Olho No Jogo
        </h1>

        <h2 style={{ color: 'white', marginBottom: '20px' }}>
          {isRegister ? 'Criar Conta' : 'Bem-vindo de volta'}
        </h2>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '15px',
              fontSize: '0.9rem'
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}
        >
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Seu Nome"
                className="search-input"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <input
                type="text"
                placeholder="Sua Cidade (Ex: Rio de Janeiro)"
                className="search-input"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
              />
            </>
          )}

          <input
            type="email"
            placeholder="E-mail"
            className="search-input"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />

          <input
            type="password"
            placeholder="Senha"
            className="search-input"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />

          <button
            type="submit"
            className="btn-primary-gradient"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading
              ? 'Carregando...'
              : isRegister
              ? 'Cadastrar'
              : 'Entrar'}
          </button>
        </form>

        <p
          style={{
            color: '#94a3b8',
            marginTop: '20px',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? 'Já tem conta? Faça login.'
            : 'Não tem conta? Cadastre-se grátis.'}
        </p>
      </div>
    </div>
  )
}

export default App
