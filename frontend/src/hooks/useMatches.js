import { useState } from 'react'
import api from '../api/client'

export function useMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)

  async function fetchMatches(clubId, tipo = 'next') {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/clubs/${clubId}/matches?tipo=${tipo}`)
      setMatches(data)
    } finally {
      setLoading(false)
    }
  }

  function clear() { setMatches([]) }

  return { matches, loading, fetchMatches, clear }
}
