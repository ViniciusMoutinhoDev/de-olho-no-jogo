const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui-mudar-em-producao';

/**
 * Middleware para verificar o token JWT
 */
function authMiddleware(req, res, next) {
    try {
        // Pegar token do header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Token não fornecido',
                message: 'Você precisa estar autenticado para acessar este recurso'
            });
        }

        // Formato esperado: "Bearer TOKEN"
        const parts = authHeader.split(' ');

        if (parts.length !== 2) {
            return res.status(401).json({ 
                error: 'Formato de token inválido' 
            });
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({ 
                error: 'Token mal formatado' 
            });
        }

        // Verificar e decodificar o token
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ 
                    error: 'Token inválido ou expirado',
                    message: err.message
                });
            }

            // Adicionar informações do usuário à requisição
            req.user = {
                id: decoded.id,
                username: decoded.username
            };

            return next();
        });

    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({ 
            error: 'Erro ao verificar autenticação',
            message: error.message
        });
    }
}

/**
 * Middleware opcional - não bloqueia se não houver token
 */
function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            req.user = null;
            return next();
        }

        const parts = authHeader.split(' ');
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
            const token = parts[1];
            
            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (!err) {
                    req.user = {
                        id: decoded.id,
                        username: decoded.username
                    };
                }
                return next();
            });
        } else {
            req.user = null;
            return next();
        }

    } catch (error) {
        req.user = null;
        return next();
    }
}

module.exports = { authMiddleware, optionalAuth };