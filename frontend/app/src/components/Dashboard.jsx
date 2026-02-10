import React, { useState, useEffect } from 'react';
import { authService, gamesService, diaryService } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('proximos'); // proximos, passados, diario
  const [games, setGames] = useState({ upcoming: [], past: [] });
  const [diary, setDiary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [travelInfo, setTravelInfo] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'diario') {
      loadDiary();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
    }
  };

  const loadDiary = async () => {
    try {
      setLoading(true);
      const data = await diaryService.getDiary();
      setDiary(data.diary);
    } catch (err) {
      console.error('Erro ao carregar diário:', err);
      setError('Erro ao carregar diário');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchInput.trim()) {
      setError('Digite o nome de um time');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTeamName(searchInput);
      
      const data = await gamesService.getTeamGames(searchInput, false);
      setGames(data.games);
      
      if (data.games.upcoming.length === 0 && data.games.past.length === 0) {
        setError('Nenhum jogo encontrado. Tente outro time ou clique em "Atualizar".');
      }
    } catch (err) {
      console.error('Erro ao buscar jogos:', err);
      setError('Erro ao buscar jogos. Verifique o nome do time.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!teamName) {
      setError('Faça uma busca primeiro');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await gamesService.getTeamGames(teamName, true);
      setGames(data.games);
      
      alert('Jogos atualizados com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar jogos:', err);
      setError('Erro ao atualizar jogos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGame = async (game) => {
    try {
      await gamesService.saveGameToDiary(game.id, {
        watched: false,
        notes: '',
      });
      
      alert('Jogo salvo no diário!');
      
      // Recarregar diário se estiver na aba
      if (activeTab === 'diario') {
        loadDiary();
      }
    } catch (err) {
      console.error('Erro ao salvar jogo:', err);
      alert('Erro ao salvar jogo');
    }
  };

  const handleRemoveGame = async (gameId) => {
    if (!confirm('Tem certeza que deseja remover este jogo do diário?')) {
      return;
    }

    try {
      await gamesService.removeFromDiary(gameId);
      alert('Jogo removido do diário!');
      loadDiary();
    } catch (err) {
      console.error('Erro ao remover jogo:', err);
      alert('Erro ao remover jogo');
    }
  };

  const handleViewTravel = async (game) => {
    try {
      setLoading(true);
      const data = await gamesService.getTravelInfo(game.id);
      setSelectedGame(game);
      setTravelInfo(data.travel);
    } catch (err) {
      console.error('Erro ao buscar informações de viagem:', err);
      
      if (err.response?.status === 400) {
        alert('Configure sua cidade no perfil para ver informações de viagem');
      } else {
        alert('Erro ao buscar informações de viagem');
      }
    } finally {
      setLoading(false);
    }
  };

  const closeTravelModal = () => {
    setSelectedGame(null);
    setTravelInfo(null);
  };

  const handleLogout = () => {
    authService.logout();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const renderGameCard = (game, showSaveButton = true) => (
    <div key={game.id} className="game-card">
      <div className="game-header">
        <span className="game-date">{formatDate(game.date)}</span>
        {game.time && <span className="game-time">{game.time}</span>}
      </div>
      
      <div className="game-teams">
        <span className="opponent">{game.opponent}</span>
      </div>
      
      {game.score && (
        <div className="game-score">{game.score}</div>
      )}
      
      <div className="game-location">
        📍 {game.location || game.city || 'Local não informado'}
      </div>
      
      {game.competition && (
        <div className="game-competition">{game.competition}</div>
      )}
      
      <div className="game-actions">
        {user?.city && (
          <button 
            className="btn-secondary"
            onClick={() => handleViewTravel(game)}
          >
            ✈️ Ver Viagem
          </button>
        )}
        
        {showSaveButton ? (
          <button 
            className="btn-primary"
            onClick={() => handleSaveGame(game)}
          >
            💾 Salvar
          </button>
        ) : (
          <button 
            className="btn-danger"
            onClick={() => handleRemoveGame(game.id)}
          >
            🗑️ Remover
          </button>
        )}
      </div>
    </div>
  );

  const renderTravelModal = () => {
    if (!selectedGame || !travelInfo) return null;

    return (
      <div className="modal-overlay" onClick={closeTravelModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeTravelModal}>×</button>
          
          <h2>Informações de Viagem</h2>
          
          <div className="travel-info">
            <div className="travel-section">
              <h3>Jogo</h3>
              <p><strong>{selectedGame.opponent}</strong></p>
              <p>{formatDate(selectedGame.date)} - {selectedGame.time}</p>
              <p>📍 {selectedGame.location}</p>
            </div>

            <div className="travel-section">
              <h3>Distância</h3>
              <p><strong>{travelInfo.distance} km</strong></p>
              <p>De {travelInfo.origin?.city} até {travelInfo.destination?.city}</p>
            </div>

            <div className="travel-section">
              <h3>Transporte Recomendado</h3>
              <p className="transport-type">
                {travelInfo.transportType === 'flight' && '✈️ Avião'}
                {travelInfo.transportType === 'bus' && '🚌 Ônibus'}
                {travelInfo.transportType === 'car' && '🚗 Carro'}
              </p>
            </div>

            {travelInfo.warning && (
              <div className="travel-warning">
                ⚠️ {travelInfo.warning}
                {travelInfo.suggestion && <p>{travelInfo.suggestion}</p>}
              </div>
            )}

            {travelInfo.flightLinks && (
              <div className="travel-links">
                <h3>Buscar Voos</h3>
                <a 
                  href={travelInfo.flightLinks.skyscanner} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Skyscanner
                </a>
                <a 
                  href={travelInfo.flightLinks.googleFlights} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Google Flights
                </a>
              </div>
            )}

            {travelInfo.groundTransportURL && (
              <div className="travel-links">
                <h3>Rota</h3>
                <a 
                  href={travelInfo.groundTransportURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  {travelInfo.transportType === 'bus' ? 'Ver Ônibus' : 'Ver Rota'}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>
            <span className="eye-icon">👁️</span>
            De Olho No Jogo
          </h1>
        </div>
        
        <div className="header-right">
          <span className="user-info">
            👤 {user?.username}
            {user?.city && ` - ${user.city}`}
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </header>

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Digite o nome do time (ex: Corinthians)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search" disabled={loading}>
            {loading ? '🔄' : '🔍'} Buscar
          </button>
          {teamName && (
            <button 
              type="button" 
              onClick={handleRefresh} 
              className="btn-refresh"
              disabled={loading}
            >
              🔄 Atualizar
            </button>
          )}
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'proximos' ? 'active' : ''}`}
          onClick={() => setActiveTab('proximos')}
        >
          📅 Próximos Jogos
        </button>
        <button
          className={`tab ${activeTab === 'passados' ? 'active' : ''}`}
          onClick={() => setActiveTab('passados')}
        >
          📊 Jogos Passados
        </button>
        <button
          className={`tab ${activeTab === 'diario' ? 'active' : ''}`}
          onClick={() => setActiveTab('diario')}
        >
          📖 Meu Diário
        </button>
      </div>

      <div className="games-container">
        {loading && <div className="loading">Carregando...</div>}

        {!loading && activeTab === 'proximos' && (
          <div className="games-grid">
            {games.upcoming.length > 0 ? (
              games.upcoming.map((game) => renderGameCard(game, true))
            ) : (
              <p className="no-games">
                {teamName 
                  ? 'Nenhum jogo próximo encontrado' 
                  : 'Busque por um time para ver os jogos'}
              </p>
            )}
          </div>
        )}

        {!loading && activeTab === 'passados' && (
          <div className="games-grid">
            {games.past.length > 0 ? (
              games.past.map((game) => renderGameCard(game, true))
            ) : (
              <p className="no-games">
                {teamName 
                  ? 'Nenhum jogo passado encontrado' 
                  : 'Busque por um time para ver os jogos'}
              </p>
            )}
          </div>
        )}

        {!loading && activeTab === 'diario' && (
          <div className="games-grid">
            {diary.length > 0 ? (
              diary.map((game) => renderGameCard(game, false))
            ) : (
              <p className="no-games">
                Seu diário está vazio. Salve jogos para acompanhar!
              </p>
            )}
          </div>
        )}
      </div>

      {renderTravelModal()}
    </div>
  );
}

export default Dashboard;