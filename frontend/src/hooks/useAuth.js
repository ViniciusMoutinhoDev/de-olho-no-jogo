import { useState } from 'react'
import api from '../api/client'

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  async function login(email, senha) {
    const { data } = await api.post('/api/auth/login', { email, senha })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({
      id: data.user_id,
      nome: data.nome,
      cidade_origem: data.cidade_origem,
    }))
    setUser({ id: data.user_id, nome: data.nome, cidade_origem: data.cidade_origem })
    return data
  }

  async function register(payload) {
    await api.post('/api/auth/register', payload)
  }

  function logout() {
    localStorage.clear()
    setUser(null)
  }

  return { user, login, register, logout }
}
