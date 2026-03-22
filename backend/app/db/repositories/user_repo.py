from app.db.database import conectar


def criar_usuario(email: str, senha_hash: str, nome: str, cidade: str) -> bool:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute(
            "INSERT INTO usuarios (email, senha_hash, nome, cidade_origem) VALUES (?, ?, ?, ?)",
            (email, senha_hash, nome, cidade)
        )
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def buscar_usuario_por_email(email: str) -> dict | None:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT id, nome, senha_hash, cidade_origem FROM usuarios WHERE email = ?",
            (email,)
        )
        row = c.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def buscar_usuario_por_id(user_id: int) -> dict | None:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT id, nome, email, cidade_origem FROM usuarios WHERE id = ?",
            (user_id,)
        )
        row = c.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()
