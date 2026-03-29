import { useEffect } from 'react'
import { useDiary } from '../hooks/useDiary'
import MatchCard from '../components/MatchCard'

export default function Diary() {
  const { entries, loading, fetchDiary } = useDiary()

  useEffect(() => { fetchDiary() }, [fetchDiary])

  const pasadas = entries.filter(e => e.status !== 'vou')
  const totalEstadios = new Set(pasadas.map(e => e.estadio)).size
  const totalCidades  = new Set(pasadas.map(e => e.cidade)).size

  return (
    <div className="page animate-fade-in">
      <div className="page-header club-header glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '2px', color: '#FFF' }}>Meu Diário de Viagens</h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Histórico dos jogos em que marquei presença.</span>
      </div>

      {pasadas.length > 0 && (
        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            ['⚽', pasadas.length, 'Jogos'],
            ['🏟', totalEstadios, 'Estádios'],
            ['📍', totalCidades, 'Cidades'],
          ].map(([icon, val, label]) => (
            <div key={label} className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span className="stat-value" style={{ display: 'block', fontSize: '2rem', fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{val}</span>
              <span className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{icon} {label}</span>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="loading" style={{ minHeight: '30vh' }}>
          <span className="spinner" /> Carregando diário...
        </div>
      )}

      {!loading && pasadas.length === 0 && (
        <div className="empty-state card glass-panel" style={{ marginTop: '3rem' }}>
          <span className="empty-state-icon text-muted">📓</span>
          <p>Nenhum jogo salvo ainda no seu passado.<br/>Busque um clube ou salve os próximos jogos marcando "Eu Fui!".</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pasadas.map((entry, i) => (
          <div key={entry.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
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
                gastos_ingresso: entry.gastos_ingresso,
                gastos_transporte: entry.gastos_transporte,
                gastos_alimentacao: entry.gastos_alimentacao,
                gastos_real_ingresso: entry.gastos_real_ingresso,
                gastos_real_transporte: entry.gastos_real_transporte,
                gastos_real_alimentacao: entry.gastos_real_alimentacao,
                _saved: true,
              }}
              modoViagem={false}
              onDiaryChange={fetchDiary}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
