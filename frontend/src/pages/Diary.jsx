import { useEffect } from 'react'
import { useDiary } from '../hooks/useDiary'
import MatchCard from '../components/MatchCard'

export default function Diary() {
  const { entries, loading, fetchDiary } = useDiary()

  useEffect(() => { fetchDiary() }, [fetchDiary])

  const totalEstadios = new Set(entries.map(e => e.estadio)).size
  const totalCidades  = new Set(entries.map(e => e.cidade)).size

  return (
    <div className="page">
      <div className="page-header">
        <h2>Meu Diário de Viagens</h2>
        {entries.length > 0 && (
          <span className="badge badge-green">{entries.length} jogos</span>
        )}
      </div>

      {entries.length > 0 && (
        <div className="stats-row">
          {[
            ['⚽', entries.length, 'Jogos'],
            ['🏟', totalEstadios, 'Estádios'],
            ['📍', totalCidades, 'Cidades'],
          ].map(([icon, val, label]) => (
            <div key={label} className="stat-card">
              <span className="stat-value">{val}</span>
              <span className="stat-label">{icon} {label}</span>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="loading">
          <span className="spinner" />
          Carregando diário...
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <span className="empty-state-icon">📓</span>
          <p>Nenhum jogo salvo ainda. Busque um clube e clique em "Eu Fui!" para registrar sua memória.</p>
        </div>
      )}

      {entries.map((entry, i) => (
        <div key={entry.id} style={{ animationDelay: `${i * 0.04}s` }}>
          <MatchCard
            jogo={{
              id: entry.id_jogo_sofascore,
              data_fmt: entry.data_jogo,
              home: entry.match_name?.split(' x ')[0] || '',
              away: entry.match_name?.split(' x ')[1] || '',
              estadio: entry.estadio,
              cidade: entry.cidade,
              placar: entry.placar,
              torneio: entry.torneio,
              home_logo: entry.home_logo,
              away_logo: entry.away_logo,
              _saved: true,
            }}
            modoViagem={false}
            onDiaryChange={fetchDiary}
          />
        </div>
      ))}
    </div>
  )
}
