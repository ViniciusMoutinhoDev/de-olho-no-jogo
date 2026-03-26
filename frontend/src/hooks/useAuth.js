import { useState } from 'react'
import api from '../api/client'

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  async function login(email, senha) {
    const { data } = await api.post('/api/auth/login', { email, senha })
    const userData = {
      id: data.user_id,
      nome: data.nome,
      cidade_origem: data.cidade_origem,
      clube_coracao_id:   data.clube_coracao_id   || null,
      clube_coracao_nome: data.clube_coracao_nome || null,
      clube_coracao_logo: data.clube_coracao_logo || null,
    }
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return data
  }

  async function register(payload) {
    await api.post('/api/auth/register', payload)
  }

  async function salvarClubeCoracao(clube) {
    await api.post('/api/auth/clube-coracao', {
      clube_id: clube.id,
      nome:     clube.nome,
      logo:     clube.logo,
    })
    const updated = { ...user, clube_coracao_id: clube.id, clube_coracao_nome: clube.nome, clube_coracao_logo: clube.logo }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  async function removerClubeCoracao() {
    await api.delete('/api/auth/clube-coracao')
    const updated = { ...user, clube_coracao_id: null, clube_coracao_nome: null, clube_coracao_logo: null }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  function logout() {
    localStorage.clear()
    setUser(null)
  }

  return { user, setUser, login, register, logout, salvarClubeCoracao, removerClubeCoracao }
}
