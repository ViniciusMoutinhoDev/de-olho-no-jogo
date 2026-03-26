import { useState } from 'react'
import api from '../api/client'

export default function MatchCard({ jogo, modoViagem = false, cidadeOrigem = '', onDiaryChange }) {
  const [saved, setSaved] = useState(jogo._saved || false)
  const [loadingTravel, setLoadingTravel] = useState(false)
  const [travelInfo, setTravelInfo] = useState(null)

  async function toggleDiary() {
    try {
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
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchTravel() {
    if (travelInfo || !cidadeOrigem || !jogo.cidade) return
    setLoadingTravel(true)
    try {
      const [log, links] = await Promise.all([
        api.get(`/api/travel/logistics?origem=${encodeURIComponent(cidadeOrigem)}&destino=${encodeURIComponent(jogo.cidade)}`),
        api.get(`/api/travel/links?origem=${encodeURIComponent(cidadeOrigem)}&destino=${encodeURIComponent(jogo.cidade)}&data_jogo=${jogo.dt_obj}`),
      ])
      setTravelInfo({ ...log.data, ...links.data })
    } catch(e) {
      console.error(e)
    } finally {
      setLoadingTravel(false)
    }
  }

  const cardClass = `match-card ${saved ? 'is-saved' : modoViagem ? 'is-future' : ''} animate-slide-up`
  const headerClass = `match-card-header ${saved ? 'saved' : modoViagem ? 'future' : ''}`

  const scoreText = modoViagem && jogo.placar === 'vs' && jogo.dt_obj
    ? new Date(jogo.dt_obj).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : jogo.placar

  return (
    <div className={cardClass}>
      <div className={headerClass}>
        <span>{saved ? '✓ Memória salva' : `${jogo.data_fmt} · ${jogo.torneio}`}</span>
        {saved && <span>{jogo.data_fmt}</span>}
      </div>

      <div className="match-teams">
        <div className="team">
          <img src={jogo.home_logo} alt="" className="team-logo"
            onError={e => e.target.style.display = 'none'} />
          <span className="team-name">{jogo.home}</span>
        </div>

        <div className="match-score">{scoreText}</div>

        <div className="team away">
          <img src={jogo.away_logo} alt="" className="team-logo"
            onError={e => e.target.style.display = 'none'} />
          <span className="team-name">{jogo.away}</span>
        </div>
      </div>

      <div className="match-footer">
        <span className="match-venue">
          🏟 {jogo.estadio} · {jogo.cidade}
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          {modoViagem && (
            <button onClick={fetchTravel} disabled={loadingTravel} className="btn btn-ghost"
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
              {loadingTravel ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '✈ Viagem'}
            </button>
          )}
          <button onClick={toggleDiary}
            className={`btn ${saved ? 'btn-danger' : 'btn-primary'}`}
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
            {saved ? '× Remover' : '+ Eu Fui!'}
          </button>
        </div>
      </div>

      {travelInfo && (
        <div className={`travel-badge ${travelInfo.modo === 'CARRO' ? 'car' : ''}`}
          style={{ marginTop: 10 }}>
          {travelInfo.modo === 'CARRO'
            ? `🚗 ${travelInfo.distancia_km}km · Est. R$ ${travelInfo.custo_estimado_brl}`
            : (
              <>
                ✈ {travelInfo.distancia_km}km ·{' '}
                {travelInfo.skyscanner &&
                  <a href={travelInfo.skyscanner} target="_blank" rel="noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}>
                    Ver passagens
                  </a>
                }
              </>
            )
          }
        </div>
      )}
    </div>
  )
}
