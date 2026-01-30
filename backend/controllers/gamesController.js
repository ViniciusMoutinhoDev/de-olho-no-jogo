const database = require('../database/db');
const FootballScraper = require('../services/scraper');
const flightService = require('../services/flightService');

class GamesController {
    constructor() {
        this.scraper = new FootballScraper();
    }

    /**
     * Busca ou cria um time no banco de dados
     */
    async findOrCreateTeam(teamName) {
        const slug = teamName.toLowerCase().replace(/\s+/g, '-');
        
        let team = await database.get(
            'SELECT * FROM teams WHERE slug = ?',
            [slug]
        );

        if (!team) {
            const result = await database.run(
                'INSERT INTO teams (name, slug) VALUES (?, ?)',
                [teamName, slug]
            );
            
            team = await database.get(
                'SELECT * FROM teams WHERE id = ?',
                [result.id]
            );
        }

        return team;
    }

    /**
     * Salva os jogos no banco de dados
     */
    async saveGames(teamId, games, status = 'upcoming') {
        const savedGames = [];

        for (const game of games) {
            try {
                // Extrair informações
                const opponent = status === 'upcoming' 
                    ? (game.homeTeam === game.teamName ? game.awayTeam : game.homeTeam)
                    : game.opponent;

                const location = game.venue || game.location;
                const city = this.extractCityFromVenue(location);

                // Verificar se o jogo já existe
                const existing = await database.get(
                    `SELECT * FROM games 
                     WHERE team_id = ? AND date = ? AND opponent = ?`,
                    [teamId, game.date, opponent]
                );

                if (existing) {
                    // Atualizar jogo existente
                    await database.run(
                        `UPDATE games 
                         SET time = ?, location = ?, city = ?, competition = ?, 
                             score = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ?`,
                        [game.time, location, city, game.competition, game.score, status, existing.id]
                    );
                    savedGames.push({ ...existing, ...game });
                } else {
                    // Inserir novo jogo
                    const result = await database.run(
                        `INSERT INTO games 
                         (team_id, opponent, date, time, location, city, competition, status, score)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [teamId, opponent, game.date, game.time, location, city, 
                         game.competition, status, game.score]
                    );

                    const newGame = await database.get(
                        'SELECT * FROM games WHERE id = ?',
                        [result.id]
                    );
                    savedGames.push(newGame);
                }
            } catch (error) {
                console.error('Erro ao salvar jogo:', error);
            }
        }

        return savedGames;
    }

    /**
     * Extrai a cidade do nome do estádio/local
     */
    extractCityFromVenue(venue) {
        if (!venue) return null;

        // Remover "Estádio", "Arena", etc.
        let city = venue
            .replace(/Estádio|Arena|Stadium/gi, '')
            .trim();

        // Pegar última parte após vírgula ou hífen
        const parts = city.split(/[,\-]/);
        if (parts.length > 1) {
            city = parts[parts.length - 1].trim();
        }

        return city;
    }

    /**
     * GET /api/games/:teamName
     * Busca jogos de um time (com scraping se necessário)
     */
    async getTeamGames(req, res) {
        try {
            const { teamName } = req.params;
            const { refresh } = req.query; // ?refresh=true para forçar scraping

            // Buscar ou criar o time
            const team = await this.findOrCreateTeam(teamName);

            // Verificar se já temos jogos recentes no banco
            const existingGames = await database.all(
                `SELECT * FROM games 
                 WHERE team_id = ? 
                 ORDER BY date ASC`,
                [team.id]
            );

            // Se não há jogos ou o usuário quer atualizar, fazer scraping
            if (existingGames.length === 0 || refresh === 'true') {
                console.log(`🔍 Fazendo scraping de jogos para ${teamName}...`);
                
                const scrapedData = await this.scraper.scrapeTeamGames(teamName);
                
                // Normalizar dados
                const upcomingNormalized = scrapedData.upcoming.map(game => ({
                    ...game,
                    date: this.scraper.normalizeDate(game.date, game.time),
                    teamName: teamName
                }));

                const pastNormalized = scrapedData.past.map(game => ({
                    ...game,
                    date: this.scraper.normalizeDate(game.date, game.time),
                    teamName: teamName,
                    opponent: game.homeTeam === teamName ? game.awayTeam : game.homeTeam
                }));

                // Salvar no banco
                await this.saveGames(team.id, upcomingNormalized, 'upcoming');
                await this.saveGames(team.id, pastNormalized, 'past');

                // Buscar jogos atualizados do banco
                const updatedGames = await database.all(
                    `SELECT * FROM games 
                     WHERE team_id = ? 
                     ORDER BY date ASC`,
                    [team.id]
                );

                return res.json({
                    team,
                    games: {
                        upcoming: updatedGames.filter(g => g.status === 'upcoming'),
                        past: updatedGames.filter(g => g.status === 'past')
                    },
                    source: 'scraper'
                });
            }

            // Retornar jogos do banco de dados
            res.json({
                team,
                games: {
                    upcoming: existingGames.filter(g => g.status === 'upcoming'),
                    past: existingGames.filter(g => g.status === 'past')
                },
                source: 'database'
            });

        } catch (error) {
            console.error('Erro ao buscar jogos:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar jogos',
                message: error.message 
            });
        }
    }

    /**
     * GET /api/games/:gameId/travel
     * Obtém informações de viagem para um jogo específico
     */
    async getTravelInfo(req, res) {
        try {
            const { gameId } = req.params;
            const userId = req.user?.id; // Assumindo middleware de autenticação

            // Buscar informações do jogo
            const game = await database.get(
                'SELECT * FROM games WHERE id = ?',
                [gameId]
            );

            if (!game) {
                return res.status(404).json({ error: 'Jogo não encontrado' });
            }

            // Buscar cidade do usuário
            const user = await database.get(
                'SELECT city FROM users WHERE id = ?',
                [userId]
            );

            if (!user || !user.city) {
                return res.status(400).json({ 
                    error: 'Cidade do usuário não configurada',
                    message: 'Configure sua cidade no perfil para ver informações de viagem'
                });
            }

            // Gerar informações de viagem
            const travelInfo = await flightService.generateTravelInfo(
                user.city,
                game.city,
                game.date
            );

            res.json({
                game,
                travel: travelInfo
            });

        } catch (error) {
            console.error('Erro ao buscar informações de viagem:', error);
            res.status(500).json({ 
                error: 'Erro ao gerar informações de viagem',
                message: error.message 
            });
        }
    }

    /**
     * POST /api/games/:gameId/save
     * Salva um jogo no diário do usuário
     */
    async saveGameToDiary(req, res) {
        try {
            const { gameId } = req.params;
            const userId = req.user?.id;
            const { watched, notes, rating } = req.body;

            // Verificar se já está salvo
            const existing = await database.get(
                'SELECT * FROM user_games WHERE user_id = ? AND game_id = ?',
                [userId, gameId]
            );

            if (existing) {
                // Atualizar
                await database.run(
                    `UPDATE user_games 
                     SET watched = ?, notes = ?, rating = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [watched || false, notes || null, rating || null, existing.id]
                );

                return res.json({ 
                    message: 'Jogo atualizado no diário',
                    updated: true 
                });
            }

            // Inserir novo
            await database.run(
                `INSERT INTO user_games (user_id, game_id, watched, notes, rating)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, gameId, watched || false, notes || null, rating || null]
            );

            res.json({ 
                message: 'Jogo salvo no diário',
                created: true 
            });

        } catch (error) {
            console.error('Erro ao salvar jogo:', error);
            res.status(500).json({ 
                error: 'Erro ao salvar jogo',
                message: error.message 
            });
        }
    }

    /**
     * GET /api/diary
     * Retorna o diário do usuário (jogos salvos)
     */
    async getUserDiary(req, res) {
        try {
            const userId = req.user?.id;

            const diaryGames = await database.all(
                `SELECT 
                    g.*, 
                    ug.watched, 
                    ug.notes, 
                    ug.rating,
                    ug.created_at as saved_at,
                    t.name as team_name
                 FROM user_games ug
                 JOIN games g ON g.id = ug.game_id
                 JOIN teams t ON t.id = g.team_id
                 WHERE ug.user_id = ?
                 ORDER BY g.date DESC`,
                [userId]
            );

            res.json({
                diary: diaryGames,
                total: diaryGames.length,
                watched: diaryGames.filter(g => g.watched).length
            });

        } catch (error) {
            console.error('Erro ao buscar diário:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar diário',
                message: error.message 
            });
        }
    }

    /**
     * DELETE /api/games/:gameId/diary
     * Remove um jogo do diário
     */
    async removeFromDiary(req, res) {
        try {
            const { gameId } = req.params;
            const userId = req.user?.id;

            await database.run(
                'DELETE FROM user_games WHERE user_id = ? AND game_id = ?',
                [userId, gameId]
            );

            res.json({ 
                message: 'Jogo removido do diário',
                deleted: true 
            });

        } catch (error) {
            console.error('Erro ao remover jogo:', error);
            res.status(500).json({ 
                error: 'Erro ao remover jogo',
                message: error.message 
            });
        }
    }
}

module.exports = new GamesController();