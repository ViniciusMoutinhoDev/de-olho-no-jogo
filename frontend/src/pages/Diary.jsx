import { useEffect } from 'react'
import { useDiary } from '../hooks/useDiary'
import MatchCard from '../components/MatchCard'

export default function Diary() {
  const { entries, loading, fetchDiary, removeMatch } = useDiary()

  useEffect(() => { fetchDiary() }, [fetchDiary])

  const totalEstadios = new Set(entries.map(e => e.estadio)).size
  const totalCidades  = new Set(entries.map(e => e.cidade)).size

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ marginBottom: 20 }}>📓 Meu Diário de Viagens</h2>

      {entries.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            ['⚽ Jogos', entries.length],
            ['🏟️ Estádios', totalEstadios],
            ['📍 Cidades', totalCidades],
          ].map(([label, val]) => (
            <div key={label} style={{ flex: 1, background: '#fff', borderRadius: 10,
              padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <p style={{ color: '#666' }}>Carregando...</p>}

      {!loading && entries.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
          Nenhum jogo salvo ainda. Busque um clube e clique em "Eu Fui!"
        </p>
      )}

      {entries.map(entry => (
        <MatchCard
          key={entry.id}
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
      ))}
    </div>
  )
}
