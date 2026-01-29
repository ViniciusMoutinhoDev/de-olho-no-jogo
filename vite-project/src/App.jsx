import { useEffect, useState } from 'react'

function App() {
  const [mensagem, setMensagem] = useState("Carregando...")

  useEffect(() => {
    fetch('/api/test')
      .then(res => res.text())
      .then(data => setMensagem(data))
      .catch(() => setMensagem("Erro ao conectar com backend"))
  }, [])

  return (
    <div>
      <h1>Conexão Backend</h1>
      <p>{mensagem}</p>
    </div>
  )
}

export default App
