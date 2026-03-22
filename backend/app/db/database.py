import sqlite3
from app.config import settings


def conectar() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def inicializar_banco() -> None:
    conn = conectar()
    try:
        c = conn.cursor()

        c.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                email           TEXT UNIQUE NOT NULL,
                senha_hash      TEXT NOT NULL,
                nome            TEXT,
                cidade_origem   TEXT DEFAULT 'São Paulo'
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS diario (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id             INTEGER,
                id_jogo_sofascore   INTEGER,
                data_jogo           TEXT,
                match_name          TEXT,
                estadio             TEXT,
                cidade              TEXT,
                placar              TEXT,
                torneio             TEXT,
                home_logo           TEXT,
                away_logo           TEXT,
                FOREIGN KEY(user_id) REFERENCES usuarios(id)
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS clubes (
                id          INTEGER PRIMARY KEY,
                nome        TEXT,
                pais        TEXT,
                cidade      TEXT,
                estadio     TEXT,
                capacidade  INTEGER
            )
        """)

        # Migrações seguras
        for col, tipo in [("user_id", "INTEGER"), ("home_logo", "TEXT"), ("away_logo", "TEXT")]:
            try:
                c.execute(f"ALTER TABLE diario ADD COLUMN {col} {tipo}")
            except Exception:
                pass

        conn.commit()
    finally:
        conn.close()
