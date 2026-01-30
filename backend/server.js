const express = require('express');
const cors = require('cors');

// Importa rotas
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const clubsRoutes = require('./routes/clubs'); // <--- Nova rota
const setupRoutes = require('./routes/setup'); // <--- Nova rota

const app = express();
app.use(cors());
app.use(express.json());

// Registra as rotas
app.use('/api', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/clubes', clubsRoutes); // <--- Liga a aba Dados
app.use('/api/setup', setupRoutes);   // <--- Liga o gerador de dados

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend Node rodando em http://localhost:${PORT}`);
});