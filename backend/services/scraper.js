const puppeteer = require('puppeteer');

class FootballScraper {
    constructor() {
        this.browser = null;
    }

    async initialize() {
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * Busca jogos do time no Google (resultados + próximos jogos)
     * @param {string} teamName - Nome do time
     * @returns {Promise<{upcoming: Array, past: Array}>}
     */
    async scrapeTeamGames(teamName) {
        if (!this.browser) await this.initialize();

        const page = await this.browser.newPage();
        
        try {
            // Buscar no Google por "próximos jogos [time]"
            const searchUrl = `https://www.google.com/search?q=próximos+jogos+${encodeURIComponent(teamName)}`;
            
            await page.goto(searchUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Extrair dados do widget de jogos do Google
            const games = await page.evaluate(() => {
                const results = { upcoming: [], past: [] };

                // Seletores para o widget do Google Sports
                const gameElements = document.querySelectorAll('[data-entityname]');
                
                gameElements.forEach(element => {
                    try {
                        const dateElement = element.querySelector('[data-date]');
                        const teams = element.querySelectorAll('[data-team]');
                        const scoreElements = element.querySelectorAll('.imso_mh__score');
                        const venueElement = element.querySelector('[data-venue]');
                        const competitionElement = element.querySelector('.imso_mh__comp-meta');

                        if (teams.length >= 2) {
                            const game = {
                                homeTeam: teams[0]?.textContent?.trim() || '',
                                awayTeam: teams[1]?.textContent?.trim() || '',
                                date: dateElement?.getAttribute('data-date') || '',
                                time: dateElement?.textContent?.trim() || '',
                                venue: venueElement?.textContent?.trim() || '',
                                competition: competitionElement?.textContent?.trim() || '',
                                score: scoreElements.length >= 2 
                                    ? `${scoreElements[0].textContent} x ${scoreElements[1].textContent}`
                                    : null
                            };

                            // Se tem placar, é jogo passado
                            if (game.score && game.score !== ' x ') {
                                results.past.push(game);
                            } else {
                                results.upcoming.push(game);
                            }
                        }
                    } catch (err) {
                        console.error('Erro ao processar elemento:', err);
                    }
                });

                return results;
            });

            // Se não encontrou pelo widget, tentar método alternativo
            if (games.upcoming.length === 0 && games.past.length === 0) {
                console.log('Widget do Google não encontrado, tentando método alternativo...');
                return await this.scrapeFromAlternativeSource(teamName, page);
            }

            return games;

        } catch (error) {
            console.error('Erro no scraping:', error);
            throw error;
        } finally {
            await page.close();
        }
    }

    /**
     * Método alternativo: buscar dados do site oficial ou API pública
     */
    async scrapeFromAlternativeSource(teamName, page) {
        // Aqui você pode implementar lógica para buscar de outras fontes
        // Por exemplo: site oficial do time, Transfermarkt, etc.
        
        try {
            // Exemplo: buscar no site da CBF ou Transfermarkt
            const searchUrl = `https://www.transfermarkt.com.br/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(teamName)}`;
            
            await page.goto(searchUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Implementar lógica de scraping específica
            // Este é um placeholder - você precisará adaptar aos seletores reais
            
            return { upcoming: [], past: [] };
        } catch (error) {
            console.error('Erro no método alternativo:', error);
            return { upcoming: [], past: [] };
        }
    }

    /**
     * Extrai a cidade/localização do jogo
     */
    extractLocation(venue) {
        if (!venue) return null;

        // Padrões comuns: "Estádio X, Cidade" ou "Arena Y - Cidade"
        const patterns = [
            /,\s*([^,]+)$/,  // Última parte após vírgula
            /-\s*([^-]+)$/,  // Última parte após hífen
        ];

        for (const pattern of patterns) {
            const match = venue.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return venue;
    }

    /**
     * Normaliza a data do formato do Google para ISO
     */
    normalizeDate(dateStr, timeStr) {
        try {
            // Implementar lógica de conversão de data
            // Ex: "dom, 2 fev" -> "2025-02-02"
            
            const months = {
                'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
                'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
                'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
            };

            // Extrair dia e mês
            const match = dateStr.match(/(\d+)\s+(\w+)/);
            if (match) {
                const day = match[1].padStart(2, '0');
                const month = months[match[2].toLowerCase()] || '01';
                const year = new Date().getFullYear();
                
                return `${year}-${month}-${day}`;
            }

            return dateStr;
        } catch (error) {
            console.error('Erro ao normalizar data:', error);
            return dateStr;
        }
    }
}

module.exports = FootballScraper;
