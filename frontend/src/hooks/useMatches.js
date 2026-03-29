import { useState } from 'react'
import api from '../api/client'

export function useMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)

  async function fetchMatches(clubId, tipo = 'next', ano = null) {
    setLoading(true)
    try {
      const url = ano ? `/api/clubs/${clubId}/matches?ano=${ano}` : `/api/clubs/${clubId}/matches?tipo=${tipo}`
      const { data } = await api.get(url)
      setMatches(data.jogos || data)
    } finally {
      setLoading(false)
    }
  }

  function clear() { setMatches([]) }

  return { matches, loading, fetchMatches, clear }
}
