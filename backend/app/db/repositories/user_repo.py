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
        c.execute("SELECT * FROM usuarios WHERE email = ?", (email,))
        row = c.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def buscar_usuario_por_id(user_id: int) -> dict | None:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,))
        row = c.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def salvar_clube_coracao(user_id: int, clube_id: int, nome: str, logo: str) -> bool:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("""
            UPDATE usuarios
            SET clube_coracao_id = ?, clube_coracao_nome = ?, clube_coracao_logo = ?
            WHERE id = ?
        """, (clube_id, nome, logo, user_id))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def remover_clube_coracao(user_id: int) -> bool:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("""
            UPDATE usuarios
            SET clube_coracao_id = NULL, clube_coracao_nome = NULL, clube_coracao_logo = NULL
            WHERE id = ?
        """, (user_id,))
        conn.commit()
        return True
    finally:
        conn.close()
