import { useState, useCallback } from 'react'
import api from '../api/client'

export function useDiary() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchDiary = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/diary/')
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }, [])

  async function addMatch(jogo) {
    await api.post('/api/diary/', jogo)
    await fetchDiary()
  }

  async function removeMatch(idSofascore) {
    await api.delete(`/api/diary/${idSofascore}`)
    await fetchDiary()
  }

  async function checkMatch(idSofascore) {
    const { data } = await api.get(`/api/diary/${idSofascore}/check`)
    return data.saved
  }

  return { entries, loading, fetchDiary, addMatch, removeMatch, checkMatch }
}
