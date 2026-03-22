import api from '../api/client'
import { useState } from 'react'

export default function MatchCard({ jogo, modoViagem = false, cidadeOrigem = '', onDiaryChange }) {
  const [saved, setSaved] = useState(jogo._saved || false)
  const [loadingTravel, setLoadingTravel] = useState(false)
  const [travelInfo, setTravelInfo] = useState(null)

  async function toggleDiary() {
    if (saved) {
      await api.delete(`/api/diary/${jogo.id}`)
    } else {
      await api.post('/api/diary/', {
        id: jogo.id, data_fmt: jogo.data_fmt, home: jogo.home, away: jogo.away,
        estadio: jogo.estadio, cidade: jogo.cidade, placar: jogo.placar,
        torneio: jogo.torneio, home_logo: jogo.home_logo, away_logo: jogo.away_logo,
      })
    }
    setSaved(!saved)
    onDiaryChange?.()
  }

  async function fetchTravel() {
    if (travelInfo || !cidadeOrigem || !jogo.cidade) return
    setLoadingTravel(true)
    try {
      const [log, links] = await Promise.all([
        api.get(`/api/travel/logistics?origem=${cidadeOrigem}&destino=${jogo.cidade}`),
        api.get(`/api/travel/links?origem=${cidadeOrigem}&destino=${jogo.cidade}&data_jogo=${jogo.dt_obj}`),
      ])
      setTravelInfo({ ...log.data, ...links.data })
    } finally {
      setLoadingTravel(false)
    }
  }

  const corBorda = saved ? '#4CAF50' : modoViagem ? '#2196F3' : '#9E9E9E'

  return (
    <div style={{
      border: '1px solid #e0e0e0', borderLeft: `5px solid ${corBorda}`,
      borderRadius: 10, padding: 15, marginBottom: 12, background: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem',
        color: saved ? '#2e7d32' : '#757575', fontWeight: 600, marginBottom: 8 }}>
        <span>{saved ? '✅ MEMÓRIA SALVA' : `${jogo.data_fmt} • ${jogo.torneio}`}</span>
        {saved && <span>{jogo.data_fmt}</span>}
      </div>

      {/* Confronto */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <img src={jogo.home_logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }}
            onError={e => e.target.style.display = 'none'} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{jogo.home}</span>
        </div>
        <div style={{ background: '#f0f2f5', padding: '5px 14px', borderRadius: 20,
          fontWeight: 700, fontSize: '1rem', minWidth: 70, textAlign: 'center' }}>
          {modoViagem && jogo.placar === 'vs' && jogo.dt_obj
            ? new Date(jogo.dt_obj).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : jogo.placar}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%', justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'right' }}>{jogo.away}</span>
          <img src={jogo.away_logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }}
            onError={e => e.target.style.display = 'none'} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, fontSize: '0.82rem',
        color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🏟️ {jogo.estadio} · 📍 {jogo.cidade}</span>

        <div style={{ display: 'flex', gap: 8 }}>
          {modoViagem && (
            <button onClick={fetchTravel} disabled={loadingTravel}
              style={{ background: '#1565C0', color: '#fff', padding: '5px 12px', fontSize: '0.8rem' }}>
              {loadingTravel ? '...' : '✈️ Viagem'}
            </button>
          )}
          <button onClick={toggleDiary}
            style={{ background: saved ? '#e53935' : '#43a047', color: '#fff',
              padding: '5px 12px', fontSize: '0.8rem' }}>
            {saved ? '🗑️ Remover' : '✅ Eu Fui!'}
          </button>
        </div>
      </div>

      {/* Travel info */}
      {travelInfo && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#e3f2fd',
          borderRadius: 8, fontSize: '0.82rem' }}>
          {travelInfo.modo === 'CARRO'
            ? `🚗 ${travelInfo.distancia_km}km · Est. R$ ${travelInfo.custo_estimado_brl}`
            : (
              <>
                ✈️ {travelInfo.distancia_km}km ·{' '}
                {travelInfo.skyscanner && (
                  <a href={travelInfo.skyscanner} target="_blank" rel="noreferrer"
                    style={{ color: '#1565C0', fontWeight: 600 }}>
                    Ver passagens
                  </a>
                )}
              </>
            )}
        </div>
      )}
    </div>
  )
}
