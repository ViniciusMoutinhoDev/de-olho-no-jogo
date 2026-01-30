import { useState, useEffect } from 'react'
import './App.css'

// Aponta para o seu novo Backend Node.js
const API_URL = "http://localhost:3001/api"

// =============================================================================
// 1. SUB-COMPONENTES (CARDS, GOLS, ACORDEÃO)
// =============================================================================

// Exibe quem fez os gols (se houver dados)
const MatchScorers = ({ gameId, lado }) => {
  const [gols, setGols] = useState([])
  
  useEffect(() => {
    // Nota: Se o backend Node ainda não tiver essa rota, isso vai retornar vazio por enquanto
    const fetchGols = async () => {
      try {
        const res = await fetch(`${API_URL}/detalhes?id=${gameId}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setGols(data.filter(g => g.lado === lado))
        }
      } catch(e) { console.log('Sem detalhes de gols') }
    }
    fetchGols()
  }, [gameId, lado])

  if (gols.length === 0) return null
  
  return (
    <div className="scorers-list">
      {gols.map((g, i) => (
        <div key={i} className="scorer-item">⚽ {g.jogador} <span className="goal-time">{g.minuto}'</span></div>
      ))}
    </div>
  )
}

// Acordeão que agrupa jogos por ano
const YearSectionPro = ({ ano, jogos, viewMode, toggleDiario, defaultOpen }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="year-accordion-enhanced">
      <button className={`year-header-enhanced ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span>📅 Temporada {ano}</span>
        <span style={{background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'12px', fontSize:'0.8rem'}}>
          {jogos.length} jogos
        </span>
      </button>
      
      {isOpen && (
        <div className="year-content-enhanced">
          {jogos.map(jogo => (
            <div key={jogo.id || Math.random()} className={`game-card-pro ${viewMode === 'next' ? 'future' : ''} ${jogo.salvo ? 'saved' : ''}`}>
              
              {/* HEADER DO CARD */}
              <div className="pro-card-header">
                <span>{jogo.data_fmt || jogo.data} • {jogo.torneio}</span>
                {jogo.salvo && <span className="saved-badge">✅ SALVO</span>}
                {!jogo.salvo && viewMode === 'last' && (
                  <button className="btn-save-pro btn-action-pro" onClick={() => toggleDiario(jogo)} style={{padding:'4px 10px', fontSize:'0.75rem'}}>
                    + Salvar
                  </button>
                )}
              </div>

              {/* GRID DO CONFRONTO */}
              <div className="pro-matchup-grid">
                {/* Time Casa */}
                <div className="team-block">
                  <img src={jogo.home_logo} className="team-logo-match" onError={e=>e.target.style.display='none'} alt=""/>
                  <span className="team-name-pro">{jogo.home || jogo.time_casa}</span>
                  {viewMode === 'last' && <MatchScorers gameId={jogo.id} lado="home"/>}
                </div>

                {/* Placar Central */}
                <div className={`score-box-pro ${viewMode === 'next' && (jogo.placar || '').includes('vs') ? 'score-time' : ''}`}>
                  {jogo.placar}
                </div>

                {/* Time Fora */}
                <div className="team-block">
                  <img src={jogo.away_logo} className="team-logo-match" onError={e=>e.target.style.display='none'} alt=""/>
                  <span className="team-name-pro">{jogo.away || jogo.time_fora}</span>
                  {viewMode === 'last' && <MatchScorers gameId={jogo.id} lado="away"/>}
                </div>
              </div>

              {/* FOOTER (LOCAL E BOTÕES) */}
              <div className="pro-card-footer">
                <div className="location-data">
                  <span>🏟️ {jogo.estadio}</span>
                  <span>📍 {jogo.cidade || 'Local a definir'}</span>
                </div>
                <div>
                  {viewMode === 'next' ? (
                    <a href={`http://googleusercontent.com/google.com/travel/flights?q=Flights+to+${jogo.cidade}`} 
                       target="_blank" rel="noreferrer" className="btn-action-pro btn-travel-pro">
                      ✈️ Ver Voos
                    </a>
                  ) : jogo.salvo && (
                    <button className="btn-action-pro btn-remove-pro" onClick={() => toggleDiario(jogo)}>
                      🗑️ Esquecer
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// 2. TELA DE LOGIN
// =============================================================================
const AuthScreen = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', city: 'São Paulo' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const endpoint = isRegister ? '/register' : '/login'
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (res.ok) {
        onLogin(data.token, data.user)
      } else {
        setError(data.error || 'Erro ao conectar')
      }
    } catch (err) { setError('Erro: Backend Node.js não respondeu.') }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="app-title" style={{fontSize: '2rem', marginBottom: '10px'}}>
           <span className="css-eye-icon"></span> De Olho No Jogo
        </h1>
        <h2 style={{color:'white', marginBottom:'20px'}}>{isRegister ? 'Criar Conta' : 'Acesse sua conta'}</h2>
        
        {error && <div style={{background:'rgba(239,68,68,0.2)', color:'#fca5a5', padding:'10px', borderRadius:'8px', marginBottom:'15px'}}>{error}</div>}

        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          {isRegister && (
            <>
              <input type="text" placeholder="Nome" className="search-input" required 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}/>
              <input type="text" placeholder="Cidade" className="search-input" required 
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}/>
            </>
          )}
          <input type="email" placeholder="E-mail" className="search-input" required 
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}/>
          <input type="password" placeholder="Senha" className="search-input" required 
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}/>

          <button type="submit" className="btn-primary-gradient" style={{width:'100%', padding:'12px', marginTop:'10px'}} disabled={loading}>
            {loading ? '...' : (isRegister ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>
        <p style={{color:'#94a3b8', marginTop:'20px', cursor:'pointer'}} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Já tenho conta' : 'Criar conta nova'}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// 3. APP PRINCIPAL
// =============================================================================
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  
  // Estados da Interface
  const [activeTab, setActiveTab] = useState('search') // search, diary, db
  const [busca, setBusca] = useState('Corinthians')
  const [jogos, setJogos] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('next') // next, last
  const [errorMsg, setErrorMsg] = useState('')

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setToken(null); setUser(null);
  }

  // --- BUSCA DE JOGOS ---
  const buscarJogos = async () => {
    setLoading(true); setErrorMsg('');
    try {
      // Tenta buscar no endpoint de jogos do Node.js
      // IMPORTANTE: Como seu backend Node.js é novo, ele pode não ter a rota de busca exata ainda.
      // Estou ajustando para chamar /games que você mostrou que existe.
      const res = await fetch(`${API_URL}/games`); 
      
      if (!res.ok) throw new Error('Erro ao buscar jogos no servidor');
      
      const todosJogos = await res.json();
      
      // Filtro simples no front-end já que o backend retorna tudo (SELECT *)
      const jogosFiltrados = todosJogos.filter(j => 
        (j.home || j.time_casa || '').toLowerCase().includes(busca.toLowerCase()) ||
        (j.away || j.time_fora || '').toLowerCase().includes(busca.toLowerCase())
      );

      if (jogosFiltrados.length === 0) setErrorMsg('Nenhum jogo encontrado para este time.');
      setJogos(jogosFiltrados);

    } catch (err) {
      console.error(err);
      setErrorMsg('Erro: Verifique se o Backend Node está rodando e se a rota /games existe.');
    }
    setLoading(false);
  }

  // Se não estiver logado, exibe Login
  if (!token) return <AuthScreen onLogin={(t, u) => {
    localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u));
    setToken(t); setUser(u);
  }} />

  // Se logado, exibe App Principal
  return (
    <div className="app-container">
      <header className="main-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <div style={{background:'var(--primary)', width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
               {user?.name?.charAt(0)}
             </div>
             <div style={{textAlign:'left'}}>
               <div style={{fontWeight:'bold'}}>{user?.name}</div>
               <div style={{fontSize:'0.8rem', color:'var(--text-dim)'}}>📍 {user?.city}</div>
             </div>
           </div>
           <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'8px 16px', borderRadius:'8px', cursor:'pointer'}}>Sair</button>
        </div>

        <h1 className="app-title"><span className="css-eye-icon"></span> De Olho No Jogo</h1>
        
        <div className="nav-tabs">
          <button className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>🔍 Explorar</button>
          <button className={`nav-btn ${activeTab === 'diary' ? 'active' : ''}`} onClick={() => setActiveTab('diary')}>📓 Diário</button>
          <button className={`nav-btn ${activeTab === 'db' ? 'active' : ''}`} onClick={() => setActiveTab('db')}>📊 Dados</button>
        </div>
      </header>

      {/* --- ABA EXPLORAR --- */}
      {activeTab === 'search' && (
        <>
          <div className="search-bar-enhanced">
            <input type="text" className="search-input" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Digite o time..." onKeyDown={e => e.key === 'Enter' && buscarJogos()} />
            <button className="btn-primary-gradient" onClick={buscarJogos}>{loading ? '...' : 'Buscar'}</button>
          </div>

          {errorMsg && <div style={{textAlign:'center', color:'#fca5a5', marginTop:'20px'}}>{errorMsg}</div>}

          {jogos.length > 0 && (
            <>
              <div className="view-switcher-container">
                 <button className={`toggle-view-btn active-next`}>Jogos Encontrados ({jogos.length})</button>
              </div>
              
              {/* Renderiza lista de jogos */}
              <div className="year-content-enhanced">
                {jogos.map(jogo => (
                   <div key={jogo.id || Math.random()} className="game-card-pro future">
                      <div className="pro-matchup-grid">
                        <div className="team-block"><span className="team-name-pro">{jogo.time_casa || jogo.home}</span></div>
                        <div className="score-box-pro">{jogo.placar || 'vs'}</div>
                        <div className="team-block"><span className="team-name-pro">{jogo.time_fora || jogo.away}</span></div>
                      </div>
                      <div className="pro-card-footer">
                        <span>🏟️ {jogo.estadio}</span>
                        <span>📅 {jogo.data}</span>
                      </div>
                   </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* --- ABA DADOS (CLUBES) --- */}
      {activeTab === 'db' && (
        <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>
          <h3>Banco de Dados de Clubes</h3>
          <p>Conecte a rota /api/clubes no Node.js para ver a tabela aqui.</p>
        </div>
      )}

      {/* --- ABA DIÁRIO --- */}
      {activeTab === 'diary' && (
        <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>
          <h3>Seu Diário de Viagens</h3>
          <p>Nenhum jogo salvo ainda.</p>
        </div>
      )}

    </div>
  )
}

export default App