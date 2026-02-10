const express = require('express');
const authController = require('../controllers/authController');
const gamesController = require('../controllers/gamesController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ========================================
// Rotas de Autenticação (Públicas)
// ========================================
router.post('/auth/register', authController.register.bind(authController));
router.post('/auth/login', authController.login.bind(authController));

// Rotas de perfil (Protegidas)
router.get('/auth/me', authMiddleware, authController.getProfile.bind(authController));
router.put('/auth/profile', authMiddleware, authController.updateProfile.bind(authController));

// ========================================
// Rotas de Jogos
// ========================================
// Buscar jogos de um time (público, mas melhor com auth para personalização)
router.get('/games/:teamName', optionalAuth, gamesController.getTeamGames.bind(gamesController));

// Informações de viagem (requer autenticação para saber cidade do usuário)
router.get('/games/:gameId/travel', authMiddleware, gamesController.getTravelInfo.bind(gamesController));

// ========================================
// Rotas de Diário (Protegidas)
// ========================================
// Listar diário do usuário
router.get('/diary', authMiddleware, gamesController.getUserDiary.bind(gamesController));

// Salvar jogo no diário
router.post('/games/:gameId/save', authMiddleware, gamesController.saveGameToDiary.bind(gamesController));

// Remover jogo do diário
router.delete('/games/:gameId/diary', authMiddleware, gamesController.removeFromDiary.bind(gamesController));

// ========================================
// Rotas Auxiliares
// ========================================
// Buscar cidades disponíveis (para autocomplete)
router.get('/cities', async (req, res) => {
    try {
        const database = require('../database/db');
        const { search } = req.query;

        let query = 'SELECT DISTINCT city, state, iata_code FROM iata_codes';
        let params = [];

        if (search) {
            query += ' WHERE city LIKE ? ORDER BY city ASC LIMIT 20';
            params = [`${search}%`];
        } else {
            query += ' ORDER BY city ASC LIMIT 50';
        }

        const cities = await database.all(query, params);
        res.json({ cities });
    } catch (error) {
        console.error('Erro ao buscar cidades:', error);
        res.status(500).json({ error: 'Erro ao buscar cidades' });
    }
});

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
