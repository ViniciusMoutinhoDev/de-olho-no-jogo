import { useEffect } from 'react'
import { useDiary } from '../hooks/useDiary'
import MatchCard from '../components/MatchCard'
import { Plane, Compass, AlertCircle } from 'lucide-react'

export default function Trips({ auth }) {
  const { user, atualizarCidade } = auth
  const { entries, loading, fetchDiary } = useDiary()

  useEffect(() => { fetchDiary() }, [fetchDiary])

  const trips = entries.filter(e => e.status === 'vou')
  const totalCidades = new Set(trips.map(e => e.cidade)).size

  return (
    <div className="page animate-fade-in">
      <div className="page-header club-header glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={24} className="text-blue" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '2px', color: '#FFF' }}>Minhas Viagens</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Planejamento e acompanhamento de jogos futuros
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading" style={{ minHeight: '30vh' }}>
          <span className="spinner" /> Carregando sua agenda...
        </div>
      )}

      {!loading && trips.length === 0 && (
        <div className="card glass-panel empty-state">
          <Compass size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Nenhuma viagem na agenda</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Salve os próximos jogos do seu clube na Home para planejar rotas e custos aqui.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {trips.map((entry, i) => (
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
              modoViagem={true}
              user={user}
              onDiaryChange={fetchDiary}
              onCidadeAtualizada={atualizarCidade}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
