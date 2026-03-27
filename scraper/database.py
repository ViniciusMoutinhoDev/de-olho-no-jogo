import sqlite3
import pandas as pd
import os

DB_FILE = "futebol.db"

def conectar():
    return sqlite3.connect(DB_FILE)

def inicializar_banco():
    conn = conectar()
    try:
        c = conn.cursor()
        
        # 1. Tabela de Usuários (NOVA)
        c.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                senha_hash TEXT NOT NULL,
                nome TEXT,
                cidade_origem TEXT DEFAULT 'São Paulo'
            )
        """)

        # 2. Tabela Diário (Atualizada com user_id)
        c.execute("""
            CREATE TABLE IF NOT EXISTS diario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                id_jogo_sofascore INTEGER,
                data_jogo TEXT,
                match_name TEXT,
                estadio TEXT,
                cidade TEXT,
                placar TEXT,
                torneio TEXT,
                home_logo TEXT,
                away_logo TEXT,
                FOREIGN KEY(user_id) REFERENCES usuarios(id)
            )
        """)
        
        # --- MIGRAÇÕES (Corrigido: Blocos separados para evitar erro de sintaxe) ---
        try: 
            c.execute("ALTER TABLE diario ADD COLUMN user_id INTEGER")
        except: 
            pass

        try: 
            c.execute("ALTER TABLE diario ADD COLUMN home_logo TEXT")
        except: 
            pass

        try: 
            c.execute("ALTER TABLE diario ADD COLUMN away_logo TEXT")
        except: 
            pass
        
        # Tabela Clubes (Mantida)
        c.execute("""
            CREATE TABLE IF NOT EXISTS clubes (
                id INTEGER PRIMARY KEY,
                nome TEXT, pais TEXT, cidade TEXT, estadio TEXT, capacidade INTEGER
            )
        """)
        
        conn.commit()
    except Exception as e:
        print(f"Erro banco: {e}")
    finally:
        conn.close()

# --- FUNÇÕES DE USUÁRIO (NOVAS) ---
def criar_usuario(email, senha_hash, nome, cidade):
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("INSERT INTO usuarios (email, senha_hash, nome, cidade_origem) VALUES (?, ?, ?, ?)", 
                  (email, senha_hash, nome, cidade))
        conn.commit()
        return True
    except: 
        return False
    finally: 
        conn.close()

def buscar_usuario_por_email(email):
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("SELECT id, nome, senha_hash, cidade_origem FROM usuarios WHERE email = ?", (email,))
        return c.fetchone()
    finally: 
        conn.close()

# --- FUNÇÕES DO DIÁRIO (ATUALIZADAS PARA USER_ID) ---
def ler_diario(user_id):
    conn = conectar()
    try:
        # Filtra pelo usuário logado
        return pd.read_sql("SELECT * FROM diario WHERE user_id = ? ORDER BY id DESC", conn, params=(user_id,))
    except: 
        return pd.DataFrame()
    finally: 
        conn.close()

def adicionar_ao_diario(user_id, jogo):
    conn = conectar()
    try:
        c = conn.cursor()
        # Verifica se já existe PARA ESTE USUÁRIO ESPECÍFICO
        c.execute("SELECT 1 FROM diario WHERE id_jogo_sofascore = ? AND user_id = ?", (jogo['id'], user_id))
        if c.fetchone(): 
            return False # Já salvo para este usuário

        c.execute("""
            INSERT INTO diario 
            (user_id, id_jogo_sofascore, data_jogo, match_name, estadio, cidade, placar, torneio, home_logo, away_logo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, jogo['id'], jogo['data_fmt'], 
            f"{jogo.get('home')} x {jogo.get('away')}", 
            jogo['estadio'], jogo['cidade'], jogo['placar'],
            jogo.get('torneio', 'Amistoso'),
            jogo.get('home_logo', ''), jogo.get('away_logo', '')
        ))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro save: {e}")
        return False
    finally: 
        conn.close()

def remover_do_diario(user_id, id_sofascore):
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("DELETE FROM diario WHERE id_jogo_sofascore = ? AND user_id = ?", (id_sofascore, user_id))
        conn.commit()
        return True
    finally: 
        conn.close()

def verificar_jogo_no_diario(user_id, id_sofascore):
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("SELECT 1 FROM diario WHERE id_jogo_sofascore = ? AND user_id = ?", (id_sofascore, user_id))
        return c.fetchone() is not None
    finally: 
        conn.close()

# --- FUNÇÕES AUXILIARES MANTIDAS ---
def listar_todos_clubes():
    conn = conectar()
    try: 
        return pd.read_sql_query("SELECT id, nome, pais, cidade, estadio, capacidade FROM clubes", conn)
    except: 
        return pd.DataFrame()
    finally: 
        conn.close()

def consultar_estadio_por_id(id_time):
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("SELECT estadio, cidade FROM clubes WHERE id = ?", (id_time,))
        res = c.fetchone()
        if res: return {'estadio': res[0], 'cidade': res[1]}
    except: pass
    finally: conn.close()
    return None

def consultar_estadio_do_clube(nome):
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("SELECT estadio, cidade FROM clubes WHERE nome LIKE ? LIMIT 1", (f"%{nome}%",))
        res = c.fetchone()
        if res: return {'estadio': res[0], 'cidade': res[1]}
    except: pass
    finally: conn.close()
    return None

# Inicializa ao importar
inicializar_banco()