const database = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui-mudar-em-producao';
const SALT_ROUNDS = 10;

class AuthController {
    /**
     * POST /api/auth/register
     * Registra um novo usuário
     */
    async register(req, res) {
        try {
            const { username, password, email, city } = req.body;

            // Validações
            if (!username || !password) {
                return res.status(400).json({ 
                    error: 'Username e senha são obrigatórios' 
                });
            }

            // Verificar se usuário já existe
            const existing = await database.get(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

            if (existing) {
                return res.status(409).json({ 
                    error: 'Usuário já existe' 
                });
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            // Buscar IATA da cidade se fornecida
            let iataCode = null;
            if (city) {
                const cityData = await database.get(
                    'SELECT iata_code FROM iata_codes WHERE city = ? LIMIT 1',
                    [city]
                );
                iataCode = cityData?.iata_code;
            }

            // Criar usuário
            const result = await database.run(
                `INSERT INTO users (username, password, email, city, iata_code) 
                 VALUES (?, ?, ?, ?, ?)`,
                [username, hashedPassword, email, city, iataCode]
            );

            // Gerar token JWT
            const token = jwt.sign(
                { id: result.id, username },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                message: 'Usuário criado com sucesso',
                user: {
                    id: result.id,
                    username,
                    email,
                    city,
                    iataCode
                },
                token
            });

        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            res.status(500).json({ 
                error: 'Erro ao criar usuário',
                message: error.message 
            });
        }
    }

    /**
     * POST /api/auth/login
     * Autentica um usuário
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // Validações
            if (!username || !password) {
                return res.status(400).json({ 
                    error: 'Username e senha são obrigatórios' 
                });
            }

            // Buscar usuário
            const user = await database.get(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (!user) {
                return res.status(401).json({ 
                    error: 'Credenciais inválidas' 
                });
            }

            // Verificar senha
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json({ 
                    error: 'Credenciais inválidas' 
                });
            }

            // Gerar token JWT
            const token = jwt.sign(
                { id: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Não enviar a senha na resposta
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                message: 'Login realizado com sucesso',
                user: userWithoutPassword,
                token
            });

        } catch (error) {
            console.error('Erro ao fazer login:', error);
            res.status(500).json({ 
                error: 'Erro ao autenticar',
                message: error.message 
            });
        }
    }

    /**
     * GET /api/auth/me
     * Retorna os dados do usuário autenticado
     */
    async getProfile(req, res) {
        try {
            const userId = req.user?.id;

            const user = await database.get(
                'SELECT id, username, email, city, iata_code, created_at FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                return res.status(404).json({ 
                    error: 'Usuário não encontrado' 
                });
            }

            res.json({ user });

        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar perfil',
                message: error.message 
            });
        }
    }

    /**
     * PUT /api/auth/profile
     * Atualiza o perfil do usuário
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user?.id;
            const { email, city, password } = req.body;

            // Buscar IATA da cidade se alterada
            let iataCode = null;
            if (city) {
                const cityData = await database.get(
                    'SELECT iata_code FROM iata_codes WHERE city = ? LIMIT 1',
                    [city]
                );
                iataCode = cityData?.iata_code;
            }

            // Se houver nova senha, fazer hash
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            }

            // Atualizar campos fornecidos
            const updates = [];
            const params = [];

            if (email !== undefined) {
                updates.push('email = ?');
                params.push(email);
            }
            if (city !== undefined) {
                updates.push('city = ?');
                params.push(city);
                updates.push('iata_code = ?');
                params.push(iataCode);
            }
            if (hashedPassword) {
                updates.push('password = ?');
                params.push(hashedPassword);
            }

            if (updates.length === 0) {
                return res.status(400).json({ 
                    error: 'Nenhum campo para atualizar' 
                });
            }

            params.push(userId);

            await database.run(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            // Buscar usuário atualizado
            const updatedUser = await database.get(
                'SELECT id, username, email, city, iata_code FROM users WHERE id = ?',
                [userId]
            );

            res.json({
                message: 'Perfil atualizado com sucesso',
                user: updatedUser
            });

        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ 
                error: 'Erro ao atualizar perfil',
                message: error.message 
            });
        }
    }
}

module.exports = new AuthController();
