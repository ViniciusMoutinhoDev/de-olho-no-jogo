-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    city TEXT,
    iata_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Times
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    stadium TEXT,
    city TEXT,
    iata_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Jogos
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    opponent TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT NOT NULL,
    city TEXT,
    iata_code TEXT,
    competition TEXT,
    status TEXT DEFAULT 'upcoming', -- upcoming, past, live
    home_away TEXT, -- home, away
    score TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Tabela de Diário (Relacionamento User-Game)
CREATE TABLE IF NOT EXISTS user_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    watched BOOLEAN DEFAULT 0,
    saved BOOLEAN DEFAULT 1,
    notes TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Tabela de Códigos IATA (Cidades e Aeroportos)
CREATE TABLE IF NOT EXISTS iata_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT DEFAULT 'Brasil',
    iata_code TEXT NOT NULL,
    airport_name TEXT,
    latitude REAL,
    longitude REAL,
    UNIQUE(city, iata_code)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_games_team_id ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_game_id ON user_games(game_id);
CREATE INDEX IF NOT EXISTS idx_iata_city ON iata_codes(city);