const express = require('express');
const cors = require('cors');
const database = require('./database/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// Middlewares
// ========================================
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ========================================
// Rotas da API
// ========================================
app.use('/api', apiRoutes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        name: 'De Olho No Jogo API',
        version: '2.0.0',
        status: 'running',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/me',
                updateProfile: 'PUT /api/auth/profile'
            },
            games: {
                getTeamGames: 'GET /api/games/:teamName',
                getTravelInfo: 'GET /api/games/:gameId/travel',
                saveGame: 'POST /api/games/:gameId/save',
                removeGame: 'DELETE /api/games/:gameId/diary'
            },
            diary: {
                getUserDiary: 'GET /api/diary'
            },
            utils: {
                cities: 'GET /api/cities?search=term',
                health: 'GET /api/health'
            }
        }
    });
});

// ========================================
// Error Handling
// ========================================
// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.path,
        method: req.method
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    
    res.status(err.status || 500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========================================
// Inicialização do Servidor
// ========================================
async function startServer() {
    try {
        // Inicializar banco de dados
        console.log('🔄 Inicializando banco de dados...');
        await database.initialize();
        console.log('✅ Banco de dados inicializado');

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════');
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
            console.log(`🌐 API: http://localhost:${PORT}/api`);
            console.log('═══════════════════════════════════════════════');
            console.log('');
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 Encerrando servidor graciosamente...');
    try {
        await database.close();
        console.log('✅ Banco de dados fechado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao fechar servidor:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('\n📴 Interrupção detectada (Ctrl+C)...');
    try {
        await database.close();
        console.log('✅ Servidor encerrado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao fechar servidor:', error);
        process.exit(1);
    }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Rejeição não tratada em:', promise);
    console.error('Motivo:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exceção não capturada:', error);
    process.exit(1);
});

// Iniciar
startServer();

module.exports = app;
