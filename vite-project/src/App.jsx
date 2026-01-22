import { useState, useEffect } from 'react'
import './App.css'

const API_URL = "http://127.0.0.1:5000/api"

// --- COMPONENTE DE LOGIN ---
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
        setError(data.error || 'Erro desconhecido')
      }
    } catch (err) { setError('Erro de conexão com o servidor') }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="app-title" style={{fontSize: '2rem', marginBottom: '10px'}}>⚽ Futebol Travel</h1>
        <h2 style={{color:'white', marginBottom:'20px'}}>{isRegister ? 'Criar Conta' : 'Bem-vindo de volta'}</h2>
        
        {error && <div style={{background:'rgba(239, 68, 68, 0.2)', color:'#fca5a5', padding:'10px', borderRadius:'8px', marginBottom:'15px', fontSize:'0.9rem'}}>{error}</div>}

        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          {isRegister && (
            <>
              <input type="text" placeholder="Seu Nome" className="search-input" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}} 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input type="text" placeholder="Sua Cidade (Ex: Rio de Janeiro)" className="search-input" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}} 
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
            </>
          )}
          <input type="email" placeholder="E-mail" className="search-input" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}} 
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input type="password" placeholder="Senha" className="search-input" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}} 
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />

          <button type="submit" className="btn-primary-gradient" style={{width:'100%', padding:'12px', marginTop:'10px'}} disabled={loading}>
            {loading ? 'Carregando...' : (isRegister ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <p style={{color:'#94a3b8', marginTop:'20px', fontSize:'0.9rem', cursor:'pointer'}} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Já tem conta? Faça login.' : 'Não tem conta? Cadastre-se grátis.'}
        </p>
      </div>
    </div>
  )
}

// --- MICRO-COMPONENTES (Gols, etc) ---
const MatchScorers = ({ gameId, lado }) => {
  const [gols, setGols] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true; const fetchGols = async () => { try { const res = await fetch(`${API_URL}/detalhes?id=${gameId}`); const data = await res.json(); if (mounted && Array.isArray(data)) setGols(data.filter(g => g.lado === lado)); } catch(e){} finally{if(mounted) setLoading(false)}}; fetchGols(); return () => { mounted = false }
  }, [gameId, lado])
  if (loading || gols.length === 0) return null
  return <div className="scorers-list">{gols.map((g, i) => <div key={i} className="scorer-item">⚽ {g.jogador} <span className="goal-time">{g.minuto}'</span></div>)}</div>
}

const YearSectionPro = ({ ano, jogos, viewMode, toggleDiario, defaultOpen }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="year-accordion-enhanced">
      <button className={`year-header-enhanced ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span>📅 Temporada {ano}</span>
        <span style={{background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'12px', fontSize:'0.8rem'}}>{jogos.length} jogos</span>
      </button>
      {isOpen && (
        <div className="year-content-enhanced">
          {jogos.map(jogo => (
            <div key={jogo.id} className={`game-card-pro ${viewMode === 'next' ? 'future' : ''} ${jogo.salvo ? 'saved' : ''}`}>
              <div className="pro-card-header">
                <span>{jogo.data_fmt} • {jogo.torneio}</span>
                {jogo.salvo && <span className="saved-badge">✅ SALVO</span>}
                {!jogo.salvo && viewMode === 'last' && <button className="btn-save-pro btn-action-pro" onClick={() => toggleDiario(jogo)} style={{padding:'4px 10px', fontSize:'0.75rem'}}>+ Salvar</button>}
              </div>
              <div className="pro-matchup-grid">
                <div className="team-block"><img src={jogo.home_logo} className="team-logo-match" onError={e=>e.target.style.display='none'}/><span className="team-name-pro">{jogo.home}</span>{viewMode === 'last' && <MatchScorers gameId={jogo.id} lado="home"/>}</div>
                <div className={`score-box-pro ${viewMode === 'next' && jogo.placar.includes('vs') ? 'score-time' : ''}`}>{viewMode === 'next' && jogo.placar.includes('vs') ? new Date(jogo.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : jogo.placar}</div>
                <div className="team-block"><img src={jogo.away_logo} className="team-logo-match" onError={e=>e.target.style.display='none'}/><span className="team-name-pro">{jogo.away}</span>{viewMode === 'last' && <MatchScorers gameId={jogo.id} lado="away"/>}</div>
              </div>
              <div className="pro-card-footer">
                <div className="location-data"><span>🏟️ {jogo.estadio}</span><span>📍 {jogo.cidade}</span>{viewMode === 'next' && jogo.logistica && <div className="logistics-info">🚗 {jogo.logistica.distancia}km • R$ {jogo.logistica.custo_estimado?.toFixed(0)} est.</div>}</div>
                <div>{viewMode === 'next' ? <a href={`http://googleusercontent.com/google.com/travel/flights?q=Flights+to+${jogo.cidade}`} target="_blank" className="btn-action-pro btn-travel-pro">✈️ Ver Voos</a> : jogo.salvo && <button className="btn-action-pro btn-remove-pro" onClick={() => toggleDiario(jogo)}>🗑️ Esquecer</button>}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- APP PRINCIPAL ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  
  const [activeTab, setActiveTab] = useState('search') 
  const [busca, setBusca] = useState('Corinthians')
  const [timeAtual, setTimeAtual] = useState(null)
  const [jogos, setJogos] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingBackground, setLoadingBackground] = useState(false)
  const [viewMode, setViewMode] = useState('next') 
  const [diario, setDiario] = useState([])
  const [bancoClubes, setBancoClubes] = useState([])

  // Login Handler
  const handleLogin = (newToken, userData) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(newToken)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setDiario([]) // Limpa dados da memória
    setJogos([])
    setTimeAtual(null)
  }

  // Requisições autenticadas
  const authFetch = async (endpoint, options = {}) => {
    const headers = { ...options.headers, 'Authorization': `Bearer ${token}` }
    return fetch(`${API_URL}${endpoint}`, { ...options, headers })
  }

  const buscarTime = async () => {
    if (!busca) return; setLoading(true);
    try {
      const res = await fetch(`${API_URL}/buscar-time?nome=${busca}`);
      const data = await res.json();
      if (data.error) { alert("Time não encontrado!"); } else { setTimeAtual(data); carregarJogos(data.id, 'next'); }
    } catch (e) { console.error(e); } setLoading(false);
  }

  const carregarJogos = async (id, tipo) => {
    setViewMode(tipo); setLoading(true);
    const origem = user?.city || 'São Paulo' // Usa a cidade do usuário
    try {
      const resRapida = await authFetch(`/jogos?id=${id}&tipo=${tipo}&origem=${origem}&partial=true`);
      const dadosRapidos = await resRapida.json();
      setJogos(dadosRapidos); setLoading(false);
      
      if (tipo === 'last') {
        setLoadingBackground(true);
        const resCompleta = await authFetch(`/jogos?id=${id}&tipo=${tipo}&origem=${origem}&partial=false`);
        const dadosCompletos = await resCompleta.json();
        setJogos(dadosCompletos); setLoadingBackground(false);
      }
    } catch (e) { console.error(e); setLoading(false); setLoadingBackground(false); }
  }

  const carregarDiario = async () => { try { const res = await authFetch(`/diario`); setDiario(await res.json()); } catch(e) {} }
  const carregarBanco = async () => { try { const res = await fetch(`${API_URL}/clubes`); setBancoClubes(await res.json()); } catch(e) {} }

  const toggleDiario = async (jogo) => {
    try {
      if (jogo.salvo) await authFetch(`/diario?id=${jogo.id || jogo.id_jogo_sofascore}`, { method: 'DELETE' });
      else await authFetch(`/diario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jogo) });
      if (activeTab === 'diary') carregarDiario(); 
      else if (timeAtual) setJogos(prev => prev.map(j => j.id === jogo.id ? {...j, salvo: !j.salvo} : j));
    } catch (e) {}
  }

  useEffect(() => { 
    if (token) {
       if (activeTab === 'diary') carregarDiario(); 
       if (activeTab === 'db') carregarBanco(); 
    }
  }, [activeTab, token])

  // Se não tiver token, mostra LOGIN
  if (!token) return <AuthScreen onLogin={handleLogin} />

  // Se tiver token, mostra APP
  return (
    <div className="app-container">
      <header className="main-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <div style={{background:'var(--primary)', width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>{user?.name.charAt(0)}</div>
             <div style={{textAlign:'left'}}>
               <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{user?.name}</div>
               <div style={{fontSize:'0.8rem', color:'var(--text-dim)'}}>📍 {user?.city}</div>
             </div>
           </div>
           <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'8px 16px', borderRadius:'8px', cursor:'pointer'}}>Sair</button>
        </div>

        <h1 className="app-title">⚽ Futebol Travel Pro</h1>
        <div className="nav-tabs">
          <button className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>🔍 Explorar</button>
          <button className={`nav-btn ${activeTab === 'diary' ? 'active' : ''}`} onClick={() => setActiveTab('diary')}>📓 Diário</button>
          <button className={`nav-btn ${activeTab === 'db' ? 'active' : ''}`} onClick={() => setActiveTab('db')}>📊 Dados</button>
        </div>
      </header>

      {activeTab === 'search' && (
        <>
          <div className="search-bar-enhanced">
            <input type="text" className="search-input" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o time..." onKeyDown={(e) => e.key === 'Enter' && buscarTime()} />
            <button className="btn-primary-gradient" onClick={buscarTime} disabled={loading}>{loading ? '...' : 'Buscar'}</button>
          </div>
          {timeAtual && (
            <>
              <div className="team-highlight-card" style={{ '--team-color': timeAtual.cor }}>
                <img src={timeAtual.logo} className="team-logo-large" />
                <div><h2>{timeAtual.nome}</h2><div style={{display:'flex', gap:'10px', color:'rgba(255,255,255,0.8)'}}><span>ID: {timeAtual.id}</span> • <span>{timeAtual.pais}</span></div></div>
              </div>
              <div className="view-switcher-container">
                <button onClick={() => carregarJogos(timeAtual.id, 'next')} className={`toggle-view-btn ${viewMode === 'next' ? 'active-next' : ''}`}>📅 Próximos</button>
                <button onClick={() => carregarJogos(timeAtual.id, 'last')} className={`toggle-view-btn ${viewMode === 'last' ? 'active-last' : ''}`}>📜 Histórico</button>
              </div>
              {loading ? <div style={{textAlign:'center', color:'white', padding:'40px'}}><h2>⚡</h2><p>Sincronizando...</p></div> : 
                 (jogos.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.7)'}}>🍃 Nenhum jogo.</div> : 
                  (() => {
                    const grupos = jogos.reduce((acc, j) => { const a = new Date(j.timestamp*1000).getFullYear(); if(!acc[a])acc[a]=[]; acc[a].push(j); return acc }, {});
                    const anos = Object.keys(grupos).sort((a,b) => viewMode==='last' ? b-a : a-b);
                    return <>{anos.map((a, i) => <YearSectionPro key={a} ano={a} jogos={grupos[a]} viewMode={viewMode} toggleDiario={toggleDiario} defaultOpen={i===0} />)}
                           {loadingBackground && <div style={{textAlign:'center', padding:'15px', color:'#94a3b8', background:'rgba(30,41,59,0.5)', borderRadius:'12px', marginTop:'20px'}}>⏳ Carregando histórico completo...</div>}</>
                  })()
                 )
              }
            </>
          )}
        </>
      )}

      {activeTab === 'diary' && (
        <div>
           <h2 style={{color:'white', marginBottom:'20px', textAlign:'center'}}>🏆 Diário de {user?.name} ({diario.length})</h2>
           {diario.map(jogo => (
             <div key={jogo.id_jogo_sofascore} className="game-card-pro saved">
                 <div className="pro-card-header"><span>{jogo.data_jogo} • {jogo.torneio}</span><button className="btn-remove-pro btn-action-pro" onClick={() => toggleDiario({ id: jogo.id_jogo_sofascore, salvo: true })}>🗑️ Remover</button></div>
                 <div className="pro-matchup-grid">
                    <div className="team-block"><img src={jogo.home_logo} className="team-logo-match"/><span>{jogo.match_name.split(' x ')[0]}</span></div>
                    <div className="score-box-pro">{jogo.placar}</div>
                    <div className="team-block"><img src={jogo.away_logo} className="team-logo-match"/><span>{jogo.match_name.split(' x ')[1]}</span></div>
                 </div>
                 <div className="pro-card-footer"><div className="location-data"><span>🏟️ {jogo.estadio}</span><span>📍 {jogo.cidade}</span></div></div>
             </div>
           ))}
        </div>
      )}
      
      {activeTab === 'db' && <div className="table-container"><table className="pro-table"><thead><tr><th>ID</th><th>Clube</th><th>País</th><th>Estádio</th></tr></thead><tbody>{bancoClubes.map(c => (<tr key={c.id}><td>{c.id}</td><td>{c.nome}</td><td>{c.pais}</td><td>{c.estadio}</td></tr>))}</tbody></table></div>}
    </div>
  )
}

export default App